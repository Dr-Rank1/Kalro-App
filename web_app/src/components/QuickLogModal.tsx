import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Batch, CocoonHarvest, EnvironmentLog, FeedLog, LeafType, MortalityLog } from '../types';

interface QuickLogModalProps {
  batches: Batch[];
  initialBatchId?: string;
  defaultType?: 'feed' | 'mortality' | 'climate' | 'harvest';
  onClose: () => void;
  onSaveFeed: (log: FeedLog) => void;
  onSaveMortality: (log: MortalityLog) => void;
  onSaveClimate: (log: EnvironmentLog) => void;
  onSaveHarvest: (harvest: CocoonHarvest) => void;
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  batches,
  initialBatchId,
  defaultType = 'feed',
  onClose,
  onSaveFeed,
  onSaveMortality,
  onSaveClimate,
  onSaveHarvest,
}) => {
  if (batches.length === 0) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '440px' }}>
          <div className="modal-header">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Operational Rearing Entry</h3>
            <button onClick={onClose} className="modal-close-btn" aria-label="Close dialog">
              <X size={18} />
            </button>
          </div>
          <div className="empty-state" style={{ padding: '1.75rem 1rem' }}>
            <h4>No Silkworm Batches Available</h4>
            <p>Please register a silkworm rearing batch before logging feeding, mortality, climate, or harvest entries.</p>
            <button type="button" onClick={onClose} className="btn-primary" style={{ marginTop: '0.75rem' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeBatches = batches.filter((b) => b.status === 'active');
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    initialBatchId || (activeBatches.length > 0 ? activeBatches[0].id : batches[0]?.id || '')
  );
  const [logType, setLogType] = useState<'feed' | 'mortality' | 'climate' | 'harvest'>(defaultType);

  // Feed state - Clean empty inputs
  const [feedGrams, setFeedGrams] = useState<number | ''>('');
  const [leafType, setLeafType] = useState<LeafType>('mulberry');
  const [wasSkipped, setWasSkipped] = useState<boolean>(false);
  const [skipReason, setSkipReason] = useState<string>('');

  // Mortality state - Clean empty inputs
  const [lossCount, setLossCount] = useState<number | ''>('');
  const [lossCause, setLossCause] = useState<string>('Bed-cleaning attrition');
  const [symptoms, setSymptoms] = useState<string>('');

  // Climate state - Clean empty inputs
  const [temp, setTemp] = useState<number | ''>('');
  const [hum, setHum] = useState<number | ''>('');
  const [ventilation, setVentilation] = useState<'optimal' | 'low' | 'excessive'>('optimal');

  // Harvest state - Clean empty inputs
  const [cocoonCount, setCocoonCount] = useState<number | ''>('');
  const [totalWeightGrams, setTotalWeightGrams] = useState<number | ''>('');
  const [shellWeightGrams, setShellWeightGrams] = useState<number | ''>('');
  const [defectiveCount, setDefectiveCount] = useState<number | ''>('');
  const [reeledGrams, _setReeledGrams] = useState<number | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;

    const now = new Date().toISOString();

    if (logType === 'feed') {
      const grams = wasSkipped ? 0 : Number(feedGrams);
      if (!wasSkipped && (!grams || grams <= 0)) {
        alert('Please enter a valid feed quantity in grams.');
        return;
      }
      onSaveFeed({
        id: `fl-${Date.now()}`,
        batchId: selectedBatchId,
        recordedAt: now,
        quantityGrams: grams,
        leafType,
        wasSkipped,
        skippedReason: wasSkipped ? (skipReason.trim() || 'Moult fasting period') : undefined,
      });
    } else if (logType === 'mortality') {
      const count = Number(lossCount);
      if (!count || count <= 0) {
        alert('Please enter a valid dead larvae count.');
        return;
      }
      onSaveMortality({
        id: `ml-${Date.now()}`,
        batchId: selectedBatchId,
        recordedAt: now,
        count,
        cause: lossCause,
        symptoms: symptoms.trim() || undefined,
      });
    } else if (logType === 'climate') {
      const t = Number(temp);
      const h = Number(hum);
      if (temp === '' || isNaN(t)) {
        alert('Please enter a valid temperature.');
        return;
      }
      if (hum === '' || isNaN(h)) {
        alert('Please enter a valid humidity percentage.');
        return;
      }
      onSaveClimate({
        id: `el-${Date.now()}`,
        batchId: selectedBatchId,
        recordedAt: now,
        temperatureCelsius: t,
        humidityPercent: h,
        ventilationStatus: ventilation,
      });
    } else if (logType === 'harvest') {
      const count = Number(cocoonCount);
      const weight = Number(totalWeightGrams);
      if (!count || count <= 0 || !weight || weight <= 0) {
        alert('Please enter a valid cocoon count and total weight.');
        return;
      }
      onSaveHarvest({
        id: `ch-${Date.now()}`,
        batchId: selectedBatchId,
        harvestDate: now.split('T')[0],
        cocoonCount: count,
        totalWeightGrams: weight,
        shellWeightGrams: shellWeightGrams !== '' ? Number(shellWeightGrams) : undefined,
        defectiveCount: defectiveCount !== '' ? Number(defectiveCount) : 0,
        reeledWeightGrams: reeledGrams !== '' ? Number(reeledGrams) : undefined,
      });
    }

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            Operational Rearing Entry
          </h3>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Log Type Switcher - Clean text buttons without redundant duplicate icons */}
        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.25rem' }}>
          {[
            { key: 'feed', label: 'Feed Allocation' },
            { key: 'mortality', label: 'Larval Loss' },
            { key: 'climate', label: 'Room Climate' },
            { key: 'harvest', label: 'Cocoon Harvest' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setLogType(item.key as any)}
              style={{
                flex: 1,
                background: logType === item.key ? 'var(--primary)' : 'var(--bg-subtle)',
                color: logType === item.key ? '#ffffff' : 'var(--text-main)',
                border: '1px solid var(--border-card)',
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'background-color 0.15s ease',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Batch Selector */}
          <div className="form-group">
            <label className="form-label">Silkworm Batch Lot</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="form-control"
              required
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.displayTag || b.batchTag || b.id} ({b.species === 'bombyx' ? 'CSR2 x CSR4 Bivoltine' : 'Samia ricini'} - {b.status})
                </option>
              ))}
            </select>
          </div>

          {/* Type 1: Feed Form */}
          {logType === 'feed' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Quantity (Grams)</label>
                  <input
                    type="number"
                    value={feedGrams}
                    onChange={(e) => setFeedGrams(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-control tabular-nums"
                    placeholder="e.g. 5000"
                    min="1"
                    disabled={wasSkipped}
                    required={!wasSkipped}
                  />
                  {feedGrams !== '' && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(Number(feedGrams) / 1000).toFixed(2)} kg</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Forage Variety</label>
                  <select
                    value={leafType}
                    onChange={(e) => setLeafType(e.target.value as LeafType)}
                    className="form-control"
                    disabled={wasSkipped}
                  >
                    <option value="mulberry">Mulberry Shoots (Kanva-2 / S-13)</option>
                    <option value="castor">Castor Leaves (GRC-1 Cultivar)</option>
                    <option value="kesseru">Kesseru (Perennial Stand)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="skipCheck"
                  checked={wasSkipped}
                  onChange={(e) => setWasSkipped(e.target.checked)}
                />
                <label htmlFor="skipCheck" style={{ fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                  Moult Fasting / Rest Period (Zero Leaf Rations)
                </label>
              </div>

              {wasSkipped && (
                <div className="form-group">
                  <label className="form-label">Fasting Rationale</label>
                  <input
                    type="text"
                    value={skipReason}
                    onChange={(e) => setSkipReason(e.target.value)}
                    className="form-control"
                    placeholder="e.g. Larvae in 4th moult rest; dusted bed with slaked lime"
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* Type 2: Mortality Form */}
          {logType === 'mortality' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Dead Larvae Count</label>
                  <input
                    type="number"
                    value={lossCount}
                    onChange={(e) => setLossCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-control tabular-nums"
                    placeholder="e.g. 15"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Suspected Causal Factor</label>
                  <select
                    value={lossCause}
                    onChange={(e) => setLossCause(e.target.value)}
                    className="form-control"
                  >
                    <option value="Bed-cleaning attrition">Bed-cleaning mechanical attrition</option>
                    <option value="Heat stress / Tray crowding">Heat stress / Tray crowding</option>
                    <option value="Grasserie (BmNPV)">Grasserie (BmNPV)</option>
                    <option value="Flacherie (Bacterial dysentery)">Flacherie (Bacterial dysentery)</option>
                    <option value="White Muscardine (Beauveria)">White Muscardine (Beauveria)</option>
                    <option value="Pebrine (Nosema bombycis)">Pebrine (Nosema bombycis)</option>
                    <option value="Uzi fly parasitism">Uzi fly parasitism</option>
                    <option value="Unknown">Other / Physiological</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Symptoms / Integument Signs</label>
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="form-control"
                  placeholder="e.g. Swollen intersegmental membranes, chalky spots, flaccid cadaver"
                />
              </div>
            </div>
          )}

          {/* Type 3: Climate Form */}
          {logType === 'climate' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Dry Bulb Temperature (°C)</label>
                  <input
                    type="number"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-control tabular-nums"
                    placeholder="e.g. 25.0"
                    step="0.1"
                    min="15"
                    max="40"
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target: 24.0 - 26.0°C</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Relative Humidity (%)</label>
                  <input
                    type="number"
                    value={hum}
                    onChange={(e) => setHum(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-control tabular-nums"
                    placeholder="e.g. 75"
                    min="30"
                    max="100"
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target: 70 - 80%</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ventilation Status</label>
                <select
                  value={ventilation}
                  onChange={(e) => setVentilation(e.target.value as any)}
                  className="form-control"
                >
                  <option value="optimal">Optimal Airflow (Cross-draft active)</option>
                  <option value="low">Low Airflow (Stagnant moist air)</option>
                  <option value="excessive">High Draft (Rapid leaf desiccation risk)</option>
                </select>
              </div>
            </div>
          )}

          {/* Type 4: Harvest Form */}
          {logType === 'harvest' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Total Green Cocoon Count</label>
                  <input
                    type="number"
                    value={cocoonCount}
                    onChange={(e) => setCocoonCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-control tabular-nums"
                    placeholder="e.g. 35000"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gross Harvest Weight (Grams)</label>
                  <input
                    type="number"
                    value={totalWeightGrams}
                    onChange={(e) => setTotalWeightGrams(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-control tabular-nums"
                    placeholder="e.g. 68000"
                    min="1"
                    required
                  />
                  {totalWeightGrams !== '' && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(Number(totalWeightGrams) / 1000).toFixed(2)} kg</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">20-Shell Sample Weight (Grams)</label>
                  <input
                    type="number"
                    value={shellWeightGrams}
                    onChange={(e) => setShellWeightGrams(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-control tabular-nums"
                    placeholder="e.g. 38.5"
                    step="0.1"
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Used to compute commercial Shell Ratio %</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Defective Cocoons (Count)</label>
                  <input
                    type="number"
                    value={defectiveCount}
                    onChange={(e) => setDefectiveCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-control tabular-nums"
                    placeholder="e.g. 500"
                    min="0"
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Double, stained, flimsy, or uzi-pierced</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-accent">
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
