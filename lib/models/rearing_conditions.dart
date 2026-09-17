import '../constants/environment_thresholds.dart';
import '../l10n/translator.dart';
import 'species.dart';

/// Weather and feeding state used to stretch or compress remaining stages.
class RearingConditions {
  const RearingConditions({
    this.temperatureC,
    this.humidityPercent,
    this.feedRatio,
    this.missedFeedDays = 0,
    this.fromLogs = false,
  });

  /// Recent average house temperature, or a scenario value.
  final double? temperatureC;

  /// Recent average relative humidity.
  final double? humidityPercent;

  /// Actual leaf logged vs suggested need. 1.0 = enough, 0.5 = half rations.
  final double? feedRatio;

  /// Days in the last week with no feed log while larvae are eating.
  final int missedFeedDays;

  /// True when values came from recorded logs rather than a what-if scenario.
  final bool fromLogs;

  static const typical = RearingConditions();

  bool get hasWeather => temperatureC != null || humidityPercent != null;

  bool get hasFeedSignal =>
      (feedRatio != null && feedRatio != 1) || missedFeedDays > 0;

  bool get hasSignals => hasWeather || hasFeedSignal;

  /// Compact logged or scenario values, e.g. `22°C · 88% RH · leaf 55% of need`.
  String? get snapshotLabel {
    final parts = <String>[];
    if (temperatureC != null) {
      parts.add('${temperatureC!.toStringAsFixed(0)}°C');
    }
    if (humidityPercent != null) {
      parts.add('${humidityPercent!.toStringAsFixed(0)}% RH');
    }
    if (feedRatio != null) {
      parts.add('leaf ${(feedRatio! * 100).round()}% of need');
    }
    if (missedFeedDays > 0) {
      parts.add(
        '$missedFeedDays missed feed day${missedFeedDays == 1 ? '' : 's'}',
      );
    }
    return parts.isEmpty ? null : parts.join(' · ');
  }
}

enum RearingScenario {
  typical(
    'Typical',
    'Ideal temperature, humidity, and enough leaf',
  ),
  coolWet(
    'Cool / wet',
    'Cool air and high humidity slow growth',
  ),
  hotDry(
    'Hot / dry',
    'Heat and dry air stress larvae and cocoons',
  ),
  shortLeaf(
    'Short on leaf',
    'Underfeeding stretches instars',
  ),
  extraLeaf(
    'Plenty of leaf',
    'Full feeding keeps late instars close to typical',
  ),
  missedFeeds(
    'Missed feeds',
    'A few days without enough leaf this week',
  );

  const RearingScenario(this._label, this._detail);

  final String _label;
  final String _detail;

  String get label => _label.tr;
  String get detail => _detail.tr;

  RearingConditions conditionsFor(Species species) {
    final band = EnvironmentThresholds.forSpecies(species);
    return switch (this) {
      RearingScenario.typical => RearingConditions.typical,
      RearingScenario.coolWet => RearingConditions(
          temperatureC: band.minTempC - 3,
          humidityPercent: band.maxHumidity + 8,
          feedRatio: 1,
        ),
      RearingScenario.hotDry => RearingConditions(
          temperatureC: band.maxTempC + 3,
          humidityPercent: band.minHumidity - 12,
          feedRatio: 0.9,
        ),
      RearingScenario.shortLeaf => const RearingConditions(feedRatio: 0.55),
      RearingScenario.extraLeaf => const RearingConditions(feedRatio: 1.4),
      RearingScenario.missedFeeds => const RearingConditions(
          feedRatio: 0.45,
          missedFeedDays: 3,
        ),
    };
  }
}
