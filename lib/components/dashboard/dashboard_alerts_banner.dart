import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/batch_alert.dart';
import '../../theme/kalro_colors.dart';
import '../../l10n/translator.dart';

class DashboardAlertsBanner extends StatelessWidget {
  const DashboardAlertsBanner({super.key, required this.alerts, this.onAlertTap});

  final List<BatchAlert> alerts;
  final void Function(BatchAlert alert)? onAlertTap;

  @override
  Widget build(BuildContext context) {
    if (alerts.isEmpty) return SizedBox.shrink();

    final top = alerts.take(3).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ...top.map((alert) {
          final color = switch (alert.severity) {
            BatchAlertSeverity.critical => const Color(0xFFFEF2F2),
            BatchAlertSeverity.warning => const Color(0xFFFFFBEB),
            BatchAlertSeverity.info => const Color(0xFFEFF6FF),
          };
          final iconColor = switch (alert.severity) {
            BatchAlertSeverity.critical => const Color(0xFF991B1B),
            BatchAlertSeverity.warning => const Color(0xFF92400E),
            BatchAlertSeverity.info => const Color(0xFF1E40AF),
          };
          final borderColor = switch (alert.severity) {
            BatchAlertSeverity.critical => const Color(0xFFFECACA),
            BatchAlertSeverity.warning => const Color(0xFFFDE68A),
            BatchAlertSeverity.info => const Color(0xFFBFDBFE),
          };

          return Semantics(
            button: onAlertTap != null,
            label: '${alert.title.tr}: ${alert.message.tr}',
            child: Card(
              margin: const EdgeInsets.only(bottom: 8),
              color: color,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: borderColor),
              ),
              child: ListTile(
                minTileHeight: 48,
                leading: Icon(
                  Icons.notifications_active,
                  color: iconColor,
                  size: 22,
                ),
                title: Text(
                  alert.title.tr,
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: KalroColors.textDark,
                  ),
                ),
                subtitle: Text(
                  alert.message.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: KalroColors.textDark.withValues(alpha: 0.8),
                  ),
                ),
                onTap: onAlertTap == null ? null : () => onAlertTap!(alert),
              ),
            ),
          );
        }),
      ],
    );
  }
}
