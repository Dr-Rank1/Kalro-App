import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

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
import 'photo_gallery.dart';
import 'package:kalro/l10n/translator.dart';

class MortalityLogSection extends StatefulWidget {
  MortalityLogSection({
    super.key,
    required this.batchId,
    required this.repository,
    this.batchLabel,
    this.onChanged,
  });

  final String batchId;
  final MortalityLogRepository repository;
  final String? batchLabel;
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
    String? photoPath;
    DiseaseInfo? info;

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
                      'Log mortality'.tr,
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    SizedBox(height: 16),
                    TextField(
                      controller: countController,
                      decoration: InputDecoration(labelText: 'Count'.tr),
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    ),
                    SizedBox(height: 12),
                    DropdownButtonFormField<String?>(
                      initialValue: disease,
                      decoration: InputDecoration(
                        labelText: 'Disease (optional)'.tr,
                      ),
                      items: [
                        DropdownMenuItem(value: null, child: Text('None'.tr)),
                        ...DiseaseLibrary.info.map(
                          (d) => DropdownMenuItem(
                            value: d.name,
                            child: Text(d.name),
                          ),
                        ),
                      ],
                      onChanged: (value) => setModalState(() {
                        disease = value;
                        info = DiseaseLibrary.byName(value);
                      }),
                    ),
                    if (info != null) ...[
                      SizedBox(height: 12),
                      Text(
                        info!.signs,
                        style: GoogleFonts.poppins(fontSize: 13),
                      ),
                      SizedBox(height: 6),
                      Text(
                        info!.action,
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          color: KalroColors.textMuted,
                        ),
                      ),
                      if (info!.seedLotRisk)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            'Seed-lot risk — isolate and tell CRC.'.tr,
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: KalroColors.danger,
                            ),
                          ),
                        ),
                    ],
                    SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: () async {
                        try {
                          final picked = await ImagePicker().pickImage(
                            source: ImageSource.camera,
                            imageQuality: 70,
                          );
                          if (picked == null) return;
                          setModalState(() => photoPath = picked.path);
                        } catch (_) {}
                      },
                      icon: Icon(Icons.photo_camera_outlined, size: 18),
                      label: Text(
                        photoPath == null
                            ? 'Photo (optional)'
                            : 'Photo attached',
                      ),
                    ),
                    SizedBox(height: 12),
                    TextField(
                      controller: reasonController,
                      decoration: InputDecoration(
                        labelText: 'Reason (optional)'.tr,
                      ),
                    ),
                    SizedBox(height: 12),
                    TextField(
                      controller: treatmentController,
                      decoration: InputDecoration(
                        labelText: 'Treatment (optional)'.tr,
                      ),
                    ),
                    SizedBox(height: 12),
                    TextField(
                      controller: notesController,
                      decoration: InputDecoration(
                        labelText: 'Notes (optional)'.tr,
                      ),
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
                          isolated:
                              DiseaseLibrary.byName(disease)?.seedLotRisk ??
                              false,
                          photoPath: photoPath,
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
          if (log.treatment?.trim().isNotEmpty == true)
            'Treatment: ${log.treatment}',
        ]) ??
        'Daily check';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(child: KalroSectionHeader(title: 'Mortality logs'.tr)),
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
                message:
                    'Record daily checks to track larvae health and spot problems early.'
                        .tr,
                actionLabel: 'Log mortality'.tr,
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
                    RecordSummaryItem(
                      label: 'Entries'.tr,
                      value: '${logs.length}',
                    ),
                    RecordSummaryItem(
                      label: 'Last check'.tr,
                      value: '${latest.count}',
                    ),
                  ],
                ),
                SizedBox(height: 10),
                ...logs.map(
                  (log) => RecordLogTile(
                    icon: Icons.monitor_heart_outlined,
                    iconColor: log.disease != null
                        ? Colors.orange.shade700
                        : KalroColors.textMuted,
                    title: Translator.fill('{n} larvae lost', {
                      'n': '${log.count}',
                    }),
                    subtitle: _subtitleFor(log),
                    meta: formatRecordDate(log.recordedAt),
                    note: log.notes,
                    imagePath: log.photoPath,
                    borderColor: log.disease != null
                        ? Colors.orange.shade200
                        : null,
                    onDelete: () => _deleteLog(log),
                    onImageTap: (log.photoPath ?? '').isEmpty
                        ? null
                        : () => openMortalityPhoto(
                            context,
                            MortalityPhotoItem(
                              log: log,
                              batchLabel: widget.batchLabel ?? 'Lot'.tr,
                            ),
                          ),
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
