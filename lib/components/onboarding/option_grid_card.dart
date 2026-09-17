import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/kalro_colors.dart';

class OptionGridCard extends StatelessWidget {
  OptionGridCard({
    super.key,
    required this.primaryLabel,
    required this.secondaryLabel,
    required this.selected,
    required this.onTap,
    this.icon,
    this.aspectRatio = 1.6,
  });

  final String primaryLabel;
  final String secondaryLabel;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;
  final double aspectRatio;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? KalroColors.primaryGreen : KalroColors.divider,
            width: selected ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 48, color: KalroColors.textDark),
              SizedBox(height: 12),
            ],
            Text(
              primaryLabel,
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                fontSize: icon == null ? 22 : 13,
                fontWeight: FontWeight.w500,
                color: icon == null
                    ? KalroColors.textDark
                    : KalroColors.textMuted,
              ),
            ),
            if (secondaryLabel.isNotEmpty)
              Text(
                secondaryLabel,
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  color: KalroColors.textMuted,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
