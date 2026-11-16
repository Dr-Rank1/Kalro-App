import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/services/farm_store.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late FarmStore store;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_store');
    store = FarmStore(directory: tempDir);
  });

  tearDown(() async {
    await store.close();
    await FarmStore.closeAll();
    try {
      if (tempDir.existsSync()) await tempDir.delete(recursive: true);
    } catch (_) {}
  });

  test('upserts a record into kalro.db and reloads it', () async {
    await store.upsert('batches', 'b1', {'id': 'b1', 'eggCount': 120});

    final reloaded = FarmStore(directory: tempDir);
    final rows = await reloaded.getCollection('batches');
    expect(rows, hasLength(1));
    expect(rows.single['id'], 'b1');
    expect(rows.single['eggCount'], 120);
    await reloaded.close();
  });

  test('imports legacy JSON files once', () async {
    await File('${tempDir.path}/batches.json').writeAsString(
      jsonEncode([
        {'id': 'old-1', 'eggCount': 40},
      ]),
    );

    final rows = await store.getCollection('batches');
    expect(rows.single['id'], 'old-1');

    await File('${tempDir.path}/batches.json').writeAsString(
      jsonEncode([
        {'id': 'should-not-import', 'eggCount': 1},
      ]),
    );
    final again = FarmStore(directory: tempDir);
    final second = await again.getCollection('batches');
    expect(second.single['id'], 'old-1');
    await again.close();
  });

  test('replaceCollection is transactional', () async {
    await store.upsert('feed_logs', 'a', {'id': 'a'});
    await store.replaceCollection('feed_logs', [
      {'id': 'b', 'kg': 2},
      {'id': 'c', 'kg': 3},
    ]);
    final rows = await store.getCollection('feed_logs');
    expect(rows.map((r) => r['id']), ['b', 'c']);
  });

  test('getCollectionWhere filters using json_extract indexed queries', () async {
    await store.upsert('feed_logs', 'log-1', {'id': 'log-1', 'batchId': 'b1', 'kg': 5});
    await store.upsert('feed_logs', 'log-2', {'id': 'log-2', 'batchId': 'b2', 'kg': 10});
    await store.upsert('feed_logs', 'log-3', {'id': 'log-3', 'batchId': 'b1', 'kg': 15});

    final b1Rows = await store.getCollectionWhere('feed_logs', jsonKey: 'batchId', value: 'b1');
    expect(b1Rows, hasLength(2));
    expect(b1Rows.map((r) => r['id']), containsAll(['log-1', 'log-3']));
    expect(b1Rows.map((r) => r['id']), isNot(contains('log-2')));
  });

  test('PowerSync schema creates typed tables and streams updates reactively', () async {
    await store.upsert('batches', 'batch-ps-1', {
      'id': 'batch-ps-1',
      'species': 'bombyx',
      'startDate': '2026-11-15T00:00:00.000',
      'eggCount': 20000,
      'status': 'active',
      'createdAt': '2026-11-15T08:00:00.000',
      'strain': 'KSK',
      'location': 'House 1',
    });

    final emitted = await store.watchCollection('batches').first;
    expect(emitted, isNotEmpty);
    expect(emitted.any((b) => b['id'] == 'batch-ps-1'), isTrue);

    final connector = NsrcPowerSyncConnector(
      endpoint: 'https://powersync.kalro-nsrc.go.ke',
      token: 'test-nsrc-token',
      userId: 'staff-joyce-njuguna',
    );
    final creds = await connector.fetchCredentials();
    expect(creds?.endpoint, equals('https://powersync.kalro-nsrc.go.ke'));
    expect(creds?.token, equals('test-nsrc-token'));
    expect(creds?.userId, equals('staff-joyce-njuguna'));
  });

  test('upsertAll performs bulk inserts in an atomic transaction', () async {
    final telemetryBatch = List.generate(
      50,
      (i) => {
        'id': 'env-telemetry-$i',
        'batchId': 'batch-telemetry-01',
        'temperatureCelsius': 24.0 + (i * 0.1),
        'humidityPercent': 75.0 + (i * 0.05),
        'recordedAt': '2026-11-16T12:${(i % 60).toString().padLeft(2, '0')}:00.000Z',
      },
    );

    await store.upsertAll('environment_logs', telemetryBatch);

    final rows = await store.getCollectionWhere(
      'environment_logs',
      jsonKey: 'batchId',
      value: 'batch-telemetry-01',
    );
    expect(rows, hasLength(50));
    expect(rows.first['id'], equals('env-telemetry-0'));
    expect(rows.last['id'], equals('env-telemetry-49'));
  });

  test('dispose closes database and resets open connection', () async {
    await store.upsert('batches', 'dispose-test', {'id': 'dispose-test', 'name': 'Test'});
    await store.dispose();
    expect(store.isDisposed, isTrue);

    // After dispose, a new instance can safely open the same database directory
    final freshStore = FarmStore(directory: tempDir);
    final rows = await freshStore.getCollection('batches');
    expect(rows.any((r) => r['id'] == 'dispose-test'), isTrue);
    await freshStore.dispose();
  });
}
