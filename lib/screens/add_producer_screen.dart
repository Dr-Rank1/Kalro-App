import 'package:flutter/material.dart';

import '../components/components.dart';
import '../models/producer_type.dart';
import '../services/app_repositories.dart';
import '../theme/kalro_colors.dart';
import 'package:kalro/l10n/translator.dart';

class AddProducerScreen extends StatefulWidget {
  AddProducerScreen({super.key, required this.repositories});

  final AppRepositories repositories;

  @override
  State<AddProducerScreen> createState() => _AddProducerScreenState();
}

class _AddProducerScreenState extends State<AddProducerScreen> {
  final _formKey = GlobalKey<FormState>();
  ProducerType _type = ProducerType.seedProducer;
  final _nameController = TextEditingController();
  final _locationController = TextEditingController();
  final _phoneController = TextEditingController();
  final _speciesController = TextEditingController();
  final _notesController = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _locationController.dispose();
    _phoneController.dispose();
    _speciesController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);
    try {
      await widget.repositories.producers.create(
        name: _nameController.text,
        type: _type,
        location: _locationController.text,
        contactPhone: _phoneController.text,
        species: _speciesController.text,
        notes: _notesController.text,
      );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not save producer: $error'.tr)),
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
        title: Text('Add Producer'.tr),
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
                DropdownButtonFormField<ProducerType>(
                  initialValue: _type,
                  decoration: InputDecoration(labelText: 'Producer type'.tr),
                  items: ProducerType.values
                      .map(
                        (type) => DropdownMenuItem(
                          value: type,
                          child: Text(type.label),
                        ),
                      )
                      .toList(),
                  onChanged: _saving
                      ? null
                      : (value) {
                          if (value != null) setState(() => _type = value);
                        },
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _nameController,
                  decoration: InputDecoration(labelText: 'Name'.tr),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty)
                      return 'Enter a name';
                    return null;
                  },
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _locationController,
                  decoration: InputDecoration(
                    labelText: 'Location (optional)'.tr,
                  ),
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _phoneController,
                  decoration: InputDecoration(
                    labelText: 'Contact phone (optional)'.tr,
                  ),
                  keyboardType: TextInputType.phone,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _speciesController,
                  decoration: InputDecoration(
                    labelText: 'Species offered (optional)'.tr,
                    hintText: 'Bombyx mori, Eri'.tr,
                  ),
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _notesController,
                  decoration: InputDecoration(labelText: 'Notes (optional)'.tr),
                  maxLines: 2,
                ),
                SizedBox(height: 24),
                KalroPrimaryButton(
                  label: _saving ? 'Saving...' : 'Save producer',
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
