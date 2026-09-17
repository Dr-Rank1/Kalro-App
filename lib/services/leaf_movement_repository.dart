import 'dart:io';

import 'package:uuid/uuid.dart';

import '../models/leaf_movement.dart';
import 'farm_store.dart';

class LeafMovementRepository {
  LeafMovementRepository({
    Uuid? uuid,
    Directory? storageDirectory,
    FarmStore? store,
  })  : _uuid = uuid ?? const Uuid(),
        _store = store ?? FarmStore(directory: storageDirectory);

  final Uuid _uuid;
  final FarmStore _store;
  static const collection = 'leaf_movements';
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
    await _store.upsert(collection, movement.id, movement.toJson());
    return movement;
  }

  Future<void> delete(String id) async {
    final all = await getAll();
    _cache = all.where((m) => m.id != id).toList();
    await _store.delete(collection, id);
  }

  Future<List<LeafMovement>> _load() async {
    final rows = await _store.getCollection(collection);
    return [for (final row in rows) LeafMovement.fromJson(row)];
  }

  void invalidateCache() => _cache = null;
}
