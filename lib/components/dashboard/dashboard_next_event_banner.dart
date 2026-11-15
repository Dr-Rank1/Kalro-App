import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../models/dashboard_summary.dart';
import '../../theme/kalro_colors.dart';

import 'package:kalro/l10n/translator.dart';

class DashboardNextEventBanner extends StatelessWidget {
  const DashboardNextEventBanner({super.key, required this.item, this.onTap});

  final UpcomingMilestoneItem item;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat.MMMd();
    final timing = _timingLabel(item);

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: KalroColors.divider),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: KalroColors.primaryGreen.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.notifications_active_outlined,
                  color: KalroColors.primaryGreen,
                  size: 20,
                ),
              ),
              SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Next up'.tr,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: KalroColors.textMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      item.milestone.label.tr,
                      style: GoogleFonts.poppins(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: KalroColors.textDark,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      [
                        item.batch.species.label,
                        dateFormat.format(item.milestone.expectedDate),
                        timing,
                        if (item.milestone.daysVsTypical != null &&
                            item.milestone.daysVsTypical != 0)
                          item.milestone.daysVsTypical! > 0
                              ? '+${item.milestone.daysVsTypical}d vs typical'
                                    .tr
                              : '${item.milestone.daysVsTypical}d vs typical'
                                    .tr,
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
                Icon(Icons.chevron_right, color: KalroColors.textLight),
            ],
          ),
        ),
      ),
    );
  }

  String _timingLabel(UpcomingMilestoneItem item) {
    if (item.isToday) return 'Today'.tr;
    if (item.isOverdue) return 'Overdue'.tr;
    if (item.daysUntil == 1) return 'Tomorrow'.tr;
    return Translator.fill('In {n} days', {'n': '${item.daysUntil}'});
  }
}
