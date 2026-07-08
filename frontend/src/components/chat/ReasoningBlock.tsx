'use client';

// Collapsible reasoning block — shows AI's thinking process
import { useState } from 'react';
import { Brain, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReasoningBlockProps {
  thinking: string;
}

export function ReasoningBlock({ thinking }: ReasoningBlockProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!thinking.trim()) return null;

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all text-xs font-medium text-indigo-600 w-full text-left group"
      >
        <Brain size={13} className="shrink-0" />
        <span className="flex-1">Reasoning</span>
        {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 px-3 py-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-700/80 leading-relaxed font-mono whitespace-pre-wrap">
              {thinking}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Parse <thinking>...</thinking> tags from AI response.
 * Returns { thinking, answer } where thinking is the content inside tags
 * and answer is everything else.
 */
export function parseThinkingBlock(content: string): { thinking: string; answer: string } {
  const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
  if (thinkingMatch) {
    const thinking = thinkingMatch[1].trim();
    const answer = content.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
    return { thinking, answer };
  }
  return { thinking: '', answer: content };
}
