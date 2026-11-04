import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/leaf_inventory.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/screens/create_batch_screen.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/dashboard_service.dart';
import 'package:kalro/services/user_preferences.dart';
import 'package:kalro/services/farm_store.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:kalro/services/floor_log_service.dart';
import 'package:kalro/services/rearing_day_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late AppRepositories repositories;
  const rearingDay = RearingDayService();
  const floor = FloorLogService();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    tempDir = await Directory.systemTemp.createTemp('kalro_batch_flow_test');
    repositories = AppRepositories(storageDirectory: tempDir);
  });

  tearDown(() async {
    await FarmStore.closeAll();
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('hatched 1st instar batch starts in active feeding stage today, not rest day', () async {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    const stage = BatchStartingStage.hatchedInstar1;
    final pastDays = stage.pastDaysFor(Species.bombyx);
    expect(pastDays, 12);

    final effectiveStartDate = today.subtract(Duration(days: pastDays));

    final batch = await repositories.batches.create(
      species: Species.bombyx,
      startDate: effectiveStartDate,
      eggCount: 400,
      batchTag: 'BATCH-2026-11-BOM-01',
    );

    final plan = rearingDay.planFor(batch, now: today);
    expect(plan, isNotNull);
    expect(plan!.stage.key, 'instar1');
    expect(plan.dayOfStage, 1);
    expect(plan.stopFeeding, isFalse);
    expect(plan.suggestedGrams, greaterThan(0));
    // 400 larvae / 100 * 20g = 80g
    expect(plan.suggestedGrams, 80.0);

    // Verify feeding can be logged immediately
    await repositories.leafInventory.save(
      LeafInventory(
        mulberryKg: 5,
        castorKg: 0,
        kesseruKg: 0,
        updatedAt: today,
      ),
    );

    final ok = await floor.logSuggestedFeed(
      repositories: repositories,
      batch: batch,
      plan: plan,
    );
    expect(ok, isTrue);

    final feeds = await repositories.feedLogs.getByBatchId(batch.id);
    expect(feeds.length, 1);
    expect(feeds.first.quantityGrams, 80.0);
    expect(feeds.first.wasSkipped, isFalse);
  });

  test('chawki 3rd instar batch starts in 3rd instar with high ration', () async {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    const stage = BatchStartingStage.chawkiInstar3;
    final pastDays = stage.pastDaysFor(Species.bombyx);
    expect(pastDays, 20);

    final effectiveStartDate = today.subtract(Duration(days: pastDays));

    final batch = await repositories.batches.create(
      species: Species.bombyx,
      startDate: effectiveStartDate,
      eggCount: 400,
      batchTag: 'CHAWKI-BOM-3RD',
    );

    final plan = rearingDay.planFor(batch, now: today);
    expect(plan, isNotNull);
    expect(plan!.stage.key, 'instar3');
    expect(plan.stopFeeding, isFalse);
    // 400 larvae / 100 * 80g = 320g
    expect(plan.suggestedGrams, 320.0);
  });

  test('farmers can log skipped feeds with reasons due to varied factors', () async {
    final batch = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime.now().subtract(const Duration(days: 15)),
      eggCount: 400,
    );

    // Test skipped feed due to leaf shortage
    await floor.logSkippedFeed(
      repositories: repositories,
      batch: batch,
      reason: 'Leaf shortage',
      feedingStage: '2nd instar',
      notes: 'Fresh mulberry leaf delivery delayed',
    );

    // Test skipped feed due to adverse weather / rain
    await floor.logSkippedFeed(
      repositories: repositories,
      batch: batch,
      reason: 'Adverse weather / Wet leaf',
      feedingStage: '2nd instar',
      notes: 'Torrential downpour made morning leaves too wet',
    );

    final logs = await repositories.feedLogs.getByBatchId(batch.id);
    expect(logs.length, 2);
    expect(logs.every((l) => l.wasSkipped), isTrue);
    expect(logs.every((l) => l.quantityGrams == 0), isTrue);
    expect(logs.map((l) => l.skipReason).toList(), containsAll([
      'Leaf shortage',
      'Adverse weather / Wet leaf',
    ]));
  });

  test('dashboard reflects visible change after saving feed log and skipped feed', () async {
    final batch1 = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime.now().subtract(const Duration(days: 12)),
      eggCount: 400,
    );
    final batch2 = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime.now().subtract(const Duration(days: 12)),
      eggCount: 400,
    );

    const dashboard = DashboardService();
    final prefs = UserPreferences();

    // Initial state: neither fed nor skipped
    var summary = await dashboard.load(
      repositories: repositories,
      userPreferences: prefs,
    );
    expect(summary.fedTodayByBatch[batch1.id], isFalse);
    expect(summary.skippedTodayByBatch[batch1.id], isFalse);
    expect(summary.fedTodayGramsByBatch[batch1.id] ?? 0.0, 0.0);

    // 1. Log feed on batch1
    await floor.logCustomFeed(
      repositories: repositories,
      batch: batch1,
      quantityGrams: 80.0,
      feedType: 'Mulberry leaves',
      feedingStage: '1st instar',
    );

    // 2. Log skipped feed on batch2
    await floor.logSkippedFeed(
      repositories: repositories,
      batch: batch2,
      reason: 'Adverse weather / Wet leaf',
      feedingStage: '1st instar',
    );

    // Summary reflects visible change
    summary = await dashboard.load(
      repositories: repositories,
      userPreferences: prefs,
    );
    expect(summary.fedTodayByBatch[batch1.id], isTrue);
    expect(summary.fedTodayGramsByBatch[batch1.id], 80.0);
    expect(summary.skippedTodayByBatch[batch1.id], isFalse);

    expect(summary.fedTodayByBatch[batch2.id], isFalse);
    expect(summary.skippedTodayByBatch[batch2.id], isTrue);
    expect(summary.skipReasonTodayByBatch[batch2.id], 'Adverse weather / Wet leaf');
  });
}
