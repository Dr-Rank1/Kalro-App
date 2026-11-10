import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../models/batch.dart';
import '../models/species.dart';
import '../services/app_repositories.dart';
import '../services/batch_repository.dart';
import '../services/producer_repository.dart';
import '../theme/kalro_colors.dart';
import 'package:kalro/l10n/translator.dart';

enum BatchStartingStage {
  eggIncubation,
  hatchedInstar1,
  chawkiInstar2,
  chawkiInstar3;

  String get label {
    return switch (this) {
      BatchStartingStage.eggIncubation => 'Egg Incubation (10–12 days to hatch)',
      BatchStartingStage.hatchedInstar1 => 'Hatched Larvae (1st Instar Brushing)',
      BatchStartingStage.chawkiInstar2 => 'Chawki Larvae (2nd Instar)',
      BatchStartingStage.chawkiInstar3 => 'Chawki Larvae (3rd Instar)',
    };
  }

  String get shortLabel {
    return switch (this) {
      BatchStartingStage.eggIncubation => 'Eggs (Incubating)',
      BatchStartingStage.hatchedInstar1 => '1st Instar (Brushing)',
      BatchStartingStage.chawkiInstar2 => '2nd Instar Chawki',
      BatchStartingStage.chawkiInstar3 => '3rd Instar Chawki',
    };
  }

  String get description {
    return switch (this) {
      BatchStartingStage.eggIncubation =>
        'Start with egg layings; prepare room during 10–12 days of incubation.',
      BatchStartingStage.hatchedInstar1 =>
        'Larvae hatched today; brush onto beds and begin tender leaf feeding immediately.',
      BatchStartingStage.chawkiInstar2 =>
        'Young worms received after 1st moult; active early-instar feeding.',
      BatchStartingStage.chawkiInstar3 =>
        'Hardy worms received after 2nd moult; start voracious late-age feeding.',
    };
  }

  String get stageKey {
    return switch (this) {
      BatchStartingStage.eggIncubation => 'incubation',
      BatchStartingStage.hatchedInstar1 => 'instar1',
      BatchStartingStage.chawkiInstar2 => 'instar2',
      BatchStartingStage.chawkiInstar3 => 'instar3',
    };
  }

  int pastDaysFor(Species species) {
    if (species == Species.bombyx) {
      return switch (this) {
        BatchStartingStage.eggIncubation => 0,
        BatchStartingStage.hatchedInstar1 => 12,
        BatchStartingStage.chawkiInstar2 => 16,
        BatchStartingStage.chawkiInstar3 => 20,
      };
    } else {
      return switch (this) {
        BatchStartingStage.eggIncubation => 0,
        BatchStartingStage.hatchedInstar1 => 11,
        BatchStartingStage.chawkiInstar2 => 16,
        BatchStartingStage.chawkiInstar3 => 21,
      };
    }
  }
}

class CreateBatchScreen extends StatefulWidget {
  const CreateBatchScreen({
    super.key,
    required this.repository,
    this.producers,
    this.copyFrom,
    this.initialSpecies,
    this.initialStartDate,
    this.farmRepositories,
  });

  static const routeName = '/create-batch';

  final BatchRepository repository;
  final ProducerRepository? producers;
  final Batch? copyFrom;
  final Species? initialSpecies;
  final DateTime? initialStartDate;
  final AppRepositories? farmRepositories;

  @override
  State<CreateBatchScreen> createState() => _CreateBatchScreenState();
}

class _CreateBatchScreenState extends State<CreateBatchScreen> {
  final _formKey = GlobalKey<FormState>();
  late Species _species;
  late DateTime _startDate;
  BatchStartingStage _startingStage = BatchStartingStage.hatchedInstar1;

  final _eggCountController = TextEditingController();
  final _batchTagController = TextEditingController();
  final _locationController = TextEditingController();
  final _feedController = TextEditingController();

  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _species = widget.copyFrom?.species ?? widget.initialSpecies ?? Species.bombyx;
    _startDate = widget.initialStartDate ?? DateTime.now();

