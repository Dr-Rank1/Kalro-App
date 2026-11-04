import React, { useState } from 'react';
import {
  Leaf,
  Activity,
  Award,
  DollarSign,
  BookOpen,
  FileSpreadsheet,
  Plus,
  AlertTriangle,
  HelpCircle,
  Download,
  CheckCircle,
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../translations';
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
  calculateLeafCoverage,
} from '../utils';

interface FarmToolsViewProps {
  batches: Batch[];
  feedLogs: FeedLog[];
  mortalityLogs: MortalityLog[];
  harvests: CocoonHarvest[];
  inventory: LeafInventory;
  leafMovements: LeafMovement[];
  payments: PaymentRecord[];
  lang: Language;
  onAddFeedLog: (log: FeedLog) => void;
  onAddMortalityLog: (log: MortalityLog) => void;
  onAddHarvest: (harvest: CocoonHarvest) => void;
  onAddLeafMovement: (movement: LeafMovement) => void;
  onAddPayment: (payment: PaymentRecord) => void;
  onExportCsv: () => void;
  onExportBackup: () => void;
}

type ToolTab = 'feeding' | 'health' | 'harvest' | 'leaf' | 'finance' | 'guide' | 'reports';

export const FarmToolsView: React.FC<FarmToolsViewProps> = ({
  batches,
  feedLogs,
  mortalityLogs,
  harvests,
  inventory,
  leafMovements,
  payments,
  lang,
  onAddFeedLog,
  onAddMortalityLog,
  onAddHarvest,
  onAddLeafMovement,
  onAddPayment,
  onExportCsv,
  onExportBackup,
}) => {
  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<ToolTab>('feeding');

  // Disease selector state
  const [selectedDiseaseIndex, setSelectedDiseaseIndex] = useState<number>(0);

  // New leaf stock form state
  const [leafType, setLeafType] = useState<LeafType>('mulberry');
  const [leafQty, setLeafQty] = useState<number>(25);
  const [leafReason, setLeafReason] = useState<string>('Morning plot harvest');

  // New payment form state
  const [payAmount, setPayAmount] = useState<number>(5000);
  const [payParty, setPayParty] = useState<string>('KALRO Thika Reeling Center');
  const [payCat, setPayCat] = useState<'cocoon_sale' | 'egg_purchase' | 'leaf_purchase' | 'other'>('cocoon_sale');
  const [payDir, setPayDir] = useState<'inflow' | 'outflow'>('inflow');
  const [payNotes, setPayNotes] = useState<string>('Cocoons sold');

  const selectedDisease = DISEASE_LIBRARY[selectedDiseaseIndex];
  const coverage = calculateLeafCoverage(inventory, batches.filter((b) => b.status === 'active'), mortalityLogs);

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
    onAddLeafMovement({
      id: `lm-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      leafType,
      quantityKg: Number(leafQty),
      direction: 'inflow',
      reason: leafReason.trim() || 'Forage harvest',
    });
    setLeafReason('');
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPayment({
      id: `pay-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: Number(payAmount),
      direction: payDir,
      category: payCat,
      partyName: payParty.trim(),
      status: 'settled',
      notes: payNotes.trim(),
    });
  };

  return (
    <div>
      <div className="card-header-flex" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{t.navFarm}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Daily feeding logs, disease diagnostics, reeling analytics, leaf ledger, finance, and KALRO field guide.
          </p>
        </div>
      </div>

      {/* Sub-Tabs Toolbar */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { key: 'feeding', label: t.tabFeeding, icon: <Leaf size={16} /> },
          { key: 'health', label: t.tabHealth, icon: <Activity size={16} /> },
          { key: 'harvest', label: t.tabHarvest, icon: <Award size={16} /> },
          { key: 'leaf', label: t.tabLeaf, icon: <FileSpreadsheet size={16} /> },
          { key: 'finance', label: t.tabFinance, icon: <DollarSign size={16} /> },
          { key: 'guide', label: t.tabGuide, icon: <BookOpen size={16} /> },
          { key: 'reports', label: t.tabReports, icon: <Download size={16} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as ToolTab)}
            className="btn-secondary"
            style={{
              background: activeTab === tab.key ? 'var(--primary-green)' : 'var(--card-white)',
              color: activeTab === tab.key ? '#ffffff' : 'var(--text-dark)',
              borderColor: activeTab === tab.key ? 'var(--primary-green)' : 'var(--card-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
              fontSize: '0.82rem',
              padding: '0.55rem 1rem',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Daily Feeding */}
      {activeTab === 'feeding' && (
        <div className="kalro-card">
          <div className="card-header-flex">
            <h3 className="card-title">
              <Leaf size={18} color="var(--primary-green)" />
              <span>Feeding Logs History ({feedLogs.length})</span>
            </h3>
          </div>

          <div className="kalro-table-wrap">
            <table className="kalro-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Batch</th>
                  <th>Quantity (Grams)</th>
                  <th>Leaf Forage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {feedLogs.map((log) => {
                  const b = batches.find((item) => item.id === log.batchId);
                  return (
                    <tr key={log.id}>
                      <td>{new Date(log.recordedAt).toLocaleString()}</td>
                      <td>
                        <strong>{b?.displayTag || b?.batchTag || log.batchId}</strong>
                      </td>
                      <td>{(log.quantityGrams / 1000).toFixed(2)} kg ({log.quantityGrams} g)</td>
                      <td style={{ textTransform: 'capitalize' }}>{log.leafType}</td>
                      <td>
                        {log.wasSkipped ? (
                          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                            Skipped: {log.skippedReason || 'Rest period'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                            ✓ Fed Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Health & Disease Diagnostics */}
      {activeTab === 'health' && (
        <div>
          {/* Interactive Diagnostic Assistant */}
          <div className="kalro-card" style={{ border: '2px solid var(--primary-green)' }}>
            <div className="card-header-flex">
              <div>
                <h3 className="card-title" style={{ color: 'var(--primary-green)' }}>
                  <HelpCircle size={20} />
                  <span>{t.diagnosticTitle}</span>
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {t.diagnosticSubtitle}
                </p>
              </div>
            </div>

            {/* Disease Selector Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {DISEASE_LIBRARY.map((disease, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedDiseaseIndex(idx)}
                  style={{
                    background: selectedDiseaseIndex === idx ? 'var(--primary-green)' : 'var(--background)',
                    color: selectedDiseaseIndex === idx ? '#ffffff' : 'var(--text-dark)',
                    border: '1px solid var(--card-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {disease.name.split(' (')[0]}
                </button>
              ))}
            </div>

            {/* Active Disease Card */}
            <div style={{ background: 'var(--background)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--danger)' }}>
                  {selectedDisease.name} ({selectedDisease.swahiliName})
                </h4>
                {selectedDisease.seedLotRisk && (
                  <span
                    style={{
                      background: 'var(--danger)',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <AlertTriangle size={14} /> {t.seedLotWarning}
                  </span>
                )}
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  {t.pathogen}
                </span>
                <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-dark)' }}>
                  {selectedDisease.pathogen}
                </p>
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  {t.symptomsObserved}
                </span>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-dark)', marginTop: '2px' }}>
                  {lang === 'sw' ? selectedDisease.swahiliSigns : selectedDisease.signs}
                </p>
              </div>

              <div style={{ background: 'var(--card-white)', padding: '0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-green)' }}>
                  {t.intervention}
                </span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)', marginTop: '4px' }}>
                  {lang === 'sw' ? selectedDisease.swahiliAction : selectedDisease.action}
                </p>
              </div>
            </div>
          </div>

          {/* Mortality Records Table */}
          <div className="kalro-card">
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>
              <span>Recorded Mortality Losses ({mortalityLogs.length})</span>
            </h3>
            <div className="kalro-table-wrap">
              <table className="kalro-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Batch</th>
                    <th>Count</th>
                    <th>Suspected Cause</th>
                    <th>Symptoms Noted</th>
                  </tr>
                </thead>
                <tbody>
                  {mortalityLogs.map((m) => {
                    const b = batches.find((item) => item.id === m.batchId);
                    return (
                      <tr key={m.id}>
                        <td>{new Date(m.recordedAt).toLocaleDateString()}</td>
                        <td>{b?.displayTag || m.batchId}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 700 }}>-{m.count} larvae</td>
                        <td>{m.cause || 'Bed cleaning mortality'}</td>
                        <td>{m.symptoms || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Cocoon Harvest & Reeling Analytics */}
      {activeTab === 'harvest' && (
        <div>
          <div className="kalro-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">
                  <Award size={18} color="var(--accent-gold)" />
                  <span>{t.reelingAnalytics}</span>
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Calculated metrics adhering to Kenya sericulture standards (Renditta, Shell Ratio %, Reelability %).
                </p>
              </div>
            </div>

            {batches.map((batch) => {
              const metrics = computeCocoonMetrics(batch, harvests);
              if (metrics.cocoonCount === 0) return null;

              return (
                <div
                  key={batch.id}
                  style={{
                    background: 'var(--background)',
                    border: '1px solid var(--card-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        {batch.displayTag || batch.batchTag || batch.id}
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Species: {batch.species === 'bombyx' ? 'Bombyx mori' : 'Eri'}
                      </span>
                    </div>

                    <span
                      style={{
                        background:
                          metrics.commercialGrade === 'Grade A'
                            ? 'var(--success)'
                            : metrics.commercialGrade === 'Grade B'
                            ? 'var(--info)'
                            : 'var(--rest)',
                        color: '#ffffff',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        padding: '0.35rem 0.85rem',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      {metrics.commercialGrade}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ background: 'var(--card-white)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Harvest</div>
                      <strong>{(metrics.totalWeightGrams / 1000).toFixed(2)} kg</strong>
                    </div>
                    <div style={{ background: 'var(--card-white)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cocoon Count</div>
                      <strong>{metrics.cocoonCount.toLocaleString()}</strong>
                    </div>
                    <div style={{ background: 'var(--card-white)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Avg Cocoon Wt</div>
                      <strong>{metrics.averageCocoonWeightGrams} g</strong>
                    </div>
                    <div style={{ background: 'var(--card-white)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Shell Ratio %</div>
                      <strong style={{ color: 'var(--primary-green)' }}>
                        {metrics.shellRatioPercent ? `${metrics.shellRatioPercent}%` : 'N/A'}
                      </strong>
                    </div>
                    <div style={{ background: 'var(--card-white)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Renditta</div>
                      <strong>{metrics.renditta ? `${metrics.renditta}` : 'N/A'}</strong>
                    </div>
                    <div style={{ background: 'var(--card-white)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Defect Rate</div>
                      <strong style={{ color: metrics.defectRatePercent > 5 ? 'var(--danger)' : 'var(--success)' }}>
                        {metrics.defectRatePercent}%
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Leaf & Forage Ledger */}
      {activeTab === 'leaf' && (
        <div>
          <div className="kalro-card">
            <div className="card-header-flex">
              <h3 className="card-title">
                <Leaf size={18} color="var(--leaf)" />
                <span>{t.leafLedgerTitle}</span>
              </h3>
            </div>

            {/* Current Stock Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mulberry Leaves</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--leaf)' }}>
                  {inventory.mulberryKg.toFixed(1)} kg
                </div>
              </div>
              <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Castor Leaves</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--rest)' }}>
                  {inventory.castorKg.toFixed(1)} kg
                </div>
              </div>
              <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kesseru Leaves</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                  {inventory.kesseruKg.toFixed(1)} kg
                </div>
              </div>
            </div>

            {/* Add Leaf Harvest Form */}
            <form
              onSubmit={handleAddLeaf}
              style={{
                background: 'rgba(61, 122, 84, 0.05)',
                border: '1px solid var(--divider)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.5rem',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--leaf)' }}>
                + {t.addLeafStock}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t.leafType}</label>
                  <select
                    value={leafType}
                    onChange={(e) => setLeafType(e.target.value as LeafType)}
                    className="form-control"
                  >
                    <option value="mulberry">Mulberry (Mkuyu)</option>
                    <option value="castor">Castor (Mbarika)</option>
                    <option value="kesseru">Kesseru</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t.stockInKg}</label>
                  <input
                    type="number"
                    value={leafQty}
                    onChange={(e) => setLeafQty(Number(e.target.value))}
                    className="form-control"
                    step="0.5"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Harvest Source / Plot</label>
                  <input
                    type="text"
                    value={leafReason}
                    onChange={(e) => setLeafReason(e.target.value)}
                    className="form-control"
                    placeholder="e.g. Mulberry Orchard Block B"
                  />
                </div>

                <button type="submit" className="btn-accent" style={{ background: 'var(--leaf)', height: '40px' }}>
                  Add Stock
                </button>
              </div>
            </form>

            {/* Movement Ledger Table */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.65rem' }}>
              Leaf Flow Ledger
            </h4>
            <div className="kalro-table-wrap">
              <table className="kalro-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Forage Type</th>
                    <th>Direction</th>
                    <th>Quantity</th>
                    <th>Reason / Details</th>
                  </tr>
                </thead>
                <tbody>
                  {leafMovements.map((m) => (
                    <tr key={m.id}>
                      <td>{formatDate(m.date)}</td>
                      <td style={{ textTransform: 'capitalize' }}>{m.leafType}</td>
                      <td>
                        <span
                          style={{
                            color: m.direction === 'inflow' ? 'var(--success)' : 'var(--danger)',
                            fontWeight: 600,
                          }}
                        >
                          {m.direction === 'inflow' ? '📥 Harvested In' : '📤 Fed Out'}
                        </span>
                      </td>
                      <td>
                        <strong>
                          {m.direction === 'inflow' ? '+' : '-'}
                          {m.quantityKg} kg
                        </strong>
                      </td>
                      <td>{m.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Finance & Sales */}
      {activeTab === 'finance' && (
        <div>
          <div className="kalro-card">
            <div className="card-header-flex">
              <h3 className="card-title">
                <DollarSign size={18} color="var(--primary-green)" />
                <span>Farm Financial Performance</span>
              </h3>
            </div>

            {/* Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cocoon Revenue</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                  {formatCurrency(totalInflow)}
                </div>
              </div>
              <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rearing Expenses</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>
                  {formatCurrency(totalOutflow)}
                </div>
              </div>
              <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Net Margin</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: netIncome >= 0 ? 'var(--primary-green)' : 'var(--danger)' }}>
                  {formatCurrency(netIncome)}
                </div>
              </div>
            </div>

            {/* Record Transaction Form */}
            <form
              onSubmit={handleAddPayment}
              style={{
                background: 'rgba(33, 70, 65, 0.04)',
                border: '1px solid var(--divider)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.5rem',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem' }}>
                + Record Payment / Receipt
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Type</label>
                  <select
                    value={payDir}
                    onChange={(e) => setPayDir(e.target.value as 'inflow' | 'outflow')}
                    className="form-control"
                  >
                    <option value="inflow">Money In (Cocoon Sale)</option>
                    <option value="outflow">Money Out (Expense)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Amount (KES)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="form-control"
                    step="100"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Buyer / Supplier Name</label>
                  <input
                    type="text"
                    value={payParty}
                    onChange={(e) => setPayParty(e.target.value)}
                    className="form-control"
                    placeholder="e.g. Silk Reeling Center"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Category</label>
                  <select
                    value={payCat}
                    onChange={(e) => setPayCat(e.target.value as any)}
                    className="form-control"
                  >
                    <option value="cocoon_sale">Cocoon Sale</option>
                    <option value="egg_purchase">Egg/Seed Purchase</option>
                    <option value="leaf_purchase">Leaf Purchase</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button type="submit" className="btn-accent" style={{ height: '40px' }}>
                  Save
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
                    <th>Party</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>{formatDate(p.date)}</td>
                      <td style={{ textTransform: 'capitalize' }}>{p.category.replace('_', ' ')}</td>
                      <td>{p.partyName}</td>
                      <td style={{ fontWeight: 700, color: p.direction === 'inflow' ? 'var(--success)' : 'var(--danger)' }}>
                        {p.direction === 'inflow' ? '+' : '-'} {formatCurrency(p.amount)}
                      </td>
                      <td>
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                          ✓ Settled
                        </span>
                      </td>
                      <td>{p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Field Guide */}
      {activeTab === 'guide' && (
        <div className="kalro-card">
          <div className="card-header-flex">
            <h3 className="card-title">
              <BookOpen size={18} color="var(--primary-green)" />
              <span>KALRO Sericulture Field Guide & Best Practices</span>
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: 'var(--background)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
              <h4 style={{ color: 'var(--primary-green)', fontWeight: 700, marginBottom: '0.45rem' }}>
                1. Chawki Rearing (1st & 2nd Instar)
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dark)', lineHeight: 1.6 }}>
                Young larvae require tender, succulent leaves rich in water (75-80%) and protein. Feed finely chopped leaf 3-4 times daily. Maintain 26-28°C and 80-85% humidity using wet foam pads around trays.
              </p>
            </div>

            <div style={{ background: 'var(--background)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
              <h4 style={{ color: 'var(--primary-green)', fontWeight: 700, marginBottom: '0.45rem' }}>
                2. Moult Rest Period Discipline
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dark)', lineHeight: 1.6 }}>
                When worms show swollen shiny heads and stop eating, DO NOT FEED! Dust the bed with dry slaked lime to lower humidity and keep beds dry. Resume feeding only when 95% of the larvae have shed their old skin.
              </p>
            </div>

            <div style={{ background: 'var(--background)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
              <h4 style={{ color: 'var(--primary-green)', fontWeight: 700, marginBottom: '0.45rem' }}>
                3. Late Age Feeding (4th & 5th Instar)
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dark)', lineHeight: 1.6 }}>
                The 5th instar consumes ~85% of total forage. Feed whole mature shoots to save labor. Expand bed space to 1 sq. meter per 1,000 larvae to avoid crowding stress and disease outbreaks.
              </p>
            </div>

            <div style={{ background: 'var(--background)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
              <h4 style={{ color: 'var(--primary-green)', fontWeight: 700, marginBottom: '0.45rem' }}>
                4. Mounting & Cocoon Harvesting
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dark)', lineHeight: 1.6 }}>
                Transfer ripe larvae (translucent amber-yellow) to mountages promptly (40-50 worms/sq. ft). Harvest cocoons on the 7th or 8th day after spinning to allow pupae skin to harden. Defloss and remove double or stained cocoons before marketing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Reports & Exports */}
      {activeTab === 'reports' && (
        <div className="kalro-card">
          <div className="card-header-flex">
            <h3 className="card-title">
              <Download size={18} color="var(--primary-green)" />
              <span>Reports & Offline Data Export</span>
            </h3>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Export your farm's complete rearing records for KALRO agricultural extension officers, CRC verification, and personal accounting.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div style={{ border: '1px solid var(--card-border)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Export Batches as CSV</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Download a comma-separated spreadsheet with batch dates, counts, species, and rearing statuses.
              </p>
              <button onClick={onExportCsv} className="btn-accent" style={{ width: '100%' }}>
                <Download size={15} /> Download Batches CSV
              </button>
            </div>

            <div style={{ border: '1px solid var(--card-border)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Export Farm Backup (JSON)</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Complete offline farm backup including all logs, feeds, harvests, and inventory with SHA-256 integrity hash.
              </p>
              <button onClick={onExportBackup} className="btn-primary" style={{ width: '100%', background: 'var(--primary-green)', color: '#ffffff' }}>
                <CheckCircle size={15} /> Export Signed JSON Backup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
