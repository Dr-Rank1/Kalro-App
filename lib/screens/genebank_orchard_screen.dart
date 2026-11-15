import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../constants/sericulture_kenya.dart';
import '../l10n/translator.dart';
import '../theme/kalro_colors.dart';

/// Interactive Genebank & Orchard Plot Digital Twin for KALRO Sericulture.
class GenebankOrchardScreen extends StatefulWidget {
  const GenebankOrchardScreen({super.key});

  static const routeName = '/genebank-orchard';

  @override
  State<GenebankOrchardScreen> createState() => _GenebankOrchardScreenState();
}

class _GenebankOrchardScreenState extends State<GenebankOrchardScreen> {
  int _tabIndex = 0; // 0: Blocks, 1: Mulberry, 2: Castor, 3: Agronomy
  double _plotAcres = 1.0;
  bool _isPairedRow = false; // false: 1.5m x 1.5m, true: 0.9m x 0.9m
  int _daysToBrushing = 50;

  @override
  Widget build(BuildContext context) {
    final bushCount = _isPairedRow
        ? ((_plotAcres * 4046.86) / (0.9 * 0.9)).round()
        : ((_plotAcres * 4046.86) / (1.5 * 1.5)).round();
    final foliageCapacityKg = bushCount * 4.5; // ~4.5kg leaf per bush per year

    return Scaffold(
      backgroundColor: KalroColors.background,
      appBar: AppBar(
        title: Text('Genebank & Field Blocks'.tr),
        backgroundColor: KalroColors.headerGreen,
        foregroundColor: Colors.white,
      ),
      body: KalroBackground(
        child: SafeArea(
          child: Column(
            children: [
              // Sub-Tabs Header
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    _TabBtn(
                      label: 'Blocks'.tr,
                      selected: _tabIndex == 0,
                      onTap: () => setState(() => _tabIndex = 0),
                    ),
                    const SizedBox(width: 6),
                    _TabBtn(
                      label: 'Mulberry (11)'.tr,
                      selected: _tabIndex == 1,
                      onTap: () => setState(() => _tabIndex = 1),
                    ),
                    const SizedBox(width: 6),
                    _TabBtn(
                      label: 'Castor (7)'.tr,
                      selected: _tabIndex == 2,
                      onTap: () => setState(() => _tabIndex = 2),
                    ),
                    const SizedBox(width: 6),
                    _TabBtn(
                      label: 'Biomass'.tr,
                      selected: _tabIndex == 3,
                      onTap: () => setState(() => _tabIndex = 3),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: KalroColors.divider),

              // Content Body
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                  children: [
                    if (_tabIndex == 0) ..._buildBlocksList(),
                    if (_tabIndex == 1) ..._buildMulberryList(),
                    if (_tabIndex == 2) ..._buildCastorList(),
                    if (_tabIndex == 3) ..._buildBiomassCalculator(bushCount, foliageCapacityKg),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildBlocksList() {
    return [
      Text(
        'Station Genebanks & Field Research Blocks'.tr,
        style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: KalroColors.textDark),
      ),
      const SizedBox(height: 4),
      Text(
        'NSRC Thika core germplasm repositories, collections, and selection plots.'.tr,
        style: GoogleFonts.poppins(fontSize: 11, color: KalroColors.textMuted),
      ),
      const SizedBox(height: 12),
      ...KenyaStationGenebankBlocks.blocks.map(
        (blockName) => Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: KalroColors.divider),
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: KalroColors.headerGreen.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.forest_outlined, size: 18, color: KalroColors.headerGreen),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      blockName,
                      style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: KalroColors.textDark),
                    ),
                    Text(
                      blockName.contains('Genebank') ? 'Core Germplasm Stand' : 'Agronomic Trial Stand',
                      style: GoogleFonts.poppins(fontSize: 10, color: KalroColors.textMuted),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    ];
  }

  List<Widget> _buildMulberryList() {
    return [
      Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            '11 Characterized Varieties'.tr,
            style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: KalroColors.textDark),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: Colors.amber.shade50,
              border: Border.all(color: Colors.amber.shade300),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              '${KenyaMulberryCultivars.accessionsUnderEvaluationCount} Accessions in Evaluation',
              style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.amber.shade900),
            ),
          ),
        ],
      ),
      const SizedBox(height: 12),
      ...KenyaMulberryCultivars.characterized.map(
        (cultivar) => Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: KalroColors.divider),
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: KalroColors.leaf.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.eco_outlined, size: 18, color: KalroColors.leaf),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      cultivar,
                      style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: KalroColors.textDark),
                    ),
                    Text(
                      cultivar == 'V1'
                          ? 'Premier commercial variety · High moisture 75%'
                          : cultivar == 'S36' || cultivar == 'ICHINOSE'
                          ? 'Chawki young larvae & brushing variety'
                          : cultivar == 'THIKA' || cultivar == 'KANVA 2'
                          ? 'Benchmark general stand variety'
                          : 'Characterized station accession',
                      style: GoogleFonts.poppins(fontSize: 10, color: KalroColors.textMuted),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    ];
  }

  List<Widget> _buildCastorList() {
    return [
      Text(
        '7 Characterized Castor Cultivars (Eri Host)'.tr,
        style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: KalroColors.textDark),
      ),
      const SizedBox(height: 4),
      Text(
        'Host plant foliage for Samia ricini eri silkworms.'.tr,
        style: GoogleFonts.poppins(fontSize: 11, color: KalroColors.textMuted),
      ),
      const SizedBox(height: 12),
      ...KenyaCastorVarieties.characterized.map(
        (variety) => Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: KalroColors.divider),
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: KalroColors.harvest.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.grass_outlined, size: 18, color: KalroColors.harvest),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      variety,
                      style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: KalroColors.textDark),
                    ),
                    Text(
                      variety == 'NUU 70'
                          ? 'Premier drought-hardy Kenyan accession · 9,000 kg/ac/yr'
                          : variety == 'KMC8'
                          ? 'High biomass commercial line · 10,000 kg/ac/yr'
                          : 'Characterized selection series',
                      style: GoogleFonts.poppins(fontSize: 10, color: KalroColors.textMuted),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    ];
  }

  List<Widget> _buildBiomassCalculator(int bushCount, double foliageCapacityKg) {
    return [
      Text(
        'Orchard Biomass & Spacing Calculator'.tr,
        style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: KalroColors.textDark),
      ),
      const SizedBox(height: 12),
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: KalroColors.divider),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Plot Acreage: ${_plotAcres.toStringAsFixed(2)} acres', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600)),
            Slider(
              value: _plotAcres,
              min: 0.25,
              max: 10.0,
              divisions: 39,
              activeColor: KalroColors.primaryGreen,
              onChanged: (v) => setState(() => _plotAcres = v),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() => _isPairedRow = false),
                    style: OutlinedButton.styleFrom(
                      backgroundColor: !_isPairedRow ? KalroColors.headerGreen : Colors.white,
                      foregroundColor: !_isPairedRow ? Colors.white : KalroColors.textDark,
                      side: BorderSide(color: !_isPairedRow ? KalroColors.headerGreen : KalroColors.divider),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('1.5m × 1.5m (Standard)', style: TextStyle(fontSize: 10)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() => _isPairedRow = true),
                    style: OutlinedButton.styleFrom(
                      backgroundColor: _isPairedRow ? KalroColors.headerGreen : Colors.white,
                      foregroundColor: _isPairedRow ? Colors.white : KalroColors.textDark,
                      side: BorderSide(color: _isPairedRow ? KalroColors.headerGreen : KalroColors.divider),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('0.9m × 0.9m (Paired)', style: TextStyle(fontSize: 10)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: KalroColors.background,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  _MetricRow(label: 'Total Bushes:', value: '$bushCount bushes'),
                  const SizedBox(height: 6),
                  _MetricRow(label: 'Annual Leaf Yield:', value: '${foliageCapacityKg.toStringAsFixed(0)} kg / year'),
                  const SizedBox(height: 6),
                  _MetricRow(label: 'Rearing Capacity:', value: '${(foliageCapacityKg / 350).floor()} boxes / year'),
                ],
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 16),
      Text(
        'Bottom-Pruning Countdown Sync'.tr,
        style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: KalroColors.textDark),
      ),
      const SizedBox(height: 6),
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: KalroColors.divider),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Days until egg hatching: $_daysToBrushing days', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600)),
            Slider(
              value: _daysToBrushing.toDouble(),
              min: 15,
              max: 65,
              divisions: 50,
              activeColor: KalroColors.primaryGreen,
              onChanged: (v) => setState(() => _daysToBrushing = v.round()),
            ),
            Text(
              _daysToBrushing >= 45 && _daysToBrushing <= 60
                  ? '✓ Ideal Pruning Window: Bottom-cut bushes today so vigorous shoot generation aligns with peak 4th & 5th instars.'
                  : '⚠ Outside 45–60 day pruning window. Leaves will be either too fibrous or insufficient biomass.',
              style: GoogleFonts.poppins(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: _daysToBrushing >= 45 && _daysToBrushing <= 60 ? Colors.green.shade800 : Colors.amber.shade900,
              ),
            ),
          ],
        ),
      ),
    ];
  }
}

class _TabBtn extends StatelessWidget {
  const _TabBtn({required this.label, required this.selected, required this.onTap});

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
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? KalroColors.headerGreen : KalroColors.background,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: selected ? KalroColors.headerGreen : KalroColors.divider),
          ),
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

class _MetricRow extends StatelessWidget {
  const _MetricRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.poppins(fontSize: 11, color: KalroColors.textMuted)),
        Text(value, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w700, color: KalroColors.textDark)),
      ],
    );
  }
}
