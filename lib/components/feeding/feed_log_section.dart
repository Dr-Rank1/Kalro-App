import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/feed_log.dart';
import '../../models/species.dart';
import '../../services/app_repositories.dart';
import '../../services/feed_log_repository.dart';
import '../../services/floor_log_service.dart';
import '../../theme/kalro_colors.dart';
import '../../utils/record_helpers.dart';
import '../buttons/kalro_primary_button.dart';
import '../cards/kalro_section_header.dart';
import '../records/record_empty_state.dart';
import '../records/record_log_tile.dart';
import '../records/record_summary_bar.dart';
import 'package:kalro/l10n/translator.dart';

class FeedLogSection extends StatefulWidget {
  FeedLogSection({
    super.key,
    required this.batchId,
    required this.repository,
    this.defaultFeedType,
    this.onChanged,
    this.feedHint,
    this.suggestedGrams,
    this.farmRepositories,
    this.species,
  });

  final String batchId;
  final FeedLogRepository repository;
  final String? defaultFeedType;
  final VoidCallback? onChanged;
  final String? feedHint;
  final double? suggestedGrams;
  final AppRepositories? farmRepositories;
  final Species? species;

  @override
  State<FeedLogSection> createState() => _FeedLogSectionState();
}

class _FeedLogSectionState extends State<FeedLogSection> {
  late Future<List<FeedLog>> _logsFuture;

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

  Future<void> _deleteLog(FeedLog log) async {
    if (!await confirmDeleteRecord(context, what: 'feeding log')) return;
    await widget.repository.delete(log.id);
    _reload();
    widget.onChanged?.call();
  }

  Future<void> _openAddDialog() async {
    final feedController = TextEditingController(
      text: widget.defaultFeedType ?? '',
    );
    final quantityController = TextEditingController(
      text: widget.suggestedGrams != null && widget.suggestedGrams! > 0
          ? widget.suggestedGrams!.round().toString()
          : '',
    );
    final stageController = TextEditingController();
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
                'Log feeding'.tr,
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              SizedBox(height: 16),
              TextField(
                controller: feedController,
                decoration: InputDecoration(labelText: 'Feed type'.tr),
              ),
              SizedBox(height: 12),
              TextField(
                controller: quantityController,
                decoration: InputDecoration(labelText: 'Quantity (grams)'.tr),
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                ],
              ),
              SizedBox(height: 12),
              TextField(
                controller: stageController,
                decoration: InputDecoration(
                  labelText: 'Feeding stage (optional)'.tr,
                ),
              ),
              SizedBox(height: 12),
              TextField(
                controller: notesController,
                decoration: InputDecoration(labelText: 'Notes (optional)'.tr),
                maxLines: 2,
              ),
              SizedBox(height: 20),
              KalroPrimaryButton(
                label: 'Save feeding log'.tr,
                onPressed: () async {
                  final quantity = double.tryParse(
                    quantityController.text.trim(),
                  );
                  if (feedController.text.trim().isEmpty ||
                      quantity == null ||
                      quantity <= 0) {
                    return;
                  }
                  await widget.repository.create(
                    batchId: widget.batchId,
                    recordedAt: DateTime.now(),
                    feedType: feedController.text,
                    quantityGrams: quantity,
                    feedingStage: stageController.text,
                    notes: notesController.text,
                  );
                  final farm = widget.farmRepositories;
                  final species = widget.species;
                  if (farm != null && species != null) {
                    await const FloorLogService().deductLeafKg(
                      repositories: farm,
                      species: species,
                      kg: quantity / 1000,
                      batchId: widget.batchId,
                    );
                  }
                  if (context.mounted) Navigator.of(context).pop(true);
                },
              ),
            ],
          ),
        );
      },
    );

    feedController.dispose();
    quantityController.dispose();
    stageController.dispose();
    notesController.dispose();

    if (saved == true) {
      _reload();
      widget.onChanged?.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(child: KalroSectionHeader(title: 'Feeding logs'.tr)),
            TextButton.icon(
              onPressed: _openAddDialog,
              icon: Icon(Icons.add, size: 18),
              label: Text('Add'.tr),
            ),
          ],
        ),
        if (widget.feedHint != null) ...[
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: KalroColors.headerGreen.withValues(alpha: 0.07),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              widget.feedHint!,
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: KalroColors.headerGreen,
              ),
            ),
          ),
        ],
        SizedBox(height: 8),
        FutureBuilder<List<FeedLog>>(
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
                icon: Icons.restaurant_outlined,
                title: 'No feedings yet'.tr,
                message:
                    'Log each feeding to track leaf use and consumption over the cycle.'
                        .tr,
                actionLabel: 'Log feeding'.tr,
                onAction: _openAddDialog,
              );
            }

            final total = logs.fold<double>(
              0,
              (sum, log) => sum + log.quantityGrams,
            );
            final latest = logs.first;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                RecordSummaryBar(
                  items: [
                    RecordSummaryItem(
                      label: 'Total feed'.tr,
                      value: formatGrams(total),
                    ),
                    RecordSummaryItem(
                      label: 'Entries'.tr,
                      value: '${logs.length}',
                    ),
                    RecordSummaryItem(
                      label: 'Latest'.tr,
                      value: formatGrams(latest.quantityGrams),
                    ),
                  ],
                ),
                SizedBox(height: 10),
                ...logs.map(
                  (log) => RecordLogTile(
                    icon: Icons.restaurant_outlined,
                    iconColor: KalroColors.primaryGreen,
                    iconBackground: KalroColors.peach.withValues(alpha: 0.35),
                    title: '${formatGrams(log.quantityGrams)} · ${log.feedType}'
                        .tr,
                    subtitle: log.feedingStage?.trim().isNotEmpty == true
                        ? log.feedingStage
                        : null,
                    meta: formatRecordDate(log.recordedAt),
                    note: log.notes,
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
