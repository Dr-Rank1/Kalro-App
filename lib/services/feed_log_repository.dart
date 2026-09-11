import '../utils/file_utils.dart';
import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

import '../models/feed_log.dart';

class FeedLogRepository {
  FeedLogRepository({Uuid? uuid, Directory? storageDirectory})
      : _uuid = uuid ?? const Uuid(),
        _storageDirectory = storageDirectory;

  final Uuid _uuid;
  final Directory? _storageDirectory;
  static const _fileName = 'feed_logs.json';
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
    await _save(_cache!);
    return log;
  }

  Future<void> delete(String id) async {
    final logs = await getAll();
    _cache = logs.where((log) => log.id != id).toList();
    await _save(_cache!);
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
    final file = await _storageFile();
    if (!await file.exists()) return [];

    final contents = await file.readAsString();
    if (contents.trim().isEmpty) return [];

    final decoded = jsonDecode(contents) as List<dynamic>;
    return decoded
        .map((item) => FeedLog.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> _save(List<FeedLog> logs) async {
    final file = await _storageFile();
    final encoded = jsonEncode(logs.map((log) => log.toJson()).toList());
    await FileUtils.atomicWriteAsString(file, encoded);
  }

  Future<File> _storageFile() async {
    final directory = _storageDirectory ?? await getApplicationDocumentsDirectory();
    return File('${directory.path}/$_fileName');
  }

  void invalidateCache() => _cache = null;
}
