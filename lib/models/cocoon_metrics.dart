class CocoonMetrics {
  const CocoonMetrics({
    required this.cocoonCount,
    required this.totalWeightGrams,
    required this.defectiveCount,
    required this.averageCocoonWeightGrams,
    required this.defectRatePercent,
    required this.shellRatioPercent,
    required this.survivalPercent,
    required this.yieldPer100EggsGrams,
  });

  final int cocoonCount;
  final double totalWeightGrams;
  final int defectiveCount;
  final double averageCocoonWeightGrams;
  final double defectRatePercent;
  final double? shellRatioPercent;
  final double survivalPercent;
  final double yieldPer100EggsGrams;
}
