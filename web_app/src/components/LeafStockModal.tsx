import React, { useState } from 'react';
import { X, Leaf, Plus } from 'lucide-react';
import { LeafMovement, LeafType, FarmProfile } from '../types';
import { KENYA_MULBERRY_CULTIVARS, KENYA_CASTOR_VARIETIES } from '../constants';

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
  const [cultivar, setCultivar] = useState<string>('S-13');
  const [quantityKg, setQuantityKg] = useState<number | ''>(25);
  const [sourcePlot, setSourcePlot] = useState<string>(
    profile?.orgName ? `${profile.orgName} - Block A` : 'Station Orchard Block A'
  );
  const [notes, setNotes] = useState<string>('Morning harvest, high leaf moisture (74%)');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTypeChange = (newType: LeafType) => {
    setLeafType(newType);
    if (newType === 'mulberry') {
      setCultivar('S-13');
    } else if (newType === 'castor') {
      setCultivar('GRC-1');
    } else {
      setCultivar('Heteropanax fragrans');
    }
  };

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
      cultivar,
      quantityKg: qty,
      direction: 'inflow',
      reason: notes.trim()
        ? `${cultivar} (${sourcePlot.trim()}) • ${notes.trim()}`
        : `${cultivar} harvest from ${sourcePlot.trim()}`,
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
              Record Forage Leaf Harvest
            </h3>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Add freshly harvested mulberry or castor stock to update station forage stockpile
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

            {/* Forage Host Species */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Host Plant Category</label>
              <select
                value={leafType}
                onChange={(e) => handleTypeChange(e.target.value as LeafType)}
                className="form-control"
              >
                <option value="mulberry">Mulberry (Morus alba / Morus indica)</option>
                <option value="castor">Castor (Ricinus communis - Eri host)</option>
                <option value="kesseru">Kesseru (Heteropanax fragrans - Eri perennial)</option>
              </select>
            </div>

            {/* Cultivar / Variety Picker */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                {leafType === 'mulberry' ? 'Mulberry Cultivar' : leafType === 'castor' ? 'Castor Variety' : 'Perennial Stand'}
              </label>
              {leafType === 'mulberry' ? (
                <select
                  value={cultivar}
                  onChange={(e) => setCultivar(e.target.value)}
                  className="form-control"
                >
                  {KENYA_MULBERRY_CULTIVARS.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name} — {c.use} ({c.leafQuality})
                    </option>
                  ))}
                </select>
              ) : leafType === 'castor' ? (
                <select
                  value={cultivar}
                  onChange={(e) => setCultivar(e.target.value)}
                  className="form-control"
                >
                  {KENYA_CASTOR_VARIETIES.map((v) => (
                    <option key={v.code} value={v.name}>
                      {v.name} — {v.use}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={cultivar}
                  readOnly
                  className="form-control"
                  style={{ backgroundColor: 'var(--bg-subtle)' }}
                />
              )}
            </div>

            {/* Quantity Input */}
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
                Standard harvest schedule: Pluck early morning (06:00 – 08:30) to preserve leaf moisture content.
              </span>
            </div>

            {/* Source Plot */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Station Plot / Field Block</label>
              <input
                type="text"
                value={sourcePlot}
                onChange={(e) => setSourcePlot(e.target.value)}
                className="form-control"
                placeholder="e.g. Mulberry Block 1 - Paired Row"
              />
            </div>

            {/* Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Harvest Notes & Moisture Assessment</label>
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
                Harvested {cultivar} is added directly to the station stockpile and stamped in the Staff Audit Ledger.
              </span>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={15} />
              Add to Stockpile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
