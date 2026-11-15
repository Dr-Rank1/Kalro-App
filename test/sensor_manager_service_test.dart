import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/services/environment_log_repository.dart';
import 'package:kalro/services/farm_store.dart';
import 'package:kalro/services/sensor_manager_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late EnvironmentLogRepository envRepository;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_sensor_test');
    envRepository = EnvironmentLogRepository(storageDirectory: tempDir);
  });

  tearDown(() async {
    await FarmStore.closeAll();
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

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

    test('parseTemperatureBytes extracts standard 0x2A6E sint16 little-endian byte array', () {
      // 0x09EC = 2540 -> 25.40 °C
      final bytes254 = [0xEC, 0x09];
      expect(SensorManagerService.parseTemperatureBytes(bytes254), 25.4);

      // 0x0A28 = 2600 -> 26.00 °C
      final bytes260 = [0x28, 0x0A];
      expect(SensorManagerService.parseTemperatureBytes(bytes260), 26.0);

      // Empty or truncated bytes fallback safely
      expect(SensorManagerService.parseTemperatureBytes([]), 25.0);
    });

    test('parseHumidityBytes extracts standard 0x2A6F uint16 and uint8 byte arrays', () {
      // 0x1E34 = 7732 -> 77.3%
      final bytes773 = [0x34, 0x1E];
      expect(SensorManagerService.parseHumidityBytes(bytes773), 77.3);

      // Single byte format: 82%
      expect(SensorManagerService.parseHumidityBytes([82]), 82.0);

      // Empty bytes fallback safely
      expect(SensorManagerService.parseHumidityBytes([]), 75.0);
    });

    test('Riverpod climateNotifierProvider streams readings and status correctly', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final state = container.read(climateNotifierProvider);
      expect(state.currentReading.temperatureC, greaterThan(0));
      expect(state.currentReading.humidityPercent, greaterThan(0));

      await container.read(climateNotifierProvider.notifier).refreshSensor(
            roomName: 'Hut 3 Test',
          );

      final updatedState = container.read(climateNotifierProvider);
      expect(updatedState.currentReading.sensorName, 'Hut 3 Test');
      expect(updatedState.currentReading.isSimulated, isTrue);
    });

    test('startPeriodicAutoSave persists readings to local FarmStore SQLite database', () async {
      final testService = SensorManagerService(autoSaveInterval: const Duration(milliseconds: 50));
      addTearDown(testService.dispose);

      testService.startPeriodicAutoSave(
        repository: envRepository,
        defaultBatchId: 'batch-test-ble-01',
        roomName: 'Mijia Beacon Room',
      );

      // Allow initial save to write to SQLite
      await Future<void>.delayed(const Duration(milliseconds: 100));

      final records = await envRepository.getByBatchId('batch-test-ble-01');
      expect(records.isNotEmpty, isTrue);
      expect(records.first.temperatureCelsius, inInclusiveRange(20.0, 32.0));
      expect(records.first.humidityPercent, inInclusiveRange(60.0, 95.0));
      expect(records.first.roomName, contains('Mijia'));
    });
  });
}
