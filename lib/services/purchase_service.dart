import '../models/purchase_summary.dart';
import 'app_repositories.dart';

class PurchaseService {
  const PurchaseService();

  Future<PurchaseSummary> load(AppRepositories repositories) async {
    final producers = [...await repositories.producers.getAll()]
      ..sort((a, b) => a.name.compareTo(b.name));
    final orders = await repositories.purchaseOrders.getAll();

    final recent = [...orders]..sort((a, b) => b.orderedAt.compareTo(a.orderedAt));

    var totalSpend = 0.0;
    for (final order in orders) {
      totalSpend += order.amount ?? 0;
    }

    return PurchaseSummary(
      producers: producers,
      recentOrders: recent.take(10).toList(),
      totalOrders: orders.length,
      totalSpend: totalSpend,
    );
  }
}
