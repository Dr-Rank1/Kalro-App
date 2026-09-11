import '../utils/file_utils.dart';
import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

import '../models/payment_direction.dart';
import '../models/payment_record.dart';
import '../models/payment_status.dart';

class PaymentRepository {
  PaymentRepository({Uuid? uuid, Directory? storageDirectory})
      : _uuid = uuid ?? const Uuid(),
        _storageDirectory = storageDirectory;

  final Uuid _uuid;
  final Directory? _storageDirectory;
  static const _fileName = 'payments.json';
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
    await _save(_cache!);
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
    await _save(_cache!);
    return updated;
  }

  Future<void> delete(String id) async {
    final records = await getAll();
    _cache = records.where((record) => record.id != id).toList();
    await _save(_cache!);
  }

  Future<List<PaymentRecord>> _load() async {
    final file = await _storageFile();
    if (!await file.exists()) return [];

    final contents = await file.readAsString();
    if (contents.trim().isEmpty) return [];

    final decoded = jsonDecode(contents) as List<dynamic>;
    return decoded
        .map((item) => PaymentRecord.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> _save(List<PaymentRecord> records) async {
    final file = await _storageFile();
    final encoded = jsonEncode(records.map((record) => record.toJson()).toList());
    await FileUtils.atomicWriteAsString(file, encoded);
  }

  Future<File> _storageFile() async {
    final directory = _storageDirectory ?? await getApplicationDocumentsDirectory();
    return File('${directory.path}/$_fileName');
  }

  void invalidateCache() => _cache = null;
}
