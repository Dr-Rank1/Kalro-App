import React, { useState, useEffect } from 'react';
import {
  X,
  Leaf,
  AlertTriangle,
  Thermometer,
  Package,
  Check,
  Droplets,
  Wind,
  ShieldAlert,
  Info,
  Clock,
} from 'lucide-react';
import {
  Batch,
  CocoonHarvest,
  EnvironmentLog,
  FeedLog,
  LeafType,
  MortalityLog,
} from '../types';
import { getCurrentStage } from '../utils';

interface QuickLogModalProps {
  batches: Batch[];
  feedLogs?: FeedLog[];
  mortalityLogs?: MortalityLog[];
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
  feedLogs = [],
  mortalityLogs = [],
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
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content quick-log-modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Operational Rearing Entry</h3>
            <button onClick={onClose} className="modal-close-btn" aria-label="Close dialog">
              <X size={18} />
            </button>
          </div>
          <div className="empty-state" style={{ padding: '1.75rem 1rem', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 700 }}>No Silkworm Batches Available</h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Please register or start a rearing batch before logging feeding, mortality, climate, or harvest entries.
            </p>
            <button type="button" onClick={onClose} className="btn-primary" style={{ marginTop: '1.25rem' }}>
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected Batch Context
  const selectedBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];
  const currentStage = selectedBatch ? getCurrentStage(selectedBatch) : null;

  // Feed State
  const [feedUnit, setFeedUnit] = useState<'kg' | 'g'>('kg');
  const [feedAmount, setFeedAmount] = useState<number | ''>('');
  const [leafType, setLeafType] = useState<LeafType>(
    selectedBatch?.species === 'eri' ? 'castor' : 'mulberry'
  );
  const [feedingShift, setFeedingShift] = useState<'morning' | 'midday' | 'evening'>('morning');
  const [wasSkipped, setWasSkipped] = useState<boolean>(false);
  const [skipReason, setSkipReason] = useState<string>('');

  // Loss / Mortality State
  const [lossCount, setLossCount] = useState<number | ''>('');
  const [lossCause, setLossCause] = useState<string>('Bed-cleaning mechanical attrition');
  const [symptoms, setSymptoms] = useState<string>('');

  // Climate State
  const [temp, setTemp] = useState<number | ''>(25.0);
  const [hum, setHum] = useState<number | ''>(78);
  const [ventilation, setVentilation] = useState<'optimal' | 'low' | 'excessive'>('optimal');

  // Harvest State
  const [harvestWeightUnit, setHarvestWeightUnit] = useState<'kg' | 'g'>('kg');
  const [cocoonCount, setCocoonCount] = useState<number | ''>('');
  const [harvestWeight, setHarvestWeight] = useState<number | ''>('');
  const [shellWeightGrams, setShellWeightGrams] = useState<number | ''>('');
  const [defectiveCount, setDefectiveCount] = useState<number | ''>('');

  // Auto-switch leaf variety when batch changes
  useEffect(() => {
    if (selectedBatch) {
      if (selectedBatch.species === 'eri') {
        setLeafType('castor');
      } else {
        setLeafType('mulberry');
      }
    }
  }, [selectedBatchId]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!selectedBatchId) {
      setErrorMessage('Please select a silkworm batch.');
      return;
    }

    const now = new Date().toISOString();

    if (logType === 'feed') {
      let finalGrams = 0;
      if (!wasSkipped) {
        if (feedAmount === '' || Number(feedAmount) <= 0) {
          setErrorMessage('Please enter a valid feed quantity.');
          return;
        }
        finalGrams = feedUnit === 'kg' ? Math.round(Number(feedAmount) * 1000) : Number(feedAmount);
      }

      onSaveFeed({
        id: `fl-${Date.now()}`,
        batchId: selectedBatchId,
        recordedAt: now,
        quantityGrams: finalGrams,
        leafType,
        wasSkipped,
        skippedReason: wasSkipped
          ? (skipReason.trim() || `${currentStage?.name || 'Moult'} fasting rest; bed dusted with dry slaked lime`)
          : undefined,
      });
    } else if (logType === 'mortality') {
      const count = Number(lossCount);
      if (lossCount === '' || !count || count <= 0) {
        setErrorMessage('Please enter the dead larvae count.');
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
        setErrorMessage('Please enter a valid temperature (°C).');
        return;
      }
      if (hum === '' || isNaN(h)) {
        setErrorMessage('Please enter a valid relative humidity (%).');
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
      const rawWeight = Number(harvestWeight);
      if (!count || count <= 0) {
        setErrorMessage('Please enter the total cocoon count.');
        return;
      }
      if (!rawWeight || rawWeight <= 0) {
        setErrorMessage('Please enter the gross harvest weight.');
        return;
      }

      const totalWeightInGrams =
        harvestWeightUnit === 'kg' ? Math.round(rawWeight * 1000) : rawWeight;

      onSaveHarvest({
        id: `ch-${Date.now()}`,
        batchId: selectedBatchId,
        harvestDate: now.split('T')[0],
        cocoonCount: count,
        totalWeightGrams: totalWeightInGrams,
        shellWeightGrams: shellWeightGrams !== '' ? Number(shellWeightGrams) : undefined,
        defectiveCount: defectiveCount !== '' ? Number(defectiveCount) : 0,
      });
    }

    onClose();
  };

  // Live Climate Assessment
  const tempNum = Number(temp);
  const humNum = Number(hum);
  const isClimateOptimal =
    tempNum >= 24 && tempNum <= 26.5 && humNum >= 70 && humNum <= 85;

  // Live Harvest Calculation
  const harvestWeightGrams =
    harvestWeight !== '' ? (harvestWeightUnit === 'kg' ? Number(harvestWeight) * 1000 : Number(harvestWeight)) : 0;
  const avgCocoonWeight =
    cocoonCount !== '' && Number(cocoonCount) > 0 && harvestWeightGrams > 0
      ? harvestWeightGrams / Number(cocoonCount)
      : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content quick-log-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ paddingBottom: '0.85rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Operational Rearing Log
            </h3>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Record feeding, larval health, chamber temperature, or harvest
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* 4-Tab Switcher */}
        <div className="log-tab-row">
          <button
            type="button"
            className={`log-tab-btn ${logType === 'feed' ? 'active' : ''}`}
            onClick={() => { setLogType('feed'); setErrorMessage(null); }}
          >
            <Leaf size={14} />
            <span>Feed</span>
          </button>
          <button
            type="button"
            className={`log-tab-btn ${logType === 'mortality' ? 'active' : ''}`}
            onClick={() => { setLogType('mortality'); setErrorMessage(null); }}
          >
            <AlertTriangle size={14} />
            <span>Loss</span>
          </button>
          <button
            type="button"
            className={`log-tab-btn ${logType === 'climate' ? 'active' : ''}`}
            onClick={() => { setLogType('climate'); setErrorMessage(null); }}
          >
            <Thermometer size={14} />
            <span>Climate</span>
          </button>
          <button
            type="button"
            className={`log-tab-btn ${logType === 'harvest' ? 'active' : ''}`}
            onClick={() => { setLogType('harvest'); setErrorMessage(null); }}
          >
            <Package size={14} />
            <span>Harvest</span>
          </button>
        </div>

        {errorMessage && (
          <div className="log-error-banner">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Selected Batch */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ margin: 0 }}>Silkworm Batch</label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {activeBatches.length} active lot{activeBatches.length === 1 ? '' : 's'}
              </span>
            </div>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="form-control"
              required
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.displayTag || b.batchTag || b.id} ({b.species === 'bombyx' ? 'Bombyx mori' : 'Eri Silkworm'} - {b.status})
                </option>
              ))}
            </select>
          </div>

          {/* TAB 1: FEED ALLOCATION */}
          {logType === 'feed' && (
            <div>
              {/* Fasting / Moult Checkbox */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: wasSkipped ? '#fff9e6' : 'var(--bg-subtle)',
                  border: wasSkipped ? '1px solid #ffeeba' : '1px solid var(--border-subtle)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                  cursor: 'pointer',
                }}
                onClick={() => setWasSkipped(!wasSkipped)}
              >
                <input
                  type="checkbox"
                  id="skipMoultCheck"
                  checked={wasSkipped}
                  onChange={(e) => setWasSkipped(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                />
                <label
                  htmlFor="skipMoultCheck"
                  style={{ fontSize: '0.78rem', fontWeight: 600, color: wasSkipped ? '#856404' : 'var(--text-main)', cursor: 'pointer', margin: 0 }}
                >
                  Moult Fasting / Zero Rations Day (Silkworms resting in moult)
                </label>
              </div>

              {!wasSkipped ? (
                <>
                  {/* Quantity with Unit Switcher */}
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label className="form-label" style={{ margin: 0 }}>Feed Quantity *</label>
                      <div className="unit-toggle-group">
                        <button
                          type="button"
                          className={`unit-toggle-btn ${feedUnit === 'kg' ? 'active' : ''}`}
                          onClick={() => {
                            if (feedUnit === 'g' && feedAmount !== '') {
                              setFeedAmount(Number((Number(feedAmount) / 1000).toFixed(2)));
                            }
                            setFeedUnit('kg');
                          }}
                        >
                          kg
                        </button>
                        <button
                          type="button"
                          className={`unit-toggle-btn ${feedUnit === 'g' ? 'active' : ''}`}
                          onClick={() => {
                            if (feedUnit === 'kg' && feedAmount !== '') {
                              setFeedAmount(Math.round(Number(feedAmount) * 1000));
                            }
                            setFeedUnit('g');
                          }}
                        >
                          grams
                        </button>
                      </div>
                    </div>

                    <input
                      type="number"
                      step={feedUnit === 'kg' ? '0.1' : '10'}
                      min="0.1"
                      value={feedAmount}
                      onChange={(e) => setFeedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="form-control tabular-nums"
                      placeholder={feedUnit === 'kg' ? 'e.g. 2.5' : 'e.g. 2500'}
                      required
                    />
                  </div>

                  {/* Forage Variety & Feeding Shift */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Forage Variety</label>
                      <select
                        value={leafType}
                        onChange={(e) => setLeafType(e.target.value as LeafType)}
                        className="form-control"
                      >
                        <option value="mulberry">Mulberry Shoots (Kanva-2 & S-13)</option>
                        <option value="castor">Castor Leaves (GRC-1 Cultivar)</option>
                        <option value="kesseru">Kesseru Perennial Stand</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Feeding Shift</label>
                      <select
                        value={feedingShift}
                        onChange={(e) => setFeedingShift(e.target.value as any)}
                        className="form-control"
                      >
                        <option value="morning">🌅 Morning Feed (07:30)</option>
                        <option value="midday">☀️ Midday Feed (12:30)</option>
                        <option value="evening">🌙 Evening Ration (18:00)</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label className="form-label">Fasting / Resting Reason</label>
                  <input
                    type="text"
                    value={skipReason}
                    onChange={(e) => setSkipReason(e.target.value)}
                    className="form-control"
                    placeholder="e.g. 4th Moult rest; dusted bed with dry slaked lime"
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Standard protocol: Withhold all leaf feed for 24–36 hours until all worms shed head capsule.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LARVAL LOSS / MORTALITY */}
          {logType === 'mortality' && (
            <div>
              {/* Dead Count */}
              <div className="form-group">
                <label className="form-label">Dead Larvae Count *</label>
                <input
                  type="number"
                  min="1"
                  value={lossCount}
                  onChange={(e) => setLossCount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="form-control tabular-nums"
                  placeholder="e.g. 12"
                  required
                />
              </div>

              {/* Suspected Cause */}
              <div className="form-group">
                <label className="form-label">Suspected Causal Factor</label>
                <select
                  value={lossCause}
                  onChange={(e) => setLossCause(e.target.value)}
                  className="form-control"
                >
                  <option value="Bed-cleaning mechanical attrition">🧹 Handling / Bed-cleaning mechanical attrition</option>
                  <option value="Heat stress / Tray crowding">☀️ Heat stress / Overcrowded trays</option>
                  <option value="White Muscardine (Beauveria)">🍄 White Muscardine (Beauveria fungus - Chalky)</option>
                  <option value="Flacherie (Bacterial dysentery)">🦠 Flacherie (Bacterial dysentery - Soft cadaver)</option>
                  <option value="Grasserie (BmNPV)">⚠️ Grasserie (Nuclear Polyhedrosis - Milky skin)</option>
                  <option value="Uzi fly parasitism">🪰 Uzi fly parasitism (Black scar marks)</option>
                  <option value="Unknown">❓ Other / Unknown physiological cause</option>
                </select>

                {/* Practical First-Aid Tip for Sericulture */}
                {lossCause.includes('Muscardine') && (
                  <div className="disease-tip-callout">
                    <strong>🍄 Muscardine First Aid:</strong> Remove cadavers with forceps. Dust bed with <strong>97:3 dry slaked lime & bleaching powder</strong>. Ventilate rearing house to lower humidity below 75%.
                  </div>
                )}
                {lossCause.includes('Flacherie') && (
                  <div className="disease-tip-callout">
                    <strong>🦠 Flacherie First Aid:</strong> Withhold wet or soiled leaves. Provide semi-mature, dry leaves. Increase air circulation to prevent tray fermentation.
                  </div>
                )}
                {lossCause.includes('Heat stress') && (
                  <div className="disease-tip-callout">
                    <strong>☀️ Heat Stress First Aid:</strong> Expand tray space immediately (20% more bed area). Moisten gunny bags on windows or floor to lower room temperature below 27°C.
                  </div>
                )}
                {lossCause.includes('Uzi fly') && (
                  <div className="disease-tip-callout">
                    <strong>🪰 Uzi Fly First Aid:</strong> Inspect wire mesh netting on all doors and windows. Hang uzicide sticky traps at rearing room entrances.
                  </div>
                )}
              </div>

              {/* Symptoms */}
              <div className="form-group">
                <label className="form-label">Observed Symptoms (Optional)</label>
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="form-control"
                  placeholder="e.g. Swollen intersegmental membranes, flaccid cadaver, chalky white fungus"
                />
              </div>
            </div>
          )}

          {/* TAB 3: ROOM CLIMATE */}
          {logType === 'climate' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {/* Dry Bulb Temp */}
                <div className="form-group">
                  <label className="form-label">Dry Bulb Temperature (°C) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="15"
                    max="40"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-control tabular-nums"
                    placeholder="e.g. 25.0"
                    required
                  />
                </div>

                {/* Relative Humidity */}
                <div className="form-group">
                  <label className="form-label">Relative Humidity (%) *</label>
                  <input
                    type="number"
                    min="30"
                    max="100"
                    value={hum}
                    onChange={(e) => setHum(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-control tabular-nums"
                    placeholder="e.g. 78"
                    required
                  />
                </div>
              </div>

              {/* Real-time Status Feedback */}
              <div className={`climate-status-feedback ${isClimateOptimal ? 'optimal' : 'warning'}`}>
                {isClimateOptimal ? (
                  <>
                    <Check size={14} />
                    <span>Optimal Rearing Range: 24–26.5°C & 70–85% RH</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={14} />
                    <span>
                      {tempNum > 27
                        ? 'Chamber Too Warm (>27°C): Moisten burlap curtains or open louvers.'
                        : tempNum < 23
                        ? 'Chamber Too Cool (<23°C): Close night drafts to maintain feeding activity.'
                        : humNum < 70
                        ? 'Low Humidity (<70%): Leaves will dry too fast. Mist floor burlap.'
                        : 'Deviation from standard rearing targets.'}
                    </span>
                  </>
                )}
              </div>

              {/* Ventilation */}
              <div className="form-group" style={{ marginTop: '0.85rem' }}>
                <label className="form-label">Airflow & Ventilation</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[
                    { key: 'optimal', label: 'Optimal Cross-Draft', icon: Wind },
                    { key: 'low', label: 'Low / Stagnant Air', icon: AlertTriangle },
                    { key: 'excessive', label: 'High Draft (Drying)', icon: Wind },
                  ].map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => setVentilation(v.key as any)}
                      style={{
                        padding: '8px 6px',
                        borderRadius: 'var(--radius-sm)',
                        border: ventilation === v.key ? '2px solid var(--primary)' : '1px solid var(--border-card)',
                        background: ventilation === v.key ? 'rgba(20, 61, 43, 0.08)' : 'var(--bg-subtle)',
                        color: ventilation === v.key ? 'var(--primary)' : 'var(--text-main)',
                        fontWeight: ventilation === v.key ? 700 : 500,
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COCOON HARVEST */}
          {logType === 'harvest' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {/* Cocoon Count */}
                <div className="form-group">
                  <label className="form-label">Cocoon Count *</label>
                  <input
                    type="number"
                    min="1"
                    value={cocoonCount}
                    onChange={(e) => setCocoonCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-control tabular-nums"
                    placeholder="e.g. 3500"
                    required
                  />
                </div>

                {/* Gross Weight with Unit Switch */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Gross Weight *</label>
                    <div className="unit-toggle-group">
                      <button
                        type="button"
                        className={`unit-toggle-btn ${harvestWeightUnit === 'kg' ? 'active' : ''}`}
                        onClick={() => {
                          if (harvestWeightUnit === 'g' && harvestWeight !== '') {
                            setHarvestWeight(Number((Number(harvestWeight) / 1000).toFixed(2)));
                          }
                          setHarvestWeightUnit('kg');
                        }}
                      >
                        kg
                      </button>
                      <button
                        type="button"
                        className={`unit-toggle-btn ${harvestWeightUnit === 'g' ? 'active' : ''}`}
                        onClick={() => {
                          if (harvestWeightUnit === 'kg' && harvestWeight !== '') {
                            setHarvestWeight(Math.round(Number(harvestWeight) * 1000));
                          }
                          setHarvestWeightUnit('g');
                        }}
                      >
                        grams
                      </button>
                    </div>
                  </div>

                  <input
                    type="number"
                    step={harvestWeightUnit === 'kg' ? '0.1' : '10'}
                    min="0.1"
                    value={harvestWeight}
                    onChange={(e) => setHarvestWeight(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-control tabular-nums"
                    placeholder={harvestWeightUnit === 'kg' ? 'e.g. 6.5' : 'e.g. 6500'}
                    required
                  />

                  {/* Quality benchmark live readout */}
                  {avgCocoonWeight !== null && (
                    <div style={{ marginTop: '5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Avg Cocoon: <strong className="tabular-nums">{avgCocoonWeight.toFixed(2)} g</strong>{' '}
                      <span
                        style={{
                          fontWeight: 700,
                          color: avgCocoonWeight >= 1.8 ? 'var(--status-success)' : '#8c5d07',
                        }}
                      >
                        ({avgCocoonWeight >= 1.8 ? '✓ Grade A Benchmark' : 'Grade B Commercial'})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Defective Count & 20-Shell Sample */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Defective Cocoons (Count)</label>
                  <input
                    type="number"
                    min="0"
                    value={defectiveCount}
                    onChange={(e) => setDefectiveCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-control tabular-nums"
                    placeholder="e.g. 45"
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Double, stained, flimsy, or uzi-pierced
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">20-Shell Sample (Grams)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={shellWeightGrams}
                    onChange={(e) => setShellWeightGrams(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-control tabular-nums"
                    placeholder="e.g. 38.5"
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Used for commercial Shell Ratio %
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-divider)' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '0.55rem 1.15rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-accent"
              style={{ padding: '0.55rem 1.35rem', fontWeight: 700 }}
            >
              {logType === 'feed'
                ? (wasSkipped ? 'Save Moult Rest Entry' : 'Save Feed Allocation')
                : logType === 'mortality'
                ? 'Save Loss Record'
                : logType === 'climate'
                ? 'Save Climate Reading'
                : 'Save Cocoon Harvest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
