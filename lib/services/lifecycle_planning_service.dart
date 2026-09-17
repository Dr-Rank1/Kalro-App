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

  /// Inclusive harvest window ending on [harvest].
  DateTime? get harvestWindowStart {
    final end = harvest?.effectiveDate;
    if (end == null) return null;
    final stage = LifecycleProfiles.forSpecies(species).byKey(harvest!.stageKey);
    final days = stage?.harvestWindowDays ?? 1;
    return _dateOnly(end).subtract(Duration(days: days - 1));
  }

  DateTime? get harvestWindowEnd {
    final end = harvest?.effectiveDate;
    return end == null ? null : _dateOnly(end);
  }

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
        milestone.stageKey == 'moult4' ||
        milestone.instarNumber == 5;
  }

  String planningTitle(LifecycleMilestone milestone) {
    return switch (milestone.stageKey) {
      'incubation' => 'Egg hatch',
      'instar1' => '1st instar feeding',
      'moult1' => '1st moult — stop feeding',
      'instar2' => '2nd instar feeding',
      'moult2' => '2nd moult — stop feeding',
      'instar3' => '3rd instar feeding',
      'moult3' => '3rd moult — stop feeding',
      'instar4' => '4th instar feeding',
      'moult4' => '4th moult — stop feeding',
      'instar5' => 'Mature larvae (5th instar)',
      'cocoon_maturation' => 'Cocoon harvest window',
      'cocoon_harvest' => 'Cocoon harvest window',
      'moth_emergence' => 'Moth emergence (cocoons hatch)',
      _ => milestone.label,
    };
  }

  String prepNote(LifecycleMilestone milestone, Species species) {
    final leaf = species == Species.eri ? 'castor or kesseru' : 'mulberry';
    return switch (milestone.stageKey) {
      'incubation' =>
        'Eggs hatch. Brush larvae onto the bed. Prepare tender chopped $leaf leaf.',
      'instar1' => 'Feed often. Keep density low. Watch for the first moult.',
      'moult1' => 'Stop feeding. Watch the first moult, then resume tender leaf.',
      'instar2' => 'Feed, clean the bed, and watch humidity and disease.',
      'moult2' => 'Stop feeding. Observe the second moult.',
      'instar3' => 'Give larvae more space; $leaf demand starts to rise.',
      'moult3' => 'Stop feeding. Observe the third moult.',
      'instar4' => 'Heavy feeding and spacing. Late instars eat most of the crop.',
      'moult4' => 'Stop feeding. Prepare for the final instar.',
      'instar5' => species == Species.bombyx
          ? 'Peak feeding. Watch spinning signs. Prepare mountages.'
          : 'Peak feeding on $leaf. Day 1 is a light morning feed, then full.',
      'mounting' =>
        'Stop feeding. Mount larvae on chandrika or mountages. Keep the house quiet.',
      'spinning' => species == Species.eri
          ? 'Keep feeding until every larva has spun. Dim light, do not disturb.'
          : 'Cocoon spinning. Dim light, stable temperature, do not disturb.',
      'cocoon_maturation' =>
        'Harvest window. Pick mature cocoons over these days for silk quality.',
      'cocoon_harvest' =>
        'Cocoon measurements and harvest. Sort defectives and record weight.',
      'moth_emergence' =>
        'Moths emerge. For seed: prepare pairing trays. For silk: harvest before this date.',
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
