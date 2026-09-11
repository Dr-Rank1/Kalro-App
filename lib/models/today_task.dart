enum TodayTaskType { feeding, milestone, environment, mortalityCheck }

class TodayTask {
  const TodayTask({
    required this.type,
    required this.title,
    required this.subtitle,
    required this.batchId,
    this.isOverdue = false,
  });

  final TodayTaskType type;
  final String title;
  final String subtitle;
  final String batchId;
  final bool isOverdue;
}
