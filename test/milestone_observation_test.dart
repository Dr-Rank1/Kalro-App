import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/lifecycle_engine.dart';

void main() {
  late Directory tempDir;
  late AppRepositories repositories;
  const engine = LifecycleEngine();

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_milestone_test');
    repositories = AppRepositories(storageDirectory: tempDir);
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('observed stage shifts subsequent milestone dates', () async {
    final batch = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime(2025, 1, 1),
      eggCount: 100,
    );

    final baseline = engine.predict(batch);
    final firstInstarBaseline = baseline.firstWhere((m) => m.stageKey == 'instar1');

    final observedDate = batch.startDate.add(const Duration(days: 20));
    await repositories.milestoneObservations.record(
      batchId: batch.id,
      stageKey: 'instar1',
      observedDate: observedDate,
    );

    final observations =
        await repositories.milestoneObservations.stageDatesForBatch(batch.id);
    final adjusted = engine.predict(batch, observedStageDates: observations);
    final firstInstarAdjusted =
        adjusted.firstWhere((m) => m.stageKey == 'instar1');

    expect(firstInstarAdjusted.observedDate, observedDate);
    expect(
      firstInstarAdjusted.expectedDate.isAfter(firstInstarBaseline.expectedDate),
      isTrue,
    );
  });
}
