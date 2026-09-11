import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../constants/environment_thresholds.dart';
import '../../models/batch.dart';
import '../../models/environment_log.dart';
import '../../services/environment_log_repository.dart';
import '../../theme/kalro_colors.dart';
import '../../utils/record_helpers.dart';
import '../buttons/kalro_primary_button.dart';
import '../cards/kalro_section_header.dart';
import '../records/record_empty_state.dart';
import '../records/record_log_tile.dart';
import '../records/record_summary_bar.dart';
import 'package:kalro/l10n/translator.dart';

class EnvironmentLogSection extends StatefulWidget {
  EnvironmentLogSection({
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
    if (!await confirmDeleteRecord(context, what: 'environment reading')) return;
    await widget.repository.delete(log.id);
    _reload();
    widget.onChanged?.call();
  }

  Future<void> _openAddDialog() async {
    final thresholds = EnvironmentThresholds.forSpecies(widget.batch.species);
    final tempController = TextEditingController(
      text: ((thresholds.minTempC + thresholds.maxTempC) / 2).toStringAsFixed(1),
    );
    final humidityController = TextEditingController(
      text: ((thresholds.minHumidity + thresholds.maxHumidity) / 2).toStringAsFixed(0),
    );
    final notesController = TextEditingController();

    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Log environment',
                style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              Text(
                'Ideal: ${thresholds.minTempC}–${thresholds.maxTempC}°C, '
                '${thresholds.minHumidity.toStringAsFixed(0)}–${thresholds.maxHumidity.toStringAsFixed(0)}% RH',
                style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
              ),
              SizedBox(height: 16),
              TextField(
                controller: tempController,
                decoration: InputDecoration(labelText: 'Temperature (°C)'),
                keyboardType: TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
              ),
              SizedBox(height: 12),
              TextField(
                controller: humidityController,
                decoration: InputDecoration(labelText: 'Humidity (%)'),
                keyboardType: TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
              ),
              SizedBox(height: 12),
              TextField(
                controller: notesController,
                decoration: InputDecoration(labelText: 'Notes (optional)'),
                maxLines: 2,
              ),
              SizedBox(height: 20),
              KalroPrimaryButton(
                label: 'Save reading'.tr,
                onPressed: () async {
                  final temp = double.tryParse(tempController.text.trim());
                  final humidity = double.tryParse(humidityController.text.trim());
                  if (temp == null || humidity == null) return;
                  await widget.repository.create(
                    batchId: widget.batch.id,
                    recordedAt: DateTime.now(),
                    temperatureCelsius: temp,
                    humidityPercent: humidity,
                    notes: notesController.text,
                  );
                  if (context.mounted) Navigator.of(context).pop(true);
                },
              ),
            ],
          ),
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

  @override
  Widget build(BuildContext context) {
    final thresholds = EnvironmentThresholds.forSpecies(widget.batch.species);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(child: KalroSectionHeader(title: 'Environment')),
            TextButton.icon(
              onPressed: _openAddDialog,
              icon: Icon(Icons.add, size: 18),
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
                    'Log temperature and humidity daily to catch stress before it affects larvae.',
                actionLabel: 'Log reading',
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
                      value: '${latest.temperatureCelsius.toStringAsFixed(1)}°C',
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
                  final tempOk = thresholds.isTemperatureOk(log.temperatureCelsius);
                  final humidityOk = thresholds.isHumidityOk(log.humidityPercent);
                  final alert = !tempOk || !humidityOk;

                  return RecordLogTile(
                    icon: alert ? Icons.warning_amber_rounded : Icons.thermostat_outlined,
                    iconColor: alert ? Colors.orange.shade700 : KalroColors.headerGreen,
                    borderColor: alert ? Colors.orange.shade300 : null,
                    title: '${log.temperatureCelsius.toStringAsFixed(1)}°C · '
                        '${log.humidityPercent.toStringAsFixed(0)}% humidity',
                    subtitle: alert ? 'Outside ideal range for ${widget.batch.species.label}' : 'Within range',
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
