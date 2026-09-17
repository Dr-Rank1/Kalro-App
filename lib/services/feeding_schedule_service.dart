import '../models/batch.dart';
import '../models/feed_log.dart';
import '../models/mortality_log.dart';
import '../models/rearing_conditions.dart';
import '../models/today_task.dart';
import 'lifecycle_engine.dart';
import 'rearing_day_service.dart';

class FeedingScheduleService {
  const FeedingScheduleService({
    LifecycleEngine? lifecycleEngine,
    RearingDayService? rearingDay,
  })  : _lifecycleEngine = lifecycleEngine ?? const LifecycleEngine(),
        _rearingDay = rearingDay ?? const RearingDayService();

  final LifecycleEngine _lifecycleEngine;
  final RearingDayService _rearingDay;

  /// Suggested daily feed in grams for live larvae on [now].
  double suggestedDailyFeedGrams(
    Batch batch, {
    Map<String, DateTime>? observedStageDates,
    RearingConditions? conditions,
    int? liveCount,
    DateTime? now,
  }) {
    final plan = _rearingDay.planFor(
      batch,
      observedStageDates: observedStageDates,
      conditions: conditions,
      liveCount: liveCount,
      now: now,
    );
    if (plan != null) return plan.suggestedGrams;
    return RearingDayService.fullRationGrams(
      batch.species,
      _lifecycleEngine
          .currentStage(
            batch,
            observedStageDates: observedStageDates,
            conditions: conditions,
          )
          ?.instarNumber,
      liveCount ?? batch.eggCount,
    );
  }

  List<TodayTask> buildTasks({
    required List<Batch> activeBatches,
    required List<FeedLog> feedLogs,
    List<MortalityLog> mortalityLogs = const [],
    Map<String, Map<String, DateTime>>? observationsByBatch,
    Map<String, RearingConditions>? conditionsByBatch,
    Map<String, int>? liveCountByBatch,
    DateTime? now,
  }) {
    final tasks = <TodayTask>[];
    final today = DateTime(
      (now ?? DateTime.now()).year,
      (now ?? DateTime.now()).month,
      (now ?? DateTime.now()).day,
    );

    for (final batch in activeBatches) {
      final observations = observationsByBatch?[batch.id];
      final conditions = conditionsByBatch?[batch.id];
      final live = liveCountByBatch?[batch.id] ?? batch.eggCount;
      final plan = _rearingDay.planFor(
        batch,
        observedStageDates: observations,
        conditions: conditions,
        liveCount: live,
        now: today,
      );

      final fedToday = feedLogs.any(
        (l) => l.batchId == batch.id && _dateOnly(l.recordedAt) == today,
      );
      final mortalityToday = mortalityLogs.any(
        (l) => l.batchId == batch.id && _dateOnly(l.recordedAt) == today,
      );

      if (plan != null) {
        if (plan.suggestedGrams <= 0) {
          tasks.add(
            TodayTask(
              type: TodayTaskType.feeding,
              title: plan.stopFeeding ? 'Stop feeding — ${plan.stage.label}' : plan.actionTitle,
              subtitle: '${batch.species.label} · ${plan.actionDetail}',
              batchId: batch.id,
            ),
          );
        } else if (!fedToday) {
          tasks.add(
            TodayTask(
              type: TodayTaskType.feeding,
              title: plan.isLightFeedDay ? 'Light then full feed' : 'Feed ${batch.species.label}',
              subtitle: plan.feedLabel,
              batchId: batch.id,
            ),
          );
        }

        final harvestStart = plan.harvestWindowStart;
        final harvestEnd = plan.harvestWindowEnd;
        if (harvestStart != null && harvestEnd != null) {
          final inWindow =
              !today.isBefore(harvestStart) && !today.isAfter(harvestEnd);
          if (inWindow) {
            tasks.add(
              TodayTask(
                type: TodayTaskType.milestone,
                title: 'Harvest window',
                subtitle:
                    '${batch.species.label} cocoons · ${harvestStart.day}–${harvestEnd.day}',
                batchId: batch.id,
              ),
            );
          }
        }

        if (plan.showSpinningChecklist) {
          tasks.add(
            TodayTask(
              type: TodayTaskType.milestone,
              title: 'Check spinning / moult signs',
              subtitle: plan.readinessSigns.first,
              batchId: batch.id,
            ),
          );
        }
      } else if (!fedToday) {
        final grams = suggestedDailyFeedGrams(
          batch,
          observedStageDates: observations,
          conditions: conditions,
          liveCount: live,
          now: today,
        );
        tasks.add(
          TodayTask(
            type: TodayTaskType.feeding,
            title: 'Feed ${batch.species.label} batch',
            subtitle: 'Suggested ~${grams.toStringAsFixed(0)}g for $live larvae',
            batchId: batch.id,
          ),
        );
      }

      final next = _lifecycleEngine.nextMilestone(
        batch,
        observedStageDates: observations,
        conditions: conditions,
      );
      if (next != null) {
        final daysUntil = _dateOnly(next.effectiveDate).difference(today).inDays;
        if (daysUntil <= 1) {
          tasks.add(
            TodayTask(
              type: TodayTaskType.milestone,
              title: next.label,
              subtitle: daysUntil < 0
                  ? 'Overdue — ${batch.species.label}'
                  : daysUntil == 0
                      ? 'Expected today — ${batch.species.label}'
                      : 'Expected tomorrow — ${batch.species.label}',
              batchId: batch.id,
              isOverdue: daysUntil < 0,
            ),
          );
        }
      }

      if (!mortalityToday) {
        tasks.add(
          TodayTask(
            type: TodayTaskType.mortalityCheck,
            title: 'Record mortality check',
            subtitle: '${batch.species.label} batch daily count',
            batchId: batch.id,
          ),
        );
      }
    }

    return tasks;
  }

  DateTime _dateOnly(DateTime date) {
    return DateTime(date.year, date.month, date.day);
  }
}
