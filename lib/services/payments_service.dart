import '../models/payment_direction.dart';
import '../models/payment_status.dart';
import '../models/payments_summary.dart';
import 'app_repositories.dart';

class PaymentsService {
  const PaymentsService();

  Future<PaymentsSummary> load(AppRepositories repositories) async {
    final records = await repositories.payments.getAll();

    var totalReceivable = 0.0;
    var totalPayable = 0.0;

    for (final record in records) {
      if (record.status != PaymentStatus.pending) continue;
      if (record.direction == PaymentDirection.receivable) {
        totalReceivable += record.amount;
      } else {
        totalPayable += record.amount;
      }
    }

    final recent = [...records]
      ..sort((a, b) => b.recordedAt.compareTo(a.recordedAt));

    return PaymentsSummary(
      totalReceivable: totalReceivable,
      totalPayable: totalPayable,
      pendingSettlements: totalReceivable + totalPayable,
      recentRecords: recent.take(20).toList(),
    );
  }
}
