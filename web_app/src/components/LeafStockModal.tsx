import React, { useState } from 'react';
import { X, Leaf, Plus } from 'lucide-react';
import { LeafMovement, LeafType, FarmProfile } from '../types';

interface LeafStockModalProps {
  isOpen: boolean;
  profile?: FarmProfile | null;
  onClose: () => void;
  onSave: (movement: LeafMovement) => void;
}

export const LeafStockModal: React.FC<LeafStockModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSave,
}) => {
  const [leafType, setLeafType] = useState<LeafType>('mulberry');
  const [quantityKg, setQuantityKg] = useState<number | ''>(25);
  const [sourcePlot, setSourcePlot] = useState<string>(
    profile?.orgName ? `${profile.orgName} - Main Plot` : 'Main Mulberry Plot'
  );
  const [notes, setNotes] = useState<string>('Morning harvest, high leaf moisture');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(quantityKg);
    if (!qty || qty <= 0) {
      setErrorMsg('Please enter a valid harvest quantity in kg.');
      return;
    }

    const newMovement: LeafMovement = {
      id: `leaf-mv-${Date.now()}`,
      date: new Date().toISOString(),
      leafType,
      quantityKg: qty,
      direction: 'inflow',
      reason: notes.trim() ? `${sourcePlot.trim()} • ${notes.trim()}` : sourcePlot.trim() || 'Harvest from farm plot',
    };

    onSave(newMovement);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '480px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Record Fresh Forage Harvest
            </h3>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Add harvested leaf stock to update your forage runway and daily feeding buffer
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {errorMsg && (
              <div className="form-error-banner" style={{ padding: '8px 12px', fontSize: '0.78rem' }}>
                {errorMsg}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Forage Variety</label>
              <select
                value={leafType}
                onChange={(e) => setLeafType(e.target.value as LeafType)}
                className="form-control"
              >
                <option value="mulberry">Mulberry Leaves / Shoots (Kanva-2 & S-13)</option>
                <option value="castor">Castor Leaves (GRC-1 Cultivar)</option>
                <option value="kesseru">Kesseru Perennial Stand</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Harvested Quantity (kg) *</label>
              <input
                type="number"
                step="any"
                min="0.5"
                value={quantityKg}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuantityKg(val === '' ? '' : Number(val));
                }}
                className="form-control tabular-nums"
                placeholder="e.g. 25"
                required
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                {profile?.mulberryAcreage
                  ? `Based on your ${profile.mulberryAcreage} acre(s) plot (avg daily yield: ~${((profile.mulberryAcreage * 16000) / 365).toFixed(1)} kg)`
                  : 'Standard morning harvest: Pluck between 06:00 and 08:30 AM'}
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Source Plot / Field Block</label>
              <input
                type="text"
                value={sourcePlot}
                onChange={(e) => setSourcePlot(e.target.value)}
                className="form-control"
                placeholder="e.g. Mulberry Block 1 - Paired Row"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes & Harvest Quality</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-control"
                placeholder="e.g. Tender succulent shoots, cool morning harvest"
              />
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                fontSize: '0.75rem',
                color: 'var(--text-main)',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <Leaf size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span>
                Leaves added here are immediately reflected in Today's <strong>Forage Runway</strong> and available for daily feeding rations.
              </span>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={15} />
              Add to Leaf Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
