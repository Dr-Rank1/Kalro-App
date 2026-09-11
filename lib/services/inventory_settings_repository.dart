import '../utils/file_utils.dart';
import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';

import '../models/inventory_settings.dart';

class InventorySettingsRepository {
  InventorySettingsRepository({Directory? storageDirectory})
      : _storageDirectory = storageDirectory;

  final Directory? _storageDirectory;
  static const _fileName = 'inventory_settings.json';
  InventorySettings? _cache;

  Future<InventorySettings> get() async {
    _cache ??= await _load();
    return _cache!;
  }

  Future<InventorySettings> update({
    double? bombyxPrice,
    double? eriPrice,
  }) async {
    final current = await get();
    _cache = current.copyWith(
      bombyxPrice: bombyxPrice,
      eriPrice: eriPrice,
    );
    await _save(_cache!);
    return _cache!;
  }

  Future<InventorySettings> _load() async {
    final file = await _storageFile();
    if (!await file.exists()) return InventorySettings.defaults;

    final contents = await file.readAsString();
    if (contents.trim().isEmpty) return InventorySettings.defaults;

    final decoded = jsonDecode(contents) as Map<String, dynamic>;
    return InventorySettings.fromJson(decoded);
  }

  Future<void> _save(InventorySettings settings) async {
    final file = await _storageFile();
    await FileUtils.atomicWriteAsString(file, jsonEncode(settings.toJson()));
  }

  Future<File> _storageFile() async {
    final directory = _storageDirectory ?? await getApplicationDocumentsDirectory();
    return File('${directory.path}/$_fileName');
  }

  void invalidateCache() => _cache = null;
}
