import '../models/batch.dart';
import '../models/batch_status.dart';
import '../models/lifecycle_milestone.dart';
import '../models/rearing_conditions.dart';
import '../models/species.dart';
import 'lifecycle_profiles.dart';
import 'prediction_adjuster.dart';

class LifecycleEngine {
  const LifecycleEngine({PredictionAdjuster? adjuster})
      : _adjuster = adjuster ?? const PredictionAdjuster();

  final PredictionAdjuster _adjuster;

  /// Predicts dates from species and egg start date without a saved batch.
  List<LifecycleMilestone> predictFor({
    required Species species,
    required DateTime startDate,
    Map<String, DateTime>? observedStageDates,
    RearingConditions? conditions,
  }) {
    return predict(
      Batch(
        id: 'preview',
        species: species,
        startDate: startDate,
        eggCount: 1,
        status: BatchStatus.active,
        createdAt: startDate,
      ),
      observedStageDates: observedStageDates,
      conditions: conditions,
    );
  }

  List<LifecycleMilestone> predict(
    Batch batch, {
    Map<String, DateTime>? observedStageDates,
    RearingConditions? conditions,
  }) {
    final profile = LifecycleProfiles.forSpecies(batch.species);
    final observations = observedStageDates ?? const {};
    final adjustment = conditions == null
        ? PredictionAdjustment.none
        : _adjuster.adjust(batch.species, conditions);
    final milestones = <LifecycleMilestone>[];
    var cursor = _dateOnly(batch.startDate);
    var typicalCursor = cursor;

    for (final stage in profile.stages) {
      final observed = observations[stage.key];
      final typicalHours = (stage.durationDays * 24).round();
      final factor = adjustment.factorForStage(stage.key);
      final adjustedHours =
          (typicalHours * factor).round().clamp((typicalHours / 4).round(), typicalHours * 2);

      if (observed != null) {
        cursor = _dateOnly(observed);
        typicalCursor = cursor;
      } else {
        typicalCursor = typicalCursor.add(Duration(hours: typicalHours));
        cursor = cursor.add(Duration(hours: adjustedHours));
      }

      milestones.add(
        LifecycleMilestone(
          type: _milestoneType(stage.key),
          label: stage.label,
          stageKey: stage.key,
          expectedDate: cursor,
          instarNumber: stage.instarNumber,
          observedDate: observed,
          typicalDate: adjustment.affectsDates && observed == null ? typicalCursor : null,
        ),
      );
    }

    return milestones;
  }

  LifecycleMilestone? currentStage(
    Batch batch, {
    Map<String, DateTime>? observedStageDates,
    RearingConditions? conditions,
  }) {
    final milestones = predict(
      batch,
      observedStageDates: observedStageDates,
      conditions: conditions,
    );
    final today = _dateOnly(DateTime.now());

    LifecycleMilestone? current;
    for (final milestone in milestones) {
      current = milestone;
      if (!milestone.effectiveDate.isBefore(today)) {
        return milestone;
      }
    }
    return current;
  }

  LifecycleMilestone? nextMilestone(
    Batch batch, {
    Map<String, DateTime>? observedStageDates,
    RearingConditions? conditions,
  }) {
    final milestones = predict(
      batch,
      observedStageDates: observedStageDates,
      conditions: conditions,
    );
    final now = DateTime.now();
    for (final milestone in milestones) {
      if (milestone.effectiveDate.isAfter(now)) {
        return milestone;
      }
    }
    return null;
  }

  DateTime? expectedHatchDate(
    Batch batch, {
    Map<String, DateTime>? observedStageDates,
    RearingConditions? conditions,
  }) {
    return _firstOfType(
      batch,
      MilestoneType.hatch,
      observedStageDates,
      conditions,
    )?.effectiveDate;
  }

  DateTime? expectedHarvestDate(
    Batch batch, {
    Map<String, DateTime>? observedStageDates,
    RearingConditions? conditions,
  }) {
    final milestones = predict(
      batch,
      observedStageDates: observedStageDates,
      conditions: conditions,
    );
    for (final milestone in milestones) {
      if (milestone.type == MilestoneType.cocoonHarvest ||
          (batch.species == Species.bombyx &&
              milestone.label == 'Cocoon maturation')) {
        return milestone.effectiveDate;
      }
    }
    return milestones.isEmpty ? null : milestones.last.effectiveDate;
  }

  DateTime? expectedMothEmergenceDate(
    Batch batch, {
    Map<String, DateTime>? observedStageDates,
    RearingConditions? conditions,
  }) {
    return _firstOfType(
      batch,
      MilestoneType.mothEmergence,
      observedStageDates,
      conditions,
    )?.effectiveDate;
  }

  LifecycleMilestone? _firstOfType(
    Batch batch,
    MilestoneType type,
    Map<String, DateTime>? observedStageDates,
    RearingConditions? conditions,
  ) {
    final milestones = predict(
      batch,
      observedStageDates: observedStageDates,
      conditions: conditions,
    );
    for (final milestone in milestones) {
      if (milestone.type == type) return milestone;
    }
    return null;
  }

  MilestoneType _milestoneType(String stageKey) {
    return switch (stageKey) {
      'incubation' => MilestoneType.hatch,
      'mounting' => MilestoneType.mounting,
      'spinning' => MilestoneType.spinning,
      'cocoon_maturation' || 'cocoon_harvest' => MilestoneType.cocoonHarvest,
      'moth_emergence' => MilestoneType.mothEmergence,
      _ when stageKey.startsWith('moult') => MilestoneType.moult,
      _ when stageKey.startsWith('instar') => MilestoneType.instar,
      _ => MilestoneType.moult,
    };
  }

  DateTime _dateOnly(DateTime date) {
    return DateTime(date.year, date.month, date.day);
  }
}
