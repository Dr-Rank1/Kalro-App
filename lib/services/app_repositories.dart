import 'dart:io';

import 'batch_repository.dart';
import 'cocoon_harvest_repository.dart';
import 'environment_log_repository.dart';
import 'feed_log_repository.dart';
import 'inventory_settings_repository.dart';
import 'leaf_inventory_repository.dart';
import 'milestone_observation_repository.dart';
import 'mortality_log_repository.dart';
import 'payment_repository.dart';
import 'producer_repository.dart';
import 'purchase_order_repository.dart';

class AppRepositories {
  AppRepositories({Directory? storageDirectory})
      : batches = BatchRepository(storageDirectory: storageDirectory),
        feedLogs = FeedLogRepository(storageDirectory: storageDirectory),
        mortalityLogs = MortalityLogRepository(storageDirectory: storageDirectory),
        environmentLogs =
            EnvironmentLogRepository(storageDirectory: storageDirectory),
        cocoonHarvests =
            CocoonHarvestRepository(storageDirectory: storageDirectory),
        milestoneObservations =
            MilestoneObservationRepository(storageDirectory: storageDirectory),
        leafInventory = LeafInventoryRepository(storageDirectory: storageDirectory),
        payments = PaymentRepository(storageDirectory: storageDirectory),
        producers = ProducerRepository(storageDirectory: storageDirectory),
        purchaseOrders = PurchaseOrderRepository(storageDirectory: storageDirectory),
        inventorySettings = InventorySettingsRepository(storageDirectory: storageDirectory);

  final BatchRepository batches;
  final FeedLogRepository feedLogs;
  final MortalityLogRepository mortalityLogs;
  final EnvironmentLogRepository environmentLogs;
  final CocoonHarvestRepository cocoonHarvests;
  final MilestoneObservationRepository milestoneObservations;
  final LeafInventoryRepository leafInventory;
  final PaymentRepository payments;
  final ProducerRepository producers;
  final PurchaseOrderRepository purchaseOrders;
  final InventorySettingsRepository inventorySettings;

  Future<Directory> storageDirectory() => batches.storageDirectory();

  void invalidateCaches() {
    batches.invalidateCache();
    feedLogs.invalidateCache();
    mortalityLogs.invalidateCache();
    environmentLogs.invalidateCache();
    cocoonHarvests.invalidateCache();
    milestoneObservations.invalidateCache();
    leafInventory.invalidateCache();
    payments.invalidateCache();
    producers.invalidateCache();
    purchaseOrders.invalidateCache();
    inventorySettings.invalidateCache();
  }
}
