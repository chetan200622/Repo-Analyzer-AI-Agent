'use client';

// Tab navigation for repo detail page — 3 tabs: Overview, Architecture, Explore
import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, GitFork, Terminal } from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'architecture', label: 'Architecture', icon: GitFork },
  { id: 'explore', label: 'Explore', icon: Terminal },
] as const;

type TabId = typeof tabs[number]['id'];

interface RepoTabsProps {
  overviewContent: React.ReactNode;
  architectureContent: React.ReactNode;
  exploreContent: React.ReactNode;
}

export function RepoTabs({ overviewContent, architectureContent, exploreContent }: RepoTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const contentMap: Record<TabId, React.ReactNode> = {
    overview: overviewContent,
    architecture: architectureContent,
    explore: exploreContent,
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors rounded-t-lg ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {contentMap[activeTab]}
      </motion.div>
    </div>
  );
}
