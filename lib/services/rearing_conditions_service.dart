import '../models/batch.dart';
import '../models/environment_log.dart';
import '../models/feed_log.dart';
import '../models/rearing_conditions.dart';
import 'feeding_schedule_service.dart';

/// Builds [RearingConditions] from recorded temperature, humidity, and feed.
class RearingConditionsService {
  const RearingConditionsService({
    FeedingScheduleService? feedingSchedule,
  }) : _feedingSchedule = feedingSchedule ?? const FeedingScheduleService();

  final FeedingScheduleService _feedingSchedule;

  RearingConditions fromLogs({
    required Batch batch,
    required List<EnvironmentLog> environmentLogs,
    required List<FeedLog> feedLogs,
    DateTime? now,
  }) {
    final today = _dateOnly(now ?? DateTime.now());
    final weekStart = today.subtract(const Duration(days: 6));

    final env = environmentLogs.where((log) => log.batchId == batch.id).toList();
    double? temperature;
    double? humidity;
    if (env.isNotEmpty) {
      var tempSum = 0.0;
      var humSum = 0.0;
      var count = 0;
      for (final log in env) {
        if (_dateOnly(log.recordedAt).isBefore(weekStart)) continue;
        tempSum += log.temperatureCelsius;
        humSum += log.humidityPercent;
        count++;
      }
      if (count == 0) {
        final latest = env.reduce(
          (a, b) => a.recordedAt.isAfter(b.recordedAt) ? a : b,
        );
        temperature = latest.temperatureCelsius;
        humidity = latest.humidityPercent;
      } else {
        temperature = tempSum / count;
        humidity = humSum / count;
      }
    }

    final feeds = feedLogs.where((log) => log.batchId == batch.id).toList();
    double? feedRatio;
    var missed = 0;
    if (feeds.isNotEmpty) {
      var weekGrams = 0.0;
      final fedDays = <DateTime>{};
      for (final log in feeds) {
        final day = _dateOnly(log.recordedAt);
        if (day.isBefore(weekStart) || day.isAfter(today)) continue;
        weekGrams += log.quantityGrams;
        fedDays.add(day);
      }
      final daysLived = today.difference(_dateOnly(batch.startDate)).inDays + 1;
      final windowDays = daysLived < 7 ? daysLived.clamp(1, 7) : 7;
      missed = windowDays - fedDays.length;
      if (missed < 0) missed = 0;

      final suggested =
          _feedingSchedule.suggestedDailyFeedGrams(batch, now: today) * windowDays;
      if (suggested > 0 && weekGrams > 0) {
        feedRatio = weekGrams / suggested;
      }
    }

    return RearingConditions(
      temperatureC: temperature,
      humidityPercent: humidity,
      feedRatio: feedRatio,
      missedFeedDays: missed,
      fromLogs: temperature != null || humidity != null || feedRatio != null || missed > 0,
    );
  }

  DateTime _dateOnly(DateTime date) => DateTime(date.year, date.month, date.day);
}
