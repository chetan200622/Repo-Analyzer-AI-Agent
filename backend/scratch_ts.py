from tree_sitter_languages import get_parser, get_language

js_code = """
class User {
    constructor() { this.name = 'test'; }
    login() { return true; }
}

function hello() {
    console.log("hello");
}
"""

parser = get_parser('javascript')
tree = parser.parse(bytes(js_code, "utf8"))
language = get_language('javascript')

query = language.query("""
(class_declaration) @class
(function_declaration) @function
(method_definition) @method
""")

captures = query.captures(tree.root_node)
for node, capture_name in captures:
    print(f"[{capture_name}] lines {node.start_point[0]}-{node.end_point[0]}: {node.text.decode('utf8')[:30]}...")
