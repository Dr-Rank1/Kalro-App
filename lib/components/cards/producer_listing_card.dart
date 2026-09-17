import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/kalro_colors.dart';
import '../buttons/kalro_primary_button.dart';

class ProducerListingCard extends StatelessWidget {
  ProducerListingCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.onAction,
    this.actionLabel = 'Purchase',
    this.detail,
  });

  final String title;
  final String subtitle;
  final String? detail;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: 36,
            backgroundColor: KalroColors.background,
            child: Image.asset('assets/images/kalro_app_icon.png', width: 48),
          ),
          SizedBox(height: 12),
          Text(
            title,
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              fontSize: 16,
            ),
          ),
          Text(
            subtitle,
            style: GoogleFonts.poppins(
              fontSize: 13,
              color: KalroColors.textMuted,
            ),
          ),
          if (detail != null) ...[
            SizedBox(height: 4),
            Text(
              detail!,
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: KalroColors.textLight,
              ),
            ),
          ],
          SizedBox(height: 16),
          KalroPrimaryButton(label: actionLabel, onPressed: onAction),
        ],
      ),
    );
  }
}
