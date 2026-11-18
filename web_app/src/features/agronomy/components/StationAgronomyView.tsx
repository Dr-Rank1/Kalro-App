import { useState, useEffect, useRef } from 'react';
import {
  Sprout,
  Award,
  Flame,
  Maximize2,
  ShieldAlert,
  Wallet,
  PhoneCall,
  Dna,
  Play,
  Pause,
  RotateCcw,
  Check,
  ArrowRight,
  Volume2,
  Building2,
  Leaf,
} from 'lucide-react';
import {
  Batch,
  FarmProfile,
  PaymentRecord,
} from '../../../types';
import {
  KENYA_MULBERRY_CULTIVARS,
  KENYA_CASTOR_VARIETIES,
  KENYA_ORCHARD_BLOCKS,
  MULBERRY_EVALUATION_ACCESSIONS_COUNT,
  DEFECTIVE_COCOON_TYPES,
  COCOON_HOT_AIR_DRYING_SCHEDULE,
  DISEASE_LIBRARY,
  PEST_LIBRARY,
  KENYA_SERICULTURE_BREEDS,
} from '../../../constants';
import { formatCurrency } from '../../../utils';

interface StationAgronomyViewProps {
  batches: Batch[];
  profile: FarmProfile | null;
  payments: PaymentRecord[];
  onAddPayment?: (payment: PaymentRecord) => void;
  onToast: (msg: string) => void;
}

export type StationSubTab =
  | 'genebank'
  | 'quality'
  | 'dryer'
  | 'bed'
  | 'disease'
  | 'finance'
  | 'ussd'
  | 'breeding';

