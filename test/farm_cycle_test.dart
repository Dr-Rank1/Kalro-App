import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/account_permission.dart';
import 'package:kalro/models/app_user.dart';
import 'package:kalro/models/farm_profile.dart';
import 'package:kalro/models/leaf_inventory.dart';
import 'package:kalro/models/leaf_movement.dart';
import 'package:kalro/models/payment_direction.dart';
import 'package:kalro/models/producer_type.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/backup_service.dart';
import 'package:kalro/services/dashboard_service.dart';
import 'package:kalro/services/farm_work_stats.dart';
import 'package:kalro/services/floor_log_service.dart';
import 'package:kalro/services/leaf_ledger_service.dart';
import 'package:kalro/services/profile_service.dart';
import 'package:kalro/services/rearing_day_service.dart';
import 'package:kalro/services/user_preferences.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late AppRepositories repositories;

  setUp(() async {
    SharedPreferences.setMockInitialValues({
      'user_role': 'crc',
      'language': 'en',
      'user_name': 'Amina',
    });
    tempDir = await Directory.systemTemp.createTemp('kalro_cycle');
    repositories = AppRepositories(storageDirectory: tempDir);
  });

  tearDown(() async {
    await repositories.store.close();
    if (tempDir.existsSync()) await tempDir.delete(recursive: true);
  });

  test('lot, floor logs, leaf, money, and backup survive a store reopen',
      () async {
    final batch = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime.now().subtract(const Duration(days: 18)),
      eggCount: 200,
      location: 'House 1',
    );

    await repositories.leafInventory.save(
      LeafInventory(
        mulberryKg: 8,
        castorKg: 1,
        kesseruKg: 0,
        updatedAt: DateTime.now(),
      ),
    );
    await const LeafLedgerService().addStock(
      repositories: repositories,
      host: LeafHost.mulberry,
      kg: 2,
      kind: LeafMovementKind.bought,
      notes: 'CRC delivery',
    );

    await repositories.feedLogs.create(
      batchId: batch.id,
      recordedAt: DateTime.now(),
      feedType: 'Mulberry',
      quantityGrams: 120,
    );

    final plan = const RearingDayService().planFor(batch, liveCount: 200);
    if (plan != null && plan.suggestedGrams > 0) {
      await const FloorLogService().logSuggestedFeed(
        repositories: repositories,
        batch: batch,
        plan: plan,
      );
    }

    await repositories.mortalityLogs.create(
      batchId: batch.id,
      recordedAt: DateTime.now(),
      count: 4,
      disease: 'Flacherie',
    );
    await repositories.environmentLogs.create(
      batchId: batch.id,
      recordedAt: DateTime.now(),
      temperatureCelsius: 26,
      humidityPercent: 75,
      notes: 'House OK',
    );
    await repositories.milestoneObservations.record(
      batchId: batch.id,
      stageKey: 'hatch',
      observedDate: DateTime.now().subtract(const Duration(days: 12)),
    );
    await repositories.cocoonHarvests.create(
      batchId: batch.id,
      harvestDate: DateTime.now(),
      cocoonCount: 80,
      totalWeightGrams: 1600,
    );

    final producer = await repositories.producers.create(
      name: 'Kiambu CRC',
      type: ProducerType.chawkiRearingCenter,
    );
    await repositories.purchaseOrders.create(
      producerId: producer.id,
      producerName: producer.name,
      itemDescription: 'DFLs',
      quantity: 2,
      unit: 'boxes',
      orderedAt: DateTime.now(),
      amount: 1200,
      species: Species.bombyx,
    );
    await repositories.payments.create(
      counterparty: producer.name,
      description: 'Egg payment',
      amount: 1200,
      direction: PaymentDirection.payable,
      recordedAt: DateTime.now(),
    );
    await repositories.inventorySettings.update(bombyxPrice: 450);

    final session = UserSession(
      farm: FarmProfile(
        id: 'farm-1',
        orgName: 'Cycle Farm',
        syncCode: '123456',
        createdAt: DateTime(2025),
      ),
      user: AppUser(
        id: 'user-1',
        farmId: 'farm-1',
        username: 'farmer',
        displayName: 'Amina',
        pinHash: 'x',
        permission: AccountPermission.admin,
        createdAt: DateTime(2025),
      ),
      farmDirectoryPath: tempDir.path,
    );

    final dashboard = await const DashboardService().load(
      repositories: repositories,
      userPreferences: UserPreferences(),
    );
    expect(dashboard.activeBatchCount, 1);

    final farmStats = await const FarmWorkStatsService().load(repositories);
    expect(farmStats.deathsToday, 4);

    final profile = await ProfileService().load(
      repositories: repositories,
      userPreferences: UserPreferences(),
      session: session,
    );
    expect(profile.harvestKg, closeTo(1.6, 0.01));
    expect(profile.leafStockKg, greaterThan(0));

    final backup = await const BackupService().exportBackup(repositories);

    await repositories.store.close();
    final reopened = AppRepositories(storageDirectory: tempDir);
    expect((await reopened.batches.getAll()).single.id, batch.id);
    expect(await reopened.feedLogs.getByBatchId(batch.id), isNotEmpty);
    expect((await reopened.mortalityLogs.getByBatchId(batch.id)).single.count, 4);
    expect(await reopened.environmentLogs.getByBatchId(batch.id), isNotEmpty);
    expect(
      await reopened.milestoneObservations.stageDatesForBatch(batch.id),
      contains('hatch'),
    );
    expect(await reopened.cocoonHarvests.getByBatchId(batch.id), hasLength(1));
    expect(
      (await reopened.producers.getAll()).any((p) => p.name == 'Kiambu CRC'),
      isTrue,
    );
    expect(await reopened.purchaseOrders.getAll(), hasLength(1));
    expect(await reopened.payments.getAll(), hasLength(1));
    expect((await reopened.leafInventory.get()).mulberryKg, greaterThan(8));
    expect(await reopened.leafMovements.getAll(), isNotEmpty);
    expect((await reopened.inventorySettings.get()).bombyxPrice, 450);

    await reopened.batches.delete(batch.id);
    expect(await reopened.batches.getAll(), isEmpty);

    await const BackupService().importBackup(reopened, backup);
    final restored = await reopened.batches.getAll();
    expect(restored.single.eggCount, 200);
    expect(await reopened.cocoonHarvests.getByBatchId(restored.single.id), hasLength(1));
    expect((await reopened.payments.getAll()).single.amount, 1200);

    await reopened.store.close();
  });
}
