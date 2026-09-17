import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/batch.dart';
import 'package:kalro/models/batch_status.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/lifecycle_engine.dart';
import 'package:kalro/services/lifecycle_profiles.dart';
import 'package:kalro/services/rearing_day_service.dart';

void main() {
  const engine = LifecycleEngine();
  const days = RearingDayService();
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

  test('Bombyx harvest lands on field day 40 window', () {
    final harvest = engine.expectedHarvestDate(sample());
    expect(harvest, DateTime(2026, 2, 10));
    final cycle = harvest!.difference(start).inDays;
    expect(cycle, 40);
  });

  test('moult rest day suggests no leaf', () {
    final moult = engine.predict(sample()).firstWhere((m) => m.stageKey == 'moult1');
    final plan = days.planFor(sample(), now: moult.expectedDate);
    expect(plan, isNotNull);
    expect(plan!.stage.isMoult, isTrue);
    expect(plan.suggestedGrams, 0);
  });

  test('Eri moths about 39 days after hatch', () {
    final batch = sample(species: Species.eri);
    final hatch = engine.expectedHatchDate(batch)!;
    final moths = engine.expectedMothEmergenceDate(batch)!;
    expect(moths.difference(hatch).inDays, closeTo(39, 2));
  });

  test('Eri instar 2 day 1 is a light feed', () {
    final hatch = start.add(const Duration(days: 10));
    final instar2Start = hatch.add(const Duration(days: 4));
    final plan = days.planFor(
      sample(species: Species.eri),
      now: instar2Start.add(const Duration(days: 1)),
    );
    expect(plan, isNotNull);
    expect(plan!.isLightFeedDay || plan.stage.instarNumber == 2, isTrue);
  });

  test('progress uses full species cycle not 30 days', () {
    expect(LifecycleProfiles.bombyx.totalDays, greaterThan(50));
    final plan = days.planFor(sample(), now: start.add(const Duration(days: 15)));
    expect(plan!.progress, lessThan(0.5));
  });

  test('feed grams scale with live larvae not egg count', () {
    final full = RearingDayService.fullRationGrams(Species.bombyx, 5, 100);
    final half = RearingDayService.fullRationGrams(Species.bombyx, 5, 50);
    expect(half, full / 2);
  });

  test('moult rest reminder tells farmer to stop feeding', () {
    final moult = engine.predict(sample()).firstWhere((m) => m.stageKey == 'moult1');
    final plan = days.planFor(sample(), now: moult.expectedDate)!;
    expect(plan.reminderTitle, 'Stop feeding today');
  });
}
