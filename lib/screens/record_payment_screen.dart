import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../components/components.dart';
import '../models/payment_direction.dart';
import '../services/payment_repository.dart';
import '../theme/kalro_colors.dart';
import 'package:kalro/l10n/translator.dart';

class RecordPaymentScreen extends StatefulWidget {
  RecordPaymentScreen({super.key, required this.repository});

  final PaymentRepository repository;

  @override
  State<RecordPaymentScreen> createState() => _RecordPaymentScreenState();
}

class _RecordPaymentScreenState extends State<RecordPaymentScreen> {
  final _formKey = GlobalKey<FormState>();
  PaymentDirection _direction = PaymentDirection.receivable;
  DateTime _recordedAt = DateTime.now();
  final _counterpartyController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _amountController = TextEditingController();
  final _notesController = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _counterpartyController.dispose();
    _descriptionController.dispose();
    _amountController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _recordedAt,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(Duration(days: 365)),
    );
    if (picked != null) setState(() => _recordedAt = picked);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);
    try {
      await widget.repository.create(
        counterparty: _counterpartyController.text,
        description: _descriptionController.text,
        amount: double.parse(_amountController.text.trim()),
        direction: _direction,
        recordedAt: _recordedAt,
        notes: _notesController.text,
      );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not save payment: $error'.tr)),
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
        title: Text('Record Payment'.tr),
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
                DropdownButtonFormField<PaymentDirection>(
                  initialValue: _direction,
                  decoration: InputDecoration(labelText: 'Payment type'),
                  items: PaymentDirection.values
                      .map(
                        (direction) => DropdownMenuItem(
                          value: direction,
                          child: Text(direction.label),
                        ),
                      )
                      .toList(),
                  onChanged: _saving
                      ? null
                      : (value) {
                          if (value != null) setState(() => _direction = value);
                        },
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _counterpartyController,
                  decoration: InputDecoration(
                    labelText: 'Counterparty',
                    hintText: 'Buyer, supplier, or center name'.tr,
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Enter who this payment is with';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _descriptionController,
                  decoration: InputDecoration(
                    labelText: 'Description',
                    hintText: 'Cocoon sale, seed purchase, etc.'.tr,
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Enter a short description';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _amountController,
                  decoration: InputDecoration(
                    labelText: 'Amount (KSh)',
                    prefixText: 'KSh ',
                  ),
                  keyboardType: TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
                  ],
                  validator: (value) {
                    final parsed = double.tryParse(value?.trim() ?? '');
                    if (parsed == null || parsed <= 0) return 'Enter a valid amount';
                    return null;
                  },
                ),
                SizedBox(height: 16),
                KalroDateRow(
                  label: 'Date'.tr,
                  date: _recordedAt,
                  enabled: !_saving,
                  onTap: _pickDate,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _notesController,
                  decoration: InputDecoration(labelText: 'Notes (optional)'),
                  maxLines: 2,
                ),
                SizedBox(height: 24),
                KalroPrimaryButton(
                  label: _saving ? 'Saving...' : 'Save payment',
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
