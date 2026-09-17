import 'dart:io';

import '../models/leaf_inventory.dart';
import 'farm_store.dart';

class LeafInventoryRepository {
  LeafInventoryRepository({Directory? storageDirectory, FarmStore? store})
      : _store = store ?? FarmStore(directory: storageDirectory);

  final FarmStore _store;
  static const singleton = 'leaf_inventory';
  LeafInventory? _cache;

  Future<LeafInventory> get() async {
    _cache ??= await _load();
    return _cache!;
  }

  Future<LeafInventory> save(LeafInventory inventory) async {
    _cache = inventory.copyWith(updatedAt: DateTime.now());
    await _store.putSingleton(singleton, _cache!.toJson());
    return _cache!;
  }

  Future<LeafInventory> _load() async {
    final stored = await _store.getSingleton(singleton);
    if (stored == null) return LeafInventory.empty;
    return LeafInventory.fromJson(stored);
  }

  void invalidateCache() => _cache = null;
}
