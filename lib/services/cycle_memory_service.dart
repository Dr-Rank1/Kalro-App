import '../models/batch.dart';
import '../models/cocoon_harvest.dart';
import '../models/cycle_memory.dart';
import '../models/feed_log.dart';
import '../models/inventory_settings.dart';
import '../models/lifecycle_milestone.dart';
import '../models/mortality_log.dart';
import '../models/purchase_order.dart';
import 'batch_metrics_service.dart';
import 'lifecycle_engine.dart';

class CycleMemoryService {
  const CycleMemoryService({
    BatchMetricsService? metrics,
    LifecycleEngine? engine,
  })  : _metrics = metrics ?? const BatchMetricsService(),
        _engine = engine ?? const LifecycleEngine();

  final BatchMetricsService _metrics;
  final LifecycleEngine _engine;

  CycleMemory build({
    required Batch batch,
    required List<FeedLog> feedLogs,
    required List<MortalityLog> mortalityLogs,
    required List<CocoonHarvest> harvests,
    required List<PurchaseOrder> purchases,
    required InventorySettings prices,
    Map<String, DateTime>? observedStageDates,
  }) {
    final deaths = mortalityLogs
        .where((l) => l.batchId == batch.id)
        .fold<int>(0, (sum, l) => sum + l.count);
    final metrics = _metrics.compute(batch, deaths);
    final feedGrams = feedLogs
        .where((l) => l.batchId == batch.id)
        .fold<double>(0, (sum, l) => sum + l.quantityGrams);
    final batchHarvests = harvests.where((h) => h.batchId == batch.id).toList()
      ..sort((a, b) => a.harvestDate.compareTo(b.harvestDate));
    final harvestKg = batchHarvests.fold<double>(
          0,
          (sum, h) => sum + h.totalWeightGrams,
        ) /
        1000;
    DateTime? harvestStart;
    DateTime? harvestEnd;
    if (batchHarvests.isNotEmpty) {
      harvestStart = _dateOnly(batchHarvests.first.harvestDate);
      harvestEnd = _dateOnly(batchHarvests.last.harvestDate);
    }

    final milestones = _engine.predict(
      batch,
      observedStageDates: observedStageDates,
    );
    LifecycleMilestone? harvestMs;
    LifecycleMilestone? mothMs;
    for (final m in milestones) {
      if (m.type == MilestoneType.cocoonHarvest) harvestMs = m;
      if (m.type == MilestoneType.mothEmergence) mothMs = m;
    }

    final eggCost = _eggCost(batch, purchases);
    final leafCost = _leafCost(batch, purchases, harvestEnd);
    final price =
        batch.species.name == 'bombyx' ? prices.bombyxPrice : prices.eriPrice;
    final cocoonValue = harvestKg > 0 ? harvestKg * price : null;

    return CycleMemory(
      batch: batch,
      survivalPercent: metrics.survivalRatePercent,
      liveCount: metrics.liveCount,
      feedGrams: feedGrams,
      leafKg: feedGrams / 1000,
      harvestKg: harvestKg,
      harvestCount: batchHarvests.fold<int>(0, (sum, h) => sum + h.cocoonCount),
      harvestStart: harvestStart,
      harvestEnd: harvestEnd,
      predictedHarvest: harvestMs?.typicalDate ?? harvestMs?.expectedDate,
      mothDate: mothMs?.effectiveDate,
      eggCostKes: eggCost,
      leafCostKes: leafCost,
      cocoonValueKes: cocoonValue,
    );
  }

  double? _eggCost(Batch batch, List<PurchaseOrder> purchases) {
    final candidates = purchases.where((p) {
      if (p.amount == null || p.amount! <= 0) return false;
      if (p.species != null && p.species != batch.species) return false;
      if (!_looksLikeEggs(p.itemDescription)) return false;
      final delta = p.orderedAt.difference(batch.startDate).inDays.abs();
      return delta <= 21;
    }).toList()
      ..sort(
        (a, b) => a.orderedAt
            .difference(batch.startDate)
            .inDays
            .abs()
            .compareTo(b.orderedAt.difference(batch.startDate).inDays.abs()),
      );
    if (candidates.isEmpty) return null;
    final order = candidates.first;
    if (order.quantity > 0) {
      return order.amount! * (batch.eggCount / order.quantity);
    }
    return order.amount;
  }

  double? _leafCost(Batch batch, List<PurchaseOrder> purchases, DateTime? harvestEnd) {
    final end = harvestEnd ?? DateTime.now();
    var total = 0.0;
    var any = false;
    for (final p in purchases) {
      if (p.amount == null || p.amount! <= 0) continue;
      if (p.species != null && p.species != batch.species) continue;
      if (!_looksLikeLeaf(p.itemDescription)) continue;
      if (p.orderedAt.isBefore(batch.startDate.subtract(const Duration(days: 7)))) {
        continue;
      }
      if (p.orderedAt.isAfter(end.add(const Duration(days: 3)))) continue;
      total += p.amount!;
      any = true;
    }
    return any ? total : null;
  }

  bool _looksLikeEggs(String item) {
    final t = item.toLowerCase();
    return t.contains('egg') ||
        t.contains('seed') ||
        t.contains('dfl') ||
        t.contains('laying') ||
        t.contains('mayai');
  }

  bool _looksLikeLeaf(String item) {
    final t = item.toLowerCase();
    return t.contains('leaf') ||
        t.contains('mulberry') ||
        t.contains('castor') ||
        t.contains('kesseru') ||
        t.contains('majani') ||
        t.contains('mforosadi') ||
        t.contains('mbarika');
  }

  DateTime _dateOnly(DateTime d) => DateTime(d.year, d.month, d.day);
}
