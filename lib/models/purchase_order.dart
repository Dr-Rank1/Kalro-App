import 'species.dart';

class PurchaseOrder {
  PurchaseOrder({
    required this.id,
    required this.producerId,
    required this.producerName,
    required this.itemDescription,
    required this.quantity,
    required this.unit,
    required this.orderedAt,
    this.amount,
    this.species,
    this.notes,
    this.paymentRecordId,
  });

  final String id;
  final String producerId;
  final String producerName;
  final String itemDescription;
  final double quantity;
  final String unit;
  final DateTime orderedAt;
  final double? amount;
  final Species? species;
  final String? notes;
  final String? paymentRecordId;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'producerId': producerId,
      'producerName': producerName,
      'itemDescription': itemDescription,
      'quantity': quantity,
      'unit': unit,
      'orderedAt': orderedAt.toIso8601String(),
      'amount': amount,
      'species': species?.name,
      'notes': notes,
      'paymentRecordId': paymentRecordId,
    };
  }

  factory PurchaseOrder.fromJson(Map<String, dynamic> json) {
    final speciesName = json['species'] as String?;
    return PurchaseOrder(
      id: json['id'] as String,
      producerId: json['producerId'] as String,
      producerName: json['producerName'] as String,
      itemDescription: json['itemDescription'] as String,
      quantity: (json['quantity'] as num).toDouble(),
      unit: json['unit'] as String,
      orderedAt: DateTime.parse(json['orderedAt'] as String),
      amount: json['amount'] == null ? null : (json['amount'] as num).toDouble(),
      species: speciesName == null ? null : Species.values.byName(speciesName),
      notes: json['notes'] as String?,
      paymentRecordId: json['paymentRecordId'] as String?,
    );
  }
}
