import '../models/batch.dart';
import '../models/cocoon_harvest.dart';
import '../models/environment_log.dart';
import '../models/feed_log.dart';
import '../models/mortality_log.dart';

class CsvExportService {
  const CsvExportService();

  String exportFarmSummary({
    required List<Batch> batches,
    required List<FeedLog> feedLogs,
    required List<MortalityLog> mortalityLogs,
    required List<EnvironmentLog> environmentLogs,
    required List<CocoonHarvest> harvests,
  }) {
    final buffer = StringBuffer();
    buffer.writeln('Kalro Sericulture — Farm export');
    buffer.writeln('Generated,${DateTime.now().toIso8601String()}');
    buffer.writeln();

    buffer.writeln('Batches');
    buffer.writeln(
      'id,species,startDate,eggCount,status,strain,location,caretaker',
    );
    for (final batch in batches) {
      buffer.writeln(_batchRow(batch));
    }
    buffer.writeln();

    buffer.writeln('Feed logs');
    buffer.writeln('batchId,recordedAt,feedType,quantityGrams,feedingStage');
    for (final log in feedLogs) {
      buffer.writeln(
        '${log.batchId},${log.recordedAt.toIso8601String()},${_escape(log.feedType)},${log.quantityGrams},${_escape(log.feedingStage ?? '')}',
      );
    }
    buffer.writeln();

    buffer.writeln('Mortality logs');
    buffer.writeln('batchId,recordedAt,count,disease,treatment,isolated');
    for (final log in mortalityLogs) {
      buffer.writeln(
        '${log.batchId},${log.recordedAt.toIso8601String()},${log.count},${_escape(log.disease ?? '')},${_escape(log.treatment ?? '')},${log.isolated}',
      );
    }
    buffer.writeln();

    buffer.writeln('Environment logs');
    buffer.writeln('batchId,recordedAt,temperatureC,humidityPercent');
    for (final log in environmentLogs) {
      buffer.writeln(
        '${log.batchId},${log.recordedAt.toIso8601String()},${log.temperatureCelsius},${log.humidityPercent}',
      );
    }
    buffer.writeln();

    buffer.writeln('Cocoon harvests');
    buffer.writeln('batchId,harvestDate,cocoonCount,totalWeightGrams,defectiveCount');
    for (final h in harvests) {
      buffer.writeln(
        '${h.batchId},${h.harvestDate.toIso8601String()},${h.cocoonCount},${h.totalWeightGrams},${h.defectiveCount}',
      );
    }

    return buffer.toString();
  }

  String _batchRow(Batch batch) {
    return [
      batch.id,
      batch.species.name,
      batch.startDate.toIso8601String(),
      batch.eggCount,
      batch.status.name,
      _escape(batch.strain ?? ''),
      _escape(batch.location ?? ''),
      _escape(batch.caretaker ?? ''),
    ].join(',');
  }

  String _escape(String value) {
    if (value.contains(',') || value.contains('"')) {
      return '"${value.replaceAll('"', '""')}"';
    }
    return value;
  }
}
