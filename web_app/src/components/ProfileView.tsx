import React, { useState, useRef } from 'react';
import { FarmProfile, Batch, CocoonHarvest, PaymentRecord } from '../types';
import { KENYA_COUNTIES } from '../constants';
import { formatCurrency } from '../utils';

interface ProfileViewProps {
  profile: FarmProfile;
  batches: Batch[];
  harvests: CocoonHarvest[];
  payments: PaymentRecord[];
  onUpdateProfile: (profile: FarmProfile) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonStr: string) => Promise<{ success: boolean; message: string }>;
  onClearAllRecords: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  batches,
  harvests,
  payments,
  onUpdateProfile,
  onExportBackup,
  onImportBackup,
  onClearAllRecords,
}) => {
  const [editing, setEditing] = useState(false);
  const [orgName, setOrgName] = useState(profile.orgName);
  const [county, setCounty] = useState(profile.county);
  const [houseCount, setHouseCount] = useState(profile.houseCount);
  const [managerName, setManagerName] = useState(profile.managerName);
  const [syncCode, setSyncCode] = useState(profile.syncCode);
  const [workerRole, setWorkerRole] = useState<'director' | 'extension' | 'chawki'>('director');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      orgName: orgName.trim(),
      county,
      houseCount: Number(houseCount),
      managerName: managerName.trim(),
      syncCode: syncCode.trim(),
    });
    setEditing(false);
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

  // Lifetime metrics
  const totalHarvestWeightKg =
    harvests.reduce((sum, h) => sum + h.totalWeightGrams, 0) / 1000.0;
  const totalCocoonCount = harvests.reduce((sum, h) => sum + h.cocoonCount, 0);
  const totalRevenue = payments
    .filter((p) => p.direction === 'inflow')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <div className="card-header-flex" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Station Profile & System Administration</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Station details, rearing facility configuration, and database administration.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Farm Account Details Card */}
        <div className="kalro-card" style={{ marginBottom: 0 }}>
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Station Identity & Accreditation</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Accredited agricultural research station profile
              </p>
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)} className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
                Edit Details
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Station / Center Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">County Station</label>
                  <select
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    className="form-control"
                  >
                    {KENYA_COUNTIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Rearing Houses</label>
                  <input
                    type="number"
                    value={houseCount}
                    onChange={(e) => setHouseCount(Number(e.target.value))}
                    className="form-control tabular-nums"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Lead Scientist / Manager</label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">KALRO Network Code</label>
                  <input
                    type="text"
                    value={syncCode}
                    onChange={(e) => setSyncCode(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
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
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-divider)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Station Entity:</span>
                  <strong className="truncate" style={{ fontSize: '0.9rem' }}>{profile.orgName}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-divider)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Geographic Region:</span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{profile.county} County, Kenya</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-divider)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Rearing Facilities:</span>
                  <span className="tabular-nums" style={{ fontWeight: 600, fontSize: '0.85rem' }}>{profile.houseCount} Isolated Rearing Units</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-divider)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Station Lead / Officer:</span>
                  <strong style={{ fontSize: '0.88rem' }}>{profile.managerName}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Sync Authorization Code:</span>
                  <code style={{ background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 700, color: 'var(--primary)', border: '1px solid var(--border-card)' }}>
                    {profile.syncCode}
                  </code>
                </div>
              </div>

              {/* Role Switcher */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-divider)' }}>
                <label className="form-label" style={{ marginBottom: '0.45rem' }}>Active Operator Role</label>
                <div style={{ display: 'flex', gap: '0.45rem' }}>
                  {[
                    { id: 'director', label: 'Lead Scientist' },
                    { id: 'extension', label: 'Extension Officer' },
                    { id: 'chawki', label: 'Chawki Technician' },
                  ].map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setWorkerRole(role.id as any)}
                      style={{
                        flex: 1,
                        background: workerRole === role.id ? 'var(--primary)' : 'var(--bg-subtle)',
                        color: workerRole === role.id ? '#ffffff' : 'var(--text-main)',
                        border: '1px solid var(--border-card)',
                        padding: '0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lifetime Station Aggregates */}
        <div className="kalro-card" style={{ marginBottom: 0 }}>
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Cumulative Station Output</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Historical production aggregates and offline data integrity
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Registered Batches</div>
              <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary)', margin: '2px 0' }}>
                {batches.length}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--status-success)', fontWeight: 600 }}>
                {batches.filter((b) => b.status === 'active').length} actively rearing
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Green Cocoons Produced</div>
              <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--accent-gold)', margin: '2px 0' }}>
                {totalHarvestWeightKg.toFixed(1)} kg
              </div>
              <div className="tabular-nums" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {totalCocoonCount.toLocaleString()} sorted shells
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Commercial Silk Revenue</div>
              <div className="tabular-nums" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--status-success)', margin: '2px 0' }}>
                {formatCurrency(totalRevenue)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Reeling mill deliveries
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Station Database</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', margin: '2px 0' }}>
                Local Offline
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--status-success)', fontWeight: 600 }}>
                IndexedDB Active
              </div>
            </div>
          </div>

          {/* Backup & Demo Data Management */}
          <div style={{ borderTop: '1px solid var(--border-divider)', paddingTop: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={onExportBackup}
                className="btn-accent"
                style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem' }}
              >
                Export JSON Backup
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem' }}
              >
                Restore JSON Backup
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
              <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'var(--status-success-subtle)', border: '1px solid #BAE3CC', color: 'var(--status-success)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', textAlign: 'center' }}>
                {importStatus}
              </div>
            )}

            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to permanently clear all silkworm batches, feeding logs, forage inventory movements, and cashflow records from station storage? This action cannot be undone.')) {
                  onClearAllRecords();
                }
              }}
              style={{
                width: '100%',
                marginTop: '0.75rem',
                background: 'none',
                border: '1px dashed var(--border-card)',
                color: 'var(--status-danger)',
                fontSize: '0.74rem',
                padding: '0.4rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'border-color 0.15s ease',
              }}
            >
              Clear All Station Records (Purge All Batches & Data)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
