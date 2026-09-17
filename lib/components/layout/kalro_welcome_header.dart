import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../theme/kalro_colors.dart';
import 'package:kalro/l10n/translator.dart';

class KalroWelcomeHeader extends StatelessWidget {
  KalroWelcomeHeader({
    super.key,
    required this.displayName,
    this.onNotificationsTap,
    this.onMenuTap,
  });

  final String displayName;
  final VoidCallback? onNotificationsTap;
  final VoidCallback? onMenuTap;

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning'.tr;
    if (hour < 17) return 'Good afternoon'.tr;
    return 'Good evening'.tr;
  }

  @override
  Widget build(BuildContext context) {
    final date = DateFormat(
      'EEEE d MMMM',
      Translator.dateLocale,
    ).format(DateTime.now());
    return Row(
      children: [
        if (onMenuTap != null ||
            (Scaffold.maybeOf(context)?.hasDrawer ?? false))
          IconButton(
            onPressed: onMenuTap ?? () => Scaffold.of(context).openDrawer(),
            icon: const Icon(Icons.menu_rounded, color: KalroColors.textDark),
          )
        else
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
        const SizedBox(width: 4),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$_greeting, $displayName',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: KalroColors.textDark,
                  height: 1.2,
                ),
              ),
              Text(
                date,
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  color: KalroColors.textMuted,
                ),
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: onNotificationsTap,
          icon: const Icon(
            Icons.notifications_none_rounded,
            color: KalroColors.textDark,
          ),
        ),
      ],
    );
  }
}
