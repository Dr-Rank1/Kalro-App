import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/batch_status.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/inventory_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late AppRepositories repositories;
  const inventoryService = InventoryService();

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_inventory_service_test');
    repositories = AppRepositories(storageDirectory: tempDir);
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('summary aggregates larvae, feed, and settings', () async {
    final bombyx = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime(2026, 3, 1),
      eggCount: 200,
    );
    await repositories.batches.create(
      species: Species.eri,
      startDate: DateTime(2026, 3, 2),
      eggCount: 80,
    );

    await repositories.feedLogs.create(
      batchId: bombyx.id,
      recordedAt: DateTime(2026, 3, 3),
      feedType: 'Mulberry',
      quantityGrams: 1500,
    );

    await repositories.inventorySettings.update(bombyxPrice: 7000);

    final summary = await inventoryService.load(repositories);

    expect(summary.bombyxLarvaeCount, 200);
    expect(summary.eriLarvaeCount, 80);
    expect(summary.bombyxFeedGrams, 1500);
    expect(summary.activeBatchCount, 2);
    expect(summary.settings.bombyxPrice, 7000);
    expect(summary.batches, hasLength(2));
  });

  test('closed batches are excluded from active stock counts', () async {
    final batch = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime(2026, 3, 1),
      eggCount: 100,
    );
    await repositories.batches.update(
      batch.copyWith(status: BatchStatus.closed),
    );

    final summary = await inventoryService.load(repositories);

    expect(summary.bombyxLarvaeCount, 0);
    expect(summary.activeBatchCount, 0);
  });
}
