import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { Batch, FarmProfile, Species } from '../types';

interface BatchRegistrationFormProps {
  onSuccess: (batch: Batch) => void;
  onCancel?: () => void;
  isModal?: boolean;
  existingBatches?: Batch[];
  profile?: FarmProfile | null;
}

export const BatchRegistrationForm: React.FC<BatchRegistrationFormProps> = ({
  onSuccess,
  onCancel,
  isModal = false,
  existingBatches = [],
  profile,
}) => {
  const currentYear = new Date().getFullYear();

  // Helper to generate sequential lot tag
  const getNextTag = (spec: Species) => {
    const prefix = spec === 'bombyx' ? 'LOT-BM' : 'LOT-ERI';
    const matches = existingBatches
      .map((b) => b.batchTag || '')
      .filter((tag) => tag.startsWith(`${prefix}-${currentYear}`))
      .map((tag) => {
        const parts = tag.split('-');
        const num = parseInt(parts[parts.length - 1], 10);
        return isNaN(num) ? 0 : num;
      });

    const nextNum = (matches.length > 0 ? Math.max(...matches) : 0) + 1;
    return `${prefix}-${currentYear}-${String(nextNum).padStart(2, '0')}`;
  };

  // State
  const [species, setSpecies] = useState<Species>('bombyx');
  const [count, setCount] = useState<number | ''>('');
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [lotTag, setLotTag] = useState<string>(() => getNextTag('bombyx'));
  const [roomName, setRoomName] = useState<string>('Rearing House 1 - Bay A');
  const [grainageSource, setGrainageSource] = useState<string>(
    'KALRO National Sericulture Research Centre, Thika'
  );
  const [notes, setNotes] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Switch species
  const handleSpeciesChange = (newSpecies: Species) => {
    setSpecies(newSpecies);
    setLotTag(getNextTag(newSpecies));
    if (newSpecies === 'bombyx') {
      setGrainageSource('KALRO National Sericulture Research Centre, Thika');
    } else {
      setGrainageSource('KALRO Sericulture Sub-Centre, Kibos');
    }
  };

  // Calculations
  const isBombyx = species === 'bombyx';
  const effectiveCount = typeof count === 'number' && !isNaN(count) && count > 0 ? count : 1;
  const thousands = effectiveCount / 1000.0;
  const dflCount = Math.round(effectiveCount / 400);
  const cycleDays = isBombyx ? 35 : 34;

  const totalForageKg = isBombyx ? Math.round(thousands * 20) : Math.round(thousands * 18);
  const peakDailyFeedKg = isBombyx ? Number((thousands * 1.8).toFixed(1)) : Number((thousands * 1.6).toFixed(1));
  const estYieldKg = isBombyx ? Number((thousands * 1.9).toFixed(1)) : Number((thousands * 1.7).toFixed(1));
  const bedSpaceM2 = Number((thousands * 1.1).toFixed(1));

  // Harvest Date
  const startObj = new Date(startDate || new Date().toISOString().split('T')[0]);
  const harvestObj = new Date(startObj);
  harvestObj.setDate(startObj.getDate() + cycleDays);
  const harvestDateFormatted = harvestObj.toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCount = typeof count === 'number' && count > 0 ? count : 400;

    const defaultDisplayName = isBombyx
      ? `CSR2 × CSR4 Bivoltine (${finalCount.toLocaleString()} eggs)`
      : `Samia ricini Eri (${finalCount.toLocaleString()} eggs)`;

    const compiledNotes = [
      grainageSource ? `Seed Source: ${grainageSource}` : '',
      notes ? notes.trim() : '',
    ]
      .filter(Boolean)
      .join('\n');

    const newBatch: Batch = {
      id: `batch-${Date.now()}`,
      species,
      startDate,
      eggCount: finalCount,
      status: 'active',
      batchTag: lotTag.trim() || `LOT-${Date.now().toString().slice(-4)}`,
      displayTag: defaultDisplayName,
      roomName: roomName.trim() || 'Rearing House',
      notes: compiledNotes,
    };

    onSuccess(newBatch);
  };

  return (
    <form onSubmit={handleSubmit} className="simple-batch-form">
      {/* 1. Variety Selection */}
      <div className="form-card-section">
        <label className="section-label">
          <span className="step-num">1</span>
          <span>Choose Silkworm Variety</span>
        </label>
        <div className="species-grid-simple">
          <button
            type="button"
            onClick={() => handleSpeciesChange('bombyx')}
            className={`species-card-simple ${isBombyx ? 'selected bombyx' : ''}`}
          >
            <div className="species-card-content">
              <div className="species-card-head">
                <span className="species-name">Bombyx mori (Mulberry)</span>
                {isBombyx && <CheckCircle2 size={18} className="selected-icon" />}
              </div>
              <p className="species-sub">
                Bivoltine hybrid (CSR2 × CSR4). Produces uniform reelable white silk. Standard 35-day cycle.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSpeciesChange('eri')}
            className={`species-card-simple ${!isBombyx ? 'selected eri' : ''}`}
          >
            <div className="species-card-content">
              <div className="species-card-head">
                <span className="species-name">Eri Silkworm (Castor)</span>
                {!isBombyx && <CheckCircle2 size={18} className="selected-icon eri" />}
              </div>
              <p className="species-sub">
                Samia ricini fed on Castor or Kesseru. Hardy thermal spun cocoons. 34-day rearing cycle.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Batch Quantity & Timing */}
      <div className="form-card-section">
        <label className="section-label">
          <span className="step-num">2</span>
          <span>Batch Size & Start Date</span>
        </label>

        <div className="two-col-grid">
          <div className="input-group">
            <label className="input-label" htmlFor="eggCountInput">
              Quantity of Eggs (or Worms)
            </label>
            <div className="input-with-hint">
              <input
                id="eggCountInput"
                type="number"
                value={count}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setCount('');
                  } else {
                    const parsed = parseInt(val, 10);
                    setCount(isNaN(parsed) ? '' : parsed);
                  }
                }}
                onBlur={() => {
                  if (count === '' || count <= 0) {
                    setCount(400);
                  }
                }}
                className="simple-input tabular-nums"
                min="1"
                step="1"
                placeholder="e.g. 20000"
                required
              />
              <span className="input-sub-hint">
                ≈ {dflCount} DFLs (Disease-Free Layings @ 400 eggs/DFL)
              </span>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="startDateInput">
              Start / Hatch Date
            </label>
            <input
              id="startDateInput"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="simple-input tabular-nums"
              required
            />
            <span className="input-sub-hint">
              Sets Day 1 for feeding calendars and rearing stages
            </span>
          </div>
        </div>
      </div>

      {/* 3. Batch Identification & Bay */}
      <div className="form-card-section">
        <label className="section-label">
          <span className="step-num">3</span>
          <span>Batch Code & Bay Location</span>
        </label>

        <div className="two-col-grid">
          <div className="input-group">
            <label className="input-label" htmlFor="lotTagInput">
              Batch Code / Tag
            </label>
            <input
              id="lotTagInput"
              type="text"
              value={lotTag}
              onChange={(e) => setLotTag(e.target.value)}
              className="simple-input"
              placeholder="e.g. LOT-BM-2026-01"
              required
            />
            <span className="input-sub-hint">Appears on tray tags, QR barcodes, and daily logs</span>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label" htmlFor="roomNameInput" style={{ margin: 0 }}>
                Rearing Chamber / Bay
              </label>
              {profile && (
                <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                  {profile.houseCount} {profile.houseCount === 1 ? 'House' : 'Houses'} Registered
                </span>
              )}
            </div>
            <input
              id="roomNameInput"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="simple-input"
              placeholder="e.g. Rearing House 1 - Bay A"
              required
            />
            {profile && profile.houseCount > 1 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                {Array.from({ length: Math.min(profile.houseCount, 4) }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRoomName(`Rearing House ${i + 1} - Bay A`)}
                    className="roadmap-tag-pill"
                    style={{ fontSize: '0.7rem', padding: '2px 8px', cursor: 'pointer' }}
                  >
                    House {i + 1}
                  </button>
                ))}
              </div>
            )}
            <span className="input-sub-hint">Physical room where trays are housed</span>
          </div>
        </div>
      </div>

      {/* Instant Harvest & Feed Forecast Banner */}
      <div className="forecast-banner">
        <div className="forecast-banner-header">
          <span className="forecast-title">Instant Rearing Forecast for this Batch</span>
        </div>
        <div className="forecast-grid">
          <div className="forecast-item">
            <div className="forecast-item-label">Target Harvest</div>
            <div className="forecast-item-value tabular-nums">{estYieldKg} kg</div>
            <div className="forecast-item-sub">Grade A green cocoons (at 85% survival)</div>
          </div>

          <div className="forecast-item">
            <div className="forecast-item-label">Total Leaf Demand</div>
            <div className="forecast-item-value tabular-nums">{totalForageKg} kg</div>
            <div className="forecast-item-sub">Peak ration: {peakDailyFeedKg} kg/day in 5th instar</div>
          </div>

          <div className="forecast-item">
            <div className="forecast-item-label">Harvest Date</div>
            <div className="forecast-item-value tabular-nums">{harvestDateFormatted}</div>
            <div className="forecast-item-sub">{cycleDays} days total cycle · Need {bedSpaceM2} m² bed space</div>
          </div>
        </div>

        {profile && (
          <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-divider)', fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <span>
              🌾 Farm Forage Check: <strong>{profile.mulberryAcreage || 1} acre(s)</strong> at {profile.orgName} (Annual forage: ~{((profile.mulberryAcreage || 1) * 16000).toLocaleString()} kg)
            </span>
            <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>
              ✓ Farm supports this batch demand ({totalForageKg} kg)
            </span>
          </div>
        )}
      </div>

      {/* 4. Optional Advanced Details (Collapsed by Default) */}
      <div className="advanced-toggle-wrapper">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="advanced-toggle-btn"
        >
          <span>{showAdvanced ? 'Hide Additional Details' : '+ Add Seed Source & Notes (Optional)'}</span>
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAdvanced && (
          <div className="advanced-section-content">
            <div className="input-group">
              <label className="input-label" htmlFor="grainageInput">
                Grainage Seed Producer / Source
              </label>
              <input
                id="grainageInput"
                type="text"
                value={grainageSource}
                onChange={(e) => setGrainageSource(e.target.value)}
                className="simple-input"
                placeholder="e.g. KALRO National Sericulture Research Centre, Thika"
              />
            </div>

            <div className="input-group" style={{ marginTop: '0.75rem' }}>
              <label className="input-label" htmlFor="notesInput">
                Agronomic Notes (Optional)
              </label>
              <textarea
                id="notesInput"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="simple-input"
                rows={2}
                placeholder="Disinfection details, tray numbers, leaf plot reference..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Form Action Controls */}
      <div className="simple-form-actions">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary simple-btn">
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary simple-btn-submit">
          {isModal ? 'Save & Start Batch' : 'Register Batch & Begin Rearing →'}
        </button>
      </div>
    </form>
  );
};
