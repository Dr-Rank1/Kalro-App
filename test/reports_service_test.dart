import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/payment_direction.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/reports_service.dart';
import 'package:kalro/services/user_preferences.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late AppRepositories repositories;
  const reportsService = ReportsService();

  setUp(() async {
    SharedPreferences.setMockInitialValues({
      'onboarding_complete': true,
      'org_name': 'Test Farm',
    });
    tempDir = await Directory.systemTemp.createTemp('kalro_reports_test');
    repositories = AppRepositories(storageDirectory: tempDir);
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('summary aggregates rearing, feed, and financial data', () async {
    final batch = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime.now().subtract(const Duration(days: 2)),
      eggCount: 150,
    );

    await repositories.feedLogs.create(
      batchId: batch.id,
      recordedAt: DateTime.now(),
      feedType: 'Mulberry',
      quantityGrams: 800,
    );

    await repositories.payments.create(
      counterparty: 'Buyer',
      description: 'Cocoon sale',
      amount: 3000,
      direction: PaymentDirection.receivable,
      recordedAt: DateTime.now(),
    );

    await repositories.purchaseOrders.create(
      producerId: (await repositories.producers.getAll()).first.id,
      producerName: 'VSSPC',
      itemDescription: 'DFL',
      quantity: 1,
      unit: 'DFL',
      orderedAt: DateTime.now(),
      amount: 1200,
    );

    final summary = await reportsService.load(
      repositories: repositories,
      userPreferences: UserPreferences(),
    );

    expect(summary.orgName, 'Test Farm');
    expect(summary.activeBatches, 1);
    expect(summary.bombyxLarvae, 150);
    expect(summary.totalFeedGrams, 800);

    final thisBatch = await reportsService.load(
      repositories: repositories,
      userPreferences: UserPreferences(),
      rangeDays: 7,
      batchId: batch.id,
    );
    expect(thisBatch.totalFeedGrams, 800);
    expect(thisBatch.totalBatches, 1);

    final emptyWindow = await reportsService.load(
      repositories: repositories,
      userPreferences: UserPreferences(),
      rangeDays: 7,
      batchId: 'missing',
    );
    expect(emptyWindow.totalBatches, 0);
    expect(emptyWindow.totalFeedGrams, 0);
    expect(summary.totalReceivable, 3000);
    expect(summary.purchaseSpend, 1200);
    expect(summary.purchaseOrderCount, 1);
  });
}
