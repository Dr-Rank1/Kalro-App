import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../constants/disease_library.dart';
import '../../models/mortality_log.dart';
import '../../services/mortality_log_repository.dart';
import '../../theme/kalro_colors.dart';
import '../../utils/record_helpers.dart';
import '../buttons/kalro_primary_button.dart';
import '../cards/kalro_section_header.dart';
import '../records/record_empty_state.dart';
import '../records/record_log_tile.dart';
import '../records/record_summary_bar.dart';
import 'package:kalro/l10n/translator.dart';

class MortalityLogSection extends StatefulWidget {
  MortalityLogSection({
    super.key,
    required this.batchId,
    required this.repository,
    this.onChanged,
  });

  final String batchId;
  final MortalityLogRepository repository;
  final VoidCallback? onChanged;

  @override
  State<MortalityLogSection> createState() => _MortalityLogSectionState();
}

class _MortalityLogSectionState extends State<MortalityLogSection> {
  late Future<List<MortalityLog>> _logsFuture;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _logsFuture = widget.repository.getByBatchId(widget.batchId);
    });
  }

  Future<void> _deleteLog(MortalityLog log) async {
    if (!await confirmDeleteRecord(context, what: 'mortality log')) return;
    await widget.repository.delete(log.id);
    _reload();
    widget.onChanged?.call();
  }

  Future<void> _openAddDialog() async {
    final countController = TextEditingController(text: '1');
    final reasonController = TextEditingController();
    final treatmentController = TextEditingController();
    final notesController = TextEditingController();
    String? disease;

    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
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
                      'Log mortality',
                      style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600),
                    ),
                    SizedBox(height: 16),
                    TextField(
                      controller: countController,
                      decoration: InputDecoration(labelText: 'Count'),
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    ),
                    SizedBox(height: 12),
                    DropdownButtonFormField<String?>(
                      initialValue: disease,
                      decoration: InputDecoration(labelText: 'Disease (optional)'),
                      items: [
                        DropdownMenuItem(value: null, child: Text('None'.tr)),
                        ...DiseaseLibrary.entries.map(
                          (d) => DropdownMenuItem(value: d, child: Text(d)),
                        ),
                      ],
                      onChanged: (value) => setModalState(() => disease = value),
                    ),
                    SizedBox(height: 12),
                    TextField(
                      controller: reasonController,
                      decoration: InputDecoration(labelText: 'Reason (optional)'),
                    ),
                    SizedBox(height: 12),
                    TextField(
                      controller: treatmentController,
                      decoration: InputDecoration(labelText: 'Treatment (optional)'),
                    ),
                    SizedBox(height: 12),
                    TextField(
                      controller: notesController,
                      decoration: InputDecoration(labelText: 'Notes (optional)'),
                      maxLines: 2,
                    ),
                    SizedBox(height: 20),
                    KalroPrimaryButton(
                      label: 'Save mortality log'.tr,
                      onPressed: () async {
                        final count = int.tryParse(countController.text.trim());
                        if (count == null || count <= 0) return;
                        await widget.repository.create(
                          batchId: widget.batchId,
                          recordedAt: DateTime.now(),
                          count: count,
                          disease: disease,
                          reason: reasonController.text,
                          treatment: treatmentController.text,
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

    countController.dispose();
    reasonController.dispose();
    treatmentController.dispose();
    notesController.dispose();

    if (saved == true) {
      _reload();
      widget.onChanged?.call();
    }
  }

  String _subtitleFor(MortalityLog log) {
    return joinNonEmpty([
      if (log.disease != null) log.disease,
      if (log.reason?.trim().isNotEmpty == true) log.reason,
      if (log.treatment?.trim().isNotEmpty == true) 'Treatment: ${log.treatment}',
    ]) ?? 'Daily check';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(child: KalroSectionHeader(title: 'Mortality logs')),
            TextButton.icon(
              onPressed: _openAddDialog,
              icon: Icon(Icons.add, size: 18),
              label: Text('Add'.tr),
            ),
          ],
        ),
        SizedBox(height: 8),
        FutureBuilder<List<MortalityLog>>(
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
                icon: Icons.monitor_heart_outlined,
                title: 'No mortality logged'.tr,
                message: 'Record daily checks to track larvae health and spot problems early.',
                actionLabel: 'Log mortality',
                onAction: _openAddDialog,
              );
            }

            final total = logs.fold<int>(0, (sum, log) => sum + log.count);
            final latest = logs.first;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                RecordSummaryBar(
                  items: [
                    RecordSummaryItem(label: 'Total lost'.tr, value: '$total'),
                    RecordSummaryItem(label: 'Entries'.tr, value: '${logs.length}'),
                    RecordSummaryItem(label: 'Last check'.tr, value: '${latest.count}'),
                  ],
                ),
                SizedBox(height: 10),
                ...logs.map(
                  (log) => RecordLogTile(
                    icon: Icons.monitor_heart_outlined,
                    iconColor: log.disease != null ? Colors.orange.shade700 : KalroColors.textMuted,
                    title: '${log.count} larvae lost'.tr,
                    subtitle: _subtitleFor(log),
                    meta: formatRecordDate(log.recordedAt),
                    note: log.notes,
                    borderColor: log.disease != null ? Colors.orange.shade200 : null,
                    onDelete: () => _deleteLog(log),
                  ),
                ),
              ],
            );
          },
        ),
      ],
    );
  }
}
