import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../constants/sericulture_kenya.dart';
import '../l10n/translator.dart';
import '../theme/kalro_colors.dart';

/// Cocoon Quality Grading, Defect Sorting & Shell Ratio (SR%) Pricing Engine.
class CocoonGradingScreen extends StatefulWidget {
  const CocoonGradingScreen({super.key});

  static const routeName = '/cocoon-grading';

  @override
  State<CocoonGradingScreen> createState() => _CocoonGradingScreenState();
}

class _CocoonGradingScreenState extends State<CocoonGradingScreen> {
  final Map<String, int> _defectCounts = {
    'thin': 0,
    'framed': 0,
    'irregular': 0,
    'melted': 0,
    'double': 0,
    'stained': 0,
    'pierced': 0,
  };

  final int _sampleTotalSize = 100; // standard 100-cocoon sample
  double _grossSampleWeightG = 195.0; // 100 cocoons weight in grams
  double _shellSampleWeightG = 42.9; // 100 cocoon shells weight in grams
  double _lotNetWeightKg = 25.0; // farmer delivered lot weight

  void _increment(String id) {
    setState(() {
      _defectCounts[id] = (_defectCounts[id] ?? 0) + 1;
    });
  }

  void _decrement(String id) {
    setState(() {
      final current = _defectCounts[id] ?? 0;
      if (current > 0) {
        _defectCounts[id] = current - 1;
      }
    });
  }

