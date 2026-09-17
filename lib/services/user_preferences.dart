import 'package:shared_preferences/shared_preferences.dart';

import '../l10n/translator.dart';

enum UserRole {
  asr('Adopted Seed Rearer'),
  rsp('Registered Seed Producer'),
  crc('Rearing Support Unit'),
  swr('Silkworm Rearer');

  const UserRole(this._label);

  final String _label;

  String get label => _label.tr;

  String get blurb => switch (this) {
        UserRole.swr =>
          'Daily rearing: feed, deaths, house, and leaf.'.tr,
        UserRole.asr =>
          'Seed rearer: lots, field work, and reports.'.tr,
        UserRole.rsp =>
          'Seed producer: finance, cycle money, and reports.'.tr,
        UserRole.crc =>
          'CRC support: backup, sync, reports, and farm money.'.tr,
      };
}

class UserPreferences {
  static const _onboardingKey = 'onboarding_complete';
  static const _walkthroughKey = 'walkthrough_complete';
  static const _languageKey = 'language';
  static const _roleKey = 'user_role';
  static const _nameKey = 'user_name';
  static const _orgKey = 'org_name';
  static const _adminUsernameKey = 'admin_username';
  static const _idKey = 'user_id';



  Future<bool> hasSeenWalkthrough() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_walkthroughKey) ?? false;
  }

  Future<void> completeWalkthrough() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_walkthroughKey, true);
  }


  Future<bool> hasCompletedOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_onboardingKey) ?? false;
  }

  Future<void> completeOnboarding({
    required String language,
    required UserRole role,
    String? name,
    String? orgName,
    String? adminUsername,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_onboardingKey, true);
    await prefs.setString(_languageKey, language);
    await prefs.setString(_roleKey, role.name);
    if (name != null) await prefs.setString(_nameKey, name);
    if (orgName != null) await prefs.setString(_orgKey, orgName);
    if (adminUsername != null && adminUsername.trim().isNotEmpty) {
      await prefs.setString(_adminUsernameKey, adminUsername.trim().toLowerCase());
    }
    if (!prefs.containsKey(_idKey)) {
      await prefs.setString(_idKey, 'KALRO${DateTime.now().millisecondsSinceEpoch % 1000000}');
    }
  }


  Future<void> setLanguage(String lang) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_languageKey, lang);
  }
  Future<String> getLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_languageKey) ?? 'English';
  }

  Future<UserRole> getRole() async {
    final prefs = await SharedPreferences.getInstance();
    final value = prefs.getString(_roleKey);
    if (value == null) return UserRole.swr;
    return UserRole.values.byName(value);
  }

  Future<void> setRole(UserRole role) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_roleKey, role.name);
  }

  Future<String> getDisplayName() async {
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString(_nameKey) ?? 'Farmer';
    if (name.trim().isEmpty || name.trim().toLowerCase() == 'admin') {
      return 'Farmer';
    }
    return name;
  }

  Future<String> getOrgName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_orgKey) ?? 'Kalro Sericulture Farm';
  }

  Future<String> getAdminUsername() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_adminUsernameKey) ?? 'admin';
  }

  Future<String> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_idKey) ?? 'KALRO000001';
  }

  Future<void> updateProfile({String? name, String? orgName}) async {
    final prefs = await SharedPreferences.getInstance();
    if (name != null && name.trim().isNotEmpty) {
      await prefs.setString(_nameKey, name.trim());
    }
    if (orgName != null && orgName.trim().isNotEmpty) {
      await prefs.setString(_orgKey, orgName.trim());
    }
  }
}
