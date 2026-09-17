import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/dashboard_summary.dart';
import '../../theme/kalro_colors.dart';
import '../../l10n/app_localizations.dart';

import 'package:kalro/l10n/translator.dart';

class FarmKpiCards extends StatelessWidget {
  FarmKpiCards({super.key, required this.summary});

  final DashboardSummary summary;

  Widget _buildCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    String? subtitle,
  }) {
    return Container(
      width: 156,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: KalroColors.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const Spacer(),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: KalroColors.textDark,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: KalroColors.textMuted,
            ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 2),
            Text(
              subtitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.poppins(
                fontSize: 10,
                color: color,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _feedLabel(double grams) {
    if (grams >= 1000) return '${(grams / 1000).toStringAsFixed(1)} kg';
    return '${grams.round()} g';
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final harvestKg = summary.totalHarvestWeightGrams / 1000;
    return SizedBox(
      height: 168,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          _buildCard(
            title: l10n?.dashboardLiveLarvae ?? 'Live larvae',
            value: '${summary.liveLarvae}',
            subtitle:
                l10n?.dashboardLiveLarvaeSub(summary.activeBatchCount) ??
                '${summary.activeBatchCount} batches'.tr,
            icon: Icons.pets_outlined,
            color: KalroColors.headerGreen,
          ),
          const SizedBox(width: 12),
          _buildCard(
            title: l10n?.dashboardSurvivalRate ?? 'Survival',
            value: summary.activeBatchCount == 0
                ? '—'
                : '${summary.averageSurvivalPercent.toStringAsFixed(1)}%',
            icon: Icons.favorite_outline,
            color: summary.activeBatchCount == 0
                ? KalroColors.textMuted
                : summary.averageSurvivalPercent >= 90
                ? KalroColors.success
                : KalroColors.rest,
            subtitle: summary.activeBatchCount == 0
                ? 'No batches yet'.tr
                : 'From live vs eggs'.tr,
          ),
          const SizedBox(width: 12),
          _buildCard(
            title: 'Feed today'.tr,
            value: _feedLabel(summary.feedTodayGrams),
            icon: Icons.eco_outlined,
            color: KalroColors.leaf,
            subtitle: summary.suggestedFeedTodayGrams > 0
                ? 'Logged vs ${_feedLabel(summary.suggestedFeedTodayGrams)} suggested'
                      .tr
                : 'Logged so far'.tr,
          ),
          const SizedBox(width: 12),
          _buildCard(
            title: l10n?.dashboardExpectedYield ?? 'Harvested',
            value: '${harvestKg.toStringAsFixed(1)} kg',
            icon: Icons.inventory_2_outlined,
            color: KalroColors.harvest,
            subtitle: summary.harvestWindowOpen
                ? 'Harvest window open'.tr
                : '${summary.harvestCount} records'.tr,
          ),
        ],
      ),
    );
  }
}
