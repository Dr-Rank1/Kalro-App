import React, { useState, useEffect } from 'react';
import {
  Leaf as LeafIcon,
  Thermometer,
  ShieldAlert,
  Package,
  TrendingUp,
  AlertTriangle,
  Home,
  Wind,
  Droplets,
  Flame,
  Check,
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
  FarmProfile,
} from '../types';
import {
  DEFECTIVE_COCOON_TYPES,
  COCOON_HOT_AIR_DRYING_SCHEDULE,
  MOUNTING_AND_HARVEST_STANDARDS,
  MOULTING_RULES,
  NSRC_FEEDING_SCHEDULE,
} from '../constants';
import { computeCocoonMetrics } from '../utils';
import { ForageSection } from '../features/agronomy';
import { HealthSection } from '../features/health';
import { FinanceSection } from '../features/finance';

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
  // Tab 2: Climate & Housing State
  // --------------------------------------------------------------------------
  const [evalTemp, setEvalTemp] = useState<number>(25.5);
  const [evalHumidity, setEvalHumidity] = useState<number>(72);
  const [evalStage, setEvalStage] = useState<'incubation' | 'chawki' | 'late' | 'spinning'>('late');

  // --------------------------------------------------------------------------
  // Tab 4: Cocoon & Reeling State
  // --------------------------------------------------------------------------
  const [sampleWeightG, setSampleWeightG] = useState<number>(500);
  const [sampleCount, setSampleCount] = useState<number>(250);
  const [sampleShellWeightG, setSampleShellWeightG] = useState<number>(0.42);
  const [sampleDefects, setSampleDefects] = useState<number>(6);

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
              className={`farm-tab-btn min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A] ${activeTab === tab.key ? 'active' : ''}`}
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
        <ForageSection inventory={inventory} onAddLeafMovement={onAddLeafMovement} />
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
        <HealthSection mortalityLogs={mortalityLogs} />
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
        <FinanceSection
          payments={payments}
          onAddPayment={onAddPayment}
          onOpenReportModal={onOpenReportModal}
          onExportCsv={onExportCsv}
          onExportBackup={onExportBackup}
        />
      )}
    </div>
  );
};
