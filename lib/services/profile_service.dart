import '../models/payment_direction.dart';
import '../models/payment_status.dart';
import '../models/profile_summary.dart';
import 'app_repositories.dart';
import 'inventory_service.dart';
import 'user_preferences.dart';

class ProfileService {
  const ProfileService();

  Future<ProfileSummary> load({
    required AppRepositories repositories,
    required UserPreferences userPreferences,
  }) async {
    const inventoryService = InventoryService();
    final inventory = await inventoryService.load(repositories);
    final payments = await repositories.payments.getAll();
    final purchases = await repositories.purchaseOrders.getAll();

    var pendingPayables = 0.0;
    for (final payment in payments) {
      if (payment.status == PaymentStatus.pending &&
          payment.direction == PaymentDirection.payable) {
        pendingPayables += payment.amount;
      }
    }

    return ProfileSummary(
      name: await userPreferences.getDisplayName(),
      org: await userPreferences.getOrgName(),
      id: await userPreferences.getUserId(),
      role: await userPreferences.getRole(),
      language: await userPreferences.getLanguage(),
      bombyxLarvaeCount: inventory.bombyxLarvaeCount,
      eriLarvaeCount: inventory.eriLarvaeCount,
      activeBatchCount: inventory.activeBatchCount,
      totalFeedGrams: inventory.bombyxFeedGrams + inventory.eriFeedGrams,
      pendingPayables: pendingPayables,
      totalPurchases: purchases.length,
    );
  }
}
