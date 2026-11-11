import React, { useState } from 'react';
import { BOMBYX_STAGES, ERI_STAGES } from '../constants';
import { Batch, MilestoneStage, Species } from '../types';
import { getCurrentStage, getBatchAgeDays } from '../utils';

interface PlanViewProps {
  batches: Batch[];
}

interface SimplifiedPhase {
  id: string;
  phaseNumber: number;
  name: string;
  swahiliName: string;
  days: string;
  dayStart: number;
  dayEnd: number;
  action: string;
  temp: string;
  humidity: string;
  feeding: string;
  keyNote?: string;
}

const BOMBYX_5_PHASES: SimplifiedPhase[] = [
  {
    id: 'incubation',
    phaseNumber: 1,
    name: 'Egg Incubation & Black Boxing',
    swahiliName: 'Uangusaji Mayai',
    days: 'Day 0',
    dayStart: 0,
    dayEnd: 0,
    action: 'Keep eggs in dark incubation box at 25°C. Expose to light on Day 10 for uniform 95%+ hatch.',
    temp: '25°C',
    humidity: '80% RH',
    feeding: 'No feed',
  },
  {
    id: 'chawki',
    phaseNumber: 2,
    name: 'Young Worms (Chawki · Instars 1 & 2)',
    swahiliName: 'Kiwavi Kidogo (Hatua 1 & 2)',
    days: 'Days 1–8',
    dayStart: 1,
    dayEnd: 8,
    action: 'Feed tender chopped mulberry ribbons 3× daily under paraffin tent. Stop feeding completely during 1st and 2nd moult rests.',
    temp: '26–28°C',
    humidity: '80–85% RH',
    feeding: '3 feeds/day (chopped)',
    keyNote: 'Includes 1st & 2nd moults',
  },
  {
    id: 'late',
    phaseNumber: 3,
    name: 'Late Growth (Instars 3, 4 & 5)',
    swahiliName: 'Kiwavi Kikubwa (Hatua 3, 4 & 5)',
    days: 'Days 9–28',
    dayStart: 9,
    dayEnd: 28,
    action: 'Switch to whole leafy shoots on rearing racks. Appetite peaks in 5th instar—feed whole fresh branches 3–4× daily.',
    temp: '24–25°C',
    humidity: '70% RH',
    feeding: '3–4 feeds/day (shoots)',
    keyNote: 'Consumes 85% of total leaf',
  },
  {
    id: 'spinning',
    phaseNumber: 4,
    name: 'Mounting & Silk Spinning',
    swahiliName: 'Kupandisha kwenye Chandrike',
    days: 'Days 29–34',
    dayStart: 29,
    dayEnd: 34,
    action: 'Transfer ripe amber-translucent worms to Chandrike mountages (45 worms/ft²). Keep room dim and airy while they spin.',
    temp: '24°C',
    humidity: '60–65% RH',
    feeding: 'No feed (spinning)',
  },
  {
    id: 'harvest',
    phaseNumber: 5,
    name: 'Cocoon Harvest & Sorting',
    swahiliName: 'Uvunaji wa Vifukofuko',
    days: 'Days 35–40',
    dayStart: 35,
    dayEnd: 40,
    action: 'Harvest firm cocoons 7–8 days post-spinning. Remove loose floss silk, sort defective shells, and record lot weight.',
    temp: '24°C',
    humidity: 'Dry room',
    feeding: 'Harvest & sort',
  },
];

