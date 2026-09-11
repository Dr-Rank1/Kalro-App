import '../utils/file_utils.dart';
import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

import '../models/producer.dart';
import '../models/producer_type.dart';

class ProducerRepository {
  ProducerRepository({Uuid? uuid, Directory? storageDirectory})
      : _uuid = uuid ?? const Uuid(),
        _storageDirectory = storageDirectory;

  final Uuid _uuid;
  final Directory? _storageDirectory;
  static const _fileName = 'producers.json';
  List<Producer>? _cache;

  Future<List<Producer>> getAll() async {
    _cache ??= await _load();
    if (_cache!.isEmpty) {
      _cache = _defaultProducers();
      await _save(_cache!);
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
    await _save(_cache!);
    return producer;
  }

  Future<void> delete(String id) async {
    final producers = await getAll();
    _cache = producers.where((producer) => producer.id != id).toList();
    await _save(_cache!);
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
    final file = await _storageFile();
    if (!await file.exists()) return [];

    final contents = await file.readAsString();
    if (contents.trim().isEmpty) return [];

    final decoded = jsonDecode(contents) as List<dynamic>;
    return decoded
        .map((item) => Producer.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> _save(List<Producer> producers) async {
    final file = await _storageFile();
    final encoded = jsonEncode(producers.map((producer) => producer.toJson()).toList());
    await FileUtils.atomicWriteAsString(file, encoded);
  }

  Future<File> _storageFile() async {
    final directory = _storageDirectory ?? await getApplicationDocumentsDirectory();
    return File('${directory.path}/$_fileName');
  }

  void invalidateCache() => _cache = null;
}
