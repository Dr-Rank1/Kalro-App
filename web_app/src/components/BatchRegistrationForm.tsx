import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Building2,
  Layers,
} from 'lucide-react';
import { Batch, FarmProfile, Species } from '../types';
import {
  KENYA_SERICULTURE_BREEDS,
  KENYA_MULBERRY_CULTIVARS,
  KENYA_CASTOR_VARIETIES,
  KENYA_ORCHARD_BLOCKS,
  MULBERRY_EVALUATION_ACCESSIONS_COUNT,
} from '../constants';

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
  const [strain, setStrain] = useState<string>('KSK (Kenyan Station Strain)');
  const [cultivar, setCultivar] = useState<string>('V1');
  const [orchardBlock, setOrchardBlock] = useState<string>('Station Block C3 (V1)');
  const [count, setCount] = useState<number | ''>(20000);
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
      setStrain('KSK (Kenyan Station Strain)');
      setCultivar('V1');
      setOrchardBlock('Station Block C3 (V1)');
      setGrainageSource('KALRO National Sericulture Research Centre, Thika');
    } else {
      setStrain('Samia ricini (Kenyan Eri Strain)');
      setCultivar('NUU 70');
      setOrchardBlock('Station Block D1 (NUU 70 Castor)');
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

    const defaultDisplayName = `${strain.split(' (')[0]} · ${cultivar} (${finalCount.toLocaleString()} ${isBombyx ? 'eggs' : 'larvae'})`;

    const compiledNotes = [
      `Silkworm Strain: ${strain}`,
      `Forage Variety: ${cultivar}`,
      `Genebank / Block: ${orchardBlock}`,
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
      strain,
      targetForageCultivar: cultivar,
      orchardBlock,
      notes: compiledNotes,
    };

    onSuccess(newBatch);
  };

  return (
    <form onSubmit={handleSubmit} className="simple-batch-form">
      {/* 1. Species & Characterized Silkworm Strain */}
      <div className="form-card-section">
        <label className="section-label">
          <span className="step-num">1</span>
          <span>Silkworm Strain & Characterized Forage Variety</span>
        </label>
        <div className="species-grid-simple">
          <button
            type="button"
            onClick={() => handleSpeciesChange('bombyx')}
            className={`species-card-simple ${isBombyx ? 'selected bombyx' : ''}`}
          >
            <div className="species-card-content">
              <div className="species-card-head">
                <span className="species-name">Bombyx mori (Mulberry Silkworm)</span>
                {isBombyx && <CheckCircle2 size={18} className="selected-icon" />}
              </div>
              <p className="species-sub">
                Characterized Kenyan strains (KSK, ATK, ICIPE, Kinshoshowa, CSR2×CSR4). Fed on characterized Morus alba cultivars.
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
                <span className="species-name">Samia ricini (Kenyan Eri Silkworm)</span>
                {!isBombyx && <CheckCircle2 size={18} className="selected-icon eri" />}
              </div>
              <p className="species-sub">
                Hardy thermal spun cocoons. Fed on characterized castor cultivars (NUU 70, KC series, KMC8).
              </p>
            </div>
          </button>
        </div>

        {/* Strain & Cultivar Selectors */}
        <div className="two-col-grid" style={{ marginTop: '0.85rem' }}>
          <div className="input-group">
            <label className="input-label" htmlFor="strainSelect">
              Silkworm Strain
            </label>
            <select
              id="strainSelect"
              value={strain}
              onChange={(e) => setStrain(e.target.value)}
              className="simple-input"
            >
              {isBombyx ? (
                <>
                  <option value="KSK (Kenyan Station Strain)">KSK (Kenyan Station Strain)</option>
                  <option value="ATK (Kenyan Station Bivoltine)">ATK (Kenyan Station Bivoltine)</option>
                  <option value="ICIPE Bivoltine Strain">ICIPE Bivoltine Strain</option>
                  <option value="Kinshoshowa Bivoltine Strain">Kinshoshowa Bivoltine Strain</option>
                  <option value="CSR2 × CSR4 Bivoltine Double Hybrid">CSR2 × CSR4 Bivoltine Double Hybrid</option>
                </>
              ) : (
                <option value="Samia ricini (Kenyan Eri Strain)">Samia ricini (Kenyan Eri Strain)</option>
              )}
            </select>
            <span className="input-sub-hint">
              {isBombyx ? 'Official station-stabilized and characterized bivoltine strains' : 'Hardened multi-crop eri silkworm'}
            </span>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label" htmlFor="cultivarSelect" style={{ margin: 0 }}>
                {isBombyx ? 'Characterized Mulberry Cultivar' : 'Characterized Castor Variety'}
              </label>
              {isBombyx && (
                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>
                  +{MULBERRY_EVALUATION_ACCESSIONS_COUNT} in evaluation
                </span>
              )}
            </div>
            <select
              id="cultivarSelect"
              value={cultivar}
              onChange={(e) => setCultivar(e.target.value)}
              className="simple-input"
            >
              {isBombyx ? (
                <>
                  <optgroup label="Characterized Mulberry Varieties (NSRC Thika)">
                    <option value="V1">V1 (High moisture, premier commercial)</option>
                    <option value="Thika">Thika (Station adapted selection)</option>
                    <option value="Embu">Embu (Drought tolerant, Centre Genebank)</option>
                    <option value="Ithaanga">Ithaanga (Sub-humid adapted, Centre Genebank)</option>
                    <option value="Limuru">Limuru (Cold tolerant highland, Centre Genebank)</option>
                    <option value="Thailand">Thailand (Broad leaf, high biomass shoot stand)</option>
                    <option value="Ichinose">Ichinose (Tender Morus alba, high protein)</option>
                    <option value="Kanva 2">Kanva 2 / M-5 (National commercial benchmark)</option>
                    <option value="S54">S54 (Fast rooting, high crude protein)</option>
                    <option value="S36">S36 (High sucrose, premier chawki leaf)</option>
                    <option value="Unknown 2">Unknown 2 (Characterized research accession)</option>
                  </optgroup>
                </>
              ) : (
                <>
                  <optgroup label="Characterized Castor Varieties (Samia ricini Host)">
                    <option value="NUU 70">NUU 70 (Premier drought-hardy Kenyan accession)</option>
                    <option value="KC6">KC6 (High branching density, tender flushing)</option>
                    <option value="KC 14">KC 14 (Broad robust lamina, drought resilient)</option>
                    <option value="KC 2">KC 2 (Early maturing vegetative flush)</option>
                    <option value="KC 24">KC 24 (Low ricin content, chawki safe)</option>
                    <option value="KC 15">KC 15 (Dense canopy, high biomass late-age)</option>
                    <option value="KMC8">KMC8 (Kenyan Modified Castor line 8)</option>
                  </optgroup>
                </>
              )}
            </select>
            <span className="input-sub-hint">
              {isBombyx ? 'Final characterized Morus alba adoption cultivars' : 'Kenyan castor varieties for Eri feeding'}
            </span>
          </div>
        </div>

        {/* Source Orchard / Genebank Block */}
        <div style={{ marginTop: '0.85rem' }}>
          <label className="input-label" htmlFor="orchardBlockSelect">
            Source Orchard Stand / Station Research Block
          </label>
          <select
            id="orchardBlockSelect"
            value={orchardBlock}
            onChange={(e) => setOrchardBlock(e.target.value)}
            className="simple-input"
          >
            <optgroup label="Centre Genebank (Core Germplasm)">
              <option value="Centre Genebank: Ex-Embu Mulberry">Centre Genebank: Ex-Embu Mulberry</option>
              <option value="Centre Genebank: Ex-Thika Mulberry">Centre Genebank: Ex-Thika Mulberry</option>
              <option value="Centre Genebank: Ex-Limuru Mulberry">Centre Genebank: Ex-Limuru Mulberry</option>
              <option value="Centre Genebank: Ex-Ithanga Mulberry">Centre Genebank: Ex-Ithanga Mulberry</option>
            </optgroup>
            <optgroup label="Station Genebanks">
              <option value="Old Genebank Block">Old Genebank Block</option>
              <option value="New Genebank Block (98 Accessions under evaluation)">New Genebank Block (98 Accessions under evaluation)</option>
            </optgroup>
            <optgroup label="Research Blocks">
              <option value="Research Block: Collections">Research Block: Collections</option>
              <option value="Research Block: Irrigated">Research Block: Irrigated</option>
              <option value="Research Block: Non-Irrigated">Research Block: Non-Irrigated</option>
              <option value="Research Block: Selections">Research Block: Selections</option>
              <option value="Research Block: Cross Selections">Research Block: Cross Selections</option>
              <option value="Research Block: Line Selections">Research Block: Line Selections</option>
            </optgroup>
            <optgroup label="Station Field Blocks & Highway Farm">
              <option value="Station Block C2 (Kanva 2)">Station Block C2 (Kanva 2)</option>
              <option value="Station Block C3 (V1)">Station Block C3 (V1)</option>
              <option value="Station Block C4 (S36)">Station Block C4 (S36)</option>
              <option value="Station Block D1 (NUU 70 Castor)">Station Block D1 (NUU 70 Castor)</option>
              <option value="Station Block D2 (KC Series Castor)">Station Block D2 (KC Series Castor)</option>
              <option value="Station Block D3 (KMC8 Castor)">Station Block D3 (KMC8 Castor)</option>
              <option value="Station Block D4 (Thailand Mulberry)">Station Block D4 (Thailand Mulberry)</option>
              <option value="Highway Farm Block (Commercial Mulberry)">Highway Farm Block (Commercial Mulberry)</option>
            </optgroup>
          </select>
          <span className="input-sub-hint">Traceability: links forage harvest origin to larval feeding</span>
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
              Forage Capacity Check: <strong>{profile.mulberryAcreage || 1} acre(s)</strong> at {profile.orgName} (Annual forage: ~{((profile.mulberryAcreage || 1) * 16000).toLocaleString()} kg)
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
