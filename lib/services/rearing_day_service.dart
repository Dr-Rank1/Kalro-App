import '../l10n/translator.dart';
import '../models/batch.dart';
import '../models/lifecycle_milestone.dart';
import '../models/rearing_conditions.dart';
import '../models/species.dart';
import 'lifecycle_engine.dart';
import 'lifecycle_profiles.dart';

class RearingDayPlan {
  const RearingDayPlan({
    required this.stage,
    required this.milestone,
    required this.dayOfStage,
    required this.daysLeftInStage,
    required this.cycleDay,
    required this.progress,
    required this.feedPolicy,
    required this.suggestedGrams,
    required this.actionTitle,
    required this.actionDetail,
    required this.readinessSigns,
    this.harvestWindowStart,
    this.harvestWindowEnd,
    this.leafKgToHarvest,
    this.cycleLengthDays = 1,
  });

  final LifecycleStage stage;
  final LifecycleMilestone milestone;
  final int dayOfStage;
  final int daysLeftInStage;
  final int cycleDay;
  final double progress;
  final FeedPolicy feedPolicy;
  final double suggestedGrams;
  final String actionTitle;
  final String actionDetail;
  final List<String> readinessSigns;
  final DateTime? harvestWindowStart;
  final DateTime? harvestWindowEnd;
  final double? leafKgToHarvest;
  final int cycleLengthDays;

  bool get stopFeeding =>
      feedPolicy == FeedPolicy.none && suggestedGrams <= 0 && stage.key != 'incubation';

  bool get isLightFeedDay =>
      feedPolicy == FeedPolicy.lightThenFull && dayOfStage == 1;

  bool get showSpinningChecklist =>
      stage.readinessSigns.isNotEmpty &&
      (stage.key == 'instar5' ||
          stage.key == 'mounting' ||
          stage.key == 'moult4');

  bool get inHarvestWindow {
    if (harvestWindowStart == null || harvestWindowEnd == null) return false;
    final n = DateTime.now();
    final today = DateTime(n.year, n.month, n.day);
    return !today.isBefore(harvestWindowStart!) && !today.isAfter(harvestWindowEnd!);
  }

  bool get isHarvestWork =>
      stage.key == 'cocoon_maturation' ||
      stage.key == 'cocoon_harvest' ||
      inHarvestWindow;

  String get feedLabel {
    if (suggestedGrams <= 0) {
      if (stage.key == 'incubation') return 'No leaf yet — eggs are still incubating'.tr;
      if (stage.isMoult) return 'Stop feeding — moult rest day'.tr;
      if (stage.key == 'mounting') return 'Stop feeding — move worms to mountages'.tr;
      return 'No feeding today'.tr;
    }
    if (feedPolicy == FeedPolicy.untilAllSpin) {
      return Translator.fill('Keep feeding until all have spun · ~{g} g', {
        'g': '${suggestedGrams.round()}',
      });
    }
    if (isLightFeedDay) {
      return Translator.fill('Light morning feed, then full · ~{g} g', {
        'g': '${suggestedGrams.round()}',
      });
    }
    return Translator.fill('Full ration · ~{g} g', {
      'g': '${suggestedGrams.round()}',
    });
  }

  String get reminderTitle {
    if (isHarvestWork) return 'Harvest window'.tr;
    if (stopFeeding) return 'Stop feeding today'.tr;
    if (isLightFeedDay) return 'Light morning feed'.tr;
    if (stage.isMoult) return 'Pre-moult check'.tr;
    if (stage.key == 'mounting') return 'Mountages today'.tr;
    return 'Feed today'.tr;
  }

  String get reminderBody {
    if (actionDetail.trim().isNotEmpty) return actionDetail.tr;
    return feedLabel;
  }
}

/// Maps the field rearing sheets onto today's date for a batch.
class RearingDayService {
  const RearingDayService({LifecycleEngine? engine})
      : _engine = engine ?? const LifecycleEngine();

  final LifecycleEngine _engine;

