import 'batch.dart';

class CycleMemory {
  const CycleMemory({
    required this.batch,
    required this.survivalPercent,
    required this.liveCount,
    required this.feedGrams,
    required this.leafKg,
    required this.harvestKg,
    required this.harvestCount,
    this.harvestStart,
    this.harvestEnd,
    this.predictedHarvest,
    this.mothDate,
    this.eggCostKes,
    this.leafCostKes,
    this.cocoonValueKes,
  });

  final Batch batch;
  final double survivalPercent;
  final int liveCount;
  final double feedGrams;
  final double leafKg;
  final double harvestKg;
  final int harvestCount;
  final DateTime? harvestStart;
  final DateTime? harvestEnd;
  final DateTime? predictedHarvest;
  final DateTime? mothDate;
  final double? eggCostKes;
  final double? leafCostKes;
  final double? cocoonValueKes;

  double? get costKes {
    final egg = eggCostKes ?? 0;
    final leaf = leafCostKes ?? 0;
    if (eggCostKes == null && leafCostKes == null) return null;
    return egg + leaf;
  }

  double? get costPerKg {
    final cost = costKes;
    if (cost == null || harvestKg <= 0) return null;
    return cost / harvestKg;
  }

  int? get harvestShiftDays {
    if (harvestEnd == null || predictedHarvest == null) return null;
    final actual = DateTime(harvestEnd!.year, harvestEnd!.month, harvestEnd!.day);
    final typical = DateTime(
      predictedHarvest!.year,
      predictedHarvest!.month,
      predictedHarvest!.day,
    );
    return actual.difference(typical).inDays;
  }
}
