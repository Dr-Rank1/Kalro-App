import React, { useState, useEffect, useRef } from 'react';
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

type StationSubTab =
  | 'genebank'
  | 'quality'
  | 'dryer'
  | 'bed'
  | 'disease'
  | 'finance'
  | 'ussd'
  | 'breeding';

export const StationAgronomyView: React.FC<StationAgronomyViewProps> = ({
  batches,
  profile,
  payments,
  onAddPayment,
  onToast,
}) => {
  const [subTab, setSubTab] = useState<StationSubTab>('genebank');

  // -------------------------------------------------------------
  // 1. GENEBANK & FIELD BLOCKS STATE
  // -------------------------------------------------------------
  const [selectedOrchardBlock, setSelectedOrchardBlock] = useState<string>(KENYA_ORCHARD_BLOCKS[0].code);
  const [cultivarTypeFilter, setCultivarTypeFilter] = useState<'all' | 'mulberry' | 'castor'>('all');
  const [orchardAcreage, setOrchardAcreage] = useState<number>(1.0);
  const [spacingModel, setSpacingModel] = useState<'standard' | 'paired'>('standard');
  const [pruningDaysToHatch, setPruningDaysToHatch] = useState<number>(50);

  // -------------------------------------------------------------
  // 2. COCOON QUALITY & SHELL RATIO STATE
  // -------------------------------------------------------------
  const [grossCocoonKg, setGrossCocoonKg] = useState<number>(35.0);
  const [sampleCocoonCount, setSampleCocoonCount] = useState<number>(50);
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
  }, [isDryingRunning, currentDryingStepIndex]);

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

  return (
    <div className="station-suite-container space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
              <h1 className="text-xl font-bold text-gray-900">Station & Agronomy Hub</h1>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md">
                KALRO NSRC Thika
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Kenyan Sericulture standards: Genebank plots, cocoon grading, 4-stage drying, disease triage, M-Pesa payouts, and USSD.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-200">
            <span className="font-semibold">Station:</span> {profile?.orgName || 'NSRC Thika Station'} · {profile?.county || 'Kiambu'}
          </div>
        </div>

        {/* Sub-Tabs Grid */}
        <div className="station-subtabs scroll-fade-x flex items-center gap-1.5 overflow-x-auto pt-3 text-xs font-medium">
          {[
            { key: 'genebank', label: 'Genebank & Plots' },
            { key: 'quality', label: 'Cocoon Quality & Sorter' },
            { key: 'dryer', label: 'Hot-Air Drying Timer' },
            { key: 'bed', label: 'Bed & Lime Calculator' },
            { key: 'disease', label: 'Disease Triage' },
            { key: 'finance', label: 'M-Pesa Payouts' },
            { key: 'ussd', label: 'USSD *384# & Audio' },
            { key: 'breeding', label: 'NSRC Strains & Pedigree' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key as StationSubTab)}
              className={`min-h-[48px] min-w-[48px] px-3.5 py-2 rounded-lg transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center ${
                subTab === tab.key
                  ? 'bg-[#16A34A] text-white font-semibold'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. GENEBANK & FIELD BLOCKS */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'genebank' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Research Blocks & Genebank Plots</h2>
                  <p className="text-xs text-gray-500">
                    Characterized mulberry collections, castor trials, and field blocks at NSRC Thika.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
                  {MULBERRY_EVALUATION_ACCESSIONS_COUNT} Evaluation Accessions
                </span>
              </div>

              {/* Block Selection Pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                {KENYA_ORCHARD_BLOCKS.map((blk) => (
                  <button
                    key={blk.code}
                    onClick={() => setSelectedOrchardBlock(blk.code)}
                    className={`min-h-[48px] min-w-[48px] text-xs px-3.5 py-2 rounded-lg border text-left transition-all focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center ${
                      selectedOrchardBlock === blk.code
                        ? 'border-[#16A34A] bg-[#16A34A] text-white font-semibold'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {blk.name}
                  </button>
                ))}
              </div>

              {/* Active Block Inspector */}
              {(() => {
                const activeBlk = KENYA_ORCHARD_BLOCKS.find((b) => b.code === selectedOrchardBlock) || KENYA_ORCHARD_BLOCKS[0];
                return (
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1A332B] text-sm">{activeBlk.name}</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 font-mono font-medium text-emerald-800">
                        {activeBlk.category} · {activeBlk.acreage} Acres
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{activeBlk.notes}</p>
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-700">Primary Cultivar Stand:</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-gray-300 font-semibold text-gray-800">
                        {activeBlk.cultivar}
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase font-mono">
                        ({activeBlk.leafType})
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Characterized Cultivars Catalog */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-800">11 Characterized Mulberry Varieties</h3>
                  <div className="flex gap-2">
                    {(['all', 'mulberry', 'castor'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setCultivarTypeFilter(filter)}
                        className={`min-h-[48px] min-w-[48px] text-xs px-3.5 py-2 rounded-lg capitalize focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center ${
                          cultivarTypeFilter === filter
                            ? 'bg-gray-800 text-white font-semibold'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                  {(cultivarTypeFilter === 'all' || cultivarTypeFilter === 'mulberry') &&
                    KENYA_MULBERRY_CULTIVARS.map((m) => (
                      <div key={m.code} className="border border-gray-200 rounded-lg p-3 bg-white space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#1A332B] text-sm">{m.name}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-medium">
                            Mulberry
                          </span>
                        </div>
                        <p className="text-gray-600 line-clamp-2">{m.notes}</p>
                        <div className="text-[11px] text-gray-500 font-mono">
                          Harvest: {m.harvestTiming}
                        </div>
                      </div>
                    ))}

                  {(cultivarTypeFilter === 'all' || cultivarTypeFilter === 'castor') &&
                    KENYA_CASTOR_VARIETIES.map((c) => (
                      <div key={c.code} className="border border-gray-200 rounded-lg p-3 bg-white space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#914D2B] text-sm">{c.name}</span>
                          <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-medium">
                            Castor (Eri)
                          </span>
                        </div>
                        <p className="text-gray-600 line-clamp-2">{c.notes}</p>
                        <div className="text-[11px] text-gray-500 font-mono">
                          Yield: {c.foliageYield}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Agronomy & Pruning Forecaster */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 text-xs">
              <h2 className="text-base font-bold text-gray-900">Biomass & Spacing Calculator</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1 text-xs">Plot Size (Acres)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={orchardAcreage}
                    onChange={(e) => setOrchardAcreage(parseFloat(e.target.value) || 0.25)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1 text-xs">Planting Geometry</label>
                  <select
                    value={spacingModel}
                    onChange={(e) => setSpacingModel(e.target.value as 'standard' | 'paired')}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  >
                    <option value="standard">Standard Square (1.5m × 1.5m) · 1,798 bushes/ac</option>
                    <option value="paired">Paired-Row Intensive (0.9m × 0.9m) · 4,996 bushes/ac</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3.5 space-y-2.5 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Established Bushes:</span>
                  <span className="font-bold text-slate-900 tabular-nums">{bushPopulation.toLocaleString()} bushes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Annual Foliage Capacity:</span>
                  <span className="font-bold text-emerald-700 tabular-nums">{Math.round(estimatedLeafBiomassKgPerYear).toLocaleString()} kg/yr</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Silkworm Box Capacity:</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {Math.floor(estimatedLeafBiomassKgPerYear / 350)} boxes / year
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2.5">
                <h3 className="font-bold text-slate-800 text-xs">Pruning & Egg Incubation Sync</h3>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Bottom-prune mulberry 45–60 days before egg hatching so young tender leaves match Chawki and shoot harvest matches Instar V.
                </p>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5 text-xs">Countdown to Brushing (Days)</label>
                  <input
                    type="range"
                    min="10"
                    max="65"
                    value={pruningDaysToHatch}
                    onChange={(e) => setPruningDaysToHatch(parseInt(e.target.value) || 45)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 my-2"
                  />
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 pt-1">
                    <span>{pruningDaysToHatch} Days Until Eggs Arrive</span>
                    <span className={pruningDaysToHatch >= 45 && pruningDaysToHatch <= 60 ? 'text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200' : 'text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200'}>
                      {pruningDaysToHatch >= 45 && pruningDaysToHatch <= 60 ? 'Optimal Pruning Window' : 'Non-Optimal Pruning'}
                    </span>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Cocoon Quality & Defect Classifier</h2>
                  <p className="text-xs text-gray-500">
                    Evaluate 50-cocoon random samples according to NSRC Manual Chapter 3.1.
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-md font-bold text-xs border ${
                  commercialGrade === 'Grade A'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : commercialGrade === 'Grade B'
                    ? 'bg-blue-100 text-blue-900 border-blue-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  {commercialGrade} ({shellRatioPercent.toFixed(1)}% SR)
                </div>
              </div>

              {/* Sample Metrics Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Total Cocoon Lot (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={grossCocoonKg}
                    onChange={(e) => setGrossCocoonKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">50-Cocoon Sample (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sampleCocoonWeightGrams}
                    onChange={(e) => setSampleCocoonWeightGrams(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">50-Cocoon Shell Wt (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sampleShellWeightGrams}
                    onChange={(e) => setSampleShellWeightGrams(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-emerald-700"
                  />
                </div>
              </div>

              {/* 7 Defective Cocoon Classes from Manual */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-800">
                    7 Defective Cocoon Classes (In 50-Cocoon Sample)
                  </h3>
                  <span className="text-gray-500 font-mono">
                    Total Defective: {totalDefectsCount} / {sampleCocoonCount} ({defectRatePercent.toFixed(1)}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {DEFECTIVE_COCOON_TYPES.map((def) => {
                    const count = defectCounts[def.type] || 0;
                    return (
                      <div key={def.type} className="border border-gray-200 rounded-lg p-2.5 bg-gray-50/50 space-y-1">
                        <span className="font-semibold text-gray-800 block text-[11px] truncate" title={def.type}>
                          {def.type}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDefectCounts((prev) => ({ ...prev, [def.type]: Math.max(0, count - 1) }))}
                            className="min-h-[48px] min-w-[48px] rounded-lg bg-white border border-gray-300 font-bold hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center text-base"
                            aria-label={`Decrease ${def.type}`}
                          >
                            -
                          </button>
                          <span className="font-bold text-sm tabular-nums min-w-[32px] text-center">{count}</span>
                          <button
                            type="button"
                            onClick={() => setDefectCounts((prev) => ({ ...prev, [def.type]: count + 1 }))}
                            className="min-h-[48px] min-w-[48px] rounded-lg bg-white border border-gray-300 font-bold hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center text-base"
                            aria-label={`Increase ${def.type}`}
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-400 block truncate" title={def.cause}>
                          {def.cause}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Renditta Fixation */}
          <div className="space-y-6 text-xs">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900">Commercial Price Fixation</h2>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Shell Ratio (SR%):</span>
                  <span className="font-bold text-emerald-800 tabular-nums">{shellRatioPercent.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sample Defect Rate:</span>
                  <span className="font-bold text-gray-800 tabular-nums">{defectRatePercent.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Renditta:</span>
                  <span className="font-bold text-[#1A332B] tabular-nums">{estimatedRenditta} kg fresh / kg silk</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600 font-semibold">Fixed Price / kg:</span>
                  <span className="font-bold text-base text-gray-900 tabular-nums">
                    KES {suggestedPricePerKg.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-semibold">Total Cocoon Payout:</span>
                  <span className="font-bold text-base text-emerald-700 tabular-nums">
                    KES {totalPayoutValue.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 leading-relaxed space-y-1">
                <p><strong>NSRC Grading Thresholds:</strong></p>
                <p>• Grade A: SR &ge; 20%, Defects &le; 6% (KES 950/kg)</p>
                <p>• Grade B: SR 16–19.9%, Defects &le; 12% (KES 800/kg)</p>
                <p>• Grade C: SR &lt; 16% or Defects &gt; 12% (KES 600/kg)</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSubTab('finance');
                  onToast(`Navigated to M-Pesa Payout with ${commercialGrade} payout value.`);
                }}
                className="w-full min-h-[48px] min-w-[48px] py-3 bg-[#16A34A] text-white font-semibold rounded-lg text-xs hover:bg-[#15803D] transition-all focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center"
              >
                Disburse M-Pesa Payment →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. AUTOMATIC HOT-AIR DRYING TIMER & SCHEDULE */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'dryer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">4-Stage Automatic Hot-Air Drying Chamber</h2>
                  <p className="text-xs text-gray-500">
                    NSRC Thika protocol to kill pupae, regulate moisture, and preserve filament reelability.
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 font-bold rounded">
                  Target: 40% Dry Weight
                </span>
              </div>

              {/* Step Progression Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {COCOON_HOT_AIR_DRYING_SCHEDULE.map((st, idx) => {
                  const isActive = currentDryingStepIndex === idx;
                  const isDone = currentDryingStepIndex > idx;
                  return (
                    <div
                      key={st.step}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        isActive
                          ? 'border-[#16A34A] bg-[#16A34A] text-white font-semibold shadow-sm'
                          : isDone
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                          : 'border-gray-200 bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold opacity-80">Stage {idx + 1}</div>
                      <div className="text-base font-extrabold my-0.5">{st.temperature}</div>
                      <div className="text-[11px] opacity-90">{st.duration}</div>
                      <div className="text-[10px] mt-1 line-clamp-1 opacity-75">{st.purpose}</div>
                    </div>
                  );
                })}
              </div>

              {/* Main Live Countdown Display */}
              <div className="bg-white border-2 border-emerald-500/25 text-gray-900 rounded-xl p-6 text-center space-y-3 shadow-sm">
                <div className="text-xs text-gray-500 tracking-wider uppercase font-semibold">
                  Stage {currentDryingStepIndex + 1} of 4: {COCOON_HOT_AIR_DRYING_SCHEDULE[currentDryingStepIndex].temperature} (
                  {COCOON_HOT_AIR_DRYING_SCHEDULE[currentDryingStepIndex].purpose})
                </div>
                <div className="text-5xl font-extrabold font-mono tracking-wider tabular-nums text-emerald-700">
                  {formatTimer(dryingTimeRemainingSeconds)}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDryingRunning(!isDryingRunning)}
                    className={`min-h-[48px] min-w-[48px] px-5 py-2.5 rounded-lg font-bold text-xs transition-all focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center ${
                      isDryingRunning
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isDryingRunning ? 'Pause Drying' : 'Start Chamber Drying'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = (currentDryingStepIndex + 1) % COCOON_HOT_AIR_DRYING_SCHEDULE.length;
                      setCurrentDryingStepIndex(next);
                      setDryingTimeRemainingSeconds(getStepMinutes(COCOON_HOT_AIR_DRYING_SCHEDULE[next].duration) * 60);
                      onToast(`Switched to Stage ${next + 1}: ${COCOON_HOT_AIR_DRYING_SCHEDULE[next].temperature}`);
                    }}
                    className="min-h-[48px] min-w-[48px] px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-lg text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center"
                  >
                    Next Stage →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDryingRunning(false);
                      setDryingTimeRemainingSeconds(getStepMinutes(COCOON_HOT_AIR_DRYING_SCHEDULE[currentDryingStepIndex].duration) * 60);
                    }}
                    className="min-h-[48px] min-w-[48px] px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-lg text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center"
                  >
                    Reset Timer
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Weight Verification & Log */}
          <div className="space-y-6 text-xs">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900">40% Moisture Verification</h2>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Fresh Harvest Cocoon (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={freshCocoonWeightKg}
                  onChange={(e) => setFreshCocoonWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1">
                <span className="text-gray-600 text-[11px]">Target Dry Cocoon Weight (40%):</span>
                <div className="text-xl font-extrabold text-[#1A332B] tabular-nums">
                  {(freshCocoonWeightKg * 0.4).toFixed(1)} kg
                </div>
                <span className="text-[10px] text-gray-500">
                  Required to prevent pupa moth emergence and shell damp staining.
                </span>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Actual Dried Cocoon Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={actualDryCocoonWeightKg}
                  onChange={(e) => setActualDryCocoonWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
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
                className="w-full min-h-[48px] min-w-[48px] py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg text-xs focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center"
              >
                Save Drying Record
              </button>

              {dryingHistory.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <span className="font-semibold text-gray-700">Drying Run Records:</span>
                  <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[10px]">
                    {dryingHistory.map((h, i) => (
                      <div key={i} className="p-1.5 bg-gray-50 rounded border border-gray-200 flex justify-between">
                        <span>{h.step} ({h.temp})</span>
                        <span>{h.dryKg}kg dry</span>
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
      {/* 4. BED AREA & SLAKED LIME DOSING CALCULATOR */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'bed' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Instar Bed Space & Tray Expansion</h2>
                  <p className="text-xs text-gray-500">
                    Prevent larval suffocation, overcrowding, and double cocoons based on Table 2.0.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded">
                  {larvaeCases * 20000} Silkworms Total
                </span>
              </div>

              {/* Case & Instar Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Rearing Volume (Cases of 20,000 eggs)</label>
                  <select
                    value={larvaeCases}
                    onChange={(e) => setLarvaeCases(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800"
                  >
                    <option value={1}>1 Case (20,000 Larvae)</option>
                    <option value={2}>2 Cases (40,000 Larvae) · Standard NSRC Spec</option>
                    <option value={3}>3 Cases (60,000 Larvae)</option>
                    <option value={4}>4 Cases (80,000 Larvae)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Current Larval Instar Stage</label>
                  <select
                    value={selectedInstar}
                    onChange={(e) => setSelectedInstar(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800"
                  >
                    <option value={1}>1st Instar (Chawki Brushing) · 2.0 m² / case</option>
                    <option value={2}>2nd Instar (Chawki Active) · 3.5 m² / case</option>
                    <option value={3}>3rd Instar · 4.0 m² / case</option>
                    <option value={4}>4th Instar · 8.0 m² / case</option>
                    <option value={5}>5th Instar (Voracious Peak) · 17.0 m² / case</option>
                  </select>
                </div>
              </div>

              {/* Bed Space Metrics Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3.5 space-y-1">
                  <span className="text-gray-600 font-medium text-[11px]">Required Bed Floor Area:</span>
                  <div className="text-2xl font-extrabold text-[#1A332B] tabular-nums">
                    {requiredBedAreaSqMeters.toFixed(1)} m²
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    ({(requiredBedAreaSqMeters * 10.7639).toFixed(0)} sq ft)
                  </span>
                </div>

                <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3.5 space-y-1">
                  <span className="text-gray-600 font-medium text-[11px]">Standard Wooden Trays Needed:</span>
                  <div className="text-2xl font-extrabold text-blue-900 tabular-nums">
                    {standardTraysCount} trays
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Based on 1.2m × 0.9m (1.08 m²/tray)
                  </span>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3.5 space-y-1">
                  <span className="text-gray-600 font-medium text-[11px]">Rotary Mountage Capacity:</span>
                  <div className="text-2xl font-extrabold text-amber-900 tabular-nums">
                    {Math.ceil((larvaeCases * 20000) / 1120)} frames
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    90–100 larvae/sq ft standard
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Slaked Lime Dosing */}
          <div className="space-y-6 text-xs">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900">Slaked Lime Dosing Calculator</h2>
              <p className="text-gray-500 leading-relaxed">
                Agricultural slaked lime powder absorbs excess humidity and frass moisture when silkworms enter moult, suppressing viral and bacterial infections.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bed Floor Area:</span>
                  <span className="font-bold text-gray-800 tabular-nums">{requiredBedAreaSqMeters.toFixed(1)} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Standard Dosing:</span>
                  <span className="font-bold text-gray-800 font-mono">50 g / m²</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-800 font-bold">Total Slaked Lime Powder:</span>
                  <span className="font-extrabold text-emerald-800 text-sm tabular-nums">
                    {slakedLimeGrams >= 1000 ? `${(slakedLimeGrams / 1000).toFixed(2)} kg` : `${slakedLimeGrams} grams`}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 space-y-1 bg-amber-50/60 border border-amber-200 p-2.5 rounded-lg">
                <span className="font-bold text-amber-900 block">Application Timing:</span>
                Dust lightly over silkworms through a fine muslin cloth right as 90% of worms raise their heads and cease feeding (entering moult). Do not feed over fresh lime.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. DISEASE & PEST DIAGNOSTIC TRIAGE */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'disease' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 text-xs">
              <h2 className="text-base font-bold text-gray-900">Silkworm Diseases & Pest Triage (Table 4)</h2>

              {/* Disease Selection Pills */}
              <div className="flex flex-wrap gap-2">
                {DISEASE_LIBRARY.map((d) => (
                  <button
                    key={d.name}
                    onClick={() => setSelectedDiseaseName(d.name)}
                    className={`min-h-[48px] min-w-[48px] px-3.5 py-2 rounded-lg border text-left transition-all focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center ${
                      selectedDiseaseName === d.name
                        ? 'bg-rose-900 border-rose-900 text-white font-bold'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
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
                  <div className="border border-rose-200 bg-rose-50/40 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-rose-950">{disease.name}</span>
                      <span className="bg-white border border-rose-300 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {disease.pathogen}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-gray-800 block text-[11px]">Primary Symptoms:</span>
                      <p className="text-gray-700 leading-relaxed">{disease.signs}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-gray-800 block text-[11px]">Mandatory Control & Eradication:</span>
                      <p className="text-gray-700 leading-relaxed font-medium">{disease.action}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Pests Section */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <h3 className="text-sm font-bold text-gray-800">Station Pests (Table 2.15)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PEST_LIBRARY.map((p) => (
                    <div key={p.name} className="border border-gray-200 rounded-lg p-3 bg-white space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">{p.name}</span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">Pest</span>
                      </div>
                      <p className="text-gray-600 text-[11px]">{p.danger}</p>
                      <div className="text-[11px] text-emerald-800 font-medium">Control: {p.control}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Disinfectant Chemical Dilution Calculator */}
          <div className="space-y-6 text-xs">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900">Disinfectant Dilution Calculator</h2>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Water Volume in Sprayer (Liters)</label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={waterLitersForDisinfectant}
                  onChange={(e) => setWaterLitersForDisinfectant(parseInt(e.target.value) || 5)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                />
              </div>

              <div className="space-y-2.5">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
                  <span className="text-gray-700 font-bold block">2% Formalin Spray:</span>
                  <div className="text-lg font-bold text-[#1A332B] tabular-nums">
                    {formalin2PercentMl >= 1000 ? `${(formalin2PercentMl / 1000).toFixed(1)} L` : `${formalin2PercentMl} mL`} Formalin
                  </div>
                  <span className="text-[10px] text-gray-500">
                    Mix 50 mL commercial 40% formalin per liter water. Seal shed for 24h.
                  </span>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
                  <span className="text-gray-700 font-bold block">5% Bleaching Powder Solution:</span>
                  <div className="text-lg font-bold text-emerald-800 tabular-nums">
                    {bleachingPowder5PercentGrams >= 1000 ? `${(bleachingPowder5PercentGrams / 1000).toFixed(1)} kg` : `${bleachingPowder5PercentGrams} g`} Powder
                  </div>
                  <span className="text-[10px] text-gray-500">
                    Mix 50 g bleaching powder per liter water for floor footbaths and equipment trays.
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 text-xs">
              <h2 className="text-base font-bold text-gray-900">Safaricom Daraja M-Pesa B2C Payout</h2>
              <p className="text-gray-500">
                Disburse instantaneous mobile money payments for cocoon deliveries directly to smallholder farmers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Farmer Full Name</label>
                  <input
                    type="text"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Safaricom Phone Number</label>
                  <input
                    type="text"
                    value={farmerPhone}
                    onChange={(e) => setFarmerPhone(e.target.value)}
                    placeholder="0712345678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Delivered Cocoon Lot (kg)</label>
                  <input
                    type="number"
                    value={grossCocoonKg}
                    onChange={(e) => setGrossCocoonKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Buying Rate (KES / kg)</label>
                  <input
                    type="number"
                    value={payoutRatePerKg}
                    onChange={(e) => setPayoutRatePerKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-600 font-semibold block">Total M-Pesa Disbursement</span>
                  <span className="text-2xl font-extrabold text-[#1A332B] tabular-nums">
                    KES {(grossCocoonKg * payoutRatePerKg).toLocaleString()}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isMpesaProcessing}
                  onClick={handleSimulateMpesa}
                  className="min-h-[48px] min-w-[48px] px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center"
                >
                  {isMpesaProcessing ? 'Sending B2C Request…' : 'Disburse M-Pesa Payout'}
                </button>
              </div>

              {mpesaReceipt && (
                <div className="p-3 bg-white border-2 border-dashed border-emerald-400 rounded-lg text-xs space-y-1 font-mono">
                  <span className="font-bold text-emerald-800">Safaricom Daraja M-Pesa Confirmation:</span>
                  <div>Transaction Reference: <strong>{mpesaReceipt}</strong></div>
                  <div>Recipient: {farmerName} ({farmerPhone})</div>
                  <div>Amount: KES {(grossCocoonKg * payoutRatePerKg).toLocaleString()}</div>
                  <div className="text-[10px] text-gray-400">Timestamp: {new Date().toISOString()}</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Station Ledger Inflow/Outflow */}
          <div className="space-y-6 text-xs">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-gray-900">Station Finance Ledger</h2>
              <div className="space-y-2">
                {payments.slice(0, 5).map((p) => (
                  <div key={p.id} className="p-2 border border-gray-200 rounded-lg flex justify-between items-center bg-gray-50">
                    <div>
                      <span className="font-semibold text-gray-800 block text-[11px] truncate">{p.partyName}</span>
                      <span className="text-[10px] text-gray-400">{p.category}</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* USSD Phone Simulator */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 text-xs">
            <h2 className="text-base font-bold text-gray-900">Rural Feature Phone USSD Simulator (*384#)</h2>
            <p className="text-gray-500">
              Interactive Africa's Talking USSD string for Kenyan farmers without smartphones or cellular internet.
            </p>

            <div className="max-w-xs mx-auto border-4 border-gray-800 rounded-3xl p-4 bg-gray-900 text-white shadow-lg space-y-3 font-mono">
              <div className="text-center text-[10px] text-gray-400 pb-2 border-b border-gray-800">
                Safaricom / Airtel · USSD *384#
              </div>

              {ussdStep === 'idle' && (
                <div className="py-6 text-center space-y-3">
                  <div className="text-emerald-400 text-sm font-bold">Dial *384#</div>
                  <button
                    type="button"
                    onClick={() => setUssdStep('main')}
                    className="min-h-[48px] min-w-[48px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#16A34A] inline-flex items-center justify-center"
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
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setUssdStep('feed')}
                      className="min-h-[48px] min-w-[48px] px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-xs font-bold flex-1 focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center"
                    >
                      1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUssdStep('moult');
                        setUssdNotice('Moult notice submitted to KALRO Station Supervisor.');
                      }}
                      className="min-h-[48px] min-w-[48px] px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-xs font-bold flex-1 focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center"
                    >
                      2
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUssdStep('harvest');
                        setUssdNotice('Harvest alert logged: Mountages dispatch scheduled within 48h.');
                      }}
                      className="min-h-[48px] min-w-[48px] px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-xs font-bold flex-1 focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center"
                    >
                      3
                    </button>
                    <button
                      type="button"
                      onClick={() => setUssdStep('prices')}
                      className="min-h-[48px] min-w-[48px] px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-xs font-bold flex-1 focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center"
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
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 text-sm font-bold min-h-[48px]"
                  />
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUssdStep('idle');
                        onToast(`USSD Feed Log recorded: ${ussdFeedKg} kg!`);
                      }}
                      className="min-h-[48px] min-w-[48px] px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex-1 focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center"
                    >
                      Submit
                    </button>
                    <button
                      type="button"
                      onClick={() => setUssdStep('main')}
                      className="min-h-[48px] min-w-[48px] px-4 py-2 bg-gray-700 text-white rounded-lg text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center"
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
                    className="w-full min-h-[48px] min-w-[48px] mt-2 py-2 bg-gray-700 rounded-lg text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center"
                  >
                    0. Return to Menu
                  </button>
                </div>
              )}

              {(ussdStep === 'moult' || ussdStep === 'harvest') && (
                <div className="space-y-2 text-xs">
                  <div className="text-emerald-400 font-bold">SUBMISSION CONFIRMED</div>
                  <div className="text-[11px] text-gray-300">{ussdNotice}</div>
                  <button
                    type="button"
                    onClick={() => setUssdStep('idle')}
                    className="w-full min-h-[48px] min-w-[48px] mt-2 py-2 bg-gray-700 rounded-lg text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center"
                  >
                    Exit Session
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Multi-Dialect Audio Guide */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 text-xs">
            <h2 className="text-base font-bold text-gray-900">Multi-Dialect Audio Field Guides</h2>
            <p className="text-gray-500">
              Clear spoken audio instructions in Kenyan rural dialects for illiterate or elder smallholders.
            </p>

            <div className="flex flex-wrap gap-2">
              {[
                { code: 'en', label: 'English' },
                { code: 'sw', label: 'Kiswahili' },
                { code: 'kikuyu', label: 'Gikuyu' },
                { code: 'kamba', label: 'Kikamba' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedAudioLang(lang.code as typeof selectedAudioLang)}
                  className={`min-h-[48px] min-w-[48px] px-3.5 py-2 rounded-lg border text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center ${
                    selectedAudioLang === lang.code
                      ? 'bg-[#16A34A] text-white border-[#16A34A]'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-2">
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
                <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{g.title}</span>
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
                      className="min-h-[48px] min-w-[48px] px-3.5 py-2 bg-[#16A34A] text-white rounded-lg font-semibold text-xs hover:bg-[#15803D] focus-visible:ring-2 focus-visible:ring-[#16A34A] flex items-center justify-center gap-1.5"
                    >
                      ▶ Play Audio
                    </button>
                  </div>
                  <p className="text-gray-700 italic text-[11px] leading-relaxed">
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
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">KALRO NSRC Strain Pedigree & Crossing Matrix</h2>
              <p className="text-xs text-gray-500">
                Genetic characterization of Bombyx mori and Samia ricini breeds at Thika research center.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded">
              Pure Lines & Hybrids
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {KENYA_SERICULTURE_BREEDS.map((st) => (
              <div key={st.code} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-sm text-[#1A332B] block">{st.code}</span>
                    <span className="text-[11px] text-gray-500">{st.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    st.species === 'bombyx'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {st.species.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-600 text-[11px] leading-relaxed">{st.description}</p>
                <div className="pt-2 border-t border-gray-200/80 flex justify-between text-[11px] font-mono text-gray-500">
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
