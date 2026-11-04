import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../models/batch.dart';
import '../models/leaf_inventory.dart';
import '../models/producer.dart';
import '../models/rearing_conditions.dart';
import '../models/species.dart';
import '../services/app_repositories.dart';
import '../services/batch_repository.dart';
import '../services/lifecycle_planning_service.dart';
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

  final _dflController = TextEditingController(text: '1');
  final _eggCountController = TextEditingController(text: '400');
  final _batchTagController = TextEditingController();
  final _strainController = TextEditingController();
  final _locationController = TextEditingController();
  final _caretakerController = TextEditingController();
  final _feedController = TextEditingController();
  final _eggSourceController = TextEditingController();
  final _rearingTypeController = TextEditingController();

  String? _eggSourceName;
  List<Producer> _producerList = [];
  LeafInventory? _currentInventory;
  static const _planning = LifecyclePlanningService();
  RearingScenario _scenario = RearingScenario.typical;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _species = widget.copyFrom?.species ?? widget.initialSpecies ?? Species.bombyx;
    _startDate = widget.initialStartDate ?? DateTime.now();

    final copy = widget.copyFrom;
    if (copy != null) {
      _eggCountController.text = '${copy.eggCount}';
      _dflController.text = (copy.eggCount / 400).toStringAsFixed(copy.eggCount % 400 == 0 ? 0 : 2);
      _batchTagController.text = copy.batchTag ?? '';
      _strainController.text = copy.strain ?? '';
      _locationController.text = copy.location ?? '';
      _caretakerController.text = copy.caretaker ?? '';
      _feedController.text = copy.feedMaterial ?? '';
      _eggSourceController.text = copy.eggSource ?? '';
      _eggSourceName = copy.eggSource;
      _rearingTypeController.text = copy.rearingType ?? '';
    } else {
      _batchTagController.text = _suggestBatchTag(_species, _startDate);
      _feedController.text = _species == Species.bombyx ? 'Mulberry' : 'Castor / kesseru';
    }

    widget.producers?.getAll().then((list) {
      if (mounted) setState(() => _producerList = list);
    });

    widget.farmRepositories?.leafInventory.get().then((inv) {
      if (mounted) setState(() => _currentInventory = inv);
    });
  }

  @override
  void dispose() {
    _dflController.dispose();
    _eggCountController.dispose();
    _batchTagController.dispose();
    _strainController.dispose();
    _locationController.dispose();
    _caretakerController.dispose();
    _feedController.dispose();
    _eggSourceController.dispose();
    _rearingTypeController.dispose();
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
      if (_feedController.text.isEmpty ||
          _feedController.text == 'Mulberry' ||
          _feedController.text == 'Castor / kesseru') {
        _feedController.text =
            newSpecies == Species.bombyx ? 'Mulberry' : 'Castor / kesseru';
      }
    });
  }

  void _onDflChanged(String val) {
    final dfl = double.tryParse(val.trim());
    if (dfl != null && dfl > 0) {
      final eggs = (dfl * 400).round();
      _eggCountController.text = '$eggs';
      setState(() {});
    }
  }

  void _onEggCountChanged(String val) {
    final eggs = int.tryParse(val.trim());
    if (eggs != null && eggs > 0) {
      final dfl = eggs / 400.0;
      _dflController.text = dfl.toStringAsFixed(eggs % 400 == 0 ? 0 : 2);
      setState(() {});
    }
  }

  void _setPreset(int dfl) {
    _dflController.text = '$dfl';
    _eggCountController.text = '${dfl * 400}';
    setState(() {});
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
        strain: _strainController.text,
        location: _locationController.text,
        caretaker: _caretakerController.text,
        feedMaterial: _feedController.text,
        eggSource: _eggSourceController.text,
        rearingType: _rearingTypeController.text,
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
    final eggCount = int.tryParse(_eggCountController.text.trim()) ?? 400;
    final dflCount = eggCount / 400.0;

    // Sericulture forecast calculations
    final leafFactorPerDfl = _species == Species.bombyx ? 24.0 : 30.0;
    final totalLeafKg = dflCount * leafFactorPerDfl;
    final yieldFactorPerDfl = _species == Species.bombyx ? 0.30 : 0.26;
    final estimatedYieldKg = dflCount * yieldFactorPerDfl;
    final bedSpaceEarly = (dflCount * 2.5).toStringAsFixed(1);
    final bedSpaceLate = (dflCount * 22.0).toStringAsFixed(1);

    final currentStock = _species == Species.bombyx
        ? (_currentInventory?.mulberryKg ?? 0.0)
        : ((_currentInventory?.castorKg ?? 0.0) + (_currentInventory?.kesseruKg ?? 0.0));

    return Scaffold(
      backgroundColor: KalroColors.headerGreen,
      appBar: AppBar(
        title: Text(
          widget.copyFrom == null ? 'New Rearing Batch'.tr : 'Start like this lot'.tr,
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
              padding: const EdgeInsets.all(20),
              children: [
                // Top Intro Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: KalroColors.softShadow,
                    border: Border.all(color: KalroColors.headerGreen.withValues(alpha: 0.15)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: KalroColors.headerGreen.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.layers_outlined, color: KalroColors.headerGreen, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Guided Batch Setup'.tr,
                              style: GoogleFonts.poppins(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: KalroColors.textDark,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Select breed, starting stage, and quantity for instant leaf & harvest forecast.'
                                  .tr,
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                color: KalroColors.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Species Selection Cards
                Text(
                  '1. Select Breed & Host Plant'.tr,
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
                      child: _SpeciesSelectCard(
                        species: Species.bombyx,
                        title: 'Bombyx mori',
                        subtitle: 'Mulberry Silkworm',
                        tag: 'Reelable Silk · 38–42d',
                        host: 'Mulberry leaf',
                        selected: _species == Species.bombyx,
                        onTap: () => _onSpeciesChanged(Species.bombyx),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _SpeciesSelectCard(
                        species: Species.eri,
                        title: 'Samia ricini',
                        subtitle: 'Eri Silkworm',
                        tag: 'Ahimsa / Spun · 45–50d',
                        host: 'Castor / Kesseru',
                        selected: _species == Species.eri,
                        onTap: () => _onSpeciesChanged(Species.eri),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Starting Stage Selector (Solves the rest-day issue)
                Text(
                  '2. Starting Lifecycle Stage'.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: KalroColors.textDark,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Pick the state of your worms today. If they hatched or you received chawki, feeding starts immediately.'
                      .tr,
                  style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                ),
                const SizedBox(height: 10),
                ...BatchStartingStage.values.map((stage) {
                  final isSelected = _startingStage == stage;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: InkWell(
                      onTap: () => setState(() => _startingStage = stage),
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: isSelected ? KalroColors.headerGreen.withValues(alpha: 0.08) : Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isSelected ? KalroColors.headerGreen : Colors.grey.shade300,
                            width: isSelected ? 2 : 1,
                          ),
                          boxShadow: isSelected ? KalroColors.softShadow : null,
                        ),
                        child: Row(
                          children: [
                            Icon(
                              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                              color: isSelected ? KalroColors.headerGreen : Colors.grey,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    stage.label.tr,
                                    style: GoogleFonts.poppins(
                                      fontSize: 13,
                                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                                      color: isSelected ? KalroColors.headerGreen : KalroColors.textDark,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    stage.description.tr,
                                    style: GoogleFonts.poppins(
                                      fontSize: 11,
                                      color: KalroColors.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 16),

                // Batch Tag & Arrival Date
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: TextFormField(
                        controller: _batchTagController,
                        decoration: InputDecoration(
                          labelText: 'Batch Code / Tag'.tr,
                          hintText: 'e.g. BATCH-2026-BOM-01',
                          suffixIcon: IconButton(
                            icon: const Icon(Icons.refresh, size: 20),
                            onPressed: () {
                              _batchTagController.text = _suggestBatchTag(_species, _startDate);
                            },
                          ),
                        ),
                        validator: (v) => v?.trim().isEmpty == true ? 'Enter batch tag' : null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: KalroDateRow(
                        label: 'Arrival / Start'.tr,
                        date: _startDate,
                        enabled: !_saving,
                        onTap: _pickStartDate,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Quantity: Dual DFL & Egg Count
                Text(
                  '3. Quantity (DFLs & Eggs)'.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: KalroColors.textDark,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '1 DFL (Disease-Free Laying) = ~400 eggs. Adjust either field.'.tr,
                  style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _dflController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: InputDecoration(
                          labelText: 'DFL Count'.tr,
                          suffixText: 'DFL',
                        ),
                        onChanged: _onDflChanged,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _eggCountController,
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        decoration: InputDecoration(
                          labelText: 'Larvae / Eggs'.tr,
                          suffixText: 'worms',
                        ),
                        onChanged: _onEggCountChanged,
                        validator: (value) {
                          final parsed = int.tryParse(value?.trim() ?? '');
                          if (parsed == null || parsed <= 0) {
                            return 'Enter valid count';
                          }
                          return null;
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  children: [1, 2, 5, 10, 25].map((dfl) {
                    final isSel = dflCount == dfl;
                    return ActionChip(
                      label: Text('$dfl DFL (${dfl * 400})'),
                      backgroundColor: isSel ? KalroColors.leaf.withValues(alpha: 0.2) : Colors.white,
                      onPressed: () => _setPreset(dfl),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 20),

                // Live Forecast & Capacity Preview Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: KalroColors.softShadow,
                    border: Border.all(color: KalroColors.harvest.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.analytics_outlined, color: KalroColors.harvest, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Live Cycle Forecast & Requirements'.tr,
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: KalroColors.textDark,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _ForecastItem(
                              label: 'Est. Total Leaf'.tr,
                              value: '${totalLeafKg.toStringAsFixed(1)} kg',
                              sub: '${_species == Species.bombyx ? "Mulberry" : "Castor"} needed',
                              color: KalroColors.leaf,
                            ),
                          ),
                          Expanded(
                            child: _ForecastItem(
                              label: 'Expected Cocoons'.tr,
                              value: '~${estimatedYieldKg.toStringAsFixed(2)} kg',
                              sub: 'Green cocoon weight',
                              color: KalroColors.harvest,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: _ForecastItem(
                              label: 'Peak Tray Space'.tr,
                              value: '$bedSpaceLate sq ft',
                              sub: 'Chawki needs: $bedSpaceEarly sq ft',
                              color: KalroColors.info,
                            ),
                          ),
                          Expanded(
                            child: _ForecastItem(
                              label: 'Current Farm Stock'.tr,
                              value: '${currentStock.toStringAsFixed(1)} kg',
                              sub: currentStock >= (totalLeafKg * 0.1)
                                  ? 'Stock covers early feeding'
                                  : 'Low stock — plan harvest',
                              color: currentStock >= (totalLeafKg * 0.1)
                                  ? KalroColors.primaryGreen
                                  : KalroColors.rest,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Scenario Simulator & Key Dates Timeline
                Text(
                  '4. Lifecycle Milestone Timeline'.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: KalroColors.textDark,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Test how weather and leaf conditions shift key lifecycle dates.'.tr,
                  style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                ),
                const SizedBox(height: 8),
                PredictionScenarioBar(
                  selected: _scenario,
                  onSelected: (value) {
                    if (value != null) setState(() => _scenario = value);
                  },
                ),
                const SizedBox(height: 12),
                Builder(
                  builder: (context) {
                    final cycle = _planning.planCycle(
                      species: _species,
                      startDate: _effectiveStartDate,
                      conditions: _scenario.conditionsFor(_species),
                    );
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        PredictionOutcomeCard(cycle: cycle),
                        const SizedBox(height: 12),
                        LifecycleKeyDatesCard(
                          cycle: cycle,
                          footnote: cycle.shiftSummary == null
                              ? Translator.fill('Predicted from typical {species} schedule.', {'species': _species.label})
                              : 'Projected under environmental adjustment.',
                        ),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 20),

                // Seed Producer & Source
                Text(
                  '5. Seed Source & Production Unit'.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: KalroColors.textDark,
                  ),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String?>(
                  key: ValueKey('${_eggSourceName ?? ''}-${_producerList.length}'),
                  initialValue: _producerList.any((p) => p.name == _eggSourceName)
                      ? _eggSourceName
                      : null,
                  decoration: InputDecoration(
                    labelText: 'Certified Producer / Station'.tr,
                  ),
                  items: [
                    DropdownMenuItem<String?>(
                      value: null,
                      child: Text('KALRO Sericulture Station / Other'.tr),
                    ),
                    DropdownMenuItem<String?>(
                      value: 'KALRO Kibos Sericulture Station',
                      child: const Text('KALRO Kibos Sericulture Station (Kisumu)'),
                    ),
                    DropdownMenuItem<String?>(
                      value: 'KALRO Alupe Sericulture Center',
                      child: const Text('KALRO Alupe Sericulture Center (Busia)'),
                    ),
                    DropdownMenuItem<String?>(
                      value: 'KALRO Naivasha Sericulture Unit',
                      child: const Text('KALRO Naivasha Sericulture Unit'),
                    ),
                    ..._producerList.map(
                      (p) => DropdownMenuItem<String?>(
                        value: p.name,
                        child: Text('${p.name} · ${p.type.label}'),
                      ),
                    ),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _eggSourceName = value;
                      if (value != null && value.isNotEmpty) {
                        _eggSourceController.text = value;
                      }
                    });
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _eggSourceController,
                  decoration: InputDecoration(
                    labelText: 'Seed Source Details (e.g. Grainage Lot #)'.tr,
                  ),
                ),
                const SizedBox(height: 16),

                // Rearing House & Operational Details
                Text(
                  '6. Rearing Unit & Management'.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: KalroColors.textDark,
                  ),
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: _locationController,
                  decoration: InputDecoration(
                    labelText: 'Rearing House / Room (e.g. Main House Unit 1)'.tr,
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _caretakerController,
                  decoration: InputDecoration(
                    labelText: 'Assigned Caretaker / Farmer'.tr,
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _strainController,
                  decoration: InputDecoration(
                    labelText: 'Breed Strain (e.g. ICIPE II, Japanese Bivoltine)'.tr,
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _feedController,
                  decoration: InputDecoration(
                    labelText: _species == Species.eri
                        ? 'Feed material (e.g. Castor / Kesseru)'
                        : 'Feed material (e.g. Mulberry)',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _rearingTypeController,
                  decoration: InputDecoration(
                    labelText: 'Rearing Type (e.g. Shelf rearing, Tray racks, Floor)'.tr,
                  ),
                ),
                const SizedBox(height: 28),

                // Save Primary Button
                KalroPrimaryButton(
                  label: _saving ? 'Saving batch...'.tr : 'Create Batch & Start Plan'.tr,
                  onPressed: _saving ? null : _save,
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SpeciesSelectCard extends StatelessWidget {
  const _SpeciesSelectCard({
    required this.species,
    required this.title,
    required this.subtitle,
    required this.tag,
    required this.host,
    required this.selected,
    required this.onTap,
  });

  final Species species;
  final String title;
  final String subtitle;
  final String tag;
  final String host;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final borderColor = selected ? KalroColors.headerGreen : Colors.grey.shade300;
    final bgColor = selected ? KalroColors.headerGreen.withValues(alpha: 0.08) : Colors.white;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor, width: selected ? 2 : 1),
          boxShadow: selected ? KalroColors.softShadow : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  species == Species.bombyx ? Icons.spa_outlined : Icons.eco_outlined,
                  color: selected ? KalroColors.headerGreen : KalroColors.textMuted,
                  size: 22,
                ),
                const Spacer(),
                if (selected)
                  const Icon(Icons.check_circle, color: KalroColors.headerGreen, size: 20),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w700,
                fontSize: 14,
                color: selected ? KalroColors.headerGreen : KalroColors.textDark,
              ),
            ),
            Text(
              subtitle,
              style: GoogleFonts.poppins(fontSize: 11, color: KalroColors.textMuted),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: selected
                    ? KalroColors.leaf.withValues(alpha: 0.2)
                    : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                tag,
                style: GoogleFonts.poppins(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: selected ? KalroColors.headerGreen : KalroColors.textDark,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ForecastItem extends StatelessWidget {
  const _ForecastItem({
    required this.label,
    required this.value,
    required this.sub,
    required this.color,
  });

  final String label;
  final String value;
  final String sub;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      margin: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: KalroColors.textMuted,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            sub,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.poppins(
              fontSize: 10,
              color: KalroColors.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}
