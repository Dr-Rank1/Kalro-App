import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/payment_direction.dart';
import 'package:kalro/services/payment_repository.dart';
import 'package:uuid/uuid.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late PaymentRepository repository;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_payment_test');
    repository = PaymentRepository(
      uuid: const Uuid(),
      storageDirectory: tempDir,
    );
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('create, settle, and delete payment records', () async {
    expect(await repository.getAll(), isEmpty);

    final record = await repository.create(
      counterparty: 'Local Buyer',
      description: 'Cocoon sale',
      amount: 1500,
      direction: PaymentDirection.receivable,
      recordedAt: DateTime(2026, 3, 1),
    );

    final reloaded = PaymentRepository(
      uuid: const Uuid(),
      storageDirectory: tempDir,
    );
    final records = await reloaded.getAll();
    expect(records, hasLength(1));
    expect(records.single.id, record.id);
    expect(records.single.amount, 1500);

    final settled = await repository.markSettled(record.id);
    expect(settled.status.name, 'settled');
    expect(settled.settledAt, isNotNull);

    await repository.delete(record.id);
    expect(await repository.getAll(), isEmpty);
  });
}
