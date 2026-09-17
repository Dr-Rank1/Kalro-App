import '../models/batch_status.dart';
import '../models/inventory_summary.dart';
import '../models/species.dart';
import 'app_repositories.dart';
import 'batch_metrics_service.dart';
import 'rearing_day_service.dart';

class InventoryService {
  const InventoryService({RearingDayService? rearingDay})
      : _rearingDay = rearingDay ?? const RearingDayService();

  final RearingDayService _rearingDay;

  Future<InventorySummary> load(AppRepositories repositories) async {
    final batches = await repositories.batches.getAll();
    final feedLogs = await repositories.feedLogs.getAll();
    final settings = await repositories.inventorySettings.get();

    final batchSpecies = <String, Species>{};
    for (final batch in batches) {
      batchSpecies[batch.id] = batch.species;
    }

    var bombyxLarvae = 0;
    var eriLarvae = 0;
    var activeCount = 0;
    var bombyxFeed = 0.0;
    var eriFeed = 0.0;

    for (final batch in batches) {
      if (batch.status == BatchStatus.closed) continue;
      activeCount++;
      if (batch.species == Species.bombyx) {
        bombyxLarvae += batch.eggCount;
      } else {
        eriLarvae += batch.eggCount;
      }
    }

    for (final log in feedLogs) {
      final species = batchSpecies[log.batchId];
      if (species == Species.bombyx) {
        bombyxFeed += log.quantityGrams;
      } else if (species == Species.eri) {
        eriFeed += log.quantityGrams;
      }
    }

    var mulberryNeed = 0.0;
    var eriNeed = 0.0;
    var todayNeed = 0.0;
    final mortality = await repositories.mortalityLogs.getAll();
    const metrics = BatchMetricsService();
    for (final batch in batches) {
      if (batch.status == BatchStatus.closed) continue;
      final kg = _rearingDay.remainingLeafKg(batch);
      if (batch.species == Species.bombyx) {
        mulberryNeed += kg;
      } else {
        eriNeed += kg;
      }
      final deaths = mortality
          .where((l) => l.batchId == batch.id)
          .fold<int>(0, (sum, l) => sum + l.count);
      final plan = _rearingDay.planFor(
        batch,
        liveCount: metrics.compute(batch, deaths).liveCount,
      );
      todayNeed += (plan?.suggestedGrams ?? 0) / 1000;
    }

    final leaf = await repositories.leafInventory.get();

    final sortedBatches = [...batches]
      ..sort((a, b) => b.startDate.compareTo(a.startDate));

    return InventorySummary(
      bombyxLarvaeCount: bombyxLarvae,
      eriLarvaeCount: eriLarvae,
      bombyxFeedGrams: bombyxFeed,
      eriFeedGrams: eriFeed,
      activeBatchCount: activeCount,
      settings: settings,
      batches: sortedBatches,
      mulberryNeededKg: mulberryNeed,
      eriLeafNeededKg: eriNeed,
      mulberryStockKg: leaf.mulberryKg,
      castorStockKg: leaf.castorKg,
      kesseruStockKg: leaf.kesseruKg,
      leafNeedTodayKg: todayNeed,
    );
  }
}
