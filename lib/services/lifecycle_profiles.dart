import '../models/species.dart';

enum FeedPolicy {
  /// Eggs, moult rest, mounting, moths — no leaf today.
  none,
  /// Normal full ration for the instar.
  full,
  /// Eri: light morning feed on day 1 of the instar, then full.
  lightThenFull,
  /// Eri 5th / spinning: keep feeding until every larva has spun.
  untilAllSpin,
}

/// Configurable lifecycle stage durations in days.
class LifecycleStage {
  const LifecycleStage({
    required this.key,
    required this.label,
    required this.durationDays,
    this.instarNumber,
    this.typicalRange,
    this.feedPolicy = FeedPolicy.full,
    this.isMoult = false,
    this.harvestWindowDays = 1,
    this.todayAction,
    this.readinessSigns = const [],
  });

  final String key;
  final String label;
  final double durationDays;
  final int? instarNumber;

  /// Spec range shown to farmers, e.g. "10–12 days".
  final String? typicalRange;
  final FeedPolicy feedPolicy;
  final bool isMoult;

  /// Inclusive harvest window ending on this stage's date.
  final int harvestWindowDays;
  final String? todayAction;
  final List<String> readinessSigns;
}

class LifecycleProfile {
  const LifecycleProfile({
    required this.species,
    required this.stages,
  });

  final Species species;
  final List<LifecycleStage> stages;

  double get totalDays =>
      stages.fold(0, (sum, stage) => sum + stage.durationDays);

  double get daysToHarvest {
    var days = 0.0;
    for (final stage in stages) {
      days += stage.durationDays;
      if (stage.key == 'cocoon_maturation' || stage.key == 'cocoon_harvest') {
        return days;
      }
    }
    return days;
  }

  LifecycleStage? byKey(String? key) {
    if (key == null) return null;
    for (final stage in stages) {
      if (stage.key == key) return stage;
    }
    return null;
  }
}

/// Field calendars from KALRO predictive rearing sheets.
/// Bombyx: harvest window day 38–40 from egg start.
/// Eri larval sheet is post-hatch; incubation is added before it.
class LifecycleProfiles {
  static const _preMoultSigns = [
    'Feeding decreases sharply or stops',
    'Movement decreases; larvae stay still',
    'Body may look swollen or dull',
    'Many larvae change together',
  ];

  static const _spinningSigns = [
    'They stop eating and ignore fresh leaf',
    'Body looks translucent or creamy around the head',
    'Body is softer and slightly shrunken',
    'They raise and wave the head, searching for a place to attach silk',
  ];

  static const bombyx = LifecycleProfile(
    species: Species.bombyx,
    stages: [
      LifecycleStage(
        key: 'incubation',
        label: 'Egg incubation',
        durationDays: 11,
        typicalRange: '10–12 days',
        feedPolicy: FeedPolicy.none,
        todayAction: 'Incubate eggs. Watch temperature and humidity. Prepare the rearing room.',
      ),
      LifecycleStage(
        key: 'instar1',
        label: '1st instar',
        durationDays: 3,
        instarNumber: 1,
        typicalRange: '3 days feeding',
        todayAction: 'Feed tender chopped mulberry. Keep density low. Brush newly hatched larvae onto the bed.',
      ),
      LifecycleStage(
        key: 'moult1',
        label: '1st moult',
        durationDays: 1,
        instarNumber: 1,
        isMoult: true,
        feedPolicy: FeedPolicy.none,
        typicalRange: '1 rest day',
        todayAction: 'Stop feeding. Watch the first moult.',
        readinessSigns: _preMoultSigns,
      ),
      LifecycleStage(
        key: 'instar2',
        label: '2nd instar',
        durationDays: 3,
        instarNumber: 2,
        typicalRange: '3 days feeding',
        todayAction: 'Feed, clean the bed, and watch for disease.',
      ),
      LifecycleStage(
        key: 'moult2',
        label: '2nd moult',
        durationDays: 1,
        instarNumber: 2,
        isMoult: true,
        feedPolicy: FeedPolicy.none,
        todayAction: 'Stop feeding. Observe the second moult.',
        readinessSigns: _preMoultSigns,
      ),
      LifecycleStage(
        key: 'instar3',
        label: '3rd instar',
        durationDays: 3,
        instarNumber: 3,
        typicalRange: '3 days feeding',
        todayAction: 'Increase feeding, give more space, keep the bed clean.',
      ),
      LifecycleStage(
        key: 'moult3',
        label: '3rd moult',
        durationDays: 1,
        instarNumber: 3,
        isMoult: true,
        feedPolicy: FeedPolicy.none,
        todayAction: 'Stop feeding. Observe the third moult.',
        readinessSigns: _preMoultSigns,
      ),
      LifecycleStage(
        key: 'instar4',
        label: '4th instar',
        durationDays: 3,
        instarNumber: 4,
        typicalRange: '3 days feeding',
        todayAction: 'Heavy feeding, bed cleaning, and spacing. Leaf demand rises.',
      ),
      LifecycleStage(
        key: 'moult4',
        label: '4th moult',
        durationDays: 1,
        instarNumber: 4,
        isMoult: true,
        feedPolicy: FeedPolicy.none,
        todayAction: 'Stop feeding. Prepare for the final instar.',
        readinessSigns: _preMoultSigns,
      ),
      LifecycleStage(
        key: 'instar5',
        label: '5th instar',
        durationDays: 6,
        instarNumber: 5,
        typicalRange: '6–7 days',
        todayAction: 'Peak feeding and growth. Prepare mountages.',
        readinessSigns: _spinningSigns,
      ),
      LifecycleStage(
        key: 'mounting',
        label: 'Mounting',
        durationDays: 1,
        typicalRange: '1 day',
        feedPolicy: FeedPolicy.none,
        todayAction: 'Stop feeding. Place worms on mountages. Keep the house quiet.',
        readinessSigns: _spinningSigns,
      ),
      LifecycleStage(
        key: 'spinning',
        label: 'Spinning',
        durationDays: 3,
        typicalRange: '3–5 days',
        feedPolicy: FeedPolicy.none,
        todayAction: 'Cocoon spinning. Dim light, stable temperature, do not disturb.',
      ),
      LifecycleStage(
        key: 'cocoon_maturation',
        label: 'Cocoon harvest',
        durationDays: 3,
        typicalRange: 'Day 38–40',
        feedPolicy: FeedPolicy.none,
        harvestWindowDays: 3,
        todayAction: 'Harvest mature cocoons in this window. Sort defectives and record weight.',
      ),
      LifecycleStage(
        key: 'moth_emergence',
        label: 'Moth emergence',
        durationDays: 14,
        typicalRange: '12–16 days',
        feedPolicy: FeedPolicy.none,
        todayAction: 'Moths emerge. For seed: pairing trays. For silk: harvest before this date.',
      ),
    ],
  );

