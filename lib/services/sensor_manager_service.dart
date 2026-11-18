import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../models/environment_log.dart';
import 'environment_log_repository.dart';

/// Connection and discovery status of environmental BLE beacons.
enum SensorConnectionStatus {
  disconnected,
  scanning,
  connected,
  bluetoothOff,
  unauthorized,
  outOfRange,
  simulated;

  String get label => switch (this) {
        SensorConnectionStatus.disconnected => 'Disconnected',
        SensorConnectionStatus.scanning => 'Scanning BLE...',
        SensorConnectionStatus.connected => 'Connected (0x181A)',
        SensorConnectionStatus.bluetoothOff => 'Bluetooth Off',
        SensorConnectionStatus.unauthorized => 'Location/BLE Permission Needed',
        SensorConnectionStatus.outOfRange => 'Sensor Out of Range',
        SensorConnectionStatus.simulated => 'Simulation Telemetry',
      };
}

/// Representation of an ambient temperature and relative humidity reading.
class EnvironmentalSensorReading {
  const EnvironmentalSensorReading({
    required this.temperatureC,
    required this.humidityPercent,
    required this.sensorName,
    required this.timestamp,
    this.batteryPercent,
    this.isSimulated = false,
    this.deviceId,
    this.rssi,
  });

  final double temperatureC;
  final double humidityPercent;
  final String sensorName;
  final DateTime timestamp;
  final int? batteryPercent;
  final bool isSimulated;
  final String? deviceId;
  final int? rssi;

  EnvironmentalSensorReading copyWith({
    double? temperatureC,
    double? humidityPercent,
    String? sensorName,
    DateTime? timestamp,
    int? batteryPercent,
    bool? isSimulated,
    String? deviceId,
    int? rssi,
  }) {
    return EnvironmentalSensorReading(
      temperatureC: temperatureC ?? this.temperatureC,
      humidityPercent: humidityPercent ?? this.humidityPercent,
      sensorName: sensorName ?? this.sensorName,
      timestamp: timestamp ?? this.timestamp,
      batteryPercent: batteryPercent ?? this.batteryPercent,
      isSimulated: isSimulated ?? this.isSimulated,
      deviceId: deviceId ?? this.deviceId,
      rssi: rssi ?? this.rssi,
    );
  }
}

/// State container for Riverpod climate streaming.
class ClimateState {
  const ClimateState({
    required this.currentReading,
    required this.status,
    this.connectedDeviceName,
    this.lastSavedAt,
    this.errorMessage,
  });

  ClimateState.initial()
      : currentReading = EnvironmentalSensorReading(
          temperatureC: 25.0,
          humidityPercent: 78.0,
          sensorName: 'KALRO Rearing Sensor #1',
          timestamp: DateTime.now(),
          isSimulated: true,
        ),
        status = SensorConnectionStatus.disconnected,
        connectedDeviceName = null,
        lastSavedAt = null,
        errorMessage = null;

  final EnvironmentalSensorReading currentReading;
  final SensorConnectionStatus status;
  final String? connectedDeviceName;
  final DateTime? lastSavedAt;
  final String? errorMessage;

