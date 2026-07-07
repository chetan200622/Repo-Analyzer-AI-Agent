'use client';

// Horizontal stacked bar showing language distribution
const LANGUAGE_COLORS: Record<string, string> = {
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

interface LanguageBarProps {
  languageStats: Record<string, number>;
}

export function LanguageBar({ languageStats }: LanguageBarProps) {
  const total = Object.values(languageStats).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const sorted = Object.entries(languageStats).sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-3">
      {/* Stacked Bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
        {sorted.map(([lang, count]) => {
          const pct = (count / total) * 100;
          if (pct < 1) return null;
          return (
            <div
              key={lang}
              className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${pct}%`,
                backgroundColor: LANGUAGE_COLORS[lang] || '#9CA3AF',
              }}
              title={`${lang}: ${count} files (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {sorted.slice(0, 8).map(([lang, count]) => {
          const pct = ((count / total) * 100).toFixed(1);
          return (
            <div key={lang} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: LANGUAGE_COLORS[lang] || '#9CA3AF' }}
              />
              <span className="text-zinc-700 font-medium">{lang}</span>
              <span className="text-zinc-400">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
