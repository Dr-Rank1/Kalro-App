import '../constants/environment_thresholds.dart';
import '../models/batch.dart';
import '../models/batch_alert.dart';
import '../models/batch_status.dart';
import '../models/environment_log.dart';
import '../models/feed_log.dart';
import '../models/mortality_log.dart';
import 'batch_metrics_service.dart';
import 'lifecycle_engine.dart';

class AlertService {
  const AlertService({
    BatchMetricsService? metricsService,
    LifecycleEngine? lifecycleEngine,
  })  : _metricsService = metricsService ?? const BatchMetricsService(),
        _lifecycleEngine = lifecycleEngine ?? const LifecycleEngine();

  final BatchMetricsService _metricsService;
  final LifecycleEngine _lifecycleEngine;

  static const survivalWarningPercent = 80.0;
  static const dailyMortalityWarningPercent = 5.0;

  List<BatchAlert> evaluate({
    required List<Batch> batches,
    required List<MortalityLog> mortalityLogs,
    required List<EnvironmentLog> environmentLogs,
    required List<FeedLog> feedLogs,
  }) {
    final alerts = <BatchAlert>[];
    final active = batches.where((b) => b.status != BatchStatus.closed);

    for (final batch in active) {
      final batchMortality =
          mortalityLogs.where((l) => l.batchId == batch.id).toList();
      final totalMortality =
          batchMortality.fold<int>(0, (sum, l) => sum + l.count);
      final metrics = _metricsService.compute(batch, totalMortality);

      if (metrics.survivalRatePercent < survivalWarningPercent &&
          metrics.startingCount > 0) {
        alerts.add(
          BatchAlert(
            type: BatchAlertType.survival,
            severity: metrics.survivalRatePercent < 60
                ? BatchAlertSeverity.critical
                : BatchAlertSeverity.warning,
            title: 'Low survival — ${batch.species.label}',
            message:
                '${metrics.survivalRatePercent.toStringAsFixed(0)}% survival (${metrics.liveCount} live of ${metrics.startingCount}).',
            batchId: batch.id,
          ),
        );
      }

      final todayMortality = _todayMortality(batchMortality);
      if (todayMortality > 0 && batch.eggCount > 0) {
        final dailyRate = (todayMortality / batch.eggCount) * 100;
        if (dailyRate >= dailyMortalityWarningPercent) {
          alerts.add(
            BatchAlert(
              type: BatchAlertType.mortality,
              severity: BatchAlertSeverity.warning,
              title: 'High mortality today',
              message:
                  '$todayMortality larvae lost today (${dailyRate.toStringAsFixed(1)}% of batch).',
              batchId: batch.id,
            ),
          );
        }
      }

      final latestEnv = _latestEnvironment(batch.id, environmentLogs);
      if (latestEnv != null) {
        final thresholds = EnvironmentThresholds.forSpecies(batch.species);
        if (!thresholds.isTemperatureOk(latestEnv.temperatureCelsius)) {
          alerts.add(
            BatchAlert(
              type: BatchAlertType.environment,
              severity: BatchAlertSeverity.warning,
              title: 'Temperature out of range',
              message:
                  '${latestEnv.temperatureCelsius.toStringAsFixed(1)}°C recorded (ideal ${thresholds.minTempC}–${thresholds.maxTempC}°C).',
              batchId: batch.id,
            ),
          );
        }
        if (!thresholds.isHumidityOk(latestEnv.humidityPercent)) {
          alerts.add(
            BatchAlert(
              type: BatchAlertType.environment,
              severity: BatchAlertSeverity.info,
              title: 'Humidity out of range',
              message:
                  '${latestEnv.humidityPercent.toStringAsFixed(0)}% humidity (ideal ${thresholds.minHumidity.toStringAsFixed(0)}–${thresholds.maxHumidity.toStringAsFixed(0)}%).',
              batchId: batch.id,
            ),
          );
        }
      }

      if (!_fedToday(batch.id, feedLogs)) {
        final current = _lifecycleEngine.currentStage(batch);
        if (current != null && current.instarNumber != null) {
          alerts.add(
            BatchAlert(
              type: BatchAlertType.feeding,
              severity: BatchAlertSeverity.info,
              title: 'No feeding logged today',
              message: '${batch.species.label} batch at ${current.label}.',
              batchId: batch.id,
            ),
          );
        }
      }
    }

    alerts.sort((a, b) {
      final severityOrder = {
        BatchAlertSeverity.critical: 0,
        BatchAlertSeverity.warning: 1,
        BatchAlertSeverity.info: 2,
      };
      return severityOrder[a.severity]!.compareTo(severityOrder[b.severity]!);
    });

    return alerts;
  }

  int _todayMortality(List<MortalityLog> logs) {
    final today = _dateOnly(DateTime.now());
    return logs
        .where((l) => _dateOnly(l.recordedAt) == today)
        .fold<int>(0, (sum, l) => sum + l.count);
  }

  EnvironmentLog? _latestEnvironment(String batchId, List<EnvironmentLog> logs) {
    EnvironmentLog? latest;
    for (final log in logs) {
      if (log.batchId != batchId) continue;
      if (latest == null || log.recordedAt.isAfter(latest.recordedAt)) {
        latest = log;
      }
    }
    return latest;
  }

  bool _fedToday(String batchId, List<FeedLog> logs) {
    final today = _dateOnly(DateTime.now());
    return logs.any(
      (l) => l.batchId == batchId && _dateOnly(l.recordedAt) == today,
    );
  }

  DateTime _dateOnly(DateTime date) {
    return DateTime(date.year, date.month, date.day);
  }
}
