import 'batch.dart';
import 'inventory_settings.dart';

class InventorySummary {
  const InventorySummary({
    required this.bombyxLarvaeCount,
    required this.eriLarvaeCount,
    required this.bombyxFeedGrams,
    required this.eriFeedGrams,
    required this.activeBatchCount,
    required this.settings,
    required this.batches,
  });

  final int bombyxLarvaeCount;
  final int eriLarvaeCount;
  final double bombyxFeedGrams;
  final double eriFeedGrams;
  final int activeBatchCount;
  final InventorySettings settings;
  final List<Batch> batches;
}
