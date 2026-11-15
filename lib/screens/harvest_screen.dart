import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../models/batch.dart';
import '../models/batch_status.dart';
import '../services/app_repositories.dart';
import '../services/cocoon_vision_service.dart';
import '../theme/kalro_colors.dart';
import 'package:kalro/l10n/translator.dart';

class HarvestScreen extends StatefulWidget {
  const HarvestScreen({
    super.key,
    required this.repositories,
    required this.canEdit,
  });

  final AppRepositories repositories;
  final bool canEdit;

  @override
  State<HarvestScreen> createState() => _HarvestScreenState();
}

class _HarvestScreenState extends State<HarvestScreen> {
  late Future<List<Batch>> _batchesFuture;
  Batch? _selectedBatch;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _batchesFuture = widget.repositories.batches.getAll().then((all) {
        final active = all.where((b) => b.status != BatchStatus.closed).toList();
        if (_selectedBatch != null) {
          final stillExists =
              active.where((b) => b.id == _selectedBatch!.id).isNotEmpty;
          if (!stillExists) {
            _selectedBatch = active.isNotEmpty ? active.first : null;
          }
        } else if (active.isNotEmpty) {
          _selectedBatch = active.first;
        }
        return active;
      });
    });
  }

  Future<void> _openCameraScanner() async {
    if (_selectedBatch == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please select an active batch first.'.tr)),
      );
      return;
    }

    final tally = await showDialog<CocoonVisionTally>(
      context: context,
      builder: (ctx) => Dialog.fullscreen(
        child: CocoonCameraOverlayWidget(
          onApplyTally: (t) => Navigator.of(ctx).pop(t),
          onClose: () => Navigator.of(ctx).pop(),
        ),
      ),
    );

    if (tally != null && mounted) {
      await _confirmAndSaveTally(tally);
    }
  }

  Future<void> _confirmAndSaveTally(CocoonVisionTally tally) async {
    final weightController = TextEditingController(
      text: (tally.totalDetected * 1.85).toStringAsFixed(1),
    );
    final shellController = TextEditingController();

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Confirm AI Triage Harvest'.tr,
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF4F4F5),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFE4E4E7)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Detected: ${tally.totalDetected} cocoons (${tally.totalDefects} defects, ${tally.defectRatePercent.toStringAsFixed(1)}%)',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Commercial Grade: ${tally.commercialGrade}',
                      style: GoogleFonts.poppins(
                        color: KalroColors.primaryGreen,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Thin: ${tally.thinCount} · Framed: ${tally.framedCount} · Irreg: ${tally.irregularCount} · Melted: ${tally.meltedCount} · Double: ${tally.doubleCount} · Stained: ${tally.stainedCount}',
                      style: GoogleFonts.poppins(fontSize: 11, color: Colors.black54),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: weightController,
                decoration: InputDecoration(
                  labelText: 'Total weight in grams (Required)'.tr,
                  suffixText: 'g',
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: shellController,
                decoration: InputDecoration(
                  labelText: 'Shell weight sample in grams (Optional)'.tr,
                  suffixText: 'g',
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: KalroColors.primaryGreen,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                onPressed: () {
                  final weight = double.tryParse(weightController.text.trim());
                  if (weight != null && weight > 0) {
                    Navigator.of(ctx).pop(true);
                  }
                },
                child: Text(
                  'Save Harvest Record'.tr,
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
        );
      },
    );

    if (confirmed == true && mounted) {
      final weight = double.parse(weightController.text.trim());
      final shell = double.tryParse(shellController.text.trim());

      final defectSummary = [
        if (tally.thinCount > 0) 'Thin: ${tally.thinCount}',
        if (tally.framedCount > 0) 'Framed: ${tally.framedCount}',
        if (tally.irregularCount > 0) 'Irreg: ${tally.irregularCount}',
        if (tally.meltedCount > 0) 'Melted: ${tally.meltedCount}',
        if (tally.doubleCount > 0) 'Double: ${tally.doubleCount}',
        if (tally.stainedCount > 0) 'Stained: ${tally.stainedCount}',
      ].join(', ');

      await widget.repositories.cocoonHarvests.create(
        batchId: _selectedBatch!.id,
        harvestDate: DateTime.now(),
        cocoonCount: tally.totalDetected,
        totalWeightGrams: weight,
        defectiveCount: tally.totalDefects,
        shellWeightGrams: shell,
        doubleCount: tally.doubleCount,
        stainedCount: tally.stainedCount,
        flimsyCount: tally.thinCount,
        meltedCount: tally.meltedCount,
        notes: 'AI Vision Triage: $defectSummary (${tally.commercialGrade})',
      );

      final batch = await widget.repositories.batches.getById(_selectedBatch!.id);
      if (batch != null && batch.status != BatchStatus.harvested) {
        await widget.repositories.batches.update(
          batch.copyWith(status: BatchStatus.harvested),
        );
      }

      _reload();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${tally.totalDetected} cocoons recorded via AI Triage (${tally.commercialGrade})'.tr,
            ),
            backgroundColor: KalroColors.primaryGreen,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: KalroBackground(
        child: SafeArea(
          child: FutureBuilder<List<Batch>>(
            future: _batchesFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }

              final activeBatches = snapshot.data ?? [];

              return ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  KalroToolbar(
                    title: 'Cocoon Harvest'.tr,
                    subtitle:
                        'Record harvest weight, count, and shell samples.'.tr,
                  ),
                  const SizedBox(height: 20),

                  // AI Vision Triage Callout Banner
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF18181B),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF27272A)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
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
                                Icons.camera_alt_outlined,
                                color: Color(0xFF10B981),
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'AI Cocoon Defect Triage'.tr,
                                    style: GoogleFonts.poppins(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 15,
                                    ),
                                  ),
                                  Text(
                                    'On-device MobileNetV2 · 6 defect classes'.tr,
                                    style: GoogleFonts.poppins(
                                      color: const Color(0xFFA1A1AA),
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Automates real-time classification for Thin, Framed, Irregular, Melted, Double, and Stained cocoons with bounding boxes.'
                              .tr,
                          style: GoogleFonts.poppins(
                            color: const Color(0xFFD4D4D8),
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 14),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: Colors.black,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            icon: const Icon(Icons.qr_code_scanner, size: 18),
                            label: Text(
                              'Launch AI Camera Scanner'.tr,
                              style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            onPressed: activeBatches.isNotEmpty
                                ? _openCameraScanner
                                : null,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),
                  if (activeBatches.isEmpty)
                    RecordEmptyState(
                      icon: Icons.layers_outlined,
                      title: 'No active batches'.tr,
                      message: 'Start a rearing cycle to record harvests.'.tr,
                    )
                  else ...[
                    InputDecorator(
                      decoration: InputDecoration(labelText: 'Select Batch'.tr),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<Batch>(
                          value: _selectedBatch,
                          isExpanded: true,
                          items: activeBatches.map((b) {
                            return DropdownMenuItem(
                              value: b,
                              child: Text(
                                '${b.displayTag} (${b.strain != null ? "${b.strain} · " : ""}${b.species.label})',
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            setState(() => _selectedBatch = val);
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    if (_selectedBatch != null)
                      CocoonHarvestSection(
                        batchId: _selectedBatch!.id,
                        startingCount: _selectedBatch!.eggCount,
                        harvestRepository: widget.repositories.cocoonHarvests,
                        batchRepository: widget.repositories.batches,
                      ),
                  ],
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
