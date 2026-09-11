class CocoonHarvest {
  CocoonHarvest({
    required this.id,
    required this.batchId,
    required this.harvestDate,
    required this.cocoonCount,
    required this.totalWeightGrams,
    this.defectiveCount = 0,
    this.shellWeightGrams,
    this.filamentLengthCm,
    this.moisturePercent,
    this.notes,
  });

  final String id;
  final String batchId;
  final DateTime harvestDate;
  final int cocoonCount;
  final double totalWeightGrams;
  final int defectiveCount;
  final double? shellWeightGrams;
  final double? filamentLengthCm;
  final double? moisturePercent;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'id': id,
        'batchId': batchId,
        'harvestDate': harvestDate.toIso8601String(),
        'cocoonCount': cocoonCount,
        'totalWeightGrams': totalWeightGrams,
        'defectiveCount': defectiveCount,
        'shellWeightGrams': shellWeightGrams,
        'filamentLengthCm': filamentLengthCm,
        'moisturePercent': moisturePercent,
        'notes': notes,
      };

  factory CocoonHarvest.fromJson(Map<String, dynamic> json) => CocoonHarvest(
        id: json['id'] as String,
        batchId: json['batchId'] as String,
        harvestDate: DateTime.parse(json['harvestDate'] as String),
        cocoonCount: json['cocoonCount'] as int,
        totalWeightGrams: (json['totalWeightGrams'] as num).toDouble(),
        defectiveCount: json['defectiveCount'] as int? ?? 0,
        shellWeightGrams: json['shellWeightGrams'] == null
            ? null
            : (json['shellWeightGrams'] as num).toDouble(),
        filamentLengthCm: json['filamentLengthCm'] == null
            ? null
            : (json['filamentLengthCm'] as num).toDouble(),
        moisturePercent: json['moisturePercent'] == null
            ? null
            : (json['moisturePercent'] as num).toDouble(),
        notes: json['notes'] as String?,
      );
}
