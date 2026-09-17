import 'dart:io';

import 'package:uuid/uuid.dart';

import '../models/mortality_log.dart';
import 'farm_store.dart';

class MortalityLogRepository {
  MortalityLogRepository({
    Uuid? uuid,
    Directory? storageDirectory,
    FarmStore? store,
  })  : _uuid = uuid ?? const Uuid(),
        _store = store ?? FarmStore(directory: storageDirectory);

  final Uuid _uuid;
  final FarmStore _store;
  static const collection = 'mortality_logs';
  List<MortalityLog>? _cache;

  Future<List<MortalityLog>> getAll() async {
    _cache ??= await _load();
    return List.unmodifiable(_cache!);
  }

  Future<List<MortalityLog>> getByBatchId(String batchId) async {
    final logs = await getAll();
    return logs.where((log) => log.batchId == batchId).toList()
      ..sort((a, b) => b.recordedAt.compareTo(a.recordedAt));
  }

  Future<MortalityLog> create({
    required String batchId,
    required DateTime recordedAt,
    required int count,
    String? reason,
    String? disease,
    String? treatment,
    String? notes,
    bool isolated = false,
    String? photoPath,
  }) async {
    final log = MortalityLog(
      id: _uuid.v4(),
      batchId: batchId,
      recordedAt: recordedAt,
      count: count,
      reason: reason?.trim().isEmpty == true ? null : reason?.trim(),
      disease: disease?.trim().isEmpty == true ? null : disease?.trim(),
      treatment: treatment?.trim().isEmpty == true ? null : treatment?.trim(),
      notes: notes?.trim().isEmpty == true ? null : notes?.trim(),
      isolated: isolated,
      photoPath: photoPath,
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

  Future<int> totalMortalityForBatch(String batchId) async {
    final logs = await getByBatchId(batchId);
    return logs.fold<int>(0, (sum, log) => sum + log.count);
  }

  Future<List<MortalityLog>> _load() async {
    final rows = await _store.getCollection(collection);
    return [for (final row in rows) MortalityLog.fromJson(row)];
  }

  void invalidateCache() => _cache = null;
}
