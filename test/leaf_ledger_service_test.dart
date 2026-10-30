import 'package:kalro/services/farm_store.dart';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/leaf_inventory.dart';
import 'package:kalro/models/leaf_movement.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/leaf_ledger_service.dart';

void main() {
  late Directory tempDir;
  late AppRepositories repositories;
  const ledger = LeafLedgerService();

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_leaf_ledger');
    repositories = AppRepositories(storageDirectory: tempDir);
  });

  tearDown(() async {
    await FarmStore.closeAll();
    if (tempDir.existsSync()) await tempDir.delete(recursive: true);
  });

  test('addStock writes movement and daysOfCover uses daily need', () async {
    await ledger.addStock(
      repositories: repositories,
      host: LeafHost.mulberry,
      kg: 4,
      kind: LeafMovementKind.bought,
    );
    final stock = await repositories.leafInventory.get();
    expect(stock.mulberryKg, 4);
    final rows = await repositories.leafMovements.getAll();
    expect(rows, hasLength(1));
    expect(rows.first.kind, LeafMovementKind.bought);
    expect(LeafLedgerService.daysOfCover(stockKg: 4, dailyNeedKg: 2), 2);
  });

  test('feed deduction and manual adjust write ledger rows', () async {
    await repositories.leafInventory.save(
      LeafInventory(
        mulberryKg: 3,
        castorKg: 1,
        kesseruKg: 1,
        updatedAt: DateTime.now(),
      ),
    );
    await ledger.recordFeedDeduction(
      repositories: repositories,
      species: Species.bombyx,
      kg: 0.5,
      batchId: 'b1',
    );
    final afterFeed = await repositories.leafInventory.get();
    expect(afterFeed.mulberryKg, closeTo(2.5, 0.001));
    await ledger.recordStockAdjust(
      repositories: repositories,
      previous: afterFeed,
      next: afterFeed.copyWith(mulberryKg: 5),
    );
    final rows = await repositories.leafMovements.getAll();
    expect(rows.where((m) => m.kind == LeafMovementKind.feed), isNotEmpty);
    expect(rows.where((m) => m.kind == LeafMovementKind.adjust), isNotEmpty);
  });

  test('calculateDepletionForecast projects multi-day demand and urgency', () async {
    final batch = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime.now().subtract(const Duration(days: 15)),
      eggCount: 1000,
    );

    // 0 stock should be exhausted
    final zeroForecast = ledger.calculateDepletionForecast(
      currentStockKg: 0,
      activeBatches: [batch],
    );
    expect(zeroForecast.urgency, DepletionUrgency.exhausted);
    expect(zeroForecast.daysUntilDepletion, 0);

    // Sufficient stock should be safe
    final safeForecast = ledger.calculateDepletionForecast(
      currentStockKg: 50.0,
      activeBatches: [batch],
    );
    expect(safeForecast.urgency, DepletionUrgency.safe);
    expect(safeForecast.daysUntilDepletion, greaterThanOrEqualTo(7));
  });
}
