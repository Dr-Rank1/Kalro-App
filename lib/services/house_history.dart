import '../models/environment_log.dart';
import '../theme/kalro_colors.dart';
import 'package:flutter/material.dart';

enum HouseDayFeel { unknown, cool, ok, hot }

class HouseDay {
  const HouseDay({required this.date, required this.feel, this.label});

  final DateTime date;
  final HouseDayFeel feel;
  final String? label;

  Color get color => switch (feel) {
        HouseDayFeel.unknown => KalroColors.divider,
        HouseDayFeel.cool => KalroColors.info,
        HouseDayFeel.ok => KalroColors.success,
        HouseDayFeel.hot => KalroColors.danger,
      };
}

class HouseHistory {
  static DateTime dateOnly(DateTime d) => DateTime(d.year, d.month, d.day);

  static List<HouseDay> lastDays(
    List<EnvironmentLog> logs, {
    int days = 14,
    DateTime? now,
  }) {
    final today = dateOnly(now ?? DateTime.now());
    final byDay = <DateTime, EnvironmentLog>{};
    for (final log in logs) {
      final day = dateOnly(log.recordedAt);
      final existing = byDay[day];
      if (existing == null || log.recordedAt.isAfter(existing.recordedAt)) {
        byDay[day] = log;
      }
    }

    return List.generate(days, (i) {
      final date = today.subtract(Duration(days: days - 1 - i));
      final log = byDay[date];
      if (log == null) {
        return HouseDay(date: date, feel: HouseDayFeel.unknown);
      }
      final feel = log.temperatureCelsius >= 30
          ? HouseDayFeel.hot
          : log.temperatureCelsius <= 22
              ? HouseDayFeel.cool
              : HouseDayFeel.ok;
      return HouseDay(date: date, feel: feel, label: log.notes);
    });
  }

  static int hotDays(List<HouseDay> days) =>
      days.where((d) => d.feel == HouseDayFeel.hot).length;
}
