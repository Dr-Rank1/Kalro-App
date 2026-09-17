import 'package:intl/intl.dart';

import '../models/batch_status.dart';
import '../models/report_chart_data.dart';
import 'app_repositories.dart';
import 'batch_metrics_service.dart';

class ReportChartService {
  const ReportChartService({
    BatchMetricsService? metricsService,
  }) : _metricsService = metricsService ?? const BatchMetricsService();

  final BatchMetricsService _metricsService;
  static const _trendDays = 14;

  Future<ReportChartData> load(
    AppRepositories repositories, {
    int days = _trendDays,
    String? batchId,
  }) async {
    final batches = await repositories.batches.getAll();
    final feedLogs = await repositories.feedLogs.getAll();
    final mortalityLogs = await repositories.mortalityLogs.getAll();
    final harvests = await repositories.cocoonHarvests.getAll();
    final dateFormat = DateFormat.MMMd();
    final today = _dateOnly(DateTime.now());
    final range = days <= 0 ? _trendDays : days;

    final feedByDay = <DateTime, double>{};
    final mortalityByDay = <DateTime, int>{};
    for (var i = range - 1; i >= 0; i--) {
      final day = today.subtract(Duration(days: i));
      feedByDay[day] = 0;
      mortalityByDay[day] = 0;
    }

    for (final log in feedLogs) {
      if (batchId != null && log.batchId != batchId) continue;
      final day = _dateOnly(log.recordedAt);
      if (feedByDay.containsKey(day)) {
        feedByDay[day] = feedByDay[day]! + log.quantityGrams;
      }
    }

    for (final log in mortalityLogs) {
      if (batchId != null && log.batchId != batchId) continue;
      final day = _dateOnly(log.recordedAt);
      if (mortalityByDay.containsKey(day)) {
        mortalityByDay[day] = mortalityByDay[day]! + log.count;
      }
    }

    var bombyxLarvae = 0;
    var eriLarvae = 0;
    final comparisons = <BatchComparisonRow>[];

    for (final batch in batches) {
      if (batchId != null && batch.id != batchId) continue;
      if (batch.status == BatchStatus.closed) continue;

      final mortality = mortalityLogs
          .where((l) => l.batchId == batch.id)
          .fold<int>(0, (sum, l) => sum + l.count);
      final metrics = _metricsService.compute(batch, mortality);

      if (batch.species.name == 'bombyx') {
        bombyxLarvae += metrics.liveCount;
      } else {
        eriLarvae += metrics.liveCount;
      }

      var feedTotal = 0.0;
      for (final log in feedLogs) {
        if (log.batchId == batch.id) feedTotal += log.quantityGrams;
      }

      var harvestWeight = 0.0;
      for (final h in harvests) {
        if (h.batchId == batch.id) harvestWeight += h.totalWeightGrams;
      }

      comparisons.add(
        BatchComparisonRow(
          batchId: batch.id,
          speciesLabel: batch.species.label,
          startDateLabel: dateFormat.format(batch.startDate),
          startingCount: batch.eggCount,
          liveCount: metrics.liveCount,
          survivalPercent: metrics.survivalRatePercent,
          totalFeedGrams: feedTotal,
          harvestWeightGrams: harvestWeight,
          statusLabel: batch.status.label,
        ),
      );
    }

    comparisons.sort((a, b) => b.survivalPercent.compareTo(a.survivalPercent));

    return ReportChartData(
      feedTrend: feedByDay.entries
          .map((e) => ChartPoint(label: dateFormat.format(e.key), value: e.value))
          .toList(),
      mortalityTrend: mortalityByDay.entries
          .map((e) => ChartPoint(label: dateFormat.format(e.key), value: e.value.toDouble()))
          .toList(),
      bombyxLarvae: bombyxLarvae,
      eriLarvae: eriLarvae,
      batchComparisons: comparisons,
    );
  }

  DateTime _dateOnly(DateTime date) {
    return DateTime(date.year, date.month, date.day);
  }
}
