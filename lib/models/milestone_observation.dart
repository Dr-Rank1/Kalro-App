class MilestoneObservation {
  MilestoneObservation({
    required this.id,
    required this.batchId,
    required this.stageKey,
    required this.observedDate,
    required this.recordedAt,
  });

  final String id;
  final String batchId;
  final String stageKey;
  final DateTime observedDate;
  final DateTime recordedAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'batchId': batchId,
        'stageKey': stageKey,
        'observedDate': observedDate.toIso8601String(),
        'recordedAt': recordedAt.toIso8601String(),
      };

  factory MilestoneObservation.fromJson(Map<String, dynamic> json) =>
      MilestoneObservation(
        id: json['id'] as String,
        batchId: json['batchId'] as String,
        stageKey: json['stageKey'] as String,
        observedDate: DateTime.parse(json['observedDate'] as String),
        recordedAt: DateTime.parse(json['recordedAt'] as String),
      );
}
