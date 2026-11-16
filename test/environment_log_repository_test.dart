import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/environment_log.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/farm_store.dart';

void main() {
  late Directory tempDir;
  late AppRepositories repositories;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_env_test');
    repositories = AppRepositories(storageDirectory: tempDir);
  });

  tearDown(() async {
    await FarmStore.closeAll();
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('stores environment readings per batch', () async {
    final batch = await repositories.batches.create(
      species: Species.eri,
      startDate: DateTime.now(),
      eggCount: 80,
    );

    await repositories.environmentLogs.create(
      batchId: batch.id,
      recordedAt: DateTime.now(),
      temperatureCelsius: 26.5,
      humidityPercent: 72,
    );

    final latest = await repositories.environmentLogs.latestForBatch(batch.id);
    expect(latest, isNotNull);
    expect(latest!.temperatureCelsius, 26.5);
    expect(latest.humidityPercent, 72);
  });

  test('insertAll bulk writes high-frequency BLE telemetry in a single transaction', () async {
    final batch = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime.now(),
      eggCount: 150,
    );

    final telemetryLogs = List.generate(
      24,
      (i) => EnvironmentLog(
        id: 'telemetry-$i',
        batchId: batch.id,
        recordedAt: DateTime(2026, 11, 16, i ~/ 4, (i % 4) * 15),
        temperatureCelsius: 25.0 + (i * 0.05),
        humidityPercent: 70.0 + (i * 0.1),
      ),
    );

    await repositories.environmentLogs.insertAll(telemetryLogs);

    final recentLogs = await repositories.environmentLogs.getByBatchId(batch.id, limit: 10);
    expect(recentLogs, hasLength(10));
    // Verify descending order by recordedAt
    expect(recentLogs.first.id, equals('telemetry-23'));
    expect(recentLogs[1].id, equals('telemetry-22'));
  });
}
