import 'dart:io';

import 'package:uuid/uuid.dart';

import '../models/milestone_observation.dart';
import 'farm_store.dart';

class MilestoneObservationRepository {
  MilestoneObservationRepository({
    Uuid? uuid,
    Directory? storageDirectory,
    FarmStore? store,
  })  : _uuid = uuid ?? const Uuid(),
        _store = store ?? FarmStore(directory: storageDirectory);

  final Uuid _uuid;
  final FarmStore _store;
  static const collection = 'milestone_observations';
  List<MilestoneObservation>? _cache;

  Future<List<MilestoneObservation>> getAll() async {
    _cache ??= await _load();
    return List.unmodifiable(_cache!);
  }

  Future<List<MilestoneObservation>> getByBatchId(String batchId) async {
    final observations = await getAll();
    return observations.where((o) => o.batchId == batchId).toList();
  }

  Future<Map<String, DateTime>> stageDatesForBatch(String batchId) async {
    final observations = await getByBatchId(batchId);
    return {
      for (final o in observations) o.stageKey: _dateOnly(o.observedDate),
    };
  }

  Future<MilestoneObservation> record({
    required String batchId,
    required String stageKey,
    required DateTime observedDate,
  }) async {
    final observations = await getAll();
    final existingIndex = observations.indexWhere(
      (o) => o.batchId == batchId && o.stageKey == stageKey,
    );

    final observation = MilestoneObservation(
      id: existingIndex >= 0 ? observations[existingIndex].id : _uuid.v4(),
      batchId: batchId,
      stageKey: stageKey,
      observedDate: _dateOnly(observedDate),
      recordedAt: DateTime.now(),
    );

    if (existingIndex >= 0) {
      final updated = List<MilestoneObservation>.from(observations)
        ..[existingIndex] = observation;
      _cache = updated;
    } else {
      _cache = [...observations, observation];
    }
    await _store.upsert(collection, observation.id, observation.toJson());
    return observation;
  }

  Future<void> delete(String id) async {
    final observations = await getAll();
    _cache = observations.where((o) => o.id != id).toList();
    await _store.delete(collection, id);
  }

  DateTime _dateOnly(DateTime date) {
    return DateTime(date.year, date.month, date.day);
  }

  Future<List<MilestoneObservation>> _load() async {
    final rows = await _store.getCollection(collection);
    return [for (final row in rows) MilestoneObservation.fromJson(row)];
  }

  void invalidateCache() => _cache = null;
}
