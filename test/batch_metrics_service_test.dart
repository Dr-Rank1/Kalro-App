import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/batch.dart';
import 'package:kalro/models/batch_status.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/batch_metrics_service.dart';

void main() {
  const service = BatchMetricsService();

  test('computes live count and survival rate', () {
    final batch = Batch(
      id: 'b1',
      species: Species.bombyx,
      startDate: DateTime(2025, 1, 1),
      eggCount: 200,
      status: BatchStatus.active,
      createdAt: DateTime(2025, 1, 1),
    );

    final metrics = service.compute(batch, 30);

    expect(metrics.liveCount, 170);
    expect(metrics.survivalRatePercent, 85);
  });
}
