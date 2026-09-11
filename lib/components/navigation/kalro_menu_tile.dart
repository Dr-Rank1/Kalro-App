import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/kalro_colors.dart';

class KalroMenuTile extends StatelessWidget {
  KalroMenuTile({
    super.key,
    required this.icon,
    required this.title,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        child: Row(
          children: [
            Icon(icon, color: KalroColors.primaryGreen, size: 24),
            SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: GoogleFonts.poppins(fontSize: 15, color: KalroColors.textDark),
              ),
            ),
            Icon(Icons.chevron_right, color: KalroColors.textLight, size: 22),
          ],
        ),
      ),
    );
  }
}
