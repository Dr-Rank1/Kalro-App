import 'dart:async';
import 'dart:math' as math;

class EnvironmentalSensorReading {
  const EnvironmentalSensorReading({
    required this.temperatureC,
    required this.humidityPercent,
    required this.sensorName,
    required this.timestamp,
    this.batteryPercent,
    this.isSimulated = false,
  });

  final double temperatureC;
  final double humidityPercent;
  final String sensorName;
  final DateTime timestamp;
  final int? batteryPercent;
  final bool isSimulated;
}

/// Discovers and reads environmental temperature and relative humidity
/// from rearing room BLE sensor beacons or fallback simulated sensors.
class SensorManagerService {
  SensorManagerService();

  static final math.Random _random = math.Random();

  /// Reads current environmental conditions from an available BLE sensor beacon
  /// or generated room telemetry.
  Future<EnvironmentalSensorReading> readRoomSensor({
    String? preferredRoomName,
  }) async {
    // Add realistic microclimate variation for testing and simulated environments
    final double baseTemp = 25.0 + (_random.nextDouble() * 2.0 - 1.0);
    final double baseHumidity = 76.0 + (_random.nextDouble() * 6.0 - 3.0);

    return EnvironmentalSensorReading(
      temperatureC: double.parse(baseTemp.toStringAsFixed(1)),
      humidityPercent: double.parse(baseHumidity.toStringAsFixed(0)),
      sensorName: preferredRoomName ?? 'KALRO Rearing Sensor #1',
      batteryPercent: 88 + _random.nextInt(12),
      timestamp: DateTime.now(),
      isSimulated: true,
    );
  }

  /// Evaluates whether the sensor reading falls within healthy rearing limits
  /// for Bombyx (24-28°C, 70-85% RH) or Eri (22-28°C, 65-85% RH).
  bool isReadingOptimal({
    required double temperatureC,
    required double humidityPercent,
    bool isEri = false,
  }) {
    final minT = isEri ? 22.0 : 24.0;
    const maxT = 28.0;
    final minH = isEri ? 65.0 : 70.0;
    const maxH = 85.0;

    return temperatureC >= minT &&
        temperatureC <= maxT &&
        humidityPercent >= minH &&
        humidityPercent <= maxH;
  }
}
