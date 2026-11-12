import React from 'react';

export type NavTab = 'today' | 'batches' | 'audit' | 'you';

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
  const tabs: { key: NavTab; label: string; badge?: number }[] = [
    { key: 'today', label: 'Operations Today' },
    { key: 'batches', label: 'Silkworm Batches', badge: activeBatchesCount > 0 ? activeBatchesCount : undefined },
    { key: 'audit', label: 'Staff Audit Log' },
    { key: 'you', label: 'Station & Security' },
  ];

  return (
    <nav className="nav-bar-container">
      <div className="nav-bar-inner">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onSelectTab(tab.key)}
            className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="tab-badge tabular-nums">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};