    final copy = widget.copyFrom;
    if (copy != null) {
      _eggCountController.text = '${copy.eggCount}';
      _batchTagController.text = copy.batchTag ?? '';
      _locationController.text = copy.location ?? '';
      _feedController.text = copy.feedMaterial ?? '';
    } else {
      _eggCountController.text = '';
      _batchTagController.text = _suggestBatchTag(_species, _startDate);
      _feedController.text = _species == Species.bombyx ? 'Mulberry' : 'Castor / kesseru';
    }
  }

  @override
  void dispose() {
    _eggCountController.dispose();
    _batchTagController.dispose();
    _locationController.dispose();
    _feedController.dispose();
    super.dispose();
  }

  String _suggestBatchTag(Species species, DateTime date) {
    final prefix = species == Species.bombyx ? 'BOM' : 'ERI';
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return 'BATCH-${date.year}-$month-$prefix-$day';
  }

  void _onSpeciesChanged(Species newSpecies) {
    setState(() {
      _species = newSpecies;
      if (_batchTagController.text.isEmpty ||
          _batchTagController.text.startsWith('BATCH-')) {
        _batchTagController.text = _suggestBatchTag(newSpecies, _startDate);
      }
      _feedController.text =
          newSpecies == Species.bombyx ? 'Mulberry' : 'Castor / kesseru';
    });
  }

  Future<void> _pickStartDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        _startDate = picked;
        if (_batchTagController.text.startsWith('BATCH-')) {
          _batchTagController.text = _suggestBatchTag(_species, picked);
        }
      });
    }
  }

  DateTime get _effectiveStartDate {
    final past = _startingStage.pastDaysFor(_species);
    return _startDate.subtract(Duration(days: past));
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);
    try {
      final count = int.parse(_eggCountController.text.trim());
      final batch = await widget.repository.create(
        species: _species,
        startDate: _effectiveStartDate,
        eggCount: count,
        location: _locationController.text.trim(),
        feedMaterial: _feedController.text.trim(),
        batchTag: _batchTagController.text.trim().isNotEmpty
            ? _batchTagController.text.trim()
            : _suggestBatchTag(_species, _startDate),
      );

      final farm = widget.farmRepositories;
      if (farm != null && _startingStage != BatchStartingStage.eggIncubation) {
        await farm.milestoneObservations.record(
          batchId: batch.id,
          stageKey: _startingStage.stageKey,
          observedDate: _startDate,
        );
      }

      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not save batch: $error'.tr)),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KalroColors.headerGreen,
      appBar: AppBar(
        title: Text(
          widget.copyFrom == null ? 'New Batch'.tr : 'Start Like This Lot'.tr,
          style: GoogleFonts.poppins(fontWeight: FontWeight.w700),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _saving ? null : () => Navigator.of(context).pop(),
        ),
      ),
      body: Container(
        decoration: const BoxDecoration(
          color: KalroColors.background,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: KalroBackground(
          child: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
              children: [
                // 1. Silkworm Variety
                Text(
                  'Silkworm Variety'.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: KalroColors.textDark,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: _VarietyCard(
                        species: Species.bombyx,
                        title: 'Bombyx mori',
                        subtitle: 'Mulberry Silkworm',
                        selected: _species == Species.bombyx,
                        onTap: () => _onSpeciesChanged(Species.bombyx),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _VarietyCard(
                        species: Species.eri,
                        title: 'Samia ricini',
                        subtitle: 'Eri Silkworm',
                        selected: _species == Species.eri,
                        onTap: () => _onSpeciesChanged(Species.eri),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // 2. Quantity (Larvae / Eggs) - NO PRESETS
                Text(
                  'Quantity of Larvae / Eggs'.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: KalroColors.textDark,
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _eggCountController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: InputDecoration(
                    labelText: 'Number of Eggs or Worms'.tr,
                    hintText: 'e.g. 500 or 20,000',
                    suffixText: 'worms'.tr,
                  ),
                  validator: (v) {
                    final parsed = int.tryParse(v?.trim() ?? '');
                    if (parsed == null || parsed <= 0) {
                      return 'Enter number of worms or eggs'.tr;
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 20),

                // 3. Batch Code / Name
                Text(
                  'Batch Identification'.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: KalroColors.textDark,
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _batchTagController,
                  decoration: InputDecoration(
                    labelText: 'Batch Name or Code'.tr,
                    hintText: 'e.g. BATCH-2026-11-01',
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.refresh, size: 20),
                      tooltip: 'Regenerate code'.tr,
                      onPressed: () {
                        _batchTagController.text =
                            _suggestBatchTag(_species, _startDate);
                      },
                    ),
                  ),
                  validator: (v) =>
                      v?.trim().isEmpty == true ? 'Enter batch code or name'.tr : null,
                ),
                const SizedBox(height: 20),

                // 4. Starting Stage
                Text(
                  'Starting Stage'.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: KalroColors.textDark,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    (BatchStartingStage.hatchedInstar1, '1st Instar (Hatched)'.tr),
                    (BatchStartingStage.eggIncubation, 'Egg Incubation'.tr),
                    (BatchStartingStage.chawkiInstar3, '3rd Instar (Chawki)'.tr),
                  ].map((item) {
                    final isSel = _startingStage == item.$1;
                    return ChoiceChip(
                      label: Text(
                        item.$2,
                        style: GoogleFonts.poppins(
                          fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                          fontSize: 12,
                        ),
                      ),
                      selected: isSel,
                      selectedColor: KalroColors.leaf.withValues(alpha: 0.18),
                      onSelected: (_) => setState(() => _startingStage = item.$1),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 20),

                // 5. Start Date & Chamber
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: KalroDateRow(
                        label: 'Start Date'.tr,
                        date: _startDate,
                        enabled: !_saving,
                        onTap: _pickStartDate,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 4,
                      child: TextFormField(
                        controller: _locationController,
                        decoration: InputDecoration(
                          labelText: 'Rearing Chamber (Optional)'.tr,
                          hintText: 'e.g. House 1',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 28),

                // 6. Action Button
                KalroPrimaryButton(
                  label: _saving
                      ? 'Creating batch...'.tr
                      : 'Create Batch & Start Rearing'.tr,
                  onPressed: _saving ? null : _save,
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _VarietyCard extends StatelessWidget {
  const _VarietyCard({
    required this.species,
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  final Species species;
  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isBom = species == Species.bombyx;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: selected
              ? KalroColors.leaf.withValues(alpha: 0.12)
              : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? KalroColors.primaryGreen : KalroColors.divider,
            width: selected ? 2 : 1,
          ),
          boxShadow: selected ? KalroColors.softShadow : null,
        ),
        child: Row(
          children: [
            Icon(
              isBom ? Icons.spa_outlined : Icons.eco_outlined,
              color: selected ? KalroColors.primaryGreen : KalroColors.textMuted,
              size: 22,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                      color: selected ? KalroColors.primaryGreen : KalroColors.textDark,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: GoogleFonts.poppins(fontSize: 10, color: KalroColors.textMuted),
                  ),
                ],
              ),
            ),
            if (selected)
              const Icon(Icons.check_circle, color: KalroColors.primaryGreen, size: 18),
          ],
        ),
      ),
    );
  }
}
