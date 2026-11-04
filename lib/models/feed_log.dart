class FeedLog {
  FeedLog({
    required this.id,
    required this.batchId,
    required this.recordedAt,
    required this.feedType,
    required this.quantityGrams,
    this.feedingStage,
    this.notes,
    this.isSkipped = false,
    this.skipReason,
  });

  final String id;
  final String batchId;
  final DateTime recordedAt;
  final String feedType;
  final double quantityGrams;
  final String? feedingStage;
  final String? notes;
  final bool isSkipped;
  final String? skipReason;

  bool get wasSkipped =>
      isSkipped || (quantityGrams <= 0 && skipReason != null && skipReason!.isNotEmpty);

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'batchId': batchId,
      'recordedAt': recordedAt.toIso8601String(),
      'feedType': feedType,
      'quantityGrams': quantityGrams,
      'feedingStage': feedingStage,
      'notes': notes,
      'isSkipped': isSkipped,
      'skipReason': skipReason,
    };
  }

  factory FeedLog.fromJson(Map<String, dynamic> json) {
    final quantity = (json['quantityGrams'] as num).toDouble();
    final isExplicitSkipped = json['isSkipped'] as bool?;
    final reason = json['skipReason'] as String?;
    final skipped = isExplicitSkipped ?? (quantity <= 0 && reason != null && reason.isNotEmpty);

    return FeedLog(
      id: json['id'] as String,
      batchId: json['batchId'] as String,
      recordedAt: DateTime.parse(json['recordedAt'] as String),
      feedType: json['feedType'] as String,
      quantityGrams: quantity,
      feedingStage: json['feedingStage'] as String?,
      notes: json['notes'] as String?,
      isSkipped: skipped,
      skipReason: reason,
    );
  }
}