  RearingDayPlan? planFor(
    Batch batch, {
    Map<String, DateTime>? observedStageDates,
    RearingConditions? conditions,
    int? liveCount,
    DateTime? now,
  }) {
    final today = _dateOnly(now ?? DateTime.now());
    final profile = LifecycleProfiles.forSpecies(batch.species);
    final milestones = _engine.predict(
      batch,
      observedStageDates: observedStageDates,
      conditions: conditions,
    );
    if (milestones.isEmpty) return null;

    var index = 0;
    for (var i = 0; i < milestones.length; i++) {
      index = i;
      if (!milestones[i].effectiveDate.isBefore(today)) break;
    }

    final milestone = milestones[index];
    final stage = profile.byKey(milestone.stageKey) ?? profile.stages[index];
    final stageStart = index == 0
        ? _dateOnly(batch.startDate)
        : _dateOnly(milestones[index - 1].effectiveDate);
    final dayOfStage = today.difference(stageStart).inDays + (index == 0 ? 1 : 0);
    final clampedDay = dayOfStage < 1 ? 1 : dayOfStage;
    final daysLeft = _dateOnly(milestone.effectiveDate).difference(today).inDays;
    final larvae = liveCount ?? batch.eggCount;
    final grams = _gramsFor(
      species: batch.species,
      stage: stage,
      dayOfStage: clampedDay,
      larvae: larvae,
    );

    DateTime? harvestStart;
    DateTime? harvestEnd;
    LifecycleMilestone? harvest;
    for (final m in milestones) {
      if (m.type == MilestoneType.cocoonHarvest) {
        harvest = m;
        break;
      }
    }
    if (harvest != null) {
      final window = profile.byKey(harvest.stageKey)?.harvestWindowDays ?? 1;
      harvestEnd = _dateOnly(harvest.effectiveDate);
      harvestStart = harvestEnd.subtract(Duration(days: window - 1));
    }

    final cycleDay = today.difference(_dateOnly(batch.startDate)).inDays + 1;
    final totalDays = profile.totalDays <= 0 ? 1 : profile.totalDays.round();
    final progress = (cycleDay / totalDays).clamp(0.0, 1.0);

    var title = stage.label;
    var detail = stage.todayAction ?? 'Check the batch and mark the stage when you see it.';
    if (stage.key == 'incubation' && daysLeft <= 1) {
      title = 'Hatching & brushing';
      detail =
          'Eggs are hatching. Transfer / brush larvae onto the rearing bed. Prepare tender leaf.';
    }
    if (stage.key == 'instar1' && clampedDay <= 1) {
      title = 'Hatching & brushing';
      detail =
          'Observe hatching and brush larvae onto the rearing bed. Feed tender chopped leaf.';
    }

    final larvaeCount = larvae;
    return RearingDayPlan(
      stage: stage,
      milestone: milestone,
      dayOfStage: clampedDay,
      daysLeftInStage: daysLeft,
      cycleDay: cycleDay < 1 ? 1 : cycleDay,
      progress: progress,
      feedPolicy: stage.feedPolicy,
      suggestedGrams: grams,
      actionTitle: title.tr,
      actionDetail: detail.tr,
      readinessSigns: stage.readinessSigns.map((sign) => sign.tr).toList(),
      harvestWindowStart: harvestStart,
      harvestWindowEnd: harvestEnd,
      cycleLengthDays: totalDays,
      leafKgToHarvest: _leafKgFromMilestones(
        batch: batch,
        profile: profile,
        milestones: milestones,
        today: today,
        larvae: larvaeCount,
      ),
    );
  }

  double remainingLeafKg(
    Batch batch, {
    Map<String, DateTime>? observedStageDates,
    RearingConditions? conditions,
    int? liveCount,
    DateTime? now,
  }) {
    final today = _dateOnly(now ?? DateTime.now());
    final profile = LifecycleProfiles.forSpecies(batch.species);
    final milestones = _engine.predict(
      batch,
      observedStageDates: observedStageDates,
      conditions: conditions,
    );
    return _leafKgFromMilestones(
      batch: batch,
      profile: profile,
      milestones: milestones,
      today: today,
      larvae: liveCount ?? batch.eggCount,
    );
  }

  double _leafKgFromMilestones({
    required Batch batch,
    required LifecycleProfile profile,
    required List<LifecycleMilestone> milestones,
    required DateTime today,
    required int larvae,
  }) {
    if (milestones.isEmpty) return 0;
    LifecycleMilestone? harvest;
    for (final m in milestones) {
      if (m.type == MilestoneType.cocoonHarvest) harvest = m;
    }
    if (harvest == null) return 0;

    var grams = 0.0;
    var cursor = today;
    final last = _dateOnly(harvest.effectiveDate);
    while (!cursor.isAfter(last)) {
      var index = 0;
      for (var i = 0; i < milestones.length; i++) {
        index = i;
        if (!milestones[i].effectiveDate.isBefore(cursor)) break;
      }
      final milestone = milestones[index];
      final stage = profile.byKey(milestone.stageKey) ?? profile.stages[index];
      final stageStart = index == 0
          ? _dateOnly(batch.startDate)
          : _dateOnly(milestones[index - 1].effectiveDate);
      var dayOfStage = cursor.difference(stageStart).inDays + (index == 0 ? 1 : 0);
      if (dayOfStage < 1) dayOfStage = 1;
      grams += _gramsFor(
        species: batch.species,
        stage: stage,
        dayOfStage: dayOfStage,
        larvae: larvae,
      );
      cursor = cursor.add(const Duration(days: 1));
    }
    return grams / 1000;
  }

  static double fullRationGrams(Species species, int? instar, int larvae) {
    if (larvae <= 0) return 0;
    final perHundred = switch (instar) {
      1 => species == Species.bombyx ? 20.0 : 30.0,
      2 => species == Species.bombyx ? 40.0 : 50.0,
      3 => species == Species.bombyx ? 80.0 : 100.0,
      4 => species == Species.bombyx ? 150.0 : 180.0,
      5 => species == Species.bombyx ? 250.0 : 300.0,
      _ => species == Species.bombyx ? 50.0 : 80.0,
    };
    return perHundred * (larvae / 100);
  }

  double _gramsFor({
    required Species species,
    required LifecycleStage stage,
    required int dayOfStage,
    required int larvae,
  }) {
    if (stage.feedPolicy == FeedPolicy.none) return 0;
    final full = fullRationGrams(species, stage.instarNumber, larvae);
    if (stage.feedPolicy == FeedPolicy.lightThenFull && dayOfStage == 1) {
      return full * 0.5;
    }
    return full;
  }

  DateTime _dateOnly(DateTime date) => DateTime(date.year, date.month, date.day);
}
