import 'dart:io';

import '../models/inventory_settings.dart';
import 'farm_store.dart';

class InventorySettingsRepository {
  InventorySettingsRepository({Directory? storageDirectory, FarmStore? store})
      : _store = store ?? FarmStore(directory: storageDirectory);

  final FarmStore _store;
  static const singleton = 'inventory_settings';
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
    await _store.putSingleton(singleton, _cache!.toJson());
    return _cache!;
  }

  Future<InventorySettings> _load() async {
    final stored = await _store.getSingleton(singleton);
    if (stored == null) return InventorySettings.defaults;
    return InventorySettings.fromJson(stored);
  }

  void invalidateCache() => _cache = null;
}
