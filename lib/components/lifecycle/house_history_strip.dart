import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../l10n/translator.dart';
import '../../models/environment_log.dart';
import '../../services/house_history.dart';
import '../../theme/kalro_colors.dart';

class HouseHistoryStrip extends StatelessWidget {
  const HouseHistoryStrip({super.key, required this.logs, this.days = 14});

  final List<EnvironmentLog> logs;
  final int days;

  @override
  Widget build(BuildContext context) {
    final history = HouseHistory.lastDays(logs, days: days);
    final hot = HouseHistory.hotDays(history);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: KalroColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            Translator.fill('House — last {n} days', {'n': '$days'}),
            style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 13),
          ),
          const SizedBox(height: 4),
          Text(
            hot >= 3
                ? Translator.fill('Too hot on {n} days — Plan dates will move.', {'n': '$hot'})
                : 'Cool · OK · hot from logged house chips.'.tr,
            style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              for (final day in history)
                Expanded(
                  child: Tooltip(
                    message: day.label ?? DateTime(day.date.year, day.date.month, day.date.day).toIso8601String().split('T').first,
                    child: Container(
                      height: 22,
                      margin: const EdgeInsets.symmetric(horizontal: 1),
                      decoration: BoxDecoration(
                        color: day.color,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
