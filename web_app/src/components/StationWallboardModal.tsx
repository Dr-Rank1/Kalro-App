import React, { useState, useEffect } from 'react';
import {
  Tv,
  Clock,
  Thermometer,
  Droplets,
  Layers,
  Leaf,
  Users,
  ShieldAlert,
  Maximize2,
  Minimize2,
  X,
  CheckCircle2,
} from 'lucide-react';
import {
  Batch,
  CocoonHarvest,
  EnvironmentLog,
  FarmProfile,
  FeedLog,
  LeafInventory,
  MortalityLog,
  UserAccount,
} from '../types';
import {
  calculateLeafCoverage,
  getCurrentStage,
  getLiveLarvaeCount,
  getNextShiftSchedule,
  getSuggestedDailyFeedGrams,
  isFedToday,
} from '../utils';

interface StationWallboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FarmProfile | null;
  currentUser: UserAccount | null;
  allUsers: UserAccount[];
  batches: Batch[];
  feedLogs: FeedLog[];
  mortalityLogs: MortalityLog[];
  envLogs: EnvironmentLog[];
  harvests: CocoonHarvest[];
  inventory: LeafInventory;
}

export const StationWallboardModal: React.FC<StationWallboardModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentUser,
  allUsers,
  batches,
  feedLogs,
  mortalityLogs,
  envLogs,
  harvests,
  inventory,
}) => {
  const [time, setTime] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const activeBatches = batches.filter((b) => b.status === 'active');
  const shiftSchedule = getNextShiftSchedule(time);
  const leafCoverage = calculateLeafCoverage(inventory, activeBatches, mortalityLogs);
  const todayStr = time.toISOString().split('T')[0];

  const houseCount = Math.max(1, profile?.houseCount || 4);
  const chambers = Array.from({ length: houseCount }, (_, i) => `Rearing House ${i + 1}`);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      className="wallboard-fullscreen-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0A120E',
        color: '#F8FAFC',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top Wallboard Broadcast Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 2rem',
          backgroundColor: '#0F3826',
          borderBottom: '3px solid #C68A14',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FCD34D',
            }}
          >
            <Tv size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#86EFAC', fontWeight: 700 }}>
              National Sericulture Research Centre · Facility Telemetry
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              {profile?.orgName || 'KALRO Sericulture Research Station, Thika'}
            </h1>
          </div>
        </div>

        {/* Live Clock & Shift Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'monospace', color: '#FFFFFF', letterSpacing: '1px' }}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
              {time.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>

          <div
            style={{
              padding: '6px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: currentUser?.avatarColor || '#143D2B',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {currentUser?.avatarInitials || 'OP'}
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#86EFAC', textTransform: 'uppercase', fontWeight: 700 }}>
                Active Operator on Duty
              </div>
              <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>{currentUser?.username || 'Staff'}</strong>
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
            }}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(220, 38, 38, 0.2)',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              color: '#FCA5A5',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
            }}
            title="Exit Wallboard"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Main Broadcast Content Area */}
      <div style={{ padding: '1.5rem 2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Top KPI Ribbon */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {/* Next Scheduled Ration Countdown */}
          <div style={{ backgroundColor: '#13231B', border: '1px solid #1E3A2B', borderRadius: '12px', padding: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#86EFAC', marginBottom: '4px' }}>
              <Clock size={16} />
              <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Next Feeding Ration</span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'monospace' }}>
              {shiftSchedule.timeRemainingFormatted}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '2px' }}>
              {shiftSchedule.nextRationName} ({String(shiftSchedule.nextRationHour).padStart(2, '0')}:{String(shiftSchedule.nextRationMinute).padStart(2, '0')})
            </div>
          </div>

          {/* Active Rearing Lots Count */}
          <div style={{ backgroundColor: '#13231B', border: '1px solid #1E3A2B', borderRadius: '12px', padding: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60A5FA', marginBottom: '4px' }}>
              <Layers size={16} />
              <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Active Rearing Lots</span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF' }}>
              {activeBatches.length} {activeBatches.length === 1 ? 'Lot' : 'Lots'}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '2px' }}>
              In active feeding &amp; microclimate calibration
            </div>
          </div>

          {/* Stored Forage Stockpile Runway */}
          <div style={{ backgroundColor: '#13231B', border: '1px solid #1E3A2B', borderRadius: '12px', padding: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FBBF24', marginBottom: '4px' }}>
              <Leaf size={16} />
              <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Forage Stockpile Runway</span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: leafCoverage.daysOfCover <= 2 ? '#F87171' : '#FCD34D' }}>
              {leafCoverage.daysOfCover} Days Buffer
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '2px' }}>
              {leafCoverage.totalStockKg.toFixed(1)} kg stored ({leafCoverage.dailyNeedKg.toFixed(1)} kg/day need)
            </div>
          </div>
        </div>

        {/* Chamber Microclimate Telemetry Grid */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#86EFAC', marginBottom: '0.75rem' }}>
            Chamber Microclimate Sensors (Dry Bulb &amp; Humidity)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {chambers.map((chamberName) => {
              const env = envLogs.find((e) => e.roomName === chamberName) || envLogs[0];
              const temp = env?.temperatureCelsius || 25.5;
              const hum = env?.humidityPercent || 78;
              const isIdeal = temp >= 24 && temp <= 28 && hum >= 65 && hum <= 85;

              return (
                <div
                  key={chamberName}
                  style={{
                    backgroundColor: '#111E17',
                    border: '1px solid #1C3325',
                    borderRadius: '10px',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#FFFFFF' }}>{chamberName}</strong>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: isIdeal ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                        color: isIdeal ? '#86EFAC' : '#FDE047',
                      }}
                    >
                      {isIdeal ? 'Optimal' : 'Adjust Louvers'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ backgroundColor: '#0B150F', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Temperature</div>
                      <strong style={{ fontSize: '1.25rem', color: '#FFFFFF' }}>{temp.toFixed(1)}°C</strong>
                    </div>
                    <div style={{ backgroundColor: '#0B150F', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Humidity</div>
                      <strong style={{ fontSize: '1.25rem', color: '#60A5FA' }}>{hum}% RH</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Batches Telemetry Table */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#86EFAC', marginBottom: '0.75rem' }}>
            Active Silkworm Trial Batches
          </div>

          <div
            style={{
              backgroundColor: '#111E17',
              border: '1px solid #1C3325',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            {activeBatches.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                No active rearing batches in facility.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0D1711', borderBottom: '1px solid #1C3325', color: '#94A3B8', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Lot Reference</th>
                    <th style={{ padding: '12px 16px' }}>Species &amp; Room</th>
                    <th style={{ padding: '12px 16px' }}>Stage &amp; Day</th>
                    <th style={{ padding: '12px 16px' }}>Live Larvae</th>
                    <th style={{ padding: '12px 16px' }}>Target Forage Cultivar</th>
                    <th style={{ padding: '12px 16px' }}>Today's Feed Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBatches.map((b) => {
                    const live = getLiveLarvaeCount(b, mortalityLogs);
                    const stage = getCurrentStage(b);
                    const suggestedFeed = getSuggestedDailyFeedGrams(b, live, stage);
                    const fed = isFedToday(b.id, feedLogs, time);
                    const maxDays = b.species === 'bombyx' ? 40 : 39;

                    const batchFeedToday = feedLogs
                      .filter((f) => f.batchId === b.id && f.recordedAt.startsWith(todayStr))
                      .reduce((sum, f) => sum + f.quantityGrams, 0);

                    const targetCultivar = b.species === 'bombyx'
                      ? (stage.instarNumber || 1) <= 3 ? 'S-13 Mulberry (Tender Chawki)' : 'TR-10 / Kanva-2 (Late Age)'
                      : 'GRC-1 Castor Foliage';

                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid #16281D' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#FFFFFF' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {b.isQuarantined && (
                              <span style={{ backgroundColor: '#DC2626', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem' }}>
                                QUARANTINE
                              </span>
                            )}
                            <span>{b.displayTag || b.batchTag || b.id}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#CBD5E1' }}>
                          <div>{b.species === 'bombyx' ? 'Bombyx mori' : 'Eri Silkworm'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{b.roomName || 'House 1'}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              backgroundColor: stage.isMoult ? '#78350F' : '#14532D',
                              color: stage.isMoult ? '#FDE68A' : '#BBF7D0',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                            }}
                          >
                            {stage.name} · Day {stage.dayStart}/{maxDays}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: 700 }}>
                          {live.toLocaleString()}
                          <span style={{ fontSize: '0.72rem', color: '#64748B', marginLeft: '4px' }}>
                            ({b.eggCount > 0 ? ((live / b.eggCount) * 100).toFixed(0) : 100}%)
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#86EFAC', fontWeight: 600 }}>
                          {targetCultivar}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              color: fed ? '#86EFAC' : '#F87171',
                              fontWeight: 700,
                            }}
                          >
                            {fed ? `✓ ${(batchFeedToday / 1000).toFixed(1)} kg Logged` : '⚠ Pending Ration'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
