import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/dashboard_service.dart';
import 'package:kalro/services/user_preferences.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late AppRepositories repositories;
  const dashboardService = DashboardService();

  setUp(() async {
    SharedPreferences.setMockInitialValues({
      'onboarding_complete': true,
      'user_name': 'Test Farmer',
    });
    tempDir = await Directory.systemTemp.createTemp('kalro_dashboard_test');
    repositories = AppRepositories(storageDirectory: tempDir);
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('summary aggregates active batches, feed logs, and milestones', () async {
    final batch = await repositories.batches.create(
      species: Species.eri,
      startDate: DateTime.now().subtract(const Duration(days: 3)),
      eggCount: 120,
    );

    final today = DateTime.now();
    await repositories.feedLogs.create(
      batchId: batch.id,
      recordedAt: today,
      feedType: 'Castor',
      quantityGrams: 500,
    );
    await repositories.feedLogs.create(
      batchId: batch.id,
      recordedAt: today.subtract(const Duration(days: 1)),
      feedType: 'Castor',
      quantityGrams: 200,
    );

    final summary = await dashboardService.load(
      repositories: repositories,
      userPreferences: UserPreferences(),
    );

    expect(summary.displayName, 'Test Farmer');
    expect(summary.activeBatchCount, 1);
    expect(summary.totalLarvae, 120);
    expect(summary.liveLarvae, 120);
    expect(summary.averageSurvivalPercent, 100);
    expect(summary.feedTodayGrams, 500);
    expect(summary.feedTotalGrams, 700);
    expect(summary.activeBatches.single.id, batch.id);
    expect(summary.upcomingMilestones, isNotEmpty);
    expect(summary.nextMilestone, isNotNull);
    expect(summary.todayTasks, isNotEmpty);
    expect(summary.suggestedFeedTodayGrams, greaterThanOrEqualTo(0));
    expect(summary.leafNeedTodayKg, greaterThanOrEqualTo(0));
  });

  test('reflects mortality in live larvae count', () async {
    final batch = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime.now(),
      eggCount: 100,
    );

    await repositories.mortalityLogs.create(
      batchId: batch.id,
      recordedAt: DateTime.now(),
      count: 10,
    );

    final summary = await dashboardService.load(
      repositories: repositories,
      userPreferences: UserPreferences(),
    );

    expect(summary.liveLarvae, 90);
    expect(summary.averageSurvivalPercent, 90);
  });
}
