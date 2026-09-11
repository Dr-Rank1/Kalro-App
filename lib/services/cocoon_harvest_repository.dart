import '../utils/file_utils.dart';
import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

import '../models/cocoon_harvest.dart';

class CocoonHarvestRepository {
  CocoonHarvestRepository({Uuid? uuid, Directory? storageDirectory})
      : _uuid = uuid ?? const Uuid(),
        _storageDirectory = storageDirectory;

  final Uuid _uuid;
  final Directory? _storageDirectory;
  static const _fileName = 'cocoon_harvests.json';
  List<CocoonHarvest>? _cache;

  Future<List<CocoonHarvest>> getAll() async {
    _cache ??= await _load();
    return List.unmodifiable(_cache!);
  }

  Future<List<CocoonHarvest>> getByBatchId(String batchId) async {
    final harvests = await getAll();
    return harvests.where((h) => h.batchId == batchId).toList()
      ..sort((a, b) => b.harvestDate.compareTo(a.harvestDate));
  }

  Future<CocoonHarvest> create({
    required String batchId,
    required DateTime harvestDate,
    required int cocoonCount,
    required double totalWeightGrams,
    int defectiveCount = 0,
    double? shellWeightGrams,
    double? filamentLengthCm,
    double? moisturePercent,
    String? notes,
  }) async {
    final harvest = CocoonHarvest(
      id: _uuid.v4(),
      batchId: batchId,
      harvestDate: harvestDate,
      cocoonCount: cocoonCount,
      totalWeightGrams: totalWeightGrams,
      defectiveCount: defectiveCount,
      shellWeightGrams: shellWeightGrams,
      filamentLengthCm: filamentLengthCm,
      moisturePercent: moisturePercent,
      notes: notes?.trim().isEmpty == true ? null : notes?.trim(),
    );

    final harvests = await getAll();
    _cache = [...harvests, harvest];
    await _save(_cache!);
    return harvest;
  }

  Future<void> delete(String id) async {
    final harvests = await getAll();
    _cache = harvests.where((h) => h.id != id).toList();
    await _save(_cache!);
  }

  Future<List<CocoonHarvest>> _load() async {
    final file = await _storageFile();
    if (!await file.exists()) return [];

    final contents = await file.readAsString();
    if (contents.trim().isEmpty) return [];

    final decoded = jsonDecode(contents) as List<dynamic>;
    return decoded
        .map((item) => CocoonHarvest.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> _save(List<CocoonHarvest> harvests) async {
    final file = await _storageFile();
    final encoded =
        jsonEncode(harvests.map((h) => h.toJson()).toList());
    await FileUtils.atomicWriteAsString(file, encoded);
  }

  Future<File> _storageFile() async {
    final directory =
        _storageDirectory ?? await getApplicationDocumentsDirectory();
    return File('${directory.path}/$_fileName');
  }

  void invalidateCache() => _cache = null;
}
