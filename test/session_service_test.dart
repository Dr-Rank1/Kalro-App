import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/services/auth_repository.dart';
import 'package:kalro/services/session_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late AuthRepository auth;
  late SessionService sessions;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    tempDir = await Directory.systemTemp.createTemp('kalro_session_test');
    auth = AuthRepository(farmsRootDirectory: tempDir);
    sessions = SessionService(authRepository: auth);
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('ensureFarmFromPreferences creates farm when missing', () async {
    final farm = await sessions.ensureFarmFromPreferences(
      orgName: 'Test Farm',
      adminUsername: 'admin',
      adminDisplayName: 'Farmer',
      adminPin: '1234',
    );

    expect(farm, isNotNull);
    expect((await auth.listFarms()).length, 1);

    final session = await sessions.loadOrRecoverSession(
      adminUsername: 'admin',
      adminPin: '1234',
    );
    expect(session, isNotNull);
    expect(session!.user.username, 'admin');
  });

  test('ensureFarmFromPreferences adds admin when farm exists without users', () async {
    final farm = await auth.createFarm(orgName: 'Orphan Farm');

    await sessions.ensureFarmFromPreferences(
      orgName: 'Orphan Farm',
      adminUsername: 'admin',
      adminDisplayName: 'Farmer',
      adminPin: '1234',
    );

    final user = await auth.authenticate(farmId: farm.id, username: 'admin', pin: '1234');
    expect(user, isNotNull);
    expect(user!.permission.name, 'admin');
  });

  test('empty PIN does not invent a 1234 admin', () async {
    final farm = await auth.createFarm(orgName: 'Safe Farm');
    await sessions.ensureFarmFromPreferences(
      orgName: 'Safe Farm',
      adminUsername: 'admin',
      adminDisplayName: 'Farmer',
      adminPin: '',
    );
    final users = await auth.getUsers(farm.id);
    expect(users, isEmpty);
    final withPin = await auth.authenticate(farmId: farm.id, username: 'admin', pin: '1234');
    expect(withPin, isNull);
  });
}
