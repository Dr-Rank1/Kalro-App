import 'dart:io';

import 'package:excel/excel.dart';
import 'package:path_provider/path_provider.dart';

import 'app_repositories.dart';

class ExcelExportService {
  const ExcelExportService();

  Future<File> exportFarmWorkbook({
    required AppRepositories repositories,
    String? farmName,
    Directory? outputDirectory,
  }) async {
    final excel = Excel.createExcel();

    // 1. Batches
    final batchSheet = excel['Batches'];
    batchSheet.appendRow([
      TextCellValue('Batch ID'),
      TextCellValue('Species'),
      TextCellValue('Strain'),
      TextCellValue('Egg Count'),
      TextCellValue('Start Date'),
      TextCellValue('Status'),
      TextCellValue('Location / House'),
      TextCellValue('Caretaker'),
    ]);

    final batches = await repositories.batches.getAll();
    for (final b in batches) {
      batchSheet.appendRow([
        TextCellValue(b.id),
        TextCellValue(b.species.label),
        TextCellValue(b.strain ?? 'Standard'),
        IntCellValue(b.eggCount),
        TextCellValue(b.startDate.toIso8601String().split('T').first),
        TextCellValue(b.status.name),
        TextCellValue(b.location ?? ''),
        TextCellValue(b.caretaker ?? ''),
      ]);
    }

    // 2. Feeding Ledger
    final feedSheet = excel['Feeding_Ledger'];
    feedSheet.appendRow([
      TextCellValue('Batch ID'),
      TextCellValue('Recorded At'),
      TextCellValue('Feed Type'),
      TextCellValue('Quantity (g)'),
      TextCellValue('Stage'),
      TextCellValue('Notes'),
    ]);

    final feedLogs = await repositories.feedLogs.getAll();
    for (final f in feedLogs) {
      feedSheet.appendRow([
        TextCellValue(f.batchId),
        TextCellValue(f.recordedAt.toIso8601String()),
        TextCellValue(f.feedType),
        DoubleCellValue(f.quantityGrams),
        TextCellValue(f.feedingStage ?? ''),
        TextCellValue(f.notes ?? ''),
      ]);
    }

    // 3. Health & Mortality
    final healthSheet = excel['Health_Mortality'];
    healthSheet.appendRow([
      TextCellValue('Batch ID'),
      TextCellValue('Recorded At'),
      TextCellValue('Deaths'),
      TextCellValue('Disease / Reason'),
      TextCellValue('Treatment'),
      TextCellValue('Isolated'),
      TextCellValue('Notes'),
    ]);

    final mortalities = await repositories.mortalityLogs.getAll();
    for (final m in mortalities) {
      healthSheet.appendRow([
        TextCellValue(m.batchId),
        TextCellValue(m.recordedAt.toIso8601String()),
        IntCellValue(m.count),
        TextCellValue(m.disease ?? m.reason ?? 'Unknown'),
        TextCellValue(m.treatment ?? ''),
        BoolCellValue(m.isolated),
        TextCellValue(m.notes ?? ''),
      ]);
    }

    // 4. Environment
    final envSheet = excel['Environment'];
    envSheet.appendRow([
      TextCellValue('Batch ID'),
      TextCellValue('Recorded At'),
      TextCellValue('Temperature (°C)'),
      TextCellValue('Humidity (%)'),
      TextCellValue('Ventilation'),
      TextCellValue('Light'),
      TextCellValue('Notes'),
    ]);

    final envLogs = await repositories.environmentLogs.getAll();
    for (final e in envLogs) {
      envSheet.appendRow([
        TextCellValue(e.batchId),
        TextCellValue(e.recordedAt.toIso8601String()),
        DoubleCellValue(e.temperatureCelsius),
        DoubleCellValue(e.humidityPercent),
        TextCellValue(e.ventilation ?? ''),
        TextCellValue(e.lightCondition ?? ''),
        TextCellValue(e.notes ?? ''),
      ]);
    }

    // 5. Cocoon Harvest & Quality
    final harvestSheet = excel['Cocoon_Harvest'];
    harvestSheet.appendRow([
      TextCellValue('Batch ID'),
      TextCellValue('Harvest Date'),
      TextCellValue('Cocoon Count'),
      TextCellValue('Total Weight (g)'),
      TextCellValue('Defective Count'),
      TextCellValue('Shell Weight (g)'),
      TextCellValue('Filament (cm)'),
      TextCellValue('Notes'),
    ]);

    final harvests = await repositories.cocoonHarvests.getAll();
    for (final h in harvests) {
      harvestSheet.appendRow([
        TextCellValue(h.batchId),
        TextCellValue(h.harvestDate.toIso8601String().split('T').first),
        IntCellValue(h.cocoonCount),
        DoubleCellValue(h.totalWeightGrams),
        IntCellValue(h.defectiveCount),
        DoubleCellValue(h.shellWeightGrams ?? 0.0),
        DoubleCellValue(h.filamentLengthCm ?? 0.0),
        TextCellValue(h.notes ?? ''),
      ]);
    }

    // 6. Financial Ledger
    final finSheet = excel['Financial_Ledger'];
    finSheet.appendRow([
      TextCellValue('Transaction ID'),
      TextCellValue('Recorded At'),
      TextCellValue('Direction'),
      TextCellValue('Counterparty'),
      TextCellValue('Amount (KES)'),
      TextCellValue('Description'),
      TextCellValue('Status'),
    ]);

    final payments = await repositories.payments.getAll();
    for (final p in payments) {
      finSheet.appendRow([
        TextCellValue(p.id),
        TextCellValue(p.recordedAt.toIso8601String()),
        TextCellValue(p.direction.name),
        TextCellValue(p.counterparty),
        DoubleCellValue(p.amount),
        TextCellValue(p.description),
        TextCellValue(p.status.name),
      ]);
    }

    // Remove the default empty 'Sheet1'
    if (excel.sheets.containsKey('Sheet1')) {
      excel.delete('Sheet1');
    }

    final bytes = excel.encode();
    if (bytes == null) {
      throw StateError('Could not encode Excel workbook');
    }

    final outDir = outputDirectory ?? await getTemporaryDirectory();
    final safeName = (farmName ?? 'kalro_farm')
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9_]'), '_');
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final file = File('${outDir.path}/${safeName}_export_$timestamp.xlsx');
    await file.writeAsBytes(bytes, flush: true);
    return file;
  }
}
