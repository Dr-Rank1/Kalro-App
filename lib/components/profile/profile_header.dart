import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/kalro_colors.dart';

class ProfileHeader extends StatelessWidget {
  const ProfileHeader({
    super.key,
    required this.orgName,
    required this.displayName,
    required this.userId,
    this.onEditAvatar,
  });

  final String orgName;
  final String displayName;
  final String userId;
  final VoidCallback? onEditAvatar;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Stack(
          children: [
            CircleAvatar(
              radius: 36,
              backgroundColor: KalroColors.peach,
              child: Image.asset('assets/images/kalro_app_icon.png', width: 56, height: 56),
            ),
            if (onEditAvatar != null)
              Positioned(
                bottom: 0,
                right: 0,
                child: GestureDetector(
                  onTap: onEditAvatar,
                  child: const CircleAvatar(
                    radius: 12,
                    backgroundColor: KalroColors.primaryGreen,
                    child: Icon(Icons.edit, size: 12, color: Colors.white),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                orgName,
                style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              Text(
                displayName,
                style: GoogleFonts.poppins(fontSize: 14, color: KalroColors.textMuted),
              ),
              Text(
                userId,
                style: GoogleFonts.poppins(fontSize: 13, color: KalroColors.textLight),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
