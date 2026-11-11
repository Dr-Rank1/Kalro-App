import React, { useState } from 'react';
import {
  FileText,
  Sunrise,
  Sun,
  Moon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Thermometer,
  Droplets,
  Leaf,
  Plus,
  Building2,
  Info,
  ShieldCheck,
  Check,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  Batch,
  EnvironmentLog,
  FeedLog,
  LeafInventory,
  MortalityLog,
  CocoonHarvest,
  FarmProfile,
} from '../types';
import {
  calculateLeafCoverage,
  getCurrentStage,
  getLiveLarvaeCount,
  getSuggestedDailyFeedGrams,
  isFedToday,
} from '../utils';
import { SPECIES_THRESHOLDS } from '../constants';
import { BombyxBatchCardHeader, EriBatchCardHeader } from './SericultureCardArtwork';

interface TodayViewProps {
  batches: Batch[];
  feedLogs: FeedLog[];
  mortalityLogs: MortalityLog[];
  envLogs: EnvironmentLog[];
  harvests: CocoonHarvest[];
  inventory: LeafInventory;
  profile?: FarmProfile | null;
  onOpenCreateProfile?: () => void;
  onOpenAddBatch?: () => void;
  onOpenAddLeaf?: () => void;
  onOpenQuickLog: (batchId?: string, defaultType?: 'feed' | 'mortality' | 'climate' | 'harvest') => void;
  onSelectTab: (tab: 'batches' | 'plan' | 'farm' | 'you') => void;
  onExportBatchPdf?: (batch: Batch) => void;
}

type BatchFilter = 'all' | 'due' | 'moult' | 'spinning';

function getShiftInfo(hour: number) {
  if (hour >= 5 && hour < 11) {
    return {
      title: 'Morning Rations & Tray Check',
      timeWindow: '07:00 – 10:00',
      icon: Sunrise,
      advice: 'Feed fresh, cool leaves harvested at dawn. Check bed aeration and remove withered uneaten forage.',
      isMorning: true,
    };
  } else if (hour >= 11 && hour < 16) {
    return {
      title: 'Midday Microclimate & 2nd Feeding',
      timeWindow: '12:00 – 14:00',
      icon: Sun,
      advice: 'Check dry bulb thermometer and hygrometer. Sprinkle wet gunny cloth on floor if temperature exceeds 28°C.',
      isMidday: true,
    };
  } else if (hour >= 16 && hour < 22) {
    return {
      title: 'Evening Rations & Bed Management',
      timeWindow: '17:00 – 19:30',
      icon: Moon,
      advice: 'Distribute generous night rations to support voracious overnight feeding. Ensure rearing trays have proper spacing.',
      isEvening: true,
    };
  } else {
    return {
      title: 'Overnight Chamber Rest & Aeration',
      timeWindow: 'Overnight (22:00 – 05:00)',
      icon: Clock,
      advice: 'Maintain temperature at 24–25°C. Keep cross-ventilation louvers partly open while preventing vermin and drafts.',
      isNight: true,
    };
  }
}

