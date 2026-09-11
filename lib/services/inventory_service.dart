import '../models/batch_status.dart';
import '../models/inventory_summary.dart';
import '../models/species.dart';
import 'app_repositories.dart';

class InventoryService {
  const InventoryService();

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
    );
  }
}
