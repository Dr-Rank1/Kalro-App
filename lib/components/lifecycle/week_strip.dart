import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../l10n/translator.dart';
import '../../services/week_plan_service.dart';
import '../../theme/kalro_colors.dart';

class WeekStrip extends StatelessWidget {
  const WeekStrip({super.key, required this.days});

  final List<WeekDaySummary> days;

  @override
  Widget build(BuildContext context) {
    if (days.isEmpty) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: KalroColors.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'This week'.tr,
            style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 13),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              for (final day in days)
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: _DayCell(day: day),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DayCell extends StatelessWidget {
  const _DayCell({required this.day});

  final WeekDaySummary day;

  @override
  Widget build(BuildContext context) {
    final color = switch (day.kind) {
      WeekDayKind.empty => KalroColors.divider,
      WeekDayKind.feed => KalroColors.leaf,
      WeekDayKind.rest => KalroColors.rest,
      WeekDayKind.harvest => KalroColors.harvest,
      WeekDayKind.mixed => KalroColors.headerGreen,
    };
    final label = switch (day.kind) {
      WeekDayKind.empty => '—',
      WeekDayKind.feed => 'Feed'.tr,
      WeekDayKind.rest => 'Rest'.tr,
      WeekDayKind.harvest => 'Harvest'.tr,
      WeekDayKind.mixed => 'Mix'.tr,
    };
    final weekday = DateFormat('E', Translator.dateLocale).format(day.date);
    return Column(
      children: [
        Text(
          weekday,
          style: GoogleFonts.poppins(fontSize: 10, color: KalroColors.textMuted),
        ),
        const SizedBox(height: 4),
        Container(
          height: 36,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: color.withValues(alpha: day.kind == WeekDayKind.empty ? 1 : 0.18),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            '${day.date.day}',
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: day.kind == WeekDayKind.empty ? KalroColors.textMuted : color,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: GoogleFonts.poppins(fontSize: 9, fontWeight: FontWeight.w600, color: color),
        ),
      ],
    );
  }
}
