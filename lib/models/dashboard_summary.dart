import 'batch.dart';
import 'lifecycle_milestone.dart';
import 'batch_alert.dart';
import 'rearing_conditions.dart';
import 'today_task.dart';

class UpcomingMilestoneItem {
  const UpcomingMilestoneItem({
    required this.batch,
    required this.milestone,
    required this.daysUntil,
  });

  final Batch batch;
  final LifecycleMilestone milestone;
  final int daysUntil;

  bool get isToday => daysUntil == 0;
  bool get isOverdue => daysUntil < 0;
}

class DashboardSummary {
  const DashboardSummary({
    required this.displayName,
    required this.activeBatches,
    required this.activeBatchCount,
    required this.totalLarvae,
    required this.liveLarvae,
    required this.averageSurvivalPercent,
    required this.feedTodayGrams,
    required this.feedTotalGrams,
    required this.upcomingMilestones,
    required this.nextMilestone,
    required this.alerts,
    required this.todayTasks,
    required this.totalHarvestWeightGrams,
    required this.harvestCount,
    this.observationsByBatch = const {},
    this.conditionsByBatch = const {},
  });

  final String displayName;
  final List<Batch> activeBatches;
  final int activeBatchCount;
  final int totalLarvae;
  final int liveLarvae;
  final double averageSurvivalPercent;
  final double feedTodayGrams;
  final double feedTotalGrams;
  final List<UpcomingMilestoneItem> upcomingMilestones;
  final UpcomingMilestoneItem? nextMilestone;
  final List<BatchAlert> alerts;
  final List<TodayTask> todayTasks;
  final double totalHarvestWeightGrams;
  final int harvestCount;
  final Map<String, Map<String, DateTime>> observationsByBatch;
  final Map<String, RearingConditions> conditionsByBatch;

  int get upcomingThisWeekCount =>
      upcomingMilestones.where((item) => item.daysUntil >= 0 && item.daysUntil <= 7).length;

  int get alertCount => alerts.length;
}
