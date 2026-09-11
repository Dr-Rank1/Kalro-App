import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../models/batch.dart';
import '../../models/rearing_conditions.dart';
import '../../services/lifecycle_engine.dart';
import '../../theme/kalro_colors.dart';

/// Compact row tile for an active rearing batch.
class BatchHorizontalCard extends StatelessWidget {
  const BatchHorizontalCard({
    super.key,
    required this.batch,
    required this.lifecycleEngine,
    required this.onTap,
    this.observedStageDates,
    this.conditions,
  });

  final Batch batch;
  final LifecycleEngine lifecycleEngine;
  final VoidCallback onTap;
  final Map<String, DateTime>? observedStageDates;
  final RearingConditions? conditions;

  @override
  Widget build(BuildContext context) {
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
    final stageLabel = current?.label ?? 'Starting';
    final daysRunning = DateTime.now().difference(batch.startDate).inDays + 1;

    final detail = next != null
        ? [
            '$stageLabel · Next ${next.label} ${dateFormat.format(next.expectedDate)}',
            if (next.daysVsTypical != null && next.daysVsTypical != 0)
              next.daysVsTypical! > 0
                  ? '+${next.daysVsTypical}d'
                  : '${next.daysVsTypical}d',
          ].join(' ')
        : '$stageLabel · Day $daysRunning';

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
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: KalroColors.headerGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  batch.species.name == 'eri' ? Icons.eco_outlined : Icons.flutter_dash,
                  size: 22,
                  color: KalroColors.primaryGreen,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      batch.species.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      detail,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: KalroColors.textLight, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}
