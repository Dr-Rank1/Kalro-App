import 'dart:io';

import 'package:uuid/uuid.dart';

import '../models/producer.dart';
import '../models/producer_type.dart';
import 'farm_store.dart';

class ProducerRepository {
  ProducerRepository({Uuid? uuid, Directory? storageDirectory, FarmStore? store})
      : _uuid = uuid ?? const Uuid(),
        _store = store ?? FarmStore(directory: storageDirectory);

  final Uuid _uuid;
  final FarmStore _store;
  static const collection = 'producers';
  List<Producer>? _cache;

  Future<List<Producer>> getAll() async {
    _cache ??= await _load();
    if (_cache!.isEmpty) {
      _cache = _defaultProducers();
      for (final producer in _cache!) {
        await _store.upsert(collection, producer.id, producer.toJson());
      }
    }
    return List.unmodifiable(_cache!);
  }

  Future<Producer?> getById(String id) async {
    final producers = await getAll();
    for (final producer in producers) {
      if (producer.id == id) return producer;
    }
    return null;
  }

  Future<Producer> create({
    required String name,
    required ProducerType type,
    String? location,
    String? contactPhone,
    String? species,
    String? notes,
  }) async {
    final producer = Producer(
      id: _uuid.v4(),
      name: name.trim(),
      type: type,
      createdAt: DateTime.now(),
      location: location?.trim().isEmpty == true ? null : location?.trim(),
      contactPhone: contactPhone?.trim().isEmpty == true ? null : contactPhone?.trim(),
      species: species?.trim().isEmpty == true ? null : species?.trim(),
      notes: notes?.trim().isEmpty == true ? null : notes?.trim(),
    );

    final producers = await getAll();
    _cache = [...producers, producer];
    await _store.upsert(collection, producer.id, producer.toJson());
    return producer;
  }

  Future<void> delete(String id) async {
    final producers = await getAll();
    _cache = producers.where((producer) => producer.id != id).toList();
    await _store.delete(collection, id);
  }

  List<Producer> _defaultProducers() {
    final now = DateTime.now();
    return [
      Producer(
        id: _uuid.v4(),
        name: 'KALRO Seed Unit',
        type: ProducerType.seedProducer,
        createdAt: now,
        location: 'Kiambu, Kenya',
        species: 'Bombyx mori, Eri',
      ),
      Producer(
        id: _uuid.v4(),
        name: 'KALRO Rearing Support',
        type: ProducerType.chawkiRearingCenter,
        createdAt: now,
        location: 'Thika, Kenya',
        species: 'Bombyx mori',
      ),
    ];
  }

  Future<List<Producer>> _load() async {
    final rows = await _store.getCollection(collection);
    return [for (final row in rows) Producer.fromJson(row)];
  }

  void invalidateCache() => _cache = null;
}
