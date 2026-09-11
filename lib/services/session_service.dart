import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/account_permission.dart';
import '../models/app_user.dart';
import '../models/farm_profile.dart';
import 'auth_repository.dart';

class SessionService {
  SessionService({AuthRepository? authRepository})
      : _authRepository = authRepository ?? AuthRepository();

  final AuthRepository _authRepository;

  static const _farmIdKey = 'session_farm_id';
  static const _userIdKey = 'session_user_id';

  Future<UserSession?> loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    final farmId = prefs.getString(_farmIdKey);
    final userId = prefs.getString(_userIdKey);
    if (farmId == null || userId == null) return null;

    final farm = await _authRepository.getFarm(farmId);
    if (farm == null) return null;

    final users = await _authRepository.getUsers(farmId);
    AppUser? user;
    for (final candidate in users) {
      if (candidate.id == userId) {
        user = candidate;
        break;
      }
    }
    if (user == null) return null;

    final farmDir = await _authRepository.farmDirectory(farmId);
    return UserSession(
      farm: farm,
      user: user,
      farmDirectoryPath: farmDir.path,
    );
  }

  Future<void> saveSession(UserSession session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_farmIdKey, session.farm.id);
    await prefs.setString(_userIdKey, session.user.id);
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_farmIdKey);
    await prefs.remove(_userIdKey);
  }

  Future<UserSession?> loadOrRecoverSession({
    required String adminUsername,
    required String adminPin,
  }) async {
    final existing = await loadSession();
    if (existing != null) return existing;

    final farms = await _authRepository.listFarms();
    if (farms.isEmpty) return null;

    final farm = farms.first;
    final user = await _authRepository.authenticate(
      farmId: farm.id,
      username: adminUsername,
      pin: adminPin,
    );
    if (user == null) return null;

    final farmDir = await _authRepository.farmDirectory(farm.id);
    final session = UserSession(
      farm: farm,
      user: user,
      farmDirectoryPath: farmDir.path,
    );
    await saveSession(session);
    return session;
  }

  /// Creates a farm + admin user when onboarding finished but no farm folder exists.
  Future<FarmProfile?> ensureFarmFromPreferences({
    required String orgName,
    required String adminUsername,
    required String adminDisplayName,
    required String adminPin,
  }) async {
    final farms = await _authRepository.listFarms();
    if (farms.isNotEmpty) {
      final farm = AuthRepository.resolvePrimaryFarm(farms, orgName) ?? farms.first;
      await _authRepository.ensureManagerAccount(
        farmId: farm.id,
        adminUsername: adminUsername,
        adminDisplayName: adminDisplayName,
        adminPin: adminPin,
      );
      return farm;
    }

    final farm = await _authRepository.createFarm(orgName: orgName);
    await _authRepository.createUser(
      farmId: farm.id,
      username: adminUsername,
      displayName: adminDisplayName,
      pin: adminPin,
      permission: AccountPermission.admin,
    );
    return farm;
  }

  /// Moves legacy flat JSON files into the first farm folder on upgrade.
  Future<FarmProfile?> migrateLegacyDataIfNeeded({
    required String orgName,
    required String adminUsername,
    required String adminDisplayName,
    required String adminPin,
  }) async {
    final farms = await _authRepository.listFarms();
    if (farms.isNotEmpty) return farms.first;

    final docs = await getApplicationDocumentsDirectory();
    final legacyBatch = File('${docs.path}/batches.json');
    if (!await legacyBatch.exists()) return null;

    final farm = await _authRepository.createFarm(orgName: orgName);
    final farmDir = await _authRepository.farmDirectory(farm.id);

    const legacyFiles = [
      'batches.json',
      'feed_logs.json',
      'mortality_logs.json',
      'environment_logs.json',
      'cocoon_harvests.json',
      'milestone_observations.json',
      'payments.json',
      'producers.json',
      'purchase_orders.json',
      'inventory_settings.json',
      'leaf_inventory.json',
    ];

    for (final name in legacyFiles) {
      final source = File('${docs.path}/$name');
      if (await source.exists()) {
        await source.copy('${farmDir.path}/$name');
      }
    }

    await _authRepository.createUser(
      farmId: farm.id,
      username: adminUsername,
      displayName: adminDisplayName,
      pin: adminPin,
      permission: AccountPermission.admin,
    );

    return farm;
  }
}
