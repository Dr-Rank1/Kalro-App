import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../models/batch.dart';
import '../models/producer.dart';
import '../models/rearing_conditions.dart';
import '../models/species.dart';
import '../services/batch_repository.dart';
import '../services/lifecycle_planning_service.dart';
import '../services/producer_repository.dart';
import '../theme/kalro_colors.dart';
import 'package:kalro/l10n/translator.dart';

class CreateBatchScreen extends StatefulWidget {
  CreateBatchScreen({
    super.key,
    required this.repository,
    this.producers,
    this.copyFrom,
    this.initialSpecies,
    this.initialStartDate,
  });

  static const routeName = '/create-batch';

  final BatchRepository repository;
  final ProducerRepository? producers;
  final Batch? copyFrom;
  final Species? initialSpecies;
  final DateTime? initialStartDate;

  @override
  State<CreateBatchScreen> createState() => _CreateBatchScreenState();
}

class _CreateBatchScreenState extends State<CreateBatchScreen> {
  final _formKey = GlobalKey<FormState>();
  late Species _species;
  late DateTime _startDate;
  final _eggCountController = TextEditingController(text: '100');
  final _strainController = TextEditingController();
  final _locationController = TextEditingController();
  final _caretakerController = TextEditingController();
  final _feedController = TextEditingController();
  final _eggSourceController = TextEditingController();
  final _rearingTypeController = TextEditingController();
  String? _eggSourceName;
  List<Producer> _producerList = [];
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
      _strainController.text = copy.strain ?? '';
      _locationController.text = copy.location ?? '';
      _caretakerController.text = copy.caretaker ?? '';
      _feedController.text = copy.feedMaterial ?? '';
      _eggSourceController.text = copy.eggSource ?? '';
      _eggSourceName = copy.eggSource;
      _rearingTypeController.text = copy.rearingType ?? '';
    }
    widget.producers?.getAll().then((list) {
      if (mounted) setState(() => _producerList = list);
    });
  }

  @override
  void dispose() {
    _eggCountController.dispose();
    _strainController.dispose();
    _locationController.dispose();
    _caretakerController.dispose();
    _feedController.dispose();
    _eggSourceController.dispose();
    _rearingTypeController.dispose();
    super.dispose();
  }

  Future<void> _pickStartDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(Duration(days: 365)),
    );
    if (picked != null) setState(() => _startDate = picked);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);
    try {
      await widget.repository.create(
        species: _species,
        startDate: _startDate,
        eggCount: int.parse(_eggCountController.text.trim()),
        strain: _strainController.text,
        location: _locationController.text,
        caretaker: _caretakerController.text,
        feedMaterial: _feedController.text,
        eggSource: _eggSourceController.text,
        rearingType: _rearingTypeController.text,
      );
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
          widget.copyFrom == null ? 'New Batch'.tr : 'Start like this lot'.tr,
        ),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: _saving ? null : () => Navigator.of(context).pop(),
        ),
      ),
      body: Container(
        decoration: BoxDecoration(
          color: KalroColors.background,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: KalroBackground(
          child: Form(
            key: _formKey,
            child: ListView(
              padding: EdgeInsets.all(20),
              children: [
                KalroSpeciesDropdown(
                  value: _species,
                  enabled: !_saving,
                  onChanged: (value) {
                    if (value != null) setState(() => _species = value);
                  },
                ),
                SizedBox(height: 16),
                KalroDateRow(
                  label: 'Start date'.tr,
                  date: _startDate,
                  enabled: !_saving,
                  onTap: _pickStartDate,
                ),
                SizedBox(height: 16),
                Text(
                  'What if weather or leaf changes?'.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: KalroColors.textDark,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  _scenario.detail,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: KalroColors.textMuted,
                  ),
                ),
                SizedBox(height: 8),
                PredictionScenarioBar(
                  selected: _scenario,
                  onSelected: (value) {
                    if (value != null) setState(() => _scenario = value);
                  },
                ),
                SizedBox(height: 16),
                Builder(
                  builder: (context) {
                    final cycle = _planning.planCycle(
                      species: _species,
                      startDate: _startDate,
                      conditions: _scenario.conditionsFor(_species),
                    );
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        PredictionOutcomeCard(cycle: cycle),
                        SizedBox(height: 12),
                        LifecycleKeyDatesCard(
                          cycle: cycle,
                          footnote: cycle.shiftSummary == null
                              ? 'Predicted from typical ${_species.label} durations.'
                              : 'Compared with a typical house and enough leaf.',
                        ),
                      ],
                    );
                  },
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _eggCountController,
                  decoration: InputDecoration(
                    labelText: 'Number of eggs / larvae'.tr,
                  ),
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  validator: (value) {
                    final parsed = int.tryParse(value?.trim() ?? '');
                    if (parsed == null || parsed <= 0)
                      return 'Enter a valid count';
                    return null;
                  },
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _strainController,
                  decoration: InputDecoration(
                    labelText: 'Strain (optional)'.tr,
                  ),
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _feedController,
                  decoration: InputDecoration(
                    labelText: _species == Species.eri
                        ? 'Feed material (e.g. castor)'
                        : 'Feed material (e.g. mulberry)',
                  ),
                ),
                if (_producerList.isNotEmpty) ...[
                  SizedBox(height: 16),
                  DropdownButtonFormField<String?>(
                    key: ValueKey(
                      '${_eggSourceName ?? ''}-${_producerList.length}',
                    ),
                    initialValue:
                        _producerList.any((p) => p.name == _eggSourceName)
                        ? _eggSourceName
                        : null,
                    decoration: InputDecoration(
                      labelText: 'Egg source (seed producer / CRC)'.tr,
                    ),
                    items: [
                      DropdownMenuItem<String?>(
                        value: null,
                        child: Text('Other / type below'.tr),
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
                ],
                SizedBox(height: 16),
                TextFormField(
                  controller: _eggSourceController,
                  decoration: InputDecoration(
                    labelText: 'Egg source (optional, e.g. KALRO Seed Unit)'.tr,
                  ),
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _rearingTypeController,
                  decoration: InputDecoration(
                    labelText: _species == Species.eri
                        ? 'Rearing type (optional, e.g. open field / indoor)'
                        : 'Rearing type (optional, e.g. indoor rack)',
                  ),
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _locationController,
                  decoration: InputDecoration(
                    labelText: 'Rearing location (optional)'.tr,
                  ),
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _caretakerController,
                  decoration: InputDecoration(
                    labelText: 'Caretaker (optional)'.tr,
                  ),
                ),
                SizedBox(height: 24),
                KalroPrimaryButton(
                  label: _saving ? 'Saving...' : 'Save batch',
                  onPressed: _saving ? null : _save,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
