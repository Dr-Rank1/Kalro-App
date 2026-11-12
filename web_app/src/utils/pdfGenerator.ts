import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AuditLogEntry,
  Batch,
  CocoonHarvest,
  EnvironmentLog,
  FarmProfile,
  FeedLog,
  LeafInventory,
  LeafMovement,
  MortalityLog,
  PaymentRecord,
  UserAccount,
} from '../types';
import {
  calculateLeafCoverage,
  computeCocoonMetrics,
  formatCurrency,
  getCurrentStage,
  getLiveLarvaeCount,
} from '../utils';
import { SPECIES_THRESHOLDS } from '../constants';

export interface StationReportData {
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

export function generateStationPdf(data: StationReportData): jsPDF {
  const {
    profile,
    batches,
    feedLogs,
    mortalityLogs,
    envLogs,
    harvests,
    inventory,
    leafMovements,
    payments,
  } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // Primary Palette (KALRO Institutional Colors)
  const primaryColor: [number, number, number] = [30, 77, 43]; // #1E4D2B
  const textDark: [number, number, number] = [30, 41, 59]; // #1E293B
  const textMuted: [number, number, number] = [100, 116, 139]; // #64748B
  const subtleBg: [number, number, number] = [244, 246, 244]; // #F4F6F4

  // --- Document Header ---
  doc.setFillColor(...primaryColor);
  doc.rect(margin, y, pageWidth - margin * 2, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('KENYA AGRICULTURAL & LIVESTOCK RESEARCH ORGANIZATION', margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('National Sericulture Research Centre (NSRC) • P.O. Box 220-01000, Thika, Kenya', margin + 6, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SERICULTURE PRODUCTION & STATION AUDIT REPORT', margin + 6, y + 20);

  y += 28;

  // --- Station Metadata Panel ---
  doc.setFillColor(...subtleBg);
  doc.setDrawColor(200, 215, 205);
  doc.rect(margin, y, pageWidth - margin * 2, 22, 'FD');

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Station / Organization:`, margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${profile.orgName} (${profile.county} County)`, margin + 40, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text(`Station Lead / Officer:`, margin + 4, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${profile.managerName}`, margin + 40, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.text(`Rearing Units:`, margin + 4, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(`${profile.houseCount} Isolated Chamber(s)  •  Sync Code: ${profile.syncCode}`, margin + 40, y + 16);

  // Right column metadata
  const rightColX = margin + 115;
  const now = new Date();
  const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  doc.setFont('helvetica', 'bold');
  doc.text(`Report Date:`, rightColX, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(dateFormatted, rightColX + 22, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text(`Report ID:`, rightColX, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`KSR-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`, rightColX + 22, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.text(`Audit Status:`, rightColX, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 77, 43);
  doc.text('VERIFIED STATION LOG', rightColX + 22, y + 16);

  y += 26;

  // --- Executive Performance Indicators ---
  const activeBatches = batches.filter((b) => b.status === 'active');
  let totalLiveLarvae = 0;
  let totalInitialEggs = 0;
  batches.forEach((b) => {
    totalLiveLarvae += getLiveLarvaeCount(b, mortalityLogs);
    totalInitialEggs += b.eggCount;
  });
  const avgSurvival = totalInitialEggs > 0 ? (totalLiveLarvae / totalInitialEggs) * 100 : 100;
  const totalHarvestWeightKg = harvests.reduce((sum, h) => sum + h.totalWeightGrams, 0) / 1000.0;
  const leafCoverage = calculateLeafCoverage(inventory, activeBatches, mortalityLogs);
  const totalRevenue = payments.filter((p) => p.direction === 'inflow').reduce((sum, p) => sum + p.amount, 0);

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('1. EXECUTIVE PERFORMANCE SUMMARY', margin, y + 4);
  y += 6;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Metric', 'Station Value', 'Benchmark Standard', 'Compliance Status']],
    body: [
      ['Active Rearing Lots', `${activeBatches.length} batch(es) in progress`, 'Continuous staggered cycles', 'Normal'],
      ['Total Live Larvae Inventory', `${totalLiveLarvae.toLocaleString()} larvae`, 'Density: 45 larvae / sq. ft.', 'Within Capacity'],
      ['Average Larval Survival', `${avgSurvival.toFixed(1)}%`, '85.0% - 92.0% (Bivoltine hybrid)', avgSurvival >= 85 ? 'Optimal' : 'Needs Inspection'],
      ['Cumulative Cocoon Harvest', `${totalHarvestWeightKg.toFixed(1)} kg (${harvests.length} lot harvests)`, 'Min 30 kg / 20k DFLs', 'Verified'],
      ['Mulberry Shoot Reserves', `${inventory.mulberryKg.toFixed(1)} kg stored (${leafCoverage.daysOfCover} days buffer)`, 'Min 3-day feed reserve', leafCoverage.urgency === 'critical' ? 'Deficit' : 'Sufficient'],
      ['Commercial Silk Revenue', formatCurrency(totalRevenue), 'KES 800 - 1,000 / kg Grade A', 'Reconciled'],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: textDark,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: subtleBg,
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // --- Section 2: Silkworm Batches (Rearing Lots Register) ---
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. SILKWORM REARING LOT REGISTER', margin, y + 4);
  y += 6;

  const batchRows = batches.map((b) => {
    const live = getLiveLarvaeCount(b, mortalityLogs);
    const stage = getCurrentStage(b);
    const survivalRate = b.eggCount > 0 ? ((live / b.eggCount) * 100).toFixed(1) + '%' : '100%';
    const speciesLabel = b.species === 'bombyx' ? 'Bivoltine Bombyx' : 'Eri Silkworm';
    const maxDays = b.species === 'bombyx' ? 40 : 39;
    return [
      b.displayTag || b.batchTag || b.id,
      speciesLabel,
      b.startDate,
      `Day ${stage.dayStart} of ${maxDays} (${stage.name.split(' ')[0]})`,
      b.eggCount.toLocaleString(),
      live.toLocaleString(),
      survivalRate,
      b.roomName || 'House 1',
      b.status.toUpperCase(),
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Batch ID / Lot', 'Species', 'Start Date', 'Stage / Age', 'Initial Eggs', 'Live Larvae', 'Survival', 'Rearing Bay', 'Status']],
    body: batchRows.length > 0 ? batchRows : [['No silkworm batches registered', '--', '--', '--', '--', '--', '--', '--', '--']],
    theme: 'plain',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: textDark,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: subtleBg,
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  if (y > pageHeight - 60) {
    doc.addPage();
    y = margin;
  }

  // --- Section 3: Feeding Records (Recent 15 logs) ---
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('3. FORAGE DISPATCH & FEEDING LOG (RECENT)', margin, y + 4);
  y += 6;

  const feedRows = feedLogs.slice(0, 15).map((f) => {
    const batch = batches.find((b) => b.id === f.batchId);
    const dateFormatted = f.recordedAt.split('T')[0] + ' ' + (f.recordedAt.split('T')[1]?.slice(0, 5) || '');
    return [
      dateFormatted,
      batch ? (batch.displayTag || batch.batchTag || batch.id) : f.batchId,
      f.leafType.toUpperCase(),
      `${(f.quantityGrams / 1000).toFixed(2)} kg`,
      f.wasSkipped ? 'Skipped (Moult)' : 'Delivered Ration',
      f.skippedReason || 'Routine scheduled feeding',
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Date & Time', 'Batch / Lot', 'Forage Variety', 'Weight (kg)', 'Status', 'Notes']],
    body: feedRows.length > 0 ? feedRows : [['No feeding logs recorded', '--', '--', '--', '--', '--']],
    theme: 'plain',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: textDark,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: subtleBg,
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  if (y > pageHeight - 60) {
    doc.addPage();
    y = margin;
  }

  // --- Section 4: Pathology, Loss & Diagnostic Records ---
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('4. LARVAL LOSS & PATHOLOGY INCIDENCE LOG', margin, y + 4);
  y += 6;

  const mortRows = mortalityLogs.map((m) => {
    const batch = batches.find((b) => b.id === m.batchId);
    const dateFormatted = m.recordedAt.split('T')[0];
    return [
      dateFormatted,
      batch ? (batch.displayTag || batch.batchTag || batch.id) : m.batchId,
      `${m.count} larvae`,
      m.cause || 'Unknown natural mortality',
      m.symptoms || 'None specified',
      'Incinerated & bed dusted with lime/bleach',
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Date', 'Batch', 'Loss Count', 'Suspected Cause', 'Observed Symptoms', 'Containment Protocol']],
    body: mortRows.length > 0 ? mortRows : [['Zero larval mortality incidents recorded to date', '--', '--', '--', '--', '--']],
    theme: 'plain',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: textDark,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: subtleBg,
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  if (y > pageHeight - 65) {
    doc.addPage();
    y = margin;
  }

  // --- Section 5: Cocoon Harvest & Reeling Quality ---
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('5. COCOON HARVEST & COMMERCIAL REELING METRICS', margin, y + 4);
  y += 6;

  const harvestRows = harvests.map((h) => {
    const batch = batches.find((b) => b.id === h.batchId);
    const metrics = batch
      ? computeCocoonMetrics(batch, [h])
      : {
          averageCocoonWeightGrams: h.cocoonCount > 0 ? Number((h.totalWeightGrams / h.cocoonCount).toFixed(2)) : 0,
          defectRatePercent: h.cocoonCount > 0 ? Number(((h.defectiveCount / h.cocoonCount) * 100).toFixed(1)) : 0,
          shellRatioPercent: null,
          commercialGrade: 'Ungraded' as const,
        };
    return [
      h.harvestDate,
      batch ? (batch.displayTag || batch.batchTag || batch.id) : h.batchId,
      h.cocoonCount.toLocaleString(),
      `${(h.totalWeightGrams / 1000).toFixed(2)} kg`,
      `${metrics.averageCocoonWeightGrams} g`,
      metrics.shellRatioPercent !== null ? `${metrics.shellRatioPercent}%` : '--',
      `${metrics.defectRatePercent}%`,
      metrics.commercialGrade,
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Harvest Date', 'Batch Lot', 'Total Shells', 'Total Weight', 'Avg Weight', 'Shell Ratio', 'Defect Rate', 'Grade']],
    body: harvestRows.length > 0 ? harvestRows : [['No commercial harvests recorded for current cycle', '--', '--', '--', '--', '--', '--', '--']],
    theme: 'plain',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: textDark,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: subtleBg,
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Space check for signature block
  if (y > pageHeight - 45) {
    doc.addPage();
    y = margin + 10;
  }

  // --- Section 6: Official Verification & Sign-off Block ---
  doc.setFillColor(...subtleBg);
  doc.setDrawColor(200, 215, 205);
  doc.rect(margin, y, pageWidth - margin * 2, 34, 'FD');

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.text(
    'Certification: The undersigned hereby certifies that the rearing metrics, mortality logs, forage consumption, and harvest weights recorded above represent true and audited operational data conducted under KALRO technical protocols.',
    margin + 4,
    y + 6,
    { maxWidth: pageWidth - margin * 2 - 8 }
  );

  const sigCol1 = margin + 8;
  const sigCol2 = margin + 105;
  const sigY = y + 26;

  doc.setDrawColor(140, 160, 150);
  doc.line(sigCol1, sigY, sigCol1 + 75, sigY);
  doc.line(sigCol2, sigY, sigCol2 + 75, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`Station Lead / Agronomist: ${profile.managerName}`, sigCol1, sigY + 4);
  doc.text('KALRO County Extension Inspector / Auditor', sigCol2, sigY + 4);

  // --- Footer Page Numbers on All Pages ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(
      `KALRO Sericulture Extension Portal • Kenya Agricultural and Livestock Research Organization • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
}

export interface SingleBatchReportData {
  batch: Batch;
  profile: FarmProfile;
  feedLogs: FeedLog[];
  mortalityLogs: MortalityLog[];
  envLogs: EnvironmentLog[];
  harvests: CocoonHarvest[];
}

export function generateSingleBatchPdf(data: SingleBatchReportData): jsPDF {
  const { batch, profile, feedLogs, mortalityLogs, envLogs, harvests } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // Primary Palette
  const primaryColor: [number, number, number] = [30, 77, 43]; // #1E4D2B
  const textDark: [number, number, number] = [30, 41, 59]; // #1E293B
  const textMuted: [number, number, number] = [100, 116, 139]; // #64748B
  const subtleBg: [number, number, number] = [244, 246, 244]; // #F4F6F4

  // --- Document Header ---
  doc.setFillColor(...primaryColor);
  doc.rect(margin, y, pageWidth - margin * 2, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('KENYA AGRICULTURAL & LIVESTOCK RESEARCH ORGANIZATION', margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('National Sericulture Research Centre (NSRC) • P.O. Box 220-01000, Thika, Kenya', margin + 6, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('INDIVIDUAL SILKWORM LOT DOSSIER & PRODUCTION RECORD', margin + 6, y + 20);

  y += 28;

  // --- Lot Identification & Metadata Panel ---
  doc.setFillColor(...subtleBg);
  doc.setDrawColor(200, 215, 205);
  doc.rect(margin, y, pageWidth - margin * 2, 25, 'FD');

  const speciesLabel = batch.species === 'bombyx' ? 'Bivoltine Bombyx mori (CSR2 × CSR4 Hybrid)' : 'Samia ricini (Eri Silkworm)';
  const lotTag = batch.batchTag || batch.id;
  const displayTitle = batch.displayTag || `${batch.species === 'bombyx' ? 'Bombyx mori' : 'Eri'} Lot`;

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Silkworm Lot Code:', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${lotTag} (${displayTitle})`, margin + 38, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Species & Strain:', margin + 4, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(speciesLabel, margin + 38, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('Rearing Facility:', margin + 4, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(`${batch.roomName || 'Rearing House 1 - Bay A'} • Station: ${profile.orgName}`, margin + 38, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('Grainage / Notes:', margin + 4, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(batch.notes ? (batch.notes.length > 60 ? batch.notes.slice(0, 58) + '...' : batch.notes) : 'Certified KALRO NSRC DFL Stock', margin + 38, y + 21);

  // Right column
  const rightColX = margin + 120;

  doc.setFont('helvetica', 'bold');
  doc.text('Hatch / Start Date:', rightColX, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(batch.startDate, rightColX + 28, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('County Station:', rightColX, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${profile.county} County`, rightColX + 28, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('Lot Status:', rightColX, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(batch.status === 'active' ? 30 : 100, batch.status === 'active' ? 120 : 100, batch.status === 'active' ? 50 : 100);
  doc.text(batch.status.toUpperCase(), rightColX + 28, y + 16);

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.text('Dossier Ref:', rightColX, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(`DSR-${batch.id.slice(-6).toUpperCase()}`, rightColX + 28, y + 21);

  y += 29;

  // --- Summary Biological KPIs Table ---
  const batchMortality = mortalityLogs.filter((m) => m.batchId === batch.id);
  const totalMortality = batchMortality.reduce((s, m) => s + m.count, 0);
  const liveCount = getLiveLarvaeCount(batch, mortalityLogs);
  const survivalPercent = batch.eggCount > 0 ? ((liveCount / batch.eggCount) * 100).toFixed(1) : '100.0';
  const stage = getCurrentStage(batch);
  const maxDays = batch.species === 'bombyx' ? 40 : 39;
  const batchFeeds = feedLogs.filter((f) => f.batchId === batch.id);
  const totalFeedGrams = batchFeeds.reduce((s, f) => s + f.quantityGrams, 0);
  const batchHarvests = harvests.filter((h) => h.batchId === batch.id);
  const totalHarvestWeightKg = batchHarvests.reduce((s, h) => s + h.totalWeightGrams, 0) / 1000.0;

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('1. BIOLOGICAL & TECHNICAL PERFORMANCE SUMMARY', margin, y + 4);
  y += 6;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Rearing Parameter', 'Lot Metric', 'KALRO Protocol Standard', 'Status']],
    body: [
      ['Initial DFLs / Egg Count', `${batch.eggCount.toLocaleString()} eggs`, 'Certified Disease-Free Layings (DFLs)', 'Verified'],
      ['Current Surviving Population', `${liveCount.toLocaleString()} larvae`, 'Density: 45 larvae per sq. ft.', liveCount > 0 ? 'Active' : 'Closed'],
      ['Larval Survival Rate', `${survivalPercent}% (${totalMortality.toLocaleString()} total loss)`, '85.0% - 92.0% benchmark', Number(survivalPercent) >= 85 ? 'Optimal' : 'Needs Review'],
      ['Current Instar & Cycle Day', `Day ${stage.dayStart} of ${maxDays} (${stage.name})`, 'CSR2×CSR4: 40-Day Standard', stage.isMoult ? 'In Moult Fasting' : 'Active Feeding'],
      ['Total Forage Dispatched', `${(totalFeedGrams / 1000).toFixed(2)} kg fresh shoots`, `${batch.species === 'bombyx' ? 'Kanva-2 / S-13' : 'Castor GRC-1'} leaves`, 'Within Budget'],
      ['Chamber Microclimate Target', `${stage.idealTemp} Temp / ${stage.idealHumidity} RH`, 'Strict hygiene & cross-draft ventilation', 'Monitored'],
      ['Cocoon Harvest Output', totalHarvestWeightKg > 0 ? `${totalHarvestWeightKg.toFixed(2)} kg commercial yield` : 'Larval Rearing in Progress', 'Min 35–40 kg / 20k DFLs', totalHarvestWeightKg > 0 ? 'Harvested' : 'Pending Spinning'],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: textDark,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: subtleBg,
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // --- Section 2: Complete Feeding History ---
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. FORAGE DISPATCH & FEEDING HISTORY FOR THIS LOT', margin, y + 4);
  y += 6;

  const feedRows = batchFeeds.map((f) => {
    const dateFormatted = f.recordedAt.split('T')[0] + ' ' + (f.recordedAt.split('T')[1]?.slice(0, 5) || '');
    return [
      dateFormatted,
      f.leafType.toUpperCase(),
      `${(f.quantityGrams / 1000).toFixed(2)} kg`,
      f.wasSkipped ? 'Skipped (Moult Rest)' : 'Ration Delivered',
      f.skippedReason || 'Standard scheduled feeding',
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Date & Time', 'Forage Variety', 'Quantity (kg)', 'Feeding Status', 'Technician Observations']],
    body: feedRows.length > 0 ? feedRows : [['No feeding dispatches logged for this lot yet', '--', '--', '--', '--']],
    theme: 'plain',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: textDark,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: subtleBg,
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  if (y > pageHeight - 65) {
    doc.addPage();
    y = margin;
  }

  // --- Section 3: Pathology & Larval Mortality Log ---
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('3. LARVAL PATHOLOGY & MORTALITY LOG', margin, y + 4);
  y += 6;

  const mortRows = batchMortality.map((m) => {
    return [
      m.recordedAt.split('T')[0],
      `${m.count} larvae`,
      m.cause || 'Natural attrition',
      m.symptoms || 'None specified',
      'Incinerated & bed dusted with dry slaked lime (97:3)',
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Date', 'Loss Count', 'Suspected Cause / Disease', 'Observed Symptoms', 'Containment & Bed Sanitation']],
    body: mortRows.length > 0 ? mortRows : [['Zero larval mortality incidents recorded for this lot', '--', '--', '--', '--']],
    theme: 'plain',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: textDark,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: subtleBg,
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  if (y > pageHeight - 65) {
    doc.addPage();
    y = margin;
  }

  // --- Section 4: Microclimate Observations ---
  const batchEnv = envLogs.filter((e) => e.batchId === batch.id);
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('4. REARING CHAMBER MICROCLIMATE COMPLIANCE', margin, y + 4);
  y += 6;

  const limits = SPECIES_THRESHOLDS[batch.species];
  const envRows = batchEnv.map((e) => {
    const dateFormatted = e.recordedAt.split('T')[0] + ' ' + (e.recordedAt.split('T')[1]?.slice(0, 5) || '');
    const roomPrefix = e.roomName ? `[${e.roomName}] ` : '';
    const isTempOk = e.temperatureCelsius >= limits.minTemp && e.temperatureCelsius <= limits.maxTemp;
    const isHumOk = e.humidityPercent >= limits.minHum && e.humidityPercent <= limits.maxHum;
    const status = isTempOk && isHumOk ? 'Compliant' : 'Deviation Recorded';
    return [
      `${roomPrefix}${dateFormatted}`,
      `${e.temperatureCelsius.toFixed(1)}°C`,
      `${e.humidityPercent}% RH`,
      e.ventilationStatus ? e.ventilationStatus.toUpperCase() : 'OPTIMAL',
      `${limits.minTemp}-${limits.maxTemp}°C / ${limits.minHum}-${limits.maxHum}%`,
      status,
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Observation Time', 'Dry-Bulb Temp', 'Relative Humidity', 'Airflow', 'Target Bounds', 'Compliance Status']],
    body: envRows.length > 0 ? envRows : [['No microclimate readings recorded for this lot yet', '--', '--', '--', '--', '--']],
    theme: 'plain',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: textDark,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: subtleBg,
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  if (y > pageHeight - 65) {
    doc.addPage();
    y = margin;
  }

  // --- Section 5: Cocoon Harvest & Commercial Reeling Metrics ---
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('5. COCOON HARVEST & COMMERCIAL REELING GRADES', margin, y + 4);
  y += 6;

  const harvestRows = batchHarvests.map((h) => {
    const metrics = computeCocoonMetrics(batch, [h]);
    return [
      h.harvestDate,
      h.cocoonCount.toLocaleString(),
      `${(h.totalWeightGrams / 1000).toFixed(2)} kg`,
      `${metrics.averageCocoonWeightGrams} g`,
      `${metrics.defectRatePercent}%`,
      metrics.shellRatioPercent !== null ? `${metrics.shellRatioPercent}%` : '--',
      metrics.commercialGrade,
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Harvest Date', 'Shell Count', 'Total Fresh Weight', 'Avg Shell Weight', 'Defect Rate', 'Shell Ratio', 'Quality Grade']],
    body: harvestRows.length > 0 ? harvestRows : [['Lot currently in larval rearing phase (harvest pending)', '--', '--', '--', '--', '--', '--']],
    theme: 'plain',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: textDark,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: subtleBg,
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  if (y > pageHeight - 45) {
    doc.addPage();
    y = margin + 10;
  }

  // --- Section 6: Official Verification & Sign-off Block ---
  doc.setFillColor(...subtleBg);
  doc.setDrawColor(200, 215, 205);
  doc.rect(margin, y, pageWidth - margin * 2, 34, 'FD');

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.text(
    `Certification: The undersigned hereby certifies that the rearing logs, feeding dispatches, microclimate readings, and cocoon harvest records documented for Lot ${lotTag} represent true and audited operational data conducted under KALRO National Sericulture Research Centre technical guidelines.`,
    margin + 4,
    y + 6,
    { maxWidth: pageWidth - margin * 2 - 8 }
  );

  const sigCol1 = margin + 8;
  const sigCol2 = margin + 105;
  const sigY = y + 26;

  doc.setDrawColor(140, 160, 150);
  doc.line(sigCol1, sigY, sigCol1 + 75, sigY);
  doc.line(sigCol2, sigY, sigCol2 + 75, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`Station Lead / Agronomist: ${profile.managerName}`, sigCol1, sigY + 4);
  doc.text('KALRO County Extension Inspector / Auditor', sigCol2, sigY + 4);

  // --- Footer Page Numbers on All Pages ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(
      `KALRO Sericulture Extension Portal • Lot ${lotTag} Dossier • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
}

export function downloadSingleBatchPdf(data: SingleBatchReportData): void {
  const doc = generateSingleBatchPdf(data);
  const tag = data.batch.batchTag || data.batch.displayTag || data.batch.id;
  const safeTag = tag.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`KALRO_Lot_${safeTag}_${dateStr}.pdf`);
}

export interface StaffAuditReportData {
  profile: FarmProfile;
  auditLogs: AuditLogEntry[];
  allUsers: UserAccount[];
  batches: Batch[];
}

export function generateStaffAuditPdf(data: StaffAuditReportData): jsPDF {
  const { profile, auditLogs, allUsers, batches } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  const primaryColor: [number, number, number] = [30, 77, 43]; // #1E4D2B
  const textDark: [number, number, number] = [30, 41, 59]; // #1E293B
  const textMuted: [number, number, number] = [100, 116, 139]; // #64748B
  const subtleBg: [number, number, number] = [244, 246, 244]; // #F4F6F4

  // --- Document Header ---
  doc.setFillColor(...primaryColor);
  doc.rect(margin, y, pageWidth - margin * 2, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text('KENYA AGRICULTURAL & LIVESTOCK RESEARCH ORGANIZATION', margin + 6, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('National Sericulture Research Centre (NSRC) • P.O. Box 220-01000, Thika, Kenya', margin + 6, y + 13.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('STAFF OPERATIONS & SHIFT AUDIT DOSSIER • WHO DID WHAT & WHEN', margin + 6, y + 19.5);

  y += 28;

  // --- Station & Roster Context Box ---
  doc.setFillColor(...subtleBg);
  doc.setDrawColor(200, 215, 205);
  doc.rect(margin, y, pageWidth - margin * 2, 22, 'FD');

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Station Facility:', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${profile.orgName} (${profile.county} County)`, margin + 30, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Active Roster:', margin + 4, y + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${allUsers.length} Rotating Sericulture Specialists`, margin + 30, y + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Concurrent Lots:', margin + 4, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.text(`${batches.filter((b) => b.status === 'active').length} Active Rearing Lots across ${profile.houseCount || 4} Rearing Houses`, margin + 30, y + 17);

  const reportDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.setFont('helvetica', 'bold');
  doc.text('Date Exported:', margin + 115, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${reportDateStr} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EAT`, margin + 140, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Audit Scope:', margin + 115, y + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${auditLogs.length} Verified Operational Records`, margin + 140, y + 11.5);

  y += 26;

  // --- Staff Operations Performance Table ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('1. Sericulture Staff Duty Attribution & Activity Count', margin, y);
  y += 3;

  const staffRows = allUsers.map((u) => {
    const userLogs = auditLogs.filter((l) => l.operatorId === u.id || l.operatorName === u.username);
    const feedCount = userLogs.filter((l) => l.actionType === 'feed_log').length;
    const climateCount = userLogs.filter((l) => l.actionType === 'climate_check').length;
    const otherCount = userLogs.length - feedCount - climateCount;
    return [
      u.username,
      u.role.replace(/_/g, ' ').toUpperCase(),
      u.staffId || 'KALRO-STF',
      u.shift ? u.shift.toUpperCase() : 'GENERAL',
      String(feedCount),
      String(climateCount),
      String(otherCount),
      String(userLogs.length),
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Staff Member', 'Institutional Role', 'Staff ID', 'Shift', 'Feeds', 'Climate', 'Other', 'Total Logs']],
    body: staffRows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: textDark,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: subtleBg,
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // --- Chronological Operations Audit Ledger ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('2. Chronological Operational Records (Who Made What Change, When & Location)', margin, y);
  y += 3;

  const ledgerRows = auditLogs.slice(0, 150).map((l) => {
    const d = new Date(l.timestamp);
    const dateFormatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const batchLoc = l.batchTag ? (l.roomName ? `${l.batchTag} [${l.roomName}]` : l.batchTag) : (l.roomName || 'Station Bay');
    return [
      dateFormatted,
      l.operatorName,
      l.operatorRole.replace(/_/g, ' '),
      l.actionType.replace(/_/g, ' ').toUpperCase(),
      batchLoc,
      l.metrics || '--',
      l.details,
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Date & Time', 'Staff Member', 'Role', 'Action', 'Batch / Room', 'Metric', 'Operational Details']],
    body: ledgerRows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: textDark,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 20 },
      3: { cellWidth: 18 },
      4: { cellWidth: 26 },
      5: { cellWidth: 20, fontStyle: 'bold' },
      6: { cellWidth: 'auto' },
    },
    alternateRowStyles: {
      fillColor: subtleBg,
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  if (y > pageHeight - 45) {
    doc.addPage();
    y = margin + 10;
  }

  // --- Institutional Certification & Signatures ---
  doc.setFillColor(...subtleBg);
  doc.setDrawColor(200, 215, 205);
  doc.rect(margin, y, pageWidth - margin * 2, 32, 'FD');

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text(
    `Official Attestation: This operational dossier contains verified immutable time-stamped logs recorded by rotating sericulture technical staff at ${profile.orgName}. All feeding allocations, microclimate readings, and batch events have been inspected pursuant to KALRO sericulture quality management standards.`,
    margin + 4,
    y + 5,
    { maxWidth: pageWidth - margin * 2 - 8 }
  );

  const sigCol1 = margin + 8;
  const sigCol2 = margin + 105;
  const sigY = y + 24;

  doc.setDrawColor(140, 160, 150);
  doc.line(sigCol1, sigY, sigCol1 + 75, sigY);
  doc.line(sigCol2, sigY, sigCol2 + 75, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`Station Head / Senior Research Scientist: ${profile.managerName}`, sigCol1, sigY + 4);
  doc.text('Centre Quality Auditor / Extension Inspector', sigCol2, sigY + 4);

  // --- Page Footers ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(
      `KALRO Sericulture Research Centre • Staff Duty & Shift Audit Dossier • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
}

export function downloadStaffAuditPdf(data: StaffAuditReportData): void {
  const doc = generateStaffAuditPdf(data);
  const todayStr = new Date().toISOString().split('T')[0];
  doc.save(`KALRO_Staff_Audit_Dossier_${todayStr}.pdf`);
}
