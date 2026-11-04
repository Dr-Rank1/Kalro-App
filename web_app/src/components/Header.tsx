import React from 'react';
import { Moon, Sun, Globe, ShieldCheck } from 'lucide-react';
import { Language, TRANSLATIONS } from '../translations';
import { FarmProfile } from '../types';

interface HeaderProps {
  profile: FarmProfile;
  lang: Language;
  theme: 'light' | 'dark';
  activeBatchesCount: number;
  onToggleTheme: () => void;
  onToggleLang: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  lang,
  theme,
  activeBatchesCount,
  onToggleTheme,
  onToggleLang,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <header className="main-header">
      <div className="header-inner">
        <div className="brand-section">
          <img
            src="/kalro_app_icon.png"
            alt="KALRO Sericulture Logo"
            className="brand-logo"
            onError={(e) => {
              // fallback if not found
              (e.target as HTMLImageElement).src = '/favicon.png';
            }}
          />
          <div className="brand-text">
            <h1>{t.appName}</h1>
            <p>{profile.orgName} • {profile.county} County</p>
          </div>
        </div>

        <div className="header-controls">
          <div className="header-pill">
            <ShieldCheck size={14} color="#7fe3cf" />
            <span>{activeBatchesCount} {t.activeBatches}</span>
          </div>

          <button
            onClick={onToggleLang}
            className="header-btn"
            title="Switch Language (English / Kiswahili)"
          >
            <Globe size={15} style={{ marginRight: '6px' }} />
            <span>{lang === 'en' ? 'Kiswahili' : 'English'}</span>
          </button>

          <button
            onClick={onToggleTheme}
            className="header-btn"
            title={theme === 'dark' ? 'Switch to Day Mode' : 'Switch to Night Rearing Mode'}
          >
            {theme === 'dark' ? <Sun size={15} color="#FFD54F" /> : <Moon size={15} />}
            <span style={{ marginLeft: '6px' }}>
              {theme === 'dark' ? 'Day' : 'Night'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
