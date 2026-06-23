import ast
import logging
from typing import List
import warnings

# Suppress FutureWarning from tree_sitter_languages
warnings.filterwarnings("ignore", category=FutureWarning)

from tree_sitter_languages import get_parser, get_language

logger = logging.getLogger(__name__)

class CodeChunk:
    def __init__(self, name: str, chunk_type: str, code: str, start_line: int, end_line: int, docstring: str = None):
        self.name = name
        self.chunk_type = chunk_type
        self.code = code
        self.start_line = start_line
        self.end_line = end_line
        self.docstring = docstring

    def to_dict(self):
        return {
            "name": self.name,
            "chunk_type": self.chunk_type,
            "code": self.code,
            "start_line": self.start_line,
            "end_line": self.end_line,
            "docstring": self.docstring
        }

# Queries for semantic chunking by language
TREE_SITTER_QUERIES = {
    "javascript": """
        (class_declaration name: (identifier) @name) @class
        (function_declaration name: (identifier) @name) @function
        (method_definition name: (property_identifier) @name) @method
        (lexical_declaration (variable_declarator name: (identifier) @name value: (arrow_function))) @function
    """,
    "typescript": """
        (class_declaration name: (type_identifier) @name) @class
        (function_declaration name: (identifier) @name) @function
        (method_definition name: (property_identifier) @name) @method
        (lexical_declaration (variable_declarator name: (identifier) @name value: (arrow_function))) @function
    """,
    "go": """
        (type_declaration (type_spec name: (type_identifier) @name)) @class
        (function_declaration name: (identifier) @name) @function
        (method_declaration name: (field_identifier) @name) @method
    """,
    "rust": """
        (struct_item name: (type_identifier) @name) @class
        (impl_item type: (type_identifier) @name) @class
        (function_item name: (identifier) @name) @function
    """,
    "java": """
        (class_declaration name: (identifier) @name) @class
        (method_declaration name: (identifier) @name) @method
    """,
    "cpp": """
        (class_specifier name: (type_identifier) @name) @class
        (function_definition declarator: (function_declarator declarator: (identifier) @name)) @function
        (function_definition declarator: (function_declarator declarator: (field_identifier) @name)) @method
    """
}

class ParserService:
    
    @staticmethod
    def parse_python_file(file_path: str) -> List[CodeChunk]:
        """Parses a Python file using the built-in ast module."""
        chunks = []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                source_code = f.read()
            
            if not source_code.strip():
                return chunks
                
            tree = ast.parse(source_code)
            lines = source_code.splitlines()
            
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    start = node.lineno - 1
                    end = getattr(node, "end_lineno", len(lines))
                    code_snippet = "\n".join(lines[start:end])
                    
                    chunks.append(CodeChunk(
                        name=node.name,
                        chunk_type="class",
                        code=code_snippet,
                        start_line=start + 1,
                        end_line=end,
                        docstring=ast.get_docstring(node)
                    ))
                    
                elif isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                    start = node.lineno - 1
                    end = getattr(node, "end_lineno", len(lines))
                    code_snippet = "\n".join(lines[start:end])
                    
                    chunks.append(CodeChunk(
                        name=node.name,
                        chunk_type="function",
                        code=code_snippet,
                        start_line=start + 1,
                        end_line=end,
                        docstring=ast.get_docstring(node)
                    ))

        except Exception as e:
            logger.error(f"Error parsing {file_path}: {e}")
            
        return chunks

    @staticmethod
    def parse_generic_file(file_path: str, ts_language_name: str) -> List[CodeChunk]:
        """Parses a non-Python file using tree-sitter."""
        chunks = []
        if ts_language_name not in TREE_SITTER_QUERIES:
            # Fallback: We don't have queries defined for this language, so skip or use simple chunker.
            # We'll just return empty for now, as requested for only top languages.
            return chunks
            
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                source_code = f.read()
                
            if not source_code.strip():
                return chunks
                
            parser = get_parser(ts_language_name)
            language = get_language(ts_language_name)
            tree = parser.parse(bytes(source_code, "utf8"))
            
            query = language.query(TREE_SITTER_QUERIES[ts_language_name])
            captures = query.captures(tree.root_node)
            
            # Map of node_id -> {node, name, chunk_type}
            # Tree-sitter captures the node block and the name identifier separately.
            # We group them by looking at the parent/child relationships, but a simple heuristic 
            # is to find the block capture and use the nearest prior name capture.
            
            block_nodes = []
            current_name = "Unknown"
            
            for node, capture_name in captures:
                if capture_name == "name":
                    current_name = node.text.decode("utf8")
                else:
                    # It's a block capture (class, function, method)
                    start_line = node.start_point[0] + 1
                    end_line = node.end_point[0] + 1
                    code_snippet = node.text.decode("utf8")
                    
                    chunks.append(CodeChunk(
                        name=current_name,
                        chunk_type=capture_name,
                        code=code_snippet,
                        start_line=start_line,
                        end_line=end_line
                    ))
                    # Reset name
                    current_name = "Unknown"
            
        except Exception as e:
            logger.error(f"Tree-sitter error parsing {file_path}: {e}")
            
        return chunks

parser_service = ParserService()
