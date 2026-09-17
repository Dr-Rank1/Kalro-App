import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../models/batch.dart';
import '../../models/rearing_conditions.dart';
import '../../services/lifecycle_engine.dart';
import '../../services/rearing_day_service.dart';
import '../../theme/kalro_colors.dart';
import '../../l10n/translator.dart';

/// Compact row tile for an active rearing batch.
class BatchHorizontalCard extends StatelessWidget {
  BatchHorizontalCard({
    super.key,
    required this.batch,
    required this.lifecycleEngine,
    required this.onTap,
    this.observedStageDates,
    this.conditions,
    this.liveCount,
    this.fedToday,
    this.survivalPercent,
  });

  final Batch batch;
  final LifecycleEngine lifecycleEngine;
  final VoidCallback onTap;
  final Map<String, DateTime>? observedStageDates;
  final RearingConditions? conditions;
  final int? liveCount;
  final bool? fedToday;
  final double? survivalPercent;

  @override
  Widget build(BuildContext context) {
    final plan = RearingDayService().planFor(
      batch,
      observedStageDates: observedStageDates,
      conditions: conditions,
    );
    final next = lifecycleEngine.nextMilestone(
      batch,
      observedStageDates: observedStageDates,
      conditions: conditions,
    );
    final current = lifecycleEngine.currentStage(
      batch,
      observedStageDates: observedStageDates,
      conditions: conditions,
    );
    final dateFormat = DateFormat.MMMd();
    final stageLabel = plan?.actionTitle ?? current?.label.tr ?? 'Starting'.tr;
    final daysRunning =
        plan?.cycleDay ?? DateTime.now().difference(batch.startDate).inDays + 1;
    final accent = plan?.isHarvestWork == true
        ? KalroColors.harvest
        : plan?.stopFeeding == true
        ? KalroColors.rest
        : KalroColors.primaryGreen;

    final detail =
        plan?.feedLabel ??
        (next != null
            ? '$stageLabel · ${Translator.fill('Next {label} {date}', {'label': next.label, 'date': dateFormat.format(next.expectedDate)})}'
            : '$stageLabel · ${Translator.fill('Day {n}', {'n': '$daysRunning'})}');

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: KalroColors.divider),
          ),
          padding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  batch.species.name == 'eri'
                      ? Icons.eco_outlined
                      : Icons.spa_outlined,
                  size: 22,
                  color: accent,
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      batch.species.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      [
                        if (liveCount != null) Translator.fill('{n} live', {'n': '$liveCount'}),
                        if (survivalPercent != null)
                          '${survivalPercent!.toStringAsFixed(0)}%',
                        '$stageLabel · ${Translator.fill('day {d} of {n}', {
                          'd': '$daysRunning',
                          'n': '${plan?.cycleLengthDays ?? daysRunning}',
                        })}',
                      ].join(' · '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: KalroColors.textMuted,
                      ),
                    ),
                    Text(
                      [
                        if (plan?.isHarvestWork == true)
                          'Harvest'.tr
                        else if (plan?.stopFeeding == true)
                          'Rest day'.tr
                        else if (fedToday == true)
                          'Fed today'.tr
                        else if (fedToday == false && (plan?.suggestedGrams ?? 0) > 0)
                          'Needs feed'.tr,
                        detail,
                      ].where((s) => s.isNotEmpty).join(' · '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
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
