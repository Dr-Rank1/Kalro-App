class InventorySettings {
  const InventorySettings({
    required this.bombyxPrice,
    required this.eriPrice,
  });

  final double bombyxPrice;
  final double eriPrice;

  InventorySettings copyWith({
    double? bombyxPrice,
    double? eriPrice,
  }) {
    return InventorySettings(
      bombyxPrice: bombyxPrice ?? this.bombyxPrice,
      eriPrice: eriPrice ?? this.eriPrice,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'bombyxPrice': bombyxPrice,
      'eriPrice': eriPrice,
    };
  }

  factory InventorySettings.fromJson(Map<String, dynamic> json) {
    return InventorySettings(
      bombyxPrice: (json['bombyxPrice'] as num).toDouble(),
      eriPrice: (json['eriPrice'] as num).toDouble(),
    );
  }

  static const defaults = InventorySettings(bombyxPrice: 8500, eriPrice: 1500);
}
