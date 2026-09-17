import 'dart:io';

import 'batch_repository.dart';
import 'cocoon_harvest_repository.dart';
import 'environment_log_repository.dart';
import 'farm_store.dart';
import 'feed_log_repository.dart';
import 'inventory_settings_repository.dart';
import 'leaf_inventory_repository.dart';
import 'leaf_movement_repository.dart';
import 'milestone_observation_repository.dart';
import 'mortality_log_repository.dart';
import 'payment_repository.dart';
import 'producer_repository.dart';
import 'purchase_order_repository.dart';

class AppRepositories {
  factory AppRepositories({Directory? storageDirectory, FarmStore? store}) {
    final farmStore = store ?? FarmStore(directory: storageDirectory);
    return AppRepositories._(storageDirectory, farmStore);
  }

  AppRepositories._(Directory? storageDirectory, this.store)
      : batches = BatchRepository(
          storageDirectory: storageDirectory,
          store: store,
        ),
        feedLogs = FeedLogRepository(
          storageDirectory: storageDirectory,
          store: store,
        ),
        mortalityLogs = MortalityLogRepository(
          storageDirectory: storageDirectory,
          store: store,
        ),
        environmentLogs = EnvironmentLogRepository(
          storageDirectory: storageDirectory,
          store: store,
        ),
        cocoonHarvests = CocoonHarvestRepository(
          storageDirectory: storageDirectory,
          store: store,
        ),
        milestoneObservations = MilestoneObservationRepository(
          storageDirectory: storageDirectory,
          store: store,
        ),
        leafInventory = LeafInventoryRepository(
          storageDirectory: storageDirectory,
          store: store,
        ),
        leafMovements = LeafMovementRepository(
          storageDirectory: storageDirectory,
          store: store,
        ),
        payments = PaymentRepository(
          storageDirectory: storageDirectory,
          store: store,
        ),
        producers = ProducerRepository(
          storageDirectory: storageDirectory,
          store: store,
        ),
        purchaseOrders = PurchaseOrderRepository(
          storageDirectory: storageDirectory,
          store: store,
        ),
        inventorySettings = InventorySettingsRepository(
          storageDirectory: storageDirectory,
          store: store,
        );

  final FarmStore store;
  final BatchRepository batches;
  final FeedLogRepository feedLogs;
  final MortalityLogRepository mortalityLogs;
  final EnvironmentLogRepository environmentLogs;
  final CocoonHarvestRepository cocoonHarvests;
  final MilestoneObservationRepository milestoneObservations;
  final LeafInventoryRepository leafInventory;
  final LeafMovementRepository leafMovements;
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
    leafMovements.invalidateCache();
    payments.invalidateCache();
    producers.invalidateCache();
    purchaseOrders.invalidateCache();
    inventorySettings.invalidateCache();
  }
}
