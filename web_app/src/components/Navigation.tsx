import React from 'react';
import { Calendar, Layers, Activity, Wrench, User } from 'lucide-react';
import { Language, TRANSLATIONS } from '../translations';

export type NavTab = 'today' | 'batches' | 'plan' | 'farm' | 'you';

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lang: Language;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  lang,
}) => {
  const t = TRANSLATIONS[lang];

  const tabs: { key: NavTab; label: string; icon: React.ReactNode }[] = [
    { key: 'today', label: t.navToday, icon: <Activity size={18} /> },
    { key: 'batches', label: t.navBatches, icon: <Layers size={18} /> },
    { key: 'plan', label: t.navPlan, icon: <Calendar size={18} /> },
    { key: 'farm', label: t.navFarm, icon: <Wrench size={18} /> },
    { key: 'you', label: t.navYou, icon: <User size={18} /> },
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
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
