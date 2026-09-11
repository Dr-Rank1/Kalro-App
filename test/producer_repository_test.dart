import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/producer_type.dart';
import 'package:kalro/services/producer_repository.dart';
import 'package:uuid/uuid.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late ProducerRepository repository;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_producer_test');
    repository = ProducerRepository(
      uuid: const Uuid(),
      storageDirectory: tempDir,
    );
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('seeds default producers and supports create', () async {
    final defaults = await repository.getAll();
    expect(defaults, hasLength(2));
    expect(defaults.map((producer) => producer.name), contains('KALRO Seed Unit'));

    await repository.create(
      name: 'Local RSP',
      type: ProducerType.seedProducer,
      location: 'Tamil Nadu',
    );

    final reloaded = ProducerRepository(
      uuid: const Uuid(),
      storageDirectory: tempDir,
    );
    expect(await reloaded.getAll(), hasLength(3));
  });
}
