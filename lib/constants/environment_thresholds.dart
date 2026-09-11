import '../models/species.dart';

class EnvironmentThresholds {
  const EnvironmentThresholds({
    required this.minTempC,
    required this.maxTempC,
    required this.minHumidity,
    required this.maxHumidity,
  });

  final double minTempC;
  final double maxTempC;
  final double minHumidity;
  final double maxHumidity;

  static EnvironmentThresholds forSpecies(Species species) {
    return switch (species) {
      Species.bombyx => const EnvironmentThresholds(
          minTempC: 24,
          maxTempC: 28,
          minHumidity: 70,
          maxHumidity: 85,
        ),
      Species.eri => const EnvironmentThresholds(
          minTempC: 22,
          maxTempC: 30,
          minHumidity: 65,
          maxHumidity: 80,
        ),
    };
  }

  bool isTemperatureOk(double temp) => temp >= minTempC && temp <= maxTempC;

  bool isHumidityOk(double humidity) =>
      humidity >= minHumidity && humidity <= maxHumidity;
}
