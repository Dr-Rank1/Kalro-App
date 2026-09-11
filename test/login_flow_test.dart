import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/account_permission.dart';
import 'package:kalro/models/farm_profile.dart';
import 'package:kalro/models/login_portal.dart';
import 'package:kalro/services/auth_repository.dart';
import 'package:kalro/services/permission_service.dart';
import 'package:kalro/services/session_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late AuthRepository auth;
  late SessionService sessions;
  const permissions = PermissionService();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    tempDir = await Directory.systemTemp.createTemp('kalro_login_test');
    auth = AuthRepository(farmsRootDirectory: tempDir);
    sessions = SessionService(authRepository: auth);
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('management portal accepts admin and rejects caretaker', () async {
    final farm = await auth.createFarm(orgName: 'Test');
    await auth.createUser(
      farmId: farm.id,
      username: 'admin',
      displayName: 'Admin',
      pin: '1234',
      permission: AccountPermission.admin,
    );
    await auth.createUser(
      farmId: farm.id,
      username: 'worker',
      displayName: 'Worker',
      pin: '5678',
      permission: AccountPermission.caretaker,
    );

    final admin = await auth.authenticate(farmId: farm.id, username: 'admin', pin: '1234');
    final worker = await auth.authenticate(farmId: farm.id, username: 'worker', pin: '5678');

    expect(permissions.canAccessManagementPortal(admin), isTrue);
    expect(permissions.canAccessFieldPortal(admin), isFalse);
    expect(permissions.canAccessManagementPortal(worker), isFalse);
    expect(permissions.canAccessFieldPortal(worker), isTrue);
  });

  test('saved session restores correct user for routing', () async {
    final farm = await auth.createFarm(orgName: 'Route Farm');
    final caretaker = await auth.createUser(
      farmId: farm.id,
      username: 'caretaker',
      displayName: 'Caretaker',
      pin: '4321',
      permission: AccountPermission.caretaker,
    );
    final farmDir = await auth.farmDirectory(farm.id);

    await sessions.saveSession(
      UserSession(
        farm: farm,
        user: caretaker,
        farmDirectoryPath: farmDir.path,
      ),
    );

    final loaded = await sessions.loadSession();
    expect(loaded, isNotNull);
    expect(loaded!.user.permission, AccountPermission.caretaker);
    expect(LoginPortal.field.title, isNotEmpty);
  });
}
