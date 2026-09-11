import '../models/batch.dart';
import '../models/batch_status.dart';
import '../models/lifecycle_milestone.dart';
import '../models/rearing_conditions.dart';
import '../models/species.dart';
import 'lifecycle_engine.dart';
import 'lifecycle_profiles.dart';
import 'prediction_adjuster.dart';

class PlannedCycle {
  const PlannedCycle({
    required this.species,
    required this.startDate,
    required this.milestones,
    this.adjustment = PredictionAdjustment.none,
    this.conditions = RearingConditions.typical,
  });

  final Species species;
  final DateTime startDate;
  final List<LifecycleMilestone> milestones;
  final PredictionAdjustment adjustment;
  final RearingConditions conditions;

  LifecycleMilestone? ofType(MilestoneType type) {
    for (final milestone in milestones) {
      if (milestone.type == type) return milestone;
    }
    return null;
  }

  LifecycleMilestone? get hatch => ofType(MilestoneType.hatch);
  LifecycleMilestone? get mounting => ofType(MilestoneType.mounting);
  LifecycleMilestone? get spinning => ofType(MilestoneType.spinning);
  LifecycleMilestone? get harvest => ofType(MilestoneType.cocoonHarvest);
  LifecycleMilestone? get mothEmergence => ofType(MilestoneType.mothEmergence);

  List<LifecycleMilestone> get keyDates {
    return [
      hatch,
      mounting,
      spinning,
      harvest,
      mothEmergence,
    ].whereType<LifecycleMilestone>().toList();
  }

  int get cycleDays {
    if (milestones.isEmpty) return 0;
    return _dateOnly(milestones.last.effectiveDate)
        .difference(_dateOnly(startDate))
        .inDays;
  }

  /// How many days harvest moved vs a typical cycle. Positive = later.
  int? get harvestShiftDays => harvest?.daysVsTypical;

  /// Compact hatch / harvest / moth shifts, e.g. `Hatch +2d · Harvest +5d`.
  String? get shiftSummary {
    final parts = <String>[];
    void add(String label, int? days) {
      if (days == null || days == 0) return;
      parts.add('$label ${days > 0 ? '+' : ''}${days}d');
    }

    add('Hatch', hatch?.daysVsTypical);
    add('Harvest', harvest?.daysVsTypical);
    add('Moths', mothEmergence?.daysVsTypical);
    return parts.isEmpty ? null : parts.join(' · ');
  }

  String? get summaryReason =>
      adjustment.reasons.isEmpty ? null : adjustment.reasons.first;

  String? typicalRangeFor(LifecycleMilestone milestone) {
    final profile = LifecycleProfiles.forSpecies(species);
    for (final stage in profile.stages) {
      if (stage.key == milestone.stageKey) return stage.typicalRange;
    }
    return null;
  }
}

class FarmPlanEvent {
  const FarmPlanEvent({
    required this.batch,
    required this.milestone,
    required this.daysUntil,
    required this.title,
    required this.prepNote,
    this.conditionNote,
  });

  final Batch batch;
  final LifecycleMilestone milestone;
  final int daysUntil;
  final String title;
  final String prepNote;
  final String? conditionNote;

  bool get isToday => daysUntil == 0;
  bool get isOverdue => daysUntil < 0;
}

class LifecyclePlanningService {
  const LifecyclePlanningService({LifecycleEngine? engine})
      : _engine = engine ?? const LifecycleEngine();

  final LifecycleEngine _engine;

  PlannedCycle planCycle({
    required Species species,
    required DateTime startDate,
    Map<String, DateTime>? observedStageDates,
    RearingConditions? conditions,
  }) {
    final resolved = conditions ?? RearingConditions.typical;
    return PlannedCycle(
      species: species,
      startDate: startDate,
      conditions: resolved,
      adjustment: const PredictionAdjuster().adjust(species, resolved),
      milestones: _engine.predictFor(
        species: species,
        startDate: startDate,
        observedStageDates: observedStageDates,
        conditions: resolved,
      ),
    );
  }

  PlannedCycle planBatch(
    Batch batch, {
    Map<String, DateTime>? observedStageDates,
    RearingConditions? conditions,
  }) {
    return planCycle(
      species: batch.species,
      startDate: batch.startDate,
      observedStageDates: observedStageDates,
      conditions: conditions,
    );
  }

