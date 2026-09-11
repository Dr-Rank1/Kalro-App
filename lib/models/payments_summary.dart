import 'payment_record.dart';

class PaymentsSummary {
  const PaymentsSummary({
    required this.totalReceivable,
    required this.totalPayable,
    required this.pendingSettlements,
    required this.recentRecords,
  });

  final double totalReceivable;
  final double totalPayable;
  final double pendingSettlements;
  final List<PaymentRecord> recentRecords;

  bool get isEmpty => recentRecords.isEmpty;
}
