import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/batch.dart';
import 'package:kalro/models/batch_status.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/csv_export_service.dart';

void main() {
  const exporter = CsvExportService();

  test('includes batch header and rows', () {
    final csv = exporter.exportFarmSummary(
      batches: [
        Batch(
          id: 'b1',
          species: Species.eri,
          startDate: DateTime(2025, 3, 1),
          eggCount: 50,
          status: BatchStatus.active,
          createdAt: DateTime(2025, 3, 1),
        ),
      ],
      feedLogs: const [],
      mortalityLogs: const [],
      environmentLogs: const [],
      harvests: const [],
    );

    expect(csv, contains('Kalro Sericulture'));
    expect(csv, contains('Batches'));
    expect(csv, contains('b1'));
    expect(csv, contains('eri'));
  });
}
