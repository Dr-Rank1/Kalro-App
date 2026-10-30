import '../models/batch.dart';
import '../models/cocoon_harvest.dart';
import '../models/cocoon_metrics.dart';

class CocoonAnalyticsService {
  const CocoonAnalyticsService();

  CocoonMetrics compute(Batch batch, List<CocoonHarvest> harvests) {
    if (harvests.isEmpty) {
      return const CocoonMetrics(
        cocoonCount: 0,
        totalWeightGrams: 0,
        defectiveCount: 0,
        averageCocoonWeightGrams: 0,
        defectRatePercent: 0,
        shellRatioPercent: null,
        survivalPercent: 0,
        yieldPer100EggsGrams: 0,
        commercialGrade: 'Ungraded',
      );
    }

    var cocoonCount = 0;
    var totalWeight = 0.0;
    var defectiveCount = 0;
    var shellWeight = 0.0;
    var shellSamples = 0;
    var doubleCount = 0;
    var uziCount = 0;
    var stainedCount = 0;
    var flimsyCount = 0;
    var meltedCount = 0;
    var totalReeledWeight = 0.0;
    var totalBreaks = 0;
    var reelSamples = 0;

    for (final harvest in harvests) {
      cocoonCount += harvest.cocoonCount;
      totalWeight += harvest.totalWeightGrams;
      defectiveCount += harvest.defectiveCount;
      doubleCount += harvest.doubleCount ?? 0;
      uziCount += harvest.uziCount ?? 0;
      stainedCount += harvest.stainedCount ?? 0;
      flimsyCount += harvest.flimsyCount ?? 0;
      meltedCount += harvest.meltedCount ?? 0;
      if (harvest.shellWeightGrams != null) {
        shellWeight += harvest.shellWeightGrams!;
        shellSamples++;
      }
      if (harvest.reeledWeightGrams != null && harvest.reeledWeightGrams! > 0) {
        totalReeledWeight += harvest.reeledWeightGrams!;
        reelSamples++;
      }
      if (harvest.breakCount != null) {
        totalBreaks += harvest.breakCount!;
      }
    }

    final goodCount = (cocoonCount - defectiveCount).clamp(0, cocoonCount);
    final avgWeight = cocoonCount > 0 ? totalWeight / cocoonCount : 0.0;
    final defectRate =
        cocoonCount > 0 ? (defectiveCount / cocoonCount) * 100 : 0.0;
    double? shellRatio;
    if (shellSamples > 0 && avgWeight > 0) {
      final avgShellWeight = shellWeight / shellSamples;
      shellRatio = ((avgShellWeight / avgWeight) * 100).clamp(0.0, 100.0);
    }
    final survival =
        batch.eggCount > 0 ? (goodCount / batch.eggCount) * 100 : 0.0;
    final yieldPer100 =
        batch.eggCount > 0 ? (totalWeight / batch.eggCount) * 100 : 0.0;

    double? renditta;
    if (totalReeledWeight > 0) {
      renditta = totalWeight / totalReeledWeight;
    } else if (shellRatio != null && shellRatio > 0) {
      renditta = (100.0 / (shellRatio * 0.80)).clamp(4.0, 20.0);
    }

    double? reelability;
    if (cocoonCount > 0 && (reelSamples > 0 || totalBreaks > 0)) {
      reelability =
          ((cocoonCount / (cocoonCount + totalBreaks)) * 100).clamp(0.0, 100.0);
    }

    String grade = 'Ungraded';
    if (shellRatio != null) {
      if (shellRatio >= 21.0 && defectRate <= 5.0) {
        grade = 'Grade A';
      } else if (shellRatio >= 17.0 && defectRate <= 10.0) {
        grade = 'Grade B';
      } else {
        grade = 'Grade C';
      }
    }

    return CocoonMetrics(
      cocoonCount: cocoonCount,
      totalWeightGrams: totalWeight,
      defectiveCount: defectiveCount,
      averageCocoonWeightGrams: avgWeight,
      defectRatePercent: defectRate,
      shellRatioPercent: shellRatio,
      survivalPercent: survival,
      yieldPer100EggsGrams: yieldPer100,
      renditta: renditta,
      reelabilityPercent: reelability,
      commercialGrade: grade,
      doubleCount: doubleCount,
      uziCount: uziCount,
      stainedCount: stainedCount,
      flimsyCount: flimsyCount,
      meltedCount: meltedCount,
    );
  }
}