const ERI_5_PHASES: SimplifiedPhase[] = [
  {
    id: 'incubation',
    phaseNumber: 1,
    name: 'Eri Egg Incubation',
    swahiliName: 'Uangusaji Mayai ya Eri',
    days: 'Day 0',
    dayStart: 0,
    dayEnd: 0,
    action: 'Incubate eggs at 26°C and 80% RH. Prepare fresh tender castor forage for hatching.',
    temp: '26°C',
    humidity: '80% RH',
    feeding: 'No feed',
  },
  {
    id: 'chawki',
    phaseNumber: 2,
    name: 'Young Eri (Instars 1 & 2)',
    swahiliName: 'Eri Hatua ya 1 & 2',
    days: 'Days 1–8',
    dayStart: 1,
    dayEnd: 8,
    action: 'Feed clean tender castor leaves 3× daily. Day 1 morning feed lightly, then full feeding.',
    temp: '26–28°C',
    humidity: '75–80% RH',
    feeding: '3 feeds/day (tender castor)',
  },
  {
    id: 'late',
    phaseNumber: 3,
    name: 'Late Growth (Instars 3, 4 & 5)',
    swahiliName: 'Eri Hatua ya 3, 4 & 5',
    days: 'Days 9–27',
    dayStart: 9,
    dayEnd: 27,
    action: 'Feed mature leafy castor or kesseru branches 3–4× daily. Ensure strong ventilation to avoid bacterial wilt.',
    temp: '23–25°C',
    humidity: '65–70% RH',
    feeding: '3–4 feeds/day (castor branches)',
  },
  {
    id: 'spinning',
    phaseNumber: 4,
    name: 'Eri Spinning & Cocooning',
    swahiliName: 'Kusuka Vifuko vya Eri',
    days: 'Days 28–33',
    dayStart: 28,
    dayEnd: 33,
    action: 'Provide dry mango leaves or bamboo frames. Caterpillars spin open-ended cocoons.',
    temp: '24°C',
    humidity: '60% RH',
    feeding: 'No feed (spinning)',
  },
  {
    id: 'harvest',
    phaseNumber: 5,
    name: 'Open-End Cocoon Harvest',
    swahiliName: 'Uvunaji wa Vifuko vya Eri',
    days: 'Days 34–39',
    dayStart: 34,
    dayEnd: 39,
    action: 'Harvest mature open-ended cocoons. Moths emerge naturally without cutting silk filaments.',
    temp: '24°C',
    humidity: 'Dry room',
    feeding: 'Harvest & card',
  },
];

function getDetailedStageShortAction(stage: MilestoneStage): string {
  const name = stage.name.toLowerCase();
  if (name.includes('incubation')) return 'Incubate in dark box at 25°C. Expose to morning light on day 10.';
  if (stage.isMoult) return 'Strict moult fasting: Stop feeding. Keep bed dry and dust slaked lime.';
  if (stage.isHarvest) return 'Harvest mature cocoons on day 7–8 post-spinning. Defloss and sort defects.';
  if (name.includes('spin') || name.includes('mount')) return 'Place ripe worms on Chandrike mountages (45/ft²). Keep room dim and airy.';
  if (stage.instarNumber === 1) return 'Feed tender chopped leaf (0.5 cm) 3× daily under paraffin tent.';
  if (stage.instarNumber === 2) return 'Feed chopped leaf (1.5 cm) 3× daily. Double bed area.';
  if (stage.instarNumber === 3) return 'Feed whole leaves 3× daily. Clean bed with mesh nets.';
  if (stage.instarNumber === 4) return 'Begin shoot feeding: whole branches across racks. 3 feeds daily.';
  return 'Peak voracious feeding: feed whole mature shoots 3–4× daily.';
}

