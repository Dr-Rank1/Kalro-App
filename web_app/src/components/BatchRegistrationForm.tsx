import React, { useState, useId } from 'react';
import {
  Layers,
  Calendar,
  Building,
  DollarSign,
  Scale,
  Sparkles,
} from 'lucide-react';
import { Batch, Species } from '../types';

interface BatchRegistrationFormProps {
  onSuccess: (batch: Batch) => void;
  onCancel?: () => void;
  isModal?: boolean;
  existingBatches?: Batch[];
}

export const BatchRegistrationForm: React.FC<BatchRegistrationFormProps> = ({
  onSuccess,
  onCancel,
  isModal = false,
  existingBatches = [],
}) => {
  const currentYear = new Date().getFullYear();

  // Helper to generate next sequential tag
  const getNextTag = (species: Species) => {
    const prefix = species === 'bombyx' ? 'LOT-BM' : 'LOT-ERI';
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
  const [count, setCount] = useState<number>(20000);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [lotTag, setLotTag] = useState<string>(() => getNextTag('bombyx'));
  const [displayTag, setDisplayTag] = useState<string>(
    'CSR2 × CSR4 Bivoltine White (Standard Box)'
  );
  const [roomName, setRoomName] = useState<string>('Rearing House 1 - Bay A');
  const [grainageSource, setGrainageSource] = useState<string>(
    'KALRO National Sericulture Research Centre, Thika'
  );
  const [notes, setNotes] = useState<string>('');
  const [activePreset, setActivePreset] = useState<string>('bivoltine_standard');

  const speciesGroupId = useId();

  // Handle preset clicks
  const applyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    if (presetKey === 'bivoltine_chawki') {
      setSpecies('bombyx');
      setCount(10000);
      setLotTag(getNextTag('bombyx'));
      setDisplayTag('CSR2 × CSR4 Bivoltine Chawki Unit');
      setRoomName('Chawki Incubation Chamber');
      setGrainageSource('KALRO National Sericulture Research Centre, Thika');
    } else if (presetKey === 'bivoltine_standard') {
      setSpecies('bombyx');
      setCount(20000);
      setLotTag(getNextTag('bombyx'));
      setDisplayTag('CSR2 × CSR4 Bivoltine Standard (1 Box)');
      setRoomName('Rearing House 1 - Bay A');
      setGrainageSource('KALRO National Sericulture Research Centre, Thika');
    } else if (presetKey === 'bivoltine_commercial') {
      setSpecies('bombyx');
      setCount(40000);
      setLotTag(getNextTag('bombyx'));
      setDisplayTag('CSR2 × CSR4 Commercial Multi-Rack (2 Boxes)');
      setRoomName('Rearing House 1 - Commercial Bay');
      setGrainageSource('KALRO NSRC Thika / ICIPE Seed Unit');
    } else if (presetKey === 'eri_standard') {
      setSpecies('eri');
      setCount(10000);
      setLotTag(getNextTag('eri'));
      setDisplayTag('Samia ricini Eri Silkworm Lot');
      setRoomName('Rearing House 2 - Castor/Kesseru Bay');
      setGrainageSource('KALRO Sericulture Sub-Centre, Kibos');
    }
  };

  // Switch species manually
  const handleSpeciesChange = (newSpecies: Species) => {
    setSpecies(newSpecies);
    setLotTag(getNextTag(newSpecies));
    if (newSpecies === 'bombyx') {
      setDisplayTag('CSR2 × CSR4 Bivoltine Lot');
      setGrainageSource('KALRO National Sericulture Research Centre, Thika');
    } else {
      setDisplayTag('Samia ricini Eri Silkworm Lot');
      setGrainageSource('KALRO Sericulture Sub-Centre, Kibos');
    }
  };

  // Biological Projections
  const thousands = count / 1000.0;
  const isBombyx = species === 'bombyx';
  const cycleDays = isBombyx ? 35 : 34;

  // Forage Budget (kg)
  const totalForageKg = isBombyx ? Math.round(thousands * 20) : Math.round(thousands * 18);
  const peakDailyFeedKg = isBombyx ? Number((thousands * 1.8).toFixed(1)) : Number((thousands * 1.6).toFixed(1));

  // Bed Space (sq. m)
  const chawkiBedAreaM2 = Number((thousands * 0.1).toFixed(1));
  const lateBedAreaM2 = Number((thousands * 1.1).toFixed(1));
  const mountagesCount = Math.round(thousands * 22.5);

  // Yield & Revenue Projections
  const estYieldKg = isBombyx ? Number((thousands * 1.9).toFixed(1)) : Number((thousands * 1.7).toFixed(1));
  const indicativePricePerKg = isBombyx ? 850 : 650;
  const projectedRevenue = Math.round(estYieldKg * indicativePricePerKg);

  // Harvest Date Calculation
  const startObj = new Date(startDate || new Date().toISOString().split('T')[0]);
  const harvestObj = new Date(startObj);
  harvestObj.setDate(startObj.getDate() + cycleDays);
  const harvestDateFormatted = harvestObj.toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Spinning Start Calculation
  const spinningObj = new Date(startObj);
  spinningObj.setDate(startObj.getDate() + (isBombyx ? 28 : 27));
  const spinningDateFormatted = spinningObj.toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!count || count <= 0) {
      alert('Please specify a valid egg / larvae count.');
      return;
    }

    const compiledNotes = [
      grainageSource ? `Grainage Seed Provider: ${grainageSource}` : '',
      notes ? notes.trim() : '',
    ]
      .filter(Boolean)
      .join('\n');

    const newBatch: Batch = {
      id: `batch-${Date.now()}`,
      species,
      startDate,
      eggCount: count,
      status: 'active',
      batchTag: lotTag.trim() || `LOT-${Date.now().toString().slice(-4)}`,
      displayTag: displayTag.trim() || `${isBombyx ? 'Bombyx mori' : 'Eri'} Lot`,
      roomName: roomName.trim() || 'Rearing House',
      notes: compiledNotes,
    };

    onSuccess(newBatch);
  };

  return (
    <form onSubmit={handleSubmit} className="batch-registration-container">
      {/* Top Presets Toolbar */}
      <div className="registration-section">
        <div className="registration-section-title">
          <Sparkles size={15} style={{ color: 'var(--accent-gold)' }} />
          <span>Quick Rearing Scale Presets (1-Click Fill)</span>
        </div>
        <div className="presets-container" style={{ marginBottom: 0 }}>
          <button
            type="button"
            onClick={() => applyPreset('bivoltine_standard')}
            className={`preset-card ${activePreset === 'bivoltine_standard' && count === 20000 && isBombyx ? 'selected' : ''}`}
          >
            <div className="preset-card-head">
              <span className="species-badge bombyx">Recommended</span>
              <span className="tabular-nums font-bold" style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>
                20,000 DFLs
              </span>
            </div>
            <h4 className="preset-card-title">Bivoltine Standard (1 Box)</h4>
            <p className="preset-card-desc">
              CSR2 × CSR4 hybrid on Kanva-2 / S-13 shoots. ~38 kg green cocoon target.
            </p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('bivoltine_commercial')}
            className={`preset-card ${activePreset === 'bivoltine_commercial' && count === 40000 && isBombyx ? 'selected' : ''}`}
          >
            <div className="preset-card-head">
              <span className="species-badge bombyx">Commercial Scale</span>
              <span className="tabular-nums font-bold" style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>
                40,000 DFLs
              </span>
            </div>
            <h4 className="preset-card-title">Commercial Double (2 Boxes)</h4>
            <p className="preset-card-desc">
              High-yield multi-rack configuration. Target: 75–80 kg Grade A cocoons.
            </p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('eri_standard')}
            className={`preset-card ${activePreset === 'eri_standard' && count === 10000 && !isBombyx ? 'selected' : ''}`}
          >
            <div className="preset-card-head">
              <span className="species-badge eri">Hardy Wild Silk</span>
              <span className="tabular-nums font-bold" style={{ fontSize: '0.78rem', color: 'var(--accent-gold)' }}>
                10,000 DFLs
              </span>
            </div>
            <h4 className="preset-card-title">Eri Silkworm (Samia ricini)</h4>
            <p className="preset-card-desc">
              Castor GRC-1 and Kesseru host. Resilient thermal spun open-ended cocoons.
            </p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('bivoltine_chawki')}
            className={`preset-card ${activePreset === 'bivoltine_chawki' && count === 10000 && isBombyx ? 'selected' : ''}`}
          >
            <div className="preset-card-head">
              <span className="species-badge bombyx">Chawki Starter</span>
              <span className="tabular-nums font-bold" style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>
                10,000 DFLs
              </span>
            </div>
            <h4 className="preset-card-title">Chawki Smallholder Lot</h4>
            <p className="preset-card-desc">
              Ideal for initial trial rearing, incubator testing, or farmer training.
            </p>
          </button>
        </div>
      </div>

      {/* Main Form & Live Projections Layout */}
      <div className="registration-columns">
        {/* Left Form Inputs */}
        <div className="registration-form-fields">
          {/* Section 1: Species Selection */}
          <div className="form-group">
            <label className="form-label">Silkworm Species & Strain</label>
            <div className="species-choice-grid">
              <div
                role="radio"
                tabIndex={0}
                aria-checked={species === 'bombyx'}
                aria-labelledby={`${speciesGroupId}-bombyx-title`}
                aria-describedby={`${speciesGroupId}-bombyx-desc`}
                onClick={() => handleSpeciesChange('bombyx')}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleSpeciesChange('bombyx');
                  }
                }}
                className={`species-choice-card ${species === 'bombyx' ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className="species-badge bombyx">Bombyx mori</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>40-Day Life Cycle</span>
                </div>
                <div id={`${speciesGroupId}-bombyx-title`} style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                  CSR2 × CSR4 Bivoltine White Hybrid
                </div>
                <div id={`${speciesGroupId}-bombyx-desc`} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Host plant: Mulberry (Kanva-2, S-13). Produces uniform high-tensile reelable commercial silk.
                </div>
              </div>

              <div
                role="radio"
                tabIndex={0}
                aria-checked={species === 'eri'}
                aria-labelledby={`${speciesGroupId}-eri-title`}
                aria-describedby={`${speciesGroupId}-eri-desc`}
                onClick={() => handleSpeciesChange('eri')}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleSpeciesChange('eri');
                  }
                }}
                className={`species-choice-card ${species === 'eri' ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className="species-badge eri">Samia ricini</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>39-Day Life Cycle</span>
                </div>
                <div id={`${speciesGroupId}-eri-title`} style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                  Eri Silkworm (Castor / Kesseru Host)
                </div>
                <div id={`${speciesGroupId}-eri-desc`} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Host plant: Castor (GRC-1). Robust multivoltine strain with open-ended thermal cocoons.
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Quantity and Start Date */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">
                Egg / Chawki Quantity (DFLs)
              </label>
              <input
                type="number"
                value={count}
                onChange={(e) => {
                  setCount(Math.max(1, parseInt(e.target.value, 10) || 0));
                  setActivePreset('custom');
                }}
                className="form-control tabular-nums"
                min="1"
                step="1000"
                required
              />
              <div className="qty-chips-row">
                {[10000, 20000, 40000, 60000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setCount(val);
                      setActivePreset('custom');
                    }}
                    className={`qty-chip tabular-nums ${count === val ? 'active' : ''}`}
                  >
                    {val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Inoculation / Hatch Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-control tabular-nums"
                required
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Day 0 baseline for microclimate & feeding stages
              </span>
            </div>
          </div>

          {/* Section 3: Lot Identification & Location */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Lot Identifier Code</label>
              <input
                type="text"
                value={lotTag}
                onChange={(e) => setLotTag(e.target.value)}
                className="form-control"
                placeholder="e.g. LOT-BM-2026-01"
                required
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Used on QR tray barcodes and station log entries
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Display Lot Name</label>
              <input
                type="text"
                value={displayTag}
                onChange={(e) => setDisplayTag(e.target.value)}
                className="form-control"
                placeholder="e.g. CSR2 × CSR4 Bivoltine Lot #1"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Rearing Chamber / Bay Location</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="form-control"
                placeholder="e.g. Rearing House 1 - Bay A"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Grainage Seed Source / Certificate</label>
              <input
                type="text"
                value={grainageSource}
                onChange={(e) => setGrainageSource(e.target.value)}
                className="form-control"
                placeholder="e.g. KALRO NSRC Thika Grainage"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Agronomic Notes & Special Protocol Instructions (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-control"
              rows={2}
              placeholder="Incubation observations, specific disinfectant batch, disinfection date..."
            />
          </div>
        </div>

        {/* Right Live Projections & Feasibility Panel */}
        <div className="registration-projections-panel">
          <div className="projections-header">
            <Layers size={16} style={{ color: 'var(--primary)' }} />
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>
              Live Agronomic Projections
            </h4>
          </div>

          <div className="projection-items-grid">
            {/* Projected Yield */}
            <div className="projection-stat-card highlight">
              <div className="stat-label">
                <Scale size={13} style={{ color: 'var(--primary)' }} />
                <span>Est. Cocoon Yield</span>
              </div>
              <div className="stat-number tabular-nums">
                {estYieldKg.toFixed(1)} kg
              </div>
              <div className="stat-sub">
                Grade A green commercial cocoons (at 85% survival)
              </div>
            </div>

            {/* Projected Revenue */}
            <div className="projection-stat-card">
              <div className="stat-label">
                <DollarSign size={13} style={{ color: 'var(--status-success)' }} />
                <span>Projected Gross Value</span>
              </div>
              <div className="stat-number tabular-nums" style={{ color: 'var(--status-success)' }}>
                KES {projectedRevenue.toLocaleString()}
              </div>
              <div className="stat-sub">
                Calculated at KALRO benchmark KES {indicativePricePerKg}/kg
              </div>
            </div>

            {/* Total Forage Need */}
            <div className="projection-stat-card">
              <div className="stat-label">
                <span>Total Forage Demand</span>
              </div>
              <div className="stat-number tabular-nums">
                {totalForageKg.toLocaleString()} kg
              </div>
              <div className="stat-sub">
                Fresh {isBombyx ? 'Mulberry (Kanva-2/S-13)' : 'Castor (GRC-1)'} shoots
              </div>
            </div>

            {/* Peak Daily Feed */}
            <div className="projection-stat-card">
              <div className="stat-label">
                <span>Peak 5th Instar Ration</span>
              </div>
              <div className="stat-number tabular-nums">
                {peakDailyFeedKg} kg / day
              </div>
              <div className="stat-sub">
                Day 20 to 26 maximum feeding consumption
              </div>
            </div>

            {/* Rearing Bed Area */}
            <div className="projection-stat-card">
              <div className="stat-label">
                <Building size={13} style={{ color: 'var(--text-muted)' }} />
                <span>Rearing Bed Space</span>
              </div>
              <div className="stat-number tabular-nums">
                {chawkiBedAreaM2}m² → {lateBedAreaM2}m²
              </div>
              <div className="stat-sub">
                Expands 10× from Chawki to 5th Instar
              </div>
            </div>

            {/* Mountages Needed */}
            <div className="projection-stat-card">
              <div className="stat-label">
                <span>Mountage Frames</span>
              </div>
              <div className="stat-number tabular-nums">
                ~{mountagesCount} frames
              </div>
              <div className="stat-sub">
                Plastic collapsible or bamboo chandrike
              </div>
            </div>
          </div>

          {/* Rearing Schedule Forecast */}
          <div className="projection-schedule-card">
            <div className="schedule-header">
              <Calendar size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>Production Milestones</span>
            </div>
            <div className="milestones-steps">
              <div className="milestone-step">
                <div className="milestone-marker active" />
                <div className="milestone-content">
                  <div className="milestone-name">Hatch & Chawki Start</div>
                  <div className="milestone-date tabular-nums">
                    {new Date(startDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>

              <div className="milestone-step">
                <div className="milestone-marker" />
                <div className="milestone-content">
                  <div className="milestone-name">Mounting & Spinning</div>
                  <div className="milestone-date tabular-nums">{spinningDateFormatted}</div>
                </div>
              </div>

              <div className="milestone-step">
                <div className="milestone-marker success" />
                <div className="milestone-content">
                  <div className="milestone-name font-bold" style={{ color: 'var(--primary)' }}>
                    Target Cocoon Harvest
                  </div>
                  <div className="milestone-date tabular-nums font-bold" style={{ color: 'var(--primary)' }}>
                    {harvestDateFormatted}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Action Controls */}
      <div className="batch-registration-actions">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.86rem' }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn-accent"
          style={{ padding: '0.65rem 1.85rem', fontSize: '0.88rem', fontWeight: 700 }}
        >
          {isModal ? 'Create & Register Batch' : 'Register Batch & Begin Rearing Cycle →'}
        </button>
      </div>
    </form>
  );
};
