import 'dart:io';

import '../models/batch.dart';
import '../models/species.dart';
import 'app_repositories.dart';
import 'leaf_ledger_service.dart';
import 'rearing_day_service.dart';

class HouseFeel {
  const HouseFeel({required this.temperatureC, required this.humidityPercent, required this.label});

  final double temperatureC;
  final double humidityPercent;
  final String label;
}

/// Fast logs for the rearing-house floor.
class FloorLogService {
  const FloorLogService();

  static String defaultFeedType(Batch batch) {
    final custom = batch.feedMaterial?.trim();
    if (custom != null && custom.isNotEmpty) return custom;
    return batch.species == Species.bombyx ? 'Mulberry' : 'Castor / kesseru';
  }

  Future<bool> logSuggestedFeed({
    required AppRepositories repositories,
    required Batch batch,
    required RearingDayPlan plan,
  }) async {
    if (plan.suggestedGrams <= 0) return false;
    await repositories.feedLogs.create(
      batchId: batch.id,
      recordedAt: DateTime.now(),
      feedType: defaultFeedType(batch),
      quantityGrams: plan.suggestedGrams,
      feedingStage: plan.stage.label,
      notes: plan.isLightFeedDay ? 'Light morning then full (Eri day 1)' : 'Suggested ration',
    );
    await deductLeafKg(
      repositories: repositories,
      species: batch.species,
      kg: plan.suggestedGrams / 1000,
      batchId: batch.id,
    );
    return true;
  }

  Future<void> logDeaths({
    required AppRepositories repositories,
    required String batchId,
    required int count,
    String? disease,
    String? notes,
    String? photoPath,
    bool isolated = false,
  }) async {
    await repositories.mortalityLogs.create(
      batchId: batchId,
      recordedAt: DateTime.now(),
      count: count,
      disease: disease,
      notes: notes,
      photoPath: photoPath,
      isolated: isolated || disease == 'Pebrine',
    );
  }

  Future<String?> savePhoto({
    required AppRepositories repositories,
    required String sourcePath,
  }) async {
    final source = File(sourcePath);
    if (!await source.exists()) return null;
    final dir = await repositories.storageDirectory();
    final photos = Directory('${dir.path}/photos');
    if (!await photos.exists()) await photos.create(recursive: true);
    final dest = File('${photos.path}/${DateTime.now().millisecondsSinceEpoch}.jpg');
    await source.copy(dest.path);
    return dest.path;
  }

  Future<void> logHouseFeel({
    required AppRepositories repositories,
    required String batchId,
    required HouseFeel feel,
  }) async {
    await repositories.environmentLogs.create(
      batchId: batchId,
      recordedAt: DateTime.now(),
      temperatureCelsius: feel.temperatureC,
      humidityPercent: feel.humidityPercent,
      notes: feel.label,
    );
  }

  Future<void> deductLeafKg({
    required AppRepositories repositories,
    required Species species,
    required double kg,
    String? batchId,
  }) async {
    await const LeafLedgerService().recordFeedDeduction(
      repositories: repositories,
      species: species,
      kg: kg,
      batchId: batchId,
    );
  }

  static const coolDry = HouseFeel(temperatureC: 20, humidityPercent: 55, label: 'Cool and dry');
  static const typical = HouseFeel(temperatureC: 26, humidityPercent: 75, label: 'House OK');
  static const hotWet = HouseFeel(temperatureC: 32, humidityPercent: 90, label: 'Hot and wet');
  static const coolOk = HouseFeel(temperatureC: 20, humidityPercent: 75, label: 'Too cool');
  static const hotOk = HouseFeel(temperatureC: 32, humidityPercent: 75, label: 'Too hot');
  static const okDry = HouseFeel(temperatureC: 26, humidityPercent: 55, label: 'Too dry');
  static const okWet = HouseFeel(temperatureC: 26, humidityPercent: 90, label: 'Too wet');
}
