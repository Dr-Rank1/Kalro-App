import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/kalro_colors.dart';

class KalroStatCard extends StatelessWidget {
  KalroStatCard({
    super.key,
    required this.icon,
    required this.title,
    required this.value,
  });

  final IconData icon;
  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: KalroColors.cardWhite,
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: KalroColors.primaryGreen, size: 28),
          Spacer(),
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 12,
              color: KalroColors.textMuted,
              fontWeight: FontWeight.w500,
            ),
          ),
          SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: KalroColors.textDark,
            ),
          ),
        ],
      ),
    );
  }
}
