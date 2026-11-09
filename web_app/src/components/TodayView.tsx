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
    if (leafCoverage.urgency === 'critical') {
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
            <div className="routine-header">
              <div className="routine-icon-title">
                <Sunrise size={16} style={{ color: 'var(--primary)' }} />
                <span>1. Morning Feed (07:00 – 09:30)</span>
              </div>
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
            <p className="routine-desc">
              Feed succulent morning leaves with high moisture content. Chop leaves finely (0.5–1 cm) for Chawki instars.
            </p>
            <div className="routine-action-row">
              <span style={{ color: 'var(--text-muted)' }}>
                {morningFedCount}/{activeBatches.length} lots serviced
              </span>
              <button
                type="button"
                onClick={() => onOpenQuickLog(undefined, 'feed')}
                className="btn-accent"
                style={{ padding: '2px 8px', fontSize: '0.72rem' }}
              >
                + Log Feed
              </button>
            </div>
          </div>

          {/* Routine 2: Midday Climate & Hygiene */}
          <div className={`routine-card ${shift.isMidday ? 'current' : ''} ${envLoggedToday ? 'done' : ''}`}>
            <div className="routine-header">
              <div className="routine-icon-title">
                <Thermometer size={16} style={{ color: 'var(--status-info)' }} />
                <span>2. Midday Climate Check</span>
              </div>
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
            <p className="routine-desc">
              Inspect dry bulb thermometer and wet hygrometer at 12:00 PM. Target: 24–26°C and 75–80% RH.
            </p>
            <div className="routine-action-row">
              <span style={{ color: 'var(--text-muted)' }}>
                {latestEnv ? `Last: ${latestEnv.temperatureCelsius.toFixed(1)}°C / ${latestEnv.humidityPercent}%` : 'No log today'}
              </span>
              <button
                type="button"
                onClick={() => onOpenQuickLog(undefined, 'climate')}
                className="btn-secondary"
                style={{ padding: '2px 8px', fontSize: '0.72rem' }}
              >
                + Log Climate
              </button>
            </div>
          </div>

          {/* Routine 3: Bed Sanitation & Spacing */}
          <div className="routine-card">
            <div className="routine-header">
              <div className="routine-icon-title">
                <ShieldCheck size={16} style={{ color: '#2B5775' }} />
                <span>3. Tray Cleaning & Bed Spacing</span>
              </div>
              <span className="routine-status-pill done">
                <span>Daily</span>
              </span>
            </div>
            <p className="routine-desc">
              Remove frass (excreta) and unconsumed dried leaves. For moulting lots, withhold leaf and dust with 97:3 slaked lime.
            </p>
            <div className="routine-action-row">
              <span style={{ color: 'var(--text-muted)' }}>
                {moultBatches.length > 0 ? `${moultBatches.length} lot(s) in moult` : 'Normal active beds'}
              </span>
              <button
                type="button"
                onClick={() => onOpenQuickLog(undefined, 'mortality')}
                className="btn-secondary"
                style={{ padding: '2px 8px', fontSize: '0.72rem' }}
              >
                Record Loss
              </button>
            </div>
          </div>

          {/* Routine 4: Evening Rations */}
          <div className={`routine-card ${shift.isEvening ? 'current' : ''}`}>
            <div className="routine-header">
              <div className="routine-icon-title">
                <Moon size={16} style={{ color: 'var(--accent-gold)' }} />
                <span>4. Evening Rations (17:00 – 19:30)</span>
              </div>
              <span className={`routine-status-pill ${shift.isEvening ? 'active' : 'pending'}`}>
                <span>{shift.isEvening ? 'Active Shift' : 'Scheduled'}</span>
              </span>
            </div>
            <p className="routine-desc">
              Provide heavy night feed of fresh whole leaves or shoots. Silkworms feed most actively during cooler night hours.
            </p>
            <div className="routine-action-row">
              <span style={{ color: 'var(--text-muted)' }}>
                Stored leaf: {leafCoverage.totalStockKg.toFixed(1)} kg
              </span>
              <button
                type="button"
                onClick={() => onOpenQuickLog(undefined, 'feed')}
                className="btn-accent"
                style={{ padding: '2px 8px', fontSize: '0.72rem' }}
              >
                + Log Feed
              </button>
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
          <div className="empty-state" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <Leaf size={28} />
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--text-main)' }}>
              No Active Silkworm Batches Today
            </h4>
            <p style={{ maxWidth: '480px', margin: '0 auto 20px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              All previous rearing cycles are completed or no rearing cycle is active yet. Start a new lot to activate daily feeding schedules, tray microclimate tracking, and forage allocation.
            </p>
            <button
              type="button"
              onClick={() => onSelectTab('batches')}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', fontSize: '0.88rem' }}
            >
              <Plus size={16} />
              Start New Batch Cycle
            </button>

            {/* 3-Step Sericulture Startup Checklist */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginTop: '2rem',
                textAlign: 'left',
              }}
            >
              <div style={{ background: '#f8faf8', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  1. Room Sanitation
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Disinfect trays and spray 2% formalin or 0.05% Asthra solution 3 days before brushing.
                </div>
              </div>
              <div style={{ background: '#f8faf8', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  2. Leaf Forage Harvest
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Harvest fresh, tender top mulberry leaves at dawn (06:30–08:30) and preserve under wet hessian cloth.
                </div>
              </div>
              <div style={{ background: '#f8faf8', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  3. Egg Incubation
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Maintain 25°C and 80% RH. Black-box DFLs on day 9 and expose to light on day 10 for uniform 95%+ hatch.
                </div>
              </div>
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Rearing Microclimate & Forage Stockpile Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
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
            <button
              onClick={() => onSelectTab('farm')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
            >
              Open Ledger
            </button>
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
