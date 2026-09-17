import 'dart:io';

import 'package:uuid/uuid.dart';

import '../models/feed_log.dart';
import 'farm_store.dart';

class FeedLogRepository {
  FeedLogRepository({Uuid? uuid, Directory? storageDirectory, FarmStore? store})
      : _uuid = uuid ?? const Uuid(),
        _store = store ?? FarmStore(directory: storageDirectory);

  final Uuid _uuid;
  final FarmStore _store;
  static const collection = 'feed_logs';
  List<FeedLog>? _cache;

  Future<List<FeedLog>> getAll() async {
    _cache ??= await _load();
    return List.unmodifiable(_cache!);
  }

  Future<List<FeedLog>> getByBatchId(String batchId) async {
    final logs = await getAll();
    return logs.where((log) => log.batchId == batchId).toList()
      ..sort((a, b) => b.recordedAt.compareTo(a.recordedAt));
  }

  Future<FeedLog> create({
    required String batchId,
    required DateTime recordedAt,
    required String feedType,
    required double quantityGrams,
    String? feedingStage,
    String? notes,
  }) async {
    final log = FeedLog(
      id: _uuid.v4(),
      batchId: batchId,
      recordedAt: recordedAt,
      feedType: feedType.trim(),
      quantityGrams: quantityGrams,
      feedingStage: feedingStage?.trim().isEmpty == true ? null : feedingStage?.trim(),
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

  Future<double> totalQuantityForBatch(String batchId) async {
    final logs = await getByBatchId(batchId);
    var total = 0.0;
    for (final log in logs) {
      total += log.quantityGrams;
    }
    return total;
  }

  Future<List<FeedLog>> _load() async {
    final rows = await _store.getCollection(collection);
    return [for (final row in rows) FeedLog.fromJson(row)];
  }

  void invalidateCache() => _cache = null;
}
