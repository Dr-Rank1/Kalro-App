import React, { useState } from 'react';
import { BOMBYX_STAGES, ERI_STAGES } from '../constants';
import { Batch, MilestoneStage, Species } from '../types';
import { getCurrentStage, getBatchAgeDays } from '../utils';
import { StageMilestoneIcon } from './SericultureCardArtwork';

interface PlanViewProps {
  batches: Batch[];
}

export const PlanView: React.FC<PlanViewProps> = ({ batches }) => {
  const [activeSpecies, setActiveSpecies] = useState<Species>('bombyx');

  const stages: MilestoneStage[] = activeSpecies === 'bombyx' ? BOMBYX_STAGES : ERI_STAGES;
  const activeBatches = batches.filter((b) => b.status === 'active' && b.species === activeSpecies);

  return (
    <div>
      <div className="card-header-flex" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Sericulture Lifecycle Roadmap
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Official KALRO biological roadmap for 40-day Bivoltine Bombyx mori and 39-day Eri silkworms.
          </p>
        </div>

        {/* Species Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-card)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
          <button
            onClick={() => setActiveSpecies('bombyx')}
            style={{
              background: activeSpecies === 'bombyx' ? 'var(--primary)' : 'transparent',
              color: activeSpecies === 'bombyx' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              padding: '0.4rem 0.95rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            Bombyx mori (Bivoltine)
          </button>
          <button
            onClick={() => setActiveSpecies('eri')}
            style={{
              background: activeSpecies === 'eri' ? 'var(--primary)' : 'transparent',
              color: activeSpecies === 'eri' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              padding: '0.4rem 0.95rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            Eri Silkworm (Samia)
          </button>
        </div>
      </div>

      {/* Active Batches Indicator on Timeline */}
      {activeBatches.length > 0 && (
        <div className="kalro-card" style={{ padding: '0.85rem 1rem', marginBottom: '1.25rem', background: 'var(--bg-subtle)' }}>
          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.4rem' }}>
            Currently Rearing {activeBatches.length} {activeSpecies === 'bombyx' ? 'Bivoltine Bombyx' : 'Eri'} Batch{activeBatches.length === 1 ? '' : 'es'}:
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            {activeBatches.map((b) => {
              const age = getBatchAgeDays(b);
              const stage = getCurrentStage(b, age);
              return (
                <div
                  key={b.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-card)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                  }}
                >
                  <strong className="truncate">{b.displayTag || b.batchTag}</strong>: Day <span className="tabular-nums">{age}</span> ({stage.name})
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Roadmap Timeline - Border Only, No Shadows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {stages.map((stage, idx) => {
          const matchingBatches = activeBatches.filter((b) => {
            const age = getBatchAgeDays(b);
            return age >= stage.dayStart && age <= stage.dayEnd;
          });

          const isCurrentForAny = matchingBatches.length > 0;

          return (
            <div
              key={idx}
              className="kalro-card"
              style={{
                marginBottom: 0,
                borderLeft: isCurrentForAny
                  ? '5px solid var(--primary)'
                  : stage.isMoult
                  ? '5px solid var(--status-warning)'
                  : stage.isHarvest
                  ? '5px solid var(--accent-gold)'
                  : '5px solid var(--border-card)',
                backgroundColor: isCurrentForAny ? '#F8FBF9' : '#ffffff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                  <div className="stage-milestone-wrapper">
                    <StageMilestoneIcon stageName={stage.name} isMoult={stage.isMoult} isHarvest={stage.isHarvest} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.2rem' }}>
                      <span
                        className="tabular-nums"
                        style={{
                          background: stage.isMoult
                            ? 'var(--status-warning)'
                            : stage.isHarvest
                            ? 'var(--accent-gold)'
                            : 'var(--primary)',
                          color: '#ffffff',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        Day {stage.dayStart}
                        {stage.dayEnd > stage.dayStart ? ` - ${stage.dayEnd}` : ''}
                      </span>

                      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                        {stage.name}
                      </h3>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: '0.35rem 0' }}>
                      {stage.leafRecommendation}
                    </p>
                  </div>
                </div>

                {isCurrentForAny && (
                  <span
                    style={{
                      background: 'var(--status-success)',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    Active Rearing Lot Present
                  </span>
                )}
              </div>

              {/* Climate Targets Bar */}
              <div
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border-divider)',
                  paddingTop: '0.5rem',
                  marginTop: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <span>Ideal Temp: <strong className="tabular-nums">{stage.idealTemp}</strong></span>
                <span>Relative Humidity: <strong className="tabular-nums">{stage.idealHumidity}</strong></span>
                {stage.isMoult && (
                  <span style={{ color: 'var(--status-warning)', fontWeight: 700 }}>
                    Moult Fasting: Strictly withhold feeding until 95% head-capsule ecdysis
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
