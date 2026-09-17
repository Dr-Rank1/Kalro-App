import 'dart:io';

import 'package:uuid/uuid.dart';

import '../models/cocoon_harvest.dart';
import 'farm_store.dart';

class CocoonHarvestRepository {
  CocoonHarvestRepository({
    Uuid? uuid,
    Directory? storageDirectory,
    FarmStore? store,
  })  : _uuid = uuid ?? const Uuid(),
        _store = store ?? FarmStore(directory: storageDirectory);

  final Uuid _uuid;
  final FarmStore _store;
  static const collection = 'cocoon_harvests';
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
    await _store.upsert(collection, harvest.id, harvest.toJson());
    return harvest;
  }

  Future<void> delete(String id) async {
    final harvests = await getAll();
    _cache = harvests.where((h) => h.id != id).toList();
    await _store.delete(collection, id);
  }

  Future<List<CocoonHarvest>> _load() async {
    final rows = await _store.getCollection(collection);
    return [for (final row in rows) CocoonHarvest.fromJson(row)];
  }

  void invalidateCache() => _cache = null;
}
