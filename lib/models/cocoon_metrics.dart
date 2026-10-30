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
    this.renditta,
    this.reelabilityPercent,
    this.commercialGrade = 'Ungraded',
    this.doubleCount = 0,
    this.uziCount = 0,
    this.stainedCount = 0,
    this.flimsyCount = 0,
    this.meltedCount = 0,
  });

  final int cocoonCount;
  final double totalWeightGrams;
  final int defectiveCount;
  final double averageCocoonWeightGrams;
  final double defectRatePercent;
  final double? shellRatioPercent;
  final double survivalPercent;
  final double yieldPer100EggsGrams;
  final double? renditta;
  final double? reelabilityPercent;
  final String commercialGrade;
  final int doubleCount;
  final int uziCount;
  final int stainedCount;
  final int flimsyCount;
  final int meltedCount;
}
