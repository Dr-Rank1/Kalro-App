import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/app_repositories.dart';

void main() {
  late Directory tempDir;
  late AppRepositories repositories;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_mortality_test');
    repositories = AppRepositories(storageDirectory: tempDir);
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('creates and totals mortality for a batch', () async {
    final batch = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime.now(),
      eggCount: 100,
    );

    await repositories.mortalityLogs.create(
      batchId: batch.id,
      recordedAt: DateTime.now(),
      count: 3,
      disease: 'Pebrine',
    );
    await repositories.mortalityLogs.create(
      batchId: batch.id,
      recordedAt: DateTime.now(),
      count: 2,
    );

    final total =
        await repositories.mortalityLogs.totalMortalityForBatch(batch.id);
    expect(total, 5);

    final logs = await repositories.mortalityLogs.getByBatchId(batch.id);
    expect(logs, hasLength(2));
  });
}
