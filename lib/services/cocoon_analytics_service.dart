import '../models/batch.dart';
import '../models/cocoon_harvest.dart';
import '../models/cocoon_metrics.dart';

class CocoonAnalyticsService {
  const CocoonAnalyticsService();

  CocoonMetrics compute(Batch batch, List<CocoonHarvest> harvests) {
    if (harvests.isEmpty) {
      return CocoonMetrics(
        cocoonCount: 0,
        totalWeightGrams: 0,
        defectiveCount: 0,
        averageCocoonWeightGrams: 0,
        defectRatePercent: 0,
        shellRatioPercent: null,
        survivalPercent: 0,
        yieldPer100EggsGrams: 0,
      );
    }

    var cocoonCount = 0;
    var totalWeight = 0.0;
    var defectiveCount = 0;
    var shellWeight = 0.0;
    var shellSamples = 0;

    for (final harvest in harvests) {
      cocoonCount += harvest.cocoonCount;
      totalWeight += harvest.totalWeightGrams;
      defectiveCount += harvest.defectiveCount;
      if (harvest.shellWeightGrams != null) {
        shellWeight += harvest.shellWeightGrams!;
        shellSamples++;
      }
    }

    final goodCount = cocoonCount - defectiveCount;
    final avgWeight = cocoonCount > 0 ? totalWeight / cocoonCount : 0.0;
    final defectRate =
        cocoonCount > 0 ? (defectiveCount / cocoonCount) * 100 : 0.0;
    final shellRatio = shellSamples > 0 ? (shellWeight / shellSamples) : null;
    final survival =
        batch.eggCount > 0 ? (goodCount / batch.eggCount) * 100 : 0.0;
    final yieldPer100 =
        batch.eggCount > 0 ? (totalWeight / batch.eggCount) * 100 : 0.0;

    return CocoonMetrics(
      cocoonCount: cocoonCount,
      totalWeightGrams: totalWeight,
      defectiveCount: defectiveCount,
      averageCocoonWeightGrams: avgWeight,
      defectRatePercent: defectRate,
      shellRatioPercent: shellRatio,
      survivalPercent: survival,
      yieldPer100EggsGrams: yieldPer100,
    );
  }
}
