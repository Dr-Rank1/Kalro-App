import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../l10n/translator.dart';
import '../theme/kalro_colors.dart';

/// Sericulture Disease Diagnostic Triage & Disinfection Dilution Calculator.
class DiseaseTriageScreen extends StatefulWidget {
  const DiseaseTriageScreen({super.key});

  static const routeName = '/disease-triage';

  @override
  State<DiseaseTriageScreen> createState() => _DiseaseTriageScreenState();
}

class _DiseaseTriageScreenState extends State<DiseaseTriageScreen> {
  int _tabIndex = 0; // 0: Diseases, 1: Pests, 2: Disinfectant Calculator
  double _waterVolumeLiters = 20.0; // 20L knapsack sprayer

  @override
  Widget build(BuildContext context) {
    // 2% Formalin: (2 / 36) * Volume = ~0.055 * V
    final formalinLiters = (_waterVolumeLiters * 0.055).clamp(0.1, 10.0);
    // 5% Bleaching powder: 50g per liter = 0.05 * 1000g * V
    final bleachingPowderKg = (_waterVolumeLiters * 50.0) / 1000.0;

    return Scaffold(
      backgroundColor: KalroColors.background,
      appBar: AppBar(
        title: Text('Disease & Pest Triage'.tr),
        backgroundColor: KalroColors.headerGreen,
        foregroundColor: Colors.white,
      ),
      body: KalroBackground(
        child: SafeArea(
          child: Column(
            children: [
              // Navigation Tabs
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    _TabItem(
                      label: 'Table 4 Diseases'.tr,
                      selected: _tabIndex == 0,
                      onTap: () => setState(() => _tabIndex = 0),
                    ),
                    const SizedBox(width: 6),
                    _TabItem(
                      label: 'Pests & Traps'.tr,
                      selected: _tabIndex == 1,
                      onTap: () => setState(() => _tabIndex = 1),
                    ),
                    const SizedBox(width: 6),
                    _TabItem(
                      label: 'Disinfection'.tr,
                      selected: _tabIndex == 2,
                      onTap: () => setState(() => _tabIndex = 2),
                    ),
                  ],
                ),
              ),

              // Content Area
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    if (_tabIndex == 0) ..._buildDiseasesList(),
                    if (_tabIndex == 1) ..._buildPestsList(),
                    if (_tabIndex == 2) ..._buildDisinfectantCalc(formalinLiters, bleachingPowderKg),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildDiseasesList() {
    final diseases = [
      {
        'name': 'Grasserie (Nuclear Polyhedrosis Virus)',
        'symptoms': 'Oily/shiny skin in young worms. Thin skin, milky white body with swollen intersegments in later stage. Larvae are restless and fall off the bed due to loss of grasping power.',
        'control': 'Thorough disinfection of rearing house and equipment. Maintain hygiene and sufficient ventilation. Discard infected worms by burning and burying. Keep beds dry. Avoid tender leaves for late-stage worms.',
        'tag': 'Viral',
        'color': KalroColors.danger,
      },
      {
        'name': 'Pebrine (Microsporidiosis)',
        'symptoms': 'Poor appetite, irregular moulting, death before 3rd stage. Wrinkled skin with rustic brown color and sometimes pepper-like spots on larval skin.',
        'control': 'Thorough disinfection of rearing house and strict hygienic conditions during rearing. Quarantine notifiable disease transmitted transovarially.',
        'tag': 'Microsporidian',
        'color': KalroColors.accentBrown,
      },
      {
        'name': 'Flacherie (Infectious Flacherie / Dysentery)',
        'symptoms': 'Highly contagious. Loss of appetite, transparent thorax, shrinkage of body, retarded growth and empty foregut. Empty midgut with little mulberry but full of yellowish brownish fluids.',
        'control': 'Thorough disinfection of rearing house and appliances. Recommended climatic conditions for rearing. Complete disposal of diseased larvae together with faeces through burning or burying.',
        'tag': 'Bacterial / Viral',
        'color': KalroColors.warning,
      },
      {
        'name': 'Muscardine (White Calcino Fungal Disease)',
        'symptoms': 'Moist specks on skin, worm loses appetite and is inactive, limp body and loose skin. Diarrhea, vomiting and eventually death. 6-8 hours after death, becomes stiff and hard.',
        'control': 'Thorough disinfection of rearing house and appliances. Avoid low temperatures and humidity. Keep bed clean and dry. Discard diseased worms through burning or putting in formalin solution.',
        'tag': 'Fungal',
        'color': KalroColors.leaf,
      },
    ];

    return diseases.map((d) {
      final color = d['color'] as Color;
      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
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
                Expanded(
                  child: Text(
                    d['name'] as String,
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
                    color: color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    d['tag'] as String,
                    style: GoogleFonts.poppins(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: color,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Symptoms:'.tr,
              style: GoogleFonts.poppins(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: KalroColors.textMuted,
              ),
            ),
            Text(
              d['symptoms'] as String,
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: KalroColors.textDark,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Control Protocol:'.tr,
              style: GoogleFonts.poppins(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: KalroColors.textMuted,
              ),
            ),
            Text(
              d['control'] as String,
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: KalroColors.headerGreen,
                height: 1.35,
              ),
            ),
          ],
        ),
      );
    }).toList();
  }

  List<Widget> _buildPestsList() {
    final pests = [
      {
        'name': 'Ants (NSRC 2.15)',
        'impact': 'Voracious predators that destroy newly hatched chawki and moulting silkworms within hours.',
        'barrier': 'Construct shallow cemented water trenches around the rearing house perimeter. Place all rearing stand legs in ant-wells filled with water and spent engine oil. Clear cobwebs regularly.',
      },
      {
        'name': 'Rats & Rodents',
        'impact': 'Chew larvae, eat pupae from cocoons during mounting and green cocoon storage.',
        'barrier': 'Fit metallic kick-plates on wooden doors. Install 20-mesh wire screens on all windows and ventilators. Store harvested cocoons off the ground in suspended aerated sacks.',
      },
      {
        'name': 'Uzi Fly Parasitoid',
        'impact': 'Oviposits eggs on late-stage worms. Maggot pierces the finished cocoon, rendering it completely unreelable.',
        'barrier': 'Enclose rearing house with fly-proof nylon mesh. Deploy benzoic acid traps and yellow sticky boards near doors.',
      },
    ];

    return pests.map((p) {
      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: KalroColors.divider),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              p['name']!,
              style: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: KalroColors.textDark,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Crop Danger:'.tr,
              style: GoogleFonts.poppins(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: KalroColors.danger,
              ),
            ),
            Text(
              p['impact']!,
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: KalroColors.textDark,
                height: 1.3,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Physical Exclusion Barrier:'.tr,
              style: GoogleFonts.poppins(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: KalroColors.headerGreen,
              ),
            ),
            Text(
              p['barrier']!,
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: KalroColors.textDark,
                height: 1.3,
              ),
            ),
          ],
        ),
      );
    }).toList();
  }

  List<Widget> _buildDisinfectantCalc(double formalinLiters, double bleachingPowderKg) {
    return [
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
              'Chemical Disinfection Knapsack Mixer'.tr,
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: KalroColors.textDark,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Sprayer Tank Capacity:'.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: KalroColors.textMuted,
                  ),
                ),
                Text(
                  '${_waterVolumeLiters.toStringAsFixed(0)} Litres',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: KalroColors.headerGreen,
                  ),
                ),
              ],
            ),
            Slider(
              value: _waterVolumeLiters,
              min: 5,
              max: 100,
              divisions: 19,
              activeColor: KalroColors.headerGreen,
              inactiveColor: KalroColors.divider,
              onChanged: (val) => setState(() => _waterVolumeLiters = val),
            ),
            const Divider(height: 20),
            Text(
              'Required Chemical Quantities:'.tr,
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: KalroColors.textDark,
              ),
            ),
            const SizedBox(height: 12),
            _RecipeCard(
              title: '2% Formalin Solution (Rearing Chamber Spray)'.tr,
              quantity: '${formalinLiters.toStringAsFixed(2)} L',
              instructions:
                  'Add ${formalinLiters.toStringAsFixed(2)}L of 36% commercial formalin to ${_waterVolumeLiters.toStringAsFixed(0)}L water. Spray walls, ceiling, and trays; seal room for 24 hours.'
                      .tr,
            ),
            const SizedBox(height: 10),
            _RecipeCard(
              title: '5% Bleaching Powder Solution (Floors & Footbath)'.tr,
              quantity: '${bleachingPowderKg.toStringAsFixed(2)} kg',
              instructions:
                  'Dissolve ${bleachingPowderKg.toStringAsFixed(2)} kg of fresh bleaching powder in ${_waterVolumeLiters.toStringAsFixed(0)}L water. Decant clear chlorinated supernatant for footbath and floor wash.'
                      .tr,
            ),
          ],
        ),
      ),
    ];
  }
}

class _TabItem extends StatelessWidget {
  const _TabItem({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: selected ? KalroColors.headerGreen : KalroColors.background,
            borderRadius: BorderRadius.circular(6),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: selected ? Colors.white : KalroColors.textDark,
            ),
          ),
        ),
      ),
    );
  }
}

class _RecipeCard extends StatelessWidget {
  const _RecipeCard({
    required this.title,
    required this.quantity,
    required this.instructions,
  });

  final String title;
  final String quantity;
  final String instructions;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: KalroColors.background,
        borderRadius: BorderRadius.circular(8),
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
                  title,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: KalroColors.textDark,
                  ),
                ),
              ),
              Text(
                quantity,
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: KalroColors.leaf,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            instructions,
            style: GoogleFonts.poppins(
              fontSize: 11,
              color: KalroColors.textMuted,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }
}
