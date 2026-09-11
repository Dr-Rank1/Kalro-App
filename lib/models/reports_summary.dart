class ReportsSummary {
  const ReportsSummary({
    required this.orgName,
    required this.generatedAt,
    required this.totalBatches,
    required this.activeBatches,
    required this.closedBatches,
    required this.bombyxLarvae,
    required this.eriLarvae,
    required this.totalFeedGrams,
    required this.feedLogCount,
    required this.totalReceivable,
    required this.totalPayable,
    required this.purchaseSpend,
    required this.purchaseOrderCount,
    required this.settledPayments,
    required this.pendingPayments,
    required this.upcomingMilestones,
    required this.totalMortality,
    required this.averageSurvivalPercent,
    required this.totalHarvestWeightGrams,
    required this.harvestCount,
  });

  final String orgName;
  final DateTime generatedAt;
  final int totalBatches;
  final int activeBatches;
  final int closedBatches;
  final int bombyxLarvae;
  final int eriLarvae;
  final double totalFeedGrams;
  final int feedLogCount;
  final double totalReceivable;
  final double totalPayable;
  final double purchaseSpend;
  final int purchaseOrderCount;
  final int settledPayments;
  final int pendingPayments;
  final int upcomingMilestones;
  final int totalMortality;
  final double averageSurvivalPercent;
  final double totalHarvestWeightGrams;
  final int harvestCount;
}
