import '../services/user_preferences.dart';

/// KALRO field roles collected at onboarding. Account PIN permission is separate.
class RoleAccess {
  const RoleAccess._();

  /// Silkworm rearer: daily logs, leaf, and field guide.
  static bool showFinance(UserRole role) =>
      role == UserRole.rsp || role == UserRole.crc;

  static bool showReports(UserRole role) =>
      role == UserRole.asr || role == UserRole.rsp || role == UserRole.crc;

  static bool isSupportUnit(UserRole role) => role == UserRole.crc;
}
