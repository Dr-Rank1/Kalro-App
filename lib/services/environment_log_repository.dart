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

  Future<List<EnvironmentLog>> getByBatchId(String batchId, {int? limit}) async {
    if (_cache != null) {
      final filtered = _cache!.where((log) => log.batchId == batchId).toList()
        ..sort((a, b) => b.recordedAt.compareTo(a.recordedAt));
      if (limit != null && filtered.length > limit) {
        return filtered.take(limit).toList();
      }
      return filtered;
    }
    final rows = await _store.getCollectionWhere(
      collection,
      jsonKey: 'batchId',
      value: batchId,
      limit: limit,
      descending: true,
    );
    return [for (final row in rows) EnvironmentLog.fromJson(row)]
      ..sort((a, b) => b.recordedAt.compareTo(a.recordedAt));
  }

  Future<EnvironmentLog?> latestForBatch(String batchId) async {
    final logs = await getByBatchId(batchId, limit: 1);
    return logs.isEmpty ? null : logs.first;
  }

  /// Saves a single environment log without reading the entire historical dataset into memory.
  Future<EnvironmentLog> create({
    required String batchId,
    required DateTime recordedAt,
    required double temperatureCelsius,
    required double humidityPercent,
    String? ventilation,
    String? lightCondition,
    String? notes,
    String? roomName,
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
      roomName: roomName?.trim().isEmpty == true ? null : roomName?.trim(),
    );

    if (_cache != null) {
      _cache = [..._cache!, log];
    }
    await _store.upsert(collection, log.id, log.toJson());
    return log;
  }

  /// Bulk inserts BLE telemetry or historical climate batches within a single SQLite transaction.
  Future<void> insertAll(List<EnvironmentLog> logs) async {
    if (logs.isEmpty) return;
    if (_cache != null) {
      _cache = [..._cache!, ...logs];
    }
    final records = [for (final log in logs) log.toJson()];
    await _store.upsertAll(collection, records);
  }

  Future<void> delete(String id) async {
    if (_cache != null) {
      _cache = _cache!.where((log) => log.id != id).toList();
    }
    await _store.delete(collection, id);
  }

  Future<List<EnvironmentLog>> _load() async {
    final rows = await _store.getCollection(collection);
    return [for (final row in rows) EnvironmentLog.fromJson(row)];
  }

  void invalidateCache() => _cache = null;

  void dispose() {
    _cache = null;
  }
}
