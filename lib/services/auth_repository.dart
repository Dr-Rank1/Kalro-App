import '../utils/file_utils.dart';
import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

import '../models/app_user.dart';
import '../models/account_permission.dart';
import '../models/farm_profile.dart';
import 'pin_hasher.dart';

class AuthRepository {
  AuthRepository({Uuid? uuid, Directory? farmsRootDirectory})
      : _uuid = uuid ?? const Uuid(),
        _farmsRootDirectory = farmsRootDirectory;

  final Uuid _uuid;
  final Directory? _farmsRootDirectory;
  static const _usersFileName = 'users.json';
  static const _farmFileName = 'farm.json';

  Future<Directory> farmsRoot() async {
    return _farmsRootDirectory ??
        Directory('${(await getApplicationDocumentsDirectory()).path}/kalro_farms');
  }

  Future<Directory> farmDirectory(String farmId) async {
    final dir = Directory('${(await farmsRoot()).path}/$farmId');
    if (!await dir.exists()) {
      await dir.create(recursive: true);
    }
    return dir;
  }

  Future<FarmProfile> createFarm({
    required String orgName,
    String? syncCode,
  }) async {
    final farm = FarmProfile(
      id: _uuid.v4(),
      orgName: orgName.trim(),
      syncCode: syncCode ?? _generateSyncCode(),
      createdAt: DateTime.now(),
    );
    final dir = await farmDirectory(farm.id);
    await FileUtils.atomicWriteAsString(File('${dir.path}/$_farmFileName'), jsonEncode(farm.toJson()));
    return farm;
  }

  Future<FarmProfile?> getFarm(String farmId) async {
    final file = File('${(await farmDirectory(farmId)).path}/$_farmFileName');
    if (!await file.exists()) return null;
    final json = jsonDecode(await file.readAsString()) as Map<String, dynamic>;
    return FarmProfile.fromJson(json);
  }

  Future<List<FarmProfile>> listFarms() async {
    final root = await farmsRoot();
    if (!await root.exists()) return [];

    final farms = <FarmProfile>[];
    await for (final entity in root.list()) {
      if (entity is! Directory) continue;
      final farm = await getFarm(entity.path.split(Platform.pathSeparator).last);
      if (farm != null) farms.add(farm);
    }
    farms.sort((a, b) => a.createdAt.compareTo(b.createdAt));
    return farms;
  }

  static FarmProfile? resolvePrimaryFarm(List<FarmProfile> farms, String orgName) {
    if (farms.isEmpty) return null;
    final trimmed = orgName.trim();
    for (final farm in farms) {
      if (farm.orgName == trimmed) return farm;
    }
    return farms.first;
  }

  Future<AppUser> createUser({
    required String farmId,
    required String username,
    required String displayName,
    required String pin,
    required AccountPermission permission,
  }) async {
    final normalized = username.trim().toLowerCase();
    final existing = await getUsers(farmId);
    if (existing.any((u) => u.username == normalized)) {
      throw StateError('Username already exists');
    }

    final user = AppUser(
      id: _uuid.v4(),
      farmId: farmId,
      username: normalized,
      displayName: displayName.trim(),
      pinHash: PinHasher.hashPin(pin),
      permission: permission,
      createdAt: DateTime.now(),
    );

    await _saveUsers(farmId, [...existing, user]);
    return user;
  }

  Future<List<AppUser>> getUsers(String farmId) async {
    final file = await _usersFile(farmId);
    if (!await file.exists()) return [];

    final decoded = jsonDecode(await file.readAsString()) as List<dynamic>;
    return decoded
        .map((item) => AppUser.fromJson(item as Map<String, dynamic>))
        .where((user) => user.active)
        .toList();
  }

  Future<FarmProfile> updateFarm(FarmProfile farm, {String? orgName}) async {
    final updated = farm.copyWith(orgName: orgName);
    final dir = await farmDirectory(farm.id);
    await FileUtils.atomicWriteAsString(File('${dir.path}/$_farmFileName'), jsonEncode(updated.toJson()));
    return updated;
  }

  Future<int> countActiveUsers(String farmId) async {
    final users = await getUsers(farmId);
    return users.length;
  }

  Future<AppUser?> findAdminUser(String farmId) async {
    final users = await getUsers(farmId);
    for (final user in users) {
      if (user.permission == AccountPermission.admin) {
        return user;
      }
    }
    return null;
  }