export const StationAgronomyView = ({
  batches: _batches,
  profile,
  payments,
  onAddPayment,
  onToast,
}: StationAgronomyViewProps) => {
  const [subTab, setSubTab] = useState<StationSubTab>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('subtab') as StationSubTab;
      if (p && ['genebank', 'quality', 'dryer', 'bed', 'disease', 'finance', 'ussd', 'breeding'].includes(p)) {
        return p;
      }
    }
    return 'genebank';
  });

  const handleSubTabChange = (newTab: StationSubTab) => {
    setSubTab(newTab);
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('subtab', newTab);
      window.history.pushState({ subtab: newTab }, '', currentUrl.toString());
    }
  };

  // -------------------------------------------------------------
  // 1. GENEBANK & FIELD BLOCKS STATE
  // -------------------------------------------------------------
  const [blockCategoryFilter, setBlockCategoryFilter] = useState<'all' | 'genebank' | 'research' | 'station'>('all');
  const [selectedOrchardBlock, setSelectedOrchardBlock] = useState<string>(KENYA_ORCHARD_BLOCKS[0].code);
  const [cultivarTypeFilter, setCultivarTypeFilter] = useState<'all' | 'mulberry' | 'castor'>('all');
  const [orchardAcreage, setOrchardAcreage] = useState<number>(1.0);
  const [spacingModel, setSpacingModel] = useState<'standard' | 'paired'>('standard');
  const [pruningDaysToHatch, setPruningDaysToHatch] = useState<number>(50);

  // -------------------------------------------------------------
  // 2. COCOON QUALITY & SHELL RATIO STATE
  // -------------------------------------------------------------
  const [grossCocoonKg, setGrossCocoonKg] = useState<number>(35.0);
  const [sampleCocoonCount] = useState<number>(50);
  const [sampleCocoonWeightGrams, setSampleCocoonWeightGrams] = useState<number>(92.5); // ~1.85g per cocoon
  const [sampleShellWeightGrams, setSampleShellWeightGrams] = useState<number>(19.5); // ~0.39g shell (21%)
  const [defectCounts, setDefectCounts] = useState<{ [key: string]: number }>({
    'Thin Cocoons': 2,
    'Framed Cocoons': 1,
    'Irregular Cocoons': 1,
    'Melted Cocoons': 0,
    'Double Cocoons': 1,
    'Stained Cocoons': 0,
    'Pierced Cocoons': 0,
  });

  // -------------------------------------------------------------
  // 3. HOT AIR DRYING CONTROLLER STATE
  // -------------------------------------------------------------
  const getStepMinutes = (durationStr: string) => {
    const match = durationStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 60;
  };

  const [currentDryingStepIndex, setCurrentDryingStepIndex] = useState<number>(0);
  const [dryingTimeRemainingSeconds, setDryingTimeRemainingSeconds] = useState<number>(
    getStepMinutes(COCOON_HOT_AIR_DRYING_SCHEDULE[0].duration) * 60
  );
  const [isDryingRunning, setIsDryingRunning] = useState<boolean>(false);
  const [freshCocoonWeightKg, setFreshCocoonWeightKg] = useState<number>(50.0);
  const [actualDryCocoonWeightKg, setActualDryCocoonWeightKg] = useState<number>(20.0);
  const [dryingHistory, setDryingHistory] = useState<Array<{
    timestamp: string;
    step: string;
    temp: string;
    duration: string;
    freshKg: number;
    dryKg: number;
  }>>([]);

  // -------------------------------------------------------------
  // 4. BED AREA & SLAKED LIME DOSING STATE
  // -------------------------------------------------------------
  const [larvaeCases, setLarvaeCases] = useState<number>(2); // 2 cases = 40,000 larvae
  const [selectedInstar, setSelectedInstar] = useState<number>(5);

  // -------------------------------------------------------------
  // 5. DISEASE & PEST TRIAGE STATE
  // -------------------------------------------------------------
  const [selectedDiseaseName, setSelectedDiseaseName] = useState<string>(DISEASE_LIBRARY[0].name);
  const [waterLitersForDisinfectant, setWaterLitersForDisinfectant] = useState<number>(20);

  // -------------------------------------------------------------
  // 6. FINANCIAL M-PESA PAYOUT STATE
  // -------------------------------------------------------------
  const [farmerPhone, setFarmerPhone] = useState<string>('0712345678');
  const [farmerName, setFarmerName] = useState<string>('Peter Mwangi');
  const [payoutRatePerKg, setPayoutRatePerKg] = useState<number>(900); // KES 900/kg for Grade A
  const [mpesaReceipt, setMpesaReceipt] = useState<string | null>(null);
  const [isMpesaProcessing, setIsMpesaProcessing] = useState<boolean>(false);

  // -------------------------------------------------------------
  // 7. USSD *384# SIMULATOR STATE
  // -------------------------------------------------------------
  const [ussdStep, setUssdStep] = useState<'idle' | 'main' | 'feed' | 'moult' | 'harvest' | 'prices'>('idle');
  const [ussdFeedKg, setUssdFeedKg] = useState<string>('45');
  const [ussdNotice, setUssdNotice] = useState<string>('');
  const [selectedAudioLang, setSelectedAudioLang] = useState<'en' | 'sw' | 'kikuyu' | 'kamba'>('sw');

  // -------------------------------------------------------------
  // DRYING TIMER EFFECT
  // -------------------------------------------------------------
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isDryingRunning) {
      timerRef.current = window.setInterval(() => {
        setDryingTimeRemainingSeconds((prev) => {
          if (prev <= 1) {
            playChime();
            const nextIdx = currentDryingStepIndex + 1;
            if (nextIdx < COCOON_HOT_AIR_DRYING_SCHEDULE.length) {
              setCurrentDryingStepIndex(nextIdx);
              const nextMins = getStepMinutes(COCOON_HOT_AIR_DRYING_SCHEDULE[nextIdx].duration);
              onToast(`Stage ${currentDryingStepIndex + 1} finished! Advancing to ${COCOON_HOT_AIR_DRYING_SCHEDULE[nextIdx].temperature}`);
              return nextMins * 60;
            } else {
              setIsDryingRunning(false);
              onToast('Hot-Air Drying Cycle Complete! 40% Target Reached.');
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isDryingRunning, currentDryingStepIndex, onToast]);

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // AudioContext not permitted or unsupported
    }
  };

  // -------------------------------------------------------------
  // CALCULATIONS
  // -------------------------------------------------------------
  // 1. Spacing & Bush Population
  const bushPopulation = spacingModel === 'standard'
    ? Math.round((orchardAcreage * 4046.86) / (1.5 * 1.5))
    : Math.round((orchardAcreage * 4046.86) / (0.9 * 0.9));
  const estimatedLeafBiomassKgPerYear = bushPopulation * 4.5; // ~4.5 kg leaf/bush/year under Kenyan rainfall
  const silkwormBoxCapacity = Math.max(1, Math.floor(estimatedLeafBiomassKgPerYear / 350));

  // 2. Cocoon Grading & Shell Ratio
  const shellRatioPercent = sampleCocoonWeightGrams > 0
    ? (sampleShellWeightGrams / sampleCocoonWeightGrams) * 100
    : 0;
  const totalDefectsCount = Object.values(defectCounts).reduce((a, b) => a + b, 0);
  const defectRatePercent = sampleCocoonCount > 0
    ? (totalDefectsCount / sampleCocoonCount) * 100
    : 0;

  // Grade Assignment
  let commercialGrade: 'Grade A' | 'Grade B' | 'Grade C' = 'Grade B';
  let suggestedPricePerKg = 800;
  if (shellRatioPercent >= 20.0 && defectRatePercent <= 6.0) {
    commercialGrade = 'Grade A';
    suggestedPricePerKg = 950;
  } else if (shellRatioPercent >= 16.0 && defectRatePercent <= 12.0) {
    commercialGrade = 'Grade B';
    suggestedPricePerKg = 800;
  } else {
    commercialGrade = 'Grade C';
    suggestedPricePerKg = 600;
  }
  const estimatedRenditta = shellRatioPercent > 0
    ? Math.round((100 / (shellRatioPercent * 0.42)) * 10) / 10
    : 7.5;
  const totalPayoutValue = grossCocoonKg * suggestedPricePerKg;

  // 3. Bed Area & Lime Dosing
  const bedAreaTable = [0, 4.0, 8.0, 16.0, 24.0, 34.0]; // m2 per 2 cases for instars 1-5
  const requiredBedAreaSqMeters = (bedAreaTable[selectedInstar] || 34.0) * (larvaeCases / 2);
  const standardTraysCount = Math.ceil(requiredBedAreaSqMeters / (1.2 * 0.9)); // standard tray is 1.2m x 0.9m
  const slakedLimeGrams = Math.round(requiredBedAreaSqMeters * 50); // 50g per m2 standard dusting

  // Format Timer
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Disinfectant Dilution Formulas
  const formalin2PercentMl = waterLitersForDisinfectant * 50; // 50ml of 40% commercial formalin per liter of water
  const bleachingPowder5PercentGrams = waterLitersForDisinfectant * 50; // 50g bleaching powder per liter

  // Handle M-Pesa Payout
  const handleSimulateMpesa = () => {
    if (!farmerPhone || farmerPhone.length < 9) {
      onToast('Please enter a valid Safaricom phone number.');
      return;
    }
    setIsMpesaProcessing(true);
    setTimeout(() => {
      const receipt = 'SDK' + Math.floor(100000000 + Math.random() * 900000000);
      setMpesaReceipt(receipt);
      setIsMpesaProcessing(false);
      onToast(`M-Pesa B2C Payout of KES ${totalPayoutValue.toLocaleString()} sent to ${farmerPhone}! Ref: ${receipt}`);
      if (onAddPayment) {
        onAddPayment({
          id: 'pay-' + Date.now(),
          amount: totalPayoutValue,
          direction: 'outflow',
          category: 'cocoon_sale',
          date: new Date().toISOString(),
          partyName: `${farmerName} (${farmerPhone})`,
          status: 'settled',
          notes: `Cocoon Procurement: ${grossCocoonKg}kg ${commercialGrade} @ KES ${suggestedPricePerKg}/kg. M-Pesa Ref: ${receipt}`,
        });
      }
    }, 1200);
  };

  // Filtered blocks
  const filteredOrchardBlocks = KENYA_ORCHARD_BLOCKS.filter((b) => {
    if (blockCategoryFilter === 'genebank') return b.category.toLowerCase().includes('genebank');
    if (blockCategoryFilter === 'research') return b.category.toLowerCase().includes('research');
    if (blockCategoryFilter === 'station') return b.category.toLowerCase().includes('station');
    return true;
  });

  const subTabItems: Array<{
    key: StationSubTab;
    label: string;
    icon: typeof Sprout;
  }> = [
    { key: 'genebank', label: 'Genebank & Plots', icon: Sprout },
    { key: 'quality', label: 'Cocoon Grading', icon: Award },
    { key: 'dryer', label: 'Hot-Air Dryer', icon: Flame },
    { key: 'bed', label: 'Bed Space & Lime', icon: Maximize2 },
    { key: 'disease', label: 'Disease Triage', icon: ShieldAlert },
    { key: 'finance', label: 'M-Pesa Payouts', icon: Wallet },
    { key: 'ussd', label: 'USSD & Audio', icon: PhoneCall },
    { key: 'breeding', label: 'Breeding & Pedigree', icon: Dna },
  ];

  return (
    <div className="station-suite-container">
      {/* 1. Station Executive Header & Sub-Navigation */}
      <div className="station-header-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Station &amp; Agronomy Hub</h1>
              <span className="station-badge station-badge-success">
                KALRO NSRC Thika
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              National Sericulture Research Centre · Mulberry &amp; Castor Genebank, Quality Grading, 4-Stage Drying &amp; M-Pesa Disbursements
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Building2 size={13} className="text-emerald-700" />
            <span>Station: <strong className="text-slate-800">{profile?.orgName || 'NSRC Thika Station'}</strong></span>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="station-subtabs-nav scrollbar-none pb-1">
          {subTabItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleSubTabChange(tab.key)}
                className={`station-subtab-btn ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={16} className="shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. GENEBANK & FIELD BLOCKS */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'genebank' && (
        <div className="station-grid-layout">
          {/* Left Column: Research Blocks & Cultivar Catalog */}
          <div className="space-y-5">
            <div className="station-panel-card">
              <div className="station-panel-header">
                <div>
                  <h2 className="station-panel-title">Research Blocks & Genebank Plots</h2>
                  <p className="station-panel-desc">
                    Characterized mulberry collections, castor trials, and designated field blocks at NSRC Thika.
                  </p>
                </div>
                <span className="station-badge station-badge-warning">
                  {MULBERRY_EVALUATION_ACCESSIONS_COUNT} Accessions
                </span>
              </div>

              {/* Block Category Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { key: 'all', label: 'All Blocks (20)' },
                  { key: 'genebank', label: 'Genebank Plots' },
                  { key: 'research', label: 'Research Blocks' },
                  { key: 'station', label: 'Field Blocks' },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setBlockCategoryFilter(cat.key as typeof blockCategoryFilter)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      blockCategoryFilter === cat.key
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Block Selection Matrix */}
              <div className="station-blocks-grid">
                {filteredOrchardBlocks.map((blk) => {
                  const isSelected = selectedOrchardBlock === blk.code;
                  return (
                    <button
                      key={blk.code}
                      type="button"
                      onClick={() => setSelectedOrchardBlock(blk.code)}
                      className={`station-block-btn ${isSelected ? 'active' : ''}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="station-badge station-badge-neutral text-[10px] py-0 px-1.5 font-mono">{blk.code}</span>
                        <span className="text-[11px] font-semibold text-slate-500">{blk.acreage} ac</span>
                      </div>
                      <span className="station-block-btn-title mt-1.5">{blk.name}</span>
                      <span className="station-block-btn-sub">
                        <span className="flex items-center gap-1 truncate text-slate-600">
                          <Leaf size={11} className={isSelected ? 'text-emerald-700' : 'text-slate-400'} />
                          <span>{blk.cultivar}</span>
                        </span>
                        {isSelected && <Check size={14} className="text-emerald-700 shrink-0 ml-1" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Block Dossier Card */}
              {(() => {
                const activeBlk = KENYA_ORCHARD_BLOCKS.find((b) => b.code === selectedOrchardBlock) || KENYA_ORCHARD_BLOCKS[0];
                return (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Leaf size={14} className="text-emerald-700" />
                        <span className="font-bold text-slate-900 text-sm">{activeBlk.name}</span>
                      </div>
                      <span className="bg-white px-2.5 py-0.5 rounded border border-emerald-300 font-medium text-emerald-800 text-[11px]">
                        {activeBlk.category} · {activeBlk.acreage} Acres
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{activeBlk.notes}</p>
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-700">Primary Stand Cultivar:</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-slate-300 font-semibold text-slate-800">
                        {activeBlk.cultivar}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">
                        ({activeBlk.leafType})
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Characterized Cultivars Catalog */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Characterized Forage Varieties</h3>
                  <div className="flex gap-1.5">
                    {(['all', 'mulberry', 'castor'] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setCultivarTypeFilter(filter)}
                        className={`text-xs px-3 py-1 rounded-md capitalize font-medium transition-all ${
                          cultivarTypeFilter === filter
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {(cultivarTypeFilter === 'all' || cultivarTypeFilter === 'mulberry') &&
                    KENYA_MULBERRY_CULTIVARS.map((m) => (
                      <div key={m.code} className="border border-slate-200 rounded-lg p-3 bg-white space-y-1.5 text-xs hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">{m.name}</span>
                          <span className="station-badge station-badge-success text-[10px]">
                            Mulberry
                          </span>
                        </div>
                        <p className="text-slate-600 line-clamp-2">{m.notes}</p>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Harvest: {m.harvestTiming}
                        </div>
                      </div>
                    ))}

                  {(cultivarTypeFilter === 'all' || cultivarTypeFilter === 'castor') &&
                    KENYA_CASTOR_VARIETIES.map((c) => (
                      <div key={c.code} className="border border-slate-200 rounded-lg p-3 bg-white space-y-1.5 text-xs hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                          <span className="station-badge station-badge-warning text-[10px]">
                            Castor (Eri)
                          </span>
                        </div>
                        <p className="text-slate-600 line-clamp-2">{c.notes}</p>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Yield: {c.foliageYield}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Agronomy & Pruning Forecaster */}
          <div className="space-y-5">
            <div className="station-panel-card text-xs">
              <div className="station-panel-header">
                <div>
                  <h2 className="station-panel-title">Biomass & Spacing Calculator</h2>
                  <p className="station-panel-desc">
                    Field plantation carrying capacity based on Kenyan rainfall models.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="station-form-group">
                  <label className="station-form-label flex items-center justify-between">
                    <span>Plot Size</span>
                    <span className="text-xs text-slate-400 font-normal">Kenyan Acreage Model</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      value={orchardAcreage}
                      onChange={(e) => setOrchardAcreage(parseFloat(e.target.value) || 0.25)}
                      className="station-form-input pl-3 pr-16 font-bold text-slate-900"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Acres
                      </span>
                    </div>
                  </div>
                </div>

                <div className="station-form-group">
                  <label className="station-form-label">Planting Geometry System</label>
                  <select
                    value={spacingModel}
                    onChange={(e) => setSpacingModel(e.target.value as 'standard' | 'paired')}
                    className="station-form-select font-medium text-slate-800"
                  >
                    <option value="standard">Standard Square (1.5m × 1.5m) · 1,798 bushes/ac</option>
                    <option value="paired">Paired Row System (0.9m × 0.9m) · 4,996 bushes/ac</option>
                  </select>
                </div>

                {/* Calculation Output Strip */}
                <div className="grid grid-cols-3 gap-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Bushes</span>
                    <span className="text-base font-extrabold text-emerald-950 tabular-nums">{bushPopulation.toLocaleString()}</span>
                    <span className="text-[10px] text-emerald-700/80">established</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Annual Foliage</span>
                    <span className="text-base font-extrabold text-emerald-950 tabular-nums">{Math.round(estimatedLeafBiomassKgPerYear).toLocaleString()}</span>
                    <span className="text-[10px] text-emerald-700/80">kg / year</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Box Capacity</span>
                    <span className="text-base font-extrabold text-emerald-950 tabular-nums">{silkwormBoxCapacity}</span>
                    <span className="text-[10px] text-emerald-700/80">boxes / yr</span>
                  </div>
                </div>
              </div>

              {/* Pruning & Egg Incubation Sync */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs">Pruning & Egg Incubation Sync</h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                    pruningDaysToHatch >= 45 && pruningDaysToHatch <= 60
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}>
                    {pruningDaysToHatch >= 45 && pruningDaysToHatch <= 60 ? 'Optimal Pruning Window' : 'Adjust Pruning Timing'}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Bottom-prune mulberry 45–60 days before egg brushing so young tender shoots match Chawki larvae and mature shoots align with voracious 5th instar.
                </p>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-medium text-slate-700 text-xs">
                    <span>Countdown to Brushing:</span>
                    <strong className="text-slate-900 font-bold">{pruningDaysToHatch} Days</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={pruningDaysToHatch}
                    onChange={(e) => setPruningDaysToHatch(parseInt(e.target.value) || 50)}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>10 Days</span>
                    <span className="text-emerald-700 font-bold">45–60d (NSRC Table 3)</span>
                    <span>90 Days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. COCOON QUALITY, SHELL RATIO & PRICING ENGINE */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'quality' && (
        <div className="station-grid-layout">
          <div className="space-y-5">
            <div className="station-panel-card text-xs">
              <div className="station-panel-header">
                <div>
                  <h2 className="station-panel-title">Cocoon Quality & Defect Classifier</h2>
                  <p className="station-panel-desc">
                    Evaluate 50-cocoon random sample weights and defects according to NSRC Manual Chapter 3.1.
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-md font-bold text-xs border ${
                  commercialGrade === 'Grade A'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : commercialGrade === 'Grade B'
                    ? 'bg-blue-50 text-blue-900 border-blue-300'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}>
                  {commercialGrade} ({shellRatioPercent.toFixed(1)}% SR)
                </div>
              </div>

              {/* Sample Metrics Form */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="station-form-group">
                  <label className="station-form-label">Total Cocoon Lot (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={grossCocoonKg}
                    onChange={(e) => setGrossCocoonKg(parseFloat(e.target.value) || 0)}
                    className="station-form-input font-bold"
                  />
                </div>
                <div className="station-form-group">
                  <label className="station-form-label">50-Cocoon Sample (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sampleCocoonWeightGrams}
                    onChange={(e) => setSampleCocoonWeightGrams(parseFloat(e.target.value) || 0)}
                    className="station-form-input font-bold"
                  />
                </div>
                <div className="station-form-group">
                  <label className="station-form-label">50-Cocoon Shell Wt (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sampleShellWeightGrams}
                    onChange={(e) => setSampleShellWeightGrams(parseFloat(e.target.value) || 0)}
                    className="station-form-input font-bold text-emerald-700"
                  />
                </div>
              </div>

              {/* 7 Defective Cocoon Stepper Controls */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">
                    7 Defective Cocoon Classes (In 50-Cocoon Sample)
                  </h3>
                  <span className="text-slate-500 font-mono text-xs">
                    Defective: <strong className="text-slate-800">{totalDefectsCount} / {sampleCocoonCount}</strong> ({defectRatePercent.toFixed(1)}%)
                  </span>
                </div>

                <div className="defect-stepper-grid">
                  {DEFECTIVE_COCOON_TYPES.map((def) => {
                    const count = defectCounts[def.type] || 0;
                    return (
                      <div key={def.type} className="defect-stepper-card">
                        <span className="defect-stepper-header" title={def.type}>
                          {def.type}
                        </span>
                        <div className="defect-stepper-controls">
                          <button
                            type="button"
                            onClick={() => setDefectCounts((prev) => ({ ...prev, [def.type]: Math.max(0, count - 1) }))}
                            className="stepper-btn"
                            aria-label={`Decrease ${def.type}`}
                          >
                            -
                          </button>
                          <span className="stepper-value tabular-nums">{count}</span>
                          <button
                            type="button"
                            onClick={() => setDefectCounts((prev) => ({ ...prev, [def.type]: count + 1 }))}
                            className="stepper-btn"
                            aria-label={`Increase ${def.type}`}
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate" title={def.cause}>
                          {def.cause}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Commercial Price Fixation */}
          <div className="space-y-5">
            <div className="station-panel-card text-xs">
              <div className="station-panel-header">
                <div>
                  <h2 className="station-panel-title">Commercial Price Fixation</h2>
                  <p className="station-panel-desc">Official NSRC farmgate buying formula.</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Shell Ratio (SR%):</span>
                  <span className="font-bold text-emerald-800 tabular-nums">{shellRatioPercent.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Sample Defect Rate:</span>
                  <span className="font-bold text-slate-800 tabular-nums">{defectRatePercent.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Estimated Renditta:</span>
                  <span className="font-bold text-slate-900 tabular-nums">{estimatedRenditta} kg fresh / kg silk</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-700 font-semibold">Buying Rate / kg:</span>
                  <span className="font-bold text-base text-slate-900 tabular-nums">
                    KES {suggestedPricePerKg.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-700 font-bold">Total Batch Payout:</span>
                  <span className="font-extrabold text-lg text-emerald-700 tabular-nums">
                    KES {totalPayoutValue.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-700">NSRC Commercial Grading Criteria:</p>
                <p>• Grade A: SR &ge; 20%, Defects &le; 6% (KES 950/kg)</p>
                <p>• Grade B: SR 16–19.9%, Defects &le; 12% (KES 800/kg)</p>
                <p>• Grade C: SR &lt; 16% or Defects &gt; 12% (KES 600/kg)</p>
              </div>

              <button
                type="button"
                onClick={() => handleSubTabChange('finance')}
                className="btn-accent min-h-[48px] w-full"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <span>Proceed to M-Pesa Disbursement</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. HOT AIR COCOON DRYING CONTROLLER */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'dryer' && (
        <div className="station-grid-layout">
          <div className="space-y-5">
            <div className="station-panel-card text-xs">
              <div className="station-panel-header">
                <div>
                  <h2 className="station-panel-title">Hot-Air Cocoon Dryer Controller</h2>
                  <p className="station-panel-desc">
                    4-Stage temperature schedule to kill pupae, dry to 40% moisture, and protect cocoon reelability.
                  </p>
                </div>
              </div>

              {/* 4-Stage Drying Timeline */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {COCOON_HOT_AIR_DRYING_SCHEDULE.map((st, idx) => {
                  const isCurrent = currentDryingStepIndex === idx;
                  return (
                    <div
                      key={st.step}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold text-slate-500">Stage {idx + 1}</div>
                      <div className="text-base font-extrabold my-0.5 text-slate-900">{st.temperature}</div>
                      <div className="text-[11px] font-medium text-slate-600">{st.duration}</div>
                      <div className="text-[10px] mt-1 line-clamp-1 text-slate-400">{st.purpose}</div>
                    </div>
                  );
                })}
              </div>

              {/* Main Live Digital Timer */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 text-center space-y-3 shadow-sm">
                <div className="text-xs text-emerald-400 tracking-wider uppercase font-semibold">
                  Stage {currentDryingStepIndex + 1} of 4: {COCOON_HOT_AIR_DRYING_SCHEDULE[currentDryingStepIndex].temperature} ({COCOON_HOT_AIR_DRYING_SCHEDULE[currentDryingStepIndex].purpose})
                </div>
                <div className="text-5xl font-extrabold font-mono tracking-wider tabular-nums text-white">
                  {formatTimer(dryingTimeRemainingSeconds)}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDryingRunning(!isDryingRunning)}
                    className={`btn-primary min-h-[44px] px-5 text-xs ${isDryingRunning ? 'bg-amber-600 border-amber-600 hover:bg-amber-700' : ''}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {isDryingRunning ? <Pause size={14} /> : <Play size={14} />}
                    <span>{isDryingRunning ? 'Pause Drying' : 'Start Chamber Drying'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = (currentDryingStepIndex + 1) % COCOON_HOT_AIR_DRYING_SCHEDULE.length;
                      setCurrentDryingStepIndex(next);
                      setDryingTimeRemainingSeconds(getStepMinutes(COCOON_HOT_AIR_DRYING_SCHEDULE[next].duration) * 60);
                      onToast(`Switched to Stage ${next + 1}: ${COCOON_HOT_AIR_DRYING_SCHEDULE[next].temperature}`);
                    }}
                    className="btn-secondary min-h-[44px] px-4 text-xs"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <span>Next Stage</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDryingRunning(false);
                      setDryingTimeRemainingSeconds(getStepMinutes(COCOON_HOT_AIR_DRYING_SCHEDULE[currentDryingStepIndex].duration) * 60);
                    }}
                    className="btn-secondary min-h-[44px] px-4 text-xs"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <RotateCcw size={13} />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Weight Verification */}
          <div className="space-y-5">
            <div className="station-panel-card text-xs">
              <div className="station-panel-header">
                <div>
                  <h2 className="station-panel-title">40% Moisture Verification</h2>
                  <p className="station-panel-desc">Prevent mold and pupal emergence in storage.</p>
                </div>
              </div>

              <div className="station-form-group">
                <label className="station-form-label">Fresh Harvest Cocoon (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={freshCocoonWeightKg}
                  onChange={(e) => setFreshCocoonWeightKg(parseFloat(e.target.value) || 0)}
                  className="station-form-input font-bold"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                <span className="text-slate-600 text-[11px] font-medium">Target Dry Cocoon Weight (40%):</span>
                <div className="text-2xl font-extrabold text-emerald-700 tabular-nums">
                  {(freshCocoonWeightKg * 0.4).toFixed(1)} kg
                </div>
                <span className="text-[10px] text-slate-500">
                  Target dry yield to safely prevent moth emergence and sericin spoilage.
                </span>
              </div>

              <div className="station-form-group">
                <label className="station-form-label">Actual Dried Cocoon Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={actualDryCocoonWeightKg}
                  onChange={(e) => setActualDryCocoonWeightKg(parseFloat(e.target.value) || 0)}
                  className="station-form-input font-bold"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setDryingHistory((prev) => [
                    ...prev,
                    {
                      timestamp: new Date().toLocaleTimeString(),
                      step: `Stage ${currentDryingStepIndex + 1}`,
                      temp: COCOON_HOT_AIR_DRYING_SCHEDULE[currentDryingStepIndex].temperature,
                      duration: COCOON_HOT_AIR_DRYING_SCHEDULE[currentDryingStepIndex].duration,
                      freshKg: freshCocoonWeightKg,
                      dryKg: actualDryCocoonWeightKg,
                    },
                  ]);
                  onToast('Drying run session saved to local station records.');
                }}
                className="btn-secondary min-h-[44px] w-full"
              >
                Save Drying Record
              </button>

              {dryingHistory.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-700">Recent Session Log:</span>
                  <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px]">
                    {dryingHistory.map((h, i) => (
                      <div key={i} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                        <span className="font-medium text-slate-800">{h.step} ({h.temp})</span>
                        <span className="text-emerald-700 font-bold">{h.dryKg} kg dry</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. BED AREA & SLAKED LIME DOSING */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'bed' && (
        <div className="station-grid-layout">
          <div className="space-y-5">
            <div className="station-panel-card text-xs">
              <div className="station-panel-header">
                <div>
                  <h2 className="station-panel-title">Instar Bed Space & Tray Expansion (Table 2.0)</h2>
                  <p className="station-panel-desc">
                    Prevent larval suffocation, overcrowding, and double cocoons with proper spacing.
                  </p>
                </div>
                <span className="station-badge station-badge-success">
                  {(larvaeCases * 20000).toLocaleString()} Silkworms Total
                </span>
              </div>

              {/* Case & Instar Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="station-form-group">
                  <label className="station-form-label">Rearing Volume (Cases of 20,000 eggs)</label>
                  <select
                    value={larvaeCases}
                    onChange={(e) => setLarvaeCases(parseInt(e.target.value) || 1)}
                    className="station-form-select"
                  >
                    <option value={1}>1 Case (20,000 Larvae)</option>
                    <option value={2}>2 Cases (40,000 Larvae) · Standard NSRC Spec</option>
                    <option value={3}>3 Cases (60,000 Larvae)</option>
                    <option value={4}>4 Cases (80,000 Larvae)</option>
                  </select>
                </div>
                <div className="station-form-group">
                  <label className="station-form-label">Current Larval Instar Stage</label>
                  <select
                    value={selectedInstar}
                    onChange={(e) => setSelectedInstar(parseInt(e.target.value) || 1)}
                    className="station-form-select"
                  >
                    <option value={1}>1st Instar (Chawki Brushing) · 2.0 m² / case</option>
                    <option value={2}>2nd Instar (Chawki Active) · 3.5 m² / case</option>
                    <option value={3}>3rd Instar · 4.0 m² / case</option>
                    <option value={4}>4th Instar · 8.0 m² / case</option>
                    <option value={5}>5th Instar (Voracious Peak) · 17.0 m² / case</option>
                  </select>
                </div>
              </div>

              {/* Bed Space Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-slate-600 font-medium text-[11px]">Required Floor Area:</span>
                  <div className="text-2xl font-extrabold text-emerald-700 tabular-nums">
                    {requiredBedAreaSqMeters.toFixed(1)} m²
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({(requiredBedAreaSqMeters * 10.7639).toFixed(0)} sq ft)
                  </span>
                </div>

                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-slate-600 font-medium text-[11px]">Wooden Trays Needed:</span>
                  <div className="text-2xl font-extrabold text-blue-900 tabular-nums">
                    {standardTraysCount} trays
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    1.2m × 0.9m standard size
                  </span>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-slate-600 font-medium text-[11px]">Mountage Frames:</span>
                  <div className="text-2xl font-extrabold text-amber-900 tabular-nums">
                    {Math.ceil((larvaeCases * 20000) / 1120)} frames
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    90–100 larvae/sq ft
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Slaked Lime Dosing */}
          <div className="space-y-5">
            <div className="station-panel-card text-xs">
              <div className="station-panel-header">
                <div>
                  <h2 className="station-panel-title">Slaked Lime Dosing</h2>
                  <p className="station-panel-desc">Humidity absorption & pathogen suppression during moult.</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Bed Floor Area:</span>
                  <span className="font-bold text-slate-800 tabular-nums">{requiredBedAreaSqMeters.toFixed(1)} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Standard Dosing:</span>
                  <span className="font-bold text-slate-800 font-mono">50 g / m²</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-800 font-bold">Total Slaked Lime Powder:</span>
                  <span className="font-extrabold text-emerald-700 text-base tabular-nums">
                    {slakedLimeGrams >= 1000 ? `${(slakedLimeGrams / 1000).toFixed(2)} kg` : `${slakedLimeGrams} grams`}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-amber-900 leading-relaxed bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1">
                <span className="font-bold block">Application Timing:</span>
                Dust lightly over silkworms through a fine muslin cloth right as 90% of worms raise their heads and cease feeding (entering moult). Do not feed over fresh lime.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. DISEASE & PEST TRIAGE */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'disease' && (
        <div className="station-grid-layout">
          <div className="space-y-5">
            <div className="station-panel-card text-xs">
              <div className="station-panel-header">
                <div>
                  <h2 className="station-panel-title">Silkworm Pathology & Disease Triage (Table 4)</h2>
                  <p className="station-panel-desc">Clinical diagnostics and immediate eradication measures.</p>
                </div>
              </div>

              {/* Disease Selection Pills */}
              <div className="flex flex-wrap gap-2">
                {DISEASE_LIBRARY.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => setSelectedDiseaseName(d.name)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      selectedDiseaseName === d.name
                        ? 'bg-rose-900 border-rose-900 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>

              {/* Active Disease Inspector */}
              {(() => {
                const disease = DISEASE_LIBRARY.find((d) => d.name === selectedDiseaseName) || DISEASE_LIBRARY[0];
                return (
                  <div className="border border-rose-200 bg-rose-50/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-rose-950">{disease.name}</span>
                      <span className="bg-white border border-rose-300 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {disease.pathogen}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-800 block text-[11px]">Primary Symptoms:</span>
                      <p className="text-slate-700 leading-relaxed">{disease.signs}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-800 block text-[11px]">Mandatory Control & Eradication:</span>
                      <p className="text-slate-700 leading-relaxed font-medium">{disease.action}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Common Station Pests */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <h3 className="text-sm font-bold text-slate-800">Station Pests (Table 2.15)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PEST_LIBRARY.map((p) => (
                    <div key={p.name} className="border border-slate-200 rounded-lg p-3 bg-white space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{p.name}</span>
                        <span className="station-badge station-badge-neutral text-[10px]">Pest</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{p.danger}</p>
                      <div className="text-[11px] text-emerald-700 font-medium">Control: {p.control}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Disinfectant Chemical Dilution */}
          <div className="space-y-5">
            <div className="station-panel-card text-xs">
              <div className="station-panel-header">
                <div>
                  <h2 className="station-panel-title">Disinfectant Dilution Calculator</h2>
                  <p className="station-panel-desc">Biosecurity spray preparation for rearing houses.</p>
                </div>
              </div>

              <div className="station-form-group">
                <label className="station-form-label">Water Volume in Knapsack (Liters)</label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={waterLitersForDisinfectant}
                  onChange={(e) => setWaterLitersForDisinfectant(parseInt(e.target.value) || 5)}
                  className="station-form-input font-bold"
                />
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-slate-700 font-bold block">2% Formalin Spray:</span>
                  <div className="text-xl font-extrabold text-emerald-700 tabular-nums">
                    {formalin2PercentMl >= 1000 ? `${(formalin2PercentMl / 1000).toFixed(1)} L` : `${formalin2PercentMl} mL`} Formalin
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Mix 50 mL commercial 40% formalin per liter water. Seal shed for 24h before rearing.
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-slate-700 font-bold block">5% Bleaching Powder Solution:</span>
                  <div className="text-xl font-extrabold text-slate-900 tabular-nums">
                    {bleachingPowder5PercentGrams >= 1000 ? `${(bleachingPowder5PercentGrams / 1000).toFixed(1)} kg` : `${bleachingPowder5PercentGrams} g`} Powder
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Mix 50 g bleaching powder per liter water for entrance footbaths and wooden tray sanitation.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. M-PESA B2C PAYOUT SIMULATOR */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'finance' && (
        <div className="station-grid-layout">
          <div className="space-y-5">
            <div className="station-panel-card text-xs">
              <div className="station-panel-header">
                <div>
                  <h2 className="station-panel-title">Safaricom Daraja M-Pesa B2C Payout</h2>
                  <p className="station-panel-desc">
                    Disburse instantaneous mobile money payments for cocoon deliveries directly to smallholder farmers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="station-form-group">
                  <label className="station-form-label">Farmer Full Name</label>
                  <input
                    type="text"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    className="station-form-input font-semibold"
                  />
                </div>
                <div className="station-form-group">
                  <label className="station-form-label">Safaricom Phone Number</label>
                  <input
                    type="text"
                    value={farmerPhone}
                    onChange={(e) => setFarmerPhone(e.target.value)}
                    placeholder="0712345678"
                    className="station-form-input font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="station-form-group">
                  <label className="station-form-label">Delivered Cocoon Lot (kg)</label>
                  <input
                    type="number"
                    value={grossCocoonKg}
                    onChange={(e) => setGrossCocoonKg(parseFloat(e.target.value) || 0)}
                    className="station-form-input font-bold"
                  />
                </div>
                <div className="station-form-group">
                  <label className="station-form-label">Buying Rate (KES / kg)</label>
                  <input
                    type="number"
                    value={payoutRatePerKg}
                    onChange={(e) => setPayoutRatePerKg(parseFloat(e.target.value) || 0)}
                    className="station-form-input font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-xs text-slate-600 font-medium block">Total M-Pesa Disbursement</span>
                  <span className="text-2xl font-extrabold text-emerald-700 tabular-nums">
                    KES {(grossCocoonKg * payoutRatePerKg).toLocaleString()}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isMpesaProcessing}
                  onClick={handleSimulateMpesa}
                  className="btn-primary min-h-[44px] px-5 text-xs"
                >
                  {isMpesaProcessing ? 'Sending B2C Request…' : 'Disburse M-Pesa Payout'}
                </button>
              </div>

              {mpesaReceipt && (
                <div className="p-3.5 bg-white border border-emerald-400 rounded-xl text-xs space-y-1 font-mono shadow-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <Check size={14} />
                    <span>Safaricom M-Pesa B2C Receipt:</span>
                  </div>
                  <div>Reference: <strong>{mpesaReceipt}</strong></div>
                  <div>Recipient: {farmerName} ({farmerPhone})</div>
                  <div>Amount: KES {(grossCocoonKg * payoutRatePerKg).toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400">Timestamp: {new Date().toISOString()}</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Station Ledger */}
          <div className="space-y-5">
            <div className="station-panel-card text-xs">
              <div className="station-panel-header">
                <div>
                  <h2 className="station-panel-title">Station Finance Ledger</h2>
                  <p className="station-panel-desc">Recent disbursements and cash flows.</p>
                </div>
              </div>

              <div className="space-y-2">
                {payments.slice(0, 6).map((p) => (
                  <div key={p.id} className="p-2.5 border border-slate-200 rounded-lg flex justify-between items-center bg-slate-50">
                    <div>
                      <span className="font-semibold text-slate-800 block text-[11px] truncate">{p.partyName}</span>
                      <span className="text-[10px] text-slate-400">{p.category}</span>
                    </div>
                    <span className={`font-bold tabular-nums ${p.direction === 'inflow' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {p.direction === 'inflow' ? '+' : '-'}{formatCurrency(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. USSD *384# & MULTI-DIALECT AUDIO GUIDE */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'ussd' && (
        <div className="station-grid-layout station-grid-equal">
          {/* USSD Phone Simulator */}
          <div className="station-panel-card text-xs">
            <div className="station-panel-header">
              <div>
                <h2 className="station-panel-title">Feature Phone USSD Simulator (*384#)</h2>
                <p className="station-panel-desc">
                  Interactive Africa's Talking USSD menu for farmers without smartphones.
                </p>
              </div>
            </div>

            <div className="max-w-xs mx-auto w-full border-4 border-slate-800 rounded-3xl p-4 bg-slate-900 text-white shadow-lg space-y-3 font-mono">
              <div className="text-center text-[10px] text-slate-400 pb-2 border-b border-slate-800">
                Safaricom / Airtel · USSD *384#
              </div>

              {ussdStep === 'idle' && (
                <div className="py-6 text-center space-y-3">
                  <div className="text-emerald-400 text-sm font-bold">Dial *384#</div>
                  <button
                    type="button"
                    onClick={() => setUssdStep('main')}
                    className="btn-primary min-h-[44px] px-6 text-xs mx-auto"
                  >
                    Send Call
                  </button>
                </div>
              )}

              {ussdStep === 'main' && (
                <div className="space-y-2 text-xs">
                  <div className="text-amber-300 font-bold">KALRO SERICULTURE NSRC</div>
                  <div>1. Log Daily Feeding</div>
                  <div>2. Report Moult Entry</div>
                  <div>3. Cocoon Harvest Alert</div>
                  <div>4. Silk Market Benchmark Prices</div>
                  <div className="grid grid-cols-4 gap-1.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setUssdStep('feed')}
                      className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-xs font-bold text-center"
                    >
                      1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUssdStep('moult');
                        setUssdNotice('Moult notice submitted to KALRO Station Supervisor.');
                      }}
                      className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-xs font-bold text-center"
                    >
                      2
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUssdStep('harvest');
                        setUssdNotice('Harvest alert logged: Mountages dispatch scheduled within 48h.');
                      }}
                      className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-xs font-bold text-center"
                    >
                      3
                    </button>
                    <button
                      type="button"
                      onClick={() => setUssdStep('prices')}
                      className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-xs font-bold text-center"
                    >
                      4
                    </button>
                  </div>
                </div>
              )}

              {ussdStep === 'feed' && (
                <div className="space-y-2 text-xs">
                  <div className="text-amber-300 font-bold">Enter Feed Amount (kg):</div>
                  <input
                    type="number"
                    value={ussdFeedKg}
                    onChange={(e) => setUssdFeedKg(e.target.value)}
                    className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 text-sm font-bold"
                  />
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUssdStep('idle');
                        onToast(`USSD Feed Log recorded: ${ussdFeedKg} kg!`);
                      }}
                      className="btn-primary min-h-[40px] px-4 text-xs flex-1"
                    >
                      Submit
                    </button>
                    <button
                      type="button"
                      onClick={() => setUssdStep('main')}
                      className="btn-secondary min-h-[40px] px-4 text-xs flex-1 text-slate-800"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {ussdStep === 'prices' && (
                <div className="space-y-2 text-xs">
                  <div className="text-amber-300 font-bold">SILK COCOON BENCHMARKS (NSRC):</div>
                  <div>• Grade A: KES 950 / kg</div>
                  <div>• Grade B: KES 800 / kg</div>
                  <div>• Grade C: KES 600 / kg</div>
                  <button
                    type="button"
                    onClick={() => setUssdStep('main')}
                    className="w-full min-h-[40px] mt-2 bg-slate-800 rounded-lg text-xs font-semibold"
                  >
                    0. Return to Menu
                  </button>
                </div>
              )}

              {(ussdStep === 'moult' || ussdStep === 'harvest') && (
                <div className="space-y-2 text-xs">
                  <div className="text-emerald-400 font-bold">SUBMISSION CONFIRMED</div>
                  <div className="text-[11px] text-slate-300">{ussdNotice}</div>
                  <button
                    type="button"
                    onClick={() => setUssdStep('idle')}
                    className="w-full min-h-[40px] mt-2 bg-slate-800 rounded-lg text-xs font-semibold"
                  >
                    Exit Session
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Multi-Dialect Audio Field Guides */}
          <div className="station-panel-card text-xs">
            <div className="station-panel-header">
              <div>
                <h2 className="station-panel-title">Multi-Dialect Audio Guides</h2>
                <p className="station-panel-desc">
                  Clear spoken audio instructions in Kenyan rural dialects for elder smallholders.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { code: 'en', label: 'English' },
                { code: 'sw', label: 'Kiswahili' },
                { code: 'kikuyu', label: 'Gikuyu' },
                { code: 'kamba', label: 'Kikamba' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedAudioLang(lang.code as typeof selectedAudioLang)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    selectedAudioLang === lang.code
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <div className="space-y-2.5 pt-1">
              {[
                {
                  title: 'Feather Brushing Technique',
                  sw: 'Tumia unyoya laini kuondoa minyoo mchanga kutoka kwa kadi ya mayai bila kuwadhuru.',
                  kikuyu: 'Huthira njoya ndororu kũruta nuthu cia thiriku kadi-ini itekwĩhia.',
                  kamba: 'Tũmĩa ũkũnja mũw’ũ kũmya tũtũngũ twa silikwom katinĩ ũteũtũkĩaa.',
                  en: 'Use a soft bird feather to gently brush newly hatched larvae from the egg card onto bed paper.',
                },
                {
                  title: 'Slaked Lime Powder Dusting',
                  sw: 'Weka chokaa ya kilimo mara tu minyoo inapoingia moult ili kukausha unyevu wa kinyesi.',
                  kikuyu: 'Itia thookaa ya ũrĩmi rĩrĩa thiriku ciahota nĩguo gũthiĩ ũnyororo.',
                  kamba: 'Ĩkĩa kyoka kya ũĩmĩ ĩla tũtũngũ twalika moult nĩ kana ũthũkye kĩw’ĩ.',
                  en: 'Dust agricultural slaked lime lightly when silkworms enter moult to dry frass and stop viruses.',
                },
                {
                  title: 'Mounting & Harvesting Standard',
                  sw: 'Weka minyoo 90 hadi 100 kwa kila futi moja ya mraba kwenye rotary mountages. Vuna siku ya saba.',
                  kikuyu: 'Ĩkĩra thiriku 90 nginya 100 hari futi ĩmwe ya kĩbũrũri kĩa rotary frame. Getha mũthenya wa mũgwanja.',
                  kamba: 'Ĩkĩa tũtũngũ 90 nginya 100 kwĩ ĩfuti yĩmwe ya rotary frame. Umũa mũthenya wa mũonza.',
                  en: 'Place 90-100 larvae per sq ft in rotary mountages. Harvest cocoons on day 7 when pupa turns brown.',
                },
              ].map((g, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{g.title}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const text = g[selectedAudioLang];
                        if ('speechSynthesis' in window) {
                          const utter = new SpeechSynthesisUtterance(text);
                          utter.lang = selectedAudioLang === 'en' ? 'en-US' : 'sw';
                          window.speechSynthesis.speak(utter);
                        }
                        onToast(`Playing audio guide in ${selectedAudioLang.toUpperCase()}`);
                      }}
                      className="btn-primary min-h-[38px] px-3 text-xs"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Volume2 size={13} />
                      <span>Play Audio</span>
                    </button>
                  </div>
                  <p className="text-slate-600 italic text-[11px] leading-relaxed">
                    "{g[selectedAudioLang]}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 8. NSRC SILKWORM STRAINS & BREEDING PEDIGREE */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'breeding' && (
        <div className="station-panel-card text-xs">
          <div className="station-panel-header">
            <div>
              <h2 className="station-panel-title">KALRO NSRC Strain Pedigree & Crossing Matrix</h2>
              <p className="station-panel-desc">
                Genetic characterization of Bombyx mori and Samia ricini breeds at Thika research center.
              </p>
            </div>
            <span className="station-badge station-badge-success">
              Pure Lines & Hybrids
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {KENYA_SERICULTURE_BREEDS.map((st) => (
              <div key={st.code} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">{st.code}</span>
                    <span className="text-[11px] text-slate-500">{st.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    st.species === 'bombyx'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {st.species.toUpperCase()}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{st.description}</p>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px] font-mono text-slate-500">
                  <span>Filament: 850–1,100 m</span>
                  <span>Pupation: 91%+</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
