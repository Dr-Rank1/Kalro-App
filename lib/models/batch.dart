import 'batch_status.dart';
import 'species.dart';

class Batch {
  Batch({
    required this.id,
    required this.species,
    required this.startDate,
    required this.eggCount,
    required this.status,
    required this.createdAt,
    this.strain,
    this.location,
    this.caretaker,
    this.feedMaterial,
    this.eggSource,
    this.rearingType,
    this.batchTag,
  });

  final String id;
  final Species species;
  final DateTime startDate;
  final int eggCount;
  final BatchStatus status;
  final DateTime createdAt;
  final String? strain;
  final String? location;
  final String? caretaker;
  final String? feedMaterial;
  final String? eggSource;
  final String? rearingType;
  final String? batchTag;

  String get displayTag =>
      batchTag?.trim().isNotEmpty == true ? batchTag! : 'BATCH-${startDate.year}-${species == Species.bombyx ? "BOM" : "ERI"}-${id.length >= 4 ? id.substring(0, 4).toUpperCase() : id.toUpperCase()}';

  Batch copyWith({
    Species? species,
    DateTime? startDate,
    int? eggCount,
    BatchStatus? status,
    String? strain,
    String? location,
    String? caretaker,
    String? feedMaterial,
    String? eggSource,
    String? rearingType,
    String? batchTag,
  }) {
    return Batch(
      id: id,
      species: species ?? this.species,
      startDate: startDate ?? this.startDate,
      eggCount: eggCount ?? this.eggCount,
      status: status ?? this.status,
      createdAt: createdAt,
      strain: strain ?? this.strain,
      location: location ?? this.location,
      caretaker: caretaker ?? this.caretaker,
      feedMaterial: feedMaterial ?? this.feedMaterial,
      eggSource: eggSource ?? this.eggSource,
      rearingType: rearingType ?? this.rearingType,
      batchTag: batchTag ?? this.batchTag,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'species': species.name,
      'startDate': startDate.toIso8601String(),
      'eggCount': eggCount,
      'status': status.name,
      'createdAt': createdAt.toIso8601String(),
      'strain': strain,
      'location': location,
      'caretaker': caretaker,
      'feedMaterial': feedMaterial,
      'eggSource': eggSource,
      'rearingType': rearingType,
      'batchTag': batchTag,
    };
  }

  factory Batch.fromJson(Map<String, dynamic> json) {
    return Batch(
      id: json['id'] as String,
      species: Species.values.byName(json['species'] as String),
      startDate: DateTime.parse(json['startDate'] as String),
      eggCount: json['eggCount'] as int,
      status: BatchStatus.values.byName(json['status'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      strain: json['strain'] as String?,
      location: json['location'] as String?,
      caretaker: json['caretaker'] as String?,
      feedMaterial: json['feedMaterial'] as String?,
      eggSource: json['eggSource'] as String?,
      rearingType: json['rearingType'] as String?,
      batchTag: json['batchTag'] as String?,
    );
  }
}
