import '../utils/file_utils.dart';
import 'dart:convert';
import 'dart:io';

import 'app_repositories.dart';

/// Exports and restores farm data as a single JSON file for CRC / sharing.
class BackupService {
  const BackupService();

  static const version = 1;

  Future<File> exportBackup(AppRepositories repositories) async {
    final payload = await _collectPayload(repositories);
    final storageDir = await repositories.storageDirectory();
    final exportsDir = Directory('${storageDir.path}/kalro_exports');
    if (!await exportsDir.exists()) {
      await exportsDir.create(recursive: true);
    }

    final timestamp = DateTime.now().toIso8601String().replaceAll(':', '-');
    final file = File('${exportsDir.path}/kalro_backup_$timestamp.json');
    await FileUtils.atomicWriteAsString(file, jsonEncode(payload));
    return file;
  }

  Future<void> importBackup(AppRepositories repositories, File file) async {
    final contents = await file.readAsString();
    final payload = jsonDecode(contents) as Map<String, dynamic>;

    if (payload['version'] != version) {
      throw FormatException('Unsupported backup version: ${payload['version']}');
    }

    final data = payload['data'] as Map<String, dynamic>;
    final store = repositories.store;

    await store.replaceCollection('batches', _maps(data['batches']));
    await store.replaceCollection('feed_logs', _maps(data['feedLogs']));
    await store.replaceCollection('mortality_logs', _maps(data['mortalityLogs']));
    await store.replaceCollection(
      'environment_logs',
      _maps(data['environmentLogs']),
    );
    await store.replaceCollection(
      'cocoon_harvests',
      _maps(data['cocoonHarvests']),
    );
    await store.replaceCollection(
      'milestone_observations',
      _maps(data['milestoneObservations']),
    );
    await store.replaceCollection('payments', _maps(data['payments']));
    await store.replaceCollection('producers', _maps(data['producers']));
    await store.replaceCollection(
      'purchase_orders',
      _maps(data['purchaseOrders']),
    );
    await store.replaceCollection(
      'leaf_movements',
      _maps(data['leafMovements']),
    );

    final settings = data['inventorySettings'];
    if (settings is Map) {
      await store.putSingleton(
        'inventory_settings',
        Map<String, dynamic>.from(settings),
      );
    }
    final leaf = data['leafInventory'];
    if (leaf is Map) {
      await store.putSingleton(
        'leaf_inventory',
        Map<String, dynamic>.from(leaf),
      );
    }

    repositories.invalidateCaches();
  }

  Future<Map<String, dynamic>> _collectPayload(AppRepositories repositories) async {
    return {
      'version': version,
      'exportedAt': DateTime.now().toIso8601String(),
      'data': {
        'batches': (await repositories.batches.getAll()).map((b) => b.toJson()).toList(),
        'feedLogs': (await repositories.feedLogs.getAll()).map((l) => l.toJson()).toList(),
        'mortalityLogs':
            (await repositories.mortalityLogs.getAll()).map((l) => l.toJson()).toList(),
        'environmentLogs':
            (await repositories.environmentLogs.getAll()).map((l) => l.toJson()).toList(),
        'cocoonHarvests':
            (await repositories.cocoonHarvests.getAll()).map((h) => h.toJson()).toList(),
        'milestoneObservations': (await repositories.milestoneObservations.getAll())
            .map((o) => o.toJson())
            .toList(),
        'payments': (await repositories.payments.getAll()).map((p) => p.toJson()).toList(),
        'producers': (await repositories.producers.getAll()).map((p) => p.toJson()).toList(),
        'purchaseOrders':
            (await repositories.purchaseOrders.getAll()).map((o) => o.toJson()).toList(),
        'inventorySettings': (await repositories.inventorySettings.get()).toJson(),
        'leafInventory': (await repositories.leafInventory.get()).toJson(),
        'leafMovements':
            (await repositories.leafMovements.getAll()).map((m) => m.toJson()).toList(),
      },
    };
  }

  List<Map<String, dynamic>> _maps(dynamic data) {
    if (data is! List) return [];
    return [
      for (final item in data)
        if (item is Map) Map<String, dynamic>.from(item),
    ];
  }
}
