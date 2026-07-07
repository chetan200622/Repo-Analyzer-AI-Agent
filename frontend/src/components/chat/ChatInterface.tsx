'use client';

// Enhanced chat interface with thinking indicator, intent badges, and follow-up suggestions
import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Code2, Loader2, Sparkles, Brain, FileCode, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatSource {
  file_path: string;
  start_line: number;
  end_line: number;
  symbol_name?: string;
  code: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  isStreaming?: boolean;
  intent?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

const QUICK_ACTIONS = [
  "What does this project do?",
  "Explain the architecture",
  "What tech stack is used?",
  "How is authentication implemented?",
  "Show me the main entry point",
  "What can be improved?",
];

const INTENT_LABELS: Record<string, { label: string; color: string }> = {
  UNDERSTANDING: { label: '🧠 Understanding', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  ARCHITECTURE: { label: '🏗️ Architecture', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  CODE_EXPLANATION: { label: '📖 Code Analysis', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  BUG_FINDING: { label: '🐛 Debug', color: 'bg-red-50 text-red-600 border-red-200' },
  NAVIGATION: { label: '🔍 Navigation', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  LEARNING: { label: '📚 Learning', color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  REFACTORING: { label: '🔧 Refactoring', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  GENERAL: { label: '💬 Chat', color: 'bg-gray-50 text-gray-600 border-gray-200' },
};

export function ChatInterface({ repoId, repoName }: { repoId: string; repoName?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/repositories/${repoId}/chat/history`);
        if (response.ok) {
          const history = await response.json();
          if (history && history.length > 0) {
            setMessages(history.map((h: any) => ({
              id: h.id, role: h.role, content: h.content, sources: h.sources
            })));
            setShowQuickActions(false);
          }
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    }
    loadHistory();
  }, [repoId]);

  const handleSend = async (messageOverride?: string) => {
    const userMessage = (messageOverride || input).trim();
    if (!userMessage || isGenerating) return;

    setInput('');
    setIsGenerating(true);
    setIsThinking(true);
    setShowQuickActions(false);

    const newUserMsg: Message = { id: crypto.randomUUID(), role: 'user', content: userMessage };
    const newAssistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '', isStreaming: true };

    setMessages((prev) => [...prev, newUserMsg, newAssistantMsg]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_id: repoId, message: userMessage }),
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) throw new Error("No reader available");

      let done = false;
      let buffer = '';
      let gotFirstToken = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.trim() === '') continue;
            try {
              const parsed = JSON.parse(line);
              
              // Capture intent
              if (parsed.intent) {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...updated[updated.length - 1], intent: parsed.intent };
                  return updated;
                });
              }
              
              if (parsed.token) {
                if (!gotFirstToken) {
                  gotFirstToken = true;
                  setIsThinking(false);
                }
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  updated[lastIdx] = { ...updated[lastIdx], content: updated[lastIdx].content + parsed.token };
                  return updated;
                });
              }
              if (parsed.sources) {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...updated[updated.length - 1], sources: parsed.sources, isStreaming: false };
                  return updated;
                });
              }
            } catch {
              // skip unparseable lines
            }
          }
        }
      }
      setIsGenerating(false);
      setIsThinking(false);
    } catch (error: any) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: `Error: ${error.message}. Make sure the backend and Ollama are running.`, isStreaming: false };
        return updated;
      });
      setIsGenerating(false);
      setIsThinking(false);
    }
  };

  return (
    <div className="h-[750px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-800">Code Intelligence</h3>
            <p className="text-[10px] text-zinc-400">{repoName ? `Analyzing ${repoName}` : 'Ask anything about the codebase'}</p>
          </div>
        </div>
        {isThinking && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center text-xs text-indigo-600 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
          >
            <Brain className="w-3.5 h-3.5 mr-1.5 animate-pulse" /> Reasoning...
          </motion.div>
        )}
        {isGenerating && !isThinking && (
          <div className="flex items-center text-xs text-blue-600 font-medium bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Writing...
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-5 custom-scrollbar">
        {/* Quick Actions — shown when no messages */}
        {showQuickActions && messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-5">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-zinc-800 mb-1">Ask me anything about this repo</h3>
            <p className="text-sm text-zinc-400 mb-6">I&apos;ve analyzed the entire codebase and I&apos;m ready to help.</p>
            <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => handleSend(action)}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-sm text-zinc-600 hover:text-blue-700 transition-all text-left group"
                >
                  <ChevronRight size={14} className="text-zinc-300 group-hover:text-blue-500 shrink-0 transition-colors" />
                  <span className="truncate">{action}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              
              <div className={`max-w-[85%] min-w-0 space-y-2 ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                {/* Intent badge for assistant messages */}
                {msg.role === 'assistant' && msg.intent && INTENT_LABELS[msg.intent] && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${INTENT_LABELS[msg.intent].color}`}>
                    {INTENT_LABELS[msg.intent].label}
                  </span>
                )}

                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-md' 
                    : 'bg-gray-50 text-zinc-700 rounded-bl-md border border-gray-200'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  ) : (
                    <div className="markdown-prose text-sm">
                      {msg.isStreaming && !msg.content && isThinking ? (
                        <div className="flex items-center gap-2 text-zinc-400 py-1">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                          </div>
                          <span className="text-xs">Analyzing codebase...</span>
                        </div>
                      ) : (
                        <ReactMarkdown
                          components={{
                            code(props) {
                              const {children, className, node, ref, ...rest} = props as any;
                              const match = /language-(\w+)/.exec(className || '')
                              return match ? (
                                <SyntaxHighlighter
                                  {...rest}
                                  PreTag="div"
                                  children={String(children).replace(/\n$/, '')}
                                  language={match[1]}
                                  style={oneLight as any}
                                  customStyle={{
                                    margin: '0.75rem 0',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #E5E7EB',
                                    background: '#F9FAFB',
                                    maxWidth: '100%',
                                    overflowX: 'auto',
                                    fontSize: '12px',
                                    lineHeight: '1.6',
                                  }}
                                />
                              ) : (
                                <code {...rest} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono text-[12px]">
                                  {children}
                                </code>
                              )
                            },
                            h1: ({children}) => <h1 className="text-base font-bold text-zinc-900 mt-4 mb-2">{children}</h1>,
                            h2: ({children}) => <h2 className="text-sm font-bold text-zinc-800 mt-3 mb-1.5">{children}</h2>,
                            h3: ({children}) => <h3 className="text-sm font-semibold text-zinc-700 mt-2 mb-1">{children}</h3>,
                            p: ({children}) => <p className="mb-2.5 leading-relaxed text-zinc-700">{children}</p>,
                            ul: ({children}) => <ul className="pl-4 mb-2.5 space-y-1 list-disc marker:text-zinc-400">{children}</ul>,
                            ol: ({children}) => <ol className="pl-4 mb-2.5 space-y-1 list-decimal marker:text-zinc-400">{children}</ol>,
                            li: ({children}) => <li className="text-zinc-700 text-sm">{children}</li>,
                            strong: ({children}) => <strong className="font-semibold text-zinc-900">{children}</strong>,
                            blockquote: ({children}) => <blockquote className="border-l-2 border-blue-300 pl-3 my-2 text-zinc-600 italic">{children}</blockquote>,
                          }}
                        >
                          {msg.content || ''}
                        </ReactMarkdown>
                      )}
                    </div>
                  )}
                </div>

                {/* Source files */}
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-1.5">
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider px-1">Referenced Files</span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((source, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-mono text-zinc-500 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all cursor-pointer group">
                          <FileCode className="w-3 h-3 text-zinc-400 group-hover:text-blue-500" />
                          <span className="truncate max-w-[200px]">{source.file_path.split('/').pop()}</span>
                          <span className="text-zinc-300 group-hover:text-blue-400">:{source.start_line}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-zinc-200 flex items-center justify-center shrink-0 order-2 mt-1">
                  <User className="w-3.5 h-3.5 text-zinc-600" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/30 shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about the codebase..."
            disabled={isGenerating}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all pr-12 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="absolute right-1.5 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
