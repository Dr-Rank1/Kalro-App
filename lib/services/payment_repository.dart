import 'dart:io';

import 'package:uuid/uuid.dart';

import '../models/payment_direction.dart';
import '../models/payment_record.dart';
import '../models/payment_status.dart';
import 'farm_store.dart';

class PaymentRepository {
  PaymentRepository({Uuid? uuid, Directory? storageDirectory, FarmStore? store})
      : _uuid = uuid ?? const Uuid(),
        _store = store ?? FarmStore(directory: storageDirectory);

  final Uuid _uuid;
  final FarmStore _store;
  static const collection = 'payments';
  List<PaymentRecord>? _cache;

  Future<List<PaymentRecord>> getAll() async {
    _cache ??= await _load();
    return List.unmodifiable(_cache!);
  }

  Future<PaymentRecord?> getById(String id) async {
    final records = await getAll();
    for (final record in records) {
      if (record.id == id) return record;
    }
    return null;
  }

  Future<PaymentRecord> create({
    required String counterparty,
    required String description,
    required double amount,
    required PaymentDirection direction,
    required DateTime recordedAt,
    PaymentStatus status = PaymentStatus.pending,
    String? notes,
  }) async {
    final record = PaymentRecord(
      id: _uuid.v4(),
      counterparty: counterparty.trim(),
      description: description.trim(),
      amount: amount,
      direction: direction,
      status: status,
      recordedAt: recordedAt,
      notes: notes?.trim().isEmpty == true ? null : notes?.trim(),
    );

    final records = await getAll();
    _cache = [...records, record];
    await _store.upsert(collection, record.id, record.toJson());
    return record;
  }

  Future<PaymentRecord> markSettled(String id) async {
    final records = await getAll();
    final index = records.indexWhere((record) => record.id == id);
    if (index == -1) {
      throw StateError('Payment record not found: $id');
    }

    final updated = records[index].copyWith(
      status: PaymentStatus.settled,
      settledAt: DateTime.now(),
    );
    _cache = [...records]..[index] = updated;
    await _store.upsert(collection, updated.id, updated.toJson());
    return updated;
  }

  Future<void> delete(String id) async {
    final records = await getAll();
    _cache = records.where((record) => record.id != id).toList();
    await _store.delete(collection, id);
  }

  Future<List<PaymentRecord>> _load() async {
    final rows = await _store.getCollection(collection);
    return [for (final row in rows) PaymentRecord.fromJson(row)];
  }

  void invalidateCache() => _cache = null;
}
