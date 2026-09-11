class FeedLog {
  FeedLog({
    required this.id,
    required this.batchId,
    required this.recordedAt,
    required this.feedType,
    required this.quantityGrams,
    this.feedingStage,
    this.notes,
  });

  final String id;
  final String batchId;
  final DateTime recordedAt;
  final String feedType;
  final double quantityGrams;
  final String? feedingStage;
  final String? notes;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'batchId': batchId,
      'recordedAt': recordedAt.toIso8601String(),
      'feedType': feedType,
      'quantityGrams': quantityGrams,
      'feedingStage': feedingStage,
      'notes': notes,
    };
  }

  factory FeedLog.fromJson(Map<String, dynamic> json) {
    return FeedLog(
      id: json['id'] as String,
      batchId: json['batchId'] as String,
      recordedAt: DateTime.parse(json['recordedAt'] as String),
      feedType: json['feedType'] as String,
      quantityGrams: (json['quantityGrams'] as num).toDouble(),
      feedingStage: json['feedingStage'] as String?,
      notes: json['notes'] as String?,
    );
  }
}
