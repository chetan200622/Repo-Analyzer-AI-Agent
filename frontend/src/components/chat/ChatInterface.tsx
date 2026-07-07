'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Code2, Loader2, Sparkles } from 'lucide-react';
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
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export function ChatInterface({ repoId }: { repoId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m ready to answer technical questions about this repository. What would you like to know?',
    }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

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
          }
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    }
    loadHistory();
  }, [repoId]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = input.trim();
    setInput('');
    setIsGenerating(true);

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
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (parsed.token) {
                  updated[lastIdx] = { ...updated[lastIdx], content: updated[lastIdx].content + parsed.token };
                }
                if (parsed.sources) {
                  updated[lastIdx] = { ...updated[lastIdx], sources: parsed.sources, isStreaming: false };
                }
                return updated;
              });
            } catch (e) {
              console.warn("Failed to parse chunk:", line, e);
            }
          }
        }
      }
      setIsGenerating(false);
    } catch (error: any) {
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        updated[lastIdx] = { ...updated[lastIdx], content: `Error: ${error.message}. Please make sure Ollama is running.`, isStreaming: false };
        return updated;
      });
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-[700px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-800">Code Graph AI</h3>
        </div>
        {isGenerating && (
          <div className="flex items-center text-xs text-blue-600 font-medium bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Generating...
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-blue-600" />
                </div>
              )}
              
              <div className={`max-w-[80%] min-w-0 space-y-2.5 ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-md' 
                    : 'bg-gray-100 text-zinc-700 rounded-bl-md border border-gray-200'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  ) : (
                    <div className="markdown-prose text-sm">
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
                                  fontSize: '13px',
                                }}
                              />
                            ) : (
                              <code {...rest} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono text-[13px]">
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {msg.content || '...'}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-1.5">
                    {msg.sources.map((source, idx) => (
                      <div key={idx} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-[11px] font-mono text-zinc-500 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors cursor-pointer">
                        <Code2 className="w-3 h-3" />
                        <span className="truncate max-w-[180px]">{source.file_path}</span>
                        <span className="text-zinc-300">L{source.start_line}-{source.end_line}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center shrink-0 order-2 mt-1">
                  <User className="w-3.5 h-3.5 text-zinc-600" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/30">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about the codebase..."
            disabled={isGenerating}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all pr-12"
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
