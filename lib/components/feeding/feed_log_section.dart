import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../constants/feed_skip_reasons.dart';
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
  const FeedLogSection({
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

    var isSkipping = false;
    var selectedReason = FeedSkipReasons.options.first.label;

    final messenger = ScaffoldMessenger.maybeOf(context);
    final saved = await showModalBottomSheet<bool>(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (modalContext, setModal) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(modalContext).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
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
                    const SizedBox(height: 12),
                    SegmentedButton<bool>(
                      segments: [
                        ButtonSegment(
                          value: false,
                          icon: const Icon(Icons.eco_outlined, size: 18),
                          label: Text('Feed larvae'.tr),
                        ),
                        ButtonSegment(
                          value: true,
                          icon: const Icon(Icons.pause_circle_outline, size: 18),
                          label: Text('Did not feed (Skip)'.tr),
                        ),
                      ],
                      selected: {isSkipping},
                      onSelectionChanged: (set) {
                        setModal(() => isSkipping = set.first);
                      },
                    ),
                    const SizedBox(height: 16),
                    if (isSkipping) ...[
                      Text(
                        'Reason for not feeding'.tr,
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: FeedSkipReasons.options.map((opt) {
                          final selected = selectedReason == opt.label;
                          return ChoiceChip(
                            avatar: Icon(opt.icon, size: 16),
                            label: Text(opt.label.tr),
                            selected: selected,
                            onSelected: (_) {
                              setModal(() => selectedReason = opt.label);
                            },
                            selectedColor: KalroColors.peach,
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        FeedSkipReasons.byLabelOrId(selectedReason).description.tr,
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontStyle: FontStyle.italic,
                          color: KalroColors.textMuted,
                        ),
                      ),
                    ] else ...[
                      TextField(
                        controller: feedController,
                        decoration: InputDecoration(labelText: 'Feed type'.tr),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: quantityController,
                        decoration: InputDecoration(labelText: 'Quantity (grams)'.tr),
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                        ],
                      ),
                    ],
                    const SizedBox(height: 12),
                    TextField(
                      controller: stageController,
                      decoration: InputDecoration(
                        labelText: 'Feeding stage (optional)'.tr,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: notesController,
                      decoration: InputDecoration(labelText: 'Notes (optional)'.tr),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 20),
                    KalroPrimaryButton(
                      label: isSkipping
                          ? 'Record skipped feed'.tr
                          : 'Save feeding log'.tr,
                      onPressed: () async {
                        if (isSkipping) {
                          await widget.repository.create(
                            batchId: widget.batchId,
                            recordedAt: DateTime.now(),
                            feedType: 'Skipped',
                            quantityGrams: 0,
                            feedingStage: stageController.text,
                            notes: notesController.text,
                            isSkipped: true,
                            skipReason: selectedReason,
                          );
                          if (sheetContext.mounted) {
                            Navigator.of(sheetContext).pop(true);
                          }
                          return;
                        }

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
                          isSkipped: false,
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
                        if (sheetContext.mounted) {
                          Navigator.of(sheetContext).pop(true);
                        }
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

    feedController.dispose();
    quantityController.dispose();
    stageController.dispose();
    notesController.dispose();

    if (saved == true) {
      messenger?.showSnackBar(
        SnackBar(
          content: Text(
            isSkipping
                ? '⏸ Recorded non-feeding: $selectedReason'.tr
                : '✓ Feeding logged successfully'.tr,
          ),
          backgroundColor:
              isSkipping ? KalroColors.harvest : KalroColors.headerGreen,
        ),
      );
      await Future<void>.delayed(const Duration(milliseconds: 280));
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

            final total = logs.where((l) => !l.wasSkipped).fold<double>(
              0,
              (sum, log) => sum + log.quantityGrams,
            );
            final skippedCount = logs.where((l) => l.wasSkipped).length;
            final latestNonSkipped = logs.where((l) => !l.wasSkipped).toList();
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
                    if (skippedCount > 0)
                      RecordSummaryItem(
                        label: 'Skipped'.tr,
                        value: '$skippedCount',
                      )
                    else if (latestNonSkipped.isNotEmpty)
                      RecordSummaryItem(
                        label: 'Latest'.tr,
                        value: formatGrams(latestNonSkipped.first.quantityGrams),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                ...logs.map(
                  (log) => RecordLogTile(
                    icon: log.wasSkipped
                        ? Icons.pause_circle_outline
                        : Icons.restaurant_outlined,
                    iconColor: log.wasSkipped
                        ? KalroColors.harvest
                        : KalroColors.primaryGreen,
                    iconBackground: log.wasSkipped
                        ? KalroColors.peach.withValues(alpha: 0.5)
                        : KalroColors.peach.withValues(alpha: 0.35),
                    title: log.wasSkipped
                        ? Translator.fill('Skipped · {reason}', {
                            'reason': (log.skipReason ?? 'Did not feed').tr,
                          })
                        : '${formatGrams(log.quantityGrams)} · ${log.feedType}'.tr,
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
