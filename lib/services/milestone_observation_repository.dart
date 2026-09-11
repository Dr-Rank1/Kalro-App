import '../utils/file_utils.dart';
import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

import '../models/milestone_observation.dart';

class MilestoneObservationRepository {
  MilestoneObservationRepository({Uuid? uuid, Directory? storageDirectory})
      : _uuid = uuid ?? const Uuid(),
        _storageDirectory = storageDirectory;

  final Uuid _uuid;
  final Directory? _storageDirectory;
  static const _fileName = 'milestone_observations.json';
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
    await _save(_cache!);
    return observation;
  }

  Future<void> delete(String id) async {
    final observations = await getAll();
    _cache = observations.where((o) => o.id != id).toList();
    await _save(_cache!);
  }

  DateTime _dateOnly(DateTime date) {
    return DateTime(date.year, date.month, date.day);
  }

  Future<List<MilestoneObservation>> _load() async {
    final file = await _storageFile();
    if (!await file.exists()) return [];

    final contents = await file.readAsString();
    if (contents.trim().isEmpty) return [];

    final decoded = jsonDecode(contents) as List<dynamic>;
    return decoded
        .map((item) =>
            MilestoneObservation.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> _save(List<MilestoneObservation> observations) async {
    final file = await _storageFile();
    final encoded =
        jsonEncode(observations.map((o) => o.toJson()).toList());
    await FileUtils.atomicWriteAsString(file, encoded);
  }

  Future<File> _storageFile() async {
    final directory =
        _storageDirectory ?? await getApplicationDocumentsDirectory();
    return File('${directory.path}/$_fileName');
  }

  void invalidateCache() => _cache = null;
}
