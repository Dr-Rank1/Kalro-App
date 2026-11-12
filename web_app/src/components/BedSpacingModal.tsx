import React, { useState } from 'react';
import { Layers, ShieldCheck, AlertCircle, Save, X, Sparkles } from 'lucide-react';
import { Batch, MortalityLog, FarmProfile, UserAccount, AuditLogEntry } from '../types';
import { calculateBedExpansion, getCurrentStage, getLiveLarvaeCount } from '../utils';

interface BedSpacingModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: Batch[];
  mortalityLogs: MortalityLog[];
  profile?: FarmProfile | null;
  currentUser?: UserAccount | null;
  onUpdateBatchTrays: (batchId: string, traysCount: number) => void;
  onAddAuditLog: (entry: AuditLogEntry) => void;
}

export const BedSpacingModal: React.FC<BedSpacingModalProps> = ({
  isOpen,
  onClose,
  batches,
  mortalityLogs,
  profile,
  currentUser,
  onUpdateBatchTrays,
  onAddAuditLog,
}) => {
  const activeBatches = batches.filter((b) => b.status === 'active');
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    activeBatches[0]?.id || ''
  );

  const selectedBatch = activeBatches.find((b) => b.id === selectedBatchId) || activeBatches[0];

  const liveLarvae = selectedBatch ? getLiveLarvaeCount(selectedBatch, mortalityLogs) : 400;
  const stage = selectedBatch ? getCurrentStage(selectedBatch) : { instarNumber: 1, name: '1st Instar', isMoult: false, isHarvest: false, dayStart: 1, dayEnd: 3, leafRecommendation: '', idealTemp: '27°C', idealHumidity: '85%' };

  const spacingPlan = selectedBatch
    ? calculateBedExpansion(selectedBatch, liveLarvae, stage)
    : { instarNumber: 1, instarName: '1st Instar', requiredAreaSqMeters: 0.5, standardTraysNeeded: 1, limeDustingKg: 0.05, bleachingPowderGrams: 1.5, spacingAlert: false };

  const [traysInput, setTraysInput] = useState<number>(
    selectedBatch?.currentTraysCount || spacingPlan.standardTraysNeeded
  );
  const [dustingDone, setDustingDone] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!selectedBatch) return;

    onUpdateBatchTrays(selectedBatch.id, traysInput);

    // Record to audit log
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      operatorId: currentUser?.id,
      operatorName: currentUser?.username || 'Staff',
      operatorRole: currentUser?.role || 'rearing_technician',
      actionType: 'batch_updated',
      title: 'Bed Spacing & Lime Dusting Executed',
      batchId: selectedBatch.id,
      batchTag: selectedBatch.displayTag || selectedBatch.batchTag,
      roomName: selectedBatch.roomName,
      details: `Bed expansion adjusted to ${traysInput} trays (${spacingPlan.requiredAreaSqMeters} m² needed). Chemical dusting: ${spacingPlan.limeDustingKg} kg slaked lime + ${spacingPlan.bleachingPowderGrams} g bleaching powder (97:3).`,
      metrics: `${traysInput} trays · ${spacingPlan.requiredAreaSqMeters} m²`,
    };
    onAddAuditLog(entry);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '600px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Rearing Tray &amp; Bed Area Expansion Matrix
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Scale rearing tray bed area per instar and calculate slaked lime hygiene dusting
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          {/* Batch Selector */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Select Active Batch
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                const found = activeBatches.find((b) => b.id === e.target.value);
                if (found) {
                  const s = getCurrentStage(found);
                  const p = calculateBedExpansion(found, getLiveLarvaeCount(found, mortalityLogs), s);
                  setTraysInput(found.currentTraysCount || p.standardTraysNeeded);
                }
              }}
              className="simple-input"
              style={{ width: '100%', fontSize: '0.85rem' }}
            >
              {activeBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.displayTag || b.batchTag || b.id} ({b.species === 'bombyx' ? 'Bombyx mori' : 'Eri'} · {b.roomName})
                </option>
              ))}
            </select>
          </div>

          {/* Current Batch Stage & Larvae Status */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              padding: '0.85rem',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              marginBottom: '1rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Stage</div>
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>{stage.name}</strong>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Live Larvae</div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{liveLarvae.toLocaleString()}</strong>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Trays in House</div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>
                {selectedBatch?.currentTraysCount || 1} standard trays
              </strong>
            </div>
          </div>

          {/* Calculations Matrix */}
          <div
            style={{
              backgroundColor: spacingPlan.spacingAlert ? 'rgba(198, 138, 20, 0.08)' : 'rgba(15, 56, 38, 0.05)',
              border: spacingPlan.spacingAlert ? '1px solid rgba(198, 138, 20, 0.3)' : '1px solid rgba(15, 56, 38, 0.2)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Bed Area</div>
                <strong style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>{spacingPlan.requiredAreaSqMeters} m²</strong>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Required Trays</div>
                <strong style={{ fontSize: '1.25rem', color: spacingPlan.spacingAlert ? 'var(--status-warning)' : 'var(--status-success)' }}>
                  {spacingPlan.standardTraysNeeded} trays
                </strong>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tray Dimensions</div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>0.9m × 0.6m (0.54m²)</strong>
              </div>
            </div>

            {spacingPlan.spacingAlert && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#B45309', borderTop: '1px solid rgba(198, 138, 20, 0.2)', paddingTop: '0.5rem' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Overcrowding Notice:</strong> Active tray density exceeds recommended limits. Split larvae across {spacingPlan.standardTraysNeeded} trays to prevent bed fermentation and muscardine outbreaks.
                </span>
              </div>
            )}
          </div>

          {/* Chemical Bed Dusting Box (97:3 Slaked Lime to Bleaching Powder) */}
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', marginBottom: '0.4rem' }}>
              <ShieldCheck size={16} />
              <strong style={{ fontSize: '0.82rem' }}>Chemical Bed Dusting Calibration (97:3 Sanitizer)</strong>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>
              Dusting standard at 4.0 g/m² bed surface during morning cleaning or moult preparation:
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
              <span style={{ backgroundColor: '#FFFFFF', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--border-divider)' }}>
                <strong>Dry Slaked Lime (97%):</strong> {spacingPlan.limeDustingKg} kg
              </span>
              <span style={{ backgroundColor: '#FFFFFF', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--border-divider)' }}>
                <strong>Bleaching Powder (3%):</strong> {spacingPlan.bleachingPowderGrams} grams
              </span>
            </div>
          </div>

          {/* Update Tray Count Control */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
              Active Tray Allocation for this Batch
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="number"
                min="1"
                max="100"
                value={traysInput}
                onChange={(e) => setTraysInput(parseInt(e.target.value, 10) || 1)}
                className="simple-input"
                style={{ width: '120px', fontSize: '1rem', fontWeight: 700, textAlign: 'center' }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                allocated rearing racks/trays in {selectedBatch?.roomName || 'Chamber'}
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '8px 16px' }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-accent"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px' }}
            >
              <Save size={15} />
              Confirm Spacing &amp; Dusting Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
