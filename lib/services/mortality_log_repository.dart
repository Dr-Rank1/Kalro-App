import '../utils/file_utils.dart';
import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

import '../models/mortality_log.dart';

class MortalityLogRepository {
  MortalityLogRepository({Uuid? uuid, Directory? storageDirectory})
      : _uuid = uuid ?? const Uuid(),
        _storageDirectory = storageDirectory;

  final Uuid _uuid;
  final Directory? _storageDirectory;
  static const _fileName = 'mortality_logs.json';
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

  Future<int> totalMortalityForBatch(String batchId) async {
    final logs = await getByBatchId(batchId);
    return logs.fold<int>(0, (sum, log) => sum + log.count);
  }

  Future<List<MortalityLog>> _load() async {
    final file = await _storageFile();
    if (!await file.exists()) return [];

    final contents = await file.readAsString();
    if (contents.trim().isEmpty) return [];

    final decoded = jsonDecode(contents) as List<dynamic>;
    return decoded
        .map((item) => MortalityLog.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> _save(List<MortalityLog> logs) async {
    final file = await _storageFile();
    final encoded = jsonEncode(logs.map((log) => log.toJson()).toList());
    await FileUtils.atomicWriteAsString(file, encoded);
  }

  Future<File> _storageFile() async {
    final directory =
        _storageDirectory ?? await getApplicationDocumentsDirectory();
    return File('${directory.path}/$_fileName');
  }

  void invalidateCache() => _cache = null;
}
