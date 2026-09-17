import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/today_task.dart';
import '../../theme/kalro_colors.dart';
import '../../l10n/translator.dart';

class DashboardTodayTasks extends StatelessWidget {
  DashboardTodayTasks({super.key, required this.tasks, this.onTaskTap});

  final List<TodayTask> tasks;
  final void Function(TodayTask task)? onTaskTap;

  @override
  Widget build(BuildContext context) {
    if (tasks.isEmpty) return const SizedBox.shrink();

    final shown = tasks.take(6).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          "Today's tasks".tr,
          style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 10),
        ...shown.map((task) {
          final (icon, color) = switch (task.type) {
            TodayTaskType.feeding => (Icons.eco_outlined, KalroColors.leaf),
            TodayTaskType.milestone => (
              Icons.flag_outlined,
              KalroColors.headerGreen,
            ),
            TodayTaskType.environment => (
              Icons.thermostat_outlined,
              KalroColors.info,
            ),
            TodayTaskType.mortalityCheck => (
              Icons.health_and_safety_outlined,
              KalroColors.rest,
            ),
          };
          final accent = task.isOverdue ? KalroColors.danger : color;

          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              child: InkWell(
                onTap: onTaskTap == null ? null : () => onTaskTap!(task),
                borderRadius: BorderRadius.circular(16),
                child: Ink(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: KalroColors.softShadow,
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 5,
                        height: 72,
                        decoration: BoxDecoration(
                          color: accent,
                          borderRadius: const BorderRadius.horizontal(
                            left: Radius.circular(16),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: accent.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(icon, color: accent, size: 20),
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(
                            right: 12,
                            top: 12,
                            bottom: 12,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                task.title.tr,
                                style: GoogleFonts.poppins(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                task.subtitle.tr,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  color: KalroColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.only(right: 8),
                        child: Icon(
                          Icons.chevron_right,
                          color: KalroColors.textLight,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }),
      ],
    );
  }
}
