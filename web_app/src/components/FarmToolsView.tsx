import React, { useState, useEffect } from 'react';
import {
  Batch,
  FeedLog,
  MortalityLog,
  EnvironmentLog,
  CocoonHarvest,
  LeafInventory,
  LeafMovement,
  PaymentRecord,
  LeafType,
  FarmProfile,
} from '../types';
import { DISEASE_LIBRARY } from '../constants';
import {
  formatCurrency,
  formatDate,
  computeCocoonMetrics,
} from '../utils';

interface FarmToolsViewProps {
  batches: Batch[];
  feedLogs: FeedLog[];
  mortalityLogs: MortalityLog[];
  envLogs?: EnvironmentLog[];
  harvests: CocoonHarvest[];
  inventory: LeafInventory;
  leafMovements: LeafMovement[];
  payments: PaymentRecord[];
  profile?: FarmProfile | null;
  onAddFeedLog: (log: FeedLog) => void;
  onAddMortalityLog: (log: MortalityLog) => void;
  onAddHarvest: (harvest: CocoonHarvest) => void;
  onAddLeafMovement: (movement: LeafMovement) => void;
  onAddPayment: (payment: PaymentRecord) => void;
  onExportCsv: () => void;
  onExportBackup: () => void;
  onOpenReportModal: () => void;
}

type FarmTab = 'leaf' | 'climate' | 'health' | 'harvest' | 'finance';