  Future<AppUser?> authenticate({
    required String farmId,
    required String username,
    required String pin,
  }) async {
    final normalized = username.trim().toLowerCase();
    final users = await getUsers(farmId);
    for (final user in users) {
      if (user.username == normalized && PinHasher.verifyPin(pin, user.pinHash)) {
        return user;
      }
    }
    return null;
  }

  /// Ensures the manager can sign in as [aliasUsername] when the stored admin
  /// account uses a different username (legacy installs used "farmer").
  Future<void> ensureAdminUsernameAlias(
    String farmId, {
    String aliasUsername = 'admin',
  }) async {
    final alias = aliasUsername.trim().toLowerCase();
    final users = await getUsers(farmId);
    if (users.any((user) => user.username == alias)) return;

    final admin = await findAdminUser(farmId);
    if (admin == null) return;

    final allUsers = await _allUsers(farmId);
    allUsers.add(
      AppUser(
        id: _uuid.v4(),
        farmId: farmId,
        username: alias,
        displayName: admin.displayName,
        pinHash: admin.pinHash,
        permission: AccountPermission.admin,
        createdAt: DateTime.now(),
      ),
    );
    await _saveAllUsers(farmId, allUsers);
  }

  Future<void> ensureManagerAccount({
    required String farmId,
    required String adminUsername,
    required String adminDisplayName,
    required String adminPin,
  }) async {
    final normalized = adminUsername.trim().toLowerCase();
    final admin = await findAdminUser(farmId);
    if (admin == null) {
      final users = await getUsers(farmId);
      if (users.isEmpty) {
        await createUser(
          farmId: farmId,
          username: normalized,
          displayName: adminDisplayName,
          pin: adminPin,
          permission: AccountPermission.admin,
        );
      } else {
        try {
          await createUser(
            farmId: farmId,
            username: normalized,
            displayName: adminDisplayName,
            pin: adminPin,
            permission: AccountPermission.admin,
          );
        } on StateError {
          // Username already taken by a non-admin account.
        }
      }
    }
    await ensureAdminUsernameAlias(farmId);
  }

  Future<AuthLoginResult?> authenticateLogin({
    required String username,
    required String pin,
    FarmProfile? farm,
    List<FarmProfile>? farms,
  }) async {
    final normalized = username.trim().toLowerCase();
    final candidates = <FarmProfile>[
      ?farm,
      ...?farms?.where((candidate) => candidate.id != farm?.id),
    ];

    for (final candidate in candidates) {
      final user = await authenticate(
        farmId: candidate.id,
        username: normalized,
        pin: pin,
      );
      if (user != null) {
        return AuthLoginResult(user: user, farm: candidate);
      }

      if (normalized == 'admin') {
        final admin = await findAdminUser(candidate.id);
        if (admin != null &&
            admin.username != 'admin' &&
            PinHasher.verifyPin(pin, admin.pinHash)) {
          await ensureAdminUsernameAlias(candidate.id);
          return AuthLoginResult(user: admin, farm: candidate);
        }
      }
    }
    return null;
  }

  Future<void> updateUser(AppUser user) async {
    final users = await _allUsers(user.farmId);
    final index = users.indexWhere((u) => u.id == user.id);
    if (index == -1) throw StateError('User not found');
    users[index] = user;
    await _saveAllUsers(user.farmId, users);
  }

  Future<void> deactivateUser(String farmId, String userId) async {
    final users = await _allUsers(farmId);
    final index = users.indexWhere((u) => u.id == userId);
    if (index == -1) throw StateError('User not found');
    users[index] = users[index].copyWith(active: false);
    await _saveAllUsers(farmId, users);
  }

  Future<List<AppUser>> _allUsers(String farmId) async {
    final file = await _usersFile(farmId);
    if (!await file.exists()) return [];
    final decoded = jsonDecode(await file.readAsString()) as List<dynamic>;
    return decoded.map((item) => AppUser.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<void> _saveUsers(String farmId, List<AppUser> users) async {
    await _saveAllUsers(farmId, users);
  }

  Future<void> _saveAllUsers(String farmId, List<AppUser> users) async {
    final file = await _usersFile(farmId);
    await FileUtils.atomicWriteAsString(file, jsonEncode(users.map((u) => u.toJson()).toList()));
  }

  Future<File> _usersFile(String farmId) async {
    return File('${(await farmDirectory(farmId)).path}/$_usersFileName');
  }

  String _generateSyncCode() {
    final random = Random.secure();
    return List.generate(6, (_) => random.nextInt(10)).join();
  }
}

class AuthLoginResult {
  const AuthLoginResult({required this.user, required this.farm});

  final AppUser user;
  final FarmProfile farm;
}
