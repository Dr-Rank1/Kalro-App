import React, { useState, useEffect } from 'react';
import { UserRole, FarmProfile, UserAccount } from '../types';
import { KENYA_COUNTIES, USER_ROLES } from '../constants';
import { RefreshCw, Check } from 'lucide-react';

export interface ProfileFormData {
  username: string;
  role: UserRole;
  stationName: string;
  county: string;
  subCounty: string;
  phone: string;
  email: string;
  houseCount: number;
  mulberryAcreage: number;
  syncCode: string;
  avatarColor: string;
}

interface ProfileFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: {
    user?: UserAccount | null;
    profile?: FarmProfile | null;
  };
  onClose: () => void;
  onSave: (data: ProfileFormData) => void;
}

const AVATAR_COLORS = [
  '#143D2B', // KALRO Forest Green
  '#C68A14', // Field Gold
  '#2B5775', // Slate Blue
  '#4A148C', // Mulberry Purple
  '#BF360C', // Terracotta
  '#2E7D32', // Leaf Green
];

function generateSyncCode(county: string): string {
  const code = (county || 'KBU').slice(0, 3).toUpperCase();
  const rand = Math.floor(100 + Math.random() * 900);
  return `KALRO-SERI-${code}-${rand}`;
}

export const ProfileFormModal: React.FC<ProfileFormModalProps> = ({
  isOpen,
  mode,
  initialData,
  onClose,
  onSave,
}) => {
  const user = initialData?.user;
  const profile = initialData?.profile;

  const [username, setUsername] = useState(user?.username || profile?.managerName || '');
  const [role, setRole] = useState<UserRole>(user?.role || profile?.managerRole || 'commercial_reeler');
  const [stationName, setStationName] = useState(user?.stationName || profile?.orgName || '');
  const [county, setCounty] = useState(user?.county || profile?.county || 'Kiambu');
  const [subCounty, setSubCounty] = useState(profile?.subCounty || '');
  const [phone, setPhone] = useState(user?.phone || profile?.phone || '');
  const [email, setEmail] = useState(user?.email || profile?.email || '');
  const [houseCount, setHouseCount] = useState<number>(profile?.houseCount || 1);
  const [mulberryAcreage, setMulberryAcreage] = useState<number>(profile?.mulberryAcreage || 1.0);
  const [syncCode, setSyncCode] = useState(profile?.syncCode || generateSyncCode(county));
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || profile?.avatarColor || AVATAR_COLORS[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when initialData changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const uName = user?.username || profile?.managerName || '';
      const uRole = user?.role || profile?.managerRole || 'commercial_reeler';
      const sName = user?.stationName || profile?.orgName || '';
      const uCounty = user?.county || profile?.county || 'Kiambu';

      setUsername(uName);
      setRole(uRole);
      setStationName(sName);
      setCounty(uCounty);
      setSubCounty(profile?.subCounty || '');
      setPhone(user?.phone || profile?.phone || '');
      setEmail(user?.email || profile?.email || '');
      setHouseCount(profile?.houseCount || 1);
      setMulberryAcreage(profile?.mulberryAcreage || 1.0);
      setSyncCode(profile?.syncCode || generateSyncCode(uCounty));
      setAvatarColor(user?.avatarColor || profile?.avatarColor || AVATAR_COLORS[0]);
      setErrorMsg(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Compute initials dynamically
  const nameParts = username.trim().split(/\s+/);
  const initials =
    nameParts.length > 1
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : username.trim().slice(0, 2).toUpperCase() || 'FP';

  const roleMeta = USER_ROLES.find((r) => r.value === role) || USER_ROLES[0];

  const handleCountyChange = (newCounty: string) => {
    setCounty(newCounty);
    // Auto-update code prefix if it matches previous pattern
    if (!profile?.syncCode || mode === 'create') {
      setSyncCode(generateSyncCode(newCounty));
    }
  };

  const handleNameBlur = () => {
    // If farm name is empty, suggest a friendly default
    if (!stationName.trim() && username.trim()) {
      setStationName(`${username.trim()}'s Silk Farm`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Please enter the farmer or manager name.');
      return;
    }
    if (!stationName.trim()) {
      setErrorMsg('Please enter the farm or enterprise name.');
      return;
    }

    onSave({
      username: username.trim(),
      role,
      stationName: stationName.trim(),
      county,
      subCounty: subCounty.trim(),
      phone: phone.trim(),
      email: email.trim(),
      houseCount: Number(houseCount) || 1,
      mulberryAcreage: Number(mulberryAcreage) || 1.0,
      syncCode: syncCode.trim() || generateSyncCode(county),
      avatarColor,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content profile-form-modal"
        style={{ maxWidth: '560px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {mode === 'create' ? 'Create Farm Profile' : 'Edit Farm Profile'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              {mode === 'create'
                ? 'Set up your details to link rearing batches, feeding logs, and harvests.'
                : 'Update your contact information and farm facility specifications.'}
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close dialog">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Live Visual Card Preview */}
            <div className="profile-live-preview">
              <div className="preview-avatar" style={{ backgroundColor: avatarColor }}>
                {initials}
              </div>
              <div className="preview-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="preview-name">{username.trim() || 'Farmer Full Name'}</span>
                  <span
                    className="preview-role"
                    style={{
                      backgroundColor: `${roleMeta.badgeColor}15`,
                      color: roleMeta.badgeColor,
                      borderColor: `${roleMeta.badgeColor}40`,
                    }}
                  >
                    {roleMeta.label}
                  </span>
                </div>
                <div className="preview-farm">
                  {stationName.trim() || 'Farm / Station Name'} • {county} County
                  {subCounty.trim() ? `, ${subCounty.trim()}` : ''}
                </div>
              </div>
            </div>

            {/* Avatar Color Picker */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px' }}>
                Profile Color
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: avatarColor === c ? '2px solid #ffffff' : '2px solid transparent',
                      outline: avatarColor === c ? `2px solid ${c}` : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      transition: 'transform 0.1s ease',
                    }}
                    title={`Color ${c}`}
                  >
                    {avatarColor === c && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 1: Farmer Identity */}
            <div className="form-section-box">
              <div className="form-section-title">1. Farmer Information</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Farmer / Manager Name *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={handleNameBlur}
                    className="form-control"
                    placeholder="e.g. Mary Wambua"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="form-control"
                  >
                    {USER_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Contact</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-control"
                    placeholder="e.g. +254 712 345 678"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control"
                    placeholder="farmer@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Farm & Capacity Details */}
            <div className="form-section-box">
              <div className="form-section-title">2. Farm & Facility Specifications</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Farm / Station Enterprise Name *</label>
                  <input
                    type="text"
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                    className="form-control"
                    placeholder="e.g. Wambua Sericulture Farm"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">County *</label>
                  <select
                    value={county}
                    onChange={(e) => handleCountyChange(e.target.value)}
                    className="form-control"
                  >
                    {KENYA_COUNTIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Sub-County</label>
                  <input
                    type="text"
                    value={subCounty}
                    onChange={(e) => setSubCounty(e.target.value)}
                    className="form-control"
                    placeholder="e.g. Thika West"
                  />
                </div>

                {/* Quick Presets: Rearing Houses */}
                <div className="form-group">
                  <label className="form-label">Rearing Houses</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setHouseCount(cnt)}
                        style={{
                          flex: 1,
                          padding: '6px 0',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-card)',
                          backgroundColor: houseCount === cnt ? 'var(--primary)' : 'var(--bg-subtle)',
                          color: houseCount === cnt ? '#ffffff' : 'var(--text-main)',
                          cursor: 'pointer',
                        }}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Presets: Mulberry Acreage */}
                <div className="form-group">
                  <label className="form-label">Mulberry Orchard (Acres)</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[0.5, 1.0, 2.0, 5.0].map((ac) => (
                      <button
                        key={ac}
                        type="button"
                        onClick={() => setMulberryAcreage(ac)}
                        style={{
                          flex: 1,
                          padding: '6px 0',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-card)',
                          backgroundColor: mulberryAcreage === ac ? 'var(--primary)' : 'var(--bg-subtle)',
                          color: mulberryAcreage === ac ? '#ffffff' : 'var(--text-main)',
                          cursor: 'pointer',
                        }}
                      >
                        {ac} ac
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Farmer / Sync Code</label>
                    <button
                      type="button"
                      onClick={() => setSyncCode(generateSyncCode(county))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <RefreshCw size={11} /> Generate New
                    </button>
                  </div>
                  <input
                    type="text"
                    value={syncCode}
                    onChange={(e) => setSyncCode(e.target.value)}
                    className="form-control font-mono"
                    placeholder="KALRO-SERI-XXX-000"
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div style={{ padding: '8px 12px', background: 'var(--status-danger-subtle)', color: 'var(--status-danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem' }}>
                {errorMsg}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-accent">
              {mode === 'create' ? 'Create Farm Profile' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
