import '../services/user_preferences.dart';

class ProfileSummary {
  const ProfileSummary({
    required this.name,
    required this.org,
    required this.id,
    required this.role,
    required this.language,
    required this.bombyxLarvaeCount,
    required this.eriLarvaeCount,
    required this.activeBatchCount,
    required this.totalFeedGrams,
    required this.pendingPayables,
    required this.totalPurchases,
  });

  final String name;
  final String org;
  final String id;
  final UserRole role;
  final String language;
  final int bombyxLarvaeCount;
  final int eriLarvaeCount;
  final int activeBatchCount;
  final double totalFeedGrams;
  final double pendingPayables;
  final int totalPurchases;
}
