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
}
