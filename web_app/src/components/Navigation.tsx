import React from 'react';
import { Activity, Layers, Sprout, ClipboardList, Shield } from 'lucide-react';

export type NavTab = 'today' | 'batches' | 'station' | 'audit' | 'you';

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeBatchesCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  activeBatchesCount = 0,
}) => {
  const tabs: {
    key: NavTab;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: number;
  }[] = [
    { key: 'today', label: 'Operations Today', icon: Activity },
    {
      key: 'batches',
      label: 'Silkworm Batches',
      icon: Layers,
      badge: activeBatchesCount > 0 ? activeBatchesCount : undefined,
    },
    { key: 'station', label: 'Station & Agronomy Hub', icon: Sprout },
    { key: 'audit', label: 'Staff Audit Log', icon: ClipboardList },
    { key: 'you', label: 'Station & Security', icon: Shield },
  ];

  return (
    <nav className="nav-bar-container" aria-label="Main Navigation">
      <div className="nav-bar-inner scroll-fade-x">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onSelectTab(tab.key)}
              className={`nav-tab min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A] ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="tab-badge tabular-nums">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
