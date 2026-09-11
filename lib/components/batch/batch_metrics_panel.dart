import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../services/batch_metrics_service.dart';
import '../../theme/kalro_colors.dart';

class BatchMetricsPanel extends StatelessWidget {
  const BatchMetricsPanel({super.key, required this.metrics});

  final BatchMetrics metrics;

  @override
  Widget build(BuildContext context) {
    final survivalColor = metrics.survivalRatePercent >= 80
        ? KalroColors.headerGreen
        : metrics.survivalRatePercent >= 60
            ? Colors.orange
            : Colors.red;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: KalroColors.divider),
      ),
      child: Row(
        children: [
          _MetricCell(
            label: 'Live larvae',
            value: '${metrics.liveCount}',
          ),
          _MetricCell(
            label: 'Mortality',
            value: '${metrics.totalMortality}',
          ),
          _MetricCell(
            label: 'Survival',
            value: '${metrics.survivalRatePercent.toStringAsFixed(0)}%',
            valueColor: survivalColor,
          ),
        ],
      ),
    );
  }
}

class _MetricCell extends StatelessWidget {
  const _MetricCell({
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
        children: [
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: valueColor ?? KalroColors.textDark,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 12,
              color: KalroColors.textMuted,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
