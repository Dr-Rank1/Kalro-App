import 'payment_direction.dart';
import 'payment_status.dart';

class PaymentRecord {
  PaymentRecord({
    required this.id,
    required this.counterparty,
    required this.description,
    required this.amount,
    required this.direction,
    required this.status,
    required this.recordedAt,
    this.settledAt,
    this.notes,
  });

  final String id;
  final String counterparty;
  final String description;
  final double amount;
  final PaymentDirection direction;
  final PaymentStatus status;
  final DateTime recordedAt;
  final DateTime? settledAt;
  final String? notes;

  bool get isPending => status == PaymentStatus.pending;

  PaymentRecord copyWith({
    String? counterparty,
    String? description,
    double? amount,
    PaymentDirection? direction,
    PaymentStatus? status,
    DateTime? recordedAt,
    DateTime? settledAt,
    String? notes,
  }) {
    return PaymentRecord(
      id: id,
      counterparty: counterparty ?? this.counterparty,
      description: description ?? this.description,
      amount: amount ?? this.amount,
      direction: direction ?? this.direction,
      status: status ?? this.status,
      recordedAt: recordedAt ?? this.recordedAt,
      settledAt: settledAt ?? this.settledAt,
      notes: notes ?? this.notes,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'counterparty': counterparty,
      'description': description,
      'amount': amount,
      'direction': direction.name,
      'status': status.name,
      'recordedAt': recordedAt.toIso8601String(),
      'settledAt': settledAt?.toIso8601String(),
      'notes': notes,
    };
  }

  factory PaymentRecord.fromJson(Map<String, dynamic> json) {
    return PaymentRecord(
      id: json['id'] as String,
      counterparty: json['counterparty'] as String,
      description: json['description'] as String,
      amount: (json['amount'] as num).toDouble(),
      direction: PaymentDirection.values.byName(json['direction'] as String),
      status: PaymentStatus.values.byName(json['status'] as String),
      recordedAt: DateTime.parse(json['recordedAt'] as String),
      settledAt: json['settledAt'] == null ? null : DateTime.parse(json['settledAt'] as String),
      notes: json['notes'] as String?,
    );
  }
}