  void _resetDefects() {
    setState(() {
      for (final key in _defectCounts.keys) {
        _defectCounts[key] = 0;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final totalDefects = _defectCounts.values.fold<int>(0, (sum, val) => sum + val);
    final defectPercentage = _sampleTotalSize > 0
        ? (totalDefects / _sampleTotalSize) * 100
        : 0.0;

    // Shell Ratio % = (Shell Weight / Gross Weight) * 100
    final shellRatioPercent = _grossSampleWeightG > 0
        ? (_shellSampleWeightG / _grossSampleWeightG) * 100
        : 0.0;

    // Renditta estimate = kg of cocoons needed for 1kg raw silk
    final renditta = shellRatioPercent > 0
        ? (100 / (shellRatioPercent * 0.92))
        : 0.0;

    // Grade Determination
    String grade;
    Color gradeColor;
    double basePriceKesPerKg;

    if (shellRatioPercent >= 21.0 && defectPercentage <= 6.0) {
      grade = 'Grade A (Premier Reelable)';
      gradeColor = const Color(0xFF14532D);
      basePriceKesPerKg = 850.0;
    } else if (shellRatioPercent >= 17.0 && defectPercentage <= 14.0) {
      grade = 'Grade B (Standard Commercial)';
      gradeColor = const Color(0xFF92400E);
      basePriceKesPerKg = 650.0;
    } else {
      grade = 'Grade C (Floss / Rejection)';
      gradeColor = const Color(0xFF991B1B);
      basePriceKesPerKg = 420.0;
    }

    final defectDeductionFactor = (1.0 - (defectPercentage / 100)).clamp(0.5, 1.0);
    final effectivePricePerKg = basePriceKesPerKg * defectDeductionFactor;
    final totalLotPayoutKes = _lotNetWeightKg * effectivePricePerKg;

    return Scaffold(
      backgroundColor: KalroColors.background,
      appBar: AppBar(
        title: Text('Cocoon Quality & Grading'.tr),
        backgroundColor: KalroColors.headerGreen,
        foregroundColor: Colors.white,
      ),
      body: KalroBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Summary KPI Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: KalroColors.divider),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Batch Quality Result'.tr,
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: KalroColors.textDark,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: gradeColor.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: gradeColor.withValues(alpha: 0.4)),
                          ),
                          child: Text(
                            grade,
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: gradeColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _KpiColumn(
                            title: 'Shell Ratio (SR%)'.tr,
                            value: '${shellRatioPercent.toStringAsFixed(1)}%',
                            subtitle: 'Min 20% target'.tr,
                            valueColor: shellRatioPercent >= 20.0
                                ? const Color(0xFF14532D)
                                : const Color(0xFF92400E),
                          ),
                        ),
                        Container(width: 1, height: 44, color: KalroColors.divider),
                        Expanded(
                          child: _KpiColumn(
                            title: 'Est. Renditta'.tr,
                            value: '${renditta.toStringAsFixed(1)}:1',
                            subtitle: 'Cocoon:Raw silk'.tr,
                            valueColor: KalroColors.headerGreen,
                          ),
                        ),
                        Container(width: 1, height: 44, color: KalroColors.divider),
                        Expanded(
                          child: _KpiColumn(
                            title: 'Payout Rate'.tr,
                            value: 'KES ${effectivePricePerKg.toStringAsFixed(0)}',
                            subtitle: 'Per kg fresh'.tr,
                            valueColor: KalroColors.accentBrown,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          Translator.fill('Estimated Total Payout ({kg} kg):', {'kg': _lotNetWeightKg.toStringAsFixed(1)}),
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: KalroColors.textMuted,
                          ),
                        ),
                        Text(
                          'KES ${totalLotPayoutKes.toStringAsFixed(2)}',
                          style: GoogleFonts.poppins(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: KalroColors.headerGreen,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Shell Ratio Tester Inputs
              Text(
                'Shell Ratio Testing (100 Cocoon Sample)'.tr,
                style: GoogleFonts.poppins(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: KalroColors.textDark,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: KalroColors.divider),
                ),
                child: Column(
                  children: [
                    _SliderInput(
                      label: 'Gross Cocoon Sample Weight (g)'.tr,
                      value: _grossSampleWeightG,
                      min: 100,
                      max: 300,
                      unit: 'g',
                      onChanged: (val) => setState(() => _grossSampleWeightG = val),
                    ),
                    const SizedBox(height: 12),
                    _SliderInput(
                      label: 'Extracted Clean Shell Weight (g)'.tr,
                      value: _shellSampleWeightG,
                      min: 15,
                      max: 75,
                      unit: 'g',
                      onChanged: (val) => setState(() => _shellSampleWeightG = val),
                    ),
                    const SizedBox(height: 12),
                    _SliderInput(
                      label: 'Farmer Lot Net Weight (kg)'.tr,
                      value: _lotNetWeightKg,
                      min: 1,
                      max: 200,
                      unit: 'kg',
                      onChanged: (val) => setState(() => _lotNetWeightKg = val),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Defect Counter Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'NSRC Defect Sorting'.tr,
                        style: GoogleFonts.poppins(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: KalroColors.textDark,
                        ),
                      ),
                      Text(
                        'Count defects in standard 100-cocoon sample'.tr,
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: KalroColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                  Semantics(
                    button: true,
                    label: 'Reset all defect counts to zero'.tr,
                    child: TextButton.icon(
                      onPressed: _resetDefects,
                      icon: const Icon(Icons.refresh, size: 16),
                      label: Text('Reset'.tr),
                      style: TextButton.styleFrom(
                        foregroundColor: KalroColors.textMuted,
                        minimumSize: const Size(0, 48),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // 7 Defect Classes from NSRC Manual Chapter 3.1
              ...KenyaCocoonDefects.list.map((defect) {
                final count = _defectCounts[defect.id] ?? 0;
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
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              defect.name,
                              style: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: KalroColors.textDark,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              defect.cause,
                              style: GoogleFonts.poppins(
                                fontSize: 11,
                                color: KalroColors.textMuted,
                                height: 1.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Row(
                        children: [
                          Semantics(
                            button: true,
                            label: 'Decrease count for ${defect.name}',
                            child: IconButton(
                              onPressed: () => _decrement(defect.id),
                              icon: const Icon(Icons.remove_circle_outline, size: 24),
                              color: KalroColors.textMuted,
                              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                              padding: const EdgeInsets.all(12),
                            ),
                          ),
                          Container(
                            constraints: const BoxConstraints(minWidth: 32),
                            alignment: Alignment.center,
                            child: Text(
                              '$count',
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: count > 0
                                    ? const Color(0xFF991B1B)
                                    : KalroColors.textDark,
                              ),
                            ),
                          ),
                          Semantics(
                            button: true,
                            label: 'Increase count for ${defect.name}',
                            child: IconButton(
                              onPressed: () => _increment(defect.id),
                              icon: const Icon(Icons.add_circle_outline, size: 24),
                              color: KalroColors.headerGreen,
                              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                              padding: const EdgeInsets.all(12),
                            ),
                          ),
                        ],
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

class _KpiColumn extends StatelessWidget {
  const _KpiColumn({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.valueColor,
  });

  final String title;
  final String value;
  final String subtitle;
  final Color valueColor;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: GoogleFonts.poppins(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: KalroColors.textMuted,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: GoogleFonts.poppins(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: valueColor,
          ),
        ),
        Text(
          subtitle,
          style: GoogleFonts.poppins(
            fontSize: 10,
            color: KalroColors.textMuted,
          ),
        ),
      ],
    );
  }
}

class _SliderInput extends StatelessWidget {
  const _SliderInput({
    required this.label,
    required this.value,
    required this.min,
    required this.max,
    required this.unit,
    required this.onChanged,
  });

  final String label;
  final double value;
  final double min;
  final double max;
  final String unit;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: KalroColors.textDark,
              ),
            ),
            Text(
              '${value.toStringAsFixed(1)} $unit',
              style: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: KalroColors.headerGreen,
              ),
            ),
          ],
        ),
        Slider(
          value: value.clamp(min, max),
          min: min,
          max: max,
          activeColor: KalroColors.headerGreen,
          inactiveColor: KalroColors.divider,
          onChanged: onChanged,
        ),
      ],
    );
  }
}
