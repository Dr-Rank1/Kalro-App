import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/batch.dart';
import 'package:kalro/models/batch_status.dart';
import 'package:kalro/models/lifecycle_milestone.dart';
import 'package:kalro/models/rearing_conditions.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/lifecycle_planning_service.dart';

void main() {
  const planning = LifecyclePlanningService();

  Batch sample({
    Species species = Species.bombyx,
    DateTime? startDate,
    BatchStatus status = BatchStatus.active,
  }) {
    return Batch(
      id: 'batch-1',
      species: species,
      startDate: startDate ?? DateTime(2026, 1, 1),
      eggCount: 100,
      status: status,
      createdAt: DateTime(2026, 1, 1),
    );
  }

  test('planCycle exposes hatch, harvest, and moth emergence', () {
    final cycle = planning.planCycle(
      species: Species.bombyx,
      startDate: DateTime(2026, 1, 1),
    );

    expect(cycle.hatch, isNotNull);
    expect(cycle.harvest, isNotNull);
    expect(cycle.mothEmergence, isNotNull);
    expect(cycle.hatch!.expectedDate, DateTime(2026, 1, 12));
    expect(cycle.cycleDays, greaterThan(40));
    expect(cycle.typicalRangeFor(cycle.hatch!), '10–12 days');
  });

  test('planning titles use farmer-facing hatch language', () {
    final cycle = planning.planCycle(
      species: Species.eri,
      startDate: DateTime(2026, 2, 1),
    );

    expect(planning.planningTitle(cycle.hatch!), 'Egg hatch');
    expect(
      planning.planningTitle(cycle.mothEmergence!),
      'Moth emergence (cocoons hatch)',
    );
    expect(planning.prepNote(cycle.hatch!, Species.eri), contains('castor'));
    expect(planning.prepNote(cycle.mothEmergence!, Species.eri), contains('seed'));
  });

  test('upcomingForBatches includes key dates and skips closed batches', () {
    final start = DateTime(2026, 6, 1);
    final active = sample(startDate: start);
    final closedBatch = Batch(
      id: 'closed',
      species: Species.eri,
      startDate: start,
      eggCount: 50,
      status: BatchStatus.closed,
      createdAt: start,
    );

    final events = planning.upcomingForBatches(
      batches: [active, closedBatch],
      observationsByBatch: const {},
      now: start,
      keyHorizonDays: 90,
    );

    expect(events, isNotEmpty);
    expect(events.every((e) => e.batch.id == 'batch-1'), isTrue);
    expect(events.any((e) => e.milestone.type == MilestoneType.hatch), isTrue);
    expect(
      events.any((e) => e.milestone.type == MilestoneType.mothEmergence),
      isTrue,
    );
  });

  test('cool scenario harvest is later than typical in the planner', () {
    final typical = planning.planCycle(
      species: Species.bombyx,
      startDate: DateTime(2026, 1, 1),
    );
    final cool = planning.planCycle(
      species: Species.bombyx,
      startDate: DateTime(2026, 1, 1),
      conditions: RearingScenario.coolWet.conditionsFor(Species.bombyx),
    );

    expect(cool.harvestShiftDays, greaterThan(0));
    expect(
      cool.harvest!.expectedDate.isAfter(typical.harvest!.expectedDate),
      isTrue,
    );
    expect(cool.adjustment.reasons, isNotEmpty);
    expect(cool.shiftSummary, contains('Hatch'));
    expect(cool.shiftSummary, contains('Harvest'));
  });

  test('missed feeds and short leaf leave hatch on the typical day', () {
    final typical = planning.planCycle(
      species: Species.bombyx,
      startDate: DateTime(2026, 1, 1),
    );
    final missed = planning.planCycle(
      species: Species.bombyx,
      startDate: DateTime(2026, 1, 1),
      conditions: RearingScenario.missedFeeds.conditionsFor(Species.bombyx),
    );
    final short = planning.planCycle(
      species: Species.bombyx,
      startDate: DateTime(2026, 1, 1),
      conditions: RearingScenario.shortLeaf.conditionsFor(Species.bombyx),
    );

    expect(missed.hatch!.expectedDate, typical.hatch!.expectedDate);
    expect(short.hatch!.expectedDate, typical.hatch!.expectedDate);
    expect(missed.harvestShiftDays, greaterThan(0));
    expect(short.harvestShiftDays, greaterThan(0));
  });

  test('5th instar is a key date for spinning prep', () {
    final cycle = planning.planCycle(
      species: Species.bombyx,
      startDate: DateTime(2026, 1, 1),
    );
    final fifth = cycle.milestones.firstWhere((m) => m.instarNumber == 5);
    expect(planning.isKeyPlanningDate(fifth), isTrue);
    expect(planning.prepNote(fifth, Species.bombyx), contains('mountages'));
  });
}
