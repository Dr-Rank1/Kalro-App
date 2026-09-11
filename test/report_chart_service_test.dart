import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/report_chart_service.dart';

void main() {
  late Directory tempDir;
  late AppRepositories repositories;
  const chartService = ReportChartService();

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_chart_test');
    repositories = AppRepositories(storageDirectory: tempDir);
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('builds feed trend and batch comparison data', () async {
    final batch = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime.now().subtract(const Duration(days: 5)),
      eggCount: 100,
    );

    await repositories.feedLogs.create(
      batchId: batch.id,
      recordedAt: DateTime.now(),
      feedType: 'Mulberry',
      quantityGrams: 300,
    );

    await repositories.mortalityLogs.create(
      batchId: batch.id,
      recordedAt: DateTime.now(),
      count: 5,
    );

    final charts = await chartService.load(repositories);

    expect(charts.feedTrend, hasLength(14));
    expect(charts.feedTrend.last.value, 300);
    expect(charts.mortalityTrend.last.value, 5);
    expect(charts.batchComparisons, hasLength(1));
    expect(charts.batchComparisons.first.liveCount, 95);
  });
}
