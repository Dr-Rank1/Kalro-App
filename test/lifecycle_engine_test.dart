import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/batch.dart';
import 'package:kalro/models/batch_status.dart';
import 'package:kalro/models/lifecycle_milestone.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/lifecycle_engine.dart';
import 'package:kalro/services/lifecycle_profiles.dart';

void main() {
  const engine = LifecycleEngine();

  Batch sampleBatch({
    Species species = Species.bombyx,
    DateTime? startDate,
  }) {
    return Batch(
      id: 'test-id',
      species: species,
      startDate: startDate ?? DateTime(2026, 1, 1),
      eggCount: 100,
      status: BatchStatus.active,
      createdAt: DateTime(2026, 1, 1),
    );
  }

  test('Bombyx profile matches spec stage count', () {
    expect(LifecycleProfiles.bombyx.stages.length, 10);
  });

  test('predict returns milestones in chronological order', () {
    final milestones = engine.predict(sampleBatch());
    expect(milestones.length, LifecycleProfiles.bombyx.stages.length);

    for (var i = 1; i < milestones.length; i++) {
      expect(
        milestones[i].expectedDate.isAfter(milestones[i - 1].expectedDate) ||
            milestones[i].expectedDate.isAtSameMomentAs(
              milestones[i - 1].expectedDate,
            ),
        isTrue,
      );
    }
  });

  test('predict includes hatch and cocoon harvest milestones', () {
    final milestones = engine.predict(sampleBatch());
    expect(milestones.first.type, MilestoneType.hatch);
    expect(
      milestones.any((m) => m.type == MilestoneType.cocoonHarvest),
      isTrue,
    );
  });

  test('Eri batch uses Eri profile durations', () {
    final milestones = engine.predict(
      sampleBatch(species: Species.eri),
    );
    expect(milestones.length, LifecycleProfiles.eri.stages.length);
    expect(milestones.last.label, 'Moth emergence');
  });

  test('predictFor matches hatch, harvest, and moth dates', () {
    final start = DateTime(2026, 1, 1);
    final milestones = engine.predictFor(
      species: Species.bombyx,
      startDate: start,
    );
    expect(milestones.first.type, MilestoneType.hatch);
    expect(milestones.first.expectedDate, DateTime(2026, 1, 12));
    expect(
      milestones.any((m) => m.type == MilestoneType.cocoonHarvest),
      isTrue,
    );
    expect(
      milestones.any((m) => m.type == MilestoneType.mothEmergence),
      isTrue,
    );
  });

  test('expectedHatchDate and expectedMothEmergenceDate are populated', () {
    final batch = sampleBatch(startDate: DateTime(2026, 3, 1));
    expect(engine.expectedHatchDate(batch), isNotNull);
    expect(engine.expectedMothEmergenceDate(batch), isNotNull);
    expect(
      engine.expectedMothEmergenceDate(batch)!.isAfter(engine.expectedHarvestDate(batch)!),
      isTrue,
    );
  });

  test('nextMilestone returns first future milestone', () {
    final batch = sampleBatch(startDate: DateTime.now());
    final next = engine.nextMilestone(batch);
    expect(next, isNotNull);
    expect(next!.expectedDate.isAfter(DateTime.now()), isTrue);
  });

  test('expectedHarvestDate returns cocoon milestone', () {
    final batch = sampleBatch();
    final harvest = engine.expectedHarvestDate(batch);
    expect(harvest, isNotNull);
  });
}
