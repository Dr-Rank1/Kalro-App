import '../models/batch.dart';
import '../models/batch_status.dart';
import '../models/rearing_conditions.dart';
import 'rearing_day_service.dart';

enum WeekDayKind { empty, feed, rest, harvest, mixed }

class WeekDaySummary {
  const WeekDaySummary({
    required this.date,
    required this.kind,
    required this.feedCount,
    required this.restCount,
    required this.harvestCount,
  });

  final DateTime date;
  final WeekDayKind kind;
  final int feedCount;
  final int restCount;
  final int harvestCount;
}

class WeekPlanService {
  const WeekPlanService();

  List<WeekDaySummary> nextDays({
    required List<Batch> batches,
    required Map<String, Map<String, DateTime>> observations,
    required Map<String, RearingConditions> conditions,
    required Map<String, int> liveCounts,
    DateTime? now,
    int days = 7,
  }) {
    final rearing = const RearingDayService();
    final start = DateTime(
      (now ?? DateTime.now()).year,
      (now ?? DateTime.now()).month,
      (now ?? DateTime.now()).day,
    );
    final active = batches.where((b) => b.status != BatchStatus.closed).toList();

    return List.generate(days, (i) {
      final date = start.add(Duration(days: i));
      var feed = 0;
      var rest = 0;
      var harvest = 0;
      for (final batch in active) {
        final plan = rearing.planFor(
          batch,
          observedStageDates: observations[batch.id],
          conditions: conditions[batch.id],
          liveCount: liveCounts[batch.id],
          now: date,
        );
        if (plan == null) continue;
        if (plan.isHarvestWork) {
          harvest++;
        } else if (plan.stopFeeding) {
          rest++;
        } else if (plan.suggestedGrams > 0) {
          feed++;
        }
      }
      final kind = _kind(feed: feed, rest: rest, harvest: harvest);
      return WeekDaySummary(
        date: date,
        kind: kind,
        feedCount: feed,
        restCount: rest,
        harvestCount: harvest,
      );
    });
  }

  WeekDayKind _kind({required int feed, required int rest, required int harvest}) {
    final kinds = [if (feed > 0) 1, if (rest > 0) 1, if (harvest > 0) 1].length;
    if (feed + rest + harvest == 0) return WeekDayKind.empty;
    if (kinds > 1) return WeekDayKind.mixed;
    if (harvest > 0) return WeekDayKind.harvest;
    if (rest > 0) return WeekDayKind.rest;
    return WeekDayKind.feed;
  }
}
