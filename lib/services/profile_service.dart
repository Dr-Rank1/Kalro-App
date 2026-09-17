import 'dart:convert';
import 'dart:io';

import '../models/app_user.dart';
import '../models/batch.dart';
import '../models/batch_status.dart';
import '../models/cocoon_harvest.dart';
import '../models/cycle_memory.dart';
import '../models/farm_profile.dart';
import '../models/payment_direction.dart';
import '../models/payment_status.dart';
import '../models/profile_summary.dart';
import '../models/species.dart';
import 'app_repositories.dart';
import 'batch_metrics_service.dart';
import 'cycle_memory_service.dart';
import 'reminder_preferences.dart';
import 'user_preferences.dart';

class ProfileService {
  ProfileService({
    BatchMetricsService? metrics,
    CycleMemoryService? memory,
    ReminderPreferences? reminders,
  })  : _metrics = metrics ?? const BatchMetricsService(),
        _memory = memory ?? const CycleMemoryService(),
        _reminders = reminders ?? ReminderPreferences();

  final BatchMetricsService _metrics;
  final CycleMemoryService _memory;
  final ReminderPreferences _reminders;

  Future<ProfileSummary> load({
    required AppRepositories repositories,
    required UserPreferences userPreferences,
    required UserSession session,
  }) async {
    final batches = await repositories.batches.getAll();
    final harvests = await repositories.cocoonHarvests.getAll();
    final mortality = await repositories.mortalityLogs.getAll();
    final feed = await repositories.feedLogs.getAll();
    final purchases = await repositories.purchaseOrders.getAll();
    final payments = await repositories.payments.getAll();
    final prices = await repositories.inventorySettings.get();
    final leaf = await repositories.leafInventory.get();
    final reminders = await _reminders.getSettings();
    final role = await userPreferences.getRole();
    final language = await userPreferences.getLanguage();
    DateTime? lastBackupAt;
    try {
      final metaFile = File('${session.farmDirectoryPath}/sync_meta.json');
      if (metaFile.existsSync()) {
        final meta =
            jsonDecode(metaFile.readAsStringSync()) as Map<String, dynamic>;
        final uploaded = meta['lastUploadedAt'] as String?;
        final snapshot = meta['lastSnapshotExportedAt'] as String?;
        lastBackupAt = uploaded == null ? null : DateTime.tryParse(uploaded);
        lastBackupAt ??=
            snapshot == null ? null : DateTime.tryParse(snapshot);
      }
    } catch (_) {}

    var activeLots = 0;
    var closedLots = 0;
    var liveBombyx = 0;
    var liveEri = 0;
    var closedSurvivalSum = 0.0;
    var closedSurvivalN = 0;
    var liveSurvivalSum = 0.0;
    var liveSurvivalN = 0;

    for (final batch in batches) {
      final deaths = mortality
          .where((l) => l.batchId == batch.id)
          .fold<int>(0, (sum, l) => sum + l.count);
      final metrics = _metrics.compute(batch, deaths);
      final closed = batch.status == BatchStatus.closed ||
          batch.status == BatchStatus.harvested;
      if (closed) {
        closedLots++;
      } else {
        activeLots++;
        if (batch.species == Species.bombyx) {
          liveBombyx += metrics.liveCount;
        } else {
          liveEri += metrics.liveCount;
        }
      }
      if (batch.eggCount > 0) {
        if (closed) {
          closedSurvivalSum += metrics.survivalRatePercent;
          closedSurvivalN++;
        } else {
          liveSurvivalSum += metrics.survivalRatePercent;
          liveSurvivalN++;
        }
      }
    }

    final harvestKg = harvests.fold<double>(
          0,
          (sum, h) => sum + h.totalWeightGrams,
        ) /
        1000;

    var pendingPayables = 0.0;
    for (final payment in payments) {
      if (payment.status == PaymentStatus.pending &&
          payment.direction == PaymentDirection.payable) {
        pendingPayables += payment.amount;
      }
    }

    final closedBatches = batches
        .where(
          (b) =>
              b.status == BatchStatus.closed ||
              b.status == BatchStatus.harvested,
        )
        .toList()
      ..sort(
        (a, b) => _closedAt(b, harvests).compareTo(_closedAt(a, harvests)),
      );

    CycleMemory? lastCycle;
    if (closedBatches.isNotEmpty) {
      final batch = closedBatches.first;
      lastCycle = _memory.build(
        batch: batch,
        feedLogs: feed,
        mortalityLogs: mortality,
        harvests: harvests,
        purchases: purchases,
        prices: prices,
        observedStageDates:
            await repositories.milestoneObservations.stageDatesForBatch(batch.id),
      );
    }

    final averageSurvival = closedSurvivalN > 0
        ? closedSurvivalSum / closedSurvivalN
        : (liveSurvivalN > 0 ? liveSurvivalSum / liveSurvivalN : 0.0);

    return ProfileSummary(
      name: session.user.displayName,
      org: session.farm.orgName,
      id: session.user.id,
      role: role,
      language: language,
      bombyxLarvaeCount: liveBombyx,
      eriLarvaeCount: liveEri,
      activeBatchCount: activeLots,
      totalFeedGrams: feed.fold<double>(0, (sum, l) => sum + l.quantityGrams),
      pendingPayables: pendingPayables,
      totalPurchases: purchases.length,
      closedBatchCount: closedLots,
      harvestKg: harvestKg,
      harvestCount: harvests.length,
      averageSurvivalPercent: averageSurvival,
      lastCycle: lastCycle,
      lastBackupAt: lastBackupAt,
      remindersEnabled: reminders.enabled,
      reminderHour: reminders.dailyFeedingHour,
      reminderMinute: reminders.dailyFeedingMinute,
      memberSince: session.user.createdAt,
      farmCreatedAt: session.farm.createdAt,
      leafStockKg: leaf.stockKg,
      teamMembers: await _team(session),
    );
  }

  DateTime _closedAt(Batch batch, List<CocoonHarvest> harvests) {
    DateTime? latest;
    for (final harvest in harvests) {
      if (harvest.batchId != batch.id) continue;
      if (latest == null || harvest.harvestDate.isAfter(latest)) {
        latest = harvest.harvestDate;
      }
    }
    return latest ?? batch.startDate;
  }

  Future<List<AppUser>> _team(UserSession session) async {
    try {
      final file = File('${session.farmDirectoryPath}/users.json');
      if (!file.existsSync()) return [session.user];
      final decoded = jsonDecode(file.readAsStringSync()) as List<dynamic>;
      final users = decoded
          .map((item) => AppUser.fromJson(item as Map<String, dynamic>))
          .where((user) => user.active)
          .toList();
      if (users.isEmpty) return [session.user];
      users.sort((a, b) {
        if (a.id == session.user.id) return -1;
        if (b.id == session.user.id) return 1;
        return a.displayName.toLowerCase().compareTo(b.displayName.toLowerCase());
      });
      return users;
    } catch (_) {
      return [session.user];
    }
  }
}
