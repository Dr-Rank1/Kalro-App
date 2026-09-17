import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../l10n/translator.dart';
import '../../models/profile_summary.dart';
import '../../theme/kalro_colors.dart';
import '../../utils/kalro_formatters.dart';

class SeasonRecordGrid extends StatelessWidget {
  const SeasonRecordGrid({super.key, required this.summary});

  final ProfileSummary summary;

  @override
  Widget build(BuildContext context) {
    final empty = summary.totalLots == 0;
    return Column(
      children: [
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.45,
          children: [
            _StatCard(
              icon: Icons.layers_outlined,
              label: 'Active lots'.tr,
              value: '${summary.activeBatchCount}',
            ),
            _StatCard(
              icon: Icons.inventory_2_outlined,
              label: 'Closed lots'.tr,
              value: '${summary.closedBatchCount}',
            ),
            _StatCard(
              icon: Icons.scale_outlined,
              label: 'Cocoon harvest'.tr,
              value: empty ? '—' : '${summary.harvestKg.toStringAsFixed(1)} kg',
            ),
            _StatCard(
              icon: Icons.favorite_outline,
              label: 'Avg survival'.tr,
              value: empty
                  ? '—'
                  : '${summary.averageSurvivalPercent.toStringAsFixed(0)}%',
            ),
          ],
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: KalroColors.divider),
          ),
          child: Row(
            children: [
              _Metric(
                label: 'Leaf stock'.tr,
                value: '${summary.leafStockKg.toStringAsFixed(1)} kg',
              ),
              _Metric(
                label: 'Feed used'.tr,
                value: '${summary.feedKg.toStringAsFixed(1)} kg',
              ),
              _Metric(
                label: 'Pending pay'.tr,
                value: KalroFormatters.formatCurrency(summary.pendingPayables),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: KalroColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: KalroColors.primaryGreen),
          const Spacer(),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
          Text(
            label,
            style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
          ),
        ],
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(fontSize: 11, color: KalroColors.textMuted),
          ),
        ],
      ),
    );
  }
}
