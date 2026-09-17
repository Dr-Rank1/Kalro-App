import '../models/batch_status.dart';
import '../models/dashboard_summary.dart';
import '../models/rearing_conditions.dart';
import 'alert_service.dart';
import 'app_repositories.dart';
import 'batch_metrics_service.dart';
import 'feeding_schedule_service.dart';
import 'lifecycle_engine.dart';
import 'rearing_conditions_service.dart';
import 'rearing_day_service.dart';
import 'user_preferences.dart';

class DashboardService {
  const DashboardService({
    LifecycleEngine? lifecycleEngine,
    BatchMetricsService? metricsService,
    AlertService? alertService,
    FeedingScheduleService? feedingScheduleService,
    RearingConditionsService? conditionsService,
    RearingDayService? rearingDayService,
  })  : _lifecycleEngine = lifecycleEngine ?? const LifecycleEngine(),
        _metricsService = metricsService ?? const BatchMetricsService(),
        _alertService = alertService ?? const AlertService(),
        _feedingScheduleService =
            feedingScheduleService ?? const FeedingScheduleService(),
        _conditionsService =
            conditionsService ?? const RearingConditionsService(),
        _rearingDay = rearingDayService ?? const RearingDayService();

  final LifecycleEngine _lifecycleEngine;
  final BatchMetricsService _metricsService;
  final AlertService _alertService;
  final FeedingScheduleService _feedingScheduleService;
  final RearingConditionsService _conditionsService;
  final RearingDayService _rearingDay;

