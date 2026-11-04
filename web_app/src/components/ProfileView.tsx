import React, { useState, useRef } from 'react';
import { User, Shield, RefreshCw, Upload, Download, CheckCircle, MapPin, Home } from 'lucide-react';
import { Language, TRANSLATIONS } from '../translations';
import { FarmProfile, Batch, CocoonHarvest, PaymentRecord } from '../types';
import { KENYA_COUNTIES } from '../constants';
import { formatCurrency } from '../utils';

interface ProfileViewProps {
  profile: FarmProfile;
  batches: Batch[];
  harvests: CocoonHarvest[];
  payments: PaymentRecord[];
  lang: Language;
  onUpdateProfile: (profile: FarmProfile) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonStr: string) => Promise<{ success: boolean; message: string }>;
  onResetDemoData: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  batches,
  harvests,
  payments,
  lang,
  onUpdateProfile,
  onExportBackup,
  onImportBackup,
  onResetDemoData,
}) => {
  const t = TRANSLATIONS[lang];
  const [editing, setEditing] = useState(false);
  const [orgName, setOrgName] = useState(profile.orgName);
  const [county, setCounty] = useState(profile.county);
  const [houseCount, setHouseCount] = useState(profile.houseCount);
  const [managerName, setManagerName] = useState(profile.managerName);
  const [syncCode, setSyncCode] = useState(profile.syncCode);
  const [workerRole, setWorkerRole] = useState<'manager' | 'rearer' | 'chawki'>('manager');
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{t.farmProfile}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Farm identity, county location, seasonal performance record, and data backup.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Farm Account Details Card */}
        <div className="kalro-card" style={{ marginBottom: 0 }}>
          <div className="card-header-flex">
            <h3 className="card-title">
              <User size={18} color="var(--primary-green)" />
              <span>Farm Identity & Ownership</span>
            </h3>
            {!editing && (
              <button onClick={() => setEditing(true)} className="btn-accent" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                {t.editProfile}
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Farm / Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t.county}</label>
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
                  <label className="form-label">{t.houseCount}</label>
                  <input
                    type="number"
                    value={houseCount}
                    onChange={(e) => setHouseCount(Number(e.target.value))}
                    className="form-control"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t.manager}</label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t.syncCode}</label>
                  <input
                    type="text"
                    value={syncCode}
                    onChange={(e) => setSyncCode(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn-secondary"
                  style={{ color: 'var(--text-dark)', borderColor: 'var(--card-border)' }}
                >
                  {t.cancel}
                </button>
                <button type="submit" className="btn-accent">
                  {t.save}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--divider)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Farm Name:</span>
                  <strong style={{ fontSize: '0.95rem' }}>{profile.orgName}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--divider)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Location:</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <MapPin size={14} color="var(--primary-green)" /> {profile.county} County, Kenya
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--divider)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Rearing Facilities:</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <Home size={14} color="var(--primary-green)" /> {profile.houseCount} Rearing Houses
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--divider)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Lead Farmer / Manager:</span>
                  <strong>{profile.managerName}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>KALRO Sync Code:</span>
                  <code style={{ background: 'var(--background)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, color: 'var(--primary-green)' }}>
                    {profile.syncCode}
                  </code>
                </div>
              </div>

              {/* Role Switcher */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--divider)' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>Active Operator Role</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[
                    { id: 'manager', label: 'Farm Manager' },
                    { id: 'rearer', label: 'Silkworm Rearer' },
                    { id: 'chawki', label: 'Chawki Specialist' },
                  ].map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setWorkerRole(role.id as any)}
                      style={{
                        flex: 1,
                        background: workerRole === role.id ? 'var(--primary-green)' : 'var(--background)',
                        color: workerRole === role.id ? '#ffffff' : 'var(--text-dark)',
                        border: '1px solid var(--card-border)',
                        padding: '0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
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

        {/* Season Production Record */}
        <div className="kalro-card" style={{ marginBottom: 0 }}>
          <div className="card-header-flex">
            <h3 className="card-title">
              <Shield size={18} color="var(--accent-gold)" />
              <span>Season Record & Statistics</span>
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rearing Batches</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-green)' }}>
                {batches.length} total
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--success)' }}>
                {batches.filter((b) => b.status === 'active').length} currently active
              </div>
            </div>

            <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cocoons Harvested</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                {totalHarvestWeightKg.toFixed(1)} kg
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {totalCocoonCount.toLocaleString()} shells
              </div>
            </div>

            <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gross Revenue</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--success)' }}>
                {formatCurrency(totalRevenue)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Grade A & B cocoon sales
              </div>
            </div>

            <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Offline Storage</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--info)' }}>
                100% Offline
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--success)' }}>
                Encrypted & Cached
              </div>
            </div>
          </div>

          {/* Backup & Demo Data Management */}
          <div style={{ borderTop: '1px solid var(--divider)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                onClick={onExportBackup}
                className="btn-accent"
                style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem' }}
              >
                <Download size={15} />
                <span>{t.backupData}</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem', color: 'var(--text-dark)', borderColor: 'var(--card-border)' }}
              >
                <Upload size={15} />
                <span>{t.restoreData}</span>
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
              <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(46, 125, 87, 0.1)', color: 'var(--success)', borderRadius: '4px', fontSize: '0.8rem', textAlign: 'center' }}>
                <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                {importStatus}
              </div>
            )}

            <button
              onClick={() => {
                if (window.confirm('Reset local storage to fresh KALRO demonstration data?')) {
                  onResetDemoData();
                }
              }}
              style={{
                width: '100%',
                marginTop: '0.85rem',
                background: 'none',
                border: '1px dashed var(--card-border)',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <RefreshCw size={13} />
              <span>{t.demoDataReset}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