export const FarmToolsView: React.FC<FarmToolsViewProps> = ({
  batches,
  feedLogs,
  mortalityLogs,
  envLogs = [],
  harvests,
  inventory,
  leafMovements: _leafMovements,
  payments,
  profile,
  onAddLeafMovement,
  onAddPayment,
  onExportCsv,
  onExportBackup,
  onOpenReportModal,
}) => {
  const VALID_FARM_TABS: FarmTab[] = ['leaf', 'climate', 'health', 'harvest', 'finance'];

  const [activeTab, setActiveTab] = useState<FarmTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sub = params.get('subtab') as FarmTab | null;
      if (sub && VALID_FARM_TABS.includes(sub)) {
        return sub;
      }
      try {
        const stored = localStorage.getItem('kalro_active_farm_subtab') as FarmTab | null;
        if (stored && VALID_FARM_TABS.includes(stored)) {
          return stored;
        }
      } catch {
        // ignore
      }
    }
    return 'leaf';
  });

  // Synchronize active subtab with URL query parameter and localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('kalro_active_farm_subtab', activeTab);
    } catch {
      // ignore
    }

    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get('tab') === 'farm') {
      if (currentUrl.searchParams.get('subtab') !== activeTab) {
        currentUrl.searchParams.set('subtab', activeTab);
        window.history.replaceState({ tab: 'farm', subtab: activeTab }, '', currentUrl.toString());
      }
    }
  }, [activeTab]);

  // --------------------------------------------------------------------------
  // Tab 1: Forage & Feed State
  // --------------------------------------------------------------------------
  const [showAddLeaf, setShowAddLeaf] = useState<boolean>(false);
  const [leafType, setLeafType] = useState<LeafType>('mulberry');
  const [leafQty, setLeafQty] = useState<number | ''>('');
  const [leafReason, setLeafReason] = useState<string>('');

  // Feed & Bed Spacing Budget Calculator State
  const [budgetSpecies, setBudgetSpecies] = useState<'bombyx' | 'eri'>('bombyx');
  const [budgetLarvae, setBudgetLarvae] = useState<number>(20000);

  // --------------------------------------------------------------------------
  // Tab 2: Climate & Housing State
  // --------------------------------------------------------------------------
  const [evalTemp, setEvalTemp] = useState<number>(25.5);
  const [evalHumidity, setEvalHumidity] = useState<number>(72);
  const [evalStage, setEvalStage] = useState<'incubation' | 'chawki' | 'late' | 'spinning'>('late');

  // --------------------------------------------------------------------------
  // Tab 3: Health & Pathology State
  // --------------------------------------------------------------------------
  const [selectedDiseaseIdx, setSelectedDiseaseIdx] = useState<number>(0);
  const [sopChecked, setSopChecked] = useState<Record<number, boolean>>({
    1: true,
    2: true,
  });

  // --------------------------------------------------------------------------
  // Tab 4: Cocoon & Reeling State
  // --------------------------------------------------------------------------
  const [sampleWeightG, setSampleWeightG] = useState<number>(500);
  const [sampleCount, setSampleCount] = useState<number>(250);
  const [sampleShellWeightG, setSampleShellWeightG] = useState<number>(0.42);
  const [sampleDefects, setSampleDefects] = useState<number>(6);

  // --------------------------------------------------------------------------
  // Tab 5: Economics & Reports State
  // --------------------------------------------------------------------------
  const [showAddPay, setShowAddPay] = useState<boolean>(false);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payParty, setPayParty] = useState<string>('');
  const [payCat, setPayCat] = useState<'cocoon_sale' | 'egg_purchase' | 'leaf_purchase' | 'equipment' | 'other'>('cocoon_sale');
  const [payDir, setPayDir] = useState<'inflow' | 'outflow'>('inflow');
  const [payNotes, setPayNotes] = useState<string>('');

  // Calculations for Finance
  const totalInflow = payments
    .filter((p) => p.direction === 'inflow')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOutflow = payments
    .filter((p) => p.direction === 'outflow')
    .reduce((sum, p) => sum + p.amount, 0);
  const netIncome = totalInflow - totalOutflow;

  const totalMortality = mortalityLogs.reduce((sum, m) => sum + m.count, 0);

  // Handlers
  const handleAddLeaf = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(leafQty);
    if (!qty || qty <= 0) return;

    onAddLeafMovement({
      id: `lm-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      leafType,
      quantityKg: qty,
      direction: 'inflow',
      reason: leafReason.trim() || 'Farm harvest addition',
    });
    setLeafQty('');
    setLeafReason('');
    setShowAddLeaf(false);
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payAmount);
    if (!amt || amt <= 0 || !payParty.trim()) return;

    onAddPayment({
      id: `pay-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: amt,
      direction: payDir,
      category: payCat,
      partyName: payParty.trim(),
      status: 'settled',
      notes: payNotes.trim() || undefined,
    });
    setPayAmount('');
    setPayParty('');
    setPayNotes('');
    setShowAddPay(false);
  };

  // Feed Calculator Computations
  const batchRatio = Math.max(1000, budgetLarvae) / 20000;
  const totalForageBudgetKg = Math.round(budgetSpecies === 'bombyx' ? batchRatio * 450 : batchRatio * 360);
  const peakBedSpaceM2 = Math.round((budgetSpecies === 'bombyx' ? batchRatio * 36 : batchRatio * 32) * 10) / 10;
  const peakBedSpaceSqFt = Math.round(peakBedSpaceM2 * 10.764);
  const mountagesRequired = Math.ceil(budgetLarvae / (budgetSpecies === 'bombyx' ? 450 : 400));

  const instarFeedBreakdown = budgetSpecies === 'bombyx' ? [
    { instar: '1st Instar (Chawki)', share: '0.5%', leafKg: Math.round(totalForageBudgetKg * 0.005 * 10) / 10, spaceM2: Math.round(batchRatio * 1.5 * 10) / 10, cut: '0.5 cm tender ribbons (3rd-4th top leaf)', freq: '3× daily under paraffin tent' },
    { instar: '2nd Instar (Chawki)', share: '1.5%', leafKg: Math.round(totalForageBudgetKg * 0.015 * 10) / 10, spaceM2: Math.round(batchRatio * 4.5 * 10) / 10, cut: '1.5 cm semi-tender leaf pieces', freq: '3× daily' },
    { instar: '3rd Instar', share: '5.5%', leafKg: Math.round(totalForageBudgetKg * 0.055), spaceM2: Math.round(batchRatio * 10.0 * 10) / 10, cut: 'Whole mature fresh leaves', freq: '3× daily on net beds' },
    { instar: '4th Instar', share: '15.5%', leafKg: Math.round(totalForageBudgetKg * 0.155), spaceM2: Math.round(batchRatio * 18.0 * 10) / 10, cut: 'Whole leafy shoots (50-60 cm branches)', freq: '3-4× daily across racks' },
    { instar: '5th Instar (Voracious)', share: '77.0%', leafKg: Math.round(totalForageBudgetKg * 0.770), spaceM2: Math.round(batchRatio * 36.0 * 10) / 10, cut: 'Full mature leafy branches', freq: '4× daily (heavy peak consumption)' },
  ] : [
    { instar: '1st Instar (Eri)', share: '1.0%', leafKg: Math.round(totalForageBudgetKg * 0.01 * 10) / 10, spaceM2: Math.round(batchRatio * 1.5 * 10) / 10, cut: 'Tender non-wilted chopped castor/kesseru', freq: '3× daily' },
    { instar: '2nd Instar (Eri)', share: '2.5%', leafKg: Math.round(totalForageBudgetKg * 0.025 * 10) / 10, spaceM2: Math.round(batchRatio * 4.0 * 10) / 10, cut: 'Medium size clean castor leaves', freq: '3× daily' },
    { instar: '3rd Instar (Eri)', share: '7.5%', leafKg: Math.round(totalForageBudgetKg * 0.075), spaceM2: Math.round(batchRatio * 8.5 * 10) / 10, cut: 'Whole castor leaves (dry, dew-free)', freq: '3× daily' },
    { instar: '4th Instar (Eri)', share: '18.0%', leafKg: Math.round(totalForageBudgetKg * 0.180), spaceM2: Math.round(batchRatio * 16.0 * 10) / 10, cut: 'Mature green castor branches', freq: '3-4× daily' },
    { instar: '5th Instar (Eri)', share: '71.0%', leafKg: Math.round(totalForageBudgetKg * 0.710), spaceM2: Math.round(batchRatio * 32.0 * 10) / 10, cut: 'Plentiful mature castor/kesseru stems', freq: '4× daily till creamy white' },
  ];

  // Microclimate Evaluation
  const evaluateClimate = () => {
    if (evalStage === 'incubation') {
      if (evalTemp < 23 || evalTemp > 27) return { status: 'danger', title: 'Incubation Temperature Hazard', action: 'Ideal egg incubation is 25°C. Sub-optimal temperature causes irregular or delayed hatching.' };
      if (evalHumidity < 75) return { status: 'warning', title: 'Low Humidity for Eggs', action: 'Maintain 80% RH. Place water basins or damp sponge trays inside the incubation chamber.' };
      return { status: 'optimal', title: 'Optimal Incubation Microclimate', action: '25°C and 80% RH maintained. Keep eggs in darkness until Day 9 black-boxing.' };
    }
    if (evalStage === 'chawki') {
      if (evalTemp < 25) return { status: 'warning', title: 'Cool Temperature for Chawki', action: 'Chawki worms thrive at 26-28°C. Slow metabolic rate will prolong instars and induce disease.' };
      if (evalHumidity < 75) return { status: 'warning', title: 'Low Humidity: Leaf Drying Hazard', action: 'Tender chopped leaves will dry within 30 minutes. Keep trays covered under paraffin paper.' };
      return { status: 'optimal', title: 'Optimal Chawki Environment', action: 'Ideal warmth and humidity for succulent leaf ingestion and uniform moulting.' };
    }
    if (evalStage === 'late') {
      if (evalHumidity > 75) return { status: 'danger', title: 'High Humidity Hazard (NPV & Flacherie Risk)', action: 'Excessive bed moisture during 5th instar causes viral Grasserie outbreaks. Open cross-ventilation vents immediately and dust slaked lime.' };
      if (evalTemp > 28) return { status: 'warning', title: 'Heat Stress Alert', action: 'Temperatures above 28°C cause respiratory distress. Hang wet gunny sacks on windows for passive evaporative cooling.' };
      return { status: 'optimal', title: 'Optimal Late Age Rearing Climate', action: '23-25°C with 65-70% RH ensures robust appetite, firm droppings, and low fungal/viral spore loads.' };
    }
    // spinning
    if (evalHumidity > 70) return { status: 'warning', title: 'High Spinning Humidity: Stained Silk Risk', action: 'Worms void digestive fluids while mounting. High humidity causes urine stains and flimsy cocoons. Maintain 60-65% RH with active airflow.' };
    return { status: 'optimal', title: 'Optimal Spinning Microclimate', action: 'Dim light, moderate warmth (24-25°C), and good airflow ensure uniform silk extrusion without stains.' };
  };

  const climateEval = evaluateClimate();

  // Selected Disease
  const selectedDisease = DISEASE_LIBRARY[selectedDiseaseIdx] || DISEASE_LIBRARY[0];

  // Cocoon Quality Calculator Computations
  const singleCocoonWeightG = sampleCount > 0 ? sampleWeightG / sampleCount : 0;
  const computedShellRatio = singleCocoonWeightG > 0 ? (sampleShellWeightG / singleCocoonWeightG) * 100 : 0;
  const computedRenditta = computedShellRatio > 0 ? Math.round((100 / (computedShellRatio * 0.65)) * 10) / 10 : 0;
  const computedDefectRate = sampleCount > 0 ? (sampleDefects / sampleCount) * 100 : 0;

  let computedGrade = 'Ungraded';
  let estimatedPriceKes = 0;
  if (computedShellRatio >= 20.0 && computedDefectRate <= 3.0) {
    computedGrade = 'Grade A (Premium Reeling)';
    estimatedPriceKes = 950;
  } else if (computedShellRatio >= 17.0 && computedDefectRate <= 6.0) {
    computedGrade = 'Grade B (Commercial Silk)';
    estimatedPriceKes = 750;
  } else {
    computedGrade = 'Grade C (Reeling Defective / Spun)';
    estimatedPriceKes = 420;
  }

  return (
    <div className="farm-tools-container view-enter-animate">
      {/* Header */}
      <div className="card-header-flex" style={{ marginBottom: profile ? '0.75rem' : '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Agronomy & Sericulture Station Tools
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
            Official KALRO agronomy standards: Forage budgeting, housing microclimate, biosecurity pathology, reeling quality, and economics.
          </p>
        </div>
      </div>

      {/* Farm Profile Synchronization Pill */}
      {profile && (
        <div
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            marginBottom: '1rem',
            fontSize: '0.78rem',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Farm Profile Synced:</span>
            <span>{profile.orgName} ({profile.county} County)</span>
            <span>•</span>
            <span>{profile.houseCount} Rearing {profile.houseCount === 1 ? 'House' : 'Houses'}</span>
            <span>•</span>
            <span>{profile.mulberryAcreage} Acre(s) Mulberry</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Calculators pre-configured for your farm capacity
          </span>
        </div>
      )}

      {/* 5 Clean Tabs */}
      <div className="farm-tabs-bar">
        {[
          { key: 'leaf', label: 'Forage & Feed', icon: '🍃' },
          { key: 'climate', label: 'Climate & Housing', icon: '🌡️' },
          { key: 'health', label: 'Health & Pathology', icon: '🩺' },
          { key: 'harvest', label: 'Cocoon & Reeling', icon: '🧺' },
          { key: 'finance', label: 'Economics & Reports', icon: '📊' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as FarmTab)}
            className={`farm-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ===================================================================
          TAB 1: FORAGE & FEED
         =================================================================== */}
      {activeTab === 'leaf' && (
        <div className="view-enter-animate" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Forage Stock Summary Cards */}
          <div className="farm-stat-grid">
            <div className="farm-stat-card">
              <div className="farm-stat-label">Mulberry Stock (Bombyx)</div>
              <div className="farm-stat-number tabular-nums">{inventory.mulberryKg.toFixed(1)} kg</div>
              <div className="farm-stat-sub">Kanva-2, S-13 & V-1 cultivars</div>
            </div>

            <div className="farm-stat-card">
              <div className="farm-stat-label">Castor Stock (Eri)</div>
              <div className="farm-stat-number tabular-nums">{inventory.castorKg.toFixed(1)} kg</div>
              <div className="farm-stat-sub">GRC-1 red non-toxic cultivar</div>
            </div>

            <div className="farm-stat-card">
              <div className="farm-stat-label">Kesseru Stand (Eri)</div>
              <div className="farm-stat-number tabular-nums">{inventory.kesseruKg.toFixed(1)} kg</div>
              <div className="farm-stat-sub">Drought-hardy perennial hedge</div>
            </div>
          </div>

          {/* Feed & Bed Spacing Budget Calculator */}
          <div className="farm-calc-card">
            <div className="farm-calc-header">
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>
                  Interactive Forage Budget & Bed Space Calculator
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                  Calculates total fresh shoots, peak rearing area, and mountages according to KALRO sericulture agronomy models.
                </p>
              </div>

              {/* Species Toggle */}
              <div className="roadmap-toggle-group">
                <button
                  type="button"
                  onClick={() => setBudgetSpecies('bombyx')}
                  className={`roadmap-toggle-btn ${budgetSpecies === 'bombyx' ? 'active' : ''}`}
                >
                  Bombyx (Mulberry)
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetSpecies('eri')}
                  className={`roadmap-toggle-btn ${budgetSpecies === 'eri' ? 'active' : ''}`}
                >
                  Eri (Castor)
                </button>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="farm-calc-inputs-grid">
              <div>
                <label className="form-label">Batch Size (Larvae Count)</label>
                <input
                  type="number"
                  value={budgetLarvae}
                  onChange={(e) => setBudgetLarvae(Math.max(500, Number(e.target.value) || 0))}
                  className="form-control tabular-nums"
                  placeholder="Enter larvae count (e.g. 20000)"
                  step="1000"
                  min="500"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Agronomy Rule of Thumb:</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                  {budgetSpecies === 'bombyx'
                    ? '1 DFL Box (20,000 larvae) requires 400–450 kg fresh shoots; 85% is consumed during the 5th instar.'
                    : '1 Eri Box requires ~360 kg fresh clean castor leaves; larvae grow up to 8 cm and spin open-ended cocoons.'}
                </span>
              </div>
            </div>

            {/* Live Calculated Metric Results */}
            <div className="farm-calc-results-grid">
              <div className="farm-calc-result-box highlight">
                <span className="farm-calc-result-lbl">Total Forage Needed</span>
                <span className="farm-calc-result-val tabular-nums">{totalForageBudgetKg.toLocaleString()} kg</span>
                <span className="farm-calc-result-sub">{budgetSpecies === 'bombyx' ? 'Fresh mulberry shoots' : 'Fresh clean castor'}</span>
              </div>

              <div className="farm-calc-result-box">
                <span className="farm-calc-result-lbl">Peak Bed Space</span>
                <span className="farm-calc-result-val tabular-nums">{peakBedSpaceM2} m²</span>
                <span className="farm-calc-result-sub">{peakBedSpaceSqFt} sq ft at 5th instar</span>
              </div>

              <div className="farm-calc-result-box">
                <span className="farm-calc-result-lbl">Mountages Required</span>
                <span className="farm-calc-result-val tabular-nums">{mountagesRequired} frames</span>
                <span className="farm-calc-result-sub">Chandrike / folding frames</span>
              </div>

              <div className="farm-calc-result-box">
                <span className="farm-calc-result-lbl">Feeding Window</span>
                <span className="farm-calc-result-val tabular-nums">26–28 Days</span>
                <span className="farm-calc-result-sub">Total active feeding duration</span>
              </div>
            </div>

            {/* Instar-by-Instar Stage Budget Table */}
            <div style={{ marginTop: '0.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-main)' }}>
                Instar-by-Instar Feed Allocation & Bed Expansion Schedule
              </h4>
              <div className="kalro-table-wrap">
                <table className="kalro-table">
                  <thead>
                    <tr>
                      <th>Growth Stage</th>
                      <th>Share</th>
                      <th>Leaf (kg)</th>
                      <th>Bed Area</th>
                      <th>Leaf Preparation & Cutting Style</th>
                      <th>Feeding Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instarFeedBreakdown.map((row, idx) => (
                      <tr key={idx}>
                        <td><strong>{row.instar}</strong></td>
                        <td className="tabular-nums">{row.share}</td>
                        <td className="tabular-nums"><strong>{row.leafKg} kg</strong></td>
                        <td className="tabular-nums">{row.spaceM2} m²</td>
                        <td>{row.cut}</td>
                        <td>{row.freq}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* KALRO Forage Cultivation Standards */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <h3 className="card-title">KALRO Forage Agronomy & Cultivation Standards</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 1rem' }}>
              Standard operating procedures for establishing and maintaining sericulture forage in Kenya.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={{ backgroundColor: '#fcfdfc', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                <h4 style={{ margin: '0 0 0.4rem', color: 'var(--primary)', fontSize: '0.95rem' }}>
                  🌿 Mulberry (Morus alba · Kanva-2 / S-13)
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.8rem', lineHeight: 1.55, color: 'var(--text-main)' }}>
                  <li><strong>Field Spacing:</strong> Paired row <code>(150 + 90) cm × 60 cm</code> or <code>90 cm × 90 cm</code> (4,840 plants per acre).</li>
                  <li><strong>Pruning Schedule:</strong> Bottom pruning (cut 10-15 cm above collar) 70-75 days prior to rearing; crown pruning after 2-3 batches.</li>
                  <li><strong>Soil & Fertility:</strong> 20 tons Farm Yard Manure (FYM)/ha/year + 300:120:120 kg NPK split across 5 crop applications.</li>
                  <li><strong>Harvest Timing:</strong> Pluck early morning (6:00 - 8:00 AM) when leaf moisture is {'>'}70%. Never feed hot, dewy, or wilted leaves.</li>
                </ul>
              </div>

              <div style={{ backgroundColor: '#fcfdfc', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                <h4 style={{ margin: '0 0 0.4rem', color: 'var(--primary)', fontSize: '0.95rem' }}>
                  🌱 Castor & Kesseru (Samia cynthia ricini)
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.8rem', lineHeight: 1.55, color: 'var(--text-main)' }}>
                  <li><strong>Cultivars:</strong> GRC-1 red cultivar or local non-toxic red-stem castor; Kesseru (<em>Heteropanax</em>) for dry seasons.</li>
                  <li><strong>Field Spacing:</strong> <code>90 cm × 90 cm</code>. Intercrop with cowpeas, beans, or green grams for soil nitrogen.</li>
                  <li><strong>Harvesting Rules:</strong> Pluck mature, fully expanded middle leaves; retain the top 4 leaves to sustain plant photosynthesis.</li>
                  <li><strong>Biosecurity / Spray Alert:</strong> Zero chemical insecticides within 30 days of rearing. Residues cause 100% larval mortality.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Add Leaf Harvest Action */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 className="card-title">Forage Harvest Addition</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Log fresh shoots harvested from farm plots into storage.
                </p>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowAddLeaf(!showAddLeaf)}
              >
                {showAddLeaf ? '✕ Cancel' : '+ Add Leaf Harvest'}
              </button>
            </div>

            {/* Expandable Leaf Form */}
            {showAddLeaf && (
              <form onSubmit={handleAddLeaf} className="farm-inline-form collapsible-content">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Forage Variety</label>
                    <select
                      value={leafType}
                      onChange={(e) => setLeafType(e.target.value as LeafType)}
                      className="form-control"
                    >
                      <option value="mulberry">Mulberry (Kanva-2 / S-13)</option>
                      <option value="castor">Castor (GRC-1 Cultivar)</option>
                      <option value="kesseru">Kesseru (Heteropanax)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Quantity Harvested (kg)</label>
                    <input
                      type="number"
                      value={leafQty}
                      onChange={(e) => setLeafQty(e.target.value === '' ? '' : Number(e.target.value))}
                      className="form-control tabular-nums"
                      placeholder="e.g. 25"
                      step="any"
                      min="0.1"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Plot / Source Block</label>
                    <input
                      type="text"
                      value={leafReason}
                      onChange={(e) => setLeafReason(e.target.value)}
                      className="form-control"
                      placeholder="e.g. Mulberry Plot 1"
                    />
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn-accent">
                    Save to Stock
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 2: CLIMATE & HOUSING
         =================================================================== */}
      {activeTab === 'climate' && (
        <div className="view-enter-animate" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Live Microclimate Checker */}
          <div className="farm-calc-card">
            <div className="farm-calc-header">
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>
                  Interactive Microclimate Diagnostic Evaluator
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                  Simulate current rearing room conditions to check for physiological temperature stress or pathogen risk.
                </p>
              </div>

              {/* Status Badge */}
              <div className={`farm-climate-badge ${climateEval.status}`}>
                {climateEval.status === 'optimal' ? '✓ ' : '⚠ '}
                {climateEval.title}
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="farm-calc-inputs-grid">
              <div>
                <label className="form-label">Rearing Stage</label>
                <select
                  value={evalStage}
                  onChange={(e) => setEvalStage(e.target.value as any)}
                  className="form-control"
                >
                  <option value="incubation">Egg Incubation & Black-Boxing</option>
                  <option value="chawki">Young Worms Chawki (Instars 1 & 2)</option>
                  <option value="late">Late Age Rearing (Instars 3, 4 & 5)</option>
                  <option value="spinning">Mounting & Silk Spinning</option>
                </select>
              </div>

              <div>
                <label className="form-label">Room Temperature (°C)</label>
                <input
                  type="number"
                  value={evalTemp}
                  onChange={(e) => setEvalTemp(Number(e.target.value))}
                  className="form-control tabular-nums"
                  step="0.5"
                  min="15"
                  max="40"
                />
              </div>

              <div>
                <label className="form-label">Relative Humidity (%)</label>
                <input
                  type="number"
                  value={evalHumidity}
                  onChange={(e) => setEvalHumidity(Number(e.target.value))}
                  className="form-control tabular-nums"
                  step="1"
                  min="20"
                  max="100"
                />
              </div>
            </div>

            {/* Corrective Action Callout */}
            <div className={`disease-action-callout`} style={{ borderColor: climateEval.status === 'danger' ? 'rgba(197, 48, 48, 0.3)' : 'rgba(20, 61, 43, 0.2)' }}>
              <strong style={{ fontSize: '0.8rem', color: climateEval.status === 'danger' ? 'var(--status-danger)' : 'var(--primary)', display: 'block', marginBottom: '2px' }}>
                Recommended Field Action:
              </strong>
              <p style={{ fontSize: '0.82rem', margin: 0, lineHeight: 1.45 }}>
                {climateEval.action}
              </p>
            </div>
          </div>

          {/* Environmental Target Matrix */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <h3 className="card-title">Official KALRO Microclimate Benchmark Matrix</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0.85rem' }}>
              Target physiological thresholds for bivoltine silkworm rearing in Kenya.
            </p>

            <div className="kalro-table-wrap">
              <table className="kalro-table">
                <thead>
                  <tr>
                    <th>Rearing Phase</th>
                    <th>Target Temp (°C)</th>
                    <th>Target RH (%)</th>
                    <th>Airflow / Lighting</th>
                    <th>Bed Environment & Critical Rules</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Egg Incubation</strong></td>
                    <td className="tabular-nums"><strong>25.0°C</strong></td>
                    <td className="tabular-nums"><strong>80%</strong></td>
                    <td>Darkness (Day 1-9)</td>
                    <td>Expose to 16h bright light on Day 10 for uniform 95%+ hatch</td>
                  </tr>
                  <tr>
                    <td><strong>1st Instar (Chawki)</strong></td>
                    <td className="tabular-nums"><strong>26.0 - 28.0°C</strong></td>
                    <td className="tabular-nums"><strong>80 - 85%</strong></td>
                    <td>Gentle draft-free</td>
                    <td>Paraffin paper tent to retain leaf succulence; 0.5 cm chopped leaf</td>
                  </tr>
                  <tr>
                    <td><strong>2nd Instar (Chawki)</strong></td>
                    <td className="tabular-nums"><strong>26.0 - 27.0°C</strong></td>
                    <td className="tabular-nums"><strong>78 - 80%</strong></td>
                    <td>Gentle ventilation</td>
                    <td>Expand bed space to 1.5 m² per 20,000; keep bed dry during moult</td>
                  </tr>
                  <tr>
                    <td><strong>3rd Instar</strong></td>
                    <td className="tabular-nums"><strong>25.0 - 26.0°C</strong></td>
                    <td className="tabular-nums"><strong>75%</strong></td>
                    <td>Active ventilation</td>
                    <td>Transition to whole leaves; net bed cleaning prior to 3rd moult</td>
                  </tr>
                  <tr>
                    <td><strong>4th Instar</strong></td>
                    <td className="tabular-nums"><strong>24.0 - 25.0°C</strong></td>
                    <td className="tabular-nums"><strong>70 - 75%</strong></td>
                    <td>High cross-ventilation</td>
                    <td>Shoot rearing on racks; slaked lime dusting during moult rest</td>
                  </tr>
                  <tr>
                    <td><strong>5th Instar (Peak)</strong></td>
                    <td className="tabular-nums"><strong>23.0 - 24.0°C</strong></td>
                    <td className="tabular-nums"><strong>65 - 70%</strong></td>
                    <td>Continuous airflow</td>
                    <td>Avoid bed dampness; worms generate heavy metabolic heat and moisture</td>
                  </tr>
                  <tr>
                    <td><strong>Spinning (Mounting)</strong></td>
                    <td className="tabular-nums"><strong>24.0 - 25.0°C</strong></td>
                    <td className="tabular-nums"><strong>60 - 65%</strong></td>
                    <td>Dim light, dry breeze</td>
                    <td>45 worms/ft² on Chandrike frames; dry air prevents stained cocoons</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Passive Climate Control Guide */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <h3 className="card-title">Passive Climate Control for Kenyan Rearing Houses</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 1rem' }}>
              Cost-effective climate architecture guidelines for high-altitude and semi-arid sericulture zones.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '0.95rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                  🏠 Roof & Ceiling Insulation
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.45 }}>
                  Corrugated iron sheets generate severe heat spikes. Install false ceilings made of papyrus mats, plywood, or thatch to buffer indoor temperature within 23–26°C.
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '0.95rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                  💨 20-Mesh Wire Louvers
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.45 }}>
                  Windows must have double screens: glass/wood shutters for cold nights, and 20-mesh nylon wire screens to maintain cross-ventilation while excluding Uzi flies.
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '0.95rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                  💧 Passive Evaporative Cooling
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.45 }}>
                  In hot zones (Machakos, Kitui, Siaya), hang damp hessian/gunny sacks over air inlets and sprinkle verandah floors with water to drop room temperatures by 3–4°C.
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '0.95rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                  🔥 Chimney Charcoal Warming
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.45 }}>
                  In cold highlands (Meru, Nyeri, Limuru), nocturnal temperatures drop below 17°C. Use enclosed charcoal braziers with external chimneys to warm rooms without lethal carbon monoxide buildup.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 3: HEALTH & PATHOLOGY
         =================================================================== */}
      {activeTab === 'health' && (
        <div className="view-enter-animate" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Quick Health Summary */}
          <div className="farm-stat-grid">
            <div className="farm-stat-card">
              <div className="farm-stat-label">Flock Health Status</div>
              <div className="farm-stat-number" style={{ color: totalMortality > 50 ? 'var(--status-danger)' : 'var(--status-success)' }}>
                {totalMortality > 50 ? 'Monitor Loss' : 'Normal / Vigorous'}
              </div>
              <div className="farm-stat-sub">Based on cumulative loss logs</div>
            </div>

            <div className="farm-stat-card">
              <div className="farm-stat-label">Total Recorded Losses</div>
              <div className="farm-stat-number tabular-nums">
                {totalMortality.toLocaleString()} larvae
              </div>
              <div className="farm-stat-sub">Across all active batches</div>
            </div>

            <div className="farm-stat-card">
              <div className="farm-stat-label">Quarantine Protection</div>
              <div className="farm-stat-number" style={{ color: 'var(--primary)' }}>
                KEPHIS Ready
              </div>
              <div className="farm-stat-sub">Disinfection protocol on standby</div>
            </div>
          </div>

          {/* Interactive Disease Diagnostic Guide */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <h3 className="card-title">Sericulture Disease Diagnostics & Symptom Checker</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0.85rem' }}>
              Select a field symptom or disease to review diagnostic signs, quarantine risk, and required chemical containment.
            </p>

            {/* Quick Symptom Chips */}
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Quick Symptom Matcher:
              </span>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDiseaseIdx(0)}
                  className={`farm-chip-btn ${selectedDiseaseIdx === 0 ? 'active' : ''}`}
                >
                  🔘 Pepper spots on skin (Pebrine)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDiseaseIdx(1)}
                  className={`farm-chip-btn ${selectedDiseaseIdx === 1 ? 'active' : ''}`}
                >
                  🔘 Milky fluid & hanging upside down (Grasserie)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDiseaseIdx(2)}
                  className={`farm-chip-btn ${selectedDiseaseIdx === 2 ? 'active' : ''}`}
                >
                  🔘 Soft flaccid body & vomits (Flacherie)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDiseaseIdx(3)}
                  className={`farm-chip-btn ${selectedDiseaseIdx === 3 ? 'active' : ''}`}
                >
                  🔘 Chalky-white mummified corpse (Muscardine)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDiseaseIdx(4)}
                  className={`farm-chip-btn ${selectedDiseaseIdx === 4 ? 'active' : ''}`}
                >
                  🔘 Black cuticular scar / fly (Uzi Fly)
                </button>
              </div>
            </div>

            {/* Selected Disease Details Card */}
            <div className="disease-diagnostic-card collapsible-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {selectedDisease.name}
                  </h4>
                </div>
                {selectedDisease.seedLotRisk && (
                  <span className="quarantine-pill">KEPHIS Notifiable Risk</span>
                )}
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                <em>Pathogen:</em> {selectedDisease.pathogen}
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <strong style={{ fontSize: '0.78rem', color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
                  Field Symptoms to Look For:
                </strong>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.45 }}>
                  {selectedDisease.signs}
                </p>
              </div>

              <div className="disease-action-callout">
                <strong style={{ fontSize: '0.78rem', color: 'var(--primary)', display: 'block', marginBottom: '2px' }}>
                  Required Containment & Disinfection:
                </strong>
                <p style={{ fontSize: '0.82rem', margin: 0, lineHeight: 1.45 }}>
                  {selectedDisease.action}
                </p>
              </div>
            </div>
          </div>

          {/* KALRO Sericulture Biosecurity & Disinfection SOP (5-Step Protocol) */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <h3 className="card-title">Sericulture Biosecurity & Disinfection SOP Checklist</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0.85rem' }}>
              Mandatory sanitary checklist for every rearing batch to guarantee disease suppression. Click to mark completed.
            </p>

            <div className="farm-sop-checklist">
              {[
                {
                  id: 1,
                  title: '1. Pre-Rearing Terminal Room Disinfection',
                  desc: 'Wash room and trays with water, spray 2% formalin solution (or 0.5% bleaching powder), and seal doors airtight for 24 hours. Aerate thoroughly for 48 hours before brushing.',
                },
                {
                  id: 2,
                  title: '2. Entrance Footbath & Personal Biosecurity',
                  desc: 'Maintain a dry footbath tray of slaked lime and bleaching powder (9:1 ratio) at all rearing room doors. Farm workers must wash hands with soap before touching forage or larvae.',
                },
                {
                  id: 3,
                  title: '3. Daily Net Bed Cleaning & Waste Separation',
                  desc: 'Use nylon mesh nets to lift larvae onto fresh feed. Carefully roll off the bottom net with frass and unconsumed stems. Never sweep dry dust onto feeding beds.',
                },
                {
                  id: 4,
                  title: '4. Moult Rest Disinfection & Lime Dusting',
                  desc: 'When 90% of worms settle for moult, cease feeding completely. Dust the rearing bed with dry slaked lime (100g/m²) or Vijetha/Labex powder to desiccate viral pathogens.',
                },
                {
                  id: 5,
                  title: '5. Post-Harvest Chandrike & Frame Sterilization',
                  desc: 'Expose bamboo mountages to hot sun for 3 consecutive days or use a gas flame burner to incinerate residual cocoon floss and fungal conidiospores.',
                },
              ].map((sop) => {
                const isDone = !!sopChecked[sop.id];
                return (
                  <div
                    key={sop.id}
                    onClick={() => setSopChecked((prev) => ({ ...prev, [sop.id]: !prev[sop.id] }))}
                    className={`farm-sop-item ${isDone ? 'done' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => {}}
                      className="farm-sop-checkbox"
                    />
                    <div className="farm-sop-text">
                      <div className="farm-sop-title">
                        {sop.title}
                        {isDone && <span style={{ color: 'var(--status-success)', fontSize: '0.74rem' }}>✓ Completed</span>}
                      </div>
                      <p className="farm-sop-desc">{sop.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 4: COCOON & REELING
         =================================================================== */}
      {activeTab === 'harvest' && (
        <div className="view-enter-animate" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Official Commercial Silk Grading Benchmarks */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <h3 className="card-title">Official Commercial Silk Grading & Market Benchmarks</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0.85rem' }}>
              Official KALRO standards for evaluating green bivoltine cocoons delivered to reeling facilities.
            </p>

            <div className="farm-bench-table-wrap">
              <table className="farm-bench-table">
                <thead>
                  <tr>
                    <th>Commercial Grade</th>
                    <th>Shell Ratio % (SR%)</th>
                    <th>Renditta (kg cocoon/kg silk)</th>
                    <th>Defect Rate</th>
                    <th>Filament Quality</th>
                    <th>Benchmark Price (Dry)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="farm-grade-pill grade-a">Grade A Silk</span></td>
                    <td className="tabular-nums"><strong>≥ 20.0%</strong></td>
                    <td className="tabular-nums"><strong>6.5 – 7.5</strong></td>
                    <td className="tabular-nums">{'<'} 3.0%</td>
                    <td>Uniform continuous filament ({'>'}850 m)</td>
                    <td className="tabular-nums"><strong>KES 900 – 1,100 / kg</strong></td>
                  </tr>
                  <tr>
                    <td><span className="farm-grade-pill grade-b">Grade B Silk</span></td>
                    <td className="tabular-nums"><strong>17.0 – 19.9%</strong></td>
                    <td className="tabular-nums"><strong>7.6 – 9.0</strong></td>
                    <td className="tabular-nums">3.0 – 6.0%</td>
                    <td>Commercial grade filament (650–800 m)</td>
                    <td className="tabular-nums"><strong>KES 650 – 800 / kg</strong></td>
                  </tr>
                  <tr>
                    <td><span className="farm-grade-pill grade-c">Reeling Defective</span></td>
                    <td className="tabular-nums"><strong>{'<'} 17.0%</strong></td>
                    <td className="tabular-nums"><strong>{'>'} 9.0</strong></td>
                    <td className="tabular-nums">{'>'} 6.0%</td>
                    <td>Non-reelable; spun silk / waste carding</td>
                    <td className="tabular-nums"><strong>KES 350 – 500 / kg</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Cocoon Reeling & Quality Calculator */}
          <div className="farm-calc-card">
            <div className="farm-calc-header">
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>
                  Sample Cocoon Quality & Renditta Calculator
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                  Test a random sample from your harvest lot (e.g. 500g or 250 cocoons) to compute Shell Ratio %, Renditta, and Commercial Grade.
                </p>
              </div>

              <span
                className={`farm-grade-pill ${
                  computedGrade.startsWith('Grade A') ? 'grade-a' : computedGrade.startsWith('Grade B') ? 'grade-b' : 'grade-c'
                }`}
              >
                {computedGrade}
              </span>
            </div>

            {/* Inputs Grid */}
            <div className="farm-calc-inputs-grid">
              <div>
                <label className="form-label">Sample Cocoon Weight (Grams)</label>
                <input
                  type="number"
                  value={sampleWeightG}
                  onChange={(e) => setSampleWeightG(Math.max(10, Number(e.target.value)))}
                  className="form-control tabular-nums"
                  step="10"
                />
              </div>

              <div>
                <label className="form-label">Total Cocoon Count in Sample</label>
                <input
                  type="number"
                  value={sampleCount}
                  onChange={(e) => setSampleCount(Math.max(1, Number(e.target.value)))}
                  className="form-control tabular-nums"
                  step="5"
                />
              </div>

              <div>
                <label className="form-label">Avg Single Shell Weight (Grams)</label>
                <input
                  type="number"
                  value={sampleShellWeightG}
                  onChange={(e) => setSampleShellWeightG(Math.max(0.05, Number(e.target.value)))}
                  className="form-control tabular-nums"
                  step="0.01"
                />
              </div>

              <div>
                <label className="form-label">Defective Cocoons in Sample</label>
                <input
                  type="number"
                  value={sampleDefects}
                  onChange={(e) => setSampleDefects(Math.max(0, Number(e.target.value)))}
                  className="form-control tabular-nums"
                  step="1"
                />
              </div>
            </div>

            {/* Calculated Metric Results */}
            <div className="farm-calc-results-grid">
              <div className="farm-calc-result-box highlight">
                <span className="farm-calc-result-lbl">Shell Ratio (SR%)</span>
                <span className="farm-calc-result-val tabular-nums">{computedShellRatio.toFixed(1)}%</span>
                <span className="farm-calc-result-sub">(Shell Wt / Cocoon Wt) × 100</span>
              </div>

              <div className="farm-calc-result-box">
                <span className="farm-calc-result-lbl">Estimated Renditta</span>
                <span className="farm-calc-result-val tabular-nums">{computedRenditta}</span>
                <span className="farm-calc-result-sub">kg cocoons needed for 1 kg raw silk</span>
              </div>

              <div className="farm-calc-result-box">
                <span className="farm-calc-result-lbl">Single Cocoon Wt</span>
                <span className="farm-calc-result-val tabular-nums">{singleCocoonWeightG.toFixed(2)} g</span>
                <span className="farm-calc-result-sub">Average green cocoon mass</span>
              </div>

              <div className="farm-calc-result-box">
                <span className="farm-calc-result-lbl">Defect Rate</span>
                <span className="farm-calc-result-val tabular-nums" style={{ color: computedDefectRate > 5 ? 'var(--status-danger)' : 'var(--status-success)' }}>
                  {computedDefectRate.toFixed(1)}%
                </span>
                <span className="farm-calc-result-sub">Estimated KES {estimatedPriceKes}/kg</span>
              </div>
            </div>
          </div>

          {/* Cocoon Sorting & Defect Identification Guide */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <h3 className="card-title">Commercial Sorting & Defect Guide</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 1rem' }}>
              Remove all defective cocoons before delivering to the reeling mill to preserve high Renditta and maximum payout.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                  👥 Double Cocoons
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Two larvae spin together. Filaments are inextricably entangled. Cannot be automatically reeled; diverted to dupion or hand-spun silk.
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                  💧 Stained & Soiled Cocoons
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Caused by excessive bed humidity, larvae urinating during mounting, or decomposing pupae. Stains degrade silk color and gum structure.
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--status-danger)', display: 'block', marginBottom: '3px' }}>
                  🪰 Pierced (Uzi Maggot) Cocoons
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Uzi fly maggot eats through pupa and cuts an exit hole through the shell. The continuous filament is cut into thousands of fragments; reelability is 0%.
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                  🍂 Flimsy / Thin-Shelled
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Undernourished worms or high temperatures during 5th instar produce fragile papery shells with SR% {'<'} 15%. Flattens easily during transport.
                </p>
              </div>
            </div>
          </div>

          {/* Active Batch Harvests Reeling Cards */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <h3 className="card-title">Farm Batch Reeling Analytics</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 1rem' }}>
              Computed metrics from green cocoons harvested and weighed on your station.
            </p>

            {batches.filter((b) => computeCocoonMetrics(b, harvests).cocoonCount > 0).length === 0 ? (
              <div className="empty-state">
                <h4>No Cocoon Harvests Computed Yet</h4>
                <p>Reeling analytics will compute automatically once green cocoons are harvested and recorded.</p>
              </div>
            ) : (
              batches.map((batch) => {
                const metrics = computeCocoonMetrics(batch, harvests);
                if (metrics.cocoonCount === 0) return null;

                return (
                  <div key={batch.id} className="reeling-batch-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                          {batch.displayTag || batch.batchTag || batch.id}
                        </h4>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {batch.species === 'bombyx' ? 'Bombyx mori (Bivoltine)' : 'Samia cynthia ricini (Eri)'}
                        </span>
                      </div>

                      <span
                        className="roadmap-day-pill"
                        style={{
                          backgroundColor:
                            metrics.commercialGrade === 'Grade A'
                              ? 'var(--status-success)'
                              : metrics.commercialGrade === 'Grade B'
                              ? 'var(--accent-gold)'
                              : 'var(--status-danger)',
                        }}
                      >
                        {metrics.commercialGrade} Silk
                      </span>
                    </div>

                    <div className="farm-stat-grid" style={{ marginBottom: 0 }}>
                      <div className="farm-stat-card">
                        <div className="farm-stat-label">Green Cocoon Weight</div>
                        <div className="farm-stat-number tabular-nums">{(metrics.totalWeightGrams / 1000).toFixed(2)} kg</div>
                      </div>
                      <div className="farm-stat-card">
                        <div className="farm-stat-label">Shell Ratio %</div>
                        <div className="farm-stat-number tabular-nums" style={{ color: 'var(--primary)' }}>
                          {metrics.shellRatioPercent ? `${metrics.shellRatioPercent}%` : '—'}
                        </div>
                      </div>
                      <div className="farm-stat-card">
                        <div className="farm-stat-label">Renditta</div>
                        <div className="farm-stat-number tabular-nums">{metrics.renditta ? `${metrics.renditta}` : '—'}</div>
                      </div>
                      <div className="farm-stat-card">
                        <div className="farm-stat-label">Defect Rate</div>
                        <div className="farm-stat-number tabular-nums" style={{ color: metrics.defectRatePercent > 5 ? 'var(--status-danger)' : 'var(--status-success)' }}>
                          {metrics.defectRatePercent}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 5: ECONOMICS & REPORTS
         =================================================================== */}
      {activeTab === 'finance' && (
        <div className="view-enter-animate" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* KALRO 1-Acre Sericulture Enterprise Model */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <h3 className="card-title">KALRO 1-Acre Sericulture Commercial Enterprise Model</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 1rem' }}>
              Economic projections based on 1 acre of established Kanva-2 / S-13 mulberry supporting 4 rearing cycles per year.
            </p>

            <div className="farm-stat-grid" style={{ marginBottom: '1rem' }}>
              <div className="farm-stat-card">
                <div className="farm-stat-label">Annual Rearing Cycles</div>
                <div className="farm-stat-number tabular-nums" style={{ color: 'var(--primary)' }}>4 Batches</div>
                <div className="farm-stat-sub">3–4 DFL boxes per batch</div>
              </div>

              <div className="farm-stat-card">
                <div className="farm-stat-label">Annual Green Cocoons</div>
                <div className="farm-stat-number tabular-nums">550 – 650 kg</div>
                <div className="farm-stat-sub">~150 kg per harvest cycle</div>
              </div>

              <div className="farm-stat-card">
                <div className="farm-stat-label">Gross Farm Revenue</div>
                <div className="farm-stat-number tabular-nums" style={{ color: 'var(--status-success)' }}>
                  KES 480,000
                </div>
                <div className="farm-stat-sub">At KES 800/kg Grade A rate</div>
              </div>

              <div className="farm-stat-card">
                <div className="farm-stat-label">Net Annual Farm Profit</div>
                <div className="farm-stat-number tabular-nums" style={{ color: 'var(--primary)' }}>
                  KES 360,000
                </div>
                <div className="farm-stat-sub">After DFLs, labor & inputs</div>
              </div>
            </div>

            {/* Comparison against Traditional Crops */}
            <div className="kalro-table-wrap">
              <table className="kalro-table">
                <thead>
                  <tr>
                    <th>Enterprise / Crop</th>
                    <th>Annual Gross (KES/Acre)</th>
                    <th>Direct Input Costs</th>
                    <th>Net Annual Margin</th>
                    <th>Payback Frequency</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: '#f4f8f5' }}>
                    <td><strong>Bivoltine Sericulture (Mulberry)</strong></td>
                    <td className="tabular-nums">KES 480,000</td>
                    <td className="tabular-nums">KES 120,000</td>
                    <td className="tabular-nums" style={{ color: 'var(--status-success)', fontWeight: 700 }}>
                      KES 360,000 / acre
                    </td>
                    <td><strong>Every 30–35 days</strong> (4 payouts)</td>
                  </tr>
                  <tr>
                    <td>Rainfed Hybrid Maize</td>
                    <td className="tabular-nums">KES 80,000</td>
                    <td className="tabular-nums">KES 35,000</td>
                    <td className="tabular-nums">KES 45,000 / acre</td>
                    <td>Semi-annual (after 5 months)</td>
                  </tr>
                  <tr>
                    <td>Smallholder Tea (Highland)</td>
                    <td className="tabular-nums">KES 180,000</td>
                    <td className="tabular-nums">KES 70,000</td>
                    <td className="tabular-nums">KES 110,000 / acre</td>
                    <td>Monthly green leaf payout</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Current Farm Cashflow Snapshot */}
          <div className="farm-stat-grid">
            <div className="farm-stat-card">
              <div className="farm-stat-label">Total Cocoon Sales</div>
              <div className="farm-stat-number tabular-nums" style={{ color: 'var(--status-success)' }}>
                {formatCurrency(totalInflow)}
              </div>
              <div className="farm-stat-sub">Reeling revenue</div>
            </div>

            <div className="farm-stat-card">
              <div className="farm-stat-label">Rearing Expenses</div>
              <div className="farm-stat-number tabular-nums" style={{ color: 'var(--status-danger)' }}>
                {formatCurrency(totalOutflow)}
              </div>
              <div className="farm-stat-sub">DFL eggs, lime, labor</div>
            </div>

            <div className="farm-stat-card">
              <div className="farm-stat-label">Net Farm Margin</div>
              <div className="farm-stat-number tabular-nums" style={{ color: netIncome >= 0 ? 'var(--primary)' : 'var(--status-danger)' }}>
                {formatCurrency(netIncome)}
              </div>
              <div className="farm-stat-sub">Operating profit</div>
            </div>
          </div>

          {/* Quick Transaction Entry */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 className="card-title">Financial Records & Ledger</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Track green cocoon income and farm operating costs.
                </p>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowAddPay(!showAddPay)}
              >
                {showAddPay ? '✕ Cancel' : '+ Record Transaction'}
              </button>
            </div>

            {/* Expandable Transaction Form */}
            {showAddPay && (
              <form onSubmit={handleAddPayment} className="farm-inline-form collapsible-content">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Flow Type</label>
                    <select
                      value={payDir}
                      onChange={(e) => setPayDir(e.target.value as 'inflow' | 'outflow')}
                      className="form-control"
                    >
                      <option value="inflow">Inflow (Cocoon Sale)</option>
                      <option value="outflow">Outflow (Expense)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Amount (KES)</label>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="form-control tabular-nums"
                      placeholder="e.g. 5000"
                      step="any"
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Buyer / Entity</label>
                    <input
                      type="text"
                      value={payParty}
                      onChange={(e) => setPayParty(e.target.value)}
                      className="form-control"
                      placeholder="e.g. Silk Reeling Unit Thika"
                      required
                    />
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn-accent">
                    Save Transaction
                  </button>
                </div>
              </form>
            )}

            {/* Payments List */}
            <div style={{ marginTop: '1rem' }}>
              {payments.length === 0 ? (
                <div className="empty-state">
                  <h4>No Financial Records</h4>
                  <p>Record your cocoon sales or egg/leaf purchases above.</p>
                </div>
              ) : (
                <div className="kalro-table-wrap">
                  <table className="kalro-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Party</th>
                        <th>Amount (KES)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.slice(-8).reverse().map((p) => (
                        <tr key={p.id}>
                          <td className="tabular-nums">{formatDate(p.date)}</td>
                          <td style={{ textTransform: 'capitalize' }}>{p.category.replace('_', ' ')}</td>
                          <td><strong>{p.partyName}</strong></td>
                          <td className="tabular-nums" style={{ fontWeight: 700, color: p.direction === 'inflow' ? 'var(--status-success)' : 'var(--status-danger)' }}>
                            {p.direction === 'inflow' ? '+' : '-'} {formatCurrency(p.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Official Agricultural Extension Export Center */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <h3 className="card-title">Official Agricultural Reports & Exports</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 1rem' }}>
              Export certified farm records for KALRO agricultural extension officers and station archives.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              <div className="farm-export-box primary">
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>
                    📄 Official PDF Report
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', margin: '4px 0 0.75rem' }}>
                    Formatted document with farm KPIs, batch registers, and KALRO signature lines.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenReportModal}
                  className="btn-accent"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Generate PDF Report
                </button>
              </div>

              <div className="farm-export-box">
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                    📊 Export CSV
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0.75rem' }}>
                    Comma-separated table of all active and completed rearing lots.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onExportCsv}
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Download CSV
                </button>
              </div>

              <div className="farm-export-box">
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                    💾 Backup Data (JSON)
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0.75rem' }}>
                    Complete cryptographic station database snapshot for offline restore.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onExportBackup}
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Export Backup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
