import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/lifecycle_milestone.dart';
import '../../theme/kalro_colors.dart';

class MilestoneTimeline extends StatelessWidget {
  MilestoneTimeline({
    super.key,
    required this.milestones,
    this.onMarkObserved,
  });

  final List<LifecycleMilestone> milestones;
  final void Function(LifecycleMilestone milestone)? onMarkObserved;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat.MMMd();

    return Card(
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: KalroColors.divider),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: NeverScrollableScrollPhysics(),
        itemCount: milestones.length,
        separatorBuilder: (context, index) => Divider(height: 1),
        itemBuilder: (context, index) {
          final milestone = milestones[index];
          final colorScheme = Theme.of(context).colorScheme;
          final icon = milestone.isObserved
              ? Icons.check_circle
              : milestone.isToday
                  ? Icons.today
                  : milestone.isPast
                      ? Icons.check_circle_outline
                      : Icons.radio_button_unchecked;
          final iconColor = milestone.isObserved
              ? colorScheme.primary
              : milestone.isToday
                  ? colorScheme.primary
                  : milestone.isPast
                      ? colorScheme.outline
                      : colorScheme.onSurfaceVariant;

          final dateLabel = milestone.isObserved
              ? 'Observed ${dateFormat.format(milestone.observedDate!)}'
              : [
                  dateFormat.format(milestone.expectedDate),
                  if (milestone.daysVsTypical != null && milestone.daysVsTypical != 0)
                    milestone.daysVsTypical! > 0
                        ? '+${milestone.daysVsTypical}d vs typical'
                        : '${milestone.daysVsTypical}d vs typical',
                ].join(' · ');

          return ListTile(
            leading: Icon(icon, color: iconColor),
            title: Text(milestone.label),
            subtitle: Text(dateLabel),
            trailing: onMarkObserved != null && milestone.stageKey != null
                ? TextButton(
                    onPressed: () => onMarkObserved!(milestone),
                    child: Text(milestone.isObserved ? 'Update' : 'Mark'),
                  )
                : null,
          );
        },
      ),
    );
  }
}
