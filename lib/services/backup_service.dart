import '../utils/file_utils.dart';
import 'dart:convert';
import 'dart:io';

import 'app_repositories.dart';

/// Exports and restores all local JSON data as a single backup file.
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
    final storageDir = await repositories.storageDirectory();

    await _writeJson(storageDir, 'batches.json', data['batches']);
    await _writeJson(storageDir, 'feed_logs.json', data['feedLogs']);
    await _writeJson(storageDir, 'mortality_logs.json', data['mortalityLogs']);
    await _writeJson(storageDir, 'environment_logs.json', data['environmentLogs']);
    await _writeJson(storageDir, 'cocoon_harvests.json', data['cocoonHarvests']);
    await _writeJson(storageDir, 'milestone_observations.json', data['milestoneObservations']);
    await _writeJson(storageDir, 'payments.json', data['payments']);
    await _writeJson(storageDir, 'producers.json', data['producers']);
    await _writeJson(storageDir, 'purchase_orders.json', data['purchaseOrders']);
    await _writeObject(storageDir, 'inventory_settings.json', data['inventorySettings']);
    await _writeObject(storageDir, 'leaf_inventory.json', data['leafInventory']);
    await _writeJson(storageDir, 'leaf_movements.json', data['leafMovements']);

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

  Future<void> _writeJson(Directory directory, String fileName, dynamic data) async {
    final file = File('${directory.path}/$fileName');
    await FileUtils.atomicWriteAsString(file, jsonEncode(data ?? []));
  }

  Future<void> _writeObject(Directory directory, String fileName, dynamic data) async {
    final file = File('${directory.path}/$fileName');
    await FileUtils.atomicWriteAsString(file, jsonEncode(data ?? {}));
  }
}
