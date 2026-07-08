'use client';

// API Key settings modal — BYOK Gemini key stored in localStorage
import { useState, useEffect } from 'react';
import { X, Key, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface APIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function APIKeyModal({ isOpen, onClose }: APIKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('gemini_api_key') || '';
      setApiKey(stored);
      setSaved(!!stored);
      setTestResult(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setSaved(true);
    } else {
      localStorage.removeItem('gemini_api_key');
      setSaved(false);
    }
  };

  const handleRemove = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setSaved(false);
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      // Simple test: call trial status endpoint with key to verify it doesn't error
      const res = await fetch(`${API_BASE_URL}/api/trial/status`, {
        headers: { 'X-API-Key': apiKey.trim() },
      });
      if (res.ok) {
        setTestResult('success');
        // Auto-save on successful test
        localStorage.setItem('gemini_api_key', apiKey.trim());
        setSaved(true);
      } else {
        setTestResult('error');
      }
    } catch {
      setTestResult('error');
    }
    setTesting(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Key className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-900">API Key Settings</h2>
                <p className="text-[11px] text-zinc-400">Bring your own Gemini API key</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X size={18} className="text-zinc-400" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-4">
            {/* Status */}
            <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-sm ${
              saved
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              {saved ? (
                <><CheckCircle size={15} /> API key configured — using your Gemini account</>
              ) : (
                <><AlertCircle size={15} /> No API key — using free trial (limited)</>
              )}
            </div>

            {/* Input */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Gemini API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all font-mono"
              />
            </div>

            {/* Test Result */}
            {testResult === 'success' && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle size={14} /> Key is valid and saved!
              </div>
            )}
            {testResult === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle size={14} /> Key validation failed. Check your key.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleTest}
                disabled={!apiKey.trim() || testing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {testing ? <Loader2 size={14} className="animate-spin" /> : null}
                {testing ? 'Testing...' : 'Test & Save'}
              </button>
              {saved && (
                <button
                  onClick={handleRemove}
                  className="px-4 py-2.5 text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all border border-red-200"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Help */}
            <div className="pt-2 border-t border-gray-100">
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ExternalLink size={12} />
                Get a free Gemini API key from Google AI Studio
              </a>
              <p className="text-[10px] text-zinc-400 mt-1.5">
                Your key is stored only in your browser (localStorage). It&apos;s never saved on our servers.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Helper: get headers for API calls with auth context.
 * Reads API key from localStorage, or session token for trial.
 */
export function getAIHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

  if (typeof window !== 'undefined') {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    } else {
      const sessionToken = localStorage.getItem('trial_session_token');
      if (sessionToken) {
        headers['X-Session-Token'] = sessionToken;
      }
    }
  }

  return headers;
}