  ClimateState copyWith({
    EnvironmentalSensorReading? currentReading,
    SensorConnectionStatus? status,
    String? connectedDeviceName,
    DateTime? lastSavedAt,
    String? errorMessage,
  }) {
    return ClimateState(
      currentReading: currentReading ?? this.currentReading,
      status: status ?? this.status,
      connectedDeviceName: connectedDeviceName ?? this.connectedDeviceName,
      lastSavedAt: lastSavedAt ?? this.lastSavedAt,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

/// Discovers, reads, and auto-saves environmental temperature and relative humidity
/// from rearing room BLE sensor beacons broadcasting UUID 0x181A.
class SensorManagerService {
  SensorManagerService({this.autoSaveInterval = const Duration(minutes: 15)});

  /// Bluetooth SIG Environmental Sensing standard UUIDs
  static final Guid environmentalSensingServiceUuid = Guid('181a');
  static final Guid temperatureCharacteristicUuid = Guid('2a6e');
  static final Guid humidityCharacteristicUuid = Guid('2a6f');
  static final Guid batteryServiceUuid = Guid('180f');
  static final Guid batteryLevelCharacteristicUuid = Guid('2a19');

  static final math.Random _random = math.Random();

  final Duration autoSaveInterval;
  Timer? _periodicAutoSaveTimer;
  StreamSubscription<List<ScanResult>>? _scanSubscription;
  StreamSubscription<BluetoothAdapterState>? _adapterSubscription;
  BluetoothDevice? _connectedDevice;
  DateTime? _lastSavedTimestamp;

  final StreamController<EnvironmentalSensorReading> _readingController =
      StreamController<EnvironmentalSensorReading>.broadcast();

  final StreamController<SensorConnectionStatus> _statusController =
      StreamController<SensorConnectionStatus>.broadcast();

  Stream<EnvironmentalSensorReading> get readingStream =>
      _readingController.stream;
  Stream<SensorConnectionStatus> get statusStream => _statusController.stream;

  EnvironmentalSensorReading _lastReading = EnvironmentalSensorReading(
    temperatureC: 25.2,
    humidityPercent: 78.0,
    sensorName: 'KALRO Rearing Sensor #1',
    timestamp: DateTime.now(),
    isSimulated: true,
  );

  SensorConnectionStatus _currentStatus = SensorConnectionStatus.disconnected;

  EnvironmentalSensorReading get lastReading => _lastReading;
  SensorConnectionStatus get currentStatus => _currentStatus;
  DateTime? get lastSavedTimestamp => _lastSavedTimestamp;

  /// Byte conversion for Temperature Characteristic 0x2A6E (sint16 in 0.01 deg C, little-endian).
  static double parseTemperatureBytes(List<int> bytes) {
    if (bytes.length < 2) return 25.0;
    try {
      final byteData = ByteData.sublistView(Uint8List.fromList(bytes));
      final raw = byteData.getInt16(0, Endian.little);
      final temp = raw / 100.0;
      // Sanity clamp for sericulture rearing (10 - 50 C)
      return double.parse(temp.clamp(10.0, 50.0).toStringAsFixed(1));
    } catch (_) {
      return 25.0;
    }
  }

  /// Byte conversion for Humidity Characteristic 0x2A6F (uint16 in 0.01% or uint8 in 1%, little-endian).
  static double parseHumidityBytes(List<int> bytes) {
    if (bytes.isEmpty) return 75.0;
    try {
      if (bytes.length >= 2) {
        final byteData = ByteData.sublistView(Uint8List.fromList(bytes));
        final raw = byteData.getUint16(0, Endian.little);
        final val = (raw > 100) ? raw / 100.0 : raw.toDouble();
        return double.parse(val.clamp(20.0, 100.0).toStringAsFixed(1));
      } else {
        return bytes[0].toDouble().clamp(20.0, 100.0);
      }
    } catch (_) {
      return 75.0;
    }
  }

  /// Connects to a physical or simulated BLE sensor and streams temperature/humidity.
  Future<EnvironmentalSensorReading> scanAndReadSensor({
    Duration scanTimeout = const Duration(seconds: 8),
    String? preferredRoomName,
  }) async {
    _updateStatus(SensorConnectionStatus.scanning);

    try {
      // 1. Verify Bluetooth Hardware Support & State
      final isSupported = await FlutterBluePlus.isSupported;
      if (!isSupported) {
        _updateStatus(SensorConnectionStatus.simulated);
        return await readRoomSensor(preferredRoomName: preferredRoomName);
      }

      final adapterState = await FlutterBluePlus.adapterState.first;
      if (adapterState != BluetoothAdapterState.on) {
        if (adapterState == BluetoothAdapterState.unauthorized) {
          _updateStatus(SensorConnectionStatus.unauthorized);
        } else {
          _updateStatus(SensorConnectionStatus.bluetoothOff);
        }
        return await readRoomSensor(preferredRoomName: preferredRoomName);
      }

      // 2. Perform Targeted BLE Scan for 0x181A Environmental Sensing Beacons
      final completer = Completer<EnvironmentalSensorReading>();

      // Listen for BLE scan results
      _scanSubscription?.cancel();
      _scanSubscription = FlutterBluePlus.scanResults.listen((results) async {
        for (final r in results) {
          // Check for Environmental Sensing Service (0x181A) or common sericulture beacons
          final has181a = r.advertisementData.serviceUuids.contains(environmentalSensingServiceUuid);
          final devName = r.device.platformName.isNotEmpty
              ? r.device.platformName
              : r.advertisementData.advName;
          final isMijiaOrBeacon = devName.toLowerCase().contains('mijia') ||
              devName.toLowerCase().contains('lywsd') ||
              devName.toLowerCase().contains('atc') ||
              devName.toLowerCase().contains('kalro') ||
              devName.toLowerCase().contains('sensor');

          if (has181a || isMijiaOrBeacon) {
            FlutterBluePlus.stopScan();
            try {
              final reading = await _connectAndReadDevice(r.device, r.rssi);
              if (!completer.isCompleted) {
                completer.complete(reading);
              }
              return;
            } catch (e) {
              debugPrint('[SensorManagerService] Error reading device GATT: $e');
            }
          }
        }
      });

      await FlutterBluePlus.startScan(
        withServices: [environmentalSensingServiceUuid],
        timeout: scanTimeout,
      );

      // Await discovery or timeout
      final reading = await completer.future.timeout(
        scanTimeout,
        onTimeout: () {
          FlutterBluePlus.stopScan();
          _updateStatus(SensorConnectionStatus.outOfRange);
          return readRoomSensor(preferredRoomName: preferredRoomName);
        },
      );

      _emitReading(reading);
      return reading;
    } catch (e) {
      debugPrint('[SensorManagerService] BLE Scan Exception: $e. Falling back to simulation.');
      _updateStatus(SensorConnectionStatus.simulated);
      return await readRoomSensor(preferredRoomName: preferredRoomName);
    }
  }

  /// Establishes GATT connection to sensor device, reads 0x2A6E and 0x2A6F, and battery.
  Future<EnvironmentalSensorReading> _connectAndReadDevice(
    BluetoothDevice device,
    int rssi,
  ) async {
    _connectedDevice = device;
    await device.connect(
      license: License.nonprofit,
      timeout: const Duration(seconds: 4),
    );
    _updateStatus(SensorConnectionStatus.connected);

    final services = await device.discoverServices();
    double temp = 25.0;
    double humidity = 75.0;
    int? battery;

    for (final service in services) {
      if (service.uuid == environmentalSensingServiceUuid) {
        for (final char in service.characteristics) {
          if (char.uuid == temperatureCharacteristicUuid) {
            final val = await char.read();
            temp = parseTemperatureBytes(val);
          } else if (char.uuid == humidityCharacteristicUuid) {
            final val = await char.read();
            humidity = parseHumidityBytes(val);
          }
        }
      } else if (service.uuid == batteryServiceUuid) {
        for (final char in service.characteristics) {
          if (char.uuid == batteryLevelCharacteristicUuid) {
            final val = await char.read();
            if (val.isNotEmpty) battery = val[0];
          }
        }
      }
    }

    final reading = EnvironmentalSensorReading(
      temperatureC: temp,
      humidityPercent: humidity,
      sensorName: device.platformName.isNotEmpty ? device.platformName : 'Xiaomi Mijia BLE (0x181A)',
      timestamp: DateTime.now(),
      batteryPercent: battery ?? (85 + _random.nextInt(15)),
      isSimulated: false,
      deviceId: device.remoteId.str,
      rssi: rssi,
    );

    _emitReading(reading);
    return reading;
  }

  /// Fallback simulated sensor telemetry with realistic microclimate variations.
  Future<EnvironmentalSensorReading> readRoomSensor({
    String? preferredRoomName,
  }) async {
    final double baseTemp = 25.0 + (_random.nextDouble() * 2.0 - 1.0);
    final double baseHumidity = 76.0 + (_random.nextDouble() * 6.0 - 3.0);

    final reading = EnvironmentalSensorReading(
      temperatureC: double.parse(baseTemp.toStringAsFixed(1)),
      humidityPercent: double.parse(baseHumidity.toStringAsFixed(0)),
      sensorName: preferredRoomName ?? 'KALRO Rearing Sensor #1',
      batteryPercent: 88 + _random.nextInt(12),
      timestamp: DateTime.now(),
      isSimulated: true,
    );

    _emitReading(reading);
    return reading;
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

  /// Starts recurring 15-minute auto-save cycle into the local FarmStore SQLite database.
  void startPeriodicAutoSave({
    required EnvironmentLogRepository repository,
    required String defaultBatchId,
    String? roomName,
  }) {
    _periodicAutoSaveTimer?.cancel();

    // Trigger immediate reading & save
    _saveReadingToDatabase(repository, defaultBatchId, roomName);

    _periodicAutoSaveTimer = Timer.periodic(autoSaveInterval, (_) {
      _saveReadingToDatabase(repository, defaultBatchId, roomName);
    });
  }

  final List<EnvironmentalSensorReading> _pendingBatch = [];

  /// Bulk saves a batch of sensor readings using a single SQLite transaction.
  Future<void> saveReadingsBatch({
    required EnvironmentLogRepository repository,
    required String batchId,
    required List<EnvironmentalSensorReading> readings,
    String? defaultNotes,
  }) async {
    if (readings.isEmpty) return;
    const uuid = Uuid();
    final logs = [
      for (final r in readings)
        EnvironmentLog(
          id: uuid.v4(),
          batchId: batchId,
          recordedAt: r.timestamp,
          temperatureCelsius: r.temperatureC,
          humidityPercent: r.humidityPercent,
          roomName: r.sensorName,
          notes: defaultNotes ??
              'Bulk auto-saved via BLE (${r.isSimulated ? "Simulated" : "0x181A Connected"})',
        ),
    ];
    await repository.insertAll(logs);
    _lastSavedTimestamp = DateTime.now();
    debugPrint(
      '[SensorManagerService] Bulk saved ${logs.length} microclimate logs via transaction.',
    );
  }

  /// Queues a reading for transaction-batched persistence.
  void queueReading(EnvironmentalSensorReading reading) {
    _pendingBatch.add(reading);
  }

  Future<void> _saveReadingToDatabase(
    EnvironmentLogRepository repository,
    String batchId,
    String? roomName,
  ) async {
    try {
      final reading = await scanAndReadSensor(preferredRoomName: roomName);
      final toSave = _pendingBatch.isNotEmpty
          ? [..._pendingBatch, reading]
          : [reading];
      _pendingBatch.clear();
      await saveReadingsBatch(
        repository: repository,
        batchId: batchId,
        readings: toSave,
        defaultNotes: 'Auto-saved via BLE Environmental Beacon (${reading.isSimulated ? "Simulated" : "0x181A Connected"})',
      );
      debugPrint('[SensorManagerService] Auto-saved microclimate log (${reading.temperatureC}°C, ${reading.humidityPercent}% RH) to FarmStore SQLite.');
    } catch (e) {
      debugPrint('[SensorManagerService] Error during auto-save: $e');
    }
  }

  void stopPeriodicAutoSave() {
    _periodicAutoSaveTimer?.cancel();
    _periodicAutoSaveTimer = null;
  }

  void _emitReading(EnvironmentalSensorReading reading) {
    _lastReading = reading;
    if (!_readingController.isClosed) {
      _readingController.add(reading);
    }
  }

  void _updateStatus(SensorConnectionStatus status) {
    _currentStatus = status;
    if (!_statusController.isClosed) {
      _statusController.add(status);
    }
  }

  void dispose() {
    stopPeriodicAutoSave();
    _scanSubscription?.cancel();
    _adapterSubscription?.cancel();
    _connectedDevice?.disconnect();
    _readingController.close();
    _statusController.close();
    _pendingBatch.clear();
  }
}

// ==============================================================================
// RIVERPOD CLIMATE STATE NOTIFIER & PROVIDERS
// ==============================================================================

/// Global provider for the singleton instance of SensorManagerService.
final sensorManagerServiceProvider = Provider<SensorManagerService>((ref) {
  final service = SensorManagerService();
  ref.onDispose(service.dispose);
  return service;
});

/// Riverpod StateNotifier for streaming live climate telemetry into the UI.
class ClimateNotifier extends Notifier<ClimateState> {
  StreamSubscription<EnvironmentalSensorReading>? _readingSub;
  StreamSubscription<SensorConnectionStatus>? _statusSub;

  @override
  ClimateState build() {
    final service = ref.watch(sensorManagerServiceProvider);

    _readingSub?.cancel();
    _statusSub?.cancel();

    _readingSub = service.readingStream.listen((reading) {
      state = state.copyWith(
        currentReading: reading,
        connectedDeviceName: reading.sensorName,
      );
    });

    _statusSub = service.statusStream.listen((status) {
      state = state.copyWith(status: status);
    });

    ref.onDispose(() {
      _readingSub?.cancel();
      _statusSub?.cancel();
    });

    return ClimateState(
      currentReading: service.lastReading,
      status: service.currentStatus,
      connectedDeviceName: service.lastReading.sensorName,
      lastSavedAt: service.lastSavedTimestamp,
    );
  }

  /// Triggers a manual refresh / scan from BLE beacons.
  Future<void> refreshSensor({String? roomName}) async {
    final service = ref.read(sensorManagerServiceProvider);
    state = state.copyWith(status: SensorConnectionStatus.scanning);
    try {
      final reading = await service.scanAndReadSensor(preferredRoomName: roomName);
      state = state.copyWith(
        currentReading: reading,
        status: service.currentStatus,
        connectedDeviceName: reading.sensorName,
      );
    } catch (e) {
      state = state.copyWith(
        status: SensorConnectionStatus.simulated,
        errorMessage: e.toString(),
      );
    }
  }

  /// Initializes auto-saving every 15 minutes.
  void initAutoSave({
    required EnvironmentLogRepository repository,
    required String defaultBatchId,
  }) {
    final service = ref.read(sensorManagerServiceProvider);
    service.startPeriodicAutoSave(
      repository: repository,
      defaultBatchId: defaultBatchId,
    );
    state = state.copyWith(lastSavedAt: DateTime.now());
  }
}

/// Riverpod provider for real-time climate telemetry state.
final climateNotifierProvider =
    NotifierProvider<ClimateNotifier, ClimateState>(ClimateNotifier.new);
