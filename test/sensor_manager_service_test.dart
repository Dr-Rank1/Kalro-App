import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/services/sensor_manager_service.dart';

void main() {
  group('SensorManagerService Tests', () {
    final sensorService = SensorManagerService();

    test('readRoomSensor returns plausible rearing environment reading', () async {
      final reading = await sensorService.readRoomSensor(
        preferredRoomName: 'Room A - Tray 4',
      );

      expect(reading.sensorName, equals('Room A - Tray 4'));
      expect(reading.temperatureC, inInclusiveRange(20.0, 32.0));
      expect(reading.humidityPercent, inInclusiveRange(60.0, 95.0));
      expect(reading.batteryPercent, isNotNull);
      expect(reading.batteryPercent!, inInclusiveRange(80, 100));
      expect(reading.isSimulated, isTrue);
    });

    test('isReadingOptimal validates Bombyx rearing ranges correctly', () {
      // Bombyx optimal: 24-28 C, 70-85%
      expect(
        sensorService.isReadingOptimal(
          temperatureC: 25.5,
          humidityPercent: 78.0,
          isEri: false,
        ),
        isTrue,
      );

      // Low temp
      expect(
        sensorService.isReadingOptimal(
          temperatureC: 22.0,
          humidityPercent: 78.0,
          isEri: false,
        ),
        isFalse,
      );

      // High temp
      expect(
        sensorService.isReadingOptimal(
          temperatureC: 29.0,
          humidityPercent: 78.0,
          isEri: false,
        ),
        isFalse,
      );

      // Low humidity
      expect(
        sensorService.isReadingOptimal(
          temperatureC: 26.0,
          humidityPercent: 68.0,
          isEri: false,
        ),
        isFalse,
      );

      // High humidity
      expect(
        sensorService.isReadingOptimal(
          temperatureC: 26.0,
          humidityPercent: 88.0,
          isEri: false,
        ),
        isFalse,
      );
    });

    test('isReadingOptimal validates Eri silkworm ranges correctly', () {
      // Eri optimal: 22-28 C, 65-85%
      expect(
        sensorService.isReadingOptimal(
          temperatureC: 22.5,
          humidityPercent: 66.0,
          isEri: true,
        ),
        isTrue,
      );

      // Eri allows down to 22 C
      expect(
        sensorService.isReadingOptimal(
          temperatureC: 22.0,
          humidityPercent: 70.0,
          isEri: true,
        ),
        isTrue,
      );

      // Too low for Eri
      expect(
        sensorService.isReadingOptimal(
          temperatureC: 21.0,
          humidityPercent: 70.0,
          isEri: true,
        ),
        isFalse,
      );
    });
  });
}
