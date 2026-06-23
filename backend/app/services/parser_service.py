import ast
import logging
from typing import List, Dict, Any

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

class ParserService:
    
    @staticmethod
    def parse_python_file(file_path: str) -> List[CodeChunk]:
        """
        Parses a python file and returns a list of CodeChunks (Classes, Functions).
        If the file has module-level code or is small, we could also return the whole file.
        For MVP, we just extract classes and top-level functions.
        """
        chunks = []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                source_code = f.read()
            
            # Very small files or empty files
            if not source_code.strip():
                return chunks
                
            tree = ast.parse(source_code)
            lines = source_code.splitlines()
            
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    # Extract class
                    start = node.lineno - 1
                    end = getattr(node, "end_lineno", len(lines))
                    code_snippet = "\n".join(lines[start:end])
                    docstring = ast.get_docstring(node)
                    
                    chunks.append(CodeChunk(
                        name=node.name,
                        chunk_type="class",
                        code=code_snippet,
                        start_line=start + 1,
                        end_line=end,
                        docstring=docstring
                    ))
                    
                elif isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                    # Extract function
                    start = node.lineno - 1
                    end = getattr(node, "end_lineno", len(lines))
                    code_snippet = "\n".join(lines[start:end])
                    docstring = ast.get_docstring(node)
                    
                    # If it's a method, we might want to qualify the name, but for MVP just the function name is fine.
                    chunks.append(CodeChunk(
                        name=node.name,
                        chunk_type="function",
                        code=code_snippet,
                        start_line=start + 1,
                        end_line=end,
                        docstring=docstring
                    ))

        except SyntaxError as e:
            logger.warning(f"Syntax error while parsing {file_path}: {e}")
        except Exception as e:
            logger.error(f"Error parsing {file_path}: {e}")
            
        return chunks

parser_service = ParserService()
