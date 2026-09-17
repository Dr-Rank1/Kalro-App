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
    if (tempDir.existsSync()) await tempDir.delete(recursive: true);
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
}
