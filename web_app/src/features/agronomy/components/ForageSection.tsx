import React, { useState } from 'react';
import { LeafInventory, LeafMovement, LeafType } from '../../../types';
import {
  KENYA_MULBERRY_CULTIVARS,
  KENYA_CASTOR_VARIETIES,
  MULBERRY_EVALUATION_ACCESSIONS_COUNT,
} from '../../../constants';

interface ForageSectionProps {
  inventory: LeafInventory;
  onAddLeafMovement: (movement: LeafMovement) => void;
}

export const ForageSection: React.FC<ForageSectionProps> = ({
  inventory,
  onAddLeafMovement,
}) => {
  const [showAddLeaf, setShowAddLeaf] = useState<boolean>(false);
  const [leafType, setLeafType] = useState<LeafType>('mulberry');
  const [leafQty, setLeafQty] = useState<number | ''>('');
  const [leafReason, setLeafReason] = useState<string>('');

  // Feed & Bed Spacing Budget Calculator State
  const [budgetSpecies, setBudgetSpecies] = useState<'bombyx' | 'eri'>('bombyx');
  const [budgetLarvae, setBudgetLarvae] = useState<number>(20000);

  const handleAddLeaf = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(leafQty);
    if (!qty || qty <= 0) return;

    onAddLeafMovement({
      id: `lm-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      leafType,
      quantityKg: qty,
      direction: 'inflow',
      reason: leafReason.trim() || 'Farm harvest addition',
    });
    setLeafQty('');
    setLeafReason('');
    setShowAddLeaf(false);
  };

  // Feed Calculator Computations
  const batchRatio = Math.max(1000, budgetLarvae) / 20000;
  const totalForageBudgetKg = Math.round(budgetSpecies === 'bombyx' ? batchRatio * 450 : batchRatio * 360);
  const peakBedSpaceM2 = Math.round((budgetSpecies === 'bombyx' ? batchRatio * 36 : batchRatio * 32) * 10) / 10;
  const peakBedSpaceSqFt = Math.round(peakBedSpaceM2 * 10.764);
  const mountagesRequired = Math.ceil(budgetLarvae / (budgetSpecies === 'bombyx' ? 450 : 400));

  const instarFeedBreakdown = budgetSpecies === 'bombyx' ? [
    { instar: '1st Instar (Chawki)', share: '0.5%', leafKg: Math.round(totalForageBudgetKg * 0.005 * 10) / 10, spaceM2: Math.round(batchRatio * 1.5 * 10) / 10, cut: '0.5 cm tender ribbons (3rd-4th top leaf)', freq: '3× daily under paraffin tent' },
    { instar: '2nd Instar (Chawki)', share: '1.5%', leafKg: Math.round(totalForageBudgetKg * 0.015 * 10) / 10, spaceM2: Math.round(batchRatio * 4.5 * 10) / 10, cut: '1.5 cm semi-tender leaf pieces', freq: '3× daily' },
    { instar: '3rd Instar', share: '5.5%', leafKg: Math.round(totalForageBudgetKg * 0.055), spaceM2: Math.round(batchRatio * 10.0 * 10) / 10, cut: 'Whole mature fresh leaves', freq: '3× daily on net beds' },
    { instar: '4th Instar', share: '15.5%', leafKg: Math.round(totalForageBudgetKg * 0.155), spaceM2: Math.round(batchRatio * 18.0 * 10) / 10, cut: 'Whole leafy shoots (50-60 cm branches)', freq: '3-4× daily across racks' },
    { instar: '5th Instar (Voracious)', share: '77.0%', leafKg: Math.round(totalForageBudgetKg * 0.770), spaceM2: Math.round(batchRatio * 36.0 * 10) / 10, cut: 'Full mature leafy branches', freq: '4× daily (heavy peak consumption)' },
  ] : [
    { instar: '1st Instar (Eri)', share: '1.0%', leafKg: Math.round(totalForageBudgetKg * 0.01 * 10) / 10, spaceM2: Math.round(batchRatio * 1.5 * 10) / 10, cut: 'Tender non-wilted chopped castor/kesseru', freq: '3× daily' },
    { instar: '2nd Instar (Eri)', share: '2.5%', leafKg: Math.round(totalForageBudgetKg * 0.025 * 10) / 10, spaceM2: Math.round(batchRatio * 4.0 * 10) / 10, cut: 'Medium size clean castor leaves', freq: '3× daily' },
    { instar: '3rd Instar (Eri)', share: '6.5%', leafKg: Math.round(totalForageBudgetKg * 0.065), spaceM2: Math.round(batchRatio * 8.0 * 10) / 10, cut: 'Large clean castor leaves', freq: '3× daily' },
    { instar: '4th Instar (Eri)', share: '18.0%', leafKg: Math.round(totalForageBudgetKg * 0.180), spaceM2: Math.round(batchRatio * 16.0 * 10) / 10, cut: 'Mature castor leaves with petiole', freq: '3-4× daily' },
    { instar: '5th Instar (Eri Heavy)', share: '72.0%', leafKg: Math.round(totalForageBudgetKg * 0.720), spaceM2: Math.round(batchRatio * 32.0 * 10) / 10, cut: 'Full mature castor foliage or bunches', freq: '4× daily' },
  ];

  return (
    <div className="view-enter-animate" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Forage Stock Summary Cards */}
      <div className="farm-stat-grid">
        <div className="farm-stat-card">
          <div className="farm-stat-label">Mulberry Stock (Bombyx)</div>
          <div className="farm-stat-number tabular-nums">{inventory.mulberryKg.toFixed(1)} kg</div>
          <div className="farm-stat-sub">11 Characterized Varieties (V1, Thika, Embu...)</div>
        </div>

        <div className="farm-stat-card">
          <div className="farm-stat-label">Castor Stock (Eri)</div>
          <div className="farm-stat-number tabular-nums">{inventory.castorKg.toFixed(1)} kg</div>
          <div className="farm-stat-sub">7 Characterized Cultivars (NUU 70, KC6...)</div>
        </div>

        <div className="farm-stat-card">
          <div className="farm-stat-label">Kesseru Stand (Eri)</div>
          <div className="farm-stat-number tabular-nums">{inventory.kesseruKg.toFixed(1)} kg</div>
          <div className="farm-stat-sub">Drought-hardy perennial hedge</div>
        </div>
      </div>

      {/* Feed & Bed Spacing Budget Calculator */}
      <div className="farm-calc-card">
        <div className="farm-calc-header">
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>
              Interactive Forage Budget & Bed Space Calculator
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>
              Calculates total fresh shoots, peak rearing area, and mountages according to KALRO sericulture agronomy models.
            </p>
          </div>

          {/* Species Toggle */}
          <div className="roadmap-toggle-group">
            <button
              type="button"
              onClick={() => setBudgetSpecies('bombyx')}
              className={`roadmap-toggle-btn min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A] ${budgetSpecies === 'bombyx' ? 'active' : ''}`}
            >
              Bombyx (Mulberry)
            </button>
            <button
              type="button"
              onClick={() => setBudgetSpecies('eri')}
              className={`roadmap-toggle-btn min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A] ${budgetSpecies === 'eri' ? 'active' : ''}`}
            >
              Eri (Castor)
            </button>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="farm-calc-inputs-grid">
          <div>
            <label className="form-label">Batch Size (Larvae Count)</label>
            <input
              type="number"
              value={budgetLarvae}
              onChange={(e) => setBudgetLarvae(Math.max(500, Number(e.target.value) || 0))}
              className="form-control tabular-nums"
              placeholder="Enter larvae count (e.g. 20000)"
              step="1000"
              min="500"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Agronomy Rule of Thumb:</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
              {budgetSpecies === 'bombyx'
                ? '1 DFL Box (20,000 larvae) requires 400–450 kg fresh shoots; 85% is consumed during the 5th instar.'
                : '1 Eri Box requires ~360 kg fresh clean castor leaves; larvae grow up to 8 cm and spin open-ended cocoons.'}
            </span>
          </div>
        </div>

        {/* Live Calculated Metric Results */}
        <div className="farm-calc-results-grid">
          <div className="farm-calc-result-box highlight">
            <span className="farm-calc-result-lbl">Total Forage Needed</span>
            <span className="farm-calc-result-val tabular-nums">{totalForageBudgetKg.toLocaleString()} kg</span>
            <span className="farm-calc-result-sub">{budgetSpecies === 'bombyx' ? 'Fresh mulberry shoots' : 'Fresh clean castor'}</span>
          </div>

          <div className="farm-calc-result-box">
            <span className="farm-calc-result-lbl">Peak Bed Space</span>
            <span className="farm-calc-result-val tabular-nums">{peakBedSpaceM2} m²</span>
            <span className="farm-calc-result-sub">{peakBedSpaceSqFt} sq ft at 5th instar</span>
          </div>

          <div className="farm-calc-result-box">
            <span className="farm-calc-result-lbl">Mountages Required</span>
            <span className="farm-calc-result-val tabular-nums">{mountagesRequired} frames</span>
            <span className="farm-calc-result-sub">Chandrike / folding frames</span>
          </div>

          <div className="farm-calc-result-box">
            <span className="farm-calc-result-lbl">Feeding Window</span>
            <span className="farm-calc-result-val tabular-nums">26–28 Days</span>
            <span className="farm-calc-result-sub">Total active feeding duration</span>
          </div>
        </div>

        {/* Instar-by-Instar Stage Budget Table */}
        <div style={{ marginTop: '0.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-main)' }}>
            Instar-by-Instar Feed Allocation & Bed Expansion Schedule
          </h4>
          <div className="kalro-table-wrap">
            <table className="kalro-table">
              <thead>
                <tr>
                  <th>Growth Stage</th>
                  <th>Share</th>
                  <th>Leaf (kg)</th>
                  <th>Bed Area</th>
                  <th>Leaf Preparation & Cutting Style</th>
                  <th>Feeding Frequency</th>
                </tr>
              </thead>
              <tbody>
                {instarFeedBreakdown.map((row, idx) => (
                  <tr key={idx}>
                    <td><strong>{row.instar}</strong></td>
                    <td className="tabular-nums">{row.share}</td>
                    <td className="tabular-nums"><strong>{row.leafKg} kg</strong></td>
                    <td className="tabular-nums">{row.spaceM2} m²</td>
                    <td>{row.cut}</td>
                    <td>{row.freq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Characterized Mulberry Cultivars (NSRC Thika) */}
      <div className="kalro-card" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>Characterized Mulberry Varieties (NSRC Thika)</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Characterized accessions adopted for Kenya sericulture commercial adoption and research trials.
            </p>
          </div>
          <span className="roadmap-day-pill" style={{ backgroundColor: 'var(--primary)', color: '#ffffff' }}>
            +{MULBERRY_EVALUATION_ACCESSIONS_COUNT} Accessions in Evaluation
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
          {KENYA_MULBERRY_CULTIVARS.map((cultivar) => (
            <div
              key={cultivar.code}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-silk)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                <strong style={{ fontSize: '0.88rem', color: 'var(--primary)' }}>
                  {cultivar.name}
                </strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {cultivar.harvestTiming}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '4px', fontWeight: 500 }}>
                {cultivar.leafQuality}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {cultivar.notes}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Characterized Castor Varieties (Samia ricini Eri Host) */}
      <div className="kalro-card" style={{ marginBottom: 0 }}>
        <h3 className="card-title">Characterized Castor Varieties (Eri Silkworm Host)</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0.75rem' }}>
          Screened Ricinus communis selections providing high palatability and survival for Samia ricini rearing.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {KENYA_CASTOR_VARIETIES.map((cv) => (
            <div
              key={cv.code}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-silk)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                <strong style={{ fontSize: '0.88rem', color: 'var(--primary)' }}>
                  {cv.name}
                </strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {cv.foliageYield}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '3px', fontWeight: 500 }}>
                {cv.use}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {cv.notes}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Station Genebanks & Research Blocks */}
      <div className="kalro-card" style={{ marginBottom: 0 }}>
        <h3 className="card-title">Genebank & Research Block Infrastructure</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0.75rem' }}>
          Official station germplasm repositories, irrigation blocks, and clonal evaluation stands at NSRC Thika.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
              Centre Genebank (Core Germplasm)
            </strong>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              <li>Ex-Embu Mulberry (Drought-hardy)</li>
              <li>Ex-Thika Mulberry (Station accession)</li>
              <li>Ex-Limuru Mulberry (Highland cold-tolerant)</li>
              <li>Ex-Ithanga Mulberry (Sub-humid adapted)</li>
            </ul>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
              Station Genebanks
            </strong>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              <li>Old Genebank (Foundational germplasm)</li>
              <li>New Genebank (98 accessions in evaluation)</li>
              <li>Highway Farm (Commercial multiplication)</li>
            </ul>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
              Research & Trial Blocks
            </strong>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              <li>1. Collections & 2. Irrigated Drip Stand</li>
              <li>3. Selections & 4. Non-Irrigated Rainfed</li>
              <li>5. Cross Selections & 6. Line Selections</li>
            </ul>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-silk)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
              Production Field Blocks
            </strong>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              <li>Blocks C2, C3, C4 (Mulberry shoots)</li>
              <li>Blocks D1, D2, D3, D4 (Castor & Mulberry)</li>
              <li>Highway Farm Demonstration Stand</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Leaf Harvest Action */}
      <div className="kalro-card" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 className="card-title">Forage Harvest Addition</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Log fresh shoots harvested from farm plots into storage.
            </p>
          </div>

          <button
            type="button"
            className="btn-primary min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
            onClick={() => setShowAddLeaf(!showAddLeaf)}
          >
            {showAddLeaf ? 'Cancel' : '+ Add Leaf Harvest'}
          </button>
        </div>

        {/* Expandable Leaf Form */}
        {showAddLeaf && (
          <form onSubmit={handleAddLeaf} className="farm-inline-form collapsible-content">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Forage Variety</label>
                <select
                  value={leafType}
                  onChange={(e) => setLeafType(e.target.value as LeafType)}
                  className="form-control"
                >
                  <option value="mulberry">Mulberry (Characterized Morus alba)</option>
                  <option value="castor">Castor (NUU 70 / KC / KMC8)</option>
                  <option value="kesseru">Kesseru (Heteropanax)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Quantity Harvested (kg)</label>
                <input
                  type="number"
                  value={leafQty}
                  onChange={(e) => setLeafQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="form-control tabular-nums"
                  placeholder="e.g. 25"
                  step="any"
                  min="0.1"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Plot / Source Block</label>
                <input
                  type="text"
                  value={leafReason}
                  onChange={(e) => setLeafReason(e.target.value)}
                  className="form-control"
                  placeholder="e.g. Block C3 (V1) or Centre Genebank"
                />
              </div>
            </div>

            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-accent min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]">
                Save to Stock
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
