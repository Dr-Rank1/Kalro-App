import React, { useState, useRef } from 'react';
import { FarmProfile, Batch, CocoonHarvest, PaymentRecord, UserAccount, UserRole } from '../types';
import { KENYA_COUNTIES, USER_ROLES } from '../constants';
import { formatCurrency } from '../utils';
import {
  User,
  ShieldCheck,
  Building,
  Sprout,
  Users,
  Database,
  Download,
  Upload,
  Trash2,
  Plus,
  CheckCircle2,
  Lock,
  Phone,
  Mail,
  MapPin,
  Compass,
  Award,
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
  onExportFullDatabaseBackup,
  onImportBackup,
  onClearActiveUserRecords,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'identity' | 'agronomy' | 'accounts' | 'database'>('identity');
  const [editing, setEditing] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);

  // Form State for editing active profile
  const [formData, setFormData] = useState<FarmProfile>({ ...profile });

  // Form State for creating new farmer profile
  const [newUserData, setNewUserData] = useState({
    username: '',
    role: 'commercial_reeler' as UserRole,
    stationName: '',
    county: 'Kiambu',
    phone: '',
    email: '',
    pinCode: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...formData,
      managerRole: formData.managerRole || currentUser.role,
      updatedAt: new Date().toISOString(),
    });
    setEditing(false);
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.username.trim() || !newUserData.stationName.trim()) return;

    onCreateUser({
      username: newUserData.username.trim(),
      role: newUserData.role,
      stationName: newUserData.stationName.trim(),
      county: newUserData.county,
      phone: newUserData.phone.trim(),
      email: newUserData.email.trim(),
      pinCode: newUserData.pinCode.trim() || undefined,
    });

    setNewUserModalOpen(false);
    setNewUserData({
      username: '',
      role: 'commercial_reeler',
      stationName: '',
      county: 'Kiambu',
      phone: '',
      email: '',
      pinCode: '',
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
      setTimeout(() => setImportStatus(null), 6000);
    };
    reader.readAsText(file);
  };

  // Lifetime metrics for active user tenant
  const totalHarvestWeightKg =
    harvests.reduce((sum, h) => sum + h.totalWeightGrams, 0) / 1000.0;
  const totalCocoonCount = harvests.reduce((sum, h) => sum + h.cocoonCount, 0);
  const totalRevenue = payments
    .filter((p) => p.direction === 'inflow')
    .reduce((sum, p) => sum + p.amount, 0);

  const currentRoleMeta = USER_ROLES.find((r) => r.value === currentUser.role) || USER_ROLES[0];

  return (
    <div className="profile-container">
      {/* Farmer Profile Hero Banner */}
      <div className="farmer-hero-card">
        <div className="farmer-hero-main">
          <div
            className="farmer-hero-avatar"
            style={{ backgroundColor: currentUser.avatarColor || 'var(--primary)' }}
          >
            {currentUser.avatarInitials}
          </div>
          <div className="farmer-hero-details">
            <div className="farmer-hero-badge-row">
              <span
                className="farmer-role-badge"
                style={{
                  backgroundColor: '#ffffff',
                  color: currentRoleMeta.badgeColor || 'var(--primary)',
                  fontWeight: 700,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                }}
              >
                {currentRoleMeta.label}
              </span>
              <span className="farmer-accreditation-badge">
                <Award size={12} style={{ marginRight: '4px' }} />
                {profile.accreditationLevel || 'Commercial Producer'}
              </span>
              <span className="farmer-offline-badge">
                <ShieldCheck size={12} style={{ marginRight: '4px' }} />
                Offline Multi-Tenant DB
              </span>
            </div>
            <h2 className="farmer-hero-name">{currentUser.username}</h2>
            <p className="farmer-hero-station">
              {profile.orgName} • {profile.county} County
              {profile.subCounty ? `, ${profile.subCounty}` : ''}
            </p>
            <div className="farmer-hero-meta-row">
              <span className="farmer-meta-tag">
                <Lock size={12} style={{ marginRight: '4px' }} />
                Code: <strong>{profile.syncCode}</strong>
              </span>
              {currentUser.phone && (
                <span className="farmer-meta-tag">
                  <Phone size={12} style={{ marginRight: '4px' }} />
                  {currentUser.phone}
                </span>
              )}
              {currentUser.email && (
                <span className="farmer-meta-tag">
                  <Mail size={12} style={{ marginRight: '4px' }} />
                  {currentUser.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick lifetime statistics for active user */}
        <div className="farmer-stats-strip">
          <div className="stat-pill">
            <span className="stat-label">Active Batches</span>
            <span className="stat-value tabular-nums font-bold">
              {batches.filter((b) => b.status === 'active').length}
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Green Cocoons</span>
            <span className="stat-value tabular-nums font-bold">
              {totalHarvestWeightKg.toFixed(1)} kg
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value tabular-nums font-bold text-success">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Device Operators</span>
            <span className="stat-value tabular-nums font-bold">
              {allUsers.length} Profiles
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="profile-tab-bar">
        <button
          onClick={() => setActiveSubTab('identity')}
          className={`profile-tab-btn ${activeSubTab === 'identity' ? 'active' : ''}`}
        >
          <User size={15} style={{ marginRight: '6px' }} />
          Farmer & Credentials
        </button>
        <button
          onClick={() => setActiveSubTab('agronomy')}
          className={`profile-tab-btn ${activeSubTab === 'agronomy' ? 'active' : ''}`}
        >
          <Sprout size={15} style={{ marginRight: '6px' }} />
          Agronomy & Facilities
        </button>
        <button
          onClick={() => setActiveSubTab('accounts')}
          className={`profile-tab-btn ${activeSubTab === 'accounts' ? 'active' : ''}`}
        >
          <Users size={15} style={{ marginRight: '6px' }} />
          Operator Accounts ({allUsers.length})
        </button>
        <button
          onClick={() => setActiveSubTab('database')}
          className={`profile-tab-btn ${activeSubTab === 'database' ? 'active' : ''}`}
        >
          <Database size={15} style={{ marginRight: '6px' }} />
          Offline Database
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: IDENTITY & ACCREDITATION                                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'identity' && (
        <div className="kalro-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Official Farmer & Station Identity</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Accreditation credentials and contact points for KALRO advisory services.
              </p>
            </div>
            {!editing ? (
              <button
                onClick={() => {
                  setFormData({ ...profile });
                  setEditing(true);
                }}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              >
                Edit Information
              </button>
            ) : (
              <button
                onClick={() => setEditing(false)}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              >
                Cancel
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSaveProfile} style={{ marginTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Farmer / Manager Full Name</label>
                  <input
                    type="text"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Station / Enterprise Name</label>
                  <input
                    type="text"
                    value={formData.orgName}
                    onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">County</label>
                  <select
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
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
                    value={formData.subCounty || ''}
                    onChange={(e) => setFormData({ ...formData, subCounty: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Thika West"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ward</label>
                  <input
                    type="text"
                    value={formData.ward || ''}
                    onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Township Ward"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">National ID / Passport Number</label>
                  <input
                    type="text"
                    value={formData.nationalId || ''}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    className="form-control"
                    placeholder="e.g. 28475912"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Contact</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="form-control"
                    placeholder="+254 7..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Official Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-control"
                    placeholder="farmer@kalro.org"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Accreditation Tier</label>
                  <select
                    value={formData.accreditationLevel || 'Commercial Producer'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accreditationLevel: e.target.value as any,
                      })
                    }
                    className="form-control"
                  >
                    <option value="Commercial Producer">Commercial Producer</option>
                    <option value="Research Station">Research Station</option>
                    <option value="Master Seed Lot">Master Seed Lot / Grainage</option>
                    <option value="Smallholder Cluster">Smallholder Cluster Lead</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">KALRO Network Sync Code</label>
                  <input
                    type="text"
                    value={formData.syncCode}
                    onChange={(e) => setFormData({ ...formData, syncCode: e.target.value })}
                    className="form-control font-mono"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-accent">
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details-grid">
              <div className="profile-detail-item">
                <span className="profile-detail-label">Lead Operator / Farmer:</span>
                <span className="profile-detail-value">{profile.managerName || currentUser.username}</span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Station / Enterprise:</span>
                <span className="profile-detail-value">{profile.orgName}</span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Administrative Region:</span>
                <span className="profile-detail-value">
                  {profile.county} County
                  {profile.subCounty ? `, ${profile.subCounty}` : ''}
                  {profile.ward ? ` (${profile.ward})` : ''}
                </span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">National ID:</span>
                <span className="profile-detail-value">{profile.nationalId || 'Verified On File'}</span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Direct Phone:</span>
                <span className="profile-detail-value">{profile.phone || currentUser.phone || 'Not Specified'}</span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Official Email:</span>
                <span className="profile-detail-value">{profile.email || currentUser.email || 'Not Specified'}</span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Accreditation Tier:</span>
                <span className="profile-detail-value">{profile.accreditationLevel || 'Commercial Producer'}</span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">KALRO Network Sync ID:</span>
                <span className="profile-detail-value font-mono font-bold" style={{ color: 'var(--primary)' }}>
                  {profile.syncCode}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: AGRONOMY & FACILITY SPECIFICATIONS                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'agronomy' && (
        <div className="kalro-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Rearing Facility & Agronomy Specifications</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Mulberry acreage, rearing houses, bay capacity, and target market.
              </p>
            </div>
            {!editing ? (
              <button
                onClick={() => {
                  setFormData({ ...profile });
                  setEditing(true);
                }}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              >
                Edit Specs
              </button>
            ) : (
              <button
                onClick={() => setEditing(false)}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              >
                Cancel
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSaveProfile} style={{ marginTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Rearing Houses</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.houseCount}
                    onChange={(e) => setFormData({ ...formData, houseCount: Number(e.target.value) })}
                    className="form-control tabular-nums"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Isolated Rearing Bays</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.rearingBaysCount || 4}
                    onChange={(e) => setFormData({ ...formData, rearingBaysCount: Number(e.target.value) })}
                    className="form-control tabular-nums"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Total Rearing Tray Capacity (Trays)</label>
                  <input
                    type="number"
                    min="5"
                    value={formData.maxTrayCapacity || 40}
                    onChange={(e) => setFormData({ ...formData, maxTrayCapacity: Number(e.target.value) })}
                    className="form-control tabular-nums"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Altitude (Meters Above Sea Level)</label>
                  <input
                    type="number"
                    min="500"
                    max="3000"
                    value={formData.altitudeMeters || 1600}
                    onChange={(e) => setFormData({ ...formData, altitudeMeters: Number(e.target.value) })}
                    className="form-control tabular-nums"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mulberry Orchard Acreage (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.mulberryAcreage || 1.0}
                    onChange={(e) => setFormData({ ...formData, mulberryAcreage: Number(e.target.value) })}
                    className="form-control tabular-nums"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Castor Plantation Acreage (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.castorAcreage || 0.5}
                    onChange={(e) => setFormData({ ...formData, castorAcreage: Number(e.target.value) })}
                    className="form-control tabular-nums"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mature Kesseru / Som Trees Count</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.kesseruTreesCount || 0}
                    onChange={(e) => setFormData({ ...formData, kesseruTreesCount: Number(e.target.value) })}
                    className="form-control tabular-nums"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Target Market</label>
                  <input
                    type="text"
                    value={formData.targetMarket || ''}
                    onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                    className="form-control"
                    placeholder="e.g. KALRO Machakos Reeling Unit & Thika Silk Mills"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-accent">
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="agronomy-spec-grid">
              <div className="spec-card">
                <Building size={20} color="var(--primary)" />
                <div className="spec-meta">
                  <span className="spec-value tabular-nums">{profile.houseCount} Houses</span>
                  <span className="spec-label">{profile.rearingBaysCount || 4} Disinfected Bays</span>
                </div>
              </div>

              <div className="spec-card">
                <Compass size={20} color="var(--primary)" />
                <div className="spec-meta">
                  <span className="spec-value tabular-nums">{profile.maxTrayCapacity || 40} Trays</span>
                  <span className="spec-label">Max Batch Capacity</span>
                </div>
              </div>

              <div className="spec-card">
                <Sprout size={20} color="var(--primary)" />
                <div className="spec-meta">
                  <span className="spec-value tabular-nums">{profile.mulberryAcreage || 1.5} Acres</span>
                  <span className="spec-label">Mulberry (Kanva-2, S36)</span>
                </div>
              </div>

              <div className="spec-card">
                <MapPin size={20} color="var(--primary)" />
                <div className="spec-meta">
                  <span className="spec-value tabular-nums">{profile.altitudeMeters || 1620} m</span>
                  <span className="spec-label">Station Altitude</span>
                </div>
              </div>

              <div className="spec-card">
                <Sprout size={20} color="#E65100" />
                <div className="spec-meta">
                  <span className="spec-value tabular-nums">{profile.castorAcreage || 0.5} Acres</span>
                  <span className="spec-label">Castor / Eri Forage</span>
                </div>
              </div>

              <div className="spec-card">
                <Award size={20} color="var(--status-success)" />
                <div className="spec-meta">
                  <span className="spec-value truncate" style={{ fontSize: '0.85rem' }}>
                    {profile.targetMarket || 'KALRO Reeling Units'}
                  </span>
                  <span className="spec-label">Market Destination</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: MULTI-FARMER ACCOUNT MANAGER                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'accounts' && (
        <div className="kalro-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Registered Farmer Profiles ({allUsers.length})</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Each farmer operates with 100% data isolation. Batches, feed logs, and revenue remain strictly private.
              </p>
            </div>
            <button
              onClick={() => setNewUserModalOpen(true)}
              className="btn-accent"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
            >
              <Plus size={14} style={{ marginRight: '6px' }} />
              Register New Farmer Profile
            </button>
          </div>

          <div className="farmer-accounts-grid">
            {allUsers.map((user) => {
              const isActive = user.id === currentUser.id;
              const roleMeta = USER_ROLES.find((r) => r.value === user.role) || USER_ROLES[0];
              return (
                <div
                  key={user.id}
                  className={`farmer-account-card ${isActive ? 'active-tenant' : ''}`}
                >
                  <div className="farmer-account-card-header">
                    <div
                      className="farmer-account-card-avatar"
                      style={{ backgroundColor: user.avatarColor || '#1B5E20' }}
                    >
                      {user.avatarInitials}
                    </div>
                    <div className="farmer-account-card-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h4 className="farmer-account-card-name">{user.username}</h4>
                        {isActive && (
                          <span className="farmer-active-badge">
                            <CheckCircle2 size={12} style={{ marginRight: '3px' }} />
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span
                        className="farmer-account-role-label"
                        style={{ color: roleMeta.badgeColor }}
                      >
                        {roleMeta.label}
                      </span>
                    </div>
                  </div>

                  <div className="farmer-account-card-body">
                    <div className="card-spec-row">
                      <span className="label">Station:</span>
                      <span className="val truncate">{user.stationName}</span>
                    </div>
                    <div className="card-spec-row">
                      <span className="label">County:</span>
                      <span className="val">{user.county}</span>
                    </div>
                    {user.phone && (
                      <div className="card-spec-row">
                        <span className="label">Phone:</span>
                        <span className="val">{user.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="farmer-account-card-actions">
                    {!isActive ? (
                      <button
                        onClick={() => onSwitchUser(user.id)}
                        className="btn-accent"
                        style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem' }}
                      >
                        Switch To This Account
                      </button>
                    ) : (
                      <span
                        style={{
                          flex: 1,
                          fontSize: '0.75rem',
                          color: 'var(--primary)',
                          fontWeight: 700,
                          textAlign: 'center',
                          padding: '0.35rem',
                        }}
                      >
                        Currently Active Session
                      </span>
                    )}

                    {allUsers.length > 1 && !isActive && (
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Are you sure you want to permanently delete profile "${user.username}" and all of their isolated rearing records?`
                            )
                          ) {
                            onDeleteUser(user.id);
                          }
                        }}
                        className="btn-icon-danger"
                        title="Delete Profile"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: OFFLINE MULTI-TENANT DATABASE ADMINISTRATION                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'database' && (
        <div className="kalro-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Option 3: Local Multi-Tenant Database Architecture</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                100% Offline • Zero Server Cost • Hardware-level browser persistence via IndexedDB & LocalStorage.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="db-status-pill online">
                <span className="dot"></span>
                IndexedDB Active
              </span>
            </div>
          </div>

          <div className="db-info-box">
            <div className="db-info-item">
              <strong>Active Tenant:</strong> {currentUser.username} ({currentUser.id})
            </div>
            <div className="db-info-item">
              <strong>Data Isolation:</strong> All batches, feeding logs, forage inventory, and payments are strictly namespaced under <code>kalro_u_{currentUser.id}_*</code>.
            </div>
            <div className="db-info-item">
              <strong>Cryptographic Integrity:</strong> Backups are signed with SHA-256 hashes to guarantee data authenticity during offline station audits.
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Active User Backup */}
            <div className="db-action-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                <Download size={18} color="var(--primary)" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Single-Farmer Export</h4>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Export a signed JSON file containing ONLY {currentUser.username}'s lots, feed logs, and records.
              </p>
              <button
                onClick={onExportActiveUserBackup}
                className="btn-accent"
                style={{ width: '100%', fontSize: '0.78rem', padding: '0.45rem' }}
              >
                Export Farmer Backup (JSON)
              </button>
            </div>

            {/* Full Multi-Tenant Database Backup */}
            <div className="db-action-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                <Download size={18} color="var(--accent-gold)" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Full Station Multi-Tenant Export</h4>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Export all {allUsers.length} farmer accounts and their complete partitioned histories in one file.
              </p>
              <button
                onClick={onExportFullDatabaseBackup}
                className="btn-secondary"
                style={{ width: '100%', fontSize: '0.78rem', padding: '0.45rem' }}
              >
                Export Full Database (JSON)
              </button>
            </div>

            {/* Restore Database */}
            <div className="db-action-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                <Upload size={18} color="var(--primary)" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Restore From Signed Backup</h4>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Import and verify a KALRO backup file. Automatically detects single-user or multi-tenant formats.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
                style={{ width: '100%', fontSize: '0.78rem', padding: '0.45rem' }}
              >
                Select Backup File (.json)
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {importStatus && (
            <div className="db-status-alert">
              {importStatus}
            </div>
          )}

          {/* Purge Records */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-divider)' }}>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Are you sure you want to permanently clear all rearing batches, feeding logs, and financial records for "${currentUser.username}"? Other farmer accounts will NOT be affected.`
                  )
                ) {
                  onClearActiveUserRecords();
                }
              }}
              className="btn-purge"
            >
              <Trash2 size={13} style={{ marginRight: '6px' }} />
              Purge Records For Active Farmer Only ({currentUser.username})
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTER NEW FARMER PROFILE                                        */}
      {/* ========================================================================= */}
      {newUserModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Register New Farmer Profile</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Creates an independent, isolated local database partition.
                </p>
              </div>
              <button onClick={() => setNewUserModalOpen(false)} className="modal-close-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Farmer / Operator Full Name *</label>
                  <input
                    type="text"
                    value={newUserData.username}
                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Mary Muthoni"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Sericulture Role</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                    className="form-control"
                  >
                    {USER_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Farm / Station Enterprise Name *</label>
                  <input
                    type="text"
                    value={newUserData.stationName}
                    onChange={(e) => setNewUserData({ ...newUserData, stationName: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Muthoni Sericulture Farm"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">County</label>
                    <select
                      value={newUserData.county}
                      onChange={(e) => setNewUserData({ ...newUserData, county: e.target.value })}
                      className="form-control"
                    >
                      {KENYA_COUNTIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Contact</label>
                    <input
                      type="text"
                      value={newUserData.phone}
                      onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                      className="form-control"
                      placeholder="+254 7..."
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Email (Optional)</label>
                    <input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      className="form-control"
                      placeholder="mary@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Security PIN (Optional)</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={newUserData.pinCode}
                      onChange={(e) => setNewUserData({ ...newUserData, pinCode: e.target.value })}
                      className="form-control"
                      placeholder="4-digit PIN"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setNewUserModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-accent">
                  Create Farmer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
