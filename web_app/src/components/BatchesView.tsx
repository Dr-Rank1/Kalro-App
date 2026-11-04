import React, { useState } from 'react';
import { Plus, QrCode, CheckCircle2, Archive, Layers } from 'lucide-react';
import { Language, TRANSLATIONS } from '../translations';
import { Batch, FeedLog, MortalityLog, CocoonHarvest, Species } from '../types';
import { getCurrentStage, getLiveLarvaeCount, formatDate } from '../utils';

interface BatchesViewProps {
  batches: Batch[];
  feedLogs: FeedLog[];
  mortalityLogs: MortalityLog[];
  harvests: CocoonHarvest[];
  lang: Language;
  onAddBatch: (batch: Batch) => void;
  onUpdateBatch: (batch: Batch) => void;
  onOpenQuickLog: (batchId: string, defaultType?: 'feed' | 'mortality' | 'climate' | 'harvest') => void;
  onOpenQr: (batch: Batch) => void;
}

export const BatchesView: React.FC<BatchesViewProps> = ({
  batches,
  feedLogs,
  mortalityLogs,
  harvests,
  lang,
  onAddBatch,
  onUpdateBatch,
  onOpenQuickLog,
  onOpenQr,
}) => {
  const t = TRANSLATIONS[lang];
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // New batch form state
  const [newSpecies, setNewSpecies] = useState<Species>('bombyx');
  const [newCount, setNewCount] = useState<number>(40000);
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTag, setNewTag] = useState<string>('TRAY-BM-03');
  const [newDisplayTag, setNewDisplayTag] = useState<string>('Bombyx Lot #3');
  const [newRoom, setNewRoom] = useState<string>('House 1');
  const [newNotes, setNewNotes] = useState<string>('');

  const filtered = batches.filter((b) => {
    if (filter === 'active') return b.status === 'active';
    if (filter === 'closed') return b.status === 'closed';
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const batch: Batch = {
      id: `batch-${Date.now()}`,
      species: newSpecies,
      startDate: newDate,
      eggCount: Number(newCount),
      status: 'active',
      batchTag: newTag.trim() || `LOT-${Date.now().toString().slice(-4)}`,
      displayTag: newDisplayTag.trim() || `${newSpecies === 'bombyx' ? 'Bombyx' : 'Eri'} Lot`,
      roomName: newRoom.trim() || 'Rearing House',
      notes: newNotes.trim(),
    };

    onAddBatch(batch);
    setShowAddModal(false);
    // Reset defaults
    setNewTag(`TRAY-${Date.now().toString().slice(-4)}`);
  };

  const handleToggleStatus = (batch: Batch) => {
    const updated: Batch = {
      ...batch,
      status: batch.status === 'active' ? 'closed' : 'active',
    };
    onUpdateBatch(updated);
    if (selectedBatch?.id === batch.id) {
      setSelectedBatch(updated);
    }
  };

  return (
    <div>
      {/* Top Bar */}
      <div className="card-header-flex" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            {t.navBatches} ({filtered.length})
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manage rearing cycles, tray tags, feeding history, and harvest status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', background: 'var(--card-white)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                background: filter === 'all' ? 'var(--primary-green)' : 'none',
                color: filter === 'all' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              style={{
                background: filter === 'active' ? 'var(--primary-green)' : 'none',
                color: filter === 'active' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('closed')}
              style={{
                background: filter === 'closed' ? 'var(--primary-green)' : 'none',
                color: filter === 'closed' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Closed
            </button>
          </div>

          <button onClick={() => setShowAddModal(true)} className="btn-accent">
            <Plus size={16} />
            <span>{t.newBatch}</span>
          </button>
        </div>
      </div>

      {/* Grid of Batches */}
      <div className="batches-grid">
        {filtered.map((batch) => {
          const live = getLiveLarvaeCount(batch, mortalityLogs);
          const stage = getCurrentStage(batch);
          const maxDays = batch.species === 'bombyx' ? 40 : 39;
          const progressPct = Math.min(100, Math.round((stage.dayStart / maxDays) * 100));

          const batchFeeds = feedLogs.filter((f) => f.batchId === batch.id);
          const totalFeedGrams = batchFeeds.reduce((s, f) => s + f.quantityGrams, 0);

          return (
            <div key={batch.id} className="batch-item-card">
              <div className="batch-tag-row">
                <span className={`species-badge ${batch.species}`}>
                  {batch.species === 'bombyx' ? 'Bombyx Mori' : 'Eri Silkworm'}
                </span>
                <span className={`status-badge ${batch.status}`}>
                  {batch.status === 'active' ? stage.name : 'Completed & Closed'}
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                {batch.displayTag || batch.batchTag || batch.id}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Started: {formatDate(batch.startDate)} • {batch.roomName || 'House 1'}
              </p>

              {batch.status === 'active' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Progress: Day {stage.dayStart} of {maxDays}</span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="progress-bar-bg" style={{ margin: '0.35rem 0 0.85rem' }}>
                    <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  margin: '0.75rem 0',
                  background: 'var(--background)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Population</div>
                  <strong>{live.toLocaleString()} larvae</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Starting Eggs</div>
                  <strong>{batch.eggCount.toLocaleString()}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Total Feed</div>
                  <strong>{(totalFeedGrams / 1000).toFixed(1)} kg</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Survival Rate</div>
                  <strong>
                    {batch.eggCount > 0 ? `${((live / batch.eggCount) * 100).toFixed(1)}%` : '100%'}
                  </strong>
                </div>
              </div>

              {batch.notes && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.85rem' }}>
                  "{batch.notes}"
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                <button
                  onClick={() => setSelectedBatch(batch)}
                  className="btn-accent"
                  style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem' }}
                >
                  {t.viewDetails}
                </button>
                <button
                  onClick={() => onOpenQr(batch)}
                  className="btn-secondary"
                  style={{
                    padding: '0.45rem 0.75rem',
                    color: 'var(--text-dark)',
                    borderColor: 'var(--card-border)',
                  }}
                  title="Generate Tray QR Code"
                >
                  <QrCode size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Batch Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} color="var(--primary-green)" />
                <span>{t.newBatch}</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="modal-close-btn">✕</button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Silkworm Species</label>
                <select
                  value={newSpecies}
                  onChange={(e) => setNewSpecies(e.target.value as Species)}
                  className="form-control"
                >
                  <option value="bombyx">Mulberry Silkworm (Bombyx mori)</option>
                  <option value="eri">Eri Silkworm (Samia cynthia ricini)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Egg / Chawki Count</label>
                  <input
                    type="number"
                    value={newCount}
                    onChange={(e) => setNewCount(Number(e.target.value))}
                    className="form-control"
                    min="1000"
                    step="1000"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Start / Hatch Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Tray / Batch Tag</label>
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="form-control"
                    placeholder="e.g. TRAY-BM-04"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rearing House / Room</label>
                  <input
                    type="text"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    className="form-control"
                    placeholder="e.g. House 1 - Bay A"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Display Lot Name</label>
                <input
                  type="text"
                  value={newDisplayTag}
                  onChange={(e) => setNewDisplayTag(e.target.value)}
                  className="form-control"
                  placeholder="e.g. Spring 2026 Commercial Batch"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.notes}</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="form-control"
                  rows={2}
                  placeholder="Egg lot supplier, incubation details, initial bed conditions..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                  style={{ color: 'var(--text-dark)', borderColor: 'var(--card-border)' }}
                >
                  {t.cancel}
                </button>
                <button type="submit" className="btn-accent">
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Details Drawer / Modal */}
      {selectedBatch && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <div>
                <span className={`species-badge ${selectedBatch.species}`}>
                  {selectedBatch.species === 'bombyx' ? 'Bombyx Mori' : 'Eri Silkworm'}
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '0.35rem' }}>
                  {selectedBatch.displayTag || selectedBatch.batchTag}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ID: {selectedBatch.id} • Room: {selectedBatch.roomName || 'Main Room'}
                </span>
              </div>
              <button onClick={() => setSelectedBatch(null)} className="modal-close-btn">✕</button>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--background)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Live Worms</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  {getLiveLarvaeCount(selectedBatch, mortalityLogs).toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'var(--background)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Age</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  Day {getCurrentStage(selectedBatch).dayStart}
                </div>
              </div>
              <div style={{ background: 'var(--background)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current Stage</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-green)', marginTop: '3px' }}>
                  {getCurrentStage(selectedBatch).name.split(' ')[0]}
                </div>
              </div>
              <div style={{ background: 'var(--background)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Status</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedBatch.status === 'active' ? 'var(--success)' : 'var(--text-muted)', marginTop: '3px' }}>
                  {selectedBatch.status.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Stage Guidance */}
            <div style={{ background: 'rgba(33, 70, 65, 0.05)', border: '1px solid var(--divider)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem', color: 'var(--primary-green)' }}>
                Field Guide for {getCurrentStage(selectedBatch).name}:
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dark)' }}>
                {getCurrentStage(selectedBatch).leafRecommendation}
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Target Temp: <strong>{getCurrentStage(selectedBatch).idealTemp}</strong></span>
                <span>Target Humidity: <strong>{getCurrentStage(selectedBatch).idealHumidity}</strong></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button
                onClick={() => {
                  setSelectedBatch(null);
                  onOpenQuickLog(selectedBatch.id, 'feed');
                }}
                className="btn-accent"
                style={{ fontSize: '0.8rem' }}
              >
                + Log Feed
              </button>
              <button
                onClick={() => {
                  setSelectedBatch(null);
                  onOpenQuickLog(selectedBatch.id, 'mortality');
                }}
                className="btn-accent"
                style={{ fontSize: '0.8rem', background: 'var(--rest)' }}
              >
                + Log Loss
              </button>
              <button
                onClick={() => {
                  setSelectedBatch(null);
                  onOpenQuickLog(selectedBatch.id, 'harvest');
                }}
                className="btn-accent"
                style={{ fontSize: '0.8rem', background: 'var(--accent-gold)' }}
              >
                + Log Harvest
              </button>
              <button
                onClick={() => {
                  onOpenQr(selectedBatch);
                }}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', color: 'var(--text-dark)', borderColor: 'var(--card-border)' }}
              >
                <QrCode size={15} style={{ marginRight: '4px' }} />
                Tray QR Tag
              </button>
              <button
                onClick={() => handleToggleStatus(selectedBatch)}
                className="btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  marginLeft: 'auto',
                  color: selectedBatch.status === 'active' ? 'var(--danger)' : 'var(--success)',
                  borderColor: 'var(--card-border)',
                }}
              >
                {selectedBatch.status === 'active' ? (
                  <>
                    <Archive size={15} style={{ marginRight: '4px' }} />
                    {t.closeBatch}
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} style={{ marginRight: '4px' }} />
                    Reopen Batch
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
