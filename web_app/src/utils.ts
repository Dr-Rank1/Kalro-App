import { BOMBYX_STAGES, ERI_STAGES } from './constants';
import {
  Batch,
  CocoonHarvest,
  CocoonMetrics,
  FeedLog,
  LeafInventory,
  MilestoneStage,
  MortalityLog,
} from './types';

export function getBatchAgeDays(batch: Batch, now = new Date()): number {
  const start = new Date(batch.startDate);
  const diffTime = Math.max(0, now.getTime() - start.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function getCurrentStage(batch: Batch, ageDays?: number): MilestoneStage {
  const age = ageDays ?? getBatchAgeDays(batch);
  const stages = batch.species === 'bombyx' ? BOMBYX_STAGES : ERI_STAGES;

  for (const stage of stages) {
    if (age >= stage.dayStart && age <= stage.dayEnd) {
      return stage;
    }
  }

  // If past final stage
  return stages[stages.length - 1];
}

export function getLiveLarvaeCount(batch: Batch, mortalityLogs: MortalityLog[]): number {
  const totalMortality = mortalityLogs
    .filter((m) => m.batchId === batch.id)
    .reduce((sum, m) => sum + m.count, 0);
  return Math.max(0, batch.eggCount - totalMortality);
}

export function getSuggestedDailyFeedGrams(batch: Batch, liveCount: number, stage: MilestoneStage): number {
  if (stage.isMoult || stage.isHarvest || stage.instarNumber === null) {
    return 0;
  }

  // Grams per 1000 worms per day baseline for Bombyx mori and Eri
  const baselinePer1000: Record<number, number> = {
    1: 40,    // 1st instar
    2: 150,   // 2nd instar
    3: 650,   // 3rd instar
    4: 3200,  // 4th instar
    5: 18000, // 5th instar peak consumption
  };

  const rate = baselinePer1000[stage.instarNumber] || 500;
  return Math.round((liveCount / 1000.0) * rate);
}

export function computeCocoonMetrics(batch: Batch, harvests: CocoonHarvest[]): CocoonMetrics {
  const batchHarvests = harvests.filter((h) => h.batchId === batch.id);

  if (batchHarvests.length === 0) {
    return {
      cocoonCount: 0,
      totalWeightGrams: 0,
      defectiveCount: 0,
      averageCocoonWeightGrams: 0,
      defectRatePercent: 0,
      shellRatioPercent: null,
      survivalPercent: 0,
      yieldPer100EggsGrams: 0,
      renditta: null,
      reelabilityPercent: null,
      commercialGrade: 'Ungraded',
    };
  }

  let cocoonCount = 0;
  let totalWeightGrams = 0;
  let defectiveCount = 0;
  let shellWeightSum = 0;
  let shellSamples = 0;
  let reeledWeightSum = 0;
  let breakCountSum = 0;
  let reeledSamples = 0;

  for (const h of batchHarvests) {
    cocoonCount += h.cocoonCount;
    totalWeightGrams += h.totalWeightGrams;
    defectiveCount += h.defectiveCount;

    if (h.shellWeightGrams && h.shellWeightGrams > 0) {
      shellWeightSum += h.shellWeightGrams;
      shellSamples++;
    }
    if (h.reeledWeightGrams && h.reeledWeightGrams > 0) {
      reeledWeightSum += h.reeledWeightGrams;
      reeledSamples++;
    }
    if (h.breakCount !== undefined) {
      breakCountSum += h.breakCount;
    }
  }

  const avgCocoonWeight = cocoonCount > 0 ? totalWeightGrams / cocoonCount : 0;
  const defectRate = cocoonCount > 0 ? (defectiveCount / cocoonCount) * 100 : 0;

  let shellRatio: number | null = null;
  if (shellSamples > 0 && avgCocoonWeight > 0) {
    // 20-cocoon shell sample calculation or single avg
    const sampleAvgShell = shellWeightSum / (shellSamples * 20); // 20 shells weighed together
    shellRatio = Math.min(100, Math.max(0, (sampleAvgShell / avgCocoonWeight) * 100));
  }

  const goodCocoons = Math.max(0, cocoonCount - defectiveCount);
  const survivalPercent = batch.eggCount > 0 ? (goodCocoons / batch.eggCount) * 100 : 0;
  const yieldPer100EggsGrams = batch.eggCount > 0 ? (totalWeightGrams / batch.eggCount) * 100 : 0;

  let renditta: number | null = null;
  if (reeledSamples > 0 && reeledWeightSum > 0) {
    renditta = Number((totalWeightGrams / reeledWeightSum).toFixed(2));
  } else if (shellRatio !== null && shellRatio > 0) {
    renditta = Number(Math.min(20, Math.max(4, 100.0 / (shellRatio * 0.8))).toFixed(2));
  }

  let reelability: number | null = null;
  if (cocoonCount > 0 && (reeledSamples > 0 || breakCountSum > 0)) {
    reelability = Number(
      Math.min(100, Math.max(0, (cocoonCount / (cocoonCount + breakCountSum)) * 100)).toFixed(1)
    );
  }

  let commercialGrade: 'Grade A' | 'Grade B' | 'Grade C' | 'Ungraded' = 'Ungraded';
  if (shellRatio !== null) {
    if (shellRatio >= 21.0 && defectRate <= 5.0) {
      commercialGrade = 'Grade A';
    } else if (shellRatio >= 17.0 && defectRate <= 10.0) {
      commercialGrade = 'Grade B';
    } else {
      commercialGrade = 'Grade C';
    }
  }

  return {
    cocoonCount,
    totalWeightGrams,
    defectiveCount,
    averageCocoonWeightGrams: Number(avgCocoonWeight.toFixed(2)),
    defectRatePercent: Number(defectRate.toFixed(1)),
    shellRatioPercent: shellRatio !== null ? Number(shellRatio.toFixed(1)) : null,
    survivalPercent: Number(survivalPercent.toFixed(1)),
    yieldPer100EggsGrams: Number(yieldPer100EggsGrams.toFixed(1)),
    renditta,
    reelabilityPercent: reelability,
    commercialGrade,
  };
}

export function calculateLeafCoverage(
  inventory: LeafInventory,
  activeBatches: Batch[],
  mortalityLogs: MortalityLog[]
): {
  totalStockKg: number;
  dailyNeedKg: number;
  daysOfCover: number;
  urgency: 'adequate' | 'warning' | 'critical';
} {
  const totalStockKg = inventory.mulberryKg + inventory.castorKg + inventory.kesseruKg;

  let dailyNeedGrams = 0;
  for (const b of activeBatches) {
    const live = getLiveLarvaeCount(b, mortalityLogs);
    const stage = getCurrentStage(b);
    dailyNeedGrams += getSuggestedDailyFeedGrams(b, live, stage);
  }

  if (activeBatches.length === 0 || dailyNeedGrams === 0) {
    return {
      totalStockKg: Number(totalStockKg.toFixed(1)),
      dailyNeedKg: 0,
      daysOfCover: 0,
      urgency: 'adequate',
    };
  }

  const dailyNeedKg = Math.max(0.1, dailyNeedGrams / 1000.0);
  const daysOfCover = Math.floor(totalStockKg / dailyNeedKg);

  let urgency: 'adequate' | 'warning' | 'critical' = 'adequate';
  if (daysOfCover <= 2) {
    urgency = 'critical';
  } else if (daysOfCover <= 5) {
    urgency = 'warning';
  }

  return {
    totalStockKg: Number(totalStockKg.toFixed(1)),
    dailyNeedKg: Number(dailyNeedKg.toFixed(1)),
    daysOfCover,
    urgency,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function isFedToday(batchId: string, feedLogs: FeedLog[], now = new Date()): boolean {
  const todayStr = now.toISOString().split('T')[0];
  return feedLogs.some((l) => l.batchId === batchId && l.recordedAt.startsWith(todayStr));
}

// Leaf Withering Index based on elapsed hours since harvest
export function calculateLeafWithering(
  harvestTimestamp?: string,
  cultivar = 'S-13'
): {
  elapsedHours: number;
  estimatedMoisturePct: number;
  status: 'fresh' | 'acceptable' | 'wilted_warning';
  warningMessage?: string;
} {
  if (!harvestTimestamp) {
    return {
      elapsedHours: 0,
      estimatedMoisturePct: 76,
      status: 'fresh',
    };
  }

  const harvestedAt = new Date(harvestTimestamp);
  const diffHours = Math.max(0, (Date.now() - harvestedAt.getTime()) / (1000 * 60 * 60));

  // Baseline initial moisture
  const initialMoisture = cultivar.includes('S-13') ? 78 : 74;
  // Withering rate: ~1.2% moisture loss per hour in tropical chamber conditions
  const moisture = Math.max(50, Number((initialMoisture - diffHours * 1.2).toFixed(1)));

  let status: 'fresh' | 'acceptable' | 'wilted_warning' = 'fresh';
  let warningMessage: string | undefined;

  if (diffHours >= 4 || moisture < 70) {
    status = 'wilted_warning';
    warningMessage = `Forage harvested ${diffHours.toFixed(1)}h ago (estimated moisture ${moisture}%). Re-hydrate by moistening covering gunny sheets or harvest fresh tender shoots.`;
  } else if (diffHours >= 2.5) {
    status = 'acceptable';
    warningMessage = `Harvested ${diffHours.toFixed(1)}h ago. Recommended to feed within 1.5 hours to retain tender leaf moisture for young larvae.`;
  }

  return {
    elapsedHours: Number(diffHours.toFixed(1)),
    estimatedMoisturePct: moisture,
    status,
    warningMessage,
  };
}

// Next Shift Ration Countdown Helper
export function getNextShiftSchedule(now = new Date()): {
  currentShift: 'morning' | 'midday' | 'evening' | 'night';
  nextRationName: string;
  nextRationHour: number;
  nextRationMinute: number;
  timeRemainingFormatted: string;
  isOverdue: boolean;
} {
  const h = now.getHours();
  const m = now.getMinutes();
  const currentMinutes = h * 60 + m;

  let targetMinutes: number;
  let nextRationName: string;
  let currentShift: 'morning' | 'midday' | 'evening' | 'night';

  if (currentMinutes < 420) {
    currentShift = 'night';
    nextRationName = 'Morning Rations (Dawn Leaf)';
    targetMinutes = 420;
  } else if (currentMinutes < 720) {
    currentShift = 'morning';
    nextRationName = 'Midday Microclimate & 2nd Feeding';
    targetMinutes = 720;
  } else if (currentMinutes < 1020) {
    currentShift = 'midday';
    nextRationName = 'Evening Rations (Bed Spacing)';
    targetMinutes = 1020;
  } else if (currentMinutes < 1290) {
    currentShift = 'evening';
    nextRationName = 'Overnight Rest & Moisture Buffer';
    targetMinutes = 1290;
  } else {
    currentShift = 'night';
    nextRationName = 'Dawn Morning Rations (Tomorrow)';
    targetMinutes = 420 + 24 * 60;
  }

  const diff = targetMinutes - currentMinutes;
  const remHours = Math.floor(diff / 60);
  const remMinutes = diff % 60;

  return {
    currentShift,
    nextRationName,
    nextRationHour: Math.floor((targetMinutes % (24 * 60)) / 60),
    nextRationMinute: targetMinutes % 60,
    timeRemainingFormatted: remHours > 0 ? `${remHours}h ${remMinutes}m` : `${remMinutes}m`,
    isOverdue: diff <= 15,
  };
}

