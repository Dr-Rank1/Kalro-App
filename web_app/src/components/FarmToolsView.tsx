import React, { useState } from 'react';
import {
  Batch,
  FeedLog,
  MortalityLog,
  CocoonHarvest,
  LeafInventory,
  LeafMovement,
  PaymentRecord,
  LeafType,
} from '../types';
import { DISEASE_LIBRARY } from '../constants';
import {
  formatCurrency,
  formatDate,
  computeCocoonMetrics,
} from '../utils';

interface FarmToolsViewProps {
  batches: Batch[];
  feedLogs: FeedLog[];
  mortalityLogs: MortalityLog[];
  harvests: CocoonHarvest[];
  inventory: LeafInventory;
  leafMovements: LeafMovement[];
  payments: PaymentRecord[];
  onAddFeedLog: (log: FeedLog) => void;
  onAddMortalityLog: (log: MortalityLog) => void;
  onAddHarvest: (harvest: CocoonHarvest) => void;
  onAddLeafMovement: (movement: LeafMovement) => void;
  onAddPayment: (payment: PaymentRecord) => void;
  onExportCsv: () => void;
  onExportBackup: () => void;
  onOpenReportModal: () => void;
}

type ToolTab = 'feeding' | 'health' | 'harvest' | 'leaf' | 'finance' | 'reports';

