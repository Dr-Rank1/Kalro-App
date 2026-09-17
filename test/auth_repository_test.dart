import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/account_permission.dart';
import 'package:kalro/models/farm_profile.dart';
import 'package:kalro/services/auth_repository.dart';
import 'package:kalro/services/pin_hasher.dart';

void main() {
  late Directory tempDir;
  late AuthRepository auth;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_auth_test');
    auth = AuthRepository(farmsRootDirectory: tempDir);
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('creates farm and authenticates user with PIN', () async {
    final farm = await auth.createFarm(orgName: 'Test Farm');
    await auth.createUser(
      farmId: farm.id,
      username: 'caretaker',
      displayName: 'Caretaker One',
      pin: '4321',
      permission: AccountPermission.caretaker,
    );

    final user = await auth.authenticate(
      farmId: farm.id,
      username: 'caretaker',
      pin: '4321',
    );

    expect(user, isNotNull);
    expect(user!.permission, AccountPermission.caretaker);
  });

  test('rejects invalid PIN', () async {
    final farm = await auth.createFarm(orgName: 'Secure Farm');
    await auth.createUser(
      farmId: farm.id,
      username: 'admin',
      displayName: 'Admin',
      pin: '1234',
      permission: AccountPermission.admin,
    );

    final user = await auth.authenticate(
      farmId: farm.id,
      username: 'admin',
      pin: '9999',
    );

    expect(user, isNull);
  });

  test('pin hasher verifies hashed values', () {
    final hash = PinHasher.hashPin('5678');
    expect(PinHasher.verifyPin('5678', hash), isTrue);
    expect(PinHasher.verifyPin('1234', hash), isFalse);
  });

  test('authenticateLogin accepts admin username for legacy manager account', () async {
    final farm = await auth.createFarm(orgName: 'Legacy Farm');
    await auth.createUser(
      farmId: farm.id,
      username: 'farmer',
      displayName: 'Farmer',
      pin: '1234',
      permission: AccountPermission.admin,
    );

    final login = await auth.authenticateLogin(
      username: 'admin',
      pin: '1234',
      farm: farm,
    );

    expect(login, isNotNull);
    expect(login!.user.permission, AccountPermission.admin);

    final aliasLogin = await auth.authenticate(
      farmId: farm.id,
      username: 'admin',
      pin: '1234',
    );
    expect(aliasLogin, isNotNull);
  });

  test('updates farm org name and counts active users', () async {
    final farm = await auth.createFarm(orgName: 'Old Name');
    await auth.createUser(
      farmId: farm.id,
      username: 'admin',
      displayName: 'Admin',
      pin: '1234',
      permission: AccountPermission.admin,
    );

    final updated = await auth.updateFarm(farm.copyWith(orgName: 'New Name'));
    expect(updated.orgName, 'New Name');

    final loaded = await auth.getFarm(farm.id);
    expect(loaded?.orgName, 'New Name');
    expect(await auth.countActiveUsers(farm.id), 1);
  });

  test('persists farm county and house count', () async {
    final farm = await auth.createFarm(orgName: 'Kiambu Farm');
    final updated = await auth.updateFarm(
      farm.copyWith(county: 'Kiambu', houseCount: 4),
    );
    expect(updated.county, 'Kiambu');
    expect(updated.houseCount, 4);
    final loaded = await auth.getFarm(farm.id);
    expect(loaded?.county, 'Kiambu');
    expect(loaded?.houseCount, 4);
  });

  test('changePin rejects the wrong current PIN and accepts a valid one', () async {
    final farm = await auth.createFarm(orgName: 'PIN Farm');
    final user = await auth.createUser(
      farmId: farm.id,
      username: 'admin',
      displayName: 'Admin',
      pin: '1234',
      permission: AccountPermission.admin,
    );

    expect(
      () => auth.changePin(user: user, currentPin: '0000', newPin: '5678'),
      throwsStateError,
    );

    final changed = await auth.changePin(
      user: user,
      currentPin: '1234',
      newPin: '5678',
    );
    expect(await auth.authenticate(farmId: farm.id, username: 'admin', pin: '1234'), isNull);
    expect(await auth.authenticate(farmId: farm.id, username: 'admin', pin: '5678'), isNotNull);
    expect(changed.displayName, 'Admin');
  });

  test('forSession writes into the farm folder named after the farm id', () async {
    final farm = await auth.createFarm(orgName: 'Folder Farm');
    final user = await auth.createUser(
      farmId: farm.id,
      username: 'admin',
      displayName: 'Admin',
      pin: '1234',
      permission: AccountPermission.admin,
    );
    final farmDir = await auth.farmDirectory(farm.id);
    final scoped = AuthRepository.forSession(
      UserSession(
        farm: farm,
        user: user,
        farmDirectoryPath: farmDir.path,
      ),
    );
    final renamed = user.copyWith(displayName: 'Amina');
    await scoped.updateUser(renamed);
    final loaded = await auth.getUsers(farm.id);
    expect(loaded.single.displayName, 'Amina');
  });
}
