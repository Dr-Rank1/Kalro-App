import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/batch_repository.dart';
import 'package:uuid/uuid.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late BatchRepository repository;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_test');
    repository = BatchRepository(
      uuid: const Uuid(),
      storageDirectory: tempDir,
    );
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('create and load batches from local storage', () async {
    expect(await repository.getAll(), isEmpty);

    final batch = await repository.create(
      species: Species.bombyx,
      startDate: DateTime(2026, 3, 1),
      eggCount: 250,
      strain: 'Local',
      feedMaterial: 'Mulberry',
    );

    final reloaded = BatchRepository(
      uuid: const Uuid(),
      storageDirectory: tempDir,
    );
    final batches = await reloaded.getAll();

    expect(batches.length, 1);
    expect(batches.first.id, batch.id);
    expect(batches.first.eggCount, 250);
    expect(batches.first.strain, 'Local');
  });

  test('update and delete batch', () async {
    final batch = await repository.create(
      species: Species.eri,
      startDate: DateTime(2026, 4, 1),
      eggCount: 80,
    );

    await repository.update(
      batch.copyWith(location: 'House A'),
    );

    final updated = await repository.getById(batch.id);
    expect(updated?.location, 'House A');

    await repository.delete(batch.id);
    expect(await repository.getAll(), isEmpty);
  });
}
