import 'producer.dart';
import 'purchase_order.dart';

class PurchaseSummary {
  const PurchaseSummary({
    required this.producers,
    required this.recentOrders,
    required this.totalOrders,
    required this.totalSpend,
  });

  final List<Producer> producers;
  final List<PurchaseOrder> recentOrders;
  final int totalOrders;
  final double totalSpend;

  bool get hasProducers => producers.isNotEmpty;
}
