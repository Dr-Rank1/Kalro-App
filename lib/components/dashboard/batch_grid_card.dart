import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/batch.dart';
import '../../services/lifecycle_engine.dart';
import '../../theme/kalro_colors.dart';

class BatchGridCard extends StatelessWidget {
  const BatchGridCard({
    super.key,
    required this.batch,
    required this.engine,
    required this.observations,
    required this.onTap,
  });

  final Batch batch;
  final LifecycleEngine engine;
  final Map<String, DateTime>? observations;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final currentMilestone = engine.currentStage(batch, observedStageDates: observations ?? {});
    
    
    // Calculate simple progress percentage (e.g. out of 5 main stages: Egg, Instar 1-5, Cocoon)
    // For simplicity, we just use a generic percentage or mock based on days since start.
    final daysElapsed = DateTime.now().difference(batch.startDate).inDays;
    final totalExpectedDays = 30; // Approx
    final progress = (daysElapsed / totalExpectedDays).clamp(0.0, 1.0);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: KalroColors.divider),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    'Batch ${batch.id.substring(0, 4).toUpperCase()}',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Container(
                  width: 12,
                  height: 12,
                  decoration: const BoxDecoration(
                    color: Colors.green, // healthy
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Expanded(
              child: Center(
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 64,
                      height: 64,
                      child: CircularProgressIndicator(
                        value: progress,
                        backgroundColor: KalroColors.divider,
                        color: KalroColors.primaryGreen,
                        strokeWidth: 6,
                      ),
                    ),
                    Text(
                      '${(progress * 100).toInt()}%',
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              currentMilestone?.label ?? 'Started',
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: KalroColors.textMuted,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              '${batch.eggCount} larvae',
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
