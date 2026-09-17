import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/batch.dart';
import '../../models/rearing_conditions.dart';
import '../../services/lifecycle_engine.dart';
import '../../services/lifecycle_profiles.dart';
import '../../services/rearing_day_service.dart';
import '../../theme/kalro_colors.dart';

import 'package:kalro/l10n/translator.dart';

class BatchGridCard extends StatelessWidget {
  BatchGridCard({
    super.key,
    required this.batch,
    required this.engine,
    required this.observations,
    required this.onTap,
    this.conditions,
    this.liveCount,
  });

  final Batch batch;
  final LifecycleEngine engine;
  final Map<String, DateTime>? observations;
  final RearingConditions? conditions;
  final int? liveCount;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final plan = RearingDayService().planFor(
      batch,
      observedStageDates: observations,
      conditions: conditions,
      liveCount: liveCount,
    );
    final current = engine.currentStage(
      batch,
      observedStageDates: observations,
      conditions: conditions,
    );
    final progress =
        plan?.progress ??
        (DateTime.now().difference(batch.startDate).inDays /
                LifecycleProfiles.forSpecies(batch.species).totalDays)
            .clamp(0.0, 1.0);
    final stop = plan?.stopFeeding ?? false;
    final harvest = plan?.isHarvestWork ?? false;
    final accent = harvest
        ? KalroColors.harvest
        : stop
        ? KalroColors.rest
        : KalroColors.primaryGreen;

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Ink(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            boxShadow: KalroColors.softShadow,
            border: Border.all(color: accent.withValues(alpha: 0.18)),
          ),
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
                        fontSize: 13,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: accent.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      harvest
                          ? 'Harvest'.tr
                          : stop
                          ? 'Rest'.tr
                          : 'Feed'.tr,
                      style: GoogleFonts.poppins(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: accent,
                      ),
                    ),
                  ),
                ],
              ),
              const Spacer(),
              Center(
                child: SizedBox(
                  width: 72,
                  height: 72,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox.expand(
                        child: CircularProgressIndicator(
                          value: progress,
                          backgroundColor: KalroColors.divider,
                          color: accent,
                          strokeWidth: 7,
                        ),
                      ),
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            '${plan?.cycleDay ?? DateTime.now().difference(batch.startDate).inDays + 1}',
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w700,
                              fontSize: 16,
                              height: 1.1,
                            ),
                          ),
                          Text(
                            'day'.tr,
                            style: GoogleFonts.poppins(
                              fontSize: 10,
                              color: KalroColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const Spacer(),
              Text(
                plan?.actionTitle ?? current?.label.tr ?? 'Started'.tr,
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: KalroColors.textDark,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                plan?.feedLabel ?? '${liveCount ?? batch.eggCount} larvae'.tr,
                style: GoogleFonts.poppins(
                  fontSize: 11,
                  color: KalroColors.textMuted,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
