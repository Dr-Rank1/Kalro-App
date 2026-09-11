class MortalityLog {
  MortalityLog({
    required this.id,
    required this.batchId,
    required this.recordedAt,
    required this.count,
    this.reason,
    this.disease,
    this.treatment,
    this.notes,
    this.isolated = false,
  });

  final String id;
  final String batchId;
  final DateTime recordedAt;
  final int count;
  final String? reason;
  final String? disease;
  final String? treatment;
  final String? notes;
  final bool isolated;

  Map<String, dynamic> toJson() => {
        'id': id,
        'batchId': batchId,
        'recordedAt': recordedAt.toIso8601String(),
        'count': count,
        'reason': reason,
        'disease': disease,
        'treatment': treatment,
        'notes': notes,
        'isolated': isolated,
      };

  factory MortalityLog.fromJson(Map<String, dynamic> json) => MortalityLog(
        id: json['id'] as String,
        batchId: json['batchId'] as String,
        recordedAt: DateTime.parse(json['recordedAt'] as String),
        count: json['count'] as int,
        reason: json['reason'] as String?,
        disease: json['disease'] as String?,
        treatment: json['treatment'] as String?,
        notes: json['notes'] as String?,
        isolated: json['isolated'] as bool? ?? false,
      );
}
