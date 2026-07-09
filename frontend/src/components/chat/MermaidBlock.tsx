'use client';

// Renders mermaid diagram code blocks as interactive SVG diagrams
import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Code2, Eye } from 'lucide-react';

/**
 * Sanitize Mermaid code to fix common syntax issues from LLMs.
 * - Wraps labels containing parentheses in quotes: A[Foo (Bar)] -> A["Foo (Bar)"]
 * - Strips markdown code fences
 */
function sanitizeMermaidCode(raw: string): string {
  let code = raw.trim();

  // Strip markdown fences if present
  if (code.startsWith('```mermaid')) {
    code = code.replace(/^```mermaid\s*/, '').replace(/```\s*$/, '');
  } else if (code.startsWith('```')) {
    code = code.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }

  // Fix unquoted labels with parentheses: A[Foo (Bar)] -> A["Foo (Bar)"]
  code = code.replace(/\[([^\]"]*\([^)]*\)[^\]"]*)\]/g, '["$1"]');

  return code.trim();
}

export function MermaidBlock({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Inter, sans-serif',
          suppressErrorRendering: true,
        });

        const sanitized = sanitizeMermaidCode(code);
        const { svg: renderedSvg } = await mermaid.render(idRef.current, sanitized);
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to render diagram');
          setSvg('');
        }
        // Clean up any error elements mermaid injected into the DOM
        const errorElements = document.querySelectorAll('[id^="d"]');
        errorElements.forEach((el) => {
          if (el.textContent?.includes('Syntax error') || el.textContent?.includes('mermaid version')) {
            el.remove();
          }
        });
      }
    }

    render();
    return () => { cancelled = true; };
  }, [code]);

  // Clean up any stale mermaid error nodes on mount/unmount
  useEffect(() => {
    return () => {
      document.querySelectorAll('.mermaid-error, [data-mermaid-error]').forEach((el) => el.remove());
    };
  }, []);

  if (error) {
    return (
      <div className="my-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-center gap-2 text-xs text-amber-700 mb-2">
          <AlertCircle size={13} />
          <span className="font-medium">Diagram rendering failed</span>
        </div>
        <pre className="text-[11px] text-zinc-600 bg-white/60 rounded p-2 overflow-x-auto font-mono">
          {code}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-3 flex items-center justify-center h-24 rounded-lg border border-gray-200 bg-gray-50">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="my-3 rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 bg-gray-50/50">
        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Diagram</span>
        <button
          onClick={() => setShowCode(!showCode)}
          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          {showCode ? <Eye size={11} /> : <Code2 size={11} />}
          {showCode ? 'Preview' : 'Code'}
        </button>
      </div>
      {showCode ? (
        <pre className="p-3 text-[11px] text-zinc-600 bg-gray-50 overflow-x-auto font-mono">
          {code}
        </pre>
      ) : (
        <div
          ref={containerRef}
          className="p-4 overflow-x-auto flex justify-center [&_svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </div>
  );
}
