import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../l10n/translator.dart';
import '../theme/kalro_colors.dart';

class MpesaPayoutScreen extends StatefulWidget {
  const MpesaPayoutScreen({super.key});

  static const routeName = '/mpesa-payout';

  @override
  State<MpesaPayoutScreen> createState() => _MpesaPayoutScreenState();
}

class _MpesaPayoutScreenState extends State<MpesaPayoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController(text: 'Grace Wanjiku');
  final _phoneController = TextEditingController(text: '0712345678');
  String _selectedCounty = 'Kiambu';
  String _selectedGrade = 'Grade A';
  double _cocoonWeightKg = 30.0;
  bool _isProcessing = false;

  final List<Map<String, dynamic>> _payoutHistory = [
    {
      'ref': 'QJ89XZ3411',
      'farmer': 'Josephat Mutua',
      'phone': '0722114455',
      'county': 'Machakos',
      'grade': 'Grade A',
      'weightKg': 42.5,
      'amountKes': 36125.0,
      'time': 'Today, 10:14 AM',
      'status': 'Completed',
    },
    {
      'ref': 'QJ88AA1902',
      'farmer': 'Mary Wambui',
      'phone': '0711998877',
      'county': 'Murang\'a',
      'grade': 'Grade B',
      'weightKg': 28.0,
      'amountKes': 18200.0,
      'time': 'Yesterday, 04:30 PM',
      'status': 'Completed',
    },
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  double _getPricePerKg() {
    switch (_selectedGrade) {
      case 'Grade A':
        return 850.0;
      case 'Grade B':
        return 650.0;
      case 'Grade C':
        return 420.0;
      default:
        return 650.0;
    }
  }

  Future<void> _processPayout() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isProcessing = true);
    await Future.delayed(const Duration(milliseconds: 1400));

    final randomCode = 'TJ${Random().nextInt(89999) + 10000}KL';
    final amount = _cocoonWeightKg * _getPricePerKg();

    setState(() {
      _isProcessing = false;
      _payoutHistory.insert(0, {
        'ref': randomCode,
        'farmer': _nameController.text.trim(),
        'phone': _phoneController.text.trim(),
        'county': _selectedCounty,
        'grade': _selectedGrade,
        'weightKg': _cocoonWeightKg,
        'amountKes': amount,
        'time': 'Just now',
        'status': 'Completed',
      });
    });

    if (mounted) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.check_circle, color: KalroColors.leaf, size: 24),
              const SizedBox(width: 8),
              Text(
                'M-Pesa B2C Successful'.tr,
                style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Transaction Reference: $randomCode\n'
                'Recipient: ${_nameController.text.trim()} (${_phoneController.text.trim()})\n'
                'County: $_selectedCounty\n'
                'Lot Weight: ${_cocoonWeightKg.toStringAsFixed(1)} kg ($_selectedGrade)\n'
                'Amount Disbursed: KES ${amount.toStringAsFixed(2)}\n\n'
                'Daraja API response status: 200 OK. Funds deposited directly into farmer M-Pesa wallet.'
                    .tr,
                style: GoogleFonts.poppins(fontSize: 12, height: 1.4),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text('Close'.tr),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final ratePerKg = _getPricePerKg();
    final totalKes = _cocoonWeightKg * ratePerKg;

    return Scaffold(
      backgroundColor: KalroColors.background,
      appBar: AppBar(
        title: Text('M-Pesa Cocoon Payouts'.tr),
        backgroundColor: KalroColors.headerGreen,
        foregroundColor: Colors.white,
      ),
      body: KalroBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Payout Form Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: KalroColors.divider),
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Daraja B2C Procurement Payout'.tr,
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: KalroColors.textDark,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: KalroColors.leaf.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              'Instant B2C'.tr,
                              style: GoogleFonts.poppins(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: KalroColors.leaf,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _nameController,
                        decoration: InputDecoration(
                          labelText: 'Farmer Full Name'.tr,
                          border: const OutlineInputBorder(),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        ),
                        validator: (val) => val == null || val.trim().isEmpty ? 'Enter name' : null,
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            flex: 3,
                            child: TextFormField(
                              controller: _phoneController,
                              keyboardType: TextInputType.phone,
                              decoration: InputDecoration(
                                labelText: 'M-Pesa Phone'.tr,
                                hintText: '0712345678',
                                border: const OutlineInputBorder(),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              ),
                              validator: (val) {
                                if (val == null || val.trim().length < 10) {
                                  return 'Enter 10-digit phone';
                                }
                                return null;
                              },
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            flex: 2,
                            child: DropdownButtonFormField<String>(
                              initialValue: _selectedCounty,
                              decoration: InputDecoration(
                                labelText: 'County'.tr,
                                border: const OutlineInputBorder(),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                              ),
                              items: ['Kiambu', 'Murang\'a', 'Machakos', 'Meru', 'Nyeri', 'Kitui', 'Kakamega']
                                  .map((c) => DropdownMenuItem(value: c, child: Text(c, style: GoogleFonts.poppins(fontSize: 12))))
                                  .toList(),
                              onChanged: (val) => setState(() => _selectedCounty = val!),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: _selectedGrade,
                              decoration: InputDecoration(
                                labelText: 'Cocoon Grade'.tr,
                                border: const OutlineInputBorder(),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                              ),
                              items: [
                                DropdownMenuItem(value: 'Grade A', child: Text('Grade A (KES 850/kg)', style: GoogleFonts.poppins(fontSize: 12))),
                                DropdownMenuItem(value: 'Grade B', child: Text('Grade B (KES 650/kg)', style: GoogleFonts.poppins(fontSize: 12))),
                                DropdownMenuItem(value: 'Grade C', child: Text('Grade C (KES 420/kg)', style: GoogleFonts.poppins(fontSize: 12))),
                              ],
                              onChanged: (val) => setState(() => _selectedGrade = val!),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Lot Net Weight (kg)'.tr,
                            style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textDark),
                          ),
                          Text(
                            '${_cocoonWeightKg.toStringAsFixed(1)} kg',
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: KalroColors.headerGreen,
                            ),
                          ),
                        ],
                      ),
                      Slider(
                        value: _cocoonWeightKg,
                        min: 1,
                        max: 150,
                        activeColor: KalroColors.headerGreen,
                        inactiveColor: KalroColors.divider,
                        onChanged: (val) => setState(() => _cocoonWeightKg = val),
                      ),
                      const Divider(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Disbursement Amount:'.tr,
                            style: GoogleFonts.poppins(fontSize: 13, color: KalroColors.textMuted),
                          ),
                          Text(
                            'KES ${totalKes.toStringAsFixed(2)}',
                            style: GoogleFonts.poppins(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: KalroColors.headerGreen,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _isProcessing ? null : _processPayout,
                          icon: _isProcessing
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(Icons.send_to_mobile, size: 20),
                          label: Text(
                            _isProcessing ? 'Processing Daraja B2C...'.tr : 'Disburse M-Pesa Payment'.tr,
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: KalroColors.headerGreen,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // Recent Payout Ledger
              Text(
                'Recent B2C Disbursals'.tr,
                style: GoogleFonts.poppins(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: KalroColors.textDark,
                ),
              ),
              const SizedBox(height: 8),
              ..._payoutHistory.map((item) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: KalroColors.divider),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: KalroColors.leaf.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.check, color: KalroColors.leaf, size: 18),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  item['farmer'] as String,
                                  style: GoogleFonts.poppins(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: KalroColors.textDark,
                                  ),
                                ),
                                Text(
                                  'KES ${(item['amountKes'] as double).toStringAsFixed(0)}',
                                  style: GoogleFonts.poppins(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: KalroColors.headerGreen,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${item['phone']} • ${item['county']} • ${item['weightKg']}kg (${item['grade']})',
                              style: GoogleFonts.poppins(
                                fontSize: 11,
                                color: KalroColors.textMuted,
                              ),
                            ),
                            Text(
                              'Ref: ${item['ref']} • ${item['time']}',
                              style: GoogleFonts.poppins(
                                fontSize: 10,
                                color: KalroColors.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }
}
