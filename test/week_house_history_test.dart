import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/batch.dart';
import 'package:kalro/models/batch_status.dart';
import 'package:kalro/models/environment_log.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/house_history.dart';
import 'package:kalro/services/week_plan_service.dart';

void main() {
  test('week strip marks feed, rest, or harvest from rearing plans', () {
    final batch = Batch(
      id: 'b1',
      species: Species.bombyx,
      startDate: DateTime(2026, 1, 1),
      eggCount: 100,
      status: BatchStatus.active,
      createdAt: DateTime(2026, 1, 1),
    );
    final week = const WeekPlanService().nextDays(
      batches: [batch],
      observations: const {},
      conditions: const {},
      liveCounts: const {'b1': 100},
      now: DateTime(2026, 1, 20),
    );
    expect(week, hasLength(7));
    expect(week.any((d) => d.kind != WeekDayKind.empty), isTrue);
  });

  test('house history classifies cool, ok, and hot days', () {
    final now = DateTime(2026, 4, 10);
    final logs = [
      EnvironmentLog(
        id: '1',
        batchId: 'b1',
        recordedAt: DateTime(2026, 4, 10, 8),
        temperatureCelsius: 31,
        humidityPercent: 70,
      ),
      EnvironmentLog(
        id: '2',
        batchId: 'b1',
        recordedAt: DateTime(2026, 4, 9, 8),
        temperatureCelsius: 20,
        humidityPercent: 70,
      ),
      EnvironmentLog(
        id: '3',
        batchId: 'b1',
        recordedAt: DateTime(2026, 4, 8, 8),
        temperatureCelsius: 25,
        humidityPercent: 70,
      ),
    ];
    final days = HouseHistory.lastDays(logs, days: 4, now: now);
    expect(days, hasLength(4));
    expect(days.last.feel, HouseDayFeel.hot);
    expect(days[2].feel, HouseDayFeel.cool);
    expect(days[1].feel, HouseDayFeel.ok);
    expect(HouseHistory.hotDays(days), 1);
  });
}
