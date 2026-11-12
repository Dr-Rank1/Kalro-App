import React, { useState } from 'react';
import { Award, CheckCircle2, AlertCircle, Save, X, Scale } from 'lucide-react';
import { Batch, CocoonHarvest, FarmProfile, UserAccount, AuditLogEntry } from '../types';

interface CocoonGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: Batch[];
  profile?: FarmProfile | null;
  currentUser?: UserAccount | null;
  onSaveHarvest: (harvest: CocoonHarvest) => void;
  onAddAuditLog: (entry: AuditLogEntry) => void;
}

export const CocoonGradingModal: React.FC<CocoonGradingModalProps> = ({
  isOpen,
  onClose,
  batches,
  profile,
  currentUser,
  onSaveHarvest,
  onAddAuditLog,
}) => {
  const activeBatches = batches.filter((b) => b.status === 'active');
  const [selectedBatchId, setSelectedBatchId] = useState<string>(activeBatches[0]?.id || '');
  const [totalWeightKg, setTotalWeightKg] = useState<number>(38.5);
  const [cocoonCount, setCocoonCount] = useState<number>(20500);

  // Defect tallies
  const [doubleCount, setDoubleCount] = useState<number>(120);
  const [uziCount, setUziCount] = useState<number>(35);
  const [stainedCount, setStainedCount] = useState<number>(85);
  const [flimsyCount, setFlimsyCount] = useState<number>(60);

  // 20-Cocoon Testing Sample
  const [sampleCocoonWeightGrams, setSampleCocoonWeightGrams] = useState<number>(37.6); // 20 cocoons weight
  const [sampleShellWeightGrams, setSampleShellWeightGrams] = useState<number>(8.8); // 20 shells weight

  if (!isOpen) return null;

  const selectedBatch = activeBatches.find((b) => b.id === selectedBatchId) || activeBatches[0];

  const totalDefects = doubleCount + uziCount + stainedCount + flimsyCount;
  const defectRate = cocoonCount > 0 ? Number(((totalDefects / cocoonCount) * 100).toFixed(1)) : 0;

  // Single metrics from sample
  const singleCocoonWeight = sampleCocoonWeightGrams > 0 ? Number((sampleCocoonWeightGrams / 20.0).toFixed(2)) : 1.88;
  const singleShellWeight = sampleShellWeightGrams > 0 ? Number((sampleShellWeightGrams / 20.0).toFixed(2)) : 0.44;

  const shellRatio = singleCocoonWeight > 0
    ? Number(((singleShellWeight / singleCocoonWeight) * 100).toFixed(1))
    : 23.4;

  // Renditta calculation: kg green cocoons per 1 kg raw silk
  const renditta = shellRatio > 0
    ? Number(Math.min(16, Math.max(5.5, 100.0 / (shellRatio * 0.72))).toFixed(1))
    : 7.2;

  // Commercial Grade
  let commercialGrade: 'Grade A' | 'Grade B' | 'Grade C' = 'Grade A';
  if (shellRatio >= 21.0 && defectRate <= 6.0) {
    commercialGrade = 'Grade A';
  } else if (shellRatio >= 17.0 && defectRate <= 12.0) {
    commercialGrade = 'Grade B';
  } else {
    commercialGrade = 'Grade C';
  }

  const handleSave = () => {
    if (!selectedBatch) return;

    const totalWeightGrams = Math.round(totalWeightKg * 1000);
    const harvest: CocoonHarvest = {
      id: `harvest-${Date.now()}`,
      batchId: selectedBatch.id,
      harvestDate: new Date().toISOString().split('T')[0],
      cocoonCount,
      totalWeightGrams,
      shellWeightGrams: Math.round(totalWeightGrams * (shellRatio / 100.0)),
      defectiveCount: totalDefects,
      doubleCount,
      uziCount,
      stainedCount,
      flimsyCount,
      singleCocoonWeightGrams: singleCocoonWeight,
      singleShellWeightGrams: singleShellWeight,
      shellRatioPercent: shellRatio,
      renditta,
      operatorId: currentUser?.id,
      operatorName: currentUser?.username,
      operatorRole: currentUser?.role,
      notes: `Graded as ${commercialGrade} · Shell Ratio: ${shellRatio}% · Renditta: ${renditta} kg · Defect: ${defectRate}%`,
    };

    onSaveHarvest(harvest);

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      operatorId: currentUser?.id,
      operatorName: currentUser?.username || 'Staff',
      operatorRole: currentUser?.role || 'cocoon_inspector',
      actionType: 'cocoon_harvest',
      title: `Cocoon Harvest Graded: ${commercialGrade}`,
      batchId: selectedBatch.id,
      batchTag: selectedBatch.displayTag || selectedBatch.batchTag,
      roomName: selectedBatch.roomName,
      details: `Harvest of ${totalWeightKg.toFixed(1)} kg (${cocoonCount.toLocaleString()} cocoons) evaluated. Shell Ratio: ${shellRatio}%, Renditta: ${renditta}, Defect: ${defectRate}%.`,
      metrics: `${totalWeightKg.toFixed(1)} kg · ${shellRatio}% Shell · Grade: ${commercialGrade}`,
    };
    onAddAuditLog(auditEntry);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Kenya Cocoon Harvest Grading &amp; Renditta Matrix
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Determine Shell Ratio (%), estimated Renditta, and defect classification for green cocoon lots
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          {/* Target Batch */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Harvest Silkworm Batch
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
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

          {/* Primary Harvest Weights */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Total Green Cocoon Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={totalWeightKg}
                onChange={(e) => setTotalWeightKg(parseFloat(e.target.value) || 0)}
                className="simple-input"
                style={{ width: '100%', fontSize: '1.05rem', fontWeight: 700 }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Total Cocoon Count (Est. / Actual)
              </label>
              <input
                type="number"
                min="10"
                value={cocoonCount}
                onChange={(e) => setCocoonCount(parseInt(e.target.value, 10) || 0)}
                className="simple-input"
                style={{ width: '100%', fontSize: '1.05rem', fontWeight: 700 }}
              />
            </div>
          </div>

          {/* 20-Cocoon Scientific Sampling Box */}
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', marginBottom: '0.4rem' }}>
              <Scale size={15} />
              <strong style={{ fontSize: '0.82rem' }}>20-Cocoon Precision Sample Analysis</strong>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 0.6rem' }}>
              Weigh a representative sample of 20 randomly drawn whole cocoons, cut shells, and weigh empty silk shells:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>20 Whole Cocoons (grams)</label>
                <input
                  type="number"
                  step="0.1"
                  value={sampleCocoonWeightGrams}
                  onChange={(e) => setSampleCocoonWeightGrams(parseFloat(e.target.value) || 0)}
                  className="simple-input"
                  style={{ width: '100%', fontSize: '0.9rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>20 Silk Shells Only (grams)</label>
                <input
                  type="number"
                  step="0.1"
                  value={sampleShellWeightGrams}
                  onChange={(e) => setSampleShellWeightGrams(parseFloat(e.target.value) || 0)}
                  className="simple-input"
                  style={{ width: '100%', fontSize: '0.9rem', fontWeight: 700 }}
                />
              </div>
            </div>
          </div>

          {/* Defect Sorting Grid */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
                Defect Sorting (Count)
              </label>
              <span style={{ fontSize: '0.72rem', color: defectRate <= 6 ? 'var(--status-success)' : 'var(--status-danger)', fontWeight: 600 }}>
                Total Defect Rate: {defectRate}%
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Double Cocoons</label>
                <input
                  type="number"
                  min="0"
                  value={doubleCount}
                  onChange={(e) => setDoubleCount(parseInt(e.target.value, 10) || 0)}
                  className="simple-input"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Uzi Pierced</label>
                <input
                  type="number"
                  min="0"
                  value={uziCount}
                  onChange={(e) => setUziCount(parseInt(e.target.value, 10) || 0)}
                  className="simple-input"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Stained / Soiled</label>
                <input
                  type="number"
                  min="0"
                  value={stainedCount}
                  onChange={(e) => setStainedCount(parseInt(e.target.value, 10) || 0)}
                  className="simple-input"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Flimsy / Thin</label>
                <input
                  type="number"
                  min="0"
                  value={flimsyCount}
                  onChange={(e) => setFlimsyCount(parseInt(e.target.value, 10) || 0)}
                  className="simple-input"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Computed Analysis Card */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'rgba(15, 56, 38, 0.05)',
              border: '1px solid rgba(15, 56, 38, 0.2)',
              borderRadius: '8px',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shell Ratio (%)</div>
                <strong style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>{shellRatio}%</strong>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Est. Renditta</div>
                <strong style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>{renditta} kg</strong>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Single Shell</div>
                <strong style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>{singleShellWeight} g</strong>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Commercial Grade</div>
                <strong style={{ fontSize: '1.15rem', color: commercialGrade === 'Grade A' ? 'var(--status-success)' : commercialGrade === 'Grade B' ? 'var(--status-warning)' : 'var(--status-danger)' }}>
                  {commercialGrade}
                </strong>
              </div>
            </div>
          </div>

          {/* Actions */}
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
              Save Cocoon Harvest Grade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