  Future<DashboardSummary> load({
    required AppRepositories repositories,
    required UserPreferences userPreferences,
  }) async {
    final batches = await repositories.batches.getAll();
    final feedLogs = await repositories.feedLogs.getAll();
    final mortalityLogs = await repositories.mortalityLogs.getAll();
    final environmentLogs = await repositories.environmentLogs.getAll();
    final harvests = await repositories.cocoonHarvests.getAll();
    final displayName = await userPreferences.getDisplayName();
    final today = _dateOnly(DateTime.now());

    final active = batches
        .where((batch) => batch.status != BatchStatus.closed)
        .toList()
      ..sort((a, b) => b.startDate.compareTo(a.startDate));

    var totalLarvae = 0;
    var liveLarvae = 0;
    var survivalSum = 0.0;
    var survivalSamples = 0;

    final liveCountByBatch = <String, int>{};
    for (final batch in active) {
      totalLarvae += batch.eggCount;
      final mortality = mortalityLogs
          .where((l) => l.batchId == batch.id)
          .fold<int>(0, (sum, l) => sum + l.count);
      final metrics = _metricsService.compute(batch, mortality);
      liveLarvae += metrics.liveCount;
      liveCountByBatch[batch.id] = metrics.liveCount;
      if (batch.eggCount > 0) {
        survivalSum += metrics.survivalRatePercent;
        survivalSamples++;
      }
    }

    var feedTodayGrams = 0.0;
    var feedTotalGrams = 0.0;
    for (final log in feedLogs) {
      feedTotalGrams += log.quantityGrams;
      if (_dateOnly(log.recordedAt) == today) {
        feedTodayGrams += log.quantityGrams;
      }
    }

    var totalHarvestWeight = 0.0;
    for (final harvest in harvests) {
      totalHarvestWeight += harvest.totalWeightGrams;
    }

    final observationsByBatch = <String, Map<String, DateTime>>{};
    final conditionsByBatch = <String, RearingConditions>{};
    for (final batch in active) {
      observationsByBatch[batch.id] =
          await repositories.milestoneObservations.stageDatesForBatch(batch.id);
      conditionsByBatch[batch.id] = _conditionsService.fromLogs(
        batch: batch,
        environmentLogs: environmentLogs,
        feedLogs: feedLogs,
      );
    }

    final upcoming = <UpcomingMilestoneItem>[];
    for (final batch in active) {
      final observations = observationsByBatch[batch.id] ?? {};
      final conditions = conditionsByBatch[batch.id];
      for (final milestone in _lifecycleEngine.predict(
        batch,
        observedStageDates: observations,
        conditions: conditions,
      )) {
        final daysUntil =
            _dateOnly(milestone.effectiveDate).difference(today).inDays;
        if (daysUntil >= -1 && daysUntil <= 14) {
          upcoming.add(
            UpcomingMilestoneItem(
              batch: batch,
              milestone: milestone,
              daysUntil: daysUntil,
            ),
          );
        }
      }
    }

    upcoming.sort((a, b) {
      final dateCompare =
          a.milestone.effectiveDate.compareTo(b.milestone.effectiveDate);
      if (dateCompare != 0) return dateCompare;
      return a.batch.species.label.compareTo(b.batch.species.label);
    });

    final alerts = _alertService.evaluate(
      batches: batches,
      mortalityLogs: mortalityLogs,
      environmentLogs: environmentLogs,
      feedLogs: feedLogs,
    );

    final todayTasks = _feedingScheduleService.buildTasks(
      activeBatches: active,
      feedLogs: feedLogs,
      mortalityLogs: mortalityLogs,
      observationsByBatch: observationsByBatch,
      conditionsByBatch: conditionsByBatch,
      liveCountByBatch: liveCountByBatch,
    );

    var suggestedFeedTodayGrams = 0.0;
    var leafNeedTodayKg = 0.0;
    var harvestWindowOpen = false;
    for (final batch in active) {
      final plan = _rearingDay.planFor(
        batch,
        observedStageDates: observationsByBatch[batch.id],
        conditions: conditionsByBatch[batch.id],
        liveCount: liveCountByBatch[batch.id],
        now: today,
      );
      if (plan == null) continue;
      suggestedFeedTodayGrams += plan.suggestedGrams;
      leafNeedTodayKg += plan.suggestedGrams / 1000;
      if (plan.isHarvestWork) harvestWindowOpen = true;
    }

    final fedTodayByBatch = <String, bool>{};
    final deathsTodayByBatch = <String, int>{};
    for (final batch in active) {
      fedTodayByBatch[batch.id] = feedLogs.any(
        (l) => l.batchId == batch.id && _dateOnly(l.recordedAt) == today,
      );
      deathsTodayByBatch[batch.id] = mortalityLogs
          .where((l) => l.batchId == batch.id && _dateOnly(l.recordedAt) == today)
          .fold<int>(0, (sum, l) => sum + l.count);
    }

    final leaf = await repositories.leafInventory.get();

    return DashboardSummary(
      displayName: displayName,
      activeBatches: active,
      activeBatchCount: active.length,
      totalLarvae: totalLarvae,
      liveLarvae: liveLarvae,
      averageSurvivalPercent:
          survivalSamples > 0 ? survivalSum / survivalSamples : 0,
      feedTodayGrams: feedTodayGrams,
      feedTotalGrams: feedTotalGrams,
      upcomingMilestones: upcoming,
      nextMilestone: upcoming.isEmpty ? null : upcoming.first,
      alerts: alerts,
      todayTasks: todayTasks,
      totalHarvestWeightGrams: totalHarvestWeight,
      harvestCount: harvests.length,
      observationsByBatch: observationsByBatch,
      conditionsByBatch: conditionsByBatch,
      liveCountByBatch: liveCountByBatch,
      suggestedFeedTodayGrams: suggestedFeedTodayGrams,
      leafNeedTodayKg: leafNeedTodayKg,
      mulberryStockKg: leaf.mulberryKg,
      eriHostStockKg: leaf.castorKg + leaf.kesseruKg,
      harvestWindowOpen: harvestWindowOpen,
      fedTodayByBatch: fedTodayByBatch,
      deathsTodayByBatch: deathsTodayByBatch,
    );
  }

  DateTime _dateOnly(DateTime date) {
    return DateTime(date.year, date.month, date.day);
  }
}
