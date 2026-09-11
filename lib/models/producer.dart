import 'producer_type.dart';

class Producer {
  Producer({
    required this.id,
    required this.name,
    required this.type,
    required this.createdAt,
    this.location,
    this.contactPhone,
    this.species,
    this.notes,
  });

  final String id;
  final String name;
  final ProducerType type;
  final DateTime createdAt;
  final String? location;
  final String? contactPhone;
  final String? species;
  final String? notes;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type.name,
      'createdAt': createdAt.toIso8601String(),
      'location': location,
      'contactPhone': contactPhone,
      'species': species,
      'notes': notes,
    };
  }

  factory Producer.fromJson(Map<String, dynamic> json) {
    return Producer(
      id: json['id'] as String,
      name: json['name'] as String,
      type: ProducerType.values.byName(json['type'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      location: json['location'] as String?,
      contactPhone: json['contactPhone'] as String?,
      species: json['species'] as String?,
      notes: json['notes'] as String?,
    );
  }
}
