import 'dart:io';

import 'package:excel/excel.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/payment_direction.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/excel_export_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late AppRepositories repositories;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_excel_test');
    repositories = AppRepositories(storageDirectory: tempDir);
  });

  tearDown(() async {
    await repositories.store.close();
    if (tempDir.existsSync()) await tempDir.delete(recursive: true);
  });

  test('generates a multi-sheet Excel file with structured farm data', () async {
    final batch = await repositories.batches.create(
      species: Species.bombyx,
      startDate: DateTime(2026, 3, 1),
      eggCount: 300,
      location: 'House A',
    );

    await repositories.feedLogs.create(
      batchId: batch.id,
      recordedAt: DateTime(2026, 3, 2),
      feedType: 'Mulberry',
      quantityGrams: 250,
    );

    await repositories.mortalityLogs.create(
      batchId: batch.id,
      recordedAt: DateTime(2026, 3, 3),
      count: 2,
      disease: 'Flacherie',
    );

    await repositories.environmentLogs.create(
      batchId: batch.id,
      recordedAt: DateTime(2026, 3, 3),
      temperatureCelsius: 25.5,
      humidityPercent: 78.0,
      ventilation: 'Good',
      lightCondition: 'Filtered',
    );

    await repositories.cocoonHarvests.create(
      batchId: batch.id,
      harvestDate: DateTime(2026, 3, 28),
      cocoonCount: 280,
      totalWeightGrams: 560,
    );

    await repositories.payments.create(
      counterparty: 'Kiambu Cooperative',
      description: 'Cocoon sales',
      amount: 14000,
      direction: PaymentDirection.receivable,
      recordedAt: DateTime(2026, 3, 29),
    );

    const service = ExcelExportService();
    final file = await service.exportFarmWorkbook(
      repositories: repositories,
      farmName: 'TestFarm',
      outputDirectory: tempDir,
    );

    expect(file.existsSync(), isTrue);
    expect(file.lengthSync(), greaterThan(500));

    // Decode and verify sheets
    final bytes = file.readAsBytesSync();
    final decoded = Excel.decodeBytes(bytes);
    expect(decoded.sheets.containsKey('Batches'), isTrue);
    expect(decoded.sheets.containsKey('Feeding_Ledger'), isTrue);
    expect(decoded.sheets.containsKey('Health_Mortality'), isTrue);
    expect(decoded.sheets.containsKey('Environment'), isTrue);
    expect(decoded.sheets.containsKey('Cocoon_Harvest'), isTrue);
    expect(decoded.sheets.containsKey('Financial_Ledger'), isTrue);

    // Verify row contents
    final batchSheet = decoded['Batches'];
    expect(batchSheet.rows.length, 2); // header + 1 record
  });
}
