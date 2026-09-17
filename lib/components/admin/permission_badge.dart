import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/account_permission.dart';
import '../../theme/kalro_colors.dart';

class PermissionBadge extends StatelessWidget {
  PermissionBadge({super.key, required this.permission, this.compact = false});

  final AccountPermission permission;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 10,
        vertical: compact ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: permission.badgeColor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: permission.badgeColor.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            permission.icon,
            size: compact ? 12 : 14,
            color: permission.badgeColor,
          ),
          SizedBox(width: 4),
          Text(
            permission.label,
            style: GoogleFonts.poppins(
              fontSize: compact ? 11 : 12,
              fontWeight: FontWeight.w600,
              color: permission.badgeColor,
            ),
          ),
        ],
      ),
    );
  }
}

class PermissionDescriptionCard extends StatelessWidget {
  PermissionDescriptionCard({super.key, required this.permission});

  final AccountPermission permission;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: permission.badgeColor.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: KalroColors.divider),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(permission.icon, color: permission.badgeColor, size: 20),
          SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  permission.label,
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                ),
                SizedBox(height: 2),
                Text(
                  permission.description,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: KalroColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
