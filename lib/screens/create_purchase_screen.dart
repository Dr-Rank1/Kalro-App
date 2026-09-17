import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../components/components.dart';
import '../models/payment_direction.dart';
import '../models/producer.dart';
import '../models/species.dart';
import '../services/app_repositories.dart';
import '../theme/kalro_colors.dart';
import 'package:kalro/l10n/translator.dart';

class CreatePurchaseScreen extends StatefulWidget {
  CreatePurchaseScreen({
    super.key,
    required this.repositories,
    required this.producer,
  });

  final AppRepositories repositories;
  final Producer producer;

  @override
  State<CreatePurchaseScreen> createState() => _CreatePurchaseScreenState();
}

class _CreatePurchaseScreenState extends State<CreatePurchaseScreen> {
  final _formKey = GlobalKey<FormState>();
  Species? _species;
  DateTime _orderedAt = DateTime.now();
  final _itemController = TextEditingController();
  final _quantityController = TextEditingController(text: '1');
  final _unitController = TextEditingController(text: 'DFL');
  final _amountController = TextEditingController();
  final _notesController = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _itemController.dispose();
    _quantityController.dispose();
    _unitController.dispose();
    _amountController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _orderedAt,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(Duration(days: 365)),
    );
    if (picked != null) setState(() => _orderedAt = picked);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);
    try {
      final amountText = _amountController.text.trim();
      final amount = amountText.isEmpty ? null : double.parse(amountText);

      String? paymentRecordId;
      if (amount != null && amount > 0) {
        final payment = await widget.repositories.payments.create(
          counterparty: widget.producer.name,
          description: _itemController.text.trim(),
          amount: amount,
          direction: PaymentDirection.payable,
          recordedAt: _orderedAt,
          notes: 'Auto-created from purchase order',
        );
        paymentRecordId = payment.id;
      }

      await widget.repositories.purchaseOrders.create(
        producerId: widget.producer.id,
        producerName: widget.producer.name,
        itemDescription: _itemController.text,
        quantity: double.parse(_quantityController.text.trim()),
        unit: _unitController.text,
        orderedAt: _orderedAt,
        amount: amount,
        species: _species,
        notes: _notesController.text,
        paymentRecordId: paymentRecordId,
      );

      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not save purchase: $error'.tr)),
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
        title: Text('Purchase from ${widget.producer.name}'.tr),
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
                Text(
                  widget.producer.type.label,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: KalroColors.textMuted,
                  ),
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _itemController,
                  decoration: InputDecoration(
                    labelText: 'Item'.tr,
                    hintText: 'DFL, eggs, chawki batch'.tr,
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty)
                      return 'Enter what you purchased';
                    return null;
                  },
                ),
                SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: TextFormField(
                        controller: _quantityController,
                        decoration: InputDecoration(labelText: 'Quantity'.tr),
                        keyboardType: TextInputType.numberWithOptions(
                          decimal: true,
                        ),
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(
                            RegExp(r'^\d*\.?\d{0,2}'),
                          ),
                        ],
                        validator: (value) {
                          final parsed = double.tryParse(value?.trim() ?? '');
                          if (parsed == null || parsed <= 0)
                            return 'Enter quantity';
                          return null;
                        },
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _unitController,
                        decoration: InputDecoration(labelText: 'Unit'.tr),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty)
                            return 'Required';
                          return null;
                        },
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 16),
                KalroSpeciesDropdown(
                  value: _species ?? Species.bombyx,
                  enabled: !_saving,
                  onChanged: (value) {
                    if (value != null) setState(() => _species = value);
                  },
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _amountController,
                  decoration: InputDecoration(
                    labelText: 'Amount (KSh, optional)'.tr,
                    hintText: 'Creates a payable on Payments tab'.tr,
                    prefixText: 'KSh ',
                  ),
                  keyboardType: TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(
                      RegExp(r'^\d*\.?\d{0,2}'),
                    ),
                  ],
                ),
                SizedBox(height: 16),
                KalroDateRow(
                  label: 'Order date'.tr,
                  date: _orderedAt,
                  enabled: !_saving,
                  onTap: _pickDate,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _notesController,
                  decoration: InputDecoration(labelText: 'Notes (optional)'.tr),
                  maxLines: 2,
                ),
                SizedBox(height: 24),
                KalroPrimaryButton(
                  label: _saving ? 'Saving...' : 'Save purchase',
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
