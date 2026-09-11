import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/app_repositories.dart';

void main() {
  late Directory tempDir;
  late AppRepositories repositories;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_env_test');
    repositories = AppRepositories(storageDirectory: tempDir);
  });

  tearDown(() async {
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
}
