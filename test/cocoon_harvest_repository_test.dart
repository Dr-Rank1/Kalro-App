import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/cocoon_analytics_service.dart';

void main() {
  late Directory tempDir;
  late AppRepositories repositories;
  const analytics = CocoonAnalyticsService();

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_harvest_test');
    repositories = AppRepositories(storageDirectory: tempDir);
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('records harvest and computes metrics', () async {
    final batch = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime.now().subtract(const Duration(days: 40)),
      eggCount: 100,
    );

    await repositories.cocoonHarvests.create(
      batchId: batch.id,
      harvestDate: DateTime.now(),
      cocoonCount: 85,
      totalWeightGrams: 4250,
      defectiveCount: 5,
    );

    final harvests = await repositories.cocoonHarvests.getByBatchId(batch.id);
    final metrics = analytics.compute(batch, harvests);

    expect(metrics.cocoonCount, 85);
    expect(metrics.averageCocoonWeightGrams, closeTo(50, 0.1));
    expect(metrics.survivalPercent, closeTo(80, 0.1));
  });
}