  /// Eri larval days from KALRO sheet, plus 10-day egg incubation.
  static const eri = LifecycleProfile(
    species: Species.eri,
    stages: [
      LifecycleStage(
        key: 'incubation',
        label: 'Egg incubation',
        durationDays: 10,
        typicalRange: '10 days',
        feedPolicy: FeedPolicy.none,
        todayAction: 'Incubate eggs. Prepare tender castor or kesseru leaf.',
      ),
      LifecycleStage(
        key: 'instar1',
        label: '1st instar',
        durationDays: 3,
        instarNumber: 1,
        typicalRange: '3 days feeding',
        todayAction: 'Feed tender leaf. Keep young larvae warm and uncrowded.',
      ),
      LifecycleStage(
        key: 'moult1',
        label: '1st moult',
        durationDays: 1,
        instarNumber: 1,
        isMoult: true,
        feedPolicy: FeedPolicy.none,
        todayAction: 'No feeding today — 1st moult.',
      ),
      LifecycleStage(
        key: 'instar2',
        label: '2nd instar',
        durationDays: 2,
        instarNumber: 2,
        feedPolicy: FeedPolicy.lightThenFull,
        typicalRange: '2 days feeding',
        todayAction: 'Day 1: light feeding in the morning, then full. Other days: full feeding.',
      ),
      LifecycleStage(
        key: 'moult2',
        label: '2nd moult',
        durationDays: 1,
        instarNumber: 2,
        isMoult: true,
        feedPolicy: FeedPolicy.none,
        todayAction: 'No feeding today — 2nd moult.',
      ),
      LifecycleStage(
        key: 'instar3',
        label: '3rd instar',
        durationDays: 3,
        instarNumber: 3,
        feedPolicy: FeedPolicy.lightThenFull,
        typicalRange: '3 days feeding',
        todayAction: 'Day 1: light morning feed, then full. Then feed normally until the moult.',
      ),
      LifecycleStage(
        key: 'moult3',
        label: '3rd moult',
        durationDays: 1,
        instarNumber: 3,
        isMoult: true,
        feedPolicy: FeedPolicy.none,
        todayAction: 'No feeding today — 3rd moult.',
      ),
      LifecycleStage(
        key: 'instar4',
        label: '4th instar',
        durationDays: 5,
        instarNumber: 4,
        feedPolicy: FeedPolicy.lightThenFull,
        typicalRange: '5 days feeding',
        todayAction: 'Day 1 light then full. Leaf demand is rising.',
      ),
      LifecycleStage(
        key: 'moult4',
        label: '4th moult',
        durationDays: 1,
        instarNumber: 4,
        isMoult: true,
        feedPolicy: FeedPolicy.none,
        todayAction: 'No feeding today — 4th moult. Prepare for the final instar.',
      ),
      LifecycleStage(
        key: 'instar5',
        label: '5th instar',
        durationDays: 7,
        instarNumber: 5,
        feedPolicy: FeedPolicy.lightThenFull,
        typicalRange: '7 days feeding',
        todayAction: 'Peak feeding on castor or kesseru. Prepare quiet spinning sites.',
      ),
      LifecycleStage(
        key: 'spinning',
        label: 'Spinning',
        durationDays: 3,
        typicalRange: '3 days',
        feedPolicy: FeedPolicy.untilAllSpin,
        todayAction: 'Spinning. Keep feeding until every larva has spun.',
      ),
      LifecycleStage(
        key: 'cocoon_harvest',
        label: 'Cocoon harvest',
        durationDays: 5,
        typicalRange: 'Day 32 from hatch',
        feedPolicy: FeedPolicy.none,
        harvestWindowDays: 3,
        todayAction: 'Cocoon measurements and harvest. Record count and weight.',
      ),
      LifecycleStage(
        key: 'moth_emergence',
        label: 'Moth emergence',
        durationDays: 7,
        typicalRange: '1–4 days emergence',
        feedPolicy: FeedPolicy.none,
        todayAction: 'Moth emergence and egg laying. Prepare pairing trays for seed.',
      ),
    ],
  );

  static LifecycleProfile forSpecies(Species species) {
    return switch (species) {
      Species.bombyx => bombyx,
      Species.eri => eri,
    };
  }
}
