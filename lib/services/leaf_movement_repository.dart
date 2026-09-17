import '../utils/file_utils.dart';
import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

import '../models/leaf_movement.dart';

class LeafMovementRepository {
  LeafMovementRepository({Uuid? uuid, Directory? storageDirectory})
      : _uuid = uuid ?? const Uuid(),
        _storageDirectory = storageDirectory;

  final Uuid _uuid;
  final Directory? _storageDirectory;
  static const _fileName = 'leaf_movements.json';
  List<LeafMovement>? _cache;

  Future<List<LeafMovement>> getAll() async {
    _cache ??= await _load();
    return List.unmodifiable(_cache!);
  }

  Future<LeafMovement> create({
    required LeafHost host,
    required double kg,
    required LeafMovementKind kind,
    String? batchId,
    String? notes,
    DateTime? recordedAt,
  }) async {
    final movement = LeafMovement(
      id: _uuid.v4(),
      recordedAt: recordedAt ?? DateTime.now(),
      host: host,
      kg: kg,
      kind: kind,
      batchId: batchId,
      notes: notes,
    );
    final all = await getAll();
    _cache = [...all, movement];
    await _save(_cache!);
    return movement;
  }

  Future<void> delete(String id) async {
    final all = await getAll();
    _cache = all.where((m) => m.id != id).toList();
    await _save(_cache!);
  }

  Future<List<LeafMovement>> _load() async {
    final file = await _storageFile();
    if (!await file.exists()) return [];
    final contents = await file.readAsString();
    if (contents.trim().isEmpty) return [];
    final decoded = jsonDecode(contents) as List<dynamic>;
    return decoded
        .map((item) => LeafMovement.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> _save(List<LeafMovement> items) async {
    final file = await _storageFile();
    await FileUtils.atomicWriteAsString(
      file,
      jsonEncode(items.map((m) => m.toJson()).toList()),
    );
  }

  Future<File> _storageFile() async {
    final directory =
        _storageDirectory ?? await getApplicationDocumentsDirectory();
    return File('${directory.path}/$_fileName');
  }

  void invalidateCache() => _cache = null;
}
