import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/kalro_colors.dart';

class KalroToolbar extends StatelessWidget {
  KalroToolbar({
    super.key,
    required this.title,
    this.onBack,
    this.trailing,
    this.subtitle,
  });

  final String title;
  final String? subtitle;
  final VoidCallback? onBack;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final bool canPop = Navigator.canPop(context);
    return Row(
      children: [
        if (onBack != null)
          IconButton(
            onPressed: onBack,
            icon: Icon(Icons.arrow_back, color: KalroColors.textDark),
          )
        else if (canPop)
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: Icon(Icons.arrow_back, color: KalroColors.textDark),
          )
        else if (Scaffold.maybeOf(context)?.hasDrawer ?? false)
          IconButton(
            onPressed: () => Scaffold.of(context).openDrawer(),
            icon: Icon(Icons.menu, color: KalroColors.textDark),
          )
        else
          SizedBox(width: 8),

        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 22,
                  fontWeight: FontWeight.w600,
                  color: KalroColors.textDark,
                ),
              ),
              if (subtitle != null)
                Text(
                  subtitle!,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    color: KalroColors.textMuted,
                  ),
                ),
            ],
          ),
        ),
        ?trailing,
      ],
    );
  }
}
