import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../models/rearing_conditions.dart';
import '../models/species.dart';
import '../services/batch_repository.dart';
import '../services/lifecycle_planning_service.dart';
import '../theme/kalro_colors.dart';

class CreateBatchScreen extends StatefulWidget {
  const CreateBatchScreen({
    super.key,
    required this.repository,
    this.initialSpecies,
    this.initialStartDate,
  });

  static const routeName = '/create-batch';

  final BatchRepository repository;
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
  bool _saving = false;
  static const _planning = LifecyclePlanningService();
  RearingScenario _scenario = RearingScenario.typical;

  @override
  void initState() {
    super.initState();
    _species = widget.initialSpecies ?? Species.bombyx;
    _startDate = widget.initialStartDate ?? DateTime.now();
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
      lastDate: DateTime.now().add(const Duration(days: 365)),
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
        SnackBar(content: Text('Could not save batch: $error')),
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
        title: const Text('New Batch'),
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
                KalroSpeciesDropdown(
                  value: _species,
                  enabled: !_saving,
                  onChanged: (value) {
                    if (value != null) setState(() => _species = value);
                  },
                ),
                const SizedBox(height: 16),
                KalroDateRow(
                  label: 'Start date',
                  date: _startDate,
                  enabled: !_saving,
                  onTap: _pickStartDate,
                ),
                const SizedBox(height: 16),
                Text(
                  'What if weather or leaf changes?',
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: KalroColors.textDark,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _scenario.detail,
                  style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                ),
                const SizedBox(height: 8),
                PredictionScenarioBar(
                  selected: _scenario,
                  onSelected: (value) {
                    if (value != null) setState(() => _scenario = value);
                  },
                ),
                const SizedBox(height: 16),
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
                        const SizedBox(height: 12),
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
                const SizedBox(height: 16),
                TextFormField(
                  controller: _eggCountController,
                  decoration: const InputDecoration(labelText: 'Number of eggs / larvae'),
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  validator: (value) {
                    final parsed = int.tryParse(value?.trim() ?? '');
                    if (parsed == null || parsed <= 0) return 'Enter a valid count';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _strainController,
                  decoration: const InputDecoration(labelText: 'Strain (optional)'),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _feedController,
                  decoration: InputDecoration(
                    labelText: _species == Species.eri
                        ? 'Feed material (e.g. castor)'
                        : 'Feed material (e.g. mulberry)',
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _eggSourceController,
                  decoration: const InputDecoration(
                    labelText: 'Egg source (optional, e.g. KALRO Seed Unit)',
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _rearingTypeController,
                  decoration: InputDecoration(
                    labelText: _species == Species.eri
                        ? 'Rearing type (optional, e.g. open field / indoor)'
                        : 'Rearing type (optional, e.g. indoor rack)',
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _locationController,
                  decoration: const InputDecoration(labelText: 'Rearing location (optional)'),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _caretakerController,
                  decoration: const InputDecoration(labelText: 'Caretaker (optional)'),
                ),
                const SizedBox(height: 24),
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
