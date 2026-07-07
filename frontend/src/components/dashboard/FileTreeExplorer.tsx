'use client';

// VS Code-style file tree explorer with folder grouping
import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen, Search } from 'lucide-react';

interface FileItem {
  id: string;
  path: string;
  language?: string;
  line_count: number;
  size_bytes: number;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
  file?: FileItem;
  fileCount: number;
}

const LANG_COLORS: Record<string, string> = {
  'Python': '#3B82F6',
  'JavaScript': '#EAB308',
  'TypeScript': '#2563EB',
  'TypeScript React': '#06B6D4',
  'JavaScript React': '#F59E0B',
  'Go': '#00ADD8',
  'Rust': '#DE3412',
  'Java': '#F97316',
  'C': '#6B7280',
  'C++': '#9333EA',
  'HTML': '#EF4444',
  'CSS': '#8B5CF6',
  'JSON': '#6B7280',
  'YAML': '#10B981',
  'Markdown': '#6B7280',
  'Shell': '#22C55E',
  'TOML': '#78716C',
};

function buildTree(files: FileItem[]): TreeNode[] {
  const root: Record<string, TreeNode> = {};

  files.forEach((file) => {
    const parts = file.path.split('/');
    let current = root;

    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1;
      const currentPath = parts.slice(0, idx + 1).join('/');

      if (!current[part]) {
        current[part] = {
          name: part,
          path: currentPath,
          isFolder: !isLast,
          children: [],
          fileCount: 0,
        };
      }

      if (isLast) {
        current[part].file = file;
        current[part].isFolder = false;
      }

      if (!isLast) {
        if (!current[part]._childMap) {
          (current[part] as any)._childMap = {};
        }
        current = (current[part] as any)._childMap;
      }
    });
  });

  function processNode(map: Record<string, any>): TreeNode[] {
    return Object.values(map)
      .map((node: any) => {
        if (node._childMap) {
          node.children = processNode(node._childMap);
          node.fileCount = node.children.reduce((sum: number, c: TreeNode) => sum + (c.isFolder ? c.fileCount : 1), 0);
          delete node._childMap;
        }
        return node as TreeNode;
      })
      .sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
  }

  return processNode(root);
}

function FileTreeNode({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const paddingLeft = 12 + depth * 16;

  if (node.isFolder) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1.5 py-1 px-2 text-left hover:bg-blue-50 transition-colors group"
          style={{ paddingLeft }}
        >
          {expanded ? (
            <ChevronDown size={14} className="text-zinc-400 shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-zinc-400 shrink-0" />
          )}
          {expanded ? (
            <FolderOpen size={15} className="text-amber-500 shrink-0" />
          ) : (
            <Folder size={15} className="text-amber-500 shrink-0" />
          )}
          <span className="text-[13px] font-medium text-zinc-700 truncate">{node.name}</span>
          <span className="text-[10px] text-zinc-400 ml-auto pr-2">{node.fileCount}</span>
        </button>
        {expanded && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode key={child.path} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const langColor = LANG_COLORS[node.file?.language || ''] || '#9CA3AF';

  return (
    <div
      className="flex items-center gap-1.5 py-1 px-2 hover:bg-blue-50 transition-colors cursor-pointer group"
      style={{ paddingLeft: paddingLeft + 18 }}
    >
      <FileCode size={14} className="text-zinc-400 shrink-0" />
      <span className="text-[13px] text-zinc-600 group-hover:text-zinc-900 truncate flex-1 font-mono">
        {node.name}
      </span>
      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: langColor }}
        />
        <span className="text-[10px] text-zinc-400 w-12 text-right">
          {node.file?.line_count?.toLocaleString()} L
        </span>
      </div>
    </div>
  );
}

export function FileTreeExplorer({ files }: { files: FileItem[] }) {
  const [search, setSearch] = useState('');

  const filteredFiles = useMemo(() => {
    if (!search) return files;
    const q = search.toLowerCase();
    return files.filter(f => f.path.toLowerCase().includes(q));
  }, [files, search]);

  const tree = useMemo(() => buildTree(filteredFiles), [filteredFiles]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Search Bar */}
      <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50/50">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
          />
        </div>
        <div className="text-[10px] text-zinc-400 mt-1.5 px-1">
          {filteredFiles.length} files {search && `matching "${search}"`}
        </div>
      </div>

      {/* File Tree */}
      <div className="max-h-[650px] overflow-auto custom-scrollbar py-1">
        {tree.length > 0 ? (
          tree.map((node) => (
            <FileTreeNode key={node.path} node={node} />
          ))
        ) : (
          <div className="px-4 py-8 text-center text-sm text-zinc-400">
            No files found.
          </div>
        )}
      </div>
    </div>
  );
}
