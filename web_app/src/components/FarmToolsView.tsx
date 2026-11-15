import React, { useState, useEffect } from 'react';
import {
  Leaf as LeafIcon,
  Thermometer,
  ShieldAlert,
  Package,
  TrendingUp,
  FileText,
  Download,
  Database,
  Check,
  AlertTriangle,
  Home,
  Wind,
  Droplets,
  Flame,
  X,
} from 'lucide-react';
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
import {
  DISEASE_LIBRARY,
  PEST_LIBRARY,
  KENYA_MULBERRY_CULTIVARS,
  KENYA_CASTOR_VARIETIES,
  KENYA_ORCHARD_BLOCKS,
  MULBERRY_EVALUATION_ACCESSIONS_COUNT,
  DEFECTIVE_COCOON_TYPES,
  COCOON_HOT_AIR_DRYING_SCHEDULE,
  MOUNTING_AND_HARVEST_STANDARDS,
  MOULTING_RULES,
  NSRC_FEEDING_SCHEDULE,
} from '../constants';
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
          { key: 'leaf', label: 'Forage & Feed', Icon: LeafIcon },
          { key: 'climate', label: 'Climate & Housing', Icon: Thermometer },
          { key: 'health', label: 'Health & Pathology', Icon: ShieldAlert },
          { key: 'harvest', label: 'Cocoon & Reeling', Icon: Package },
          { key: 'finance', label: 'Economics & Reports', Icon: TrendingUp },
        ].map((tab) => {
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as FarmTab)}
              className={`farm-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            >
              <TabIcon size={14} style={{ marginRight: '6px' }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
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
              <div className="farm-stat-sub">11 Characterized Varieties (V1, Thika, Embu...)</div>
            </div>

            <div className="farm-stat-card">
              <div className="farm-stat-label">Castor Stock (Eri)</div>
              <div className="farm-stat-number tabular-nums">{inventory.castorKg.toFixed(1)} kg</div>
              <div className="farm-stat-sub">7 Characterized Cultivars (NUU 70, KC6...)</div>
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

          {/* Characterized Mulberry Cultivars (NSRC Thika) */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Characterized Mulberry Varieties (NSRC Thika)</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Characterized accessions adopted for Kenya sericulture commercial adoption and research trials.
                </p>
              </div>
              <span className="roadmap-day-pill" style={{ backgroundColor: 'var(--primary)', color: '#ffffff' }}>
                +{MULBERRY_EVALUATION_ACCESSIONS_COUNT} Accessions in Evaluation
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
              {KENYA_MULBERRY_CULTIVARS.map((cultivar) => (
                <div
                  key={cultivar.code}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-silk)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--primary)' }}>
                      {cultivar.name}
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {cultivar.harvestTiming}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '4px', fontWeight: 500 }}>
                    {cultivar.leafQuality}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {cultivar.notes}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Characterized Castor Varieties (Samia ricini Eri Host) */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <h3 className="card-title">Characterized Castor Varieties (Eri Silkworm Host)</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0.75rem' }}>
              Screened Ricinus communis selections providing high palatability and survival for Samia ricini rearing.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
              {KENYA_CASTOR_VARIETIES.map((cv) => (
                <div
                  key={cv.code}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-silk)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--primary)' }}>
                      {cv.name}
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {cv.foliageYield}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '3px', fontWeight: 500 }}>
                    {cv.use}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {cv.notes}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Station Genebanks & Research Blocks */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <h3 className="card-title">Genebank & Research Block Infrastructure</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0.75rem' }}>
              Official station germplasm repositories, irrigation blocks, and clonal evaluation stands at NSRC Thika.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                  Centre Genebank (Core Germplasm)
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  <li>Ex-Embu Mulberry (Drought-hardy)</li>
                  <li>Ex-Thika Mulberry (Station accession)</li>
                  <li>Ex-Limuru Mulberry (Highland cold-tolerant)</li>
                  <li>Ex-Ithanga Mulberry (Sub-humid adapted)</li>
                </ul>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                  Station Genebanks
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  <li>Old Genebank (Foundational germplasm)</li>
                  <li>New Genebank (98 accessions in evaluation)</li>
                  <li>Highway Farm (Commercial multiplication)</li>
                </ul>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                  Research & Trial Blocks
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  <li>1. Collections & 2. Irrigated Drip Stand</li>
                  <li>3. Selections & 4. Non-Irrigated Rainfed</li>
                  <li>5. Cross Selections & 6. Line Selections</li>
                </ul>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                  Production Field Blocks
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  <li>Blocks C2, C3, C4 (Mulberry shoots)</li>
                  <li>Blocks D1, D2, D3, D4 (Castor & Mulberry)</li>
                  <li>Highway Farm Demonstration Stand</li>
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
                {showAddLeaf ? 'Cancel' : '+ Add Leaf Harvest'}
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
                      <option value="mulberry">Mulberry (Characterized Morus alba)</option>
                      <option value="castor">Castor (NUU 70 / KC / KMC8)</option>
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
                      placeholder="e.g. Block C3 (V1) or Centre Genebank"
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
                {climateEval.status === 'optimal' ? (
                  <Check size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                ) : (
                  <AlertTriangle size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                )}
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
            <h3 className="card-title">NSRC Table 1: Temperature & Humidity Standards for Silkworm Instars</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0.85rem' }}>
              Official physiological thresholds from NSRC Sericulture Manual (A Manual Guide for Sericulture in Kenya).
            </p>

            <div className="kalro-table-wrap">
              <table className="kalro-table">
                <thead>
                  <tr>
                    <th>Instar Stage</th>
                    <th>Temperature (°C)</th>
                    <th>Humidity (%)</th>
                    <th>Forage & Bed Management Protocols</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Egg Incubation (10–12 Days)</strong></td>
                    <td className="tabular-nums"><strong>25.0°C</strong></td>
                    <td className="tabular-nums"><strong>80 – 85%</strong></td>
                    <td>1 Case = 20,000 silkworms (20 egg sheets/cards). Black-box on day 9; uniform light on day 10.</td>
                  </tr>
                  <tr>
                    <td><strong>1st Instar (Chawki)</strong></td>
                    <td className="tabular-nums"><strong>26.0 – 28.0°C</strong></td>
                    <td className="tabular-nums"><strong>85%</strong></td>
                    <td>Brush newly hatched worms onto paraffin paper; feed chopped 3rd & 4th top tender leaves (0.5 cm²).</td>
                  </tr>
                  <tr>
                    <td><strong>2nd Instar (Chawki)</strong></td>
                    <td className="tabular-nums"><strong>26.0 – 28.0°C</strong></td>
                    <td className="tabular-nums"><strong>85%</strong></td>
                    <td>Feed 3rd & 4th leaves below glossy leaves, chopped (1.5 cm); expand bed space.</td>
                  </tr>
                  <tr>
                    <td><strong>3rd Instar</strong></td>
                    <td className="tabular-nums"><strong>24.0 – 26.0°C</strong></td>
                    <td className="tabular-nums"><strong>80%</strong></td>
                    <td>Leaves on green part of young shoot; bed space 4.0 – 8.0 m² per 20,000; net clean after moult.</td>
                  </tr>
                  <tr>
                    <td><strong>4th Instar</strong></td>
                    <td className="tabular-nums"><strong>24.0 – 25.0°C</strong></td>
                    <td className="tabular-nums"><strong>75%</strong></td>
                    <td>Shoot feeding begins: good whole shoots (1.0 – 1.5 m); bed space 8.0 – 16.0 m² per 20,000; 4th moult takes up to 48h.</td>
                  </tr>
                  <tr>
                    <td><strong>5th Instar (Peak Feeding)</strong></td>
                    <td className="tabular-nums"><strong>23.0 – 24.0°C</strong></td>
                    <td className="tabular-nums"><strong>70%</strong></td>
                    <td>85% of lifetime leaf consumed; feed whole shoots 3–4 times daily; bed space 16.0 – 34.0 m² per 20,000.</td>
                  </tr>
                  <tr>
                    <td><strong>Mounting & Cocooning</strong></td>
                    <td className="tabular-nums"><strong>&le; 26.0°C</strong></td>
                    <td className="tabular-nums"><strong>60 – 70%</strong></td>
                    <td>Mounting density 90–100 larvae/ft² on rotary mountages. Temperature &gt;26°C or RH &gt;70% severely degrades reelability.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Station Climate Moderation & Trench Engineering Guide */}
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-divider)', paddingTop: '0.85rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--primary)' }}>
                Field Methods for Moderating Temperature & Humidity in Kenya Rearing Houses
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                  <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
                    1. Wet Gunny Bags & Wall Hangings
                  </strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                    Hang wet gunny bags or damp newspapers across room walls and windows. Promotes passive evaporative cooling to drop room heat by 2–4°C and boost humidity.
                  </p>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                  <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
                    2. Cemented Floor Water Sprinkling
                  </strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                    Pour clean water directly onto cemented rearing house floors during peak afternoon heat (12:00 – 15:00) to moderate humidity for young chawki worms.
                  </p>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                  <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
                    3. Perimeter Floor Water Moat (Ant Barrier)
                  </strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                    Construct a shallow perimeter water trench along the rearing room floor edge. Holds standing water to elevate room humidity while completely halting ant invasions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Passive Climate Control Guide */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <h3 className="card-title">Passive Climate Control for Kenyan Rearing Houses</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 1rem' }}>
              Cost-effective climate architecture guidelines for high-altitude and semi-arid sericulture zones.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.95rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Home size={14} /> Roof & Ceiling Insulation
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.45 }}>
                  Corrugated iron sheets generate severe heat spikes. Install false ceilings made of papyrus mats, plywood, or thatch to buffer indoor temperature within 23–26°C.
                </p>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.95rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Wind size={14} /> 20-Mesh Wire Louvers
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.45 }}>
                  Windows must have double screens: glass/wood shutters for cold nights, and 20-mesh nylon wire screens to maintain cross-ventilation while excluding Uzi flies.
                </p>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.95rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Droplets size={14} /> Passive Evaporative Cooling
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.45 }}>
                  In hot zones (Machakos, Kitui, Siaya), hang damp hessian/gunny sacks over air inlets and sprinkle verandah floors with water to drop room temperatures by 3–4°C.
                </p>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.95rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Flame size={14} /> Chimney Charcoal Warming
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
                Quick Symptom Matcher (NSRC Table 4):
              </span>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDiseaseIdx(0)}
                  className={`farm-chip-btn ${selectedDiseaseIdx === 0 ? 'active' : ''}`}
                >
                  Milky body, oily skin & falls off bed (Grasserie)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDiseaseIdx(1)}
                  className={`farm-chip-btn ${selectedDiseaseIdx === 1 ? 'active' : ''}`}
                >
                  Pepper spots on skin & irregular moult (Pebrine)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDiseaseIdx(2)}
                  className={`farm-chip-btn ${selectedDiseaseIdx === 2 ? 'active' : ''}`}
                >
                  Flaccid body, empty gut & vomit fluids (Flacherie)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDiseaseIdx(3)}
                  className={`farm-chip-btn ${selectedDiseaseIdx === 3 ? 'active' : ''}`}
                >
                  Limp body then stiff chalk-white cadaver (Muscardine)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDiseaseIdx(4)}
                  className={`farm-chip-btn ${selectedDiseaseIdx === 4 ? 'active' : ''}`}
                >
                  Black cuticular necrotic scars (Uzi Fly)
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
                        {isDone && (
                          <span style={{ color: 'var(--status-success)', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={12} /> Completed
                          </span>
                        )}
                      </div>
                      <p className="farm-sop-desc">{sop.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NSRC Moulting & Bed Cleaning Operating Protocols */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <h3 className="card-title">NSRC Moulting & Bed Cleaning Operating Protocols</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0.85rem' }}>
              Standard operating procedures for managing larval skin shedding and bed hygiene (A Manual Guide for Sericulture in Kenya).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.95rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                  Signs of Entering Moult (Feeding Ceases)
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  <li>Silkworms completely stop feeding and cease moving.</li>
                  <li>Heads swell noticeably compared to body segments.</li>
                  <li>Silkworms elevate their heads upwards in a rigid posture.</li>
                  <li>Duration: 18–24 hours in Instars 1–3; up to 48 hours in Instar 4.</li>
                  <li><strong>Bed Care:</strong> Keep bed completely dry and uncovered. Apply agricultural lime (slaked lime powder) to absorb humidity and suppress viral infections.</li>
                </ul>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.95rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                  Indicators of Getting Out of Moult (Resume Feeding)
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  <li>Shed head capsules and loose skin visible on the rearing bed.</li>
                  <li>Worms become active and start crawling searching for forage.</li>
                  <li>Mouth parts become visibly broader and integument appears dull.</li>
                  <li>Resume feeding only when 95%+ of worms have emerged from moult.</li>
                </ul>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.95rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                  Bed Cleaning & Waste Disposal Protocol
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  <li><strong>Purpose:</strong> Remove frass (faecal matter), dead worms, and leaf remnants that promote fungal/bacterial growth.</li>
                  <li><strong>Frequency:</strong> After every moult for young instars (1st–3rd); every other day for late instars (4th–5th).</li>
                  <li><strong>Mesh Net Technique:</strong> Spread nylon mesh net over silkworms; add and spread fresh leaves on top. Worms crawl through net onto leaves within 1–2 hours. Transfer net to clean bed.</li>
                  <li><strong>Sanitation:</strong> All bed frass and leaf waste must be immediately buried or discarded in an enclosed compost pit.</li>
                </ul>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.95rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                  Silkworm Pests & Protection (Ants & Rats)
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  <li><strong>Ants:</strong> Highly destructive predators attacking young chawki and immobile moulting worms. Construct a shallow water perimeter trench around the cemented rearing room floor, or place rearing rack legs in water ant wells.</li>
                  <li><strong>Rats & Rodents:</strong> Attack spinning larvae, pupae, and stored cocoons. Install 20-mesh wire screens on all doors/windows and fit metallic kick plates on door bases.</li>
                </ul>
              </div>
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

          {/* NSRC Chapter 3: Cocoon Sorting & Defect Identification Guide */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <h3 className="card-title">NSRC Chapter 3: Cocoon Sorting & Defective Cocoon Guide</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 1rem' }}>
              Cocoon market prices are determined by Shell Ratio % and unreelable defective percentage. Separate all defective cocoons before marketing.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
              {DEFECTIVE_COCOON_TYPES.map((defect, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-silk)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem',
                  }}
                >
                  <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '3px' }}>
                    {defect.type}
                  </strong>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-main)', margin: '0 0 4px', lineHeight: 1.45 }}>
                    <strong>Cause:</strong> {defect.cause}
                  </p>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    <strong>Reeling Impact:</strong> {defect.reelingImpact}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* NSRC Automatic Hot Air Drying Procedure & Mounting Standards */}
          <div className="kalro-card" style={{ marginBottom: 0 }}>
            <h3 className="card-title">NSRC Automatic Hot Air Cocoon Drying & Mounting Standards</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 1rem' }}>
              Standard operating procedures for stifling pupae, drying cocoons, and mounting mature worms (A Manual Guide for Sericulture in Kenya).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {/* Hot Air Drying Schedule */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.95rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '6px' }}>
                  Procedure for Automatic Hot Air Drying of Cocoons
                </strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.4 }}>
                  Kills pupae, lowers moisture content, and stabilizes shelf life. Target: <strong>40% drying weight</strong>. Sun drying is forbidden because UV radiation turns cocoons yellow and ruins silk reelability.
                </p>
                <div className="kalro-table-wrap">
                  <table className="kalro-table" style={{ fontSize: '0.75rem' }}>
                    <thead>
                      <tr>
                        <th>Stage</th>
                        <th>Temperature</th>
                        <th>Duration</th>
                        <th>Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COCOON_HOT_AIR_DRYING_SCHEDULE.map((s) => (
                        <tr key={s.step}>
                          <td><strong>Step {s.step}</strong></td>
                          <td className="tabular-nums"><strong>{s.temperature}</strong></td>
                          <td className="tabular-nums">{s.duration}</td>
                          <td>{s.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mounting & Harvesting Standards */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.95rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '6px' }}>
                  Mounting, Harvesting & Transportation Operating Standards
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.55 }}>
                  <li><strong>Mounting Density:</strong> {MOUNTING_AND_HARVEST_STANDARDS.mountingDensity}. Overcrowding produces unreelable double cocoons.</li>
                  <li><strong>Mounting Microclimate:</strong> {MOUNTING_AND_HARVEST_STANDARDS.mountingClimate}</li>
                  <li><strong>Urine Absorption:</strong> {MOUNTING_AND_HARVEST_STANDARDS.floorProtection}</li>
                  <li><strong>Mountage Types:</strong> {MOUNTING_AND_HARVEST_STANDARDS.mountageTypes}</li>
                  <li><strong>Harvest Timing:</strong> {MOUNTING_AND_HARVEST_STANDARDS.harvestTiming}</li>
                  <li><strong>Pupal Confirmation:</strong> {MOUNTING_AND_HARVEST_STANDARDS.pupalConfirmation}</li>
                  <li><strong>De-flossing:</strong> {MOUNTING_AND_HARVEST_STANDARDS.deFlossing}</li>
                  <li><strong>Transportation:</strong> {MOUNTING_AND_HARVEST_STANDARDS.transportRules}</li>
                </ul>
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
              Economic projections based on 1 acre of established V1 / Thika / Kanva 2 mulberry supporting 4 rearing cycles per year.
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
                  <tr style={{ backgroundColor: 'rgba(22, 163, 74, 0.12)' }}>
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
                {showAddPay ? 'Cancel' : '+ Record Transaction'}
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
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} /> Official PDF Report
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
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Download size={16} /> Export CSV
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
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Database size={16} /> Backup Data (JSON)
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
