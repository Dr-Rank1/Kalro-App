import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/batch.dart';
import '../../services/app_repositories.dart';
import '../../services/rearing_day_service.dart';
import '../../theme/kalro_colors.dart';
import '../../l10n/translator.dart';
import 'floor_actions.dart';

class TodayBatchWorkCard extends StatelessWidget {
  const TodayBatchWorkCard({
    super.key,
    required this.batch,
    required this.plan,
    required this.liveCount,
    required this.fedToday,
    this.fedGramsToday,
    this.skippedToday = false,
    this.skipReason,
    required this.repositories,
    required this.onOpen,
    required this.onChanged,
    this.canEdit = true,
    this.onOpenGuide,
    this.expanded = false,
  });

  final Batch batch;
  final RearingDayPlan plan;
  final int liveCount;
  final bool fedToday;
  final double? fedGramsToday;
  final bool skippedToday;
  final String? skipReason;
  final AppRepositories repositories;
  final VoidCallback onOpen;
  final VoidCallback onChanged;
  final bool canEdit;
  final VoidCallback? onOpenGuide;
  final bool expanded;

  @override
  Widget build(BuildContext context) {
    final harvest = plan.isHarvestWork;
    final Color accent;
    final String status;
    final IconData icon;

    if (harvest) {
      accent = KalroColors.harvest;
      status = 'Harvest'.tr;
      icon = Icons.inventory_2_outlined;
    } else if (fedToday) {
      accent = KalroColors.headerGreen;
      status = fedGramsToday != null && fedGramsToday! > 0
          ? Translator.fill('✓ Fed {g} g', {'g': '${fedGramsToday!.round()}'})
          : '✓ Fed today'.tr;
      icon = Icons.check_circle_rounded;
    } else if (skippedToday) {
      accent = KalroColors.harvest;
      status = Translator.fill('⏸ Skipped ({r})', {
        'r': (skipReason ?? 'Rest').tr,
      });
      icon = Icons.pause_circle_outline;
    } else {
      // Default: Feed larvae!
      accent = KalroColors.leaf;
      status = 'Feed larvae'.tr;
      icon = Icons.eco_outlined;
    }

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onOpen,
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: KalroColors.divider),
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            batch.displayTag,
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                              color: KalroColors.textDark,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            batch.strain != null && batch.strain!.isNotEmpty
                                ? '${batch.species.label} (${batch.strain})'
                                : batch.species.label,
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              color: KalroColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: fedToday
                            ? KalroColors.headerGreen.withValues(alpha: 0.1)
                            : accent.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            icon,
                            size: 13,
                            color: fedToday ? KalroColors.headerGreen : accent,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            status,
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: fedToday ? KalroColors.headerGreen : accent,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Text(
                      '${plan.stage.label} · Day ${plan.cycleDay}',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: KalroColors.headerGreen,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '•  ${Translator.fill('{n} live', {'n': '$liveCount'})}',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: KalroColors.textMuted,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  plan.feedLabel,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: KalroColors.textDark,
                  ),
                ),
                if (canEdit) ...[
                  const SizedBox(height: 12),
                  FloorActionsBar(
                    batch: batch,
                    plan: plan,
                    repositories: repositories,
                    onChanged: onChanged,
                    canEdit: canEdit,
                    fedToday: fedToday,
                    fedGramsToday: fedGramsToday,
                    skippedToday: skippedToday,
                    skipReason: skipReason,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
