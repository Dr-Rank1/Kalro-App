import '../models/species.dart';

/// Configurable lifecycle stage durations in days.
class LifecycleStage {
  const LifecycleStage({
    required this.key,
    required this.label,
    required this.durationDays,
    this.instarNumber,
    this.typicalRange,
  });

  final String key;
  final String label;
  final double durationDays;
  final int? instarNumber;

  /// Spec range shown to farmers, e.g. "10–12 days".
  final String? typicalRange;
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
}

/// Default profiles based on the app specification.
/// Durations use midpoint values where ranges are given.
class LifecycleProfiles {
  static const bombyx = LifecycleProfile(
    species: Species.bombyx,
    stages: [
      LifecycleStage(
        key: 'incubation',
        label: 'Egg incubation',
        durationDays: 11,
        typicalRange: '10–12 days',
      ),
      LifecycleStage(
        key: 'instar1',
        label: '1st instar',
        durationDays: 3.5,
        instarNumber: 1,
        typicalRange: '3–4 days',
      ),
      LifecycleStage(key: 'instar2', label: '2nd instar', durationDays: 3, instarNumber: 2, typicalRange: '3 days'),
      LifecycleStage(key: 'instar3', label: '3rd instar', durationDays: 4, instarNumber: 3, typicalRange: '4 days'),
      LifecycleStage(key: 'instar4', label: '4th instar', durationDays: 5, instarNumber: 4, typicalRange: '5 days'),
      LifecycleStage(key: 'instar5', label: '5th instar', durationDays: 8, instarNumber: 5, typicalRange: '8 days'),
      LifecycleStage(key: 'mounting', label: 'Mounting', durationDays: 1, typicalRange: '1 day'),
      LifecycleStage(key: 'spinning', label: 'Spinning', durationDays: 3, typicalRange: '3 days'),
      LifecycleStage(
        key: 'cocoon_maturation',
        label: 'Cocoon maturation',
        durationDays: 6,
        typicalRange: '5–7 days',
      ),
      LifecycleStage(
        key: 'moth_emergence',
        label: 'Moth emergence',
        durationDays: 14,
        typicalRange: '12–16 days',
      ),
    ],
  );

  /// Basic Eri profile — can be refined with field data later.
  static const eri = LifecycleProfile(
    species: Species.eri,
    stages: [
      LifecycleStage(
        key: 'incubation',
        label: 'Egg incubation',
        durationDays: 10,
      ),
      LifecycleStage(key: 'instar1', label: '1st instar', durationDays: 5, instarNumber: 1),
      LifecycleStage(key: 'instar2', label: '2nd instar', durationDays: 5, instarNumber: 2),
      LifecycleStage(key: 'instar3', label: '3rd instar', durationDays: 6, instarNumber: 3),
      LifecycleStage(key: 'instar4', label: '4th instar', durationDays: 7, instarNumber: 4),
      LifecycleStage(key: 'instar5', label: '5th instar', durationDays: 10, instarNumber: 5),
      LifecycleStage(key: 'spinning', label: 'Spinning', durationDays: 4),
      LifecycleStage(
        key: 'cocoon_harvest',
        label: 'Cocoon harvest',
        durationDays: 7,
      ),
      LifecycleStage(
        key: 'moth_emergence',
        label: 'Moth emergence',
        durationDays: 14,
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