export const FarmToolsView: React.FC<FarmToolsViewProps> = ({
  batches,
  feedLogs,
  mortalityLogs,
  harvests,
  inventory,
  leafMovements,
  payments,
  onAddLeafMovement,
  onAddPayment,
  onExportCsv,
  onExportBackup,
  onOpenReportModal,
}) => {
  const [activeTab, setActiveTab] = useState<ToolTab>('feeding');

  // Disease selector state
  const [selectedDiseaseIndex, setSelectedDiseaseIndex] = useState<number>(0);

  // New leaf stock form state - Clean empty defaults
  const [leafType, setLeafType] = useState<LeafType>('mulberry');
  const [leafQty, setLeafQty] = useState<number | ''>('');
  const [leafReason, setLeafReason] = useState<string>('');

  // New payment form state - Clean empty defaults
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payParty, setPayParty] = useState<string>('');
  const [payCat, setPayCat] = useState<'cocoon_sale' | 'egg_purchase' | 'leaf_purchase' | 'equipment' | 'other'>('cocoon_sale');
  const [payDir, setPayDir] = useState<'inflow' | 'outflow'>('inflow');
  const [payNotes, setPayNotes] = useState<string>('');

  const selectedDisease = DISEASE_LIBRARY[selectedDiseaseIndex];

  // Finance summary
  const totalInflow = payments
    .filter((p) => p.direction === 'inflow')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOutflow = payments
    .filter((p) => p.direction === 'outflow')
    .reduce((sum, p) => sum + p.amount, 0);
  const netIncome = totalInflow - totalOutflow;

  const handleAddLeaf = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(leafQty);
    if (!qty || qty <= 0) {
      alert('Please enter a valid leaf harvest quantity in kg.');
      return;
    }
    onAddLeafMovement({
      id: `lm-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      leafType,
      quantityKg: qty,
      direction: 'inflow',
      reason: leafReason.trim() || 'Station forage harvest',
    });
    setLeafQty('');
    setLeafReason('');
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid transaction amount in KES.');
      return;
    }
    if (!payParty.trim()) {
      alert('Please enter a buyer or vendor entity name.');
      return;
    }
    onAddPayment({
      id: `pay-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: amt,
      direction: payDir,
      category: payCat,
      partyName: payParty.trim(),
      status: 'settled',
      notes: payNotes.trim() || undefined,
    });
    setPayAmount('');
    setPayParty('');
    setPayNotes('');
  };

  return (
    <div>
      <div className="card-header-flex" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Agronomy & Farm Management</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Feeding histories, disease diagnosis protocols, reeling metrics, forage ledger, and cashflow.
          </p>
        </div>
      </div>

      {/* Sub-Tabs Toolbar - Clean text navigation without redundant duplicate icons */}
      <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.35rem', marginBottom: '1.25rem' }}>
        {[
          { key: 'feeding', label: 'Feeding Log' },
          { key: 'health', label: 'Disease Diagnostics' },
          { key: 'harvest', label: 'Reeling Analytics' },
          { key: 'leaf', label: 'Forage Ledger' },
          { key: 'finance', label: 'Cashflow Ledger' },
          { key: 'reports', label: 'Data Export' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as ToolTab)}
            className="btn-secondary"
            style={{
              background: activeTab === tab.key ? 'var(--primary)' : 'var(--bg-card)',
              color: activeTab === tab.key ? '#ffffff' : 'var(--text-main)',
              borderColor: activeTab === tab.key ? 'var(--primary)' : 'var(--border-card)',
              whiteSpace: 'nowrap',
              fontSize: '0.8rem',
              padding: '0.45rem 0.95rem',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Daily Feeding */}
      {activeTab === 'feeding' && (
        <div className="kalro-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Feeding Log History</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Total recorded feeding entries: <span className="tabular-nums">{feedLogs.length}</span>
              </p>
            </div>
          </div>

          {feedLogs.length === 0 ? (
            <div className="empty-state">
              <h4>No Feeding Records Found</h4>
              <p>There are no recorded feeding sessions. Use the "Quick Log" button to record fresh leaf supplies.</p>
            </div>
          ) : (
            <div className="kalro-table-wrap">
              <table className="kalro-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Batch Lot</th>
                    <th>Quantity (Grams)</th>
                    <th>Forage Variety</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {feedLogs.map((log) => {
                    const b = batches.find((item) => item.id === log.batchId);
                    return (
                      <tr key={log.id}>
                        <td className="tabular-nums">{new Date(log.recordedAt).toLocaleString()}</td>
                        <td>
                          <strong className="truncate">{b?.displayTag || b?.batchTag || log.batchId}</strong>
                        </td>
                        <td className="tabular-nums">{(log.quantityGrams / 1000).toFixed(2)} kg ({log.quantityGrams} g)</td>
                        <td style={{ textTransform: 'capitalize' }}>{log.leafType}</td>
                        <td>
                          {log.wasSkipped ? (
                            <span style={{ color: 'var(--status-danger)', fontWeight: 600 }}>
                              Fasting: {log.skippedReason || 'Moult rest period'}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>
                              Fed Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Health & Disease Diagnostics */}
      {activeTab === 'health' && (
        <div>
          <div className="kalro-card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Sericulture Pathology Diagnostic Manual</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  KALRO / KEPHIS official diagnostic criteria and quarantine containment protocols.
                </p>
              </div>
            </div>

            {/* Disease Selector Buttons */}
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {DISEASE_LIBRARY.map((disease, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedDiseaseIndex(idx)}
                  style={{
                    background: selectedDiseaseIndex === idx ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: selectedDiseaseIndex === idx ? '#ffffff' : 'var(--text-main)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {disease.name.split(' (')[0]}
                </button>
              ))}
            </div>

            {/* Selected Disease Diagnostic Sheet */}
            <div style={{ background: 'var(--bg-subtle)', padding: '1.15rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: selectedDisease.severity === 'critical' ? 'var(--status-danger)' : 'var(--text-main)' }}>
                  {selectedDisease.name}
                </h4>
                {selectedDisease.seedLotRisk && (
                  <span
                    style={{
                      background: 'var(--status-danger)',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      textTransform: 'uppercase',
                    }}
                  >
                    KEPHIS Notifiable Quarantine Pest
                  </span>
                )}
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Causal Agent / Pathogen
                </span>
                <p style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--text-main)', marginTop: '2px' }}>
                  {selectedDisease.pathogen}
                </p>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Clinical Field Symptoms
                </span>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', marginTop: '2px', lineHeight: 1.5 }}>
                  {selectedDisease.signs}
                </p>
              </div>

              <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                  Mandatory Containment & Disinfection Protocol
                </span>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '3px', lineHeight: 1.5 }}>
                  {selectedDisease.action}
                </p>
              </div>
            </div>
          </div>

          {/* Mortality Records Table */}
          <div className="kalro-card">
            <h3 className="card-title" style={{ marginBottom: '0.85rem' }}>
              Recorded Mortality Records ({mortalityLogs.length})
            </h3>
            {mortalityLogs.length === 0 ? (
              <div className="empty-state">
                <h4>Zero Mortality Records</h4>
                <p>No larval losses logged. Record any bed-cleaning attrition or dead worms via the Quick Log modal.</p>
              </div>
            ) : (
              <div className="kalro-table-wrap">
                <table className="kalro-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Batch Lot</th>
                      <th>Loss Count</th>
                      <th>Suspected Cause</th>
                      <th>Observations Noted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mortalityLogs.map((m) => {
                      const b = batches.find((item) => item.id === m.batchId);
                      return (
                        <tr key={m.id}>
                          <td className="tabular-nums">{new Date(m.recordedAt).toLocaleDateString()}</td>
                          <td>{b?.displayTag || m.batchId}</td>
                          <td className="tabular-nums" style={{ color: 'var(--status-danger)', fontWeight: 700 }}>
                            -{m.count} larvae
                          </td>
                          <td>{m.cause || 'Bed cleaning mortality'}</td>
                          <td>{m.symptoms || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Cocoon Harvest & Reeling Analytics */}
      {activeTab === 'harvest' && (
        <div className="kalro-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Commercial Cocoon Quality & Reeling Analytics</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Adheres to Kenyan national standards: Shell Ratio %, Renditta (kg cocoons / kg raw silk), and Commercial Grading.
              </p>
            </div>
          </div>

          {batches.filter((b) => computeCocoonMetrics(b, harvests).cocoonCount > 0).length === 0 ? (
            <div className="empty-state">
              <h4>No Harvest Data Computed Yet</h4>
              <p>Reeling analytics will calculate automatically once a cocoon harvest is recorded for any rearing lot.</p>
            </div>
          ) : (
            batches.map((batch) => {
              const metrics = computeCocoonMetrics(batch, harvests);
              if (metrics.cocoonCount === 0) return null;

              return (
                <div
                  key={batch.id}
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.15rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                        {batch.displayTag || batch.batchTag || batch.id}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Species: {batch.species === 'bombyx' ? 'Bombyx mori (CSR2 x CSR4 Bivoltine)' : 'Samia cynthia ricini (Eri)'}
                      </span>
                    </div>

                    <span
                      style={{
                        background:
                          metrics.commercialGrade === 'Grade A'
                            ? 'var(--status-success)'
                            : metrics.commercialGrade === 'Grade B'
                            ? 'var(--status-info)'
                            : 'var(--status-warning)',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '0.3rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {metrics.commercialGrade} Silk Standard
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div style={{ background: '#ffffff', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Green Yield</div>
                      <strong className="tabular-nums">{(metrics.totalWeightGrams / 1000).toFixed(2)} kg</strong>
                    </div>
                    <div style={{ background: '#ffffff', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cocoon Count</div>
                      <strong className="tabular-nums">{metrics.cocoonCount.toLocaleString()}</strong>
                    </div>
                    <div style={{ background: '#ffffff', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Single Cocoon Wt</div>
                      <strong className="tabular-nums">{metrics.averageCocoonWeightGrams} g</strong>
                    </div>
                    <div style={{ background: '#ffffff', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Shell Ratio %</div>
                      <strong className="tabular-nums" style={{ color: 'var(--primary)' }}>
                        {metrics.shellRatioPercent ? `${metrics.shellRatioPercent}%` : 'N/A'}
                      </strong>
                    </div>
                    <div style={{ background: '#ffffff', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Renditta</div>
                      <strong className="tabular-nums">{metrics.renditta ? `${metrics.renditta}` : 'N/A'}</strong>
                    </div>
                    <div style={{ background: '#ffffff', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Defect Rate</div>
                      <strong className="tabular-nums" style={{ color: metrics.defectRatePercent > 5 ? 'var(--status-danger)' : 'var(--status-success)' }}>
                        {metrics.defectRatePercent}%
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 4: Leaf & Forage Ledger - Reworked from 3-column cards into an Agronomic Forage Balance Strip */}
      {activeTab === 'leaf' && (
        <div>
          <div className="kalro-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Forage Stockpile & Moisture Integrity</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Active nutritional storage balances and replenishment records.
                </p>
              </div>
            </div>

            {/* Consolidated Agronomic Forage Balance Strip */}
            <div className="operational-metric-strip" style={{ marginBottom: '1.25rem' }}>
              <div className="metric-col">
                <span className="metric-label">Mulberry (Kanva-2 / S-13)</span>
                <span className="metric-number tabular-nums">{inventory.mulberryKg.toFixed(1)} kg</span>
                <span className="metric-sub">For Bombyx mori • 78% moisture required</span>
              </div>
              <div className="metric-col">
                <span className="metric-label">Castor (GRC-1 Cultivar)</span>
                <span className="metric-number tabular-nums">{inventory.castorKg.toFixed(1)} kg</span>
                <span className="metric-sub">Primary host for Eri silkworms</span>
              </div>
              <div className="metric-col">
                <span className="metric-label">Kesseru Perennial Stand</span>
                <span className="metric-number tabular-nums">{inventory.kesseruKg.toFixed(1)} kg</span>
                <span className="metric-sub">Drought-hardy secondary host</span>
              </div>
            </div>

            {/* Add Leaf Harvest Form */}
            <form
              onSubmit={handleAddLeaf}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-card)',
                padding: '1.15rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
              }}
            >
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Record Forage Harvest Addition
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Forage Variety</label>
                  <select
                    value={leafType}
                    onChange={(e) => setLeafType(e.target.value as LeafType)}
                    className="form-control"
                  >
                    <option value="mulberry">Mulberry (Kanva-2 / S-13 / V-1)</option>
                    <option value="castor">Castor (GRC-1 Cultivar)</option>
                    <option value="kesseru">Kesseru (Heteropanax fragrans)</option>
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
                  <label className="form-label">Harvest Source Plot</label>
                  <input
                    type="text"
                    value={leafReason}
                    onChange={(e) => setLeafReason(e.target.value)}
                    className="form-control"
                    placeholder="e.g. Mulberry Plot 2 - West Block"
                  />
                </div>

                <button type="submit" className="btn-accent" style={{ height: '36px' }}>
                  Add Stock
                </button>
              </div>
            </form>

            {/* Movement Ledger Table */}
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.6rem' }}>
              Forage Movement Ledger
            </h4>
            <div className="kalro-table-wrap">
              <table className="kalro-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Forage Variety</th>
                    <th>Flow Direction</th>
                    <th>Quantity (kg)</th>
                    <th>Plot / Batch Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  {leafMovements.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No forage movements logged. Record a shoot harvest addition above.
                      </td>
                    </tr>
                  ) : (
                    leafMovements.map((m) => (
                      <tr key={m.id}>
                        <td className="tabular-nums">{formatDate(m.date)}</td>
                        <td style={{ textTransform: 'capitalize' }}>{m.leafType}</td>
                        <td>
                          <span
                            style={{
                              color: m.direction === 'inflow' ? 'var(--status-success)' : 'var(--status-danger)',
                              fontWeight: 600,
                            }}
                          >
                            {m.direction === 'inflow' ? 'Inflow (Harvested)' : 'Outflow (Fed)'}
                          </span>
                        </td>
                        <td>
                          <strong className="tabular-nums">
                            {m.direction === 'inflow' ? '+' : '-'}
                            {m.quantityKg} kg
                          </strong>
                        </td>
                        <td>{m.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Cashflow Ledger - Reworked from 3-column cards into an Executive Cashflow Reconciliation Strip */}
      {activeTab === 'finance' && (
        <div>
          <div className="kalro-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Sericulture Enterprise Cashflow</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Commercial cocoon sales revenues and station rearing expenditure records.
                </p>
              </div>
            </div>

            {/* Consolidated Cashflow Reconciliation Strip */}
            <div className="operational-metric-strip" style={{ marginBottom: '1.25rem' }}>
              <div className="metric-col">
                <span className="metric-label">Gross Cocoon Sales</span>
                <span className="metric-number tabular-nums" style={{ color: 'var(--status-success)' }}>
                  {formatCurrency(totalInflow)}
                </span>
                <span className="metric-sub">Certified Grade A & B sales</span>
              </div>
              <div className="metric-col">
                <span className="metric-label">Rearing & Input Costs</span>
                <span className="metric-number tabular-nums" style={{ color: 'var(--status-danger)' }}>
                  {formatCurrency(totalOutflow)}
                </span>
                <span className="metric-sub">DFL egg seeds, lime, and tools</span>
              </div>
              <div className="metric-col">
                <span className="metric-label">Net Station Margin</span>
                <span className="metric-number tabular-nums" style={{ color: netIncome >= 0 ? 'var(--primary)' : 'var(--status-danger)' }}>
                  {formatCurrency(netIncome)}
                </span>
                <span className="metric-sub">Operating profit before depreciation</span>
              </div>
            </div>

            {/* Record Transaction Form */}
            <form
              onSubmit={handleAddPayment}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-card)',
                padding: '1.15rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
              }}
            >
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Record Financial Entry
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Flow Type</label>
                  <select
                    value={payDir}
                    onChange={(e) => setPayDir(e.target.value as 'inflow' | 'outflow')}
                    className="form-control"
                  >
                    <option value="inflow">Inflow (Cocoon Sale)</option>
                    <option value="outflow">Outflow (Expense)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Amount (KES)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-control tabular-nums"
                    placeholder="e.g. 5000"
                    step="any"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Buyer / Vendor Entity</label>
                  <input
                    type="text"
                    value={payParty}
                    onChange={(e) => setPayParty(e.target.value)}
                    className="form-control"
                    placeholder="e.g. KALRO Silk Processing Unit Thika"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Accounting Category</label>
                  <select
                    value={payCat}
                    onChange={(e) => setPayCat(e.target.value as any)}
                    className="form-control"
                  >
                    <option value="cocoon_sale">Cocoon Sale Revenue</option>
                    <option value="egg_purchase">DFL Seed Purchase</option>
                    <option value="leaf_purchase">External Forage Purchase</option>
                    <option value="equipment">Rearing Trays / Chemical Sanitizers</option>
                    <option value="other">General Operational Costs</option>
                  </select>
                </div>

                <button type="submit" className="btn-accent" style={{ height: '36px' }}>
                  Save Entry
                </button>
              </div>
            </form>

            {/* Transactions Table */}
            <div className="kalro-table-wrap">
              <table className="kalro-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Party Entity</th>
                    <th>Amount (KES)</th>
                    <th>Status</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No financial transactions recorded. Log a commercial cocoon sale or input cost above.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id}>
                        <td className="tabular-nums">{formatDate(p.date)}</td>
                        <td style={{ textTransform: 'capitalize' }}>{p.category.replace('_', ' ')}</td>
                        <td>{p.partyName}</td>
                        <td className="tabular-nums" style={{ fontWeight: 700, color: p.direction === 'inflow' ? 'var(--status-success)' : 'var(--status-danger)' }}>
                          {p.direction === 'inflow' ? '+' : '-'} {formatCurrency(p.amount)}
                        </td>
                        <td>
                          <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>
                            Settled
                          </span>
                        </td>
                        <td>{p.notes || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Reports & Data Export */}
      {activeTab === 'reports' && (
        <div className="kalro-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Agricultural Extension Reports & Data Export</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Download validated station logs for KALRO agronomy extension officers and internal auditing.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Primary Action: Official PDF Report */}
            <div style={{ border: '1px solid var(--primary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', background: '#F8FBF9', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                    Official Sericulture Production & Audit Report (PDF)
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', maxWidth: '640px', lineHeight: 1.5 }}>
                    Standard documentation formatted for KALRO extension inspectors, county agronomists, and archival audit. Includes executive KPIs, batch lot register, feeding histories, pathology records, cocoon grading metrics, and formal signature blocks.
                  </p>
                </div>
                <button
                  onClick={onOpenReportModal}
                  className="btn-accent"
                  style={{ whiteSpace: 'nowrap', padding: '0.55rem 1.25rem', fontSize: '0.84rem' }}
                >
                  Generate & Export PDF Report
                </button>
              </div>
            </div>

            <div style={{ border: '1px solid var(--border-card)', padding: '1.15rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)' }}>
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>Export Batches as CSV</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                Generates a clean comma-separated table with dates, counts, species strains, and statuses.
              </p>
              <button onClick={onExportCsv} className="btn-secondary" style={{ width: '100%' }}>
                Download CSV Spreadsheet
              </button>
            </div>

            <div style={{ border: '1px solid var(--border-card)', padding: '1.15rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)' }}>
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>Backup Station Data (JSON)</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                Offline database backup of all batch logs, feeding records, and harvest tallies for station archival or restoration.
              </p>
              <button onClick={onExportBackup} className="btn-secondary" style={{ width: '100%' }}>
                Export Station Backup (JSON)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
