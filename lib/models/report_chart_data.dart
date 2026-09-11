class ChartPoint {
  const ChartPoint({required this.label, required this.value});

  final String label;
  final double value;
}

class BatchComparisonRow {
  const BatchComparisonRow({
    required this.batchId,
    required this.speciesLabel,
    required this.startDateLabel,
    required this.startingCount,
    required this.liveCount,
    required this.survivalPercent,
    required this.totalFeedGrams,
    required this.harvestWeightGrams,
    required this.statusLabel,
  });

  final String batchId;
  final String speciesLabel;
  final String startDateLabel;
  final int startingCount;
  final int liveCount;
  final double survivalPercent;
  final double totalFeedGrams;
  final double harvestWeightGrams;
  final String statusLabel;
}

class ReportChartData {
  const ReportChartData({
    required this.feedTrend,
    required this.mortalityTrend,
    required this.bombyxLarvae,
    required this.eriLarvae,
    required this.batchComparisons,
  });

  final List<ChartPoint> feedTrend;
  final List<ChartPoint> mortalityTrend;
  final int bombyxLarvae;
  final int eriLarvae;
  final List<BatchComparisonRow> batchComparisons;

  bool get hasFeedTrend => feedTrend.any((p) => p.value > 0);
  bool get hasMortalityTrend => mortalityTrend.any((p) => p.value > 0);
  bool get hasSpeciesSplit => bombyxLarvae + eriLarvae > 0;
}
