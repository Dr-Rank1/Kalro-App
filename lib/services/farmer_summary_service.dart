import '../models/batch_alert.dart';
import '../models/dashboard_summary.dart';
import '../models/species.dart';
import '../models/today_task.dart';
import 'app_repositories.dart';
import 'dashboard_service.dart';
import 'reminder_preferences.dart';
import 'user_preferences.dart';

class FarmerSummary {
  const FarmerSummary({
    required this.displayName,
    required this.farmRoleLabel,
    required this.activeBatchCount,
    required this.bombyxLarvaeCount,
    required this.eriLarvaeCount,
    required this.feedTodayGrams,
    required this.feedTotalGrams,
    required this.alertCount,
    required this.todayTaskCount,
    required this.remindersEnabled,
    required this.nextMilestone,
    required this.todayTasks,
    required this.alerts,
    required this.averageSurvivalPercent,
  });

  final String displayName;
  final String farmRoleLabel;
  final int activeBatchCount;
  final int bombyxLarvaeCount;
  final int eriLarvaeCount;
  final double feedTodayGrams;
  final double feedTotalGrams;
  final int alertCount;
  final int todayTaskCount;
  final bool remindersEnabled;
  final UpcomingMilestoneItem? nextMilestone;
  final List<TodayTask> todayTasks;
  final List<BatchAlert> alerts;
  final double averageSurvivalPercent;
}

class FarmerSummaryService {
  FarmerSummaryService({
    DashboardService? dashboardService,
    ReminderPreferences? reminderPreferences,
  })  : _dashboard = dashboardService ?? const DashboardService(),
        _reminders = reminderPreferences ?? ReminderPreferences();

  final DashboardService _dashboard;
  final ReminderPreferences _reminders;

  Future<FarmerSummary> load({
    required AppRepositories repositories,
    required UserPreferences userPreferences,
  }) async {
    final dashboard = await _dashboard.load(
      repositories: repositories,
      userPreferences: userPreferences,
    );
    final reminderSettings = await _reminders.getSettings();
    final role = await userPreferences.getRole();

    return FarmerSummary(
      displayName: dashboard.displayName,
      farmRoleLabel: role.label,
      activeBatchCount: dashboard.activeBatchCount,
      bombyxLarvaeCount: _larvaeForSpecies(dashboard, Species.bombyx),
      eriLarvaeCount: _larvaeForSpecies(dashboard, Species.eri),
      feedTodayGrams: dashboard.feedTodayGrams,
      feedTotalGrams: dashboard.feedTotalGrams,
      alertCount: dashboard.alertCount,
      todayTaskCount: dashboard.todayTasks.length,
      remindersEnabled: reminderSettings.enabled,
      nextMilestone: dashboard.nextMilestone,
      todayTasks: dashboard.todayTasks.take(5).toList(),
      alerts: dashboard.alerts.take(5).toList(),
      averageSurvivalPercent: dashboard.averageSurvivalPercent,
    );
  }

  int _larvaeForSpecies(DashboardSummary dashboard, Species species) {
    var count = 0;
    for (final batch in dashboard.activeBatches) {
      if (batch.species == species) {
        count += batch.eggCount;
      }
    }
    return count;
  }
}
