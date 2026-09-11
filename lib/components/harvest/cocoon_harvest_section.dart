import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/batch_status.dart';
import '../../models/cocoon_harvest.dart';
import '../../services/batch_repository.dart';
import '../../services/cocoon_analytics_service.dart';
import '../../services/cocoon_harvest_repository.dart';
import '../../theme/kalro_colors.dart';
import '../../utils/record_helpers.dart';
import '../buttons/kalro_primary_button.dart';
import '../cards/kalro_section_header.dart';
import '../records/record_empty_state.dart';
import '../records/record_log_tile.dart';
import '../records/record_summary_bar.dart';

class CocoonHarvestSection extends StatefulWidget {
  const CocoonHarvestSection({
    super.key,
    required this.batchId,
    required this.startingCount,
    required this.harvestRepository,
    required this.batchRepository,
    this.onHarvestRecorded,
  });

  final String batchId;
  final int startingCount;
  final CocoonHarvestRepository harvestRepository;
  final BatchRepository batchRepository;
  final VoidCallback? onHarvestRecorded;

  @override
  State<CocoonHarvestSection> createState() => _CocoonHarvestSectionState();
}

class _CocoonHarvestSectionState extends State<CocoonHarvestSection> {
  static const _analytics = CocoonAnalyticsService();
  late Future<List<CocoonHarvest>> _harvestsFuture;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _harvestsFuture = widget.harvestRepository.getByBatchId(widget.batchId);
    });
  }

  Future<void> _deleteHarvest(CocoonHarvest harvest) async {
    if (!await confirmDeleteRecord(context, what: 'harvest record')) return;
    await widget.harvestRepository.delete(harvest.id);
    _reload();
  }

  Future<void> _openAddDialog() async {
    final countController = TextEditingController();
    final weightController = TextEditingController();
    final defectiveController = TextEditingController(text: '0');
    final shellController = TextEditingController();
    final notesController = TextEditingController();

    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
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
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Record cocoon harvest',
                  style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: countController,
                  decoration: const InputDecoration(labelText: 'Cocoon count'),
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: weightController,
                  decoration: const InputDecoration(labelText: 'Total weight (grams)'),
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: defectiveController,
                  decoration: const InputDecoration(labelText: 'Defective count'),
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: shellController,
                  decoration: const InputDecoration(
                    labelText: 'Shell weight sample (g, optional)',
                  ),
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: notesController,
                  decoration: const InputDecoration(labelText: 'Notes (optional)'),
                  maxLines: 2,
                ),
                const SizedBox(height: 20),
                KalroPrimaryButton(
                  label: 'Save harvest',
                  onPressed: () async {
                    final count = int.tryParse(countController.text.trim());
                    final weight = double.tryParse(weightController.text.trim());
                    final defective = int.tryParse(defectiveController.text.trim()) ?? 0;
                    if (count == null || count <= 0 || weight == null || weight <= 0) {
                      return;
                    }
                    await widget.harvestRepository.create(
                      batchId: widget.batchId,
                      harvestDate: DateTime.now(),
                      cocoonCount: count,
                      totalWeightGrams: weight,
                      defectiveCount: defective,
                      shellWeightGrams: double.tryParse(shellController.text.trim()),
                      notes: notesController.text,
                    );

                    final batch = await widget.batchRepository.getById(widget.batchId);
                    if (batch != null && batch.status != BatchStatus.harvested) {
                      await widget.batchRepository.update(
                        batch.copyWith(status: BatchStatus.harvested),
                      );
                    }

                    if (context.mounted) Navigator.of(context).pop(true);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );

    countController.dispose();
    weightController.dispose();
    defectiveController.dispose();
    shellController.dispose();
    notesController.dispose();

    if (saved == true) {
      _reload();
      widget.onHarvestRecorded?.call();
    }
  }

  String _subtitleFor(CocoonHarvest harvest) {
    final avgWeight = harvest.cocoonCount > 0
        ? harvest.totalWeightGrams / harvest.cocoonCount
        : 0.0;
    return joinNonEmpty([
      'Avg ${avgWeight.toStringAsFixed(1)} g/cocoon',
      if (harvest.defectiveCount > 0) '${harvest.defectiveCount} defective',
      if (harvest.shellWeightGrams != null)
        'Shell sample ${harvest.shellWeightGrams!.toStringAsFixed(1)} g',
    ]) ?? 'Harvest record';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            const Expanded(child: KalroSectionHeader(title: 'Cocoon harvest')),
            TextButton.icon(
              onPressed: _openAddDialog,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        FutureBuilder<List<CocoonHarvest>>(
          future: _harvestsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Padding(
                padding: EdgeInsets.all(16),
                child: Center(child: CircularProgressIndicator()),
              );
            }

            final harvests = snapshot.data ?? [];
            if (harvests.isEmpty) {
              return RecordEmptyState(
                icon: Icons.inventory_2_outlined,
                title: 'No harvest recorded',
                message: 'Weigh cocoons when ready to track yield, survival, and quality.',
                actionLabel: 'Record harvest',
                onAction: _openAddDialog,
              );
            }

            return FutureBuilder(
              future: widget.batchRepository.getById(widget.batchId),
              builder: (context, batchSnapshot) {
                final batch = batchSnapshot.data;
                final metrics = batch != null ? _analytics.compute(batch, harvests) : null;
                final totalCocoons =
                    harvests.fold<int>(0, (sum, h) => sum + h.cocoonCount);
                final totalWeight =
                    harvests.fold<double>(0, (sum, h) => sum + h.totalWeightGrams);

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (metrics != null)
                      RecordSummaryBar(
                        items: [
                          RecordSummaryItem(
                            label: 'Avg weight',
                            value: '${metrics.averageCocoonWeightGrams.toStringAsFixed(1)} g',
                          ),
                          RecordSummaryItem(
                            label: 'Survival',
                            value: '${metrics.survivalPercent.toStringAsFixed(0)}%',
                          ),
                          RecordSummaryItem(
                            label: 'Yield/100 eggs',
                            value: '${metrics.yieldPer100EggsGrams.toStringAsFixed(0)} g',
                          ),
                        ],
                      )
                    else
                      RecordSummaryBar(
                        items: [
                          RecordSummaryItem(label: 'Cocoons', value: '$totalCocoons'),
                          RecordSummaryItem(label: 'Total weight', value: formatGrams(totalWeight)),
                          RecordSummaryItem(label: 'Records', value: '${harvests.length}'),
                        ],
                      ),
                    const SizedBox(height: 10),
                    ...harvests.map(
                      (harvest) => RecordLogTile(
                        icon: Icons.inventory_2_outlined,
                        iconColor: KalroColors.headerGreen,
                        title: '${harvest.cocoonCount} cocoons · ${formatGrams(harvest.totalWeightGrams)}',
                        subtitle: _subtitleFor(harvest),
                        meta: formatRecordDay(harvest.harvestDate),
                        note: harvest.notes,
                        onDelete: () => _deleteHarvest(harvest),
                      ),
                    ),
                  ],
                );
              },
            );
          },
        ),
      ],
    );
  }
}
