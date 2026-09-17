import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../models/dashboard_summary.dart';
import '../../theme/kalro_colors.dart';
import '../../l10n/translator.dart';

class DashboardUpcomingTile extends StatelessWidget {
  DashboardUpcomingTile({super.key, required this.item, required this.onTap});

  final UpcomingMilestoneItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat.MMMd();

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              _DateBadge(
                date: item.milestone.effectiveDate,
                isToday: item.isToday,
                isOverdue: item.isOverdue,
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.milestone.label.tr,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: KalroColors.textDark,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      '${item.batch.species.label} · ${dateFormat.format(item.milestone.effectiveDate)}',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: KalroColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: KalroColors.textLight, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _DateBadge extends StatelessWidget {
  const _DateBadge({
    required this.date,
    required this.isToday,
    required this.isOverdue,
  });

  final DateTime date;
  final bool isToday;
  final bool isOverdue;

  @override
  Widget build(BuildContext context) {
    final month = DateFormat('MMM').format(date).toUpperCase();
    final day = date.day.toString();

    final background = isOverdue
        ? Color(0xFFFFE8E8)
        : isToday
        ? KalroColors.peach.withValues(alpha: 0.5)
        : KalroColors.background;

    final accent = isOverdue ? Colors.red.shade700 : KalroColors.accentBrown;

    return Container(
      width: 48,
      padding: EdgeInsets.symmetric(vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(
            month,
            style: GoogleFonts.poppins(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: accent,
            ),
          ),
          Text(
            day,
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: KalroColors.textDark,
            ),
          ),
        ],
      ),
    );
  }
}
