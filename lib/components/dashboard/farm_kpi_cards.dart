import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/dashboard_summary.dart';
import '../../theme/kalro_colors.dart';
import '../../l10n/app_localizations.dart';

class FarmKpiCards extends StatelessWidget {
  const FarmKpiCards({super.key, required this.summary});

  final DashboardSummary summary;

  Widget _buildCard({
    required BuildContext context,
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    String? subtitle,
  }) {
    return Container(
      width: 140,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 24),
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
          const SizedBox(height: 4),
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
              style: GoogleFonts.poppins(
                fontSize: 10,
                color: color,
                fontWeight: FontWeight.w600,
              ),
            ),
          ]
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return SizedBox(
      height: 140,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          _buildCard(
            context: context,
            title: l10n?.dashboardLiveLarvae ?? 'Live Larvae',
            value: '${summary.liveLarvae}',
            subtitle: l10n?.dashboardLiveLarvaeSub(summary.activeBatchCount) ?? '${summary.activeBatchCount} batches',
            icon: Icons.bug_report,
            color: Colors.blue,
          ),
          const SizedBox(width: 12),
          _buildCard(
            context: context,
            title: l10n?.dashboardSurvivalRate ?? 'Survival Rate',
            value: '${summary.averageSurvivalPercent.toStringAsFixed(1)}%',
            icon: Icons.health_and_safety,
            color: summary.averageSurvivalPercent > 90 ? Colors.green : Colors.orange,
            subtitle: summary.averageSurvivalPercent > 90 ? 'Excellent' : 'Needs attention',
          ),
          const SizedBox(width: 12),
          _buildCard(
            context: context,
            title: l10n?.dashboardExpectedYield ?? 'Expected Yield',
            value: '${(summary.liveLarvae * 1.5 / 1000).toStringAsFixed(1)} kg',
            icon: Icons.inventory_2,
            color: Colors.purple,
            subtitle: l10n?.dashboardYieldSub ?? 'Estimated cocoon',
          ),
        ],
      ),
    );
  }
}
