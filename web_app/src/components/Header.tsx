import React from 'react';
import { FarmProfile } from '../types';
import { FileText } from 'lucide-react';

interface HeaderProps {
  profile: FarmProfile;
  activeBatchesCount: number;
  onOpenReportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeBatchesCount,
  onOpenReportModal,
}) => {
  return (
    <header className="main-header">
      <div className="header-inner">
        {/* Brand Section */}
        <div className="brand-section">
          <div className="brand-logo-container">
            <img
              src="/kalro_app_icon.png"
              alt="KALRO Logo"
              className="brand-logo"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="brand-text">
            <h1>KALRO Sericulture</h1>
            <p className="truncate">
              {profile.orgName} • {profile.county} County
            </p>
          </div>
        </div>

        {/* Functional Header Actions - Clean, purposeful tools */}
        <div className="header-controls">
          {activeBatchesCount > 0 && (
            <div className="header-batch-pill" title="Batches currently in active rearing">
              <span className="tabular-nums font-bold">{activeBatchesCount}</span>
              <span style={{ marginLeft: '5px' }}>Active {activeBatchesCount === 1 ? 'Lot' : 'Lots'}</span>
            </div>
          )}

          <button
            onClick={onOpenReportModal}
            className="btn-header-secondary"
            title="Generate and export official station PDF report"
          >
            <FileText size={14} style={{ marginRight: '6px' }} />
            <span>Export Report (PDF)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
