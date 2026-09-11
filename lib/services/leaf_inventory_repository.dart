import '../utils/file_utils.dart';
import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';

import '../models/leaf_inventory.dart';

class LeafInventoryRepository {
  LeafInventoryRepository({Directory? storageDirectory})
      : _storageDirectory = storageDirectory;

  final Directory? _storageDirectory;
  static const _fileName = 'leaf_inventory.json';
  LeafInventory? _cache;

  Future<LeafInventory> get() async {
    _cache ??= await _load();
    return _cache!;
  }

  Future<LeafInventory> save(LeafInventory inventory) async {
    _cache = inventory.copyWith(updatedAt: DateTime.now());
    await _persist(_cache!);
    return _cache!;
  }

  Future<LeafInventory> _load() async {
    final file = await _storageFile();
    if (!await file.exists()) return LeafInventory.empty;

    final contents = await file.readAsString();
    if (contents.trim().isEmpty) return LeafInventory.empty;

    final decoded = jsonDecode(contents) as Map<String, dynamic>;
    return LeafInventory.fromJson(decoded);
  }

  Future<void> _persist(LeafInventory inventory) async {
    final file = await _storageFile();
    await FileUtils.atomicWriteAsString(file, jsonEncode(inventory.toJson()));
  }

  Future<File> _storageFile() async {
    final directory =
        _storageDirectory ?? await getApplicationDocumentsDirectory();
    return File('${directory.path}/$_fileName');
  }

  void invalidateCache() => _cache = null;
}
