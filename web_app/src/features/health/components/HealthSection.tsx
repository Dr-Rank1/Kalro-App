import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { MortalityLog } from '../../../types';
import { DISEASE_LIBRARY } from '../../../constants';

interface HealthSectionProps {
  mortalityLogs: MortalityLog[];
}

export const HealthSection: React.FC<HealthSectionProps> = ({ mortalityLogs }) => {
  const [selectedDiseaseIdx, setSelectedDiseaseIdx] = useState<number>(0);
  const [sopChecked, setSopChecked] = useState<Record<number, boolean>>({
    1: true,
    2: true,
  });

  const totalMortality = mortalityLogs.reduce((sum, m) => sum + m.count, 0);
  const selectedDisease = DISEASE_LIBRARY[selectedDiseaseIdx] || DISEASE_LIBRARY[0];

  return (
    <div className="view-enter-animate" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Quick Health Summary */}
      <div className="farm-stat-grid">
        <div className="farm-stat-card">
          <div className="farm-stat-label">Flock Health Status</div>
          <div className="farm-stat-number" style={{ color: totalMortality > 50 ? 'var(--status-danger)' : 'var(--status-success)' }}>
            {totalMortality > 50 ? 'Monitor Loss' : 'Normal / Vigorous'}
          </div>
          <div className="farm-stat-sub">Based on cumulative loss logs</div>
        </div>

        <div className="farm-stat-card">
          <div className="farm-stat-label">Total Recorded Losses</div>
          <div className="farm-stat-number tabular-nums">
            {totalMortality.toLocaleString()} larvae
          </div>
          <div className="farm-stat-sub">Across all active batches</div>
        </div>

        <div className="farm-stat-card">
          <div className="farm-stat-label">Quarantine Protection</div>
          <div className="farm-stat-number" style={{ color: 'var(--primary)' }}>
            KEPHIS Ready
          </div>
          <div className="farm-stat-sub">Disinfection protocol on standby</div>
        </div>
      </div>

      {/* Interactive Disease Diagnostic Guide */}
      <div className="kalro-card" style={{ marginBottom: 0 }}>
        <h3 className="card-title">Sericulture Disease Diagnostics & Symptom Checker</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0.85rem' }}>
          Select a field symptom or disease to review diagnostic signs, quarantine risk, and required chemical containment.
        </p>

        {/* Quick Symptom Chips */}
        <div style={{ marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
            Quick Symptom Matcher (NSRC Table 4):
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSelectedDiseaseIdx(0)}
              className={`farm-chip-btn min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A] ${selectedDiseaseIdx === 0 ? 'active' : ''}`}
            >
              Milky body, oily skin & falls off bed (Grasserie)
            </button>
            <button
              type="button"
              onClick={() => setSelectedDiseaseIdx(1)}
              className={`farm-chip-btn min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A] ${selectedDiseaseIdx === 1 ? 'active' : ''}`}
            >
              Pepper spots on skin & irregular moult (Pebrine)
            </button>
            <button
              type="button"
              onClick={() => setSelectedDiseaseIdx(2)}
              className={`farm-chip-btn min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A] ${selectedDiseaseIdx === 2 ? 'active' : ''}`}
            >
              Flaccid body, empty gut & vomit fluids (Flacherie)
            </button>
            <button
              type="button"
              onClick={() => setSelectedDiseaseIdx(3)}
              className={`farm-chip-btn min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A] ${selectedDiseaseIdx === 3 ? 'active' : ''}`}
            >
              Limp body then stiff chalk-white cadaver (Muscardine)
            </button>
            <button
              type="button"
              onClick={() => setSelectedDiseaseIdx(4)}
              className={`farm-chip-btn min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A] ${selectedDiseaseIdx === 4 ? 'active' : ''}`}
            >
              Black cuticular necrotic scars (Uzi Fly)
            </button>
          </div>
        </div>

        {/* Selected Disease Details Card */}
        <div className="disease-diagnostic-card collapsible-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {selectedDisease.name}
              </h4>
            </div>
            {selectedDisease.seedLotRisk && (
              <span className="quarantine-pill">KEPHIS Notifiable Risk</span>
            )}
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
            <em>Pathogen:</em> {selectedDisease.pathogen}
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <strong style={{ fontSize: '0.78rem', color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
              Field Symptoms to Look For:
            </strong>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.45 }}>
              {selectedDisease.signs}
            </p>
          </div>

          <div className="disease-action-callout">
            <strong style={{ fontSize: '0.78rem', color: 'var(--primary)', display: 'block', marginBottom: '2px' }}>
              Required Containment & Disinfection:
            </strong>
            <p style={{ fontSize: '0.82rem', margin: 0, lineHeight: 1.45 }}>
              {selectedDisease.action}
            </p>
          </div>
        </div>
      </div>

      {/* KALRO Sericulture Biosecurity & Disinfection SOP (5-Step Protocol) */}
      <div className="kalro-card" style={{ marginBottom: 0 }}>
        <h3 className="card-title">Sericulture Biosecurity & Disinfection SOP Checklist</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0.85rem' }}>
          Mandatory sanitary checklist for every rearing batch to guarantee disease suppression. Click to mark completed.
        </p>

        <div className="farm-sop-checklist">
          {[
            {
              id: 1,
              title: '1. Pre-Rearing Terminal Room Disinfection',
              desc: 'Wash room and trays with water, spray 2% formalin solution (or 0.5% bleaching powder), and seal doors airtight for 24 hours. Aerate thoroughly for 48 hours before brushing.',
            },
            {
              id: 2,
              title: '2. Entrance Footbath & Personal Biosecurity',
              desc: 'Maintain a dry footbath tray of slaked lime and bleaching powder (9:1 ratio) at all rearing room doors. Farm workers must wash hands with soap before touching forage or larvae.',
            },
            {
              id: 3,
              title: '3. Daily Net Bed Cleaning & Waste Separation',
              desc: 'Use nylon mesh nets to lift larvae onto fresh feed. Carefully roll off the bottom net with frass and unconsumed stems. Never sweep dry dust onto feeding beds.',
            },
            {
              id: 4,
              title: '4. Moult Rest Disinfection & Lime Dusting',
              desc: 'When 90% of worms settle for moult, cease feeding completely. Dust the rearing bed with dry slaked lime (100g/m²) or Vijetha/Labex powder to desiccate viral pathogens.',
            },
            {
              id: 5,
              title: '5. Post-Harvest Chandrike & Frame Sterilization',
              desc: 'Expose bamboo mountages to hot sun for 3 consecutive days or use a gas flame burner to incinerate residual cocoon floss and fungal conidiospores.',
            },
          ].map((sop) => {
            const isDone = !!sopChecked[sop.id];
            return (
              <div
                key={sop.id}
                onClick={() => setSopChecked((prev) => ({ ...prev, [sop.id]: !prev[sop.id] }))}
                className={`farm-sop-item ${isDone ? 'done' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => {}}
                  className="farm-sop-checkbox"
                />
                <div className="farm-sop-text">
                  <div className="farm-sop-title">
                    {sop.title}
                    {isDone && (
                      <span style={{ color: 'var(--status-success)', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={12} /> Completed
                      </span>
                    )}
                  </div>
                  <p className="farm-sop-desc">{sop.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* NSRC Moulting & Bed Cleaning Operating Protocols */}
      <div className="kalro-card" style={{ marginBottom: 0 }}>
        <h3 className="card-title">NSRC Moulting & Bed Cleaning Operating Protocols</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0.85rem' }}>
          Standard operating procedures for managing larval skin shedding and bed hygiene (A Manual Guide for Sericulture in Kenya).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.95rem' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
              Signs of Entering Moult (Feeding Ceases)
            </strong>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              <li>Silkworms completely stop feeding and cease moving.</li>
              <li>Heads swell noticeably compared to body segments.</li>
              <li>Silkworms elevate their heads upwards in a rigid posture.</li>
              <li>Duration: 18–24 hours in Instars 1–3; up to 48 hours in Instar 4.</li>
              <li><strong>Bed Care:</strong> Keep bed completely dry and uncovered. Apply agricultural lime (slaked lime powder) to absorb humidity and suppress viral infections.</li>
            </ul>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.95rem' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
              Indicators of Getting Out of Moult (Resume Feeding)
            </strong>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              <li>Shed head capsules and loose skin visible on the rearing bed.</li>
              <li>Worms become active and start crawling searching for forage.</li>
              <li>Mouth parts become visibly broader and integument appears dull.</li>
              <li>Resume feeding only when 95%+ of worms have emerged from moult.</li>
            </ul>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.95rem' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
              Bed Cleaning & Waste Disposal Protocol
            </strong>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              <li><strong>Purpose:</strong> Remove frass (faecal matter), dead worms, and leaf remnants that promote fungal/bacterial growth.</li>
              <li><strong>Frequency:</strong> After every moult for young instars (1st–3rd); every other day for late instars (4th–5th).</li>
              <li><strong>Mesh Net Technique:</strong> Spread nylon mesh net over silkworms; add and spread fresh leaves on top. Worms crawl through net onto leaves within 1–2 hours. Transfer net to clean bed.</li>
              <li><strong>Sanitation:</strong> All bed frass and leaf waste must be immediately buried or discarded in an enclosed compost pit.</li>
            </ul>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.95rem' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
              Silkworm Pests & Protection (Ants & Rats)
            </strong>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              <li><strong>Ants:</strong> Highly destructive predators attacking young chawki and immobile moulting worms. Construct a shallow water perimeter trench around the cemented rearing room floor, or place rearing rack legs in water ant wells.</li>
              <li><strong>Rats & Rodents:</strong> Attack spinning larvae, pupae, and stored cocoons. Install 20-mesh wire screens on all doors/windows and fit metallic kick plates on door bases.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