export const TodayView: React.FC<TodayViewProps> = ({
  batches,
  feedLogs,
  mortalityLogs,
  envLogs,
  harvests,
  inventory,
  profile,
  onOpenCreateProfile,
  onOpenAddBatch,
  onOpenAddLeaf,
  onOpenQuickLog,
  onSelectTab,
  onExportBatchPdf,
}) => {
  const [batchFilter, setBatchFilter] = useState<BatchFilter>('all');
  const activeBatches = batches.filter((b) => b.status === 'active');

  const now = new Date();
  const currentHour = now.getHours();
  const shift = getShiftInfo(currentHour);
  const ShiftIcon = shift.icon;
  const todayStr = now.toISOString().split('T')[0];

  const formattedDate = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // KPI Calculations
  let totalLiveLarvae = 0;
  let totalOriginalEggs = 0;
  let totalDailyTargetGrams = 0;

  for (const b of activeBatches) {
    const live = getLiveLarvaeCount(b, mortalityLogs);
    totalLiveLarvae += live;
    totalOriginalEggs += b.eggCount;
    const stage = getCurrentStage(b);
    totalDailyTargetGrams += getSuggestedDailyFeedGrams(b, live, stage);
  }

  const avgSurvival =
    totalOriginalEggs > 0 ? (totalLiveLarvae / totalOriginalEggs) * 100 : 100;

  // Today's feed logged across all batches
  const feedTodayGrams = feedLogs
    .filter((f) => f.recordedAt.startsWith(todayStr))
    .reduce((sum, f) => sum + f.quantityGrams, 0);

  const feedTargetKg = totalDailyTargetGrams / 1000.0;
  const feedTodayKg = feedTodayGrams / 1000.0;
  const feedProgressPct =
    feedTargetKg > 0 ? Math.min(100, Math.round((feedTodayKg / feedTargetKg) * 100)) : 100;

  // Total harvest kg
  const totalHarvestWeightKg =
    harvests.reduce((sum, h) => sum + h.totalWeightGrams, 0) / 1000.0;

  // Leaf coverage forecast
  const leafCoverage = calculateLeafCoverage(inventory, activeBatches, mortalityLogs);

  // Latest microclimate reading
  const latestEnv = envLogs.length > 0 ? envLogs[0] : null;
  const envLoggedToday = latestEnv && latestEnv.recordedAt.startsWith(todayStr);

  // Batches breakdown by state
  const dueBatches = activeBatches.filter((b) => {
    const stage = getCurrentStage(b);
    return !stage.isMoult && !stage.isHarvest && !isFedToday(b.id, feedLogs, now);
  });

  const moultBatches = activeBatches.filter((b) => {
    const stage = getCurrentStage(b);
    return stage.isMoult;
  });

  const spinningBatches = activeBatches.filter((b) => {
    const stage = getCurrentStage(b);
    return stage.isHarvest;
  });

  // Filtered batches for display
  const filteredBatches = activeBatches.filter((b) => {
    if (batchFilter === 'due') {
      const stage = getCurrentStage(b);
      return !stage.isMoult && !stage.isHarvest && !isFedToday(b.id, feedLogs, now);
    }
    if (batchFilter === 'moult') {
      return getCurrentStage(b).isMoult;
    }
    if (batchFilter === 'spinning') {
      return getCurrentStage(b).isHarvest;
    }
    return true;
  });

  // Active Station Alerts
  const alerts: { type: 'warning' | 'critical' | 'info'; message: string; sub?: string }[] = [];

  if (activeBatches.length > 0) {
    if (leafCoverage.totalStockKg === 0) {
      alerts.push({
        type: 'warning',
        message: `Leaf Inventory Not Recorded (0.0 kg stored forage)`,
        sub: `Record morning harvest from your ${profile?.mulberryAcreage || 1} acre plot to activate live forage runway forecasts.`,
      });
    } else if (leafCoverage.urgency === 'critical') {
      alerts.push({
        type: 'critical',
        message: `Critical Forage Deficit: Only ${leafCoverage.totalStockKg.toFixed(1)} kg stored forage remaining.`,
        sub: `Estimated ${leafCoverage.daysOfCover} day buffer at current feeding rate (${leafCoverage.dailyNeedKg.toFixed(1)} kg/day). Harvest shoots immediately.`,
      });
    } else if (leafCoverage.urgency === 'warning') {
      alerts.push({
        type: 'warning',
        message: `Forage Replenishment Notice: ${leafCoverage.daysOfCover} days of forage remaining.`,
        sub: 'Schedule early morning plot harvest of Kanva-2 / S-13 shoots before afternoon heat.',
      });
    }

    if (moultBatches.length > 0) {
      alerts.push({
        type: 'info',
        message: `${moultBatches.length} Lot${moultBatches.length > 1 ? 's' : ''} in Inactive Moult Period`,
        sub: 'Withhold all leaf feed for moulting lots. Dust beds with dry slaked lime and bleaching powder (97:3). Maintain 24–25°C.',
      });
    }

    if (dueBatches.length > 0 && currentHour >= 9) {
      alerts.push({
        type: 'warning',
        message: `${dueBatches.length} Rearing Lot${dueBatches.length > 1 ? 's' : ''} Pending Today's Rations`,
        sub: 'Morning rations not yet recorded for today. Ensure young larvae receive tender chopped leaves.',
      });
    }

    if (latestEnv) {
      const activeBombyx = activeBatches.some((b) => b.species === 'bombyx');
      const limits = activeBombyx ? SPECIES_THRESHOLDS.bombyx : SPECIES_THRESHOLDS.eri;
      if (latestEnv.temperatureCelsius < limits.minTemp || latestEnv.temperatureCelsius > limits.maxTemp) {
        alerts.push({
          type: 'warning',
          message: `Rearing Chamber Temperature Deviation (${latestEnv.temperatureCelsius.toFixed(1)}°C)`,
          sub: `Target range is ${limits.minTemp}°C – ${limits.maxTemp}°C. Adjust ventilation louvers or moisten burlap curtains.`,
        });
      }
    }
  }

  // Routine Checklist States
  const morningFedCount = activeBatches.filter((b) => {
    const stage = getCurrentStage(b);
    return stage.isMoult || isFedToday(b.id, feedLogs, now);
  }).length;
  const morningRoutineDone = activeBatches.length > 0 && morningFedCount === activeBatches.length;

  return (
    <div>
      {/* 1. Operational Command Header */}
      <div className="ops-control-header">
        <div className="ops-title-group">
          <div className="ops-station-pill">
            <Building2 size={13} />
            <span>{profile?.orgName || 'KALRO Sericulture Research Station'}</span>
            <span>•</span>
            <span>{profile?.county ? `${profile.county} County` : 'Kenya'}</span>
          </div>
          <h2>Rearing House Operations</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 600 }}>
              {formattedDate}
            </span>
            <span className="shift-pill">
              <ShiftIcon size={14} />
              <span>{shift.title} ({shift.timeWindow})</span>
            </span>
          </div>
        </div>

        <div className="ops-actions">
          <button
            onClick={() => onOpenQuickLog(undefined, 'feed')}
            className="btn-accent"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} />
            Log Feeding
          </button>
          <button
            onClick={() => onOpenQuickLog(undefined, 'mortality')}
            className="btn-secondary"
          >
            Record Loss
          </button>
          <button
            onClick={() => onOpenQuickLog(undefined, 'climate')}
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Thermometer size={14} />
            House Climate
          </button>
          <button
            onClick={() => onOpenQuickLog(undefined, 'harvest')}
            className="btn-secondary"
          >
            Log Harvest
          </button>
        </div>
      </div>

      {/* Profile Setup Callout (If no profile created yet) */}
      {!profile && (
        <div
          className="kalro-card"
          style={{
            background: 'linear-gradient(135deg, #fdfbf7 0%, #f6f3ea 100%)',
            border: '1px solid #e2d7be',
            marginBottom: '1.25rem',
            padding: '1rem 1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-gold)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Building2 size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#4a3805' }}>
                  Set Up Your Farm Profile
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#685116' }}>
                  Register your station details, rearing house bays, and mulberry acreage to get personalized forage forecasts and customized report headers.
                </p>
              </div>
            </div>
            {onOpenCreateProfile && (
              <button
                type="button"
                onClick={onOpenCreateProfile}
                className="btn-accent"
                style={{ padding: '6px 14px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
              >
                + Set Up Profile
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Key Operational Metrics Strip (Border only, tabular numerals, clean) */}
      <div className="operational-metric-strip">
        <div className="metric-col">
          <span className="metric-label">Live Silkworms</span>
          <span className="metric-number tabular-nums">{totalLiveLarvae.toLocaleString()}</span>
          <span className="metric-sub">
            {activeBatches.length} active {activeBatches.length === 1 ? 'lot' : 'lots'} in rearing
          </span>
        </div>

        <div className="metric-col">
          <span className="metric-label">Feed Dispatched Today</span>
          <span className="metric-number tabular-nums">{feedTodayKg.toFixed(1)} kg</span>
          <span className="metric-sub">
            {feedTargetKg > 0
              ? `${feedProgressPct}% of ${feedTargetKg.toFixed(1)} kg daily target`
              : 'All lots resting in moult'}
          </span>
        </div>

        <div className="metric-col">
          <span className="metric-label">Forage Runway</span>
          <span className="metric-number tabular-nums">
            {activeBatches.length > 0 ? `${leafCoverage.daysOfCover} Days` : '--'}
          </span>
          <span
            className="metric-sub"
            style={{
              color:
                activeBatches.length > 0 && leafCoverage.urgency === 'critical'
                  ? 'var(--status-danger)'
                  : activeBatches.length > 0 && leafCoverage.urgency === 'warning'
                  ? 'var(--status-warning)'
                  : 'var(--status-success)',
              fontWeight: 600,
            }}
          >
            Buffer: {activeBatches.length > 0 ? leafCoverage.urgency.toUpperCase() : 'NO ACTIVE BATCH'}
          </span>
        </div>

        <div className="metric-col">
          <span className="metric-label">Average Survival</span>
          <span className="metric-number tabular-nums">
            {totalOriginalEggs > 0 ? `${avgSurvival.toFixed(1)}%` : '--'}
          </span>
          <span className="metric-sub">
            {totalOriginalEggs > 0 ? 'Flock viability index' : 'Awaiting active rearing'}
          </span>
        </div>

        <div className="metric-col">
          <span className="metric-label">Rearing Chamber Climate</span>
          <span className="metric-number tabular-nums">
            {latestEnv
              ? `${latestEnv.temperatureCelsius.toFixed(1)}°C`
              : '--'}
          </span>
          <span className="metric-sub">
            {latestEnv ? `${latestEnv.humidityPercent}% RH (Hygrometer)` : 'No reading today'}
          </span>
        </div>
      </div>

      {/* 3. Today's Rearing House Routine (Practical Daily Sericulture Checklist) */}
      <div className="kalro-card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Today's Rearing Routine</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Standard daily agronomic protocol for silkworm rearing houses
            </p>
          </div>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Clock size={13} />
            <span>Shift: {shift.timeWindow}</span>
          </span>
        </div>

        <div className="routine-grid">
          {/* Routine 1: Morning Feed */}
          <div className={`routine-card ${shift.isMorning ? 'current' : ''} ${morningRoutineDone ? 'done' : ''}`}>
            <div className="routine-img-wrapper">
              <img
                src="/images/routine/morning_feed.jpg"
                alt="Morning feeding of fresh mulberry leaves to silkworms"
                className="routine-img"
                loading="lazy"
              />
              <div className="routine-img-overlay">
                <span className="routine-time-badge">
                  <Sunrise size={12} />
                  <span>07:00 – 09:30</span>
                </span>
                <span className={`routine-status-pill ${morningRoutineDone ? 'done' : dueBatches.length > 0 ? 'pending' : 'active'}`}>
                  {morningRoutineDone ? (
                    <>
                      <Check size={11} />
                      <span>Done</span>
                    </>
                  ) : (
                    <span>{dueBatches.length > 0 ? `${dueBatches.length} Due` : 'Ready'}</span>
                  )}
                </span>
              </div>
            </div>

            <div className="routine-body">
              <div className="routine-title-row">
                <h4 className="routine-title">
                  <Sunrise size={14} style={{ color: 'var(--primary)' }} />
                  <span>1. Morning Feed</span>
                </h4>
                {shift.isMorning && <span className="routine-current-tag">Now</span>}
              </div>
              <p className="routine-desc">
                Feed succulent morning leaves with high moisture content. Chop leaves finely (0.5–1 cm) for Chawki instars.
              </p>
              <div className="routine-action-row">
                <span className="routine-meta-text">
                  {morningFedCount}/{activeBatches.length} lots fed
                </span>
                <button
                  type="button"
                  onClick={() => onOpenQuickLog(undefined, 'feed')}
                  className="btn-accent routine-btn"
                >
                  + Log Feed
                </button>
              </div>
            </div>
          </div>

          {/* Routine 2: Midday Climate & Hygiene */}
          <div className={`routine-card ${shift.isMidday ? 'current' : ''} ${envLoggedToday ? 'done' : ''}`}>
            <div className="routine-img-wrapper">
              <img
                src="/images/routine/midday_climate.jpg"
                alt="Analog wet and dry bulb hygrometer and thermometer in rearing house"
                className="routine-img"
                loading="lazy"
              />
              <div className="routine-img-overlay">
                <span className="routine-time-badge">
                  <Sun size={12} />
                  <span>12:00 – 14:00</span>
                </span>
                <span className={`routine-status-pill ${envLoggedToday ? 'done' : 'pending'}`}>
                  {envLoggedToday ? (
                    <>
                      <Check size={11} />
                      <span>Recorded</span>
                    </>
                  ) : (
                    <span>Pending</span>
                  )}
                </span>
              </div>
            </div>

            <div className="routine-body">
              <div className="routine-title-row">
                <h4 className="routine-title">
                  <Thermometer size={14} style={{ color: 'var(--status-info)' }} />
                  <span>2. Midday Climate Check</span>
                </h4>
                {shift.isMidday && <span className="routine-current-tag">Now</span>}
              </div>
              <p className="routine-desc">
                Inspect dry bulb thermometer and wet hygrometer at 12:00 PM. Target: 24–26°C and 75–80% RH.
              </p>
              <div className="routine-action-row">
                <span className="routine-meta-text">
                  {latestEnv ? `${latestEnv.temperatureCelsius.toFixed(1)}°C / ${latestEnv.humidityPercent}%` : 'No log today'}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenQuickLog(undefined, 'climate')}
                  className="btn-secondary routine-btn"
                >
                  + Log Climate
                </button>
              </div>
            </div>
          </div>

          {/* Routine 3: Bed Sanitation & Spacing */}
          <div className="routine-card">
            <div className="routine-img-wrapper">
              <img
                src="/images/routine/bed_cleaning.jpg"
                alt="Mesh cleaning nets on tiered sericulture rearing racks"
                className="routine-img"
                loading="lazy"
              />
              <div className="routine-img-overlay">
                <span className="routine-time-badge">
                  <Sparkles size={12} />
                  <span>14:00 – 16:30</span>
                </span>
                <span className="routine-status-pill done">
                  <span>Daily</span>
                </span>
              </div>
            </div>

            <div className="routine-body">
              <div className="routine-title-row">
                <h4 className="routine-title">
                  <ShieldCheck size={14} style={{ color: '#2B5775' }} />
                  <span>3. Tray Cleaning & Spacing</span>
                </h4>
              </div>
              <p className="routine-desc">
                Spread mesh cleaning nets before feeding to separate larvae from frass. For moulting lots, withhold leaf and dust bed with 97:3 slaked lime.
              </p>
              <div className="routine-action-row">
                <span className="routine-meta-text">
                  {moultBatches.length > 0 ? `${moultBatches.length} lot(s) in moult` : 'Normal active beds'}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenQuickLog(undefined, 'mortality')}
                  className="btn-secondary routine-btn"
                >
                  Record Loss
                </button>
              </div>
            </div>
          </div>

          {/* Routine 4: Evening Rations */}
          <div className={`routine-card ${shift.isEvening ? 'current' : ''}`}>
            <div className="routine-img-wrapper">
              <img
                src="/images/routine/evening_feed.jpg"
                alt="Late-age silkworms feeding on mulberry shoots in evening light"
                className="routine-img"
                loading="lazy"
              />
              <div className="routine-img-overlay">
                <span className="routine-time-badge">
                  <Moon size={12} />
                  <span>17:00 – 19:30</span>
                </span>
                <span className={`routine-status-pill ${shift.isEvening ? 'active' : 'pending'}`}>
                  <span>{shift.isEvening ? 'Active Shift' : 'Scheduled'}</span>
                </span>
              </div>
            </div>

            <div className="routine-body">
              <div className="routine-title-row">
                <h4 className="routine-title">
                  <Moon size={14} style={{ color: 'var(--accent-gold)' }} />
                  <span>4. Evening Rations</span>
                </h4>
                {shift.isEvening && <span className="routine-current-tag">Now</span>}
              </div>
              <p className="routine-desc">
                Provide heavy night feed of fresh whole leaves or shoots. Silkworms feed most actively during cooler night hours.
              </p>
              <div className="routine-action-row">
                <span className="routine-meta-text">
                  Stored leaf: {leafCoverage.totalStockKg.toFixed(1)} kg
                </span>
                <button
                  type="button"
                  onClick={() => onOpenQuickLog(undefined, 'feed')}
                  className="btn-accent routine-btn"
                >
                  + Log Feed
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Active Station Notices / Alerts */}
      {alerts.length > 0 && (
        <div className="kalro-card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-header-flex">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} style={{ color: 'var(--accent-gold)' }} />
              <span>Active Operational Notices</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {alerts.length} action {alerts.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {alerts.map((alert, idx) => (
              <div key={idx} className={`alert-box ${alert.type}`} style={{ margin: 0 }}>
                <div>
                  <strong>{alert.message}</strong>
                  {alert.sub && <div style={{ fontSize: '0.78rem', marginTop: '3px' }}>{alert.sub}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Active Rearing Lots Section */}
      <div className="kalro-card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header-flex" style={{ marginBottom: '0.75rem' }}>
          <div>
            <h3 className="card-title">Active Rearing Lots</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Live batches currently undergoing feeding, moulting, or spinning
            </p>
          </div>
          <button
            onClick={() => onSelectTab('batches')}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
          >
            Manage All Batches
          </button>
        </div>

        {/* Filter Pills */}
        {activeBatches.length > 0 && (
          <div className="batch-filter-bar">
            <button
              type="button"
              className={`batch-filter-btn ${batchFilter === 'all' ? 'active' : ''}`}
              onClick={() => setBatchFilter('all')}
            >
              <span>All Active</span>
              <span className="batch-filter-badge">{activeBatches.length}</span>
            </button>
            <button
              type="button"
              className={`batch-filter-btn ${batchFilter === 'due' ? 'active' : ''}`}
              onClick={() => setBatchFilter('due')}
            >
              <span>Feeding Due</span>
              <span className="batch-filter-badge">{dueBatches.length}</span>
            </button>
            <button
              type="button"
              className={`batch-filter-btn ${batchFilter === 'moult' ? 'active' : ''}`}
              onClick={() => setBatchFilter('moult')}
            >
              <span>In Moult</span>
              <span className="batch-filter-badge">{moultBatches.length}</span>
            </button>
            {spinningBatches.length > 0 && (
              <button
                type="button"
                className={`batch-filter-btn ${batchFilter === 'spinning' ? 'active' : ''}`}
                onClick={() => setBatchFilter('spinning')}
              >
                <span>Spinning</span>
                <span className="batch-filter-badge">{spinningBatches.length}</span>
              </button>
            )}
          </div>
        )}

        {activeBatches.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1.5rem', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <Sparkles size={26} />
            </div>

            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-main)' }}>
              {profile ? `Welcome to Today's Operations, ${profile.managerName}!` : 'No Active Silkworm Batches Today'}
            </h4>

            {profile && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Building2 size={13} color="var(--primary)" />
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{profile.orgName}</span>
                <span>•</span>
                <span>{profile.county} County</span>
                <span>•</span>
                <span>{profile.houseCount} Rearing {profile.houseCount === 1 ? 'House' : 'Houses'}</span>
                <span>•</span>
                <span>{profile.mulberryAcreage} Acre(s) Mulberry</span>
              </div>
            )}

            <p style={{ maxWidth: '520px', margin: '0 auto 24px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              {profile
                ? 'Your farm profile is active. Follow these 3 essential daily operations to synchronize your rearing cycles, microclimate calibration, and forage runway:'
                : 'All previous rearing cycles are completed or no rearing cycle is active yet. Start a new lot to activate daily feeding schedules, tray microclimate tracking, and forage allocation.'}
            </p>

            {/* 3 Synchronized Core Operations Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '14px',
                marginBottom: '1.75rem',
                textAlign: 'left',
              }}
            >
              {/* Step 1: Start Batch */}
              <div
                style={{
                  background: '#fcfdfc',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', marginBottom: '6px' }}>
                    <Plus size={16} />
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      1. Start Rearing Batch
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.45 }}>
                    Register your disease-free eggs (DFLs) to activate daily feeding rations, tray spacing schedules, and stage tracking.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAddBatch) {
                      onOpenAddBatch();
                    } else {
                      onSelectTab('batches');
                    }
                  }}
                  className="btn-accent"
                  style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 12px' }}
                >
                  <Plus size={15} />
                  + Register First Batch
                </button>
              </div>

              {/* Step 2: Record Climate */}
              <div
                style={{
                  background: '#fcfdfc',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-info)', marginBottom: '6px' }}>
                    <Thermometer size={16} />
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      2. Rearing Room Climate
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.45 }}>
                    Calibrate and log chamber temperature (24–26°C) and relative humidity (75–85%) before larvae brush onto rearing trays.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenQuickLog(undefined, 'climate')}
                  className="btn-secondary"
                  style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.82rem', padding: '8px 12px' }}
                >
                  <Thermometer size={14} />
                  Record House Climate
                </button>
              </div>

              {/* Step 3: Record Leaf Stock */}
              <div
                style={{
                  background: '#fcfdfc',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-success)', marginBottom: '6px' }}>
                    <Leaf size={16} />
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      3. Forage Leaf Stock
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.45 }}>
                    Log freshly harvested mulberry from your {profile?.mulberryAcreage || 1} acre plot into leaf storage to calculate forage runway.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAddLeaf) {
                      onOpenAddLeaf();
                    } else {
                      onSelectTab('farm');
                    }
                  }}
                  className="btn-secondary"
                  style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.82rem', padding: '8px 12px' }}
                >
                  <Plus size={14} />
                  + Record Leaf Stock
                </button>
              </div>
            </div>

            {/* Quick Cross-Nav Links */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', borderTop: '1px solid var(--border-divider)', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={() => onSelectTab('plan')}
                className="roadmap-tag-pill"
                style={{ fontSize: '0.78rem', padding: '6px 14px', cursor: 'pointer', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>📖 Explore 30-Day Agronomy Roadmap</span>
                <ArrowRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('farm')}
                className="roadmap-tag-pill"
                style={{ fontSize: '0.78rem', padding: '6px 14px', cursor: 'pointer', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>🧮 Bed Disinfection & Mulberry Calculators</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              No active batches match the selected filter.
            </p>
            <button
              type="button"
              onClick={() => setBatchFilter('all')}
              className="btn-secondary"
              style={{ marginTop: '10px', fontSize: '0.75rem' }}
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="batches-grid">
            {filteredBatches.map((b) => {
              const live = getLiveLarvaeCount(b, mortalityLogs);
              const stage = getCurrentStage(b);
              const suggestedFeed = getSuggestedDailyFeedGrams(b, live, stage);
              const fed = isFedToday(b.id, feedLogs, now);
              const maxDays = b.species === 'bombyx' ? 40 : 39;
              const progressPct = Math.min(100, Math.round((stage.dayStart / maxDays) * 100));

              // Batch's feed logged today
              const batchFeedToday = feedLogs
                .filter((f) => f.batchId === b.id && f.recordedAt.startsWith(todayStr))
                .reduce((sum, f) => sum + f.quantityGrams, 0);

              return (
                <div key={b.id} className="batch-item-card">
                  {b.species === 'bombyx' ? (
                    <BombyxBatchCardHeader day={stage.dayStart} maxDays={maxDays} stageName={stage.name} />
                  ) : (
                    <EriBatchCardHeader day={stage.dayStart} maxDays={maxDays} stageName={stage.name} />
                  )}

                  <div className="batch-card-inner">
                    <div className="batch-tag-row">
                      <span className={`species-badge ${b.species}`}>
                        {b.species === 'bombyx' ? 'Bombyx mori' : 'Eri Silkworm'}
                      </span>
                      <span className={`status-badge ${stage.isMoult ? 'moult' : 'active'}`}>
                        {stage.name}
                      </span>
                    </div>

                    <h4 className="truncate" style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.2rem' }}>
                      {b.displayTag || b.batchTag || b.id}
                    </h4>
                    <p className="truncate" style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0 0 0.65rem' }}>
                      {b.roomName || 'Rearing House 1'} • Day {stage.dayStart} of {maxDays}
                    </p>

                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                    </div>

                    {/* Instar-Specific Guidance Banner */}
                    {stage.isMoult ? (
                      <div className="moult-alert-strip">
                        <strong>⚠️ Moult Fasting:</strong> Withhold all leaves. Dust bed with 97:3 slaked lime to prevent flacherie. Maintain 24–25°C.
                      </div>
                    ) : stage.isHarvest ? (
                      <div className="spinning-alert-strip">
                        <strong>🔄 Mounting Stage:</strong> Worms are ready to spin. Place onto chandrika spinning frames in a quiet room.
                      </div>
                    ) : (
                      <div className="instar-guidance-box">
                        <strong>Feeding Guide:</strong> {stage.leafRecommendation || 'Feed fresh chopped leaves 3 times daily.'}
                      </div>
                    )}

                    {/* Operational Details Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.5rem',
                        fontSize: '0.78rem',
                        margin: '0.4rem 0 0.85rem',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        padding: '0.65rem',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Live Larvae</div>
                        <strong className="tabular-nums">{live.toLocaleString()}</strong>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Daily Target</div>
                        <strong className="tabular-nums">
                          {suggestedFeed > 0 ? `${(suggestedFeed / 1000).toFixed(1)} kg` : 'Moult Fasting'}
                        </strong>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Fed Today</div>
                        <span
                          className="tabular-nums"
                          style={{
                            color: fed ? 'var(--status-success)' : 'var(--status-danger)',
                            fontWeight: 600,
                          }}
                        >
                          {fed ? `${(batchFeedToday / 1000).toFixed(1)} kg logged` : 'Pending Feed'}
                        </span>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Target Temp</div>
                        <strong className="tabular-nums">{stage.idealTemp}</strong>
                      </div>
                    </div>

                    {/* Card Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto' }}>
                      <button
                        type="button"
                        onClick={() => onOpenQuickLog(b.id, 'feed')}
                        className="btn-accent"
                        style={{ flex: 1, fontSize: '0.78rem', padding: '0.4rem' }}
                      >
                        + Log Feed
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenQuickLog(b.id, 'mortality')}
                        className="btn-secondary"
                        style={{ flex: 1, fontSize: '0.78rem', padding: '0.4rem' }}
                      >
                        Record Loss
                      </button>
                      {onExportBatchPdf && (
                        <button
                          type="button"
                          onClick={() => onExportBatchPdf(b)}
                          className="btn-secondary"
                          style={{ padding: '0.4rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          title="Download verified PDF report for this batch"
                          aria-label={`Export PDF dossier for batch ${b.batchTag || b.id}`}
                        >
                          <FileText size={13} />
                          <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>PDF</span>
                        </button>
                      )}
                    </div>

                    {/* Synchronized Protocol & Tools Links */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid var(--border-divider)', fontSize: '0.72rem' }}>
                      <button
                        type="button"
                        onClick={() => onSelectTab('plan')}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', padding: 0, cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                      >
                        {stage.name} Protocol in Plan →
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectTab('farm')}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Bed Spacing in Tools →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Rearing Microclimate & Forage Stockpile Breakdown */}
      <div className="monitoring-side-by-side-grid">
        {/* Rearing Microclimate Card */}
        <div className="kalro-card" style={{ marginBottom: 0 }}>
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Rearing House Microclimate</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                House 1 Rearing Chamber Thermometer & Hygrometer
              </p>
            </div>
            <button
              onClick={() => onOpenQuickLog(undefined, 'climate')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
              title="Record microclimate thermometer and hygrometer reading"
            >
              + Log Climate
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '0.85rem 0' }}>
            <div
              style={{
                padding: '0.85rem',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Thermometer size={22} style={{ color: 'var(--primary)', marginBottom: '3px' }} />
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Dry Bulb Temp
              </div>
              <div className="tabular-nums" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)', margin: '2px 0' }}>
                {latestEnv ? `${latestEnv.temperatureCelsius.toFixed(1)}°C` : '--'}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: latestEnv
                    ? latestEnv.temperatureCelsius >= 24 && latestEnv.temperatureCelsius <= 26
                      ? 'var(--status-success)'
                      : 'var(--status-warning)'
                    : 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                {latestEnv
                  ? latestEnv.temperatureCelsius >= 24 && latestEnv.temperatureCelsius <= 26
                    ? 'Optimal (24.0 – 26.0°C)'
                    : 'Deviation from target'
                  : 'No reading recorded'}
              </div>
            </div>

            <div
              style={{
                padding: '0.85rem',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Droplets size={22} style={{ color: 'var(--status-info)', marginBottom: '3px' }} />
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Relative Humidity
              </div>
              <div className="tabular-nums" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--status-info)', margin: '2px 0' }}>
                {latestEnv ? `${latestEnv.humidityPercent}%` : '--'}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: latestEnv
                    ? latestEnv.humidityPercent >= 70 && latestEnv.humidityPercent <= 85
                      ? 'var(--status-success)'
                      : 'var(--status-warning)'
                    : 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                {latestEnv
                  ? latestEnv.humidityPercent >= 70 && latestEnv.humidityPercent <= 85
                    ? 'Target (70 – 85%)'
                    : 'Deviation from target'
                  : 'No reading recorded'}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-divider)', paddingTop: '0.6rem' }}>
            <span>Ventilation: {latestEnv?.ventilationStatus ? `${latestEnv.ventilationStatus.toUpperCase()} airflow` : 'Active cross-draft louvers'}</span>
            <span>Status: {latestEnv ? `Logged ${new Date(latestEnv.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No readings today'}</span>
          </div>
        </div>

        {/* Station Forage Stockpile Card */}
        <div className="kalro-card" style={{ marginBottom: 0 }}>
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Station Forage Stockpile</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Harvested reserves in humidified storage
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {onOpenAddLeaf && (
                <button
                  type="button"
                  onClick={onOpenAddLeaf}
                  className="btn-accent"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={12} />
                  + Add Stock
                </button>
              )}
              <button
                type="button"
                onClick={() => onSelectTab('farm')}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
              >
                Open Ledger
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: '0.85rem 0' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'inline-block' }} />
                  Mulberry Shoots (Kanva-2 & S-13)
                </span>
                <strong className="tabular-nums">{inventory.mulberryKg.toFixed(1)} kg</strong>
              </div>
              <div className="progress-bar-bg" style={{ margin: 0 }}>
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(100, (inventory.mulberryKg / 200) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--status-warning)', display: 'inline-block' }} />
                  Castor Leaves (GRC-1 for Eri)
                </span>
                <strong className="tabular-nums">{inventory.castorKg.toFixed(1)} kg</strong>
              </div>
              <div className="progress-bar-bg" style={{ margin: 0 }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min(100, (inventory.castorKg / 100) * 100)}%`,
                    backgroundColor: 'var(--status-warning)',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-gold)', display: 'inline-block' }} />
                  Kesseru Dry-Season Reserve
                </span>
                <strong className="tabular-nums">{inventory.kesseruKg.toFixed(1)} kg</strong>
              </div>
              <div className="progress-bar-bg" style={{ margin: 0 }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min(100, (inventory.kesseruKg / 50) * 100)}%`,
                    backgroundColor: 'var(--accent-gold)',
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-divider)', paddingTop: '0.6rem' }}>
            <span>Daily consumption: ~{leafCoverage.dailyNeedKg.toFixed(1)} kg/day</span>
            <span style={{ fontWeight: 600, color: leafCoverage.daysOfCover <= 2 ? 'var(--status-danger)' : 'var(--status-success)' }}>
              {leafCoverage.daysOfCover > 0 ? `${leafCoverage.daysOfCover} days buffer remaining` : 'No active consumption'}
            </span>
          </div>
        </div>
      </div>

      {/* 7. Sericulture Advisory Field Note (KALRO Best Practices) */}
      <div className="agronomy-tip-box">
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(20, 61, 43, 0.1)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          <Sparkles size={16} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 700, color: 'var(--primary)' }}>
            KALRO Sericulture Field Advisory
          </h4>
          <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {shift.advice} Always ensure rearing tray nets are dusted with slaked lime during high humidity spells to protect the rearing beds against muscardine fungal contamination.
          </p>
        </div>
      </div>
    </div>
  );
};
