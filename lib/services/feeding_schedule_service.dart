import '../models/batch.dart';
import '../models/feed_log.dart';
import '../models/species.dart';
import '../models/today_task.dart';
import 'lifecycle_engine.dart';

class FeedingScheduleService {
  const FeedingScheduleService({LifecycleEngine? lifecycleEngine})
      : _lifecycleEngine = lifecycleEngine ?? const LifecycleEngine();

  final LifecycleEngine _lifecycleEngine;

  /// Suggested daily feed in grams per 100 larvae based on instar stage.
  double suggestedDailyFeedGrams(Batch batch) {
    final current = _lifecycleEngine.currentStage(batch);
    final instar = current?.instarNumber;
    if (instar == null) {
      return batch.species == Species.bombyx ? 50 : 80;
    }

    return switch (instar) {
      1 => batch.species == Species.bombyx ? 20 : 30,
      2 => batch.species == Species.bombyx ? 40 : 50,
      3 => batch.species == Species.bombyx ? 80 : 100,
      4 => batch.species == Species.bombyx ? 150 : 180,
      5 => batch.species == Species.bombyx ? 250 : 300,
      _ => 100,
    } *
        (batch.eggCount / 100);
  }

  List<TodayTask> buildTasks({
    required List<Batch> activeBatches,
    required List<FeedLog> feedLogs,
    Map<String, DateTime>? observationsByBatch,
  }) {
    final tasks = <TodayTask>[];
    final today = _dateOnly(DateTime.now());

    for (final batch in activeBatches) {
      final fedToday = feedLogs.any(
        (l) => l.batchId == batch.id && _dateOnly(l.recordedAt) == today,
      );
      if (!fedToday) {
        final grams = suggestedDailyFeedGrams(batch);
        tasks.add(
          TodayTask(
            type: TodayTaskType.feeding,
            title: 'Feed ${batch.species.label} batch',
            subtitle:
                'Suggested ~${grams.toStringAsFixed(0)}g for ${batch.eggCount} larvae',
            batchId: batch.id,
          ),
        );
      }

      final next = _lifecycleEngine.nextMilestone(batch);
      if (next != null) {
        final daysUntil =
            _dateOnly(next.expectedDate).difference(today).inDays;
        if (daysUntil >= 0 && daysUntil <= 1) {
          tasks.add(
            TodayTask(
              type: TodayTaskType.milestone,
              title: next.label,
              subtitle: daysUntil == 0
                  ? 'Expected today — ${batch.species.label}'
                  : 'Expected tomorrow — ${batch.species.label}',
              batchId: batch.id,
              isOverdue: daysUntil < 0,
            ),
          );
        }
      }

      tasks.add(
        TodayTask(
          type: TodayTaskType.mortalityCheck,
          title: 'Record mortality check',
          subtitle: '${batch.species.label} batch daily count',
          batchId: batch.id,
        ),
      );
    }

    return tasks;
  }

  DateTime _dateOnly(DateTime date) {
    return DateTime(date.year, date.month, date.day);
  }
}
