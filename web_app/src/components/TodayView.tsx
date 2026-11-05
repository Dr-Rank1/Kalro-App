import React from 'react';
import { FileText } from 'lucide-react';
import {
  Batch,
  EnvironmentLog,
  FeedLog,
  LeafInventory,
  MortalityLog,
  CocoonHarvest,
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
  onOpenQuickLog: (batchId?: string, defaultType?: 'feed' | 'mortality' | 'climate' | 'harvest') => void;
  onSelectTab: (tab: 'batches' | 'plan' | 'farm' | 'you') => void;
  onExportBatchPdf?: (batch: Batch) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  batches,
  feedLogs,
  mortalityLogs,
  envLogs,
  harvests,
  inventory,
  onOpenQuickLog,
  onSelectTab,
  onExportBatchPdf,
}) => {
  const activeBatches = batches.filter((b) => b.status === 'active');

  // KPI Calculations
  let totalLiveLarvae = 0;
  let totalOriginalEggs = 0;
  for (const b of activeBatches) {
    totalLiveLarvae += getLiveLarvaeCount(b, mortalityLogs);
    totalOriginalEggs += b.eggCount;
  }

  const avgSurvival =
    totalOriginalEggs > 0 ? (totalLiveLarvae / totalOriginalEggs) * 100 : 100;

  // Today's feed logged
  const todayStr = new Date().toISOString().split('T')[0];
  const feedTodayGrams = feedLogs
    .filter((f) => f.recordedAt.startsWith(todayStr))
    .reduce((sum, f) => sum + f.quantityGrams, 0);

  // Total harvest kg
  const totalHarvestWeightKg =
    harvests.reduce((sum, h) => sum + h.totalWeightGrams, 0) / 1000.0;

  // Leaf coverage forecast
  const leafCoverage = calculateLeafCoverage(inventory, activeBatches, mortalityLogs);

  // Latest microclimate reading from authentic station logs
  const latestEnv = envLogs.length > 0 ? envLogs[0] : null;

  // Check alert conditions
  const alerts: { type: 'warning' | 'critical' | 'info'; message: string; sub?: string }[] = [];

  if (activeBatches.length > 0) {
    if (leafCoverage.urgency === 'critical') {
      alerts.push({
        type: 'critical',
        message: `Critical Forage Deficit: Only ${leafCoverage.totalStockKg.toFixed(1)} kg forage remaining in storage.`,
        sub: `Estimated ${leafCoverage.daysOfCover} day runway at peak 5th-instar feeding consumption (${leafCoverage.dailyNeedKg.toFixed(1)} kg/day).`,
      });
    } else if (leafCoverage.urgency === 'warning') {
      alerts.push({
        type: 'warning',
        message: `Forage Replenishment Notice: ${leafCoverage.daysOfCover} days of forage remaining.`,
        sub: 'Schedule morning plot harvest of Kanva-2 / S-13 shoots before afternoon heat.',
      });
    }
  }

  // Check batches in moult
  for (const b of activeBatches) {
    const stage = getCurrentStage(b);
    if (stage.isMoult) {
      alerts.push({
        type: 'info',
        message: `${b.displayTag || b.batchTag || b.id}: Inactive Moult Period (${stage.name})`,
        sub: 'Withhold all leaf feed. Dust bed with dry slaked lime and bleaching powder (97:3). Maintain 24-25°C.',
      });
    } else if (!isFedToday(b.id, feedLogs)) {
      alerts.push({
        type: 'warning',
        message: `${b.displayTag || b.batchTag || b.id}: Morning Rations Not Logged`,
        sub: `Requires approx ${getSuggestedDailyFeedGrams(b, getLiveLarvaeCount(b, mortalityLogs), stage)}g fresh forage today.`,
      });
    }

    const latestEnv = envLogs.find((e) => e.batchId === b.id);
    if (latestEnv) {
      const limits = SPECIES_THRESHOLDS[b.species];
      if (latestEnv.temperatureCelsius < limits.minTemp || latestEnv.temperatureCelsius > limits.maxTemp) {
        alerts.push({
          type: 'warning',
          message: `${b.displayTag || b.id}: Temperature Deviation (${latestEnv.temperatureCelsius}°C)`,
          sub: `Standard rearing range for ${b.species === 'bombyx' ? 'Bivoltine Bombyx mori' : 'Eri Silkworm'} is ${limits.minTemp}°C - ${limits.maxTemp}°C.`,
        });
      }
    }
  }

  return (
    <div>
      {/* Operational Control Header - Reworked from generic centered hero */}
      <div className="ops-control-header">
        <div className="ops-title-group">
          <h2>Rearing House Operations</h2>
          <p>Real-time biological monitoring, microclimate compliance, and forage allocation.</p>
        </div>
        <div className="ops-actions">
          <button
            onClick={() => onOpenQuickLog(undefined, 'feed')}
            className="btn-accent"
          >
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
          >
            Log Climate
          </button>
          <button
            onClick={() => onOpenQuickLog(undefined, 'harvest')}
            className="btn-secondary"
          >
            Log Harvest
          </button>
        </div>
      </div>

      {/* Reworked: Integrated Operational Metric Strip (Border only, zero shadow, tabular numerals) */}
      <div className="operational-metric-strip">
        <div className="metric-col">
          <span className="metric-label">Live Silkworms</span>
          <span className="metric-number tabular-nums">{totalLiveLarvae.toLocaleString()}</span>
          <span className="metric-sub">{activeBatches.length} active rearing {activeBatches.length === 1 ? 'lot' : 'lots'}</span>
        </div>

        <div className="metric-col">
          <span className="metric-label">Feed Dispatched Today</span>
          <span className="metric-number tabular-nums">{(feedTodayGrams / 1000).toFixed(1)} kg</span>
          <span className="metric-sub">Stored stock: {leafCoverage.totalStockKg.toFixed(1)} kg</span>
        </div>

        <div className="metric-col">
          <span className="metric-label">Forage Runway</span>
          <span className="metric-number tabular-nums">
            {activeBatches.length > 0 ? `${leafCoverage.daysOfCover} Days` : '--'}
          </span>
          <span className="metric-sub" style={{ color: activeBatches.length > 0 && leafCoverage.urgency === 'critical' ? 'var(--status-danger)' : activeBatches.length > 0 && leafCoverage.urgency === 'warning' ? 'var(--status-warning)' : 'var(--status-success)', fontWeight: 600 }}>
            Buffer: {activeBatches.length > 0 ? leafCoverage.urgency.toUpperCase() : 'NO ACTIVE BATCH'}
          </span>
        </div>

        <div className="metric-col">
          <span className="metric-label">Average Survival</span>
          <span className="metric-number tabular-nums">
            {totalOriginalEggs > 0 ? `${avgSurvival.toFixed(1)}%` : '--'}
          </span>
          <span className="metric-sub">{totalOriginalEggs > 0 ? 'Bivoltine hybrid benchmark' : 'Awaiting active rearing'}</span>
        </div>

        <div className="metric-col">
          <span className="metric-label">Total Cocoons Harvested</span>
          <span className="metric-number tabular-nums">{totalHarvestWeightKg > 0 ? `${totalHarvestWeightKg.toFixed(1)} kg` : '0.0 kg'}</span>
          <span className="metric-sub">{totalHarvestWeightKg > 0 ? 'Grade A commercial yield' : 'No harvests recorded'}</span>
        </div>
      </div>

      {/* Operational Notices Section */}
      {alerts.length > 0 && (
        <div className="kalro-card">
          <div className="card-header-flex">
            <h3 className="card-title">Active Station Notices</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {alerts.length} action {alerts.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          {alerts.map((alert, idx) => (
            <div key={idx} className={`alert-box ${alert.type}`}>
              <div>
                <strong>{alert.message}</strong>
                {alert.sub && <div style={{ fontSize: '0.78rem', marginTop: '3px' }}>{alert.sub}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rearing Room Climate & Forage Breakdown - Border only, clean typography */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Rearing Microclimate Card */}
        <div className="kalro-card" style={{ marginBottom: 0 }}>
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Rearing House Microclimate</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                House 1 (Bivoltine Bay) Rearing Chamber
              </p>
            </div>
            <button
              onClick={() => onOpenQuickLog(undefined, 'climate')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
              title="Record microclimate thermometer and hygrometer reading"
            >
              Log Climate
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)', marginBottom: '3px' }} aria-hidden="true">
                <path d="M14 4a2 2 0 0 0-4 0v8a4 4 0 1 0 4 0Z" />
                <path d="M12 12v4" />
                <circle cx="12" cy="16" r="1.5" fill="currentColor" />
              </svg>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Dry Bulb Temp</div>
              <div className="tabular-nums" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)', margin: '2px 0' }}>
                {latestEnv ? `${latestEnv.temperatureCelsius.toFixed(1)}°C` : '--'}
              </div>
              <div style={{ fontSize: '0.72rem', color: latestEnv ? (latestEnv.temperatureCelsius >= 24 && latestEnv.temperatureCelsius <= 26 ? 'var(--status-success)' : 'var(--status-warning)') : 'var(--text-muted)', fontWeight: 600 }}>
                {latestEnv ? (latestEnv.temperatureCelsius >= 24 && latestEnv.temperatureCelsius <= 26 ? 'Optimal (24.0 - 26.0°C)' : 'Deviation from target') : 'No reading recorded'}
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--status-info)', marginBottom: '3px' }} aria-hidden="true">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                <path d="M12 11a3 3 0 0 0 3 3" opacity="0.6" />
              </svg>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Relative Humidity</div>
              <div className="tabular-nums" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--status-info)', margin: '2px 0' }}>
                {latestEnv ? `${latestEnv.humidityPercent}%` : '--'}
              </div>
              <div style={{ fontSize: '0.72rem', color: latestEnv ? (latestEnv.humidityPercent >= 70 && latestEnv.humidityPercent <= 80 ? 'var(--status-success)' : 'var(--status-warning)') : 'var(--text-muted)', fontWeight: 600 }}>
                {latestEnv ? (latestEnv.humidityPercent >= 70 && latestEnv.humidityPercent <= 80 ? 'Target (70 - 80%)' : 'Deviation from target') : 'No reading recorded'}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-divider)', paddingTop: '0.6rem' }}>
            <span>Ventilation: {latestEnv?.ventilationStatus ? `${latestEnv.ventilationStatus.toUpperCase()} airflow` : 'Active cross-draft louvers'}</span>
            <span>Status: {latestEnv ? `Logged ${new Date(latestEnv.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No readings today'}</span>
          </div>
        </div>

        {/* Stock & Forage Status */}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
        </div>
      </div>

      {/* Active Batches Section */}
      <div className="kalro-card">
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Active Rearing Lots</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Batches currently undergoing feeding, moulting, or spinning
            </p>
          </div>
          <button
            onClick={() => onSelectTab('batches')}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
          >
            View All Batches
          </button>
        </div>

        {activeBatches.length === 0 ? (
          <div className="empty-state">
            <h4>No Active Rearing Batches</h4>
            <p>All previous rearing cycles are closed. Start a new batch to track chawki rearing and leaf consumption.</p>
            <button
              onClick={() => onSelectTab('batches')}
              className="btn-primary"
            >
              Start New Batch Cycle
            </button>
          </div>
        ) : (
          <div className="batches-grid">
            {activeBatches.map((b) => {
              const live = getLiveLarvaeCount(b, mortalityLogs);
              const stage = getCurrentStage(b);
              const suggestedFeed = getSuggestedDailyFeedGrams(b, live, stage);
              const fed = isFedToday(b.id, feedLogs);
              const maxDays = b.species === 'bombyx' ? 40 : 39;
              const progressPct = Math.min(
                100,
                Math.round((stage.dayStart / maxDays) * 100)
              );

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
                      <span className="status-badge active">{stage.name}</span>
                    </div>

                  <h4 className="truncate" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    {b.displayTag || b.batchTag || b.id}
                  </h4>
                  <p className="truncate" style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                    {b.roomName || 'Rearing House 1'} • Day {stage.dayStart} of {maxDays}
                  </p>

                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      fontSize: '0.78rem',
                      margin: '0.65rem 0',
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
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Feed Today</div>
                      <span
                        className="tabular-nums"
                        style={{
                          color: fed ? 'var(--status-success)' : 'var(--status-danger)',
                          fontWeight: 600,
                        }}
                      >
                        {fed ? 'Rations Logged' : 'Pending Feed'}
                      </span>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Target Temp</div>
                      <strong className="tabular-nums">{stage.idealTemp}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto' }}>
                    <button
                      onClick={() => onOpenQuickLog(b.id, 'feed')}
                      className="btn-accent"
                      style={{ flex: 1, fontSize: '0.78rem', padding: '0.4rem' }}
                    >
                      Log Feed
                    </button>
                    <button
                      onClick={() => onOpenQuickLog(b.id, 'mortality')}
                      className="btn-secondary"
                      style={{ flex: 1, fontSize: '0.78rem', padding: '0.4rem' }}
                    >
                      Record Loss
                    </button>
                    {onExportBatchPdf && (
                      <button
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
    </div>
  );
};
