import React, { useState } from 'react';
import { Plus, Leaf, Activity, Thermometer, Award } from 'lucide-react';
import { Language, TRANSLATIONS } from '../translations';
import { Batch, CocoonHarvest, EnvironmentLog, FeedLog, LeafType, MortalityLog } from '../types';

interface QuickLogModalProps {
  batches: Batch[];
  initialBatchId?: string;
  defaultType?: 'feed' | 'mortality' | 'climate' | 'harvest';
  lang: Language;
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
  lang,
  onClose,
  onSaveFeed,
  onSaveMortality,
  onSaveClimate,
  onSaveHarvest,
}) => {
  const t = TRANSLATIONS[lang];
  const activeBatches = batches.filter((b) => b.status === 'active');
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    initialBatchId || (activeBatches.length > 0 ? activeBatches[0].id : batches[0]?.id || '')
  );
  const [logType, setLogType] = useState<'feed' | 'mortality' | 'climate' | 'harvest'>(defaultType);

  // Feed state
  const [feedGrams, setFeedGrams] = useState<number>(5000);
  const [leafType, setLeafType] = useState<LeafType>('mulberry');
  const [wasSkipped, setWasSkipped] = useState<boolean>(false);
  const [skipReason, setSkipReason] = useState<string>('Moult rest period');

  // Mortality state
  const [lossCount, setLossCount] = useState<number>(10);
  const [lossCause, setLossCause] = useState<string>('Heat stress');
  const [symptoms, setSymptoms] = useState<string>('Sluggish movement');

  // Climate state
  const [temp, setTemp] = useState<number>(25.5);
  const [hum, setHum] = useState<number>(75);
  const [ventilation, setVentilation] = useState<'optimal' | 'low' | 'excessive'>('optimal');

  // Harvest state
  const [cocoonCount, setCocoonCount] = useState<number>(25000);
  const [totalWeightGrams, setTotalWeightGrams] = useState<number>(45000);
  const [shellWeightGrams, setShellWeightGrams] = useState<number>(36.0); // 20 shell sample weight
  const [defectiveCount, setDefectiveCount] = useState<number>(800);
  const [reeledGrams, setReeledGrams] = useState<number>(6400);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;

    const now = new Date().toISOString();

    if (logType === 'feed') {
      onSaveFeed({
        id: `fl-${Date.now()}`,
        batchId: selectedBatchId,
        recordedAt: now,
        quantityGrams: wasSkipped ? 0 : Number(feedGrams),
        leafType,
        wasSkipped,
        skippedReason: wasSkipped ? skipReason : undefined,
      });
    } else if (logType === 'mortality') {
      onSaveMortality({
        id: `ml-${Date.now()}`,
        batchId: selectedBatchId,
        recordedAt: now,
        count: Number(lossCount),
        cause: lossCause,
        symptoms,
      });
    } else if (logType === 'climate') {
      onSaveClimate({
        id: `el-${Date.now()}`,
        batchId: selectedBatchId,
        recordedAt: now,
        temperatureCelsius: Number(temp),
        humidityPercent: Number(hum),
        ventilationStatus: ventilation,
      });
    } else if (logType === 'harvest') {
      onSaveHarvest({
        id: `ch-${Date.now()}`,
        batchId: selectedBatchId,
        harvestDate: now.split('T')[0],
        cocoonCount: Number(cocoonCount),
        totalWeightGrams: Number(totalWeightGrams),
        shellWeightGrams: Number(shellWeightGrams),
        defectiveCount: Number(defectiveCount),
        reeledWeightGrams: Number(reeledGrams),
      });
    }

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} color="var(--primary-green)" />
            <span>Quick Farm Logging</span>
          </h3>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        {/* Log Type Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[
            { key: 'feed', label: t.logFeed, icon: <Leaf size={15} /> },
            { key: 'mortality', label: t.logMortality, icon: <Activity size={15} /> },
            { key: 'climate', label: t.logClimate, icon: <Thermometer size={15} /> },
            { key: 'harvest', label: t.logHarvest, icon: <Award size={15} /> },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setLogType(item.key as any)}
              style={{
                flex: 1,
                background: logType === item.key ? 'var(--primary-green)' : 'var(--background)',
                color: logType === item.key ? '#ffffff' : 'var(--text-dark)',
                border: '1px solid var(--card-border)',
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Batch Selector */}
          <div className="form-group">
            <label className="form-label">{t.selectBatch}</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="form-control"
              required
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.displayTag || b.batchTag || b.id} ({b.species === 'bombyx' ? 'Bombyx' : 'Eri'} - {b.status})
                </option>
              ))}
            </select>
          </div>

          {/* Type 1: Feed Form */}
          {logType === 'feed' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t.feedGrams}</label>
                  <input
                    type="number"
                    value={feedGrams}
                    onChange={(e) => setFeedGrams(Number(e.target.value))}
                    className="form-control"
                    min="100"
                    step="100"
                    disabled={wasSkipped}
                    required={!wasSkipped}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t.leafType}</label>
                  <select
                    value={leafType}
                    onChange={(e) => setLeafType(e.target.value as LeafType)}
                    className="form-control"
                    disabled={wasSkipped}
                  >
                    <option value="mulberry">Mulberry (Mkuyu)</option>
                    <option value="castor">Castor (Mbarika)</option>
                    <option value="kesseru">Kesseru</option>
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
                <label htmlFor="skipCheck" style={{ fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                  {t.wasSkipped} (e.g. Moult rest or fasting)
                </label>
              </div>

              {wasSkipped && (
                <div className="form-group">
                  <label className="form-label">{t.skipReason}</label>
                  <input
                    type="text"
                    value={skipReason}
                    onChange={(e) => setSkipReason(e.target.value)}
                    className="form-control"
                    placeholder="e.g. Larvae in moult rest period"
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* Type 2: Mortality Form */}
          {logType === 'mortality' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t.lossCount}</label>
                  <input
                    type="number"
                    value={lossCount}
                    onChange={(e) => setLossCount(Number(e.target.value))}
                    className="form-control"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t.probableCause}</label>
                  <select
                    value={lossCause}
                    onChange={(e) => setLossCause(e.target.value)}
                    className="form-control"
                  >
                    <option value="Heat stress / Crowding">Heat stress / Crowding</option>
                    <option value="Grasserie (NPV)">Grasserie (NPV)</option>
                    <option value="Flacherie (IFV)">Flacherie (IFV)</option>
                    <option value="Pebrine">Pebrine</option>
                    <option value="Muscardine">Muscardine</option>
                    <option value="Uzi fly">Uzi fly</option>
                    <option value="Bed cleaning injury">Bed cleaning injury</option>
                    <option value="Unknown">Unknown / Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t.notes}</label>
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="form-control"
                  placeholder="e.g. Swollen shiny larvae, removed promptly"
                />
              </div>
            </div>
          )}

          {/* Type 3: Climate Form */}
          {logType === 'climate' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t.temperature}</label>
                  <input
                    type="number"
                    value={temp}
                    onChange={(e) => setTemp(Number(e.target.value))}
                    className="form-control"
                    step="0.1"
                    min="15"
                    max="40"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t.humidity}</label>
                  <input
                    type="number"
                    value={hum}
                    onChange={(e) => setHum(Number(e.target.value))}
                    className="form-control"
                    min="30"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ventilation Status</label>
                <select
                  value={ventilation}
                  onChange={(e) => setVentilation(e.target.value as any)}
                  className="form-control"
                >
                  <option value="optimal">Optimal Airflow</option>
                  <option value="low">Low Ventilation (Stagnant)</option>
                  <option value="excessive">High Draft / Dry Air</option>
                </select>
              </div>
            </div>
          )}

          {/* Type 4: Harvest Form */}
          {logType === 'harvest' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t.cocoonCount}</label>
                  <input
                    type="number"
                    value={cocoonCount}
                    onChange={(e) => setCocoonCount(Number(e.target.value))}
                    className="form-control"
                    min="100"
                    step="100"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t.grossWeightGrams}</label>
                  <input
                    type="number"
                    value={totalWeightGrams}
                    onChange={(e) => setTotalWeightGrams(Number(e.target.value))}
                    className="form-control"
                    step="100"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t.sampleShellGrams}</label>
                  <input
                    type="number"
                    value={shellWeightGrams}
                    onChange={(e) => setShellWeightGrams(Number(e.target.value))}
                    className="form-control"
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Defective Cocoons (Count)</label>
                  <input
                    type="number"
                    value={defectiveCount}
                    onChange={(e) => setDefectiveCount(Number(e.target.value))}
                    className="form-control"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={onClose}
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
      </div>
    </div>
  );
};
