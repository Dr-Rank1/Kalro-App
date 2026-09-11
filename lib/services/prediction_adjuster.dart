import '../constants/environment_thresholds.dart';
import '../models/rearing_conditions.dart';
import '../models/species.dart';

class PredictionAdjustment {
  const PredictionAdjustment({
    required this.incubationFactor,
    required this.earlyLarvalFactor,
    required this.lateLarvalFactor,
    required this.spinningFactor,
    required this.cocoonFactor,
    required this.mothFactor,
    required this.reasons,
  });

  static const none = PredictionAdjustment(
    incubationFactor: 1,
    earlyLarvalFactor: 1,
    lateLarvalFactor: 1,
    spinningFactor: 1,
    cocoonFactor: 1,
    mothFactor: 1,
    reasons: [],
  );

  /// Multiplier on egg incubation. 1.15 = 15% slower hatch.
  final double incubationFactor;

  /// 1st–3rd instars: weather and modest feed effect.
  final double earlyLarvalFactor;

  /// 4th–5th instars: leaf amount matters most here.
  final double lateLarvalFactor;

  /// Mounting and spinning: dry air and weak larvae delay this.
  final double spinningFactor;

  /// Cocoon maturation / harvest window.
  final double cocoonFactor;

  /// Pupal period until moths emerge. Temperature-heavy, not feed.
  final double mothFactor;

  final List<String> reasons;

  bool get affectsDates =>
      reasons.isNotEmpty &&
      (incubationFactor != 1 ||
          earlyLarvalFactor != 1 ||
          lateLarvalFactor != 1 ||
          spinningFactor != 1 ||
          cocoonFactor != 1 ||
          mothFactor != 1);

  double factorForStage(String? stageKey) {
    return switch (stageKey) {
      'incubation' => incubationFactor,
      'instar1' || 'instar2' || 'instar3' => earlyLarvalFactor,
      'instar4' || 'instar5' => lateLarvalFactor,
      'mounting' || 'spinning' => spinningFactor,
      'moth_emergence' => mothFactor,
      _ => cocoonFactor,
    };
  }
}

/// Maps weather and feeding into stage duration multipliers.
///
/// Cooler than the species band slows eggs and moths most. Heat stress
/// stretches larvae; dry air delays moults and spinning. Short rations
/// stretch late instars only — hatch and moth speed stay weather-driven.
class PredictionAdjuster {
  const PredictionAdjuster();

  PredictionAdjustment adjust(Species species, RearingConditions conditions) {
    if (!conditions.hasSignals) return PredictionAdjustment.none;

    final band = EnvironmentThresholds.forSpecies(species);
    final reasons = <String>[];
    var incubation = 1.0;
    var early = 1.0;
    var late = 1.0;
    var spinning = 1.0;
    var cocoon = 1.0;
    var moth = 1.0;

    final temp = conditions.temperatureC;
    if (temp != null) {
      final mid = (band.minTempC + band.maxTempC) / 2;
      if (temp < band.minTempC) {
        final extra = ((band.minTempC - temp) * 0.05).clamp(0.0, 0.35);
        incubation *= 1 + extra + 0.04;
        early *= 1 + extra;
        late *= 1 + extra * 0.9;
        spinning *= 1 + extra * 0.7;
        cocoon *= 1 + extra * 0.55;
        moth *= 1 + extra + 0.03;
        reasons.add(
          'Cool rearing (${temp.toStringAsFixed(0)}°C) — hatch and moths run later',
        );
      } else if (temp > band.maxTempC) {
        final surplus = temp - band.maxTempC;
        final extra = (surplus * 0.04).clamp(0.0, 0.25);
        incubation *= 1 + extra * 0.7;
        early *= 1 + extra;
        late *= 1 + extra;
        spinning *= 1 + extra * 0.85;
        cocoon *= 1 + extra * 0.5;
        if (surplus < 5) {
          moth *= (1 - surplus * 0.015).clamp(0.9, 1.0);
          reasons.add(
            'Hot rearing (${temp.toStringAsFixed(0)}°C) — larvae slower; moths may emerge a little sooner after harvest',
          );
        } else {
          moth *= 1 + extra * 0.5;
          reasons.add(
            'Very hot rearing (${temp.toStringAsFixed(0)}°C) — heat stress stretches the whole cycle',
          );
        }
      } else if (temp < mid - 0.5) {
        incubation *= 1.05;
        early *= 1.04;
        late *= 1.03;
        moth *= 1.05;
        reasons.add('On the cool side of the ideal band — slight delay');
      } else if (temp > mid + 0.5) {
        incubation *= 0.96;
        early *= 0.97;
        late *= 0.97;
        moth *= 0.95;
        reasons.add('Warm but still in range — hatch and moths a little sooner');
      }
    }

    final humidity = conditions.humidityPercent;
    if (humidity != null) {
      if (humidity < band.minHumidity) {
        final extra = ((band.minHumidity - humidity) * 0.008).clamp(0.0, 0.15);
        early *= 1 + extra;
        late *= 1 + extra * 0.8;
        spinning *= 1 + extra + 0.04;
        reasons.add(
          'Dry air (${humidity.toStringAsFixed(0)}% RH) — moults and spinning can run late',
        );
      } else if (humidity > band.maxHumidity) {
        final extra = ((humidity - band.maxHumidity) * 0.006).clamp(0.0, 0.12);
        early *= 1 + extra;
        late *= 1 + extra;
        spinning *= 1 + extra * 0.5;
        reasons.add(
          'High humidity (${humidity.toStringAsFixed(0)}% RH) — watch disease, slight delay',
        );
      }
    }

    final ratio = conditions.feedRatio;
    if (ratio != null) {
      if (ratio < 0.85) {
        final extra = ((0.85 - ratio) * 0.8).clamp(0.0, 0.4);
        early *= 1 + extra * 0.55;
        late *= 1 + extra;
        spinning *= 1 + extra * 0.25;
        reasons.add(
          'Leaf at ${(ratio * 100).round()}% of need — 4th–5th instars take longer; hatch unchanged',
        );
      } else if (ratio > 1.2) {
        early *= 0.97;
        late *= 0.94;
        reasons.add('Plenty of leaf — late instars stay close to typical');
      }
    }

    if (conditions.missedFeedDays > 0) {
      final extra = (conditions.missedFeedDays * 0.045).clamp(0.0, 0.22);
      early *= 1 + extra * 0.6;
      late *= 1 + extra;
      spinning *= 1 + extra * 0.2;
      reasons.add(
        '${conditions.missedFeedDays} missed feeding day${conditions.missedFeedDays == 1 ? '' : 's'} this week — harvest moves later',
      );
    }

    return PredictionAdjustment(
      incubationFactor: incubation.clamp(0.85, 1.5),
      earlyLarvalFactor: early.clamp(0.85, 1.55),
      lateLarvalFactor: late.clamp(0.85, 1.6),
      spinningFactor: spinning.clamp(0.88, 1.45),
      cocoonFactor: cocoon.clamp(0.9, 1.35),
      mothFactor: moth.clamp(0.88, 1.5),
      reasons: reasons,
    );
  }
}
