import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/kalro_colors.dart';

class KalroWelcomeHeader extends StatelessWidget {
  const KalroWelcomeHeader({
    super.key,
    required this.displayName,
    this.onNotificationsTap,
  });

  final String displayName;
  final VoidCallback? onNotificationsTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          radius: 24,
          backgroundColor: KalroColors.peach,
          child: ClipOval(
            child: Image.asset(
              'assets/images/kalro_app_icon.png',
              width: 40,
              height: 40,
              fit: BoxFit.cover,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            'Welcome to Kalro Sericulture, $displayName!',
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: KalroColors.textDark,
            ),
          ),
        ),
        IconButton(
          onPressed: onNotificationsTap,
          icon: const Icon(Icons.notifications_none, color: KalroColors.textDark),
        ),
      ],
    );
  }
}
