import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../l10n/translator.dart';
import '../../services/leaf_ledger_service.dart';
import '../../theme/kalro_colors.dart';

class LeafDepletionCard extends StatelessWidget {
  const LeafDepletionCard({
    super.key,
    required this.forecast,
    this.onAddLeaf,
  });

  final LeafDepletionForecast forecast;
  final VoidCallback? onAddLeaf;

  @override
  Widget build(BuildContext context) {
    final Color statusColor;
    final IconData statusIcon;
    final String statusText;

    switch (forecast.urgency) {
      case DepletionUrgency.safe:
        statusColor = KalroColors.headerGreen;
        statusIcon = Icons.check_circle_outline;
        statusText = 'Leaf supply sufficient (${forecast.daysUntilDepletion}+ days)'.tr;
        break;
      case DepletionUrgency.warning:
        statusColor = Colors.orange.shade800;
        statusIcon = Icons.warning_amber_rounded;
        statusText = 'Leaf shortage warning (~${forecast.daysUntilDepletion} days left)'.tr;
        break;
      case DepletionUrgency.critical:
        statusColor = Colors.red.shade700;
        statusIcon = Icons.error_outline;
        statusText = 'Critical shortage: ${forecast.daysUntilDepletion} days remaining!'.tr;
        break;
      case DepletionUrgency.exhausted:
        statusColor = Colors.red.shade900;
        statusIcon = Icons.dangerous_outlined;
        statusText = 'No leaf in stock! Worms risk starvation.'.tr;
        break;
    }

    final double coverageRatio = forecast.totalCycleNeedKg > 0
        ? (forecast.currentStockKg / forecast.totalCycleNeedKg).clamp(0.0, 1.0)
        : 1.0;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: forecast.urgency != DepletionUrgency.safe
              ? statusColor.withValues(alpha: 0.5)
              : KalroColors.divider,
          width: forecast.urgency != DepletionUrgency.safe ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(statusIcon, color: statusColor, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  statusText,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: statusColor,
                  ),
                ),
              ),
              if (onAddLeaf != null)
                TextButton(
                  onPressed: onAddLeaf,
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    minimumSize: const Size(40, 30),
                  ),
                  child: Text('Add leaf'.tr),
                ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: coverageRatio,
              backgroundColor: KalroColors.divider,
              valueColor: AlwaysStoppedAnimation<Color>(statusColor),
              minHeight: 8,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _MetricItem(
                label: 'Current stock'.tr,
                value: '${forecast.currentStockKg.toStringAsFixed(1)} kg',
              ),
              _MetricItem(
                label: '14-day need'.tr,
                value: '${forecast.totalCycleNeedKg.toStringAsFixed(1)} kg',
              ),
              _MetricItem(
                label: 'Deficit'.tr,
                value: forecast.deficitKg > 0
                    ? '${forecast.deficitKg.toStringAsFixed(1)} kg'
                    : 'None'.tr,
                valueColor: forecast.deficitKg > 0 ? Colors.red.shade700 : null,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetricItem extends StatelessWidget {
  const _MetricItem({
    required this.label,
    required this.value,
    this.valueColor,
  });

  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 11,
              color: KalroColors.textMuted,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: valueColor ?? KalroColors.textDark,
            ),
          ),
        ],
      ),
    );
  }
}
