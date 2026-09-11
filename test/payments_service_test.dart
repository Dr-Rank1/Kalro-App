import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/payment_direction.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/payments_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late AppRepositories repositories;
  const paymentsService = PaymentsService();

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_payments_service_test');
    repositories = AppRepositories(storageDirectory: tempDir);
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('summary totals pending receivables and payables', () async {
    await repositories.payments.create(
      counterparty: 'Buyer A',
      description: 'Cocoon sale',
      amount: 2000,
      direction: PaymentDirection.receivable,
      recordedAt: DateTime(2026, 3, 1),
    );
    await repositories.payments.create(
      counterparty: 'Seed Supplier',
      description: 'DFL purchase',
      amount: 800,
      direction: PaymentDirection.payable,
      recordedAt: DateTime(2026, 3, 2),
    );
    final settled = await repositories.payments.create(
      counterparty: 'Old Buyer',
      description: 'Settled sale',
      amount: 500,
      direction: PaymentDirection.receivable,
      recordedAt: DateTime(2026, 2, 1),
    );
    await repositories.payments.markSettled(settled.id);

    final summary = await paymentsService.load(repositories);

    expect(summary.totalReceivable, 2000);
    expect(summary.totalPayable, 800);
    expect(summary.pendingSettlements, 2800);
    expect(summary.recentRecords, hasLength(3));
  });
}
