import '../utils/file_utils.dart';
import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

import '../models/batch.dart';
import '../models/batch_status.dart';
import '../models/species.dart';

class BatchRepository {
  BatchRepository({Uuid? uuid, Directory? storageDirectory})
      : _uuid = uuid ?? const Uuid(),
        _storageDirectory = storageDirectory;

  final Uuid _uuid;
  final Directory? _storageDirectory;
  static const _fileName = 'batches.json';
  List<Batch>? _cache;

  Future<List<Batch>> getAll() async {
    _cache ??= await _load();
    return List.unmodifiable(_cache!);
  }

  Future<Batch?> getById(String id) async {
    final batches = await getAll();
    for (final batch in batches) {
      if (batch.id == id) return batch;
    }
    return null;
  }

  Future<Batch> create({
    required Species species,
    required DateTime startDate,
    required int eggCount,
    String? strain,
    String? location,
    String? caretaker,
    String? feedMaterial,
    String? eggSource,
    String? rearingType,
  }) async {
    final batch = Batch(
      id: _uuid.v4(),
      species: species,
      startDate: DateTime(startDate.year, startDate.month, startDate.day),
      eggCount: eggCount,
      status: BatchStatus.active,
      createdAt: DateTime.now(),
      strain: strain?.trim().isEmpty == true ? null : strain?.trim(),
      location: location?.trim().isEmpty == true ? null : location?.trim(),
      caretaker: caretaker?.trim().isEmpty == true ? null : caretaker?.trim(),
      feedMaterial:
          feedMaterial?.trim().isEmpty == true ? null : feedMaterial?.trim(),
      eggSource: eggSource?.trim().isEmpty == true ? null : eggSource?.trim(),
      rearingType:
          rearingType?.trim().isEmpty == true ? null : rearingType?.trim(),
    );

    final batches = await getAll();
    _cache = [...batches, batch];
    await _save(_cache!);
    return batch;
  }

  Future<void> update(Batch batch) async {
    final batches = await getAll();
    final index = batches.indexWhere((item) => item.id == batch.id);
    if (index == -1) {
      throw StateError('Batch not found: ${batch.id}');
    }

    final updated = List<Batch>.from(batches)..[index] = batch;
    _cache = updated;
    await _save(updated);
  }

  Future<void> delete(String id) async {
    final batches = await getAll();
    _cache = batches.where((batch) => batch.id != id).toList();
    await _save(_cache!);
  }

  Future<List<Batch>> _load() async {
    final file = await _storageFile();
    if (!await file.exists()) {
      return [];
    }

    final contents = await file.readAsString();
    if (contents.trim().isEmpty) {
      return [];
    }

    final decoded = jsonDecode(contents) as List<dynamic>;
    return decoded
        .map((item) => Batch.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> _save(List<Batch> batches) async {
    final file = await _storageFile();
    final encoded = jsonEncode(batches.map((batch) => batch.toJson()).toList());
    await FileUtils.atomicWriteAsString(file, encoded);
  }

  Future<File> _storageFile() async {
    final directory = _storageDirectory ?? await getApplicationDocumentsDirectory();
    return File('${directory.path}/$_fileName');
  }

  Future<Directory> storageDirectory() async {
    return _storageDirectory ?? await getApplicationDocumentsDirectory();
  }

  void invalidateCache() => _cache = null;
}
