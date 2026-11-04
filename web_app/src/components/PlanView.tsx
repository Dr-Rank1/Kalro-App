import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Language, TRANSLATIONS } from '../translations';
import { BOMBYX_STAGES, ERI_STAGES } from '../constants';
import { Batch, MilestoneStage, Species } from '../types';
import { getCurrentStage, getBatchAgeDays } from '../utils';

interface PlanViewProps {
  batches: Batch[];
  lang: Language;
}

export const PlanView: React.FC<PlanViewProps> = ({ batches, lang }) => {
  const t = TRANSLATIONS[lang];
  const [activeSpecies, setActiveSpecies] = useState<Species>('bombyx');

  const stages: MilestoneStage[] = activeSpecies === 'bombyx' ? BOMBYX_STAGES : ERI_STAGES;
  const activeBatches = batches.filter((b) => b.status === 'active' && b.species === activeSpecies);

  return (
    <div>
      <div className="card-header-flex" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            {t.navPlan} — Sericulture Lifecycle Calendar
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            40-day Bombyx and 39-day Eri biological roadmap, instar schedules, moult rest periods, and climate targets.
          </p>
        </div>

        {/* Species Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--card-white)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
          <button
            onClick={() => setActiveSpecies('bombyx')}
            style={{
              background: activeSpecies === 'bombyx' ? 'var(--primary-green)' : 'none',
              color: activeSpecies === 'bombyx' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              padding: '0.45rem 1rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t.bombyxLabel}
          </button>
          <button
            onClick={() => setActiveSpecies('eri')}
            style={{
              background: activeSpecies === 'eri' ? 'var(--primary-green)' : 'none',
              color: activeSpecies === 'eri' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              padding: '0.45rem 1rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t.eriLabel}
          </button>
        </div>
      </div>

      {/* Active Batches Indicator on Timeline */}
      {activeBatches.length > 0 && (
        <div className="kalro-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: 'rgba(33, 70, 65, 0.04)' }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary-green)', marginBottom: '0.5rem' }}>
            Currently Rearing {activeBatches.length} {activeSpecies === 'bombyx' ? 'Bombyx' : 'Eri'} Batch(es):
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {activeBatches.map((b) => {
              const age = getBatchAgeDays(b);
              const stage = getCurrentStage(b, age);
              return (
                <div
                  key={b.id}
                  style={{
                    background: 'var(--card-white)',
                    border: '1px solid var(--primary-green)',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Clock size={14} color="var(--primary-green)" />
                  <strong>{b.displayTag || b.batchTag}</strong>: Day {age} ({stage.name})
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Roadmap Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {stages.map((stage, idx) => {
          // Check if any active batch is on this stage
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
                  ? '6px solid var(--leaf)'
                  : stage.isMoult
                  ? '6px solid var(--rest)'
                  : stage.isHarvest
                  ? '6px solid var(--accent-gold)'
                  : '6px solid var(--card-border)',
                background: isCurrentForAny ? 'rgba(61, 122, 84, 0.05)' : 'var(--card-white)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
                    <span
                      style={{
                        background: stage.isMoult
                          ? 'var(--rest)'
                          : stage.isHarvest
                          ? 'var(--accent-gold)'
                          : 'var(--primary-green)',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      Day {stage.dayStart}
                      {stage.dayEnd > stage.dayStart ? ` - ${stage.dayEnd}` : ''}
                    </span>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                      {stage.name}
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      ({stage.swahiliName})
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)', margin: '0.4rem 0 0.6rem' }}>
                    {stage.leafRecommendation}
                  </p>
                </div>

                {isCurrentForAny && (
                  <span
                    style={{
                      background: 'var(--success)',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.3rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <CheckCircle2 size={14} /> Active Batch Here
                  </span>
                )}
              </div>

              {/* Climate Targets Bar */}
              <div
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--divider)',
                  paddingTop: '0.65rem',
                  marginTop: '0.5rem',
                }}
              >
                <span>Ideal Temperature: <strong>{stage.idealTemp}</strong></span>
                <span>Ideal Relative Humidity: <strong>{stage.idealHumidity}</strong></span>
                {stage.isMoult && (
                  <span style={{ color: 'var(--rest)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={13} /> Moult Rest: Stop Feeding Completely
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
