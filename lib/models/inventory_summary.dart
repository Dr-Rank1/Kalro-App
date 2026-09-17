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
    this.mulberryNeededKg = 0,
    this.eriLeafNeededKg = 0,
    this.mulberryStockKg = 0,
    this.castorStockKg = 0,
    this.kesseruStockKg = 0,
    this.leafNeedTodayKg = 0,
  });

  final int bombyxLarvaeCount;
  final int eriLarvaeCount;
  final double bombyxFeedGrams;
  final double eriFeedGrams;
  final int activeBatchCount;
  final InventorySettings settings;
  final List<Batch> batches;
  final double mulberryNeededKg;
  final double eriLeafNeededKg;
  final double mulberryStockKg;
  final double castorStockKg;
  final double kesseruStockKg;
  final double leafNeedTodayKg;

  double get eriStockKg => castorStockKg + kesseruStockKg;

  double get leafStockKg => mulberryStockKg + eriStockKg;
}
