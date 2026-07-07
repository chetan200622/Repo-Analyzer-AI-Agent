'use client';

// IDE-style 3-pane layout: File Tree | Code Viewer | Chat — all visible together
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen, Search, X, Copy, Check, MessageSquare, Code2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatInterface } from '@/components/chat/ChatInterface';

/* ─── Types ─── */
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

/* ─── Language colors + extensions → language map ─── */
const LANG_COLORS: Record<string, string> = {
  'Python': '#3B82F6', 'JavaScript': '#EAB308', 'TypeScript': '#2563EB',
  'TypeScript React': '#06B6D4', 'JavaScript React': '#F59E0B', 'Go': '#00ADD8',
  'Rust': '#DE3412', 'Java': '#F97316', 'C': '#6B7280', 'C++': '#9333EA',
  'HTML': '#EF4444', 'CSS': '#8B5CF6', 'JSON': '#6B7280', 'YAML': '#10B981',
  'Markdown': '#6B7280', 'Shell': '#22C55E', 'TOML': '#78716C',
};

const EXT_TO_LANG: Record<string, string> = {
  'py': 'python', 'js': 'javascript', 'jsx': 'jsx', 'ts': 'typescript',
  'tsx': 'tsx', 'go': 'go', 'rs': 'rust', 'java': 'java', 'c': 'c',
  'cpp': 'cpp', 'h': 'c', 'html': 'html', 'css': 'css', 'json': 'json',
  'yaml': 'yaml', 'yml': 'yaml', 'md': 'markdown', 'sh': 'bash',
  'toml': 'toml', 'sql': 'sql', 'xml': 'xml', 'env': 'bash',
  'txt': 'text', 'cfg': 'ini', 'ini': 'ini', 'dockerfile': 'dockerfile',
};

/* ─── Tree Builder ─── */
function buildTree(files: FileItem[]): TreeNode[] {
  const root: Record<string, any> = {};

  files.forEach((file) => {
    const parts = file.path.split('/');
    let current = root;
    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1;
      if (!current[part]) {
        current[part] = {
          name: part,
          path: parts.slice(0, idx + 1).join('/'),
          isFolder: !isLast,
          children: [],
          fileCount: 0,
          _childMap: {},
        };
      }
      if (isLast) {
        current[part].file = file;
        current[part].isFolder = false;
      }
      if (!isLast) current = current[part]._childMap;
    });
  });

  function process(map: Record<string, any>): TreeNode[] {
    return Object.values(map)
      .map((node: any) => {
        if (node._childMap && Object.keys(node._childMap).length > 0) {
          node.children = process(node._childMap);
          node.fileCount = node.children.reduce((s: number, c: TreeNode) => s + (c.isFolder ? c.fileCount : 1), 0);
        } else {
          node.children = [];
          if (!node.file) node.fileCount = 0;
        }
        delete node._childMap;
        return node as TreeNode;
      })
      .sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
  }

  return process(root);
}

