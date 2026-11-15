import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../l10n/translator.dart';
import '../../services/environment_log_repository.dart';
import '../../services/sensor_manager_service.dart';

/// Riverpod-powered Climate Summary Card streaming real-time BLE temperature & humidity.
class ClimateSummaryCard extends ConsumerStatefulWidget {
  const ClimateSummaryCard({
    super.key,
    this.batchId,
    this.environmentLogRepository,
    this.roomName,
  });

  final String? batchId;
  final EnvironmentLogRepository? environmentLogRepository;
  final String? roomName;

  @override
  ConsumerState<ClimateSummaryCard> createState() => _ClimateSummaryCardState();
}

class _ClimateSummaryCardState extends ConsumerState<ClimateSummaryCard> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.environmentLogRepository != null && widget.batchId != null) {
        ref.read(climateNotifierProvider.notifier).initAutoSave(
              repository: widget.environmentLogRepository!,
              defaultBatchId: widget.batchId!,
            );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final climateState = ref.watch(climateNotifierProvider);
    final reading = climateState.currentReading;
    final status = climateState.status;

    // Sericulture standard limits: 24-28 C, 70-85% RH
    final isTempOptimal = reading.temperatureC >= 24.0 && reading.temperatureC <= 28.0;
    final isHumidityOptimal = reading.humidityPercent >= 70.0 && reading.humidityPercent <= 85.0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF18181B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF27272A)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. Header with Connection Status
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF27272A),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.bluetooth_searching,
                      color: Color(0xFF10B981),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Rearing Hut Climate (BLE)'.tr,
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        reading.sensorName,
                        style: GoogleFonts.poppins(
                          color: const Color(0xFFA1A1AA),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              _buildStatusPill(status),
            ],
          ),

          // 2. Bluetooth State Warning Banner (Graceful Zero-Crash Handling)
          if (status == SensorConnectionStatus.bluetoothOff ||
              status == SensorConnectionStatus.unauthorized) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF27272A),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFD97706)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, color: Color(0xFFD97706), size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      status == SensorConnectionStatus.bluetoothOff
                          ? 'Bluetooth is switched off. Enable Bluetooth to sync 0x181A beacons.'.tr
                          : 'Location/BLE permissions required to discover beacons.'.tr,
                      style: GoogleFonts.poppins(
                        color: Colors.white70,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 16),

          // 3. Primary Metrics Grid
          Row(
            children: [
              // Temperature Card
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF09090B),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isTempOptimal
                          ? const Color(0xFF27272A)
                          : const Color(0xFFD97706),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'TEMPERATURE'.tr,
                            style: GoogleFonts.poppins(
                              color: const Color(0xFFA1A1AA),
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Icon(
                            Icons.thermostat_outlined,
                            size: 16,
                            color: isTempOptimal
                                ? const Color(0xFF10B981)
                                : const Color(0xFFD97706),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${reading.temperatureC.toStringAsFixed(1)}°C',
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isTempOptimal
                            ? 'Optimal (24-28°C)'.tr
                            : (reading.temperatureC < 24.0
                                ? 'Cool: Warm shed'.tr
                                : 'High: Ventilate'.tr),
                        style: GoogleFonts.poppins(
                          color: isTempOptimal
                              ? const Color(0xFF10B981)
                              : const Color(0xFFD97706),
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(width: 12),

              // Relative Humidity Card
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF09090B),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isHumidityOptimal
                          ? const Color(0xFF27272A)
                          : const Color(0xFFD97706),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'HUMIDITY'.tr,
                            style: GoogleFonts.poppins(
                              color: const Color(0xFFA1A1AA),
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Icon(
                            Icons.water_drop_outlined,
                            size: 16,
                            color: isHumidityOptimal
                                ? const Color(0xFF10B981)
                                : const Color(0xFFD97706),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${reading.humidityPercent.toStringAsFixed(0)}%',
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isHumidityOptimal
                            ? 'Optimal (70-85%)'.tr
                            : (reading.humidityPercent < 70.0
                                ? 'Dry: Hang damp jute'.tr
                                : 'Damp: Dust lime'.tr),
                        style: GoogleFonts.poppins(
                          color: isHumidityOptimal
                              ? const Color(0xFF10B981)
                              : const Color(0xFFD97706),
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // 4. Footer with Auto-Save Metadata & Refresh Action
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.sync_outlined, size: 14, color: Color(0xFFA1A1AA)),
                  const SizedBox(width: 6),
                  Text(
                    'SQLite 15m Auto-Save Active'.tr,
                    style: GoogleFonts.poppins(
                      color: const Color(0xFFA1A1AA),
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: const BorderSide(color: Color(0xFF3F3F46)),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
                icon: status == SensorConnectionStatus.scanning
                    ? const SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.refresh, size: 14),
                label: Text(
                  'Scan Now'.tr,
                  style: GoogleFonts.poppins(fontSize: 11),
                ),
                onPressed: status == SensorConnectionStatus.scanning
                    ? null
                    : () {
                        ref
                            .read(climateNotifierProvider.notifier)
                            .refreshSensor(roomName: widget.roomName);
                      },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusPill(SensorConnectionStatus status) {
    Color bg;
    Color fg;
    String label;

    switch (status) {
      case SensorConnectionStatus.connected:
        bg = const Color(0xFF10B981);
        fg = Colors.black;
        label = '0x181A LIVE';
        break;
      case SensorConnectionStatus.scanning:
        bg = const Color(0xFF6366F1);
        fg = Colors.white;
        label = 'SCANNING';
        break;
      case SensorConnectionStatus.bluetoothOff:
      case SensorConnectionStatus.unauthorized:
        bg = const Color(0xFFEF4444);
        fg = Colors.white;
        label = 'BT OFF';
        break;
      case SensorConnectionStatus.outOfRange:
        bg = const Color(0xFFD97706);
        fg = Colors.white;
        label = 'OUT OF RANGE';
        break;
      case SensorConnectionStatus.simulated:
      case SensorConnectionStatus.disconnected:
        bg = const Color(0xFF27272A);
        fg = const Color(0xFFD4D4D8);
        label = 'TELEMETRY';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: GoogleFonts.poppins(
          color: fg,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
