import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../models/dashboard_summary.dart';
import '../../theme/kalro_colors.dart';

class DashboardNextEventBanner extends StatelessWidget {
  const DashboardNextEventBanner({
    super.key,
    required this.item,
    this.onTap,
  });

  final UpcomingMilestoneItem item;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat.MMMd();
    final timing = _timingLabel(item);

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: KalroColors.peach),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: KalroColors.peach.withValues(alpha: 0.35),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.notifications_active_outlined,
                  color: KalroColors.accentBrown,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Next up',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: KalroColors.textMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item.milestone.label,
                      style: GoogleFonts.poppins(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: KalroColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      [
                        item.batch.species.label,
                        dateFormat.format(item.milestone.expectedDate),
                        timing,
                        if (item.milestone.daysVsTypical != null &&
                            item.milestone.daysVsTypical != 0)
                          item.milestone.daysVsTypical! > 0
                              ? '+${item.milestone.daysVsTypical}d vs typical'
                              : '${item.milestone.daysVsTypical}d vs typical',
                      ].join(' · '),
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: KalroColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              if (onTap != null)
                const Icon(
                  Icons.chevron_right,
                  color: KalroColors.textLight,
                ),
            ],
          ),
        ),
      ),
    );
  }

  String _timingLabel(UpcomingMilestoneItem item) {
    if (item.isToday) return 'Today';
    if (item.isOverdue) return 'Overdue';
    if (item.daysUntil == 1) return 'Tomorrow';
    return 'In ${item.daysUntil} days';
  }
}
