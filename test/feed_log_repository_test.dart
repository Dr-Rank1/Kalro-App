import 'package:kalro/services/farm_store.dart';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/services/feed_log_repository.dart';
import 'package:uuid/uuid.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late FeedLogRepository repository;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_feed_test');
    repository = FeedLogRepository(
      uuid: const Uuid(),
      storageDirectory: tempDir,
    );
  });

  tearDown(() async {
    await FarmStore.closeAll();
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('create and load feed logs by batch', () async {
    await repository.create(
      batchId: 'batch-1',
      recordedAt: DateTime(2026, 3, 1, 8),
      feedType: 'Mulberry',
      quantityGrams: 500,
      feedingStage: '3rd instar',
    );
    await repository.create(
      batchId: 'batch-1',
      recordedAt: DateTime(2026, 3, 1, 14),
      feedType: 'Mulberry',
      quantityGrams: 750,
    );
    await repository.create(
      batchId: 'batch-2',
      recordedAt: DateTime(2026, 3, 2),
      feedType: 'Castor',
      quantityGrams: 300,
    );

    final batchLogs = await repository.getByBatchId('batch-1');
    expect(batchLogs.length, 2);
    expect(await repository.totalQuantityForBatch('batch-1'), 1250);
  });

  test('delete feed log', () async {
    final log = await repository.create(
      batchId: 'batch-1',
      recordedAt: DateTime.now(),
      feedType: 'Mulberry',
      quantityGrams: 100,
    );

    await repository.delete(log.id);
    expect(await repository.getByBatchId('batch-1'), isEmpty);
  });

  test('record and retrieve skipped feed logs with reason', () async {
    final skippedLog = await repository.create(
      batchId: 'batch-3',
      recordedAt: DateTime.now(),
      feedType: 'Skipped',
      quantityGrams: 0,
      isSkipped: true,
      skipReason: 'Moult rest',
      notes: 'Worms inactive and shedding cuticle',
    );

    expect(skippedLog.isSkipped, isTrue);
    expect(skippedLog.wasSkipped, isTrue);
    expect(skippedLog.quantityGrams, 0.0);
    expect(skippedLog.skipReason, 'Moult rest');

    final logs = await repository.getByBatchId('batch-3');
    expect(logs.length, 1);
    expect(logs.first.wasSkipped, isTrue);
    expect(logs.first.skipReason, 'Moult rest');
    expect(await repository.totalQuantityForBatch('batch-3'), 0.0);
  });
}
