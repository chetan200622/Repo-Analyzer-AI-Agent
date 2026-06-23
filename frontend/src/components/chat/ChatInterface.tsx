'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Code2, Loader2, Sparkles } from 'lucide-react';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
      content: 'Hello! I am ready to answer technical questions about this repository. What would you like to know?',
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = input.trim();
    setInput('');
    setIsGenerating(true);

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
    };

    const newAssistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      isStreaming: true,
    };

    setMessages((prev) => [...prev, newUserMsg, newAssistantMsg]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_id: repoId, message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (!reader) throw new Error("No reader available from response");

      let done = false;
      let buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          
          // NDJSON chunk parsing
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            try {
              const parsed = JSON.parse(line);
              
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                
                if (parsed.token) {
                  updated[lastIdx] = { 
                    ...updated[lastIdx], 
                    content: updated[lastIdx].content + parsed.token 
                  };
                }
                if (parsed.sources) {
                  updated[lastIdx] = { 
                    ...updated[lastIdx], 
                    sources: parsed.sources,
                    isStreaming: false
                  };
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
        updated[lastIdx] = {
          ...updated[lastIdx],
          content: `Error: ${error.message}. Please make sure Ollama is running.`,
          isStreaming: false
        };
        return updated;
      });
      setIsGenerating(false);
    }
  };

  return (
    <SpotlightCard className="h-[700px] bg-black/40 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
      <div className="flex flex-col h-full w-full">
        {/* Chat Header */}
      <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center">
          <Sparkles className="w-5 h-5 text-emerald-400 mr-2" />
          <h3 className="text-lg font-heading text-white">Code Graph AI</h3>
        </div>
        {isGenerating && (
          <div className="flex items-center text-xs text-emerald-400 font-mono bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20">
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Generating...
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
              )}
              
              <div className={`max-w-[85%] space-y-3 ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                <div 
                  className={`p-4 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-white/10 text-white border border-white/5' 
                      : 'bg-white/5 text-zinc-300 border border-white/5 shadow-inner'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap font-light text-sm leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="markdown-prose text-sm font-light leading-relaxed">
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
                                style={vscDarkPlus as any}
                                customStyle={{
                                  margin: '1rem 0',
                                  borderRadius: '0.5rem',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  background: 'rgba(0,0,0,0.5)',
                                }}
                              />
                            ) : (
                              <code {...rest} className="bg-white/10 px-1.5 py-0.5 rounded text-emerald-300 font-mono text-[13px]">
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

                {/* Sources rendered below assistant messages if available */}
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="flex flex-wrap gap-2"
                  >
                    {msg.sources.map((source, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-zinc-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
                        <Code2 className="w-3 h-3 text-zinc-500" />
                        <span className="truncate max-w-[200px]">{source.file_path}</span>
                        <span className="text-zinc-600 bg-white/5 px-1.5 rounded">L{source.start_line}-{source.end_line}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10 order-2">
                  <User className="w-4 h-4 text-zinc-400" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about the codebase..."
            disabled={isGenerating}
            className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all pr-14"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="absolute right-2 p-2 rounded-full bg-white/10 text-white hover:bg-emerald-500/80 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
      </div>
    </SpotlightCard>
  );
}
