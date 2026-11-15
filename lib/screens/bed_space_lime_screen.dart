import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../constants/sericulture_kenya.dart';
import '../l10n/translator.dart';
import '../theme/kalro_colors.dart';

/// Precision Bed Area Expansion & Slaked Lime Dosing Calculator.
class BedSpaceLimeScreen extends StatefulWidget {
  const BedSpaceLimeScreen({super.key});

  static const routeName = '/bed-space-lime';

  @override
  State<BedSpaceLimeScreen> createState() => _BedSpaceLimeScreenState();
}

class _BedSpaceLimeScreenState extends State<BedSpaceLimeScreen> {
  int _selectedInstar = 3; // 1 to 5
  int _caseCount = 2; // 1 case = 20,000 silkworms (2 cases = 40,000 standard NSRC unit)
  final double _trayWidthM = 1.0;
  final double _trayLengthM = 2.0;

  @override
  Widget build(BuildContext context) {
    // 2 cases is baseline in NSRC table
    final standard = KenyaBedStandards.for40kLarvae[_selectedInstar - 1];
    final scaleFactor = _caseCount / 2.0;

    final scaledMinArea = standard.bedAreaM2Min * scaleFactor;
    final scaledMaxArea = standard.bedAreaM2Max * scaleFactor;
    final trayArea = _trayWidthM * _trayLengthM;
    final minTraysNeeded = trayArea > 0 ? (scaledMinArea / trayArea).ceil() : 0;
    final maxTraysNeeded = trayArea > 0 ? (scaledMaxArea / trayArea).ceil() : 0;

    // Lime calculation: 50 g/m²
    final minLimeKg = (scaledMinArea * 50.0) / 1000.0;
    final maxLimeKg = (scaledMaxArea * 50.0) / 1000.0;

    return Scaffold(
      backgroundColor: KalroColors.background,
      appBar: AppBar(
        title: Text('Bed Space & Slaked Lime'.tr),
        backgroundColor: KalroColors.headerGreen,
        foregroundColor: Colors.white,
      ),
      body: KalroBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Rearing Scale Inputs Card
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
                    Text(
                      'Rearing Scale & Batch Size'.tr,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: KalroColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Egg Cases (${_caseCount * 20000} larvae):'.tr,
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: KalroColors.textMuted,
                          ),
                        ),
                        Text(
                          '$_caseCount Cases (${_caseCount * 20}k)'.tr,
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: KalroColors.headerGreen,
                          ),
                        ),
                      ],
                    ),
                    Slider(
                      value: _caseCount.toDouble(),
                      min: 1,
                      max: 10,
                      divisions: 9,
                      activeColor: KalroColors.headerGreen,
                      inactiveColor: KalroColors.divider,
                      onChanged: (val) => setState(() => _caseCount = val.round()),
                    ),
                    const Divider(height: 20),
                    Text(
                      'Select Silkworm Instar Stage:'.tr,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: KalroColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [1, 2, 3, 4, 5].map((instar) {
                        final isSel = instar == _selectedInstar;
                        return Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _selectedInstar = instar),
                            child: Container(
                              margin: const EdgeInsets.symmetric(horizontal: 3),
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: isSel ? KalroColors.headerGreen : Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: isSel ? KalroColors.headerGreen : KalroColors.divider,
                                ),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                '$instar${_getOrdinal(instar)}',
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: isSel ? Colors.white : KalroColors.textDark,
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // KPI Output Display
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
                    Text(
                      standard.stageName,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: KalroColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: _KpiBox(
                            title: 'Bed Area Needed'.tr,
                            value: '${scaledMinArea.toStringAsFixed(1)}–${scaledMaxArea.toStringAsFixed(1)} m²',
                            subtitle: '$minTraysNeeded–$maxTraysNeeded trays (1×2m)'.tr,
                            color: KalroColors.headerGreen,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _KpiBox(
                            title: 'Slaked Lime Dose'.tr,
                            value: '${minLimeKg.toStringAsFixed(2)}–${maxLimeKg.toStringAsFixed(2)} kg',
                            subtitle: '50 g/m² dusting'.tr,
                            color: KalroColors.accentBrown,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    _InfoRow(label: 'Forage Specification:'.tr, value: standard.feedForm),
                    const SizedBox(height: 6),
                    _InfoRow(label: 'Estimated Daily Feed:'.tr, value: standard.dailyFeedKg),
                    const SizedBox(height: 6),
                    _InfoRow(label: 'NSRC Operating Rule:'.tr, value: standard.instructions),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Moulting Protocol Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: KalroColors.leaf.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: KalroColors.leaf.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.shield_outlined, color: KalroColors.headerGreen, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Moulting & Slaked Lime Guide'.tr,
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: KalroColors.textDark,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      '• Worms enter moult: Stop feeding, heads swell, raise heads, immobile (lasts 18–24 hrs in instars 1–3, up to 48 hrs in 4th instar).\n'
                      '• Slaked Lime Action: Keep beds dry and uncovered. Dust dry agricultural lime (50 g/m²) across the bed to absorb fecal moisture and inhibit viral grasserie pathogens.\n'
                      '• Exiting moult: Worms shed skin, move actively, and exhibit broader mouth parts. Resume feeding only when 95%+ have emerged.'
                          .tr,
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        color: KalroColors.textDark,
                        height: 1.45,
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
  }

  String _getOrdinal(int n) {
    if (n == 1) return 'st';
    if (n == 2) return 'nd';
    if (n == 3) return 'rd';
    return 'th';
  }
}

class _KpiBox extends StatelessWidget {
  const _KpiBox({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.color,
  });

  final String title;
  final String value;
  final String subtitle;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: KalroColors.textMuted,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
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

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
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
        Text(
          value,
          style: GoogleFonts.poppins(
            fontSize: 12,
            color: KalroColors.textDark,
            height: 1.3,
          ),
        ),
      ],
    );
  }
}
