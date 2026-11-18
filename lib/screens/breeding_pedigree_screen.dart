import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../l10n/translator.dart';
import '../theme/kalro_colors.dart';

/// KALRO NSRC Silkworm Strain Pedigree & Crossing Matrix.
class BreedingPedigreeScreen extends StatefulWidget {
  const BreedingPedigreeScreen({super.key});

  static const routeName = '/breeding-pedigree';

  @override
  State<BreedingPedigreeScreen> createState() => _BreedingPedigreeScreenState();
}

class _BreedingPedigreeScreenState extends State<BreedingPedigreeScreen> {
  String _femaleParent = 'KSK';
  String _maleParent = 'KINSHOSHOWA';

  final List<Map<String, String>> _strains = [
    {
      'code': 'KSK',
      'name': 'KSK (Kenyan Station Strain)',
      'origin': 'KALRO NSRC Thika Pure Line',
      'voltinism': 'Bivoltine',
      'shellRatio': '20.5% – 22.0%',
      'notes': 'Locally stabilized pure breed with high thermal and humidity tolerance across Kenyan ecological zones.',
    },
    {
      'code': 'ATK',
      'name': 'ATK (Kenyan Research Line)',
      'origin': 'NSRC Thika Selection',
      'voltinism': 'Bivoltine',
      'shellRatio': '21.0% – 22.5%',
      'notes': 'Selected for disease resilience and strong cocoon shell compactness.',
    },
    {
      'code': 'ICIPE',
      'name': 'ICIPE Bivoltine Line',
      'origin': 'ICIPE / KALRO Collaborative Selection',
      'voltinism': 'Bivoltine',
      'shellRatio': '21.5% – 23.0%',
      'notes': 'High pupation rate and continuous filament length in East African highland conditions.',
    },
    {
      'code': 'KINSHOSHOWA',
      'name': 'Kinshoshowa Foundation Line',
      'origin': 'Japanese Germplasm Repository (NSRC Genebank)',
      'voltinism': 'Bivoltine',
      'shellRatio': '22.5% – 24.5%',
      'notes': 'Premier raw silk recovery, high neatness, and uniform filament size.',
    },
    {
      'code': 'CSR2_CSR4',
      'name': 'CSR2 × CSR4 Benchmark Hybrid',
      'origin': 'Commercial Double Hybrid Benchmark',
      'voltinism': 'Bivoltine Commercial Hybrid',
      'shellRatio': '23.0% – 25.0%',
      'notes': 'Benchmark commercial hybrid deployed across high-yielding farmers in Kiambu, Meru, and Nyeri.',
    },
    {
      'code': 'SAMIA_RICINI',
      'name': 'Samia ricini (Kenyan Eri Strain)',
      'origin': 'Hardy Non-Mulberry Species',
      'voltinism': 'Multivoltine Continuous Rearing',
      'shellRatio': 'Open-Ended Spun Floss',
      'notes': 'Reared on characterized castor varieties (NUU 70, KC series, KMC8). Cannot be reeled; carded and spun.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    // Cross simulation
    final isSameParent = _femaleParent == _maleParent;
    final isHybrid = !isSameParent;
    final expectedSR = isHybrid ? '22.8% – 24.2%' : '20.5% – 21.8%';
    final heterosisVigor = isHybrid ? '+18% Hybrid Vigor' : 'Pure Line Maintenance';

    return Scaffold(
      backgroundColor: KalroColors.background,
      appBar: AppBar(
        title: Text('Breeding & Strain Pedigree'.tr),
        backgroundColor: KalroColors.headerGreen,
        foregroundColor: Colors.white,
      ),
      body: KalroBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Cross Simulation Card
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
                      'Cross Breeding & Heterosis Predictor'.tr,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: KalroColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: _femaleParent,
                            decoration: InputDecoration(
                              labelText: 'Female Parent (♀)'.tr,
                              border: const OutlineInputBorder(),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                            ),
                            items: ['KSK', 'ATK', 'ICIPE', 'KINSHOSHOWA']
                                .map((s) => DropdownMenuItem(value: s, child: Text(s, style: GoogleFonts.poppins(fontSize: 12))))
                                .toList(),
                            onChanged: (val) => setState(() => _femaleParent = val!),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: _maleParent,
                            decoration: InputDecoration(
                              labelText: 'Male Parent (♂)'.tr,
                              border: const OutlineInputBorder(),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                            ),
                            items: ['KSK', 'ATK', 'ICIPE', 'KINSHOSHOWA']
                                .map((s) => DropdownMenuItem(value: s, child: Text(s, style: GoogleFonts.poppins(fontSize: 12))))
                                .toList(),
                            onChanged: (val) => setState(() => _maleParent = val!),
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Expected Shell Ratio (SR%):'.tr,
                          style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                        ),
                        Text(
                          expectedSR,
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: KalroColors.headerGreen,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Genetic Outcome:'.tr,
                          style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: isHybrid ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(
                              color: isHybrid ? const Color(0xFF14532D).withValues(alpha: 0.3) : const Color(0xFF92400E).withValues(alpha: 0.3),
                            ),
                          ),
                          child: Text(
                            heterosisVigor,
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: isHybrid ? const Color(0xFF14532D) : const Color(0xFF92400E),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Characterized Strains List
              Text(
                'NSRC Silkworm Pure Lines & Strains'.tr,
                style: GoogleFonts.poppins(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: KalroColors.textDark,
                ),
              ),
              const SizedBox(height: 8),
              ..._strains.map((strain) {
                return Semantics(
                  label: '${strain['name']}, ${strain['voltinism']}. Origin: ${strain['origin']}, Shell ratio: ${strain['shellRatio']}',
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: KalroColors.divider),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              strain['name']!,
                              style: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: KalroColors.textDark,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: KalroColors.headerGreen.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              strain['voltinism']!,
                              style: GoogleFonts.poppins(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: KalroColors.headerGreen,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Origin: ${strain['origin']} • Shell Ratio: ${strain['shellRatio']}',
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: KalroColors.textMuted,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        strain['notes']!,
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          color: KalroColors.textDark,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
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
