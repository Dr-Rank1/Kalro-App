import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/batch.dart';
import 'package:kalro/models/batch_status.dart';
import 'package:kalro/models/environment_log.dart';
import 'package:kalro/models/feed_log.dart';
import 'package:kalro/models/lifecycle_milestone.dart';
import 'package:kalro/models/rearing_conditions.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/lifecycle_engine.dart';
import 'package:kalro/services/prediction_adjuster.dart';
import 'package:kalro/services/rearing_conditions_service.dart';

void main() {
  const engine = LifecycleEngine();
  const adjuster = PredictionAdjuster();
  const conditionsService = RearingConditionsService();
  final start = DateTime(2026, 1, 1);

  Batch sample({Species species = Species.bombyx}) {
    return Batch(
      id: 'b1',
      species: species,
      startDate: start,
      eggCount: 100,
      status: BatchStatus.active,
      createdAt: start,
    );
  }

  List<LifecycleMilestone> predict(RearingScenario scenario, {Species species = Species.bombyx}) {
    return engine.predictFor(
      species: species,
      startDate: start,
      conditions: scenario.conditionsFor(species),
    );
  }

  int stageDays(List<LifecycleMilestone> milestones, String key) {
    final index = milestones.indexWhere((m) => m.stageKey == key);
    expect(index, isNonNegative);
    if (index == 0) {
      return milestones.first.expectedDate.difference(start).inDays;
    }
    return milestones[index]
        .expectedDate
        .difference(milestones[index - 1].expectedDate)
        .inDays;
  }

  test('cool wet weather delays hatch and harvest vs typical', () {
    final typical = engine.predictFor(species: Species.bombyx, startDate: start);
    final cool = predict(RearingScenario.coolWet);

    expect(cool.first.expectedDate.isAfter(typical.first.expectedDate), isTrue);
    expect(cool.last.expectedDate.isAfter(typical.last.expectedDate), isTrue);
    expect(cool.first.daysVsTypical, greaterThan(0));
  });

  test('short leaf stretches harvest but not egg hatch', () {
    final typical = engine.predictFor(species: Species.bombyx, startDate: start);
    final short = predict(RearingScenario.shortLeaf);

    expect(short.first.expectedDate, typical.first.expectedDate);
    expect(short.last.expectedDate.isAfter(typical.last.expectedDate), isTrue);
    expect(short.first.daysVsTypical, anyOf(isNull, 0));
  });

  test('short leaf stretches 5th instar more than 1st instar', () {
    final typical = engine.predictFor(species: Species.bombyx, startDate: start);
    final short = predict(RearingScenario.shortLeaf);
    final firstStretch =
        stageDays(short, 'instar1') - stageDays(typical, 'instar1');
    final fifthStretch =
        stageDays(short, 'instar5') - stageDays(typical, 'instar5');

    expect(fifthStretch, greaterThan(firstStretch));
  });

  test('extra leaf slightly shortens larval cycle vs short leaf', () {
    final short = predict(RearingScenario.shortLeaf, species: Species.eri);
    final extra = predict(RearingScenario.extraLeaf, species: Species.eri);

    expect(extra.last.expectedDate.isBefore(short.last.expectedDate), isTrue);
  });

  test('extra leaf harvest is on or before typical', () {
    final typical = engine.predictFor(species: Species.bombyx, startDate: start);
    final extra = predict(RearingScenario.extraLeaf);
    final harvestTypical =
        typical.firstWhere((m) => m.type == MilestoneType.cocoonHarvest);
    final harvestExtra =
        extra.firstWhere((m) => m.type == MilestoneType.cocoonHarvest);

    expect(
      harvestExtra.expectedDate.isBefore(harvestTypical.expectedDate) ||
          harvestExtra.expectedDate.isAtSameMomentAs(harvestTypical.expectedDate),
      isTrue,
    );
  });

  test('missed feeds delay harvest but not hatch', () {
    final typical = engine.predictFor(species: Species.bombyx, startDate: start);
    final missed = predict(RearingScenario.missedFeeds);

    expect(missed.first.expectedDate, typical.first.expectedDate);
    expect(
      missed
          .firstWhere((m) => m.type == MilestoneType.cocoonHarvest)
          .expectedDate
          .isAfter(
            typical.firstWhere((m) => m.type == MilestoneType.cocoonHarvest).expectedDate,
          ),
      isTrue,
    );
  });

  test('hot dry delays spinning more than moth development', () {
    final adjustment = adjuster.adjust(
      Species.bombyx,
      RearingScenario.hotDry.conditionsFor(Species.bombyx),
    );
    expect(adjustment.affectsDates, isTrue);
    expect(adjustment.reasons.join(' '), contains('Hot'));
    expect(adjustment.spinningFactor, greaterThan(adjustment.mothFactor));
    expect(adjustment.lateLarvalFactor, greaterThan(1));
  });

  test('cool weather delays hatch more than a leaf shortage', () {
    final cool = predict(RearingScenario.coolWet);
    final short = predict(RearingScenario.shortLeaf);

    expect(cool.first.expectedDate.isAfter(short.first.expectedDate), isTrue);
  });

  test('logged cool temperature and low feed produce conditions', () {
    final batch = sample();
    final conditions = conditionsService.fromLogs(
      batch: batch,
      now: DateTime(2026, 1, 18),
      environmentLogs: [
        EnvironmentLog(
          id: 'e1',
          batchId: batch.id,
          recordedAt: DateTime(2026, 1, 17),
          temperatureCelsius: 20,
          humidityPercent: 75,
        ),
      ],
      feedLogs: [
        FeedLog(
          id: 'f1',
          batchId: batch.id,
          recordedAt: DateTime(2026, 1, 17),
          feedType: 'Mulberry',
          quantityGrams: 10,
        ),
      ],
    );

    expect(conditions.fromLogs, isTrue);
    expect(conditions.temperatureC, 20);
    expect(conditions.feedRatio, lessThan(1));
    expect(conditions.missedFeedDays, greaterThan(0));
    expect(conditions.snapshotLabel, contains('20°C'));
  });
}
