import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../models/batch.dart';
import '../models/producer.dart';
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
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
              children: [
                // 1. Variety Choice Cards
                Text(
                  '1. Silkworm Variety'.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: KalroColors.textDark,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: _VarietyCard(
                        species: Species.bombyx,
                        title: 'Bombyx mori',
                        subtitle: 'Mulberry Silkworm',
                        tag: 'White Reelable · 35d',
                        selected: _species == Species.bombyx,
                        onTap: () => _onSpeciesChanged(Species.bombyx),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _VarietyCard(
                        species: Species.eri,
                        title: 'Samia ricini',
                        subtitle: 'Eri Silkworm',
                        tag: 'Ahimsa / Spun · 34d',
                        selected: _species == Species.eri,
                        onTap: () => _onSpeciesChanged(Species.eri),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),

                // 2. Starting Stage (Hatched default)
                Text(
                  '2. Starting Stage'.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: KalroColors.textDark,
                  ),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    BatchStartingStage.hatchedInstar1,
                    BatchStartingStage.eggIncubation,
                    BatchStartingStage.chawkiInstar3,
                  ].map((stage) {
                    final isSel = _startingStage == stage;
                    return ChoiceChip(
                      label: Text(
                        stage == BatchStartingStage.hatchedInstar1
                            ? '1st Instar (Hatched) — Feed today'.tr
                            : stage == BatchStartingStage.eggIncubation
                            ? 'Egg Incubation'.tr
                            : '3rd Instar (Chawki)'.tr,
                        style: GoogleFonts.poppins(
                          fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                          fontSize: 12,
                        ),
                      ),
                      selected: isSel,
                      selectedColor: KalroColors.headerGreen.withValues(alpha: 0.15),
                      onSelected: (_) => setState(() => _startingStage = stage),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 18),

                // 3. Batch Size & Presets
                Text(
                  '3. Batch Size & Quantity'.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: KalroColors.textDark,
                  ),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [1, 2, 5, 10, 25].map((dfl) {
                    final isSel = dflCount == dfl;
                    return ActionChip(
                      label: Text('$dfl DFL (${dfl * 400})'),
                      backgroundColor: isSel
                          ? KalroColors.leaf.withValues(alpha: 0.2)
                          : Colors.white,
                      onPressed: () => _setPreset(dfl),
                    );
                  }).toList(),
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
                        validator: (v) {
                          final parsed = int.tryParse(v?.trim() ?? '');
                          if (parsed == null || parsed <= 0) {
                            return 'Enter valid count';
                          }
                          return null;
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // 4. Start Date & Tag
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: TextFormField(
                        controller: _batchTagController,
                        decoration: InputDecoration(
                          labelText: 'Batch Code / Tag'.tr,
                          suffixIcon: IconButton(
                            icon: const Icon(Icons.refresh, size: 20),
                            onPressed: () {
                              _batchTagController.text =
                                  _suggestBatchTag(_species, _startDate);
                            },
                          ),
                        ),
                        validator: (v) =>
                            v?.trim().isEmpty == true ? 'Enter batch tag' : null,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: KalroDateRow(
                        label: 'Start Date'.tr,
                        date: _startDate,
                        enabled: !_saving,
                        onTap: _pickStartDate,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),

                // 5. Clean Institutional Forecast Card
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: KalroColors.headerGreen.withValues(alpha: 0.25),
                    ),
                    boxShadow: KalroColors.softShadow,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Instant Rearing Forecast for this Batch'.tr,
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: KalroColors.headerGreen,
                          letterSpacing: 0.3,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: _ForecastCol(
                              label: 'Target Harvest'.tr,
                              val: '~${estimatedYieldKg.toStringAsFixed(1)} kg',
                              sub: 'Green cocoons',
                              color: KalroColors.harvest,
                            ),
                          ),
                          Expanded(
                            child: _ForecastCol(
                              label: 'Total Leaf Demand'.tr,
                              val: '~${totalLeafKg.round()} kg',
                              sub: _species == Species.bombyx
                                  ? 'Mulberry leaf'
                                  : 'Castor foliage',
                              color: KalroColors.leaf,
                            ),
                          ),
                          Expanded(
                            child: _ForecastCol(
                              label: 'Harvest Window'.tr,
                              val: '${_startDate.add(Duration(days: _species == Species.bombyx ? 35 : 34)).day}/${_startDate.add(Duration(days: _species == Species.bombyx ? 35 : 34)).month}',
                              sub: '${_species == Species.bombyx ? 35 : 34} days cycle',
                              color: KalroColors.headerGreen,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // 6. Optional Collapsible Details
                Theme(
                  data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                  child: ExpansionTile(
                    title: Text(
                      '+ Add Seed Source & Room Details (Optional)'.tr,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: KalroColors.textMuted,
                      ),
                    ),
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 8, bottom: 12),
                        child: Column(
                          children: [
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
                              onChanged: (val) {
                                setState(() {
                                  _eggSourceName = val;
                                  if (val != null) _eggSourceController.text = val;
                                });
                              },
                            ),
                            const SizedBox(height: 10),
                            TextFormField(
                              controller: _locationController,
                              decoration: InputDecoration(
                                labelText: 'Rearing Chamber / Bay'.tr,
                                hintText: 'e.g. House 1 - Bay A',
                              ),
                            ),
                            const SizedBox(height: 10),
                            TextFormField(
                              controller: _caretakerController,
                              decoration: InputDecoration(
                                labelText: 'Assigned Caretaker / Farmer'.tr,
                              ),
                            ),
                            const SizedBox(height: 10),
                            TextFormField(
                              controller: _strainController,
                              decoration: InputDecoration(
                                labelText: 'Breed Strain (e.g. CSR2xCSR4)'.tr,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // 7. Submit Action
                KalroPrimaryButton(
                  label: _saving
                      ? 'Registering batch...'.tr
                      : 'Register Batch & Start Rearing'.tr,
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
    required this.tag,
    required this.selected,
    required this.onTap,
  });

  final Species species;
  final String title;
  final String subtitle;
  final String tag;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isBom = species == Species.bombyx;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: selected
              ? KalroColors.headerGreen.withValues(alpha: 0.08)
              : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? KalroColors.headerGreen : Colors.grey.shade300,
            width: selected ? 2 : 1,
          ),
          boxShadow: selected ? KalroColors.softShadow : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isBom ? Icons.spa_outlined : Icons.eco_outlined,
                  color: selected ? KalroColors.headerGreen : KalroColors.textMuted,
                  size: 20,
                ),
                const Spacer(),
                if (selected)
                  const Icon(Icons.check_circle, color: KalroColors.headerGreen, size: 18),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              title,
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w700,
                fontSize: 13,
                color: selected ? KalroColors.headerGreen : KalroColors.textDark,
              ),
            ),
            Text(
              subtitle,
              style: GoogleFonts.poppins(fontSize: 10, color: KalroColors.textMuted),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(
                color: selected
                    ? KalroColors.leaf.withValues(alpha: 0.18)
                    : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                tag,
                style: GoogleFonts.poppins(
                  fontSize: 9,
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

class _ForecastCol extends StatelessWidget {
  const _ForecastCol({
    required this.label,
    required this.val,
    required this.sub,
    required this.color,
  });

  final String label;
  final String val;
  final String sub;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: KalroColors.textMuted,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          val,
          style: GoogleFonts.poppins(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
        Text(
          sub,
          style: GoogleFonts.poppins(fontSize: 9, color: KalroColors.textMuted),
        ),
      ],
    );
  }
}
