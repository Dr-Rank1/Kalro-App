enum BatchAlertSeverity { info, warning, critical }

enum BatchAlertType {
  mortality,
  environment,
  feeding,
  milestone,
  survival,
}

class BatchAlert {
  const BatchAlert({
    required this.type,
    required this.severity,
    required this.title,
    required this.message,
    this.batchId,
  });

  final BatchAlertType type;
  final BatchAlertSeverity severity;
  final String title;
  final String message;
  final String? batchId;
}
