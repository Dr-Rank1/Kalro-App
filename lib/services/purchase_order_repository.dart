import '../utils/file_utils.dart';
import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

import '../models/purchase_order.dart';
import '../models/species.dart';

class PurchaseOrderRepository {
  PurchaseOrderRepository({Uuid? uuid, Directory? storageDirectory})
      : _uuid = uuid ?? const Uuid(),
        _storageDirectory = storageDirectory;

  final Uuid _uuid;
  final Directory? _storageDirectory;
  static const _fileName = 'purchase_orders.json';
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
    await _save(_cache!);
    return order;
  }

  Future<void> delete(String id) async {
    final orders = await getAll();
    _cache = orders.where((order) => order.id != id).toList();
    await _save(_cache!);
  }

  Future<List<PurchaseOrder>> _load() async {
    final file = await _storageFile();
    if (!await file.exists()) return [];

    final contents = await file.readAsString();
    if (contents.trim().isEmpty) return [];

    final decoded = jsonDecode(contents) as List<dynamic>;
    return decoded
        .map((item) => PurchaseOrder.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> _save(List<PurchaseOrder> orders) async {
    final file = await _storageFile();
    final encoded = jsonEncode(orders.map((order) => order.toJson()).toList());
    await FileUtils.atomicWriteAsString(file, encoded);
  }

  Future<File> _storageFile() async {
    final directory = _storageDirectory ?? await getApplicationDocumentsDirectory();
    return File('${directory.path}/$_fileName');
  }

  void invalidateCache() => _cache = null;
}
