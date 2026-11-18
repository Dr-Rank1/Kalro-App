import React, { useState } from 'react';
import {
  FileText,
  Sunrise,
  Sun,
  Moon,
  Clock,
  AlertTriangle,
  Thermometer,
  Droplets,
  Leaf,
  Plus,
  Building2,
  ArrowRight,
  History,
  Layers,
} from 'lucide-react';
import {
  Batch,
  EnvironmentLog,
  FeedLog,
  LeafInventory,
  MortalityLog,
  CocoonHarvest,
  FarmProfile,
  UserAccount,
  AuditLogEntry,
} from '../types';
import {
  calculateLeafCoverage,
  getCurrentStage,
  getLiveLarvaeCount,
  getSuggestedDailyFeedGrams,
  isFedToday,
  getNextShiftSchedule,
} from '../utils';
import { SPECIES_THRESHOLDS, USER_ROLES } from '../constants';

interface TodayViewProps {
  batches: Batch[];
  feedLogs: FeedLog[];
  mortalityLogs: MortalityLog[];
  envLogs: EnvironmentLog[];
  harvests: CocoonHarvest[];
  inventory: LeafInventory;
  profile?: FarmProfile | null;
  currentUser?: UserAccount | null;
  allUsers?: UserAccount[];
  auditLogs?: AuditLogEntry[];
  onOpenCreateProfile?: () => void;
  onOpenAddBatch?: () => void;
  onOpenAddLeaf?: () => void;
  onOpenQuickLog: (batchId?: string, defaultType?: 'feed' | 'mortality' | 'climate' | 'harvest') => void;
  onSelectTab: (tab: 'today' | 'batches' | 'audit' | 'you') => void;
  onExportBatchPdf?: (batch: Batch) => void;
  onSwitchUser?: (userId: string) => void;
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
  currentUser,
  allUsers,
  auditLogs = [],
  onOpenCreateProfile,
  onOpenAddBatch,
  onOpenAddLeaf,
  onOpenQuickLog,
  onSelectTab,
  onExportBatchPdf,
  onSwitchUser,
}) => {
  const [batchFilter, setBatchFilter] = useState<BatchFilter>('all');
  const [selectedHouseTab, setSelectedHouseTab] = useState<string>('all');
  const houseCount = Math.max(1, profile?.houseCount || 1);
  const activeBatches = batches.filter((b) => b.status === 'active');

  const roleMeta = currentUser
    ? USER_ROLES.find((r) => r.value === currentUser.role) || USER_ROLES[0]
    : USER_ROLES[0];

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
  const _totalHarvestWeightKg =
    harvests.reduce((sum, h) => sum + h.totalWeightGrams, 0) / 1000.0;

  // Leaf coverage forecast
  const leafCoverage = calculateLeafCoverage(inventory, activeBatches, mortalityLogs);

  // Latest microclimate reading
  const latestEnv = envLogs.length > 0 ? envLogs[0] : null;
  const envLoggedToday = latestEnv && latestEnv.recordedAt.startsWith(todayStr);

  // Per-chamber active climate reading
  const activeHouseEnv = selectedHouseTab === 'all'
    ? latestEnv
    : (envLogs.find((e) => e.roomName === selectedHouseTab) || null);

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
        sub: 'Schedule early morning plot harvest of V1 / Thika shoots before afternoon heat.',
      });
    }

    if (moultBatches.length > 0) {
      alerts.push({
        type: 'info',
        message: `${moultBatches.length} Lot${moultBatches.length > 1 ? 's' : ''} in Inactive Moult Period`,
        sub: 'Withhold all leaf feed for moulting lots. Dust beds with dry slaked agricultural lime powder (NSRC Table 4 standard). Maintain 24–25°C.',
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

  return (
    <div>
      {/* 1. Executive Operations Command Card (Consolidated Command Center) */}
      <div className="ops-command-card">
        <div className="ops-command-main">
          <div className="ops-command-title-group">
            <h2>Rearing House Operations</h2>
            <div className="ops-command-meta">
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{formattedDate}</span>
              <span style={{ color: 'var(--border-silk)' }}>•</span>
              <span className="ops-meta-chip">
                <ShiftIcon size={13} style={{ color: 'var(--primary)' }} />
                <span>{shift.title} ({shift.timeWindow})</span>
              </span>
              <span style={{ color: 'var(--border-silk)' }}>•</span>
              {(() => {
                const shiftSchedule = getNextShiftSchedule(now);
                return (
                  <span className="ops-meta-chip">
                    <Clock size={13} style={{ color: 'var(--primary)' }} />
                    <span>Next Ration: <strong style={{ color: 'var(--text-main)' }}>{shiftSchedule.nextRationName} ({String(shiftSchedule.nextRationHour).padStart(2, '0')}:{String(shiftSchedule.nextRationMinute).padStart(2, '0')})</strong> in {shiftSchedule.timeRemainingFormatted}</span>
                  </span>
                );
              })()}
            </div>
          </div>

          <div className="ops-command-actions">
            <button
              onClick={() => onOpenQuickLog(undefined, 'feed')}
              className="btn-accent min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.85rem' }}
            >
              <Plus size={16} />
              Log Feeding
            </button>
            <button
              onClick={() => onOpenQuickLog(undefined, 'mortality')}
              className="btn-secondary min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              style={{ padding: '10px 16px', fontSize: '0.85rem' }}
            >
              Record Loss
            </button>
            <button
              onClick={() => onOpenQuickLog(undefined, 'climate')}
              className="btn-secondary min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '0.85rem' }}
            >
              <Thermometer size={15} />
              House Climate
            </button>
            <button
              onClick={() => onOpenQuickLog(undefined, 'harvest')}
              className="btn-secondary min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              style={{ padding: '10px 16px', fontSize: '0.85rem' }}
            >
              Log Harvest
            </button>
          </div>
        </div>

        {/* Integrated Station Duty & Audit Sub-Bar */}
        <div className="ops-command-subbar">
          <div className="flex items-center gap-3 flex-wrap">
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: currentUser?.avatarColor || '#15803D',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.78rem',
                flexShrink: 0,
              }}
            >
              {currentUser?.avatarInitials || 'SO'}
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-slate-900">{currentUser?.username || 'Station Operator'}</span>
              {currentUser?.staffId && (
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-semibold">
                  {currentUser.staffId}
                </span>
              )}
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                {roleMeta?.label || 'Sericulture Specialist'}
              </span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">
                · Operations ledger digitally signed &amp; stamped
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {allUsers && allUsers.length > 1 && onSwitchUser && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-500 hidden md:inline">Switch Officer:</span>
                <select
                  value={currentUser?.id || ''}
                  onChange={(e) => onSwitchUser(e.target.value)}
                  className="station-form-select text-xs py-1.5 px-2.5 h-9 w-auto min-w-[130px]"
                  title="Switch active sericulture operator on duty"
                >
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.staffId || u.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => onSelectTab('audit')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all flex items-center gap-1.5 min-h-[36px]"
              title="View complete chronological audit trail of all staff operations"
            >
              <History size={13} className="text-[#15803D]" />
              <span>Audit Ledger ({auditLogs?.length || 0})</span>
              <ArrowRight size={12} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Setup Callout (If no profile created yet) */}
      {!profile && (
        <div
          className="kalro-card"
          style={{
            background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.05) 0%, #FFFFFF 100%)',
            border: '1px solid #E2E8F0',
            marginBottom: '24px',
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
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
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#FDE68A' }}>
                  Set Up Your Farm Profile
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  Register your station details, rearing house bays, and mulberry acreage to get personalized forage forecasts and customized report headers.
                </p>
              </div>
            </div>
            {onOpenCreateProfile && (
              <button
                type="button"
                onClick={onOpenCreateProfile}
                className="btn-accent min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                style={{ padding: '12px 20px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
              >
                + Set Up Profile
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Key Operational Metrics Strip (Single seamless horizontal glass card with silk dividers) */}
      <div className="operational-metric-strip">
        <div className="metric-col">
          <span className="metric-label">Live Silkworms</span>
          <span className="metric-number tabular-nums">{totalLiveLarvae.toLocaleString()}</span>
          <span className="metric-sub">
            <span className="badge-soft badge-soft-success">
              {activeBatches.length} Active {activeBatches.length === 1 ? 'Lot' : 'Lots'}
            </span>
          </span>
        </div>

        <div className="metric-col">
          <span className="metric-label">Feed Dispatched</span>
          <span className="metric-number tabular-nums">{feedTodayKg.toFixed(1)} kg</span>
          <span className="metric-sub">
            {feedTargetKg > 0 ? (
              <span className={`badge-soft ${feedProgressPct >= 100 ? 'badge-soft-success' : 'badge-soft-info'}`}>
                {feedProgressPct}% of {feedTargetKg.toFixed(1)} kg
              </span>
            ) : (
              <span className="badge-soft badge-soft-warning">Resting in Moult</span>
            )}
          </span>
        </div>

        <div className="metric-col">
          <span className="metric-label">Forage Runway</span>
          <span className="metric-number tabular-nums">
            {activeBatches.length > 0 ? `${leafCoverage.daysOfCover} Days` : '--'}
          </span>
          <span className="metric-sub">
            {activeBatches.length > 0 ? (
              <span
                className={`badge-soft ${
                  leafCoverage.urgency === 'critical'
                    ? 'badge-soft-danger'
                    : leafCoverage.urgency === 'warning'
                    ? 'badge-soft-warning'
                    : 'badge-soft-success'
                }`}
              >
                Buffer: {leafCoverage.urgency.toUpperCase()}
              </span>
            ) : (
              <span className="badge-soft badge-soft-muted">NO ACTIVE BATCH</span>
            )}
          </span>
        </div>

        <div className="metric-col">
          <span className="metric-label">Average Survival</span>
          <span className="metric-number tabular-nums">
            {totalOriginalEggs > 0 ? `${avgSurvival.toFixed(1)}%` : '--'}
          </span>
          <span className="metric-sub">
            {totalOriginalEggs > 0 ? (
              <span className={`badge-soft ${avgSurvival >= 90 ? 'badge-soft-success' : avgSurvival >= 75 ? 'badge-soft-warning' : 'badge-soft-danger'}`}>
                Viability Index
              </span>
            ) : (
              <span className="badge-soft badge-soft-muted">Awaiting Rearing</span>
            )}
          </span>
        </div>

        <div className="metric-col">
          <span className="metric-label">Chamber Climate</span>
          <span className="metric-number tabular-nums">
            {latestEnv
              ? `${latestEnv.temperatureCelsius.toFixed(1)}°C`
              : '--'}
          </span>
          <span className="metric-sub">
            {latestEnv ? (
              <span className="badge-soft badge-soft-info">
                {latestEnv.roomName ? `${latestEnv.roomName} · ` : ''}{latestEnv.humidityPercent}% RH
              </span>
            ) : (
              <span className="badge-soft badge-soft-muted">No Reading Today</span>
            )}
          </span>
        </div>
      </div>

      {/* 3. Active Station Notices / Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`alert-box ${alert.type}`}
              style={{
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: '260px' }}>
                <AlertTriangle
                  size={18}
                  style={{
                    flexShrink: 0,
                    marginTop: '2px',
                    color: alert.type === 'critical' ? '#B91C1C' : alert.type === 'warning' ? '#B45309' : '#0369A1',
                  }}
                />
                <div>
                  <strong style={{ fontSize: '0.86rem', display: 'block', color: 'inherit' }}>{alert.message}</strong>
                  {alert.sub && <div style={{ fontSize: '0.78rem', marginTop: '2px', opacity: 0.9 }}>{alert.sub}</div>}
                </div>
              </div>
              {onOpenAddLeaf && (alert.message.includes('Forage') || alert.message.includes('Leaf')) && (
                <button
                  type="button"
                  onClick={onOpenAddLeaf}
                  className="btn-accent min-h-[40px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                  style={{ fontSize: '0.78rem', padding: '8px 14px', whiteSpace: 'nowrap' }}
                >
                  + Record Leaf Harvest
                </button>
              )}
            </div>
          ))}
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
            className="btn-secondary min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
            style={{ fontSize: '0.85rem', padding: '12px 20px' }}
          >
            Manage All Batches
          </button>
        </div>

        {/* Filter Pills */}
        {activeBatches.length > 0 && (
          <div className="batch-filter-bar">
            <button
              type="button"
              className={`batch-filter-btn min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A] ${batchFilter === 'all' ? 'active' : ''}`}
              onClick={() => setBatchFilter('all')}
            >
              <span>All Active</span>
              <span className="batch-filter-badge">{activeBatches.length}</span>
            </button>
            <button
              type="button"
              className={`batch-filter-btn min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A] ${batchFilter === 'due' ? 'active' : ''}`}
              onClick={() => setBatchFilter('due')}
            >
              <span>Feeding Due</span>
              <span className="batch-filter-badge">{dueBatches.length}</span>
            </button>
            <button
              type="button"
              className={`batch-filter-btn min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A] ${batchFilter === 'moult' ? 'active' : ''}`}
              onClick={() => setBatchFilter('moult')}
            >
              <span>In Moult</span>
              <span className="batch-filter-badge">{moultBatches.length}</span>
            </button>
            {spinningBatches.length > 0 && (
              <button
                type="button"
                className={`batch-filter-btn min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A] ${batchFilter === 'spinning' ? 'active' : ''}`}
                onClick={() => setBatchFilter('spinning')}
              >
                <span>Spinning</span>
                <span className="batch-filter-badge">{spinningBatches.length}</span>
              </button>
            )}
          </div>
        )}

        {activeBatches.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem 1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-md)' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <Layers size={28} />
            </div>

            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-main)' }}>
              No Active Silkworm Batches
            </h4>

            {profile && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Building2 size={13} color="var(--primary)" />
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{profile.orgName}</span>
                <span>•</span>
                <span>{profile.county} County</span>
                <span>•</span>
                <span>{profile.houseCount} Rearing {profile.houseCount === 1 ? 'House' : 'Houses'}</span>
              </div>
            )}

            <p style={{ maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Register your disease-free eggs (DFLs) to begin tracking daily feeding rations, chamber microclimate, and cocoon harvests.
            </p>

            <button
              type="button"
              onClick={() => {
                if (onOpenAddBatch) {
                  onOpenAddBatch();
                } else {
                  onSelectTab('batches');
                }
              }}
              className="btn-accent min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.88rem', padding: '12px 24px' }}
            >
              <Plus size={16} />
              + Register New Batch
            </button>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              No active batches match the selected filter.
            </p>
            <button
              type="button"
              onClick={() => setBatchFilter('all')}
              className="btn-secondary min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              style={{ marginTop: '16px', fontSize: '0.85rem', padding: '12px 24px' }}
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className={`batches-grid ${filteredBatches.length === 1 ? 'single-batch-layout' : ''}`}>
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

              // Specific Forage Cultivar Recommendation
              const isChawki = (stage.instarNumber || 1) <= 3;
              const recommendedCultivar = b.targetForageCultivar
                ? `${b.targetForageCultivar}${b.orchardBlock ? ` (${b.orchardBlock})` : ''}`
                : b.species === 'bombyx'
                  ? isChawki
                    ? 'V1 / Thika Mulberry (Tender 3rd-4th leaves, 75-80% Moisture)'
                    : 'Kanva 2 / S36 / Embu Mulberry (High-Protein Mature Shoots)'
                  : isChawki
                    ? 'NUU 70 / KC6 Castor (Tender Top Leaves)'
                    : 'NUU 70 / KC 14 / KMC8 Castor (Semi-Mature Foliage)';

              const isSingle = filteredBatches.length === 1;

              return (
                <div key={b.id} className={`batch-item-card ${isSingle ? 'single-command-card' : ''}`}>
                  <div className="batch-card-inner">
                    {/* Header Tag Row */}
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`station-badge ${b.species === 'bombyx' ? 'station-badge-success' : 'station-badge-warning'}`}>
                          {b.strain ? `${b.strain} · ` : ''}{b.species === 'bombyx' ? 'Bombyx mori' : 'Samia ricini'}
                        </span>
                        <span className={`station-badge ${stage.isMoult ? 'station-badge-warning' : 'station-badge-neutral'}`}>
                          {stage.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                        {b.roomName || 'House 1'}
                      </span>
                    </div>

                    <div className="mb-2.5">
                      <h4 className="text-base font-bold text-slate-900 tracking-tight truncate">
                        {b.displayTag || b.batchTag || b.id}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        Day {stage.dayStart} of {maxDays} ({progressPct}% Lifecycle) · {b.eggCount.toLocaleString()} Original Seed Eggs
                      </p>
                    </div>

                    <div className="progress-bar-bg mb-3">
                      <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                    </div>

                    {/* Unified Rearing Protocol & Forage Guidance */}
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 space-y-2 text-xs mb-3">
                      <div className="flex items-start gap-2.5">
                        <Leaf size={15} className="text-[#15803D] shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-bold text-emerald-950 text-xs">
                              {stage.isMoult ? 'Moult Fasting (NSRC Protocol)' : stage.isHarvest ? 'Mounting Stage (NSRC Standards)' : 'Feeding Protocol'}
                            </span>
                            <span className="bg-white/90 px-2 py-0.5 rounded border border-emerald-300 font-semibold text-emerald-800 text-[11px]">
                              Target: {recommendedCultivar}
                            </span>
                          </div>
                          <p className="text-emerald-900 leading-relaxed text-[11.5px]">
                            {stage.isMoult
                              ? 'Withhold all leaves (18–24h for young instars, up to 48h for 4th). Dust bed with dry slaked agricultural lime powder (50–100 g/m²). Maintain 24–25°C.'
                              : stage.isHarvest
                              ? 'Worms ready to spin. Mount at 90–100 larvae/ft² onto rotary mountages or bamboo frames. Maintain ≤26°C and 60–70% RH.'
                              : stage.leafRecommendation || 'Feed fresh whole mature shoots 3–4 times daily. Net-clean beds every other day.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Operational Details Grid */}
                    <div className={`grid ${isSingle ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'} gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-3 text-xs`}>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Live Larvae</div>
                        <div className="font-extrabold text-sm text-slate-900 tabular-nums">
                          {live.toLocaleString()}
                          <span className="text-[11px] font-normal text-slate-500 ml-1">
                            ({b.eggCount > 0 ? ((live / b.eggCount) * 100).toFixed(0) : 100}%)
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Daily Target</div>
                        <div className="font-extrabold text-sm text-slate-900 tabular-nums">
                          {suggestedFeed > 0 ? `${(suggestedFeed / 1000).toFixed(1)} kg` : 'Moult Fasting'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Fed Today</div>
                        <div>
                          <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${
                            fed ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}>
                            {fed ? `${(batchFeedToday / 1000).toFixed(1)} kg logged` : 'Pending Feed'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Target Temp &amp; RH</div>
                        <div className="font-extrabold text-sm text-slate-900 tabular-nums">
                          {stage.idealTemp} · {stage.idealHumidity}
                        </div>
                      </div>
                    </div>

                    {/* Staff Operational Attribution Strip */}
                    {(() => {
                      const latestBatchLog = (auditLogs || []).find(
                        (a) =>
                          a.batchId === b.id ||
                          (b.batchTag && a.batchTag === b.batchTag) ||
                          (b.displayTag && a.batchTag === b.displayTag)
                      );
                      const latestBatchFeed = feedLogs
                        .filter((f) => f.batchId === b.id)
                        .sort((x, y) => y.recordedAt.localeCompare(x.recordedAt))[0];

                      return (
                        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-3">
                          <Clock size={13} className="text-[#15803D] shrink-0" />
                          <span className="truncate flex-1">
                            {latestBatchLog ? (
                              <>
                                <strong className="text-slate-900">{latestBatchLog.title}:</strong> {latestBatchLog.details} · <span className="text-[#15803D] font-semibold">{latestBatchLog.operatorName}</span> ({new Date(latestBatchLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                              </>
                            ) : latestBatchFeed ? (
                              <>
                                <strong className="text-slate-900">Last Feed:</strong> {(latestBatchFeed.quantityGrams / 1000).toFixed(1)} kg {latestBatchFeed.cultivar || latestBatchFeed.leafType} by <span className="text-[#15803D] font-semibold">{latestBatchFeed.operatorName || 'Staff'}</span> at {new Date(latestBatchFeed.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </>
                            ) : (
                              <span>Pending first operational log for this shift</span>
                            )}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Card Action Buttons */}
                    <div className="flex gap-2 mt-auto flex-wrap pt-1">
                      <button
                        type="button"
                        onClick={() => onOpenQuickLog(b.id, 'feed')}
                        className="btn-accent min-h-[48px] flex-1 min-w-[110px] text-xs font-semibold px-4 py-2.5"
                      >
                        + Log Feed
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenQuickLog(b.id, 'mortality')}
                        className="btn-secondary min-h-[48px] flex-1 min-w-[110px] text-xs font-semibold px-4 py-2.5"
                      >
                        Record Loss
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenQuickLog(b.id, 'climate')}
                        className="btn-secondary min-h-[48px] text-xs font-semibold px-4 py-2.5 flex items-center gap-1.5"
                        title="Record chamber microclimate"
                      >
                        <Thermometer size={14} className="text-[#15803D]" />
                        <span>Climate</span>
                      </button>
                      {onExportBatchPdf && (
                        <button
                          type="button"
                          onClick={() => onExportBatchPdf(b)}
                          className="btn-secondary min-h-[48px] text-xs font-semibold px-3 py-2.5 flex items-center gap-1"
                          title="Download verified PDF report for this batch"
                          aria-label={`Export PDF dossier for batch ${b.batchTag || b.id}`}
                        >
                          <FileText size={14} />
                          <span>PDF</span>
                        </button>
                      )}
                    </div>

                    {/* Synchronized Station Links */}
                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-100 text-xs">
                      <button
                        type="button"
                        onClick={() => onSelectTab('batches')}
                        className="text-[#15803D] hover:text-emerald-800 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 transition-all flex items-center gap-1 min-h-[36px]"
                      >
                        <span>Lot Dossier &amp; Trays</span>
                        <ArrowRight size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectTab('audit')}
                        className="text-slate-500 hover:text-slate-800 font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-all flex items-center gap-1 min-h-[36px]"
                      >
                        <span>Shift Audit History</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5B. Station Shift Activity Stream (Today's Operations) */}
      <div className="kalro-card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header-flex" style={{ marginBottom: '0.75rem' }}>
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={16} style={{ color: 'var(--primary)' }} />
              <span>Station Shift Activity Stream (Today's Operations)</span>
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Chronological log of feeding, microclimate checks, bed hygiene, and harvests across rotating staff
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('audit')}
            className="btn-secondary min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
            style={{ fontSize: '0.85rem', padding: '12px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span>View Full Operations Ledger</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Recent Operations List */}
        {(!auditLogs || auditLogs.length === 0) ? (
          <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
            No shift operations logged yet today. Logs recorded via "Log Feeding", "House Climate", or "Record Loss" will appear here in real time.
          </div>
        ) : (
          <div className="activity-stream-list">
            {auditLogs.slice(0, 6).map((log) => {
              const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateStr = new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
              return (
                <div key={log.id} className="activity-stream-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', flex: 1 }}>
                    <span className="activity-timestamp">
                      {timeStr}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="activity-action-title">
                        {log.title}
                      </span>
                      {log.roomName && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          [{log.roomName}]
                        </span>
                      )}
                    </div>

                    <span className="activity-details truncate" style={{ flex: 1 }}>
                      {log.details}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    <span>by</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{log.operatorName}</span>
                    <span style={{ fontSize: '0.7rem' }}>({dateStr})</span>
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
                {selectedHouseTab !== 'all'
                  ? selectedHouseTab
                  : (activeHouseEnv?.roomName ? `${activeHouseEnv.roomName} (Latest)` : 'House 1')}{' '}
                Rearing Chamber Thermometer &amp; Hygrometer
              </p>
            </div>
            <button
              onClick={() => onOpenQuickLog(undefined, 'climate')}
              className="btn-secondary min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              style={{ fontSize: '0.85rem', padding: '12px 20px' }}
              title="Record microclimate thermometer and hygrometer reading"
            >
              + Log Climate
            </button>
          </div>

          {/* Multi-House Chamber Selector Pills */}
          {houseCount > 1 && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                margin: '12px 0 8px',
                overflowX: 'auto',
                paddingBottom: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedHouseTab('all')}
                className="min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                style={{
                  padding: '12px 18px',
                  fontSize: '0.82rem',
                  borderRadius: 'var(--radius-sm)',
                  border: selectedHouseTab === 'all' ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                  background: selectedHouseTab === 'all' ? 'var(--primary)' : 'var(--bg-subtle)',
                  color: selectedHouseTab === 'all' ? '#fff' : 'var(--text-main)',
                  fontWeight: selectedHouseTab === 'all' ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                All Houses
              </button>
              {Array.from({ length: houseCount }, (_, i) => `House ${i + 1}`).map((house) => {
                const houseLog = envLogs.find((e) => e.roomName === house);
                const isSelected = selectedHouseTab === house;
                return (
                  <button
                    key={house}
                    type="button"
                    onClick={() => setSelectedHouseTab(house)}
                    className="min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                    style={{
                      padding: '12px 18px',
                      fontSize: '0.82rem',
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--primary)' : 'var(--bg-subtle)',
                      color: isSelected ? '#fff' : 'var(--text-main)',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>{house}</span>
                    {houseLog && (
                      <span
                        className="tabular-nums"
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          opacity: isSelected ? 1 : 0.85,
                        }}
                      >
                        ({houseLog.temperatureCelsius.toFixed(1)}°C)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

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
                {activeHouseEnv ? `${activeHouseEnv.temperatureCelsius.toFixed(1)}°C` : '--'}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: activeHouseEnv
                    ? activeHouseEnv.temperatureCelsius >= 24 && activeHouseEnv.temperatureCelsius <= 26
                      ? 'var(--status-success)'
                      : 'var(--status-warning)'
                    : 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                {activeHouseEnv
                  ? activeHouseEnv.temperatureCelsius >= 24 && activeHouseEnv.temperatureCelsius <= 26
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
                {activeHouseEnv ? `${activeHouseEnv.humidityPercent}%` : '--'}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: activeHouseEnv
                    ? activeHouseEnv.humidityPercent >= 70 && activeHouseEnv.humidityPercent <= 85
                      ? 'var(--status-success)'
                      : 'var(--status-warning)'
                    : 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                {activeHouseEnv
                  ? activeHouseEnv.humidityPercent >= 70 && activeHouseEnv.humidityPercent <= 85
                    ? 'Target (70 – 85%)'
                    : 'Deviation from target'
                  : 'No reading recorded'}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-divider)', paddingTop: '0.6rem' }}>
            <span>Ventilation: {activeHouseEnv?.ventilationStatus ? `${activeHouseEnv.ventilationStatus.toUpperCase()} airflow` : 'Active cross-draft louvers'}</span>
            <span>Status: {activeHouseEnv ? `${activeHouseEnv.roomName ? `[${activeHouseEnv.roomName}] ` : ''}Logged ${new Date(activeHouseEnv.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No readings recorded'}</span>
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
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {onOpenAddLeaf && (
                <button
                  type="button"
                  onClick={onOpenAddLeaf}
                  className="btn-accent min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                  style={{ fontSize: '0.85rem', padding: '12px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={15} />
                  + Harvest Stock
                </button>
              )}
              {onOpenAddLeaf && (
                <button
                  type="button"
                  onClick={onOpenAddLeaf}
                  className="btn-secondary min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                  style={{ fontSize: '0.85rem', padding: '12px 18px' }}
                >
                  Adjust Cultivars
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: '0.85rem 0' }}>
            {/* Mulberry Section with Cultivars */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'inline-block' }} />
                  Mulberry Forage Stock (Morus alba)
                </span>
                <strong className="tabular-nums">{inventory.mulberryKg.toFixed(1)} kg Total</strong>
              </div>
              <div className="progress-bar-bg" style={{ margin: '0 0 6px' }}>
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(100, (inventory.mulberryKg / 200) * 100)}%` }}
                />
              </div>
              {/* Cultivar tags */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '0.7rem' }}>
                <span style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
                  <strong>V1 (Chawki):</strong> {(inventory.mulberryByType?.['V1'] ?? (inventory.mulberryKg * 0.35)).toFixed(1)} kg
                </span>
                <span style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
                  <strong>Thika / Embu:</strong> {(inventory.mulberryByType?.['Thika'] ?? (inventory.mulberryKg * 0.40)).toFixed(1)} kg
                </span>
                <span style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
                  <strong>Kanva 2 / S36:</strong> {(inventory.mulberryByType?.['Kanva 2'] ?? (inventory.mulberryKg * 0.25)).toFixed(1)} kg
                </span>
              </div>
            </div>

            {/* Castor Section with Cultivars */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--status-warning)', display: 'inline-block' }} />
                  Castor Forage Stock (Ricinus communis for Eri)
                </span>
                <strong className="tabular-nums">{inventory.castorKg.toFixed(1)} kg Total</strong>
              </div>
              <div className="progress-bar-bg" style={{ margin: '0 0 6px' }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min(100, (inventory.castorKg / 100) * 100)}%`,
                    backgroundColor: 'var(--status-warning)',
                  }}
                />
              </div>
              {/* Variety tags */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '0.7rem' }}>
                <span style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
                  <strong>NUU 70 (Chawki):</strong> {(inventory.castorByType?.['NUU 70'] ?? (inventory.castorKg * 0.60)).toFixed(1)} kg
                </span>
                <span style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
                  <strong>KC6 / KC 14:</strong> {(inventory.castorByType?.['KC6'] ?? (inventory.castorKg * 0.40)).toFixed(1)} kg
                </span>
              </div>
            </div>

            {/* Kesseru Reserve */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-gold)', display: 'inline-block' }} />
                  Kesseru Dry-Season Reserve (Heteropanax fragrans)
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

          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-divider)', paddingTop: '0.6rem', flexWrap: 'wrap', gap: '4px' }}>
            <span>Auto-deduct on feeds active · ~{leafCoverage.dailyNeedKg.toFixed(1)} kg/day</span>
            <span style={{ fontWeight: 600, color: leafCoverage.daysOfCover <= 2 ? 'var(--status-danger)' : 'var(--status-success)' }}>
              {leafCoverage.daysOfCover > 0 ? `${leafCoverage.daysOfCover} days buffer remaining` : 'No active consumption'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
