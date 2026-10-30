import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../constants/environment_thresholds.dart';
import '../../models/batch.dart';
import '../../models/environment_log.dart';
import '../../services/environment_log_repository.dart';
import '../../services/sensor_manager_service.dart';
import '../../theme/kalro_colors.dart';
import '../../utils/record_helpers.dart';
import '../buttons/kalro_primary_button.dart';
import '../cards/kalro_section_header.dart';
import '../records/record_empty_state.dart';
import '../records/record_log_tile.dart';
import '../records/record_summary_bar.dart';
import 'package:kalro/l10n/translator.dart';

class EnvironmentLogSection extends StatefulWidget {
  const EnvironmentLogSection({
    super.key,
    required this.batch,
    required this.repository,
    this.onChanged,
  });

  final Batch batch;
  final EnvironmentLogRepository repository;
  final VoidCallback? onChanged;

  @override
  State<EnvironmentLogSection> createState() => _EnvironmentLogSectionState();
}

class _EnvironmentLogSectionState extends State<EnvironmentLogSection> {
  late Future<List<EnvironmentLog>> _logsFuture;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _logsFuture = widget.repository.getByBatchId(widget.batch.id);
    });
  }

  Future<void> _deleteLog(EnvironmentLog log) async {
    if (!await confirmDeleteRecord(context, what: 'environment reading')) {
      return;
    }
    await widget.repository.delete(log.id);
    _reload();
    widget.onChanged?.call();
  }

  Future<void> _openAddDialog({
    double? initialTemp,
    double? initialHumidity,
  }) async {
    final thresholds = EnvironmentThresholds.forSpecies(widget.batch.species);
    final tempController = TextEditingController(
      text: (initialTemp ?? ((thresholds.minTempC + thresholds.maxTempC) / 2))
          .toStringAsFixed(1),
    );
    final humidityController = TextEditingController(
      text: (initialHumidity ??
              ((thresholds.minHumidity + thresholds.maxHumidity) / 2))
          .toStringAsFixed(0),
    );
    final notesController = TextEditingController();
    var ventilation = 'Adequate';
    var lightCondition = 'Filtered';

    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Log environment'.tr,
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      'Ideal: ${thresholds.minTempC}–${thresholds.maxTempC}°C, '
                      '${thresholds.minHumidity.toStringAsFixed(0)}–${thresholds.maxHumidity.toStringAsFixed(0)}% RH',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: KalroColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: tempController,
                      decoration: InputDecoration(labelText: 'Temperature (°C)'.tr),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: humidityController,
                      decoration: InputDecoration(labelText: 'Humidity (%)'.tr),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Ventilation'.tr,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: KalroColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: ['Good', 'Adequate', 'Poor'].map((v) {
                        final isSel = ventilation == v;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(v.tr),
                            selected: isSel,
                            onSelected: (selected) {
                              if (selected) {
                                setModalState(() => ventilation = v);
                              }
                            },
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Light condition'.tr,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: KalroColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: ['Filtered', 'Dark', 'Direct'].map((l) {
                        final isSel = lightCondition == l;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(l.tr),
                            selected: isSel,
                            onSelected: (selected) {
                              if (selected) {
                                setModalState(() => lightCondition = l);
                              }
                            },
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: notesController,
                      decoration: InputDecoration(labelText: 'Notes (optional)'.tr),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 20),
                    KalroPrimaryButton(
                      label: 'Save reading'.tr,
                      onPressed: () async {
                        final temp = double.tryParse(tempController.text.trim());
                        final humidity = double.tryParse(
                          humidityController.text.trim(),
                        );
                        if (temp == null || humidity == null) return;
                        await widget.repository.create(
                          batchId: widget.batch.id,
                          recordedAt: DateTime.now(),
                          temperatureCelsius: temp,
                          humidityPercent: humidity,
                          ventilation: ventilation,
                          lightCondition: lightCondition,
                          notes: notesController.text,
                        );
                        if (context.mounted) Navigator.of(context).pop(true);
                      },
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );

    tempController.dispose();
    humidityController.dispose();
    notesController.dispose();

    if (saved == true) {
      _reload();
      widget.onChanged?.call();
    }
  }

  Future<void> _syncSensorReading() async {
    final reading = await SensorManagerService().readRoomSensor(
      preferredRoomName: widget.batch.location,
    );
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Sensor reading captured: ${reading.temperatureC}°C, ${reading.humidityPercent.toStringAsFixed(0)}% RH'.tr,
        ),
        duration: const Duration(seconds: 2),
      ),
    );
    _openAddDialog(
      initialTemp: reading.temperatureC,
      initialHumidity: reading.humidityPercent,
    );
  }

  @override
  Widget build(BuildContext context) {
    final thresholds = EnvironmentThresholds.forSpecies(widget.batch.species);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(child: KalroSectionHeader(title: 'Environment'.tr)),
            TextButton.icon(
              onPressed: _syncSensorReading,
              icon: const Icon(Icons.bluetooth_searching, size: 18),
              label: Text('Sync sensor'.tr),
            ),
            const SizedBox(width: 4),
            TextButton.icon(
              onPressed: _openAddDialog,
              icon: const Icon(Icons.add, size: 18),
              label: Text('Add'.tr),
            ),
          ],
        ),
        SizedBox(height: 8),
        FutureBuilder<List<EnvironmentLog>>(
          future: _logsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return Padding(
                padding: EdgeInsets.all(16),
                child: Center(child: CircularProgressIndicator()),
              );
            }

            final logs = snapshot.data ?? [];
            if (logs.isEmpty) {
              return RecordEmptyState(
                icon: Icons.thermostat_outlined,
                title: 'No readings yet'.tr,
                message:
                    'Log temperature and humidity daily to catch stress before it affects larvae.'
                        .tr,
                actionLabel: 'Log reading'.tr,
                onAction: _openAddDialog,
              );
            }

            final latest = logs.first;
            final outOfRange = logs.where((log) {
              return !thresholds.isTemperatureOk(log.temperatureCelsius) ||
                  !thresholds.isHumidityOk(log.humidityPercent);
            }).length;

            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                RecordSummaryBar(
                  items: [
                    RecordSummaryItem(
                      label: 'Latest temp'.tr,
                      value:
                          '${latest.temperatureCelsius.toStringAsFixed(1)}°C',
                    ),
                    RecordSummaryItem(
                      label: 'Latest RH'.tr,
                      value: '${latest.humidityPercent.toStringAsFixed(0)}%',
                    ),
                    RecordSummaryItem(
                      label: 'Out of range'.tr,
                      value: '$outOfRange',
                    ),
                  ],
                ),
                SizedBox(height: 10),
                ...logs.map((log) {
                  final tempOk = thresholds.isTemperatureOk(
                    log.temperatureCelsius,
                  );
                  final humidityOk = thresholds.isHumidityOk(
                    log.humidityPercent,
                  );
                  final alert = !tempOk || !humidityOk;

                  final conditionParts = [
                    if (log.ventilation != null && log.ventilation!.isNotEmpty)
                      'Vent: ${log.ventilation}'.tr,
                    if (log.lightCondition != null &&
                        log.lightCondition!.isNotEmpty)
                      'Light: ${log.lightCondition}'.tr,
                  ];
                  final condText = conditionParts.isNotEmpty
                      ? ' · ${conditionParts.join(' · ')}'
                      : '';

                  return RecordLogTile(
                    icon: alert
                        ? Icons.warning_amber_rounded
                        : Icons.thermostat_outlined,
                    iconColor: alert
                        ? Colors.orange.shade700
                        : KalroColors.headerGreen,
                    borderColor: alert ? Colors.orange.shade300 : null,
                    title:
                        '${log.temperatureCelsius.toStringAsFixed(1)}°C · '
                        '${log.humidityPercent.toStringAsFixed(0)}% humidity$condText',
                    subtitle: alert
                        ? 'Outside ideal range for ${widget.batch.species.label}'
                        : 'Within range',
                    meta: formatRecordDate(log.recordedAt),
                    note: log.notes,
                    onDelete: () => _deleteLog(log),
                  );
                }),
              ],
            );
          },
        ),
      ],
    );
  }
}
