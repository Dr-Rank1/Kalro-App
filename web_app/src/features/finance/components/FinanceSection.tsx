import React, { useState } from 'react';
import { FileText, Download, Database } from 'lucide-react';
import { PaymentRecord, PaymentCategory, PaymentDirection } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils';

interface FinanceSectionProps {
  payments: PaymentRecord[];
  onAddPayment: (payment: PaymentRecord) => void;
  onOpenReportModal?: () => void;
  onExportCsv?: () => void;
  onExportBackup?: () => void;
}

export const FinanceSection: React.FC<FinanceSectionProps> = ({
  payments,
  onAddPayment,
  onOpenReportModal,
  onExportCsv,
  onExportBackup,
}) => {
  const [showAddPay, setShowAddPay] = useState<boolean>(false);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payParty, setPayParty] = useState<string>('');
  const [payCat, setPayCat] = useState<PaymentCategory>('cocoon_sale');
  const [payDir, setPayDir] = useState<PaymentDirection>('inflow');
  const [payNotes, setPayNotes] = useState<string>('');

  const totalInflow = payments
    .filter((p) => p.direction === 'inflow')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOutflow = payments
    .filter((p) => p.direction === 'outflow')
    .reduce((sum, p) => sum + p.amount, 0);
  const netIncome = totalInflow - totalOutflow;

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payAmount);
    if (!amt || amt <= 0 || !payParty.trim()) return;

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
    setShowAddPay(false);
  };

  return (
    <div className="view-enter-animate" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* KALRO 1-Acre Sericulture Enterprise Model */}
      <div className="kalro-card" style={{ marginBottom: 0 }}>
        <h3 className="card-title">KALRO 1-Acre Sericulture Commercial Enterprise Model</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 1rem' }}>
          Economic projections based on 1 acre of established V1 / Thika / Kanva 2 mulberry supporting 4 rearing cycles per year.
        </p>

        <div className="farm-stat-grid" style={{ marginBottom: '1rem' }}>
          <div className="farm-stat-card">
            <div className="farm-stat-label">Annual Rearing Cycles</div>
            <div className="farm-stat-number tabular-nums" style={{ color: 'var(--primary)' }}>4 Batches</div>
            <div className="farm-stat-sub">3–4 DFL boxes per batch</div>
          </div>

          <div className="farm-stat-card">
            <div className="farm-stat-label">Annual Green Cocoons</div>
            <div className="farm-stat-number tabular-nums">550 – 650 kg</div>
            <div className="farm-stat-sub">~150 kg per harvest cycle</div>
          </div>

          <div className="farm-stat-card">
            <div className="farm-stat-label">Gross Farm Revenue</div>
            <div className="farm-stat-number tabular-nums" style={{ color: 'var(--status-success)' }}>
              KES 480,000
            </div>
            <div className="farm-stat-sub">At KES 800/kg Grade A rate</div>
          </div>

          <div className="farm-stat-card">
            <div className="farm-stat-label">Net Annual Farm Profit</div>
            <div className="farm-stat-number tabular-nums" style={{ color: 'var(--primary)' }}>
              KES 360,000
            </div>
            <div className="farm-stat-sub">After DFLs, labor & inputs</div>
          </div>
        </div>

        {/* Comparison against Traditional Crops */}
        <div className="kalro-table-wrap">
          <table className="kalro-table">
            <thead>
              <tr>
                <th>Enterprise / Crop</th>
                <th>Annual Gross (KES/Acre)</th>
                <th>Direct Input Costs</th>
                <th>Net Annual Margin</th>
                <th>Payback Frequency</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: 'rgba(22, 163, 74, 0.12)' }}>
                <td><strong>Bivoltine Sericulture (Mulberry)</strong></td>
                <td className="tabular-nums">KES 480,000</td>
                <td className="tabular-nums">KES 120,000</td>
                <td className="tabular-nums" style={{ color: 'var(--status-success)', fontWeight: 700 }}>
                  KES 360,000 / acre
                </td>
                <td><strong>Every 30–35 days</strong> (4 payouts)</td>
              </tr>
              <tr>
                <td>Rainfed Hybrid Maize</td>
                <td className="tabular-nums">KES 80,000</td>
                <td className="tabular-nums">KES 35,000</td>
                <td className="tabular-nums">KES 45,000 / acre</td>
                <td>Semi-annual (after 5 months)</td>
              </tr>
              <tr>
                <td>Smallholder Tea (Highland)</td>
                <td className="tabular-nums">KES 180,000</td>
                <td className="tabular-nums">KES 70,000</td>
                <td className="tabular-nums">KES 110,000 / acre</td>
                <td>Monthly green leaf payout</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Current Farm Cashflow Snapshot */}
      <div className="farm-stat-grid">
        <div className="farm-stat-card">
          <div className="farm-stat-label">Total Cocoon Sales</div>
          <div className="farm-stat-number tabular-nums" style={{ color: 'var(--status-success)' }}>
            {formatCurrency(totalInflow)}
          </div>
          <div className="farm-stat-sub">Reeling revenue</div>
        </div>

        <div className="farm-stat-card">
          <div className="farm-stat-label">Rearing Expenses</div>
          <div className="farm-stat-number tabular-nums" style={{ color: 'var(--status-danger)' }}>
            {formatCurrency(totalOutflow)}
          </div>
          <div className="farm-stat-sub">DFL eggs, lime, labor</div>
        </div>

        <div className="farm-stat-card">
          <div className="farm-stat-label">Net Farm Margin</div>
          <div className="farm-stat-number tabular-nums" style={{ color: netIncome >= 0 ? 'var(--primary)' : 'var(--status-danger)' }}>
            {formatCurrency(netIncome)}
          </div>
          <div className="farm-stat-sub">Operating profit</div>
        </div>
      </div>

      {/* Quick Transaction Entry */}
      <div className="kalro-card" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 className="card-title">Financial Records & Ledger</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Track green cocoon income and farm operating costs.
            </p>
          </div>

          <button
            type="button"
            className="btn-primary min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
            onClick={() => setShowAddPay(!showAddPay)}
          >
            {showAddPay ? 'Cancel' : '+ Record Transaction'}
          </button>
        </div>

        {/* Expandable Transaction Form */}
        {showAddPay && (
          <form onSubmit={handleAddPayment} className="farm-inline-form collapsible-content">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Flow Type</label>
                <select
                  value={payDir}
                  onChange={(e) => setPayDir(e.target.value as PaymentDirection)}
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
                <label className="form-label">Category</label>
                <select
                  value={payCat}
                  onChange={(e) => setPayCat(e.target.value as PaymentCategory)}
                  className="form-control"
                >
                  <option value="cocoon_sale">Cocoon Sale</option>
                  <option value="egg_purchase">DFL Egg Purchase</option>
                  <option value="leaf_purchase">Leaf Purchase</option>
                  <option value="equipment">Rearing Equipment & Trays</option>
                  <option value="labor">Farm Labor</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Buyer / Entity</label>
                <input
                  type="text"
                  value={payParty}
                  onChange={(e) => setPayParty(e.target.value)}
                  className="form-control"
                  placeholder="e.g. Silk Reeling Unit Thika"
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-accent min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]">
                Save Transaction
              </button>
            </div>
          </form>
        )}

        {/* Payments List */}
        <div style={{ marginTop: '1rem' }}>
          {payments.length === 0 ? (
            <div className="empty-state">
              <h4>No Financial Records</h4>
              <p>Record your cocoon sales or egg/leaf purchases above.</p>
            </div>
          ) : (
            <div className="kalro-table-wrap">
              <table className="kalro-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Party</th>
                    <th>Amount (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(-8).reverse().map((p) => (
                    <tr key={p.id}>
                      <td className="tabular-nums">{formatDate(p.date)}</td>
                      <td style={{ textTransform: 'capitalize' }}>{p.category.replace('_', ' ')}</td>
                      <td><strong>{p.partyName}</strong></td>
                      <td className="tabular-nums" style={{ fontWeight: 700, color: p.direction === 'inflow' ? 'var(--status-success)' : 'var(--status-danger)' }}>
                        {p.direction === 'inflow' ? '+' : '-'} {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Official Agricultural Extension Export Center */}
      <div className="kalro-card" style={{ marginBottom: 0 }}>
        <h3 className="card-title">Official Agricultural Reports & Exports</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 1rem' }}>
          Export certified farm records for KALRO agricultural extension officers and station archives.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          {onOpenReportModal && (
            <div className="farm-export-box primary">
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} /> Official PDF Report
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', margin: '4px 0 0.75rem' }}>
                  Formatted document with farm KPIs, batch registers, and KALRO signature lines.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenReportModal}
                className="btn-accent min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Generate PDF Report
              </button>
            </div>
          )}

          {onExportCsv && (
            <div className="farm-export-box">
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={16} /> Export CSV
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0.75rem' }}>
                  Comma-separated table of all active and completed rearing lots.
                </p>
              </div>
              <button
                type="button"
                onClick={onExportCsv}
                className="btn-secondary min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Download CSV
              </button>
            </div>
          )}

          {onExportBackup && (
            <div className="farm-export-box">
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Database size={16} /> Backup Data (JSON)
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0.75rem' }}>
                  Complete cryptographic station database snapshot for offline restore.
                </p>
              </div>
              <button
                type="button"
                onClick={onExportBackup}
                className="btn-secondary min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Export Backup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
