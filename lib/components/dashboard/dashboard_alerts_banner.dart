import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/batch_alert.dart';
import '../../theme/kalro_colors.dart';

class DashboardAlertsBanner extends StatelessWidget {
  DashboardAlertsBanner({
    super.key,
    required this.alerts,
    this.onAlertTap,
  });

  final List<BatchAlert> alerts;
  final void Function(BatchAlert alert)? onAlertTap;

  @override
  Widget build(BuildContext context) {
    if (alerts.isEmpty) return SizedBox.shrink();

    final top = alerts.take(3).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Alerts',
          style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        SizedBox(height: 8),
        ...top.map((alert) {
          final color = switch (alert.severity) {
            BatchAlertSeverity.critical => Colors.red.shade50,
            BatchAlertSeverity.warning => Colors.orange.shade50,
            BatchAlertSeverity.info => Colors.blue.shade50,
          };
          final iconColor = switch (alert.severity) {
            BatchAlertSeverity.critical => Colors.red,
            BatchAlertSeverity.warning => Colors.orange,
            BatchAlertSeverity.info => Colors.blue,
          };

          return Card(
            margin: EdgeInsets.only(bottom: 8),
            color: color,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: KalroColors.divider),
            ),
            child: ListTile(
              leading: Icon(Icons.notifications_active, color: iconColor, size: 22),
              title: Text(
                alert.title,
                style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14),
              ),
              subtitle: Text(
                alert.message,
                style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
              ),
              onTap: onAlertTap == null ? null : () => onAlertTap!(alert),
            ),
          );
        }),
      ],
    );
  }
}