  bool isKeyPlanningDate(LifecycleMilestone milestone) {
    return milestone.type == MilestoneType.hatch ||
        milestone.type == MilestoneType.mounting ||
        milestone.type == MilestoneType.spinning ||
        milestone.type == MilestoneType.cocoonHarvest ||
        milestone.type == MilestoneType.mothEmergence ||
        milestone.instarNumber == 5;
  }

  String planningTitle(LifecycleMilestone milestone) {
    return switch (milestone.stageKey) {
      'incubation' => 'Egg hatch',
      'instar1' => '1st moult',
      'instar2' => '2nd moult',
      'instar3' => '3rd moult',
      'instar4' => '4th moult',
      'instar5' => 'Mature larvae (5th instar)',
      'cocoon_maturation' => 'Cocoon harvest window',
      'moth_emergence' => 'Moth emergence (cocoons hatch)',
      _ => milestone.label,
    };
  }

  String prepNote(LifecycleMilestone milestone, Species species) {
    final leaf = species == Species.eri ? 'castor or kesseru' : 'mulberry';
    return switch (milestone.stageKey) {
      'incubation' =>
        'Eggs hatch. Prepare young-age trays and tender chopped $leaf leaf.',
      'instar1' => '1st moult. Keep density low and feed tender leaf often.',
      'instar2' => '2nd moult. Continue frequent feeding and watch humidity.',
      'instar3' => '3rd moult. Give larvae more space; leaf demand starts to rise.',
      'instar4' =>
        '4th moult. Increase $leaf supply — late instars eat most of the crop.',
      'instar5' => species == Species.bombyx
          ? 'Peak feeding. Prepare mountages; keep a full $leaf supply.'
          : 'Peak feeding on $leaf. Prepare quiet spinning sites.',
      'mounting' =>
        'Mount larvae on chandrika or mountages. Keep the house quiet.',
      'spinning' =>
        'Cocoon spinning. Dim light, stable temperature, do not disturb.',
      'cocoon_maturation' =>
        'Cocoons are maturing. Plan harvest in this window for silk quality.',
      'cocoon_harvest' =>
        'Harvest cocoons. Sort defectives and record count and weight.',
      'moth_emergence' =>
        'Moths emerge from cocoons. For seed: prepare pairing trays. For silk: harvest before this date.',
      _ => 'Check the batch and mark the stage when you observe it.',
    };
  }

  List<FarmPlanEvent> upcomingForBatches({
    required List<Batch> batches,
    required Map<String, Map<String, DateTime>> observationsByBatch,
    Map<String, RearingConditions>? conditionsByBatch,
    DateTime? now,
    int nearDays = 14,
    int keyHorizonDays = 60,
  }) {
    final today = _dateOnly(now ?? DateTime.now());
    final events = <FarmPlanEvent>[];

    for (final batch in batches) {
      if (batch.status == BatchStatus.closed) continue;
      final cycle = planBatch(
        batch,
        observedStageDates: observationsByBatch[batch.id],
        conditions: conditionsByBatch?[batch.id],
      );
      for (final milestone in cycle.milestones) {
        final daysUntil =
            _dateOnly(milestone.effectiveDate).difference(today).inDays;
        final nearby = daysUntil >= -1 && daysUntil <= nearDays;
        final keyUpcoming =
            isKeyPlanningDate(milestone) && daysUntil >= -1 && daysUntil <= keyHorizonDays;
        if (!nearby && !keyUpcoming) continue;

        events.add(
          FarmPlanEvent(
            batch: batch,
            milestone: milestone,
            daysUntil: daysUntil,
            title: planningTitle(milestone),
            prepNote: prepNote(milestone, batch.species),
            conditionNote: _conditionNoteFor(milestone, cycle),
          ),
        );
      }
    }

    events.sort((a, b) {
      final byDate = a.daysUntil.compareTo(b.daysUntil);
      if (byDate != 0) return byDate;
      return a.batch.species.label.compareTo(b.batch.species.label);
    });
    return events;
  }

  String? _conditionNoteFor(LifecycleMilestone milestone, PlannedCycle cycle) {
    final shift = milestone.daysVsTypical;
    if (shift != null && shift != 0) {
      return shift > 0
          ? '+$shift day${shift == 1 ? '' : 's'} vs typical (weather / feeding)'
          : '$shift day${shift == -1 ? '' : 's'} vs typical (weather / feeding)';
    }
    return cycle.summaryReason;
  }
}

DateTime _dateOnly(DateTime date) {
  return DateTime(date.year, date.month, date.day);
}
