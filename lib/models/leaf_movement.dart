import '../l10n/translator.dart';

enum LeafHost {
  mulberry('Mulberry'),
  castor('Castor'),
  kesseru('Kesseru');

  const LeafHost(this._label);
  final String _label;
  String get label => _label.tr;
}

enum LeafMovementKind {
  bought('Bought'),
  cut('Cut / harvested'),
  feed('Fed to worms'),
  adjust('Stock adjust');

  const LeafMovementKind(this._label);
  final String _label;
  String get label => _label.tr;
}

class LeafMovement {
  const LeafMovement({
    required this.id,
    required this.recordedAt,
    required this.host,
    required this.kg,
    required this.kind,
    this.batchId,
    this.notes,
  });

  final String id;
  final DateTime recordedAt;
  final LeafHost host;
  final double kg;
  final LeafMovementKind kind;
  final String? batchId;
  final String? notes;

  bool get isIn => kg > 0;

  Map<String, dynamic> toJson() => {
        'id': id,
        'recordedAt': recordedAt.toIso8601String(),
        'host': host.name,
        'kg': kg,
        'kind': kind.name,
        'batchId': batchId,
        'notes': notes,
      };

  factory LeafMovement.fromJson(Map<String, dynamic> json) => LeafMovement(
        id: json['id'] as String,
        recordedAt: DateTime.parse(json['recordedAt'] as String),
        host: LeafHost.values.byName(json['host'] as String),
        kg: (json['kg'] as num).toDouble(),
        kind: LeafMovementKind.values.byName(json['kind'] as String),
        batchId: json['batchId'] as String?,
        notes: json['notes'] as String?,
      );
}
