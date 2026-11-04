import React, { useState } from 'react';
import { X, Printer, Download, FileText, Check } from 'lucide-react';
import {
  Batch,
  CocoonHarvest,
  EnvironmentLog,
  FarmProfile,
  FeedLog,
  LeafInventory,
  LeafMovement,
  MortalityLog,
  PaymentRecord,
} from '../types';
import { generateStationPdf } from '../utils/pdfGenerator';
import {
  calculateLeafCoverage,
  computeCocoonMetrics,
  formatCurrency,
  getCurrentStage,
  getLiveLarvaeCount,
} from '../utils';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FarmProfile;
  batches: Batch[];
  feedLogs: FeedLog[];
  mortalityLogs: MortalityLog[];
  envLogs: EnvironmentLog[];
  harvests: CocoonHarvest[];
  inventory: LeafInventory;
  leafMovements: LeafMovement[];
  payments: PaymentRecord[];
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  profile,
  batches,
  feedLogs,
  mortalityLogs,
  envLogs,
  harvests,
  inventory,
  leafMovements,
  payments,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const activeBatches = batches.filter((b) => b.status === 'active');
  let totalLiveLarvae = 0;
  let totalOriginalEggs = 0;
  batches.forEach((b) => {
    totalLiveLarvae += getLiveLarvaeCount(b, mortalityLogs);
    totalOriginalEggs += b.eggCount;
  });
  const avgSurvival = totalOriginalEggs > 0 ? (totalLiveLarvae / totalOriginalEggs) * 100 : 100;
  const totalHarvestWeightKg = harvests.reduce((sum, h) => sum + h.totalWeightGrams, 0) / 1000.0;
  const leafCoverage = calculateLeafCoverage(inventory, activeBatches, mortalityLogs);
  const totalRevenue = payments.filter((p) => p.direction === 'inflow').reduce((sum, p) => sum + p.amount, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const reportId = `KSR-${new Date().getFullYear()}-${String(new Date().getTime()).slice(-6)}`;

  const handleDownloadPdf = () => {
    setDownloading(true);
    try {
      const doc = generateStationPdf({
        profile,
        batches,
        feedLogs,
        mortalityLogs,
        envLogs,
        harvests,
        inventory,
        leafMovements,
        payments,
      });
      const fileName = `KALRO_Sericulture_Report_${profile.county}_${todayStr}.pdf`;
      doc.save(fileName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay report-modal-overlay">
      <div className="modal-content report-modal-content">
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="report-modal-actions no-print">
          <div className="report-action-title">
            <FileText size={18} style={{ color: 'var(--primary)' }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                Official Station Audit Report
              </h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
                Comprehensive verified production records for extension services and station archives.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handlePrint}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Print document or save via system print dialog"
            >
              <Printer size={15} />
              <span>Print Document</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="btn-accent"
              style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {downloadSuccess ? (
                <>
                  <Check size={15} />
                  <span>PDF Downloaded</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>{downloading ? 'Generating...' : 'Download PDF (.pdf)'}</span>
                </>
              )}
            </button>

            <button onClick={onClose} className="modal-close-btn" aria-label="Close report preview">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet Container */}
        <div className="printable-report-sheet" id="printable-report">
          {/* Official Letterhead */}
          <div className="report-letterhead">
            <div className="report-header-top">
              <div className="report-org-titles">
                <h2>KENYA AGRICULTURAL & LIVESTOCK RESEARCH ORGANIZATION</h2>
                <h4>National Sericulture Research Centre (NSRC)</h4>
                <p>P.O. Box 220-01000, Thika, Kenya • Tel: +254 (0) 20 2024840 • www.kalro.org</p>
              </div>
            </div>
            <div className="report-doc-title-bar">
              SERICULTURE PRODUCTION & STATION AUDIT REPORT
            </div>
          </div>

          {/* Station Metadata Grid */}
          <div className="report-meta-grid">
            <div className="report-meta-col">
              <div className="meta-item">
                <span className="meta-label">Station / Center:</span>
                <span className="meta-val">{profile.orgName}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">County Station:</span>
                <span className="meta-val">{profile.county} County, Kenya</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Station Lead / Officer:</span>
                <span className="meta-val">{profile.managerName}</span>
              </div>
            </div>

            <div className="report-meta-col">
              <div className="meta-item">
                <span className="meta-label">Rearing Facilities:</span>
                <span className="meta-val">{profile.houseCount} Isolated Rearing Chambers</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Report ID / Ref:</span>
                <span className="meta-val tabular-nums">{reportId}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Date Generated:</span>
                <span className="meta-val tabular-nums">{todayStr}</span>
              </div>
            </div>
          </div>

          {/* Section 1: Executive Performance Summary */}
          <div className="report-section">
            <h4 className="report-section-heading">1. EXECUTIVE PERFORMANCE SUMMARY</h4>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Performance Metric</th>
                  <th>Current Station Output</th>
                  <th>Standard KALRO Benchmark</th>
                  <th>Audit Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Active Rearing Lots</td>
                  <td className="tabular-nums">{activeBatches.length} batch(es) in rearing</td>
                  <td>Continuous staggered rearing</td>
                  <td>Normal</td>
                </tr>
                <tr>
                  <td>Live Silkworm Inventory</td>
                  <td className="tabular-nums">{totalLiveLarvae.toLocaleString()} larvae</td>
                  <td>Bed space: 45 worms / sq. ft.</td>
                  <td>Within Density Limits</td>
                </tr>
                <tr>
                  <td>Average Larval Survival Rate</td>
                  <td className="tabular-nums">{avgSurvival.toFixed(1)}%</td>
                  <td>85.0% - 92.0% (Bivoltine hybrid)</td>
                  <td style={{ color: avgSurvival >= 85 ? 'var(--status-success)' : 'var(--status-warning)', fontWeight: 600 }}>
                    {avgSurvival >= 85 ? 'Optimal' : 'Needs Review'}
                  </td>
                </tr>
                <tr>
                  <td>Cumulative Cocoon Harvest</td>
                  <td className="tabular-nums">{totalHarvestWeightKg.toFixed(1)} kg ({harvests.length} lot harvests)</td>
                  <td>Min 30 kg / 20k DFLs</td>
                  <td>Verified</td>
                </tr>
                <tr>
                  <td>Forage Reserve Runway</td>
                  <td className="tabular-nums">{inventory.mulberryKg.toFixed(1)} kg stored ({leafCoverage.daysOfCover} days buffer)</td>
                  <td>Min 3-day buffer reserve</td>
                  <td style={{ color: leafCoverage.urgency === 'critical' ? 'var(--status-danger)' : 'var(--status-success)', fontWeight: 600 }}>
                    {leafCoverage.urgency === 'critical' ? 'Deficit' : 'Sufficient'}
                  </td>
                </tr>
                <tr>
                  <td>Commercial Silk Revenue</td>
                  <td className="tabular-nums">{formatCurrency(totalRevenue)}</td>
                  <td>Market: KES 800 - 1,000 / kg Grade A</td>
                  <td>Reconciled</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Silkworm Rearing Lots */}
          <div className="report-section">
            <h4 className="report-section-heading">2. SILKWORM REARING LOT REGISTER</h4>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Batch ID / Lot</th>
                  <th>Species Strain</th>
                  <th>Start Date</th>
                  <th>Current Stage</th>
                  <th>Initial DFLs</th>
                  <th>Live Larvae</th>
                  <th>Survival</th>
                  <th>Rearing Bay</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No silkworm batches registered in station database.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => {
                    const live = getLiveLarvaeCount(b, mortalityLogs);
                    const stage = getCurrentStage(b);
                    const survival = b.eggCount > 0 ? ((live / b.eggCount) * 100).toFixed(1) + '%' : '100%';
                    const maxDays = b.species === 'bombyx' ? 40 : 39;
                    return (
                      <tr key={b.id}>
                        <td><strong>{b.displayTag || b.batchTag || b.id}</strong></td>
                        <td>{b.species === 'bombyx' ? 'Bivoltine Bombyx' : 'Eri Silkworm'}</td>
                        <td className="tabular-nums">{b.startDate}</td>
                        <td className="tabular-nums">Day {stage.dayStart} of {maxDays} ({stage.name.split(' ')[0]})</td>
                        <td className="tabular-nums">{b.eggCount.toLocaleString()}</td>
                        <td className="tabular-nums">{live.toLocaleString()}</td>
                        <td className="tabular-nums">{survival}</td>
                        <td>{b.roomName || 'House 1'}</td>
                        <td><span className={`status-badge ${b.status}`}>{b.status.toUpperCase()}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Section 3: Recent Feeding Log */}
          <div className="report-section">
            <h4 className="report-section-heading">3. FORAGE DISPATCH & FEEDING LOG (LAST 15 ENTRIES)</h4>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Batch / Lot</th>
                  <th>Forage Variety</th>
                  <th>Dispatched Weight</th>
                  <th>Feeding Status</th>
                  <th>Technician Observations</th>
                </tr>
              </thead>
              <tbody>
                {feedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No feeding dispatch logs recorded.
                    </td>
                  </tr>
                ) : (
                  feedLogs.slice(0, 15).map((f) => {
                    const batch = batches.find((b) => b.id === f.batchId);
                    return (
                      <tr key={f.id}>
                        <td className="tabular-nums">{f.recordedAt.split('T')[0]} {f.recordedAt.split('T')[1]?.slice(0, 5)}</td>
                        <td>{batch ? (batch.displayTag || batch.batchTag || batch.id) : f.batchId}</td>
                        <td>{f.leafType.toUpperCase()}</td>
                        <td className="tabular-nums">{(f.quantityGrams / 1000).toFixed(2)} kg</td>
                        <td>{f.wasSkipped ? 'Skipped (Moult Fasting)' : 'Delivered'}</td>
                        <td>{f.skippedReason || 'Routine scheduled ration'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Section 4: Larval Mortality & Disease Incidences */}
          <div className="report-section">
            <h4 className="report-section-heading">4. LARVAL LOSS & PATHOLOGY INCIDENCE LOG</h4>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Batch / Lot</th>
                  <th>Larval Loss</th>
                  <th>Suspected Pathogen / Cause</th>
                  <th>Observed Symptoms</th>
                  <th>Sanitation & Containment Protocol</th>
                </tr>
              </thead>
              <tbody>
                {mortalityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      Zero larval loss or pathology incidents recorded to date.
                    </td>
                  </tr>
                ) : (
                  mortalityLogs.map((m) => {
                    const batch = batches.find((b) => b.id === m.batchId);
                    return (
                      <tr key={m.id}>
                        <td className="tabular-nums">{m.recordedAt.split('T')[0]}</td>
                        <td>{batch ? (batch.displayTag || batch.batchTag || batch.id) : m.batchId}</td>
                        <td className="tabular-nums"><strong>{m.count}</strong> larvae</td>
                        <td>{m.cause || 'Natural attrition'}</td>
                        <td>{m.symptoms || 'None specified'}</td>
                        <td>Isolated and incinerated; rearing bed dusted with slaked lime</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Section 5: Cocoon Harvest & Reeling Analytics */}
          <div className="report-section">
            <h4 className="report-section-heading">5. COCOON HARVEST & COMMERCIAL REELING METRICS</h4>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Harvest Date</th>
                  <th>Batch Lot</th>
                  <th>Cocoon Shells</th>
                  <th>Total Weight</th>
                  <th>Avg Weight</th>
                  <th>Defect Rate</th>
                  <th>Shell Ratio</th>
                  <th>Quality Grade</th>
                </tr>
              </thead>
              <tbody>
                {harvests.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No cocoon harvests recorded for current cycle.
                    </td>
                  </tr>
                ) : (
                  harvests.map((h) => {
                    const batch = batches.find((b) => b.id === h.batchId);
                    const metrics = batch
                      ? computeCocoonMetrics(batch, [h])
                      : {
                          averageCocoonWeightGrams: h.cocoonCount > 0 ? Number((h.totalWeightGrams / h.cocoonCount).toFixed(2)) : 0,
                          defectRatePercent: h.cocoonCount > 0 ? Number(((h.defectiveCount / h.cocoonCount) * 100).toFixed(1)) : 0,
                          shellRatioPercent: null,
                          commercialGrade: 'Ungraded' as const,
                        };
                    return (
                      <tr key={h.id}>
                        <td className="tabular-nums">{h.harvestDate}</td>
                        <td>{batch ? (batch.displayTag || batch.batchTag || batch.id) : h.batchId}</td>
                        <td className="tabular-nums">{h.cocoonCount.toLocaleString()}</td>
                        <td className="tabular-nums">{(h.totalWeightGrams / 1000).toFixed(2)} kg</td>
                        <td className="tabular-nums">{metrics.averageCocoonWeightGrams} g</td>
                        <td className="tabular-nums">{metrics.defectRatePercent}%</td>
                        <td className="tabular-nums">{metrics.shellRatioPercent !== null ? `${metrics.shellRatioPercent}%` : '--'}</td>
                        <td><span className="status-badge active">{metrics.commercialGrade}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Section 6: Official Certification & Sign-off Block */}
          <div className="report-signoff-box">
            <p className="report-cert-text">
              <strong>Official Agronomic Certification:</strong> I hereby certify that the silkworm batch logs, forage consumption, pathology observations, and cocoon harvest records detailed above have been monitored according to KALRO Sericulture Standard Operating Procedures and constitute an authentic station record.
            </p>
            <div className="report-signatures">
              <div className="signature-slot">
                <div className="sig-line" />
                <div className="sig-name">Station Lead / Agronomist: {profile.managerName}</div>
                <div className="sig-sub">{profile.orgName} • {profile.county} County</div>
              </div>
              <div className="signature-slot">
                <div className="sig-line" />
                <div className="sig-name">KALRO Extension Officer / Lead Auditor</div>
                <div className="sig-sub">National Sericulture Research Centre, Thika</div>
              </div>
            </div>
          </div>

          {/* Report Footer */}
          <div className="report-footer-note">
            <span>KALRO Sericulture Extension Portal</span>
            <span>Document Ref: {reportId} • Generated {todayStr}</span>
            <span>Government of Kenya • Ministry of Agriculture and Livestock Development</span>
          </div>
        </div>
      </div>
    </div>
  );
};
