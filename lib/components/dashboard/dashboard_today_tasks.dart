import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/today_task.dart';
import '../../theme/kalro_colors.dart';

class DashboardTodayTasks extends StatelessWidget {
  const DashboardTodayTasks({
    super.key,
    required this.tasks,
    this.onTaskTap,
  });

  final List<TodayTask> tasks;
  final void Function(TodayTask task)? onTaskTap;

  @override
  Widget build(BuildContext context) {
    if (tasks.isEmpty) return const SizedBox.shrink();

    final shown = tasks.take(5).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          "Today's tasks",
          style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        ...shown.map((task) {
          final icon = switch (task.type) {
            TodayTaskType.feeding => Icons.restaurant,
            TodayTaskType.milestone => Icons.flag,
            TodayTaskType.environment => Icons.thermostat,
            TodayTaskType.mortalityCheck => Icons.health_and_safety,
          };

          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: KalroColors.divider),
            ),
            child: ListTile(
              leading: Icon(icon, color: KalroColors.headerGreen),
              title: Text(
                task.title,
                style: GoogleFonts.poppins(fontWeight: FontWeight.w500, fontSize: 14),
              ),
              subtitle: Text(
                task.subtitle,
                style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
              ),
              onTap: onTaskTap == null ? null : () => onTaskTap!(task),
            ),
          );
        }),
      ],
    );
  }
}
