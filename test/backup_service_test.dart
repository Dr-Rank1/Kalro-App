import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/backup_service.dart';

void main() {
  late Directory tempDir;
  late AppRepositories repositories;
  const backupService = BackupService();

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_backup_test');
    repositories = AppRepositories(storageDirectory: tempDir);
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('export and import restores batch data', () async {
    final batch = await repositories.batches.create(
      species: Species.eri,
      startDate: DateTime.now(),
      eggCount: 60,
    );

    final backupFile = await backupService.exportBackup(repositories);

    await repositories.batches.delete(batch.id);
    expect(await repositories.batches.getAll(), isEmpty);

    await backupService.importBackup(repositories, backupFile);

    final restored = await repositories.batches.getAll();
    expect(restored, hasLength(1));
    expect(restored.single.eggCount, 60);
    expect(restored.single.species, Species.eri);
  });

  test('backup file includes version header', () async {
    final file = await backupService.exportBackup(repositories);
    final json = jsonDecode(await file.readAsString()) as Map<String, dynamic>;
    expect(json['version'], 1);
    expect(json['data'], isA<Map<String, dynamic>>());
  });
}
