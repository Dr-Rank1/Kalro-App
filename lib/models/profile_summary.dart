import '../services/user_preferences.dart';
import 'app_user.dart';
import 'cycle_memory.dart';

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
    this.closedBatchCount = 0,
    this.harvestKg = 0,
    this.harvestCount = 0,
    this.averageSurvivalPercent = 0,
    this.lastCycle,
    this.lastBackupAt,
    this.remindersEnabled = true,
    this.reminderHour = 8,
    this.reminderMinute = 0,
    this.memberSince,
    this.farmCreatedAt,
    this.leafStockKg = 0,
    this.teamMembers = const [],
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
  final int closedBatchCount;
  final double harvestKg;
  final int harvestCount;
  final double averageSurvivalPercent;
  final CycleMemory? lastCycle;
  final DateTime? lastBackupAt;
  final bool remindersEnabled;
  final int reminderHour;
  final int reminderMinute;
  final DateTime? memberSince;
  final DateTime? farmCreatedAt;
  final double leafStockKg;
  final List<AppUser> teamMembers;

  int get totalLots => activeBatchCount + closedBatchCount;

  double get feedKg => totalFeedGrams / 1000;

  String get reminderClock {
    final hour = reminderHour.toString().padLeft(2, '0');
    final minute = reminderMinute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}
