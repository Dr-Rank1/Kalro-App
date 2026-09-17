import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/account_permission.dart';
import 'package:kalro/models/app_user.dart';
import 'package:kalro/models/batch_status.dart';
import 'package:kalro/models/farm_profile.dart';
import 'package:kalro/models/leaf_inventory.dart';
import 'package:kalro/models/payment_direction.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/profile_service.dart';
import 'package:kalro/services/user_preferences.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late AppRepositories repositories;
  late UserSession session;

  setUp(() async {
    SharedPreferences.setMockInitialValues({
      'user_role': 'swr',
      'language': 'en',
    });
    tempDir = await Directory.systemTemp.createTemp('kalro_profile');
    repositories = AppRepositories(storageDirectory: tempDir);
    session = UserSession(
      farm: FarmProfile(
        id: 'farm-1',
        orgName: 'Test Farm',
        syncCode: '111111',
        createdAt: DateTime(2025, 1, 1),
        county: 'Kiambu',
        houseCount: 2,
      ),
      user: AppUser(
        id: 'user-1',
        farmId: 'farm-1',
        username: 'admin',
        displayName: 'Amina',
        pinHash: 'x',
        permission: AccountPermission.admin,
        createdAt: DateTime(2025, 1, 1),
        phone: '0700000000',
      ),
      farmDirectoryPath: tempDir.path,
    );
  });

  tearDown(() async {
    if (tempDir.existsSync()) await tempDir.delete(recursive: true);
  });

  test('summarizes live lots, harvest kg, last closed cycle, leaf, and payables',
      () async {
    final active = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime.now().subtract(const Duration(days: 10)),
      eggCount: 100,
    );
    await repositories.mortalityLogs.create(
      batchId: active.id,
      recordedAt: DateTime.now(),
      count: 10,
    );

    var closed = await repositories.batches.create(
      species: Species.eri,
      startDate: DateTime.now().subtract(const Duration(days: 40)),
      eggCount: 80,
    );
    closed = closed.copyWith(status: BatchStatus.harvested);
    await repositories.batches.update(closed);
    await repositories.cocoonHarvests.create(
      batchId: closed.id,
      harvestDate: DateTime.now().subtract(const Duration(days: 2)),
      cocoonCount: 70,
      totalWeightGrams: 2500,
    );

    var olderHarvest = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime.now().subtract(const Duration(days: 5)),
      eggCount: 50,
    );
    olderHarvest = olderHarvest.copyWith(status: BatchStatus.harvested);
    await repositories.batches.update(olderHarvest);
    await repositories.cocoonHarvests.create(
      batchId: olderHarvest.id,
      harvestDate: DateTime.now().subtract(const Duration(days: 20)),
      cocoonCount: 40,
      totalWeightGrams: 1000,
    );

    await repositories.leafInventory.save(
      LeafInventory(
        mulberryKg: 10,
        castorKg: 2,
        kesseruKg: 1,
        updatedAt: DateTime.now(),
      ),
    );
    await repositories.payments.create(
      counterparty: 'CRC',
      description: 'Leaf',
      amount: 400,
      direction: PaymentDirection.payable,
      recordedAt: DateTime.now(),
    );
    await File('${tempDir.path}/users.json').writeAsString(
      jsonEncode([
        session.user.toJson(),
        {
          'id': 'user-2',
          'farmId': 'farm-1',
          'username': 'jane',
          'displayName': 'Jane',
          'pinHash': 'y',
          'permission': 'caretaker',
          'createdAt': DateTime(2025, 2, 1).toIso8601String(),
          'active': true,
        },
      ]),
    );

    final summary = await ProfileService().load(
      repositories: repositories,
      userPreferences: UserPreferences(),
      session: session,
    );

    expect(summary.activeBatchCount, 1);
    expect(summary.closedBatchCount, 2);
    expect(summary.bombyxLarvaeCount, 90);
    expect(summary.harvestKg, closeTo(3.5, 0.01));
    expect(summary.lastCycle, isNotNull);
    expect(summary.lastCycle!.batch.id, closed.id);
    expect(summary.lastCycle!.harvestKg, closeTo(2.5, 0.01));
    expect(summary.averageSurvivalPercent, closeTo(100, 0.01));
    expect(summary.leafStockKg, closeTo(13, 0.01));
    expect(summary.pendingPayables, 400);
    expect(summary.teamMembers.length, 2);
    expect(summary.teamMembers.first.id, 'user-1');
    expect(summary.role, UserRole.swr);
  });
}