/* ─── Tree Node Component ─── */
function TreeNodeItem({ node, depth = 0, selectedPath, onSelect }: {
  node: TreeNode; depth?: number; selectedPath: string | null; onSelect: (path: string, file: FileItem) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const paddingLeft = 8 + depth * 14;
  const isSelected = !node.isFolder && selectedPath === node.path;

  if (node.isFolder) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1 py-[3px] px-1.5 text-left hover:bg-blue-50/80 transition-colors"
          style={{ paddingLeft }}
        >
          {expanded ? <ChevronDown size={12} className="text-zinc-400 shrink-0" /> : <ChevronRight size={12} className="text-zinc-400 shrink-0" />}
          {expanded ? <FolderOpen size={14} className="text-amber-500 shrink-0" /> : <Folder size={14} className="text-amber-500 shrink-0" />}
          <span className="text-[12px] font-medium text-zinc-700 truncate">{node.name}</span>
        </button>
        {expanded && node.children.map((child) => (
          <TreeNodeItem key={child.path} node={child} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  const langColor = LANG_COLORS[node.file?.language || ''] || '#9CA3AF';

  return (
    <button
      onClick={() => node.file && onSelect(node.path, node.file)}
      className={`w-full flex items-center gap-1 py-[3px] px-1.5 text-left transition-colors ${
        isSelected ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100 text-zinc-600'
      }`}
      style={{ paddingLeft: paddingLeft + 16 }}
    >
      <FileCode size={13} className={isSelected ? 'text-blue-500 shrink-0' : 'text-zinc-400 shrink-0'} />
      <span className={`text-[12px] truncate flex-1 font-mono ${isSelected ? 'font-medium' : ''}`}>{node.name}</span>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: langColor }} />
    </button>
  );
}

/* ─── Code Viewer Panel ─── */
function CodeViewer({ filePath, githubUrl, branch }: { filePath: string | null; githubUrl: string; branch: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!filePath) { setCode(null); return; }
    setLoading(true);
    setError(null);

    // Build raw GitHub URL from repo URL
    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) { setError('Invalid GitHub URL'); setLoading(false); return; }

    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, '');
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${cleanRepo}/${branch}/${filePath}`;

    fetch(rawUrl)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(text => { setCode(text); setLoading(false); })
      .catch(err => { setError(`Could not fetch file: ${err.message}`); setLoading(false); });
  }, [filePath, githubUrl, branch]);

  const ext = filePath?.split('.').pop()?.toLowerCase() || '';
  const syntaxLang = EXT_TO_LANG[ext] || 'text';

  const handleCopy = useCallback(() => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  if (!filePath) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-400 bg-white">
        <Code2 size={32} className="mb-3 text-zinc-300" strokeWidth={1} />
        <p className="text-sm font-medium">Select a file to view</p>
        <p className="text-xs mt-1">Click any file in the explorer</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-400 bg-white">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading {filePath.split('/').pop()}...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-400 bg-white">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* File tab bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50/80 shrink-0">
        <div className="flex items-center gap-2">
          <FileCode size={13} className="text-blue-500" />
          <span className="text-[12px] font-mono font-medium text-zinc-700">{filePath}</span>
        </div>
        <button onClick={handleCopy} className="p-1 rounded hover:bg-gray-200 transition-colors" title="Copy file">
          {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} className="text-zinc-400" />}
        </button>
      </div>
      {/* Code */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <SyntaxHighlighter
          language={syntaxLang}
          style={oneLight as any}
          showLineNumbers
          lineNumberStyle={{ minWidth: '2.5em', paddingRight: '1em', color: '#D1D5DB', fontSize: '11px' }}
          customStyle={{
            margin: 0,
            padding: '0.75rem 0',
            background: '#FFFFFF',
            fontSize: '12px',
            lineHeight: '1.6',
            minHeight: '100%',
          }}
          wrapLines
        >
          {code || ''}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

/* ─── Main IDE Layout ─── */
export function IDELayout({ files, repoId, repoName, githubUrl, branch }: {
  files: FileItem[];
  repoId: string;
  repoName?: string;
  githubUrl: string;
  branch: string;
}) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredFiles = useMemo(() => {
    if (!search) return files;
    const q = search.toLowerCase();
    return files.filter(f => f.path.toLowerCase().includes(q));
  }, [files, search]);

  const tree = useMemo(() => buildTree(filteredFiles), [filteredFiles]);

  const handleSelectFile = useCallback((path: string, _file: FileItem) => {
    setSelectedPath(path);
  }, []);

  return (
    <div className="h-[750px] flex rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
      {/* Left — File Explorer */}
      <div className="w-[240px] shrink-0 border-r border-gray-200 flex flex-col bg-gray-50/30">
        <div className="px-3 py-2 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-7 pr-2 py-1 text-[11px] bg-white border border-gray-200 rounded-md text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div className="text-[10px] text-zinc-400 mt-1 px-0.5">{filteredFiles.length} files</div>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar py-0.5">
          {tree.map((node) => (
            <TreeNodeItem key={node.path} node={node} selectedPath={selectedPath} onSelect={handleSelectFile} />
          ))}
        </div>
      </div>

      {/* Center — Code Viewer */}
      <div className="flex-1 min-w-0 border-r border-gray-200">
        <CodeViewer filePath={selectedPath} githubUrl={githubUrl} branch={branch} />
      </div>

      {/* Right — Chat Panel */}
      <div className="w-[380px] shrink-0 flex flex-col">
        <ChatInterface repoId={repoId} repoName={repoName} compact />
      </div>
    </div>
  );
}
