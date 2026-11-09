import React, { useState, useRef } from 'react';
import { FarmProfile, Batch, CocoonHarvest, PaymentRecord, UserAccount, UserRole } from '../types';
import { KENYA_COUNTIES, USER_ROLES } from '../constants';
import { formatCurrency } from '../utils';
import {
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Download,
  Upload,
  Plus,
  Trash2,
  Check,
  Edit2,
  AlertTriangle,
} from 'lucide-react';

interface ProfileViewProps {
  profile: FarmProfile;
  currentUser: UserAccount;
  allUsers: UserAccount[];
  batches: Batch[];
  harvests: CocoonHarvest[];
  payments: PaymentRecord[];
  onUpdateProfile: (profile: FarmProfile) => void;
  onSwitchUser: (userId: string) => void;
  onCreateUser: (data: {
    username: string;
    role: UserRole;
    stationName: string;
    county: string;
    phone?: string;
    email?: string;
    pinCode?: string;
  }) => void;
  onDeleteUser: (userId: string) => boolean;
  onExportActiveUserBackup: () => void;
  onExportFullDatabaseBackup: () => void;
  onImportBackup: (jsonStr: string) => Promise<{ success: boolean; message: string }>;
  onClearActiveUserRecords: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  currentUser,
  allUsers,
  batches,
  harvests,
  payments,
  onUpdateProfile,
  onSwitchUser,
  onCreateUser,
  onDeleteUser,
  onExportActiveUserBackup,
  onImportBackup,
  onClearActiveUserRecords,
}) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Edit Profile Form
  const [editForm, setEditForm] = useState({
    managerName: profile.managerName || currentUser.username,
    role: currentUser.role,
    orgName: profile.orgName || currentUser.stationName,
    county: profile.county || currentUser.county,
    subCounty: profile.subCounty || '',
    phone: profile.phone || currentUser.phone || '',
    email: profile.email || currentUser.email || '',
    houseCount: profile.houseCount || 1,
    mulberryAcreage: profile.mulberryAcreage || 1.0,
    syncCode: profile.syncCode || '',
  });

  // Add User Form
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    role: 'commercial_reeler' as UserRole,
    stationName: '',
    county: 'Kiambu',
    phone: '',
    email: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenEdit = () => {
    setEditForm({
      managerName: profile.managerName || currentUser.username,
      role: currentUser.role,
      orgName: profile.orgName || currentUser.stationName,
      county: profile.county || currentUser.county,
      subCounty: profile.subCounty || '',
      phone: profile.phone || currentUser.phone || '',
      email: profile.email || currentUser.email || '',
      houseCount: profile.houseCount || 1,
      mulberryAcreage: profile.mulberryAcreage || 1.0,
      syncCode: profile.syncCode || '',
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      managerName: editForm.managerName.trim(),
      managerRole: editForm.role,
      orgName: editForm.orgName.trim(),
      county: editForm.county,
      subCounty: editForm.subCounty.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email.trim(),
      houseCount: Number(editForm.houseCount) || 1,
      mulberryAcreage: Number(editForm.mulberryAcreage) || 1.0,
      syncCode: editForm.syncCode.trim() || profile.syncCode,
      updatedAt: new Date().toISOString(),
    });
    setEditModalOpen(false);
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.username.trim() || !newUserForm.stationName.trim()) return;

    onCreateUser({
      username: newUserForm.username.trim(),
      role: newUserForm.role,
      stationName: newUserForm.stationName.trim(),
      county: newUserForm.county,
      phone: newUserForm.phone.trim(),
      email: newUserForm.email.trim(),
    });

    setAddUserModalOpen(false);
    setNewUserForm({
      username: '',
      role: 'commercial_reeler',
      stationName: '',
      county: 'Kiambu',
      phone: '',
      email: '',
    });
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

          <button onClick={handleOpenEdit} className="btn-secondary profile-edit-btn">
            <Edit2 size={13} style={{ marginRight: '5px' }} />
            Edit Profile
          </button>
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
            onClick={() => setAddUserModalOpen(true)}
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

                  {allUsers.length > 1 && !isActive && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete profile for "${user.username}"?`)) {
                          onDeleteUser(user.id);
                        }
                      }}
                      className="btn-icon-subtle-danger"
                      title="Delete profile"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
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

        <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-divider)' }}>
          <button
            onClick={() => {
              if (
                window.confirm(
                  `Are you sure you want to clear all batches and logs for ${currentUser.username}? Other farmer profiles will stay safe.`
                )
              ) {
                onClearActiveUserRecords();
              }
            }}
            className="btn-text-danger"
          >
            <AlertTriangle size={13} style={{ marginRight: '5px' }} />
            Clear data for {currentUser.username}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EDIT PROFILE                                                       */}
      {/* ========================================================================= */}
      {editModalOpen && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Farm Profile</h3>
              <button onClick={() => setEditModalOpen(false)} className="modal-close-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Farmer Name *</label>
                  <input
                    type="text"
                    value={editForm.managerName}
                    onChange={(e) => setEditForm({ ...editForm, managerName: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="form-control"
                  >
                    {USER_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Farm / Station Name *</label>
                  <input
                    type="text"
                    value={editForm.orgName}
                    onChange={(e) => setEditForm({ ...editForm, orgName: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">County</label>
                    <select
                      value={editForm.county}
                      onChange={(e) => setEditForm({ ...editForm, county: e.target.value })}
                      className="form-control"
                    >
                      {KENYA_COUNTIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sub-County</label>
                    <input
                      type="text"
                      value={editForm.subCounty}
                      onChange={(e) => setEditForm({ ...editForm, subCounty: e.target.value })}
                      className="form-control"
                      placeholder="e.g. Central"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="form-control"
                      placeholder="+254 7..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="form-control"
                      placeholder="farmer@kalro.org"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Rearing Houses</label>
                    <input
                      type="number"
                      min="1"
                      value={editForm.houseCount}
                      onChange={(e) => setEditForm({ ...editForm, houseCount: Number(e.target.value) })}
                      className="form-control tabular-nums"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mulberry Acres</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editForm.mulberryAcreage}
                      onChange={(e) => setEditForm({ ...editForm, mulberryAcreage: Number(e.target.value) })}
                      className="form-control tabular-nums"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Farmer / Sync Code</label>
                  <input
                    type="text"
                    value={editForm.syncCode}
                    onChange={(e) => setEditForm({ ...editForm, syncCode: e.target.value })}
                    className="form-control font-mono"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-accent">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PROFILE                                                        */}
      {/* ========================================================================= */}
      {addUserModalOpen && (
        <div className="modal-overlay" onClick={() => setAddUserModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Farmer Profile</h3>
              <button onClick={() => setAddUserModalOpen(false)} className="modal-close-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Farmer Full Name *</label>
                  <input
                    type="text"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Mary Muthoni"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="form-control"
                  >
                    {USER_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Farm / Station Name *</label>
                  <input
                    type="text"
                    value={newUserForm.stationName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, stationName: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Muthoni Sericulture Farm"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">County</label>
                    <select
                      value={newUserForm.county}
                      onChange={(e) => setNewUserForm({ ...newUserForm, county: e.target.value })}
                      className="form-control"
                    >
                      {KENYA_COUNTIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      value={newUserForm.phone}
                      onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                      className="form-control"
                      placeholder="+254 7..."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="form-control"
                    placeholder="farmer@example.com"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setAddUserModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-accent">
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
