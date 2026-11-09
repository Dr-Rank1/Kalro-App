import React, { useState, useRef, useEffect } from 'react';
import { FarmProfile, UserAccount } from '../types';
import { USER_ROLES } from '../constants';
import { FileText, ChevronDown, Check, UserPlus, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  profile: FarmProfile;
  currentUser: UserAccount;
  allUsers: UserAccount[];
  activeBatchesCount: number;
  onOpenReportModal: () => void;
  onSwitchUser: (userId: string) => void;
  onOpenNewUserModal: () => void;
  onNavigateToProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  currentUser,
  allUsers,
  activeBatchesCount,
  onOpenReportModal,
  onSwitchUser,
  onOpenNewUserModal,
  onNavigateToProfile,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [dropdownOpen]);

  const roleMeta = USER_ROLES.find((r) => r.value === currentUser.role) || USER_ROLES[0];

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

        {/* Functional Header Actions */}
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
            <span className="hidden-sm">Export Report</span>
          </button>

          {/* Multi-Tenant Farmer Account Switcher Pill */}
          <div className="tenant-switcher-wrapper" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="tenant-user-pill"
              title={`Active Farmer: ${currentUser.username} (${roleMeta.label})`}
              aria-expanded={dropdownOpen}
            >
              <div
                className="tenant-avatar"
                style={{ backgroundColor: currentUser.avatarColor || 'var(--primary)' }}
              >
                {currentUser.avatarInitials || 'KA'}
              </div>
              <div className="tenant-user-info">
                <span className="tenant-user-name">{currentUser.username}</span>
                <span className="tenant-role-tag" style={{ borderColor: roleMeta.badgeColor, color: roleMeta.badgeColor }}>
                  {roleMeta.label.split(' ')[0]}
                </span>
              </div>
              <ChevronDown
                size={14}
                style={{
                  color: 'var(--text-muted)',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                  marginLeft: '2px',
                }}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="tenant-dropdown-menu">
                <div className="tenant-dropdown-header">
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Signed in as
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {currentUser.username} • {roleMeta.label}
                  </div>
                </div>

                <div className="tenant-dropdown-list">
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '6px 12px 4px', letterSpacing: '0.4px' }}>
                    Switch Account
                  </div>

                  {allUsers.map((user) => {
                    const isSelected = user.id === currentUser.id;
                    const uRole = USER_ROLES.find((r) => r.value === user.role) || USER_ROLES[0];
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user.id);
                          setDropdownOpen(false);
                        }}
                        className={`tenant-account-item ${isSelected ? 'active' : ''}`}
                      >
                        <div
                          className="tenant-avatar-sm"
                          style={{ backgroundColor: user.avatarColor || '#143D2B' }}
                        >
                          {user.avatarInitials}
                        </div>
                        <div className="tenant-item-details">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span className="tenant-item-name">{user.username}</span>
                            {isSelected && <Check size={14} color="var(--primary)" />}
                          </div>
                          <span className="tenant-item-sub">
                            {uRole.label} • {user.county}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="tenant-dropdown-actions">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenNewUserModal();
                    }}
                    className="tenant-action-btn"
                  >
                    <UserPlus size={14} style={{ marginRight: '6px' }} />
                    <span>Add New Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onNavigateToProfile();
                    }}
                    className="tenant-action-btn secondary"
                  >
                    View Farm Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
