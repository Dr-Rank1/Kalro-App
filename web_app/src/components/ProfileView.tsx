import React, { useRef, useState } from 'react';
import { FarmProfile, Batch, CocoonHarvest, PaymentRecord, UserAccount } from '../types';
import { USER_ROLES } from '../constants';
import { formatCurrency } from '../utils';
import {
  Phone,
  Mail,
  Download,
  Upload,
  Plus,
  Trash2,
  Check,
  Edit2,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';
import { DeleteProfileModal } from './DeleteProfileModal';

interface ProfileViewProps {
  profile: FarmProfile | null;
  currentUser: UserAccount | null;
  allUsers: UserAccount[];
  batches: Batch[];
  harvests: CocoonHarvest[];
  payments: PaymentRecord[];
  onOpenCreateProfile: () => void;
  onOpenEditProfile: () => void;
  onSwitchUser: (userId: string) => void;
  onDeleteUser: (userId: string) => boolean;
  onExportActiveUserBackup: () => void;
  onImportBackup: (jsonStr: string) => Promise<{ success: boolean; message: string }>;
  onClearActiveUserRecords: () => void;
  onRequestDeleteUser?: (user: UserAccount) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  currentUser,
  allUsers,
  batches,
  harvests,
  payments,
  onOpenCreateProfile,
  onOpenEditProfile,
  onSwitchUser,
  onDeleteUser,
  onExportActiveUserBackup,
  onImportBackup,
  onClearActiveUserRecords,
  onRequestDeleteUser,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [localUserToDelete, setLocalUserToDelete] = useState<UserAccount | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteClick = (user: UserAccount) => {
    if (onRequestDeleteUser) {
      onRequestDeleteUser(user);
    } else {
      setLocalUserToDelete(user);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      const res = await onImportBackup(content);
      setImportStatus(res.message);
      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
  };

  // Empty State: No profile yet
  if (!currentUser || !profile) {
    return (
      <div className="simple-profile-page">
        <div className="kalro-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ maxWidth: '440px', margin: '0 auto' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <UserPlus size={32} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
              No Farm Profile Yet
            </h2>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Set up your farmer and farm details to manage rearing cycles, record feed logs, and track cocoon harvests.
            </p>

            <button
              onClick={onOpenCreateProfile}
              className="btn-accent"
              style={{ padding: '0.6rem 1.4rem', fontSize: '0.9rem' }}
            >
              <UserPlus size={16} style={{ marginRight: '8px' }} />
              Create Farm Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Metrics
  const activeBatchesCount = batches.filter((b) => b.status === 'active').length;
  const totalHarvestKg = harvests.reduce((sum, h) => sum + h.totalWeightGrams, 0) / 1000.0;
  const totalRevenue = payments
    .filter((p) => p.direction === 'inflow')
    .reduce((sum, p) => sum + p.amount, 0);

  const roleMeta = USER_ROLES.find((r) => r.value === currentUser.role) || USER_ROLES[0];

  return (
    <div className="simple-profile-page">
      {/* 1. Header Card: Farmer Identity */}
      <div className="kalro-card profile-user-card">
        <div className="profile-user-main">
          <div
            className="profile-user-avatar"
            style={{ backgroundColor: currentUser.avatarColor || 'var(--primary)' }}
          >
            {currentUser.avatarInitials}
          </div>

          <div className="profile-user-info">
            <div className="profile-user-title-row">
              <h2 className="profile-user-name">{currentUser.username}</h2>
              <span
                className="profile-user-role-badge"
                style={{
                  backgroundColor: `${roleMeta.badgeColor}15`,
                  color: roleMeta.badgeColor,
                  borderColor: `${roleMeta.badgeColor}40`,
                }}
              >
                {roleMeta.label}
              </span>
            </div>

            <p className="profile-user-farm-sub">
              {profile.orgName || currentUser.stationName} • {profile.county} County
              {profile.subCounty ? `, ${profile.subCounty}` : ''}
            </p>

            <div className="profile-user-contacts">
              {currentUser.phone && (
                <span className="contact-item">
                  <Phone size={13} style={{ marginRight: '4px' }} />
                  {currentUser.phone}
                </span>
              )}
              {currentUser.email && (
                <span className="contact-item">
                  <Mail size={13} style={{ marginRight: '4px' }} />
                  {currentUser.email}
                </span>
              )}
              {profile.syncCode && (
                <span className="contact-item">
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginRight: '4px' }}>Code:</span>
                  <strong style={{ color: 'var(--primary)' }}>{profile.syncCode}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="profile-header-actions">
            <button onClick={onOpenEditProfile} className="btn-secondary profile-edit-btn">
              <Edit2 size={13} style={{ marginRight: '5px' }} />
              Edit Profile
            </button>
            <button
              onClick={() => handleDeleteClick(currentUser)}
              className="btn-danger-outline profile-delete-btn"
              title="Delete this farm profile"
            >
              <Trash2 size={13} style={{ marginRight: '5px' }} />
              Delete Profile
            </button>
          </div>
        </div>

        {/* 2. Quick Season Numbers */}
        <div className="profile-season-strip">
          <div className="season-stat-item">
            <span className="label">Active Lots</span>
            <span className="val tabular-nums">{activeBatchesCount}</span>
          </div>
          <div className="season-stat-item">
            <span className="label">Cocoons Harvested</span>
            <span className="val tabular-nums">{totalHarvestKg.toFixed(1)} kg</span>
          </div>
          <div className="season-stat-item">
            <span className="label">Silk Earnings</span>
            <span className="val tabular-nums text-success">{formatCurrency(totalRevenue)}</span>
          </div>
        </div>
      </div>

      {/* 3. Farm & Production Information */}
      <div className="kalro-card">
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Farm Details</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Your sericulture rearing facility and field capacity.
            </p>
          </div>
        </div>

        <div className="farm-info-grid">
          <div className="farm-info-row">
            <span className="info-label">Farm / Station:</span>
            <span className="info-val">{profile.orgName || currentUser.stationName}</span>
          </div>

          <div className="farm-info-row">
            <span className="info-label">Location:</span>
            <span className="info-val">
              {profile.county} County{profile.subCounty ? `, ${profile.subCounty}` : ''}
            </span>
          </div>

          <div className="farm-info-row">
            <span className="info-label">Rearing Houses:</span>
            <span className="info-val tabular-nums">
              {profile.houseCount || 1} {profile.houseCount === 1 ? 'house' : 'houses'}
            </span>
          </div>

          <div className="farm-info-row">
            <span className="info-label">Mulberry Orchard:</span>
            <span className="info-val tabular-nums">{profile.mulberryAcreage || 1.0} acres</span>
          </div>

          <div className="farm-info-row">
            <span className="info-label">Farmer / Sync Code:</span>
            <span className="info-val font-mono">{profile.syncCode}</span>
          </div>

          <div className="farm-info-row">
            <span className="info-label">Lead Operator:</span>
            <span className="info-val">{currentUser.username} ({roleMeta.label})</span>
          </div>
        </div>
      </div>

      {/* 4. Profiles on this Device */}
      <div className="kalro-card">
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Profiles on this Device</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Each farmer keeps separate batches and records on this phone or browser.
            </p>
          </div>
          <button
            onClick={onOpenCreateProfile}
            className="btn-accent"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
          >
            <Plus size={13} style={{ marginRight: '4px' }} />
            Add Profile
          </button>
        </div>

        <div className="simple-accounts-list">
          {allUsers.map((user) => {
            const isActive = user.id === currentUser.id;
            const uRole = USER_ROLES.find((r) => r.value === user.role) || USER_ROLES[0];
            return (
              <div
                key={user.id}
                className={`simple-account-row ${isActive ? 'active' : ''}`}
              >
                <div
                  className="simple-account-avatar"
                  style={{ backgroundColor: user.avatarColor || '#143D2B' }}
                >
                  {user.avatarInitials}
                </div>

                <div className="simple-account-details">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.88rem' }}>{user.username}</strong>
                    {isActive && (
                      <span className="simple-active-tag">
                        <Check size={11} style={{ marginRight: '3px' }} />
                        Active
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {uRole.label} • {user.stationName} ({user.county})
                  </span>
                </div>

                <div className="simple-account-actions">
                  {!isActive ? (
                    <button
                      onClick={() => onSwitchUser(user.id)}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                    >
                      Switch
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                      Current
                    </span>
                  )}

                  <button
                    onClick={() => handleDeleteClick(user)}
                    className="btn-icon-subtle-danger"
                    title={`Delete profile for "${user.username}"`}
                    aria-label={`Delete profile for ${user.username}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Backup & Storage */}
      <div className="kalro-card">
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Backup & Restore</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Save a copy of your batches and feeding history or restore from an earlier file.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <button onClick={onExportActiveUserBackup} className="btn-accent" style={{ flex: 1, minWidth: '180px' }}>
            <Download size={14} style={{ marginRight: '6px' }} />
            Download Backup File
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
            style={{ flex: 1, minWidth: '180px' }}
          >
            <Upload size={14} style={{ marginRight: '6px' }} />
            Restore from Backup
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            style={{ display: 'none' }}
          />
        </div>

        {importStatus && (
          <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--status-success-subtle)', border: '1px solid #BAE3CC', color: 'var(--status-success)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem' }}>
            {importStatus}
          </div>
        )}

        {/* Danger Zone: Clear Records or Delete Profile */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-divider)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Clear Records Only
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Keep {currentUser.username}'s farm profile, but wipe all rearing batches and feeding logs.
              </div>
            </div>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Are you sure you want to clear all batches and logs for ${currentUser.username}? Profile details will remain saved.`
                  )
                ) {
                  onClearActiveUserRecords();
                }
              }}
              className="btn-secondary"
              style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}
            >
              <AlertTriangle size={12} style={{ marginRight: '4px' }} />
              Clear Records
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', paddingTop: '0.85rem', borderTop: '1px dashed var(--border-divider)' }}>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--status-danger)' }}>
                Delete Farm Profile
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Permanently delete {currentUser.username} and all associated records from this device.
              </div>
            </div>
            <button
              onClick={() => handleDeleteClick(currentUser)}
              className="btn-danger"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
            >
              <Trash2 size={13} style={{ marginRight: '5px' }} />
              Delete Profile
            </button>
          </div>
        </div>
      </div>

      {/* Standalone Fallback Modal if parent does not provide onRequestDeleteUser */}
      {!onRequestDeleteUser && localUserToDelete && (
        <DeleteProfileModal
          isOpen={localUserToDelete !== null}
          user={localUserToDelete}
          profile={localUserToDelete?.id === currentUser.id ? profile : null}
          allUsers={allUsers}
          onClose={() => setLocalUserToDelete(null)}
          onConfirmDelete={(userId) => {
            onDeleteUser(userId);
            setLocalUserToDelete(null);
          }}
        />
      )}
    </div>
  );
};
