import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/batch.dart';
import 'package:kalro/models/batch_alert.dart';
import 'package:kalro/models/batch_status.dart';
import 'package:kalro/models/environment_log.dart';
import 'package:kalro/models/mortality_log.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/alert_service.dart';

void main() {
  const alertService = AlertService();

  test('flags low survival and temperature stress', () {
    final batch = Batch(
      id: 'b1',
      species: Species.bombyx,
      startDate: DateTime(2025, 1, 1),
      eggCount: 100,
      status: BatchStatus.active,
      createdAt: DateTime(2025, 1, 1),
    );

    final alerts = alertService.evaluate(
      batches: [batch],
      mortalityLogs: [
        MortalityLog(
          id: 'm1',
          batchId: 'b1',
          recordedAt: DateTime.now(),
          count: 25,
        ),
      ],
      environmentLogs: [
        EnvironmentLog(
          id: 'e1',
          batchId: 'b1',
          recordedAt: DateTime.now(),
          temperatureCelsius: 32,
          humidityPercent: 75,
        ),
      ],
      feedLogs: const [],
    );

    expect(alerts.any((a) => a.type == BatchAlertType.survival), isTrue);
    expect(alerts.any((a) => a.type == BatchAlertType.environment), isTrue);
  });
}
