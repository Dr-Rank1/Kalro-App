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
  final AppRepositories repositories;
  final VoidCallback onOpen;
  final VoidCallback onChanged;
  final bool canEdit;
  final VoidCallback? onOpenGuide;
  final bool expanded;

  @override
  Widget build(BuildContext context) {
    final harvest = plan.isHarvestWork;
    final rest = plan.stopFeeding;
    final accent = harvest
        ? KalroColors.harvest
        : rest
            ? KalroColors.rest
            : KalroColors.leaf;
    final status = harvest
        ? 'Harvest'.tr
        : rest
            ? 'Rest day'.tr
            : fedToday
                ? 'Fed today'.tr
                : 'Needs feed'.tr;

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onOpen,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            boxShadow: KalroColors.softShadow,
            border: Border.all(color: accent.withValues(alpha: 0.22)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(height: 4, decoration: BoxDecoration(color: accent, borderRadius: const BorderRadius.vertical(top: Radius.circular(18)))),
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            batch.species.label,
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: accent.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            status,
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: accent,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${plan.actionTitle} · ${Translator.fill('{n} live', {'n': '$liveCount'})} · ${Translator.fill('day {d} of {n}', {
                        'd': '${plan.cycleDay}',
                        'n': '${plan.cycleLengthDays}',
                      })}',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: KalroColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      plan.feedLabel,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (onOpenGuide != null) ...[
                      const SizedBox(height: 4),
                      GestureDetector(
                        onTap: onOpenGuide,
                        child: Text(
                          'Open today’s field guide'.tr,
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: KalroColors.headerGreen,
                          ),
                        ),
                      ),
                    ],
                    if (canEdit) ...[
                      const SizedBox(height: 10),
                      FloorActionsBar(
                        batch: batch,
                        plan: plan,
                        repositories: repositories,
                        onChanged: onChanged,
                        canEdit: canEdit,
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