export const PlanView: React.FC<PlanViewProps> = ({ batches }) => {
  const [activeSpecies, setActiveSpecies] = useState<Species>('bombyx');
  const [viewMode, setViewMode] = useState<'phases' | 'detailed'>('phases');

  const activeBatches = batches.filter((b) => b.status === 'active' && b.species === activeSpecies);
  const phases = activeSpecies === 'bombyx' ? BOMBYX_5_PHASES : ERI_5_PHASES;
  const detailedStages = activeSpecies === 'bombyx' ? BOMBYX_STAGES : ERI_STAGES;

  return (
    <div className="roadmap-container">
      {/* Clean Top Header */}
      <div className="card-header-flex" style={{ alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Lifecycle Roadmap
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
            {activeSpecies === 'bombyx'
              ? '40-day Bivoltine Mulberry silkworm rearing cycle.'
              : '39-day Polyphagous Eri silkworm rearing cycle.'}
          </p>
        </div>

        {/* Quiet Controls: Species Toggle + Mode Toggle */}
        <div className="roadmap-view-controls">
          {/* Species Selector */}
          <div className="roadmap-toggle-group">
            <button
              type="button"
              className={`roadmap-toggle-btn ${activeSpecies === 'bombyx' ? 'active' : ''}`}
              onClick={() => setActiveSpecies('bombyx')}
            >
              Bombyx (Mulberry)
            </button>
            <button
              type="button"
              className={`roadmap-toggle-btn ${activeSpecies === 'eri' ? 'active' : ''}`}
              onClick={() => setActiveSpecies('eri')}
            >
              Eri (Castor)
            </button>
          </div>

          {/* View Mode Toggle: 5 Phases vs All Days */}
          <div className="roadmap-toggle-group">
            <button
              type="button"
              className={`roadmap-toggle-btn ${viewMode === 'phases' ? 'active' : ''}`}
              onClick={() => setViewMode('phases')}
            >
              5 Phases
            </button>
            <button
              type="button"
              className={`roadmap-toggle-btn ${viewMode === 'detailed' ? 'active' : ''}`}
              onClick={() => setViewMode('detailed')}
            >
              All Days ({detailedStages.length})
            </button>
          </div>
        </div>
      </div>

      {/* Active Batch Banner (Clean and Compact) */}
      {activeBatches.length > 0 && (
        <div className="roadmap-active-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>● Active:</span>
            {activeBatches.map((b) => {
              const age = getBatchAgeDays(b);
              const currentStage = getCurrentStage(b, age);
              return (
                <span key={b.id} style={{ color: 'var(--text-main)' }}>
                  <strong>{b.displayTag || b.batchTag || 'Batch'}</strong> is on{' '}
                  <span className="tabular-nums font-semibold">Day {age}</span> ({currentStage.name})
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* View Mode 1: 5 Clean Phases (Default Minimalist View) */}
      {viewMode === 'phases' ? (
        <div className="roadmap-simple-list">
          {phases.map((phase) => {
            const hasActiveBatch = activeBatches.some((b) => {
              const age = getBatchAgeDays(b);
              return age >= phase.dayStart && age <= phase.dayEnd;
            });

            return (
              <div
                key={phase.id}
                className={`roadmap-simple-card ${hasActiveBatch ? 'active-lot' : ''}`}
              >
                <div className="roadmap-simple-body">
                  <div className="roadmap-simple-header">
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="roadmap-day-pill">{phase.days}</span>
                      <h3 className="roadmap-simple-title">
                        Phase {phase.phaseNumber}: {phase.name}
                      </h3>
                    </div>

                    {hasActiveBatch && (
                      <span
                        style={{
                          backgroundColor: 'var(--primary)',
                          color: '#ffffff',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        ● Active Here
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {phase.swahiliName}
                  </div>

                  <p className="roadmap-simple-action">{phase.action}</p>

                  {/* Clean Meta Chips */}
                  <div className="roadmap-simple-meta">
                    <span className="roadmap-chip">
                      🌡️ <strong>{phase.temp}</strong>
                    </span>
                    <span className="roadmap-chip">
                      💧 <strong>{phase.humidity}</strong>
                    </span>
                    <span className="roadmap-chip">
                      🍃 <strong>{phase.feeding}</strong>
                    </span>
                    {phase.keyNote && (
                      <span className="roadmap-chip alert">
                        ⚠️ {phase.keyNote}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* View Mode 2: Detailed All-Days View */
        <div className="roadmap-simple-list">
          {detailedStages.map((stage, idx) => {
            const shortAction = getDetailedStageShortAction(stage);

            const isBatchHere = activeBatches.some((b) => {
              const age = getBatchAgeDays(b);
              return age >= stage.dayStart && age <= stage.dayEnd;
            });

            return (
              <div
                key={idx}
                className={`roadmap-simple-card ${isBatchHere ? 'active-lot' : ''} ${
                  stage.isMoult ? 'is-moult' : stage.isHarvest ? 'is-harvest' : ''
                }`}
              >
                <div className="roadmap-simple-body">
                  <div className="roadmap-simple-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <span
                        className={`roadmap-day-pill ${
                          stage.isMoult ? 'moult' : stage.isHarvest ? 'harvest' : ''
                        }`}
                      >
                        {stage.dayStart === stage.dayEnd
                          ? `Day ${stage.dayStart}`
                          : `Days ${stage.dayStart}–${stage.dayEnd}`}
                        {stage.isMoult ? ' · Rest' : ''}
                      </span>

                      <h3 className="roadmap-simple-title">{stage.name}</h3>
                    </div>

                    {isBatchHere && (
                      <span
                        style={{
                          backgroundColor: 'var(--primary)',
                          color: '#ffffff',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        ● Current Stage
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {stage.swahiliName}
                  </div>

                  <p className="roadmap-simple-action">{shortAction}</p>

                  {/* Clean Meta Chips */}
                  <div className="roadmap-simple-meta">
                    <span className="roadmap-chip">
                      🌡️ <strong>{stage.idealTemp}</strong>
                    </span>
                    <span className="roadmap-chip">
                      💧 <strong>{stage.idealHumidity}</strong>
                    </span>
                    {stage.isMoult ? (
                      <span className="roadmap-chip alert">
                        🛑 <strong>Moult Fasting (Zero Feed)</strong>
                      </span>
                    ) : (
                      <span className="roadmap-chip">
                        🍃{' '}
                        <strong>
                          {stage.instarNumber ? `${stage.instarNumber <= 2 ? 'Chopped Leaf' : 'Shoots'}` : 'Care'}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
