import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/kalro_colors.dart';
import '../buttons/kalro_primary_button.dart';

class EmptyStateCard extends StatelessWidget {
  EmptyStateCard({
    super.key,
    required this.title,
    required this.message,
    required this.actionLabel,
    required this.onAction,
    this.icon = Icons.inbox_outlined,
  });

  final String title;
  final String message;
  final String actionLabel;
  final VoidCallback onAction;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: KalroColors.divider),
      ),
      child: Column(
        children: [
          Icon(icon, size: 40, color: KalroColors.primaryGreen),
          SizedBox(height: 12),
          Text(title, style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
          SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(fontSize: 13, color: KalroColors.textMuted),
          ),
          SizedBox(height: 16),
          KalroPrimaryButton(label: actionLabel, onPressed: onAction),
        ],
      ),
    );
  }
}
