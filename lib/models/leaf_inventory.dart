class LeafInventory {
  const LeafInventory({
    required this.mulberryKg,
    required this.castorKg,
    required this.kesseruKg,
    required this.updatedAt,
  });

  final double mulberryKg;
  final double castorKg;
  final double kesseruKg;
  final DateTime updatedAt;

  double get stockKg => mulberryKg + castorKg + kesseruKg;

  LeafInventory copyWith({
    double? mulberryKg,
    double? castorKg,
    double? kesseruKg,
    DateTime? updatedAt,
  }) {
    return LeafInventory(
      mulberryKg: mulberryKg ?? this.mulberryKg,
      castorKg: castorKg ?? this.castorKg,
      kesseruKg: kesseruKg ?? this.kesseruKg,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  static LeafInventory get empty => LeafInventory(
        mulberryKg: 0,
        castorKg: 0,
        kesseruKg: 0,
        updatedAt: DateTime(2020),
      );

  Map<String, dynamic> toJson() => {
        'mulberryKg': mulberryKg,
        'castorKg': castorKg,
        'kesseruKg': kesseruKg,
        'updatedAt': updatedAt.toIso8601String(),
      };

  factory LeafInventory.fromJson(Map<String, dynamic> json) => LeafInventory(
        mulberryKg: (json['mulberryKg'] as num?)?.toDouble() ?? 0,
        castorKg: (json['castorKg'] as num?)?.toDouble() ?? 0,
        kesseruKg: (json['kesseruKg'] as num?)?.toDouble() ?? 0,
        updatedAt: json['updatedAt'] == null
            ? DateTime.now()
            : DateTime.parse(json['updatedAt'] as String),
      );
}
