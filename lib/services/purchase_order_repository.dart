import 'dart:io';

import 'package:uuid/uuid.dart';

import '../models/purchase_order.dart';
import '../models/species.dart';
import 'farm_store.dart';

class PurchaseOrderRepository {
  PurchaseOrderRepository({
    Uuid? uuid,
    Directory? storageDirectory,
    FarmStore? store,
  })  : _uuid = uuid ?? const Uuid(),
        _store = store ?? FarmStore(directory: storageDirectory);

  final Uuid _uuid;
  final FarmStore _store;
  static const collection = 'purchase_orders';
  List<PurchaseOrder>? _cache;

  Future<List<PurchaseOrder>> getAll() async {
    _cache ??= await _load();
    return List.unmodifiable(_cache!);
  }

  Future<PurchaseOrder> create({
    required String producerId,
    required String producerName,
    required String itemDescription,
    required double quantity,
    required String unit,
    required DateTime orderedAt,
    double? amount,
    Species? species,
    String? notes,
    String? paymentRecordId,
  }) async {
    final order = PurchaseOrder(
      id: _uuid.v4(),
      producerId: producerId,
      producerName: producerName,
      itemDescription: itemDescription.trim(),
      quantity: quantity,
      unit: unit.trim(),
      orderedAt: orderedAt,
      amount: amount,
      species: species,
      notes: notes?.trim().isEmpty == true ? null : notes?.trim(),
      paymentRecordId: paymentRecordId,
    );

    final orders = await getAll();
    _cache = [...orders, order];
    await _store.upsert(collection, order.id, order.toJson());
    return order;
  }

  Future<void> delete(String id) async {
    final orders = await getAll();
    _cache = orders.where((order) => order.id != id).toList();
    await _store.delete(collection, id);
  }

  Future<List<PurchaseOrder>> _load() async {
    final rows = await _store.getCollection(collection);
    return [for (final row in rows) PurchaseOrder.fromJson(row)];
  }

  void invalidateCache() => _cache = null;
}
