import '../utils/file_utils.dart';
import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

import '../models/environment_log.dart';

class EnvironmentLogRepository {
  EnvironmentLogRepository({Uuid? uuid, Directory? storageDirectory})
      : _uuid = uuid ?? const Uuid(),
        _storageDirectory = storageDirectory;

  final Uuid _uuid;
  final Directory? _storageDirectory;
  static const _fileName = 'environment_logs.json';
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
    await _save(_cache!);
    return log;
  }

  Future<void> delete(String id) async {
    final logs = await getAll();
    _cache = logs.where((log) => log.id != id).toList();
    await _save(_cache!);
  }

  Future<List<EnvironmentLog>> _load() async {
    final file = await _storageFile();
    if (!await file.exists()) return [];

    final contents = await file.readAsString();
    if (contents.trim().isEmpty) return [];

    final decoded = jsonDecode(contents) as List<dynamic>;
    return decoded
        .map((item) => EnvironmentLog.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> _save(List<EnvironmentLog> logs) async {
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
