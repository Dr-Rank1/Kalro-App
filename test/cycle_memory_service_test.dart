import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/cycle_memory_service.dart';

void main() {
  late Directory tempDir;
  late AppRepositories repositories;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_cycle_memory');
    repositories = AppRepositories(storageDirectory: tempDir);
  });

  tearDown(() async {
    if (tempDir.existsSync()) await tempDir.delete(recursive: true);
  });

  test('builds harvest, survival, and egg cost from nearby purchases', () async {
    final batch = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime.now().subtract(const Duration(days: 40)),
      eggCount: 100,
    );
    await repositories.mortalityLogs.create(
      batchId: batch.id,
      recordedAt: DateTime.now().subtract(const Duration(days: 10)),
      count: 10,
    );
    await repositories.feedLogs.create(
      batchId: batch.id,
      recordedAt: DateTime.now().subtract(const Duration(days: 8)),
      feedType: 'Mulberry',
      quantityGrams: 2500,
    );
    await repositories.cocoonHarvests.create(
      batchId: batch.id,
      harvestDate: DateTime.now().subtract(const Duration(days: 1)),
      cocoonCount: 80,
      totalWeightGrams: 4000,
    );
    final producer = (await repositories.producers.getAll()).first;
    await repositories.purchaseOrders.create(
      producerId: producer.id,
      producerName: producer.name,
      itemDescription: 'DFL eggs',
      quantity: 100,
      unit: 'eggs',
      orderedAt: batch.startDate,
      amount: 2000,
      species: Species.bombyx,
    );
    await repositories.purchaseOrders.create(
      producerId: producer.id,
      producerName: producer.name,
      itemDescription: 'Mulberry leaf',
      quantity: 10,
      unit: 'kg',
      orderedAt: batch.startDate.add(const Duration(days: 5)),
      amount: 500,
      species: Species.bombyx,
    );

    final memory = CycleMemoryService().build(
      batch: batch,
      feedLogs: await repositories.feedLogs.getAll(),
      mortalityLogs: await repositories.mortalityLogs.getAll(),
      harvests: await repositories.cocoonHarvests.getAll(),
      purchases: await repositories.purchaseOrders.getAll(),
      prices: await repositories.inventorySettings.get(),
    );

    expect(memory.liveCount, 90);
    expect(memory.survivalPercent, closeTo(90, 0.01));
    expect(memory.harvestKg, closeTo(4, 0.01));
    expect(memory.leafKg, closeTo(2.5, 0.01));
    expect(memory.eggCostKes, closeTo(2000, 0.01));
    expect(memory.leafCostKes, closeTo(500, 0.01));
    expect(memory.costPerKg, closeTo(625, 0.01));
  });
}
