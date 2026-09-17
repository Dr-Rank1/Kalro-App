import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/auth_repository.dart';
import 'package:kalro/services/cloud_sync_service.dart';

void main() {
  late Directory farmsRoot;
  late Directory farmDir;
  late Directory cloudDir;
  late AuthRepository auth;
  late AppRepositories repositories;
  late CloudSyncService sync;

  setUp(() async {
    farmsRoot = await Directory.systemTemp.createTemp('kalro_cloud_farms');
    cloudDir = await Directory.systemTemp.createTemp('kalro_cloud_store');
    auth = AuthRepository(farmsRootDirectory: farmsRoot);
    final farm = await auth.createFarm(orgName: 'Cloud Farm', syncCode: '123456');
    farmDir = await auth.farmDirectory(farm.id);
    repositories = AppRepositories(storageDirectory: farmDir);
    sync = CloudSyncService(authRepository: auth, localCloudDirectory: cloudDir);

    await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime.now(),
      eggCount: 40,
    );
  });

  tearDown(() async {
    if (farmsRoot.existsSync()) {
      await farmsRoot.delete(recursive: true);
    }
    if (cloudDir.existsSync()) {
      await cloudDir.delete(recursive: true);
    }
  });

  test('upload and download via local cloud folder', () async {
    final farm = (await auth.listFarms()).single;

    final upload = await sync.upload(
      repositories: repositories,
      farm: farm,
    );
    expect(upload.success, isTrue, reason: upload.message);

    await repositories.batches.delete((await repositories.batches.getAll()).single.id);
    expect(await repositories.batches.getAll(), isEmpty);

    final download = await sync.download(
      repositories: repositories,
      farm: farm,
    );
    expect(download.success, isTrue, reason: download.message);
    expect(await repositories.batches.getAll(), hasLength(1));
  });

  test('refuses to overwrite a newer local snapshot unless asked', () async {
    final farm = (await auth.listFarms()).single;
    final upload = await sync.upload(repositories: repositories, farm: farm);
    expect(upload.success, isTrue, reason: upload.message);

    final metaFile = File('${farmDir.path}/sync_meta.json');
    final meta = {
      'lastSnapshotExportedAt': DateTime.now().add(const Duration(days: 2)).toIso8601String(),
    };
    await metaFile.writeAsString(
      '{"lastSnapshotExportedAt":"${meta['lastSnapshotExportedAt']}"}',
    );

    final blocked = await sync.download(repositories: repositories, farm: farm);
    expect(blocked.success, isFalse);
    expect(blocked.wouldOverwriteNewerLocal, isTrue);

    final forced = await sync.download(
      repositories: repositories,
      farm: farm,
      overwriteNewerLocal: true,
    );
    expect(forced.success, isTrue, reason: forced.message);
  });
}
