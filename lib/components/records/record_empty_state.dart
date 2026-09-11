import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/kalro_colors.dart';
import '../buttons/kalro_primary_button.dart';

class RecordEmptyState extends StatelessWidget {
  RecordEmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: KalroColors.divider),
      ),
      child: Column(
        children: [
          Icon(icon, size: 40, color: KalroColors.headerGreen.withValues(alpha: 0.65)),
          SizedBox(height: 10),
          Text(
            title,
            style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 15),
          ),
          SizedBox(height: 6),
          Text(
            message,
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(fontSize: 13, color: KalroColors.textMuted),
          ),
          if (actionLabel != null && onAction != null) ...[
            SizedBox(height: 16),
            KalroPrimaryButton(label: actionLabel!, onPressed: onAction!),
          ],
        ],
      ),
    );
  }
}
