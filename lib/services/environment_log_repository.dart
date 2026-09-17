import 'dart:io';

import 'package:uuid/uuid.dart';

import '../models/environment_log.dart';
import 'farm_store.dart';

class EnvironmentLogRepository {
  EnvironmentLogRepository({
    Uuid? uuid,
    Directory? storageDirectory,
    FarmStore? store,
  })  : _uuid = uuid ?? const Uuid(),
        _store = store ?? FarmStore(directory: storageDirectory);

  final Uuid _uuid;
  final FarmStore _store;
  static const collection = 'environment_logs';
  List<EnvironmentLog>? _cache;

  Future<List<EnvironmentLog>> getAll() async {
    _cache ??= await _load();
    return List.unmodifiable(_cache!);
  }

  Future<List<EnvironmentLog>> getByBatchId(String batchId) async {
    final logs = await getAll();
    return logs.where((log) => log.batchId == batchId).toList()
      ..sort((a, b) => b.recordedAt.compareTo(a.recordedAt));
  }

  Future<EnvironmentLog?> latestForBatch(String batchId) async {
    final logs = await getByBatchId(batchId);
    return logs.isEmpty ? null : logs.first;
  }

  Future<EnvironmentLog> create({
    required String batchId,
    required DateTime recordedAt,
    required double temperatureCelsius,
    required double humidityPercent,
    String? ventilation,
    String? lightCondition,
    String? notes,
  }) async {
    final log = EnvironmentLog(
      id: _uuid.v4(),
      batchId: batchId,
      recordedAt: recordedAt,
      temperatureCelsius: temperatureCelsius,
      humidityPercent: humidityPercent,
      ventilation: ventilation?.trim().isEmpty == true ? null : ventilation?.trim(),
      lightCondition:
          lightCondition?.trim().isEmpty == true ? null : lightCondition?.trim(),
      notes: notes?.trim().isEmpty == true ? null : notes?.trim(),
    );

    final logs = await getAll();
    _cache = [...logs, log];
    await _store.upsert(collection, log.id, log.toJson());
    return log;
  }

  Future<void> delete(String id) async {
    final logs = await getAll();
    _cache = logs.where((log) => log.id != id).toList();
    await _store.delete(collection, id);
  }

  Future<List<EnvironmentLog>> _load() async {
    final rows = await _store.getCollection(collection);
    return [for (final row in rows) EnvironmentLog.fromJson(row)];
  }

  void invalidateCache() => _cache = null;
}
