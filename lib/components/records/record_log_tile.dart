import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/kalro_colors.dart';

/// Unified row tile for batch activity records (feeding, mortality, etc.).
class RecordLogTile extends StatelessWidget {
  RecordLogTile({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.meta,
    this.note,
    this.iconColor = KalroColors.primaryGreen,
    this.iconBackground,
    this.borderColor,
    this.onDelete,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final String? meta;
  final String? note;
  final Color iconColor;
  final Color? iconBackground;
  final Color? borderColor;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(bottom: 8),
      padding: EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor ?? KalroColors.divider),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconBackground ?? iconColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                if (subtitle != null && subtitle!.isNotEmpty) ...[
                  SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                  ),
                ],
                if (meta != null) ...[
                  SizedBox(height: 2),
                  Text(
                    meta!,
                    style: GoogleFonts.poppins(fontSize: 11, color: KalroColors.textLight),
                  ),
                ],
                if (note != null && note!.trim().isNotEmpty) ...[
                  SizedBox(height: 6),
                  Text(
                    note!.trim(),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      fontStyle: FontStyle.italic,
                      color: KalroColors.textMuted,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (onDelete != null)
            IconButton(
              onPressed: onDelete,
              icon: Icon(Icons.delete_outline, size: 20),
              color: KalroColors.textMuted,
              padding: EdgeInsets.zero,
              constraints: BoxConstraints(minWidth: 32, minHeight: 32),
            ),
        ],
      ),
    );
  }
}
