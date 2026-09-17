import '../models/batch_status.dart';
import '../models/cocoon_harvest.dart';
import '../models/species.dart';
import 'app_repositories.dart';
import 'batch_metrics_service.dart';
import 'leaf_ledger_service.dart';
import 'rearing_conditions_service.dart';
import 'rearing_day_service.dart';

class FarmWorkStats {
  const FarmWorkStats({
    required this.feedTodayGrams,
    required this.suggestedTodayGrams,
    required this.deathsToday,
    required this.harvestWindowOpen,
    required this.lastHarvestKg,
    required this.leafStockKg,
    required this.leafNeedTodayKg,
    required this.daysOfCover,
    this.guideSpecies,
    this.guideCycleDay,
    this.guideStageKey,
    this.guideIsMoult = false,
    this.guideIsLightFeedDay = false,
    this.guideActionTitle,
  });

  final double feedTodayGrams;
  final double suggestedTodayGrams;
  final int deathsToday;
  final bool harvestWindowOpen;
  final double lastHarvestKg;
  final double leafStockKg;
  final double leafNeedTodayKg;
  final double daysOfCover;
  final Species? guideSpecies;
  final int? guideCycleDay;
  final String? guideStageKey;
  final bool guideIsMoult;
  final bool guideIsLightFeedDay;
  final String? guideActionTitle;

  static DateTime dateOnly(DateTime d) => DateTime(d.year, d.month, d.day);
}

class FarmWorkStatsService {
  const FarmWorkStatsService();

  Future<FarmWorkStats> load(AppRepositories repositories) async {
    final batches = await repositories.batches.getAll();
    final feedLogs = await repositories.feedLogs.getAll();
    final mortality = await repositories.mortalityLogs.getAll();
    final harvests = await repositories.cocoonHarvests.getAll();
    final env = await repositories.environmentLogs.getAll();
    final leaf = await repositories.leafInventory.get();
    final today = FarmWorkStats.dateOnly(DateTime.now());
    const days = RearingDayService();
    const metrics = BatchMetricsService();
    const conditions = RearingConditionsService();

    var feedToday = 0.0;
    for (final log in feedLogs) {
      if (FarmWorkStats.dateOnly(log.recordedAt) == today) {
        feedToday += log.quantityGrams;
      }
    }
    var deathsToday = 0;
    for (final log in mortality) {
      if (FarmWorkStats.dateOnly(log.recordedAt) == today) {
        deathsToday += log.count;
      }
    }

    var suggested = 0.0;
    var leafNeed = 0.0;
    var harvestOpen = false;
    Species? guideSpecies;
    int? guideCycleDay;
    String? guideStageKey;
    var guideIsMoult = false;
    var guideIsLightFeedDay = false;
    String? guideActionTitle;
    final active = batches.where((b) => b.status != BatchStatus.closed);
    for (final batch in active) {
      final observations =
          await repositories.milestoneObservations.stageDatesForBatch(batch.id);
      final deaths = mortality
          .where((l) => l.batchId == batch.id)
          .fold<int>(0, (sum, l) => sum + l.count);
      final live = metrics.compute(batch, deaths).liveCount;
      final plan = days.planFor(
        batch,
        observedStageDates: observations,
        conditions: conditions.fromLogs(
          batch: batch,
          environmentLogs: env,
          feedLogs: feedLogs,
        ),
        liveCount: live,
        now: today,
      );
      if (plan == null) continue;
      suggested += plan.suggestedGrams;
      leafNeed += plan.suggestedGrams / 1000;
      if (plan.isHarvestWork) harvestOpen = true;
      if (guideSpecies == null) {
        guideSpecies = batch.species;
        guideCycleDay = plan.cycleDay;
        guideStageKey = plan.stage.key;
        guideIsMoult = plan.stage.isMoult;
        guideIsLightFeedDay = plan.isLightFeedDay;
        guideActionTitle = plan.actionTitle;
      }
    }

    CocoonHarvest? latest;
    for (final h in harvests) {
      if (latest == null || h.harvestDate.isAfter(latest.harvestDate)) {
        latest = h;
      }
    }

    final stock = leaf.mulberryKg + leaf.castorKg + leaf.kesseruKg;
    return FarmWorkStats(
      feedTodayGrams: feedToday,
      suggestedTodayGrams: suggested,
      deathsToday: deathsToday,
      harvestWindowOpen: harvestOpen,
      lastHarvestKg: (latest?.totalWeightGrams ?? 0) / 1000,
      leafStockKg: stock,
      leafNeedTodayKg: leafNeed,
      daysOfCover: LeafLedgerService.daysOfCover(
        stockKg: stock,
        dailyNeedKg: leafNeed,
      ),
      guideSpecies: guideSpecies,
      guideCycleDay: guideCycleDay,
      guideStageKey: guideStageKey,
      guideIsMoult: guideIsMoult,
      guideIsLightFeedDay: guideIsLightFeedDay,
      guideActionTitle: guideActionTitle,
    );
  }
}
