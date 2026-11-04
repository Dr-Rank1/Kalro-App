import React, { useState } from 'react';
import { X, QrCode, FileText } from 'lucide-react';
import { Batch, FeedLog, MortalityLog, CocoonHarvest, FarmProfile, EnvironmentLog } from '../types';
import { getCurrentStage, getLiveLarvaeCount, formatDate } from '../utils';
import { BatchRegistrationForm } from './BatchRegistrationForm';
import { downloadSingleBatchPdf } from '../utils/pdfGenerator';

interface BatchesViewProps {
  batches: Batch[];
  feedLogs: FeedLog[];
  mortalityLogs: MortalityLog[];
  harvests: CocoonHarvest[];
  profile: FarmProfile;
  envLogs: EnvironmentLog[];
  onAddBatch: (batch: Batch) => void;
  onUpdateBatch: (batch: Batch) => void;
  onOpenQuickLog: (batchId: string, defaultType?: 'feed' | 'mortality' | 'climate' | 'harvest') => void;
  onOpenQr: (batch: Batch) => void;
  onToast?: (msg: string) => void;
}

export const BatchesView: React.FC<BatchesViewProps> = ({
  batches,
  feedLogs,
  mortalityLogs,
  harvests: _harvests,
  profile,
  envLogs,
  onAddBatch,
  onUpdateBatch,
  onOpenQuickLog,
  onOpenQr,
  onToast,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  const handleExportBatchPdf = (batch: Batch) => {
    try {
      downloadSingleBatchPdf({
        batch,
        profile,
        feedLogs,
        mortalityLogs,
        envLogs,
        harvests: _harvests,
      });
      if (onToast) {
        onToast(`Lot dossier for "${batch.displayTag || batch.batchTag || batch.id}" exported as PDF.`);
      }
    } catch (err) {
      console.error('Failed to export batch PDF:', err);
      alert('Could not export batch PDF.');
    }
  };

  const filtered = batches.filter((b) => {
    if (filter === 'active') return b.status === 'active';
    if (filter === 'closed') return b.status === 'closed';
    return true;
  });

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
      {/* Top Header & Filter Controls */}
      <div className="card-header-flex" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Silkworm Batches ({filtered.length})
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Rearing cycle management, lot tracking, feeding history, and cocoon harvest records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Flat Filter Pills */}
          <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
            {(['all', 'active', 'closed'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                style={{
                  background: filter === mode ? 'var(--primary)' : 'transparent',
                  color: filter === mode ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {mode === 'all' ? 'All Batches' : mode}
              </button>
            ))}
          </div>

          <button onClick={() => setShowAddModal(true)} className="btn-accent">
            New Batch
          </button>
        </div>
      </div>

      {/* Direct Batch Creation Station when no batches exist */}
      {batches.length === 0 ? (
        <div className="kalro-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
          <div style={{ borderBottom: '1px solid var(--border-divider)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>
              Register Silkworm Batch
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
              Configure rearing parameters, inspect live forage and space feasibility projections, and initiate cycle monitoring.
            </p>
          </div>

          <BatchRegistrationForm
            onSuccess={(newBatch) => {
              onAddBatch(newBatch);
            }}
            existingBatches={batches}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h4>No Silkworm Batches Found</h4>
          <p>
            {filter === 'active'
              ? 'There are no active rearing cycles at this station. Start a new batch to track chawki rearing.'
              : filter === 'closed'
              ? 'No historical closed batches found in local station storage.'
              : 'No batches recorded yet. Click "New Batch" to register your rearing lot.'}
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            Create New Batch
          </button>
        </div>
      ) : (
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
                    {batch.species === 'bombyx' ? 'Bombyx mori (Bivoltine)' : 'Eri Silkworm (Samia)'}
                  </span>
                  <span className={`status-badge ${batch.status}`}>
                    {batch.status === 'active' ? stage.name : 'Completed & Closed'}
                  </span>
                </div>

                <h3 className="truncate" style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                  {batch.displayTag || batch.batchTag || batch.id}
                </h3>
                <p className="truncate" style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                  Started: {formatDate(batch.startDate)} • {batch.roomName || 'House 1'}
                </p>

                {batch.status === 'active' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      <span>Progress: Day {stage.dayStart} of {maxDays}</span>
                      <span className="tabular-nums">{progressPct}%</span>
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
                    fontSize: '0.78rem',
                    margin: '0.65rem 0',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Current Population</div>
                    <strong className="tabular-nums">{live.toLocaleString()} larvae</strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Initial Eggs (DFLs)</div>
                    <strong className="tabular-nums">{batch.eggCount.toLocaleString()}</strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Total Feed Supplied</div>
                    <strong className="tabular-nums">{(totalFeedGrams / 1000).toFixed(1)} kg</strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Larval Survival</div>
                    <strong className="tabular-nums">
                      {batch.eggCount > 0 ? `${((live / batch.eggCount) * 100).toFixed(1)}%` : '100%'}
                    </strong>
                  </div>
                </div>

                {batch.notes && (
                  <p className="truncate" style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                    "{batch.notes}"
                  </p>
                )}

                <div style={{ display: 'flex', gap: '0.45rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                  <button
                    onClick={() => setSelectedBatch(batch)}
                    className="btn-accent"
                    style={{ flex: 1, fontSize: '0.78rem', padding: '0.4rem' }}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleExportBatchPdf(batch)}
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Download Individual Batch PDF Dossier"
                  >
                    <FileText size={14} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>PDF</span>
                  </button>
                  <button
                    onClick={() => onOpenQr(batch)}
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.65rem' }}
                    title="Generate Tray QR Label"
                  >
                    <QrCode size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Batch Modal with Rich Agronomic Projections */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '960px', maxHeight: '92vh', overflowY: 'auto', padding: '1.75rem' }}>
            <div className="modal-header" style={{ marginBottom: '1.25rem', paddingBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                  Register New Silkworm Batch
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Set up Disease-Free Layings (DFLs), forage requirements, and rearing bay allocation.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="modal-close-btn"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <BatchRegistrationForm
              isModal={true}
              onSuccess={(newBatch) => {
                onAddBatch(newBatch);
                setShowAddModal(false);
              }}
              onCancel={() => setShowAddModal(false)}
              existingBatches={batches}
            />
          </div>
        </div>
      )}

      {/* Batch Details Drawer / Modal */}
      {selectedBatch && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div>
                <span className={`species-badge ${selectedBatch.species}`}>
                  {selectedBatch.species === 'bombyx' ? 'Bombyx mori' : 'Eri Silkworm'}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.35rem' }}>
                  {selectedBatch.displayTag || selectedBatch.batchTag}
                </h3>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  ID: {selectedBatch.id} • Room: {selectedBatch.roomName || 'Rearing House 1'}
                </span>
              </div>
              <button onClick={() => setSelectedBatch(null)} className="modal-close-btn" aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            {/* Metrics Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Live Worms</div>
                <div className="tabular-nums" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                  {getLiveLarvaeCount(selectedBatch, mortalityLogs).toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Age</div>
                <div className="tabular-nums" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                  Day {getCurrentStage(selectedBatch).dayStart}
                </div>
              </div>
              <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Instar Stage</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
                  {getCurrentStage(selectedBatch).name.split(' ')[0]}
                </div>
              </div>
              <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedBatch.status === 'active' ? 'var(--status-success)' : 'var(--text-muted)', marginTop: '2px' }}>
                  {selectedBatch.status.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Protocol Guidance */}
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-card)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--primary)' }}>
                KALRO Standard Protocol for {getCurrentStage(selectedBatch).name}:
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                {getCurrentStage(selectedBatch).leafRecommendation}
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.45rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <span>Target Temp: <strong className="tabular-nums">{getCurrentStage(selectedBatch).idealTemp}</strong></span>
                <span>Target Humidity: <strong className="tabular-nums">{getCurrentStage(selectedBatch).idealHumidity}</strong></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setSelectedBatch(null);
                  onOpenQuickLog(selectedBatch.id, 'feed');
                }}
                className="btn-accent"
                style={{ fontSize: '0.78rem' }}
              >
                Log Feed
              </button>
              <button
                onClick={() => {
                  setSelectedBatch(null);
                  onOpenQuickLog(selectedBatch.id, 'mortality');
                }}
                className="btn-secondary"
                style={{ fontSize: '0.78rem' }}
              >
                Record Loss
              </button>
              <button
                onClick={() => {
                  setSelectedBatch(null);
                  onOpenQuickLog(selectedBatch.id, 'harvest');
                }}
                className="btn-secondary"
                style={{ fontSize: '0.78rem' }}
              >
                Log Harvest
              </button>
              <button
                onClick={() => onOpenQr(selectedBatch)}
                className="btn-secondary"
                style={{ fontSize: '0.78rem' }}
              >
                Tray QR Label
              </button>
              <button
                onClick={() => handleExportBatchPdf(selectedBatch)}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                title="Download verified PDF report for this specific silkworm batch"
              >
                <FileText size={14} />
                <span>Export Lot PDF</span>
              </button>
              <button
                onClick={() => handleToggleStatus(selectedBatch)}
                className="btn-secondary"
                style={{
                  fontSize: '0.78rem',
                  marginLeft: 'auto',
                  color: selectedBatch.status === 'active' ? 'var(--status-danger)' : 'var(--status-success)',
                }}
              >
                {selectedBatch.status === 'active' ? 'Close Batch' : 'Reopen Batch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
