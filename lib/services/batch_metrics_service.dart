import '../models/batch.dart';

class BatchMetrics {
  const BatchMetrics({
    required this.startingCount,
    required this.totalMortality,
    required this.liveCount,
    required this.survivalRatePercent,
  });

  final int startingCount;
  final int totalMortality;
  final int liveCount;
  final double survivalRatePercent;
}

class BatchMetricsService {
  const BatchMetricsService();

  BatchMetrics compute(Batch batch, int totalMortality) {
    final starting = batch.eggCount;
    final live = (starting - totalMortality).clamp(0, starting);
    final survival = starting > 0 ? (live / starting) * 100 : 0.0;
    return BatchMetrics(
      startingCount: starting,
      totalMortality: totalMortality,
      liveCount: live,
      survivalRatePercent: survival,
    );
  }
}
