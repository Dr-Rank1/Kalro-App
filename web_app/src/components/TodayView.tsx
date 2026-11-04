import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Leaf,
  Plus,
  Thermometer,
  TrendingUp,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../translations';
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

interface TodayViewProps {
  batches: Batch[];
  feedLogs: FeedLog[];
  mortalityLogs: MortalityLog[];
  envLogs: EnvironmentLog[];
  harvests: CocoonHarvest[];
  inventory: LeafInventory;
  lang: Language;
  onOpenQuickLog: (batchId?: string, defaultType?: 'feed' | 'mortality' | 'climate' | 'harvest') => void;
  onSelectTab: (tab: 'batches' | 'plan' | 'farm' | 'you') => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  batches,
  feedLogs,
  mortalityLogs,
  envLogs,
  harvests,
  inventory,
  lang,
  onOpenQuickLog,
  onSelectTab,
}) => {
  const t = TRANSLATIONS[lang];
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

  // Sensor simulator state
  const [simulatedReading, setSimulatedReading] = useState<{
    temp: number;
    hum: number;
    syncTime: string;
  }>({
    temp: 25.4,
    hum: 76,
    syncTime: 'Just now',
  });

  const handleSyncSensor = () => {
    // Generate realistic rearing room reading
    const temp = Number((24.5 + Math.random() * 2.5).toFixed(1));
    const hum = Math.round(72 + Math.random() * 10);
    setSimulatedReading({
      temp,
      hum,
      syncTime: 'Just now',
    });
  };

  // Check alert conditions
  const alerts: { type: 'warning' | 'critical' | 'info'; message: string; sub?: string }[] = [];

  if (leafCoverage.urgency === 'critical') {
    alerts.push({
      type: 'critical',
      message: `${t.lowLeafWarning}: Only ${leafCoverage.totalStockKg} kg leaf remaining.`,
      sub: `Estimated ${leafCoverage.daysOfCover} day(s) of cover at current feeding velocity (${leafCoverage.dailyNeedKg} kg/day).`,
    });
  } else if (leafCoverage.urgency === 'warning') {
    alerts.push({
      type: 'warning',
      message: `${t.lowLeafWarning}: ${leafCoverage.daysOfCover} days of forage remaining.`,
      sub: 'Harvest fresh mulberry/castor leaves soon to maintain uninterrupted rations.',
    });
  }

  // Check batches in moult
  for (const b of activeBatches) {
    const stage = getCurrentStage(b);
    if (stage.isMoult) {
      alerts.push({
        type: 'info',
        message: `${b.displayTag || b.batchTag || b.id}: ${t.moultRestNotice}`,
        sub: `${stage.name} (${stage.swahiliName}) - Keep rearing bed dry and aerated with lime dusting.`,
      });
    } else if (!isFedToday(b.id, feedLogs)) {
      alerts.push({
        type: 'warning',
        message: `${b.displayTag || b.batchTag || b.id}: ${t.noFeedingLogged}`,
        sub: `Requires approx ${getSuggestedDailyFeedGrams(b, getLiveLarvaeCount(b, mortalityLogs), stage)}g fresh forage today.`,
      });
    }

    // Check environment logs
    const latestEnv = envLogs.find((e) => e.batchId === b.id);
    if (latestEnv) {
      const limits = SPECIES_THRESHOLDS[b.species];
      if (latestEnv.temperatureCelsius < limits.minTemp || latestEnv.temperatureCelsius > limits.maxTemp) {
        alerts.push({
          type: 'warning',
          message: `${b.displayTag || b.id}: ${t.tempStress} (${latestEnv.temperatureCelsius}°C)`,
          sub: `Optimal range for ${b.species === 'bombyx' ? 'Bombyx' : 'Eri'} is ${limits.minTemp}°C - ${limits.maxTemp}°C.`,
        });
      }
    }
  }

  return (
    <div>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div>
          <h2>{t.welcomeFarmer}</h2>
          <p>{t.todayOverview}</p>
        </div>
        <div className="quick-actions">
          <button
            onClick={() => onOpenQuickLog(undefined, 'feed')}
            className="btn-primary"
          >
            <Plus size={16} />
            <span>{t.logFeed}</span>
          </button>
          <button
            onClick={() => onOpenQuickLog(undefined, 'mortality')}
            className="btn-secondary"
          >
            <span>{t.logMortality}</span>
          </button>
          <button
            onClick={() => onOpenQuickLog(undefined, 'climate')}
            className="btn-secondary"
          >
            <span>{t.logClimate}</span>
          </button>
          <button
            onClick={() => onOpenQuickLog(undefined, 'harvest')}
            className="btn-secondary"
          >
            <span>{t.logHarvest}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap green">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-details">
            <p>{t.liveLarvae}</p>
            <h3>{totalLiveLarvae.toLocaleString()}</h3>
            <span style={{ color: 'var(--success)' }}>
              {activeBatches.length} {t.activeBatches.toLowerCase()}
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap leaf">
            <Leaf size={24} />
          </div>
          <div className="kpi-details">
            <p>{t.feedToday}</p>
            <h3>{(feedTodayGrams / 1000).toFixed(1)} kg</h3>
            <span style={{ color: 'var(--leaf)' }}>
              Stock: {leafCoverage.totalStockKg} kg
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap amber">
            <Clock size={24} />
          </div>
          <div className="kpi-details">
            <p>{t.daysCover}</p>
            <h3>{leafCoverage.daysOfCover} days</h3>
            <span
              style={{
                color:
                  leafCoverage.urgency === 'critical'
                    ? 'var(--danger)'
                    : leafCoverage.urgency === 'warning'
                    ? 'var(--rest)'
                    : 'var(--success)',
              }}
            >
              {t[leafCoverage.urgency]}
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap gold">
            <CheckCircle2 size={24} />
          </div>
          <div className="kpi-details">
            <p>{t.avgSurvival}</p>
            <h3>{avgSurvival.toFixed(1)}%</h3>
            <span style={{ color: 'var(--accent-gold)' }}>
              {harvests.length} cycles recorded
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap green">
            <Sparkles size={24} />
          </div>
          <div className="kpi-details">
            <p>{t.totalHarvestKg}</p>
            <h3>{totalHarvestWeightKg.toFixed(1)} kg</h3>
            <span style={{ color: 'var(--primary-green)' }}>
              Raw silk grade tracked
            </span>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="kalro-card" style={{ padding: '1.25rem' }}>
          <div className="card-header-flex" style={{ marginBottom: '0.85rem' }}>
            <h3 className="card-title" style={{ fontSize: '1.05rem', color: 'var(--rest)' }}>
              <AlertTriangle size={18} />
              <span>{t.alertsTitle}</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {alerts.length} action item(s)
            </span>
          </div>
          {alerts.map((alert, idx) => (
            <div key={idx} className={`alert-box ${alert.type}`}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>{alert.message}</strong>
                {alert.sub && <div style={{ fontSize: '0.78rem', marginTop: '3px' }}>{alert.sub}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rearing Room Climate & Active Batches Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Rearing Microclimate Card */}
        <div className="kalro-card" style={{ marginBottom: 0 }}>
          <div className="card-header-flex">
            <h3 className="card-title">
              <Thermometer size={18} color="var(--primary-green)" />
              <span>Rearing House Climate</span>
            </h3>
            <button
              onClick={handleSyncSensor}
              className="btn-accent"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
              title="Read microclimate sensor"
            >
              Sync Sensor
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ flex: 1, padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Temperature</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary-green)' }}>
                {simulatedReading.temp}°C
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--success)' }}>Optimal (24 - 28°C)</div>
            </div>

            <div style={{ flex: 1, padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Humidity</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--info)' }}>
                {simulatedReading.hum}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--success)' }}>Target (70 - 85%)</div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Ventilation: Cross-ventilation open</span>
            <span>Synced: {simulatedReading.syncTime}</span>
          </div>
        </div>

        {/* Quick Stock & Forage Status */}
        <div className="kalro-card" style={{ marginBottom: 0 }}>
          <div className="card-header-flex">
            <h3 className="card-title">
              <Leaf size={18} color="var(--leaf)" />
              <span>Forage Inventory Breakdown</span>
            </h3>
            <button
              onClick={() => onSelectTab('farm')}
              style={{ background: 'none', border: 'none', color: 'var(--primary-green)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Open Ledger →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>Mulberry (Bombyx)</span>
                <strong>{inventory.mulberryKg.toFixed(1)} kg</strong>
              </div>
              <div className="progress-bar-bg" style={{ margin: 0 }}>
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(100, (inventory.mulberryKg / 200) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>Castor (Eri)</span>
                <strong>{inventory.castorKg.toFixed(1)} kg</strong>
              </div>
              <div className="progress-bar-bg" style={{ margin: 0 }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min(100, (inventory.castorKg / 100) * 100)}%`,
                    background: 'var(--rest)',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>Kesseru (Eri Alternative)</span>
                <strong>{inventory.kesseruKg.toFixed(1)} kg</strong>
              </div>
              <div className="progress-bar-bg" style={{ margin: 0 }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min(100, (inventory.kesseruKg / 50) * 100)}%`,
                    background: 'var(--accent-gold)',
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
          <h3 className="card-title">
            <Info size={18} color="var(--primary-green)" />
            <span>Active Silkworm Batches ({activeBatches.length})</span>
          </h3>
          <button
            onClick={() => onSelectTab('batches')}
            className="btn-accent"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
          >
            Manage All Batches
          </button>
        </div>

        {activeBatches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <p>No active rearing batches currently.</p>
            <button
              onClick={() => onSelectTab('batches')}
              className="btn-accent"
              style={{ marginTop: '0.85rem' }}
            >
              Start New Cycle
            </button>
          </div>
        ) : (
          <div className="batches-grid">
            {activeBatches.map((b) => {
              const live = getLiveLarvaeCount(b, mortalityLogs);
              const stage = getCurrentStage(b);
              const suggestedFeed = getSuggestedDailyFeedGrams(b, live, stage);
              const fed = isFedToday(b.id, feedLogs);
              const progressPct = Math.min(
                100,
                Math.round((stage.dayStart / (b.species === 'bombyx' ? 40 : 39)) * 100)
              );

              return (
                <div key={b.id} className="batch-item-card">
                  <div className="batch-tag-row">
                    <span className={`species-badge ${b.species}`}>
                      {b.species === 'bombyx' ? 'Bombyx Mori' : 'Eri Silkworm'}
                    </span>
                    <span className="status-badge active">{stage.name}</span>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    {b.displayTag || b.batchTag || b.id}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    {b.roomName || 'Main Rearing House'} • Day {stage.dayStart} of{' '}
                    {b.species === 'bombyx' ? '40' : '39'}
                  </p>

                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      fontSize: '0.8rem',
                      margin: '0.75rem 0',
                      background: 'var(--background)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Live Larvae</div>
                      <strong>{live.toLocaleString()}</strong>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Daily Target</div>
                      <strong>{suggestedFeed > 0 ? `${(suggestedFeed / 1000).toFixed(1)} kg` : 'Moult (Rest)'}</strong>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Fed Today?</div>
                      <span style={{ color: fed ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                        {fed ? '✓ Logged' : '✗ Pending'}
                      </span>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Rearing Room</div>
                      <strong>{stage.idealTemp}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button
                      onClick={() => onOpenQuickLog(b.id, 'feed')}
                      className="btn-accent"
                      style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem' }}
                    >
                      + Feed
                    </button>
                    <button
                      onClick={() => onOpenQuickLog(b.id, 'mortality')}
                      className="btn-secondary"
                      style={{
                        flex: 1,
                        fontSize: '0.78rem',
                        padding: '0.45rem',
                        color: 'var(--text-dark)',
                        borderColor: 'var(--card-border)',
                      }}
                    >
                      + Loss
                    </button>
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
