import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/leaf_inventory.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/floor_log_service.dart';
import 'package:kalro/services/rearing_day_service.dart';

void main() {
  late Directory tempDir;
  late AppRepositories repositories;
  const floor = FloorLogService();
  const days = RearingDayService();

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_floor');
    repositories = AppRepositories(storageDirectory: tempDir);
  });

  tearDown(() async {
    if (tempDir.existsSync()) await tempDir.delete(recursive: true);
  });

  test('suggested feed deducts mulberry stock', () async {
    final batch = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime.now().subtract(const Duration(days: 20)),
      eggCount: 100,
    );
    await repositories.leafInventory.save(
      LeafInventory(
        mulberryKg: 5,
        castorKg: 0,
        kesseruKg: 0,
        updatedAt: DateTime.now(),
      ),
    );
    final plan = days.planFor(batch, liveCount: 100);
    expect(plan, isNotNull);
    if (plan!.suggestedGrams <= 0) {
      return; // rest/harvest day — skip deduct assertion
    }
    final ok = await floor.logSuggestedFeed(
      repositories: repositories,
      batch: batch,
      plan: plan,
    );
    expect(ok, isTrue);
    final feeds = await repositories.feedLogs.getByBatchId(batch.id);
    expect(feeds, isNotEmpty);
    expect(feeds.first.quantityGrams, plan.suggestedGrams);
    final stock = await repositories.leafInventory.get();
    expect(stock.mulberryKg, lessThan(5));
  });

  test('eri feed deducts castor before kesseru', () async {
    await repositories.leafInventory.save(
      LeafInventory(
        mulberryKg: 0,
        castorKg: 0.2,
        kesseruKg: 2,
        updatedAt: DateTime.now(),
      ),
    );
    await floor.deductLeafKg(
      repositories: repositories,
      species: Species.eri,
      kg: 0.5,
    );
    final stock = await repositories.leafInventory.get();
    expect(stock.castorKg, 0);
    expect(stock.kesseruKg, closeTo(1.7, 0.001));
  });

  test('house feel stores temperature and humidity', () async {
    final batch = await repositories.batches.create(
      species: Species.eri,
      startDate: DateTime.now(),
      eggCount: 40,
    );
    await floor.logHouseFeel(
      repositories: repositories,
      batchId: batch.id,
      feel: FloorLogService.hotWet,
    );
    final logs = await repositories.environmentLogs.getByBatchId(batch.id);
    expect(logs.single.temperatureCelsius, 32);
    expect(logs.single.humidityPercent, 90);
  });
}
