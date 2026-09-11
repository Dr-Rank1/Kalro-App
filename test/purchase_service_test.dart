import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/payment_direction.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/purchase_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late AppRepositories repositories;
  const purchaseService = PurchaseService();

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_purchase_service_test');
    repositories = AppRepositories(storageDirectory: tempDir);
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('summary lists producers, orders, and spend totals', () async {
    final producer = (await repositories.producers.getAll()).first;

    await repositories.purchaseOrders.create(
      producerId: producer.id,
      producerName: producer.name,
      itemDescription: 'DFL batch',
      quantity: 2,
      unit: 'DFL',
      orderedAt: DateTime(2026, 3, 1),
      amount: 1200,
      species: Species.bombyx,
    );

    final payment = await repositories.payments.create(
      counterparty: producer.name,
      description: 'DFL batch',
      amount: 1200,
      direction: PaymentDirection.payable,
      recordedAt: DateTime(2026, 3, 1),
    );

    await repositories.purchaseOrders.create(
      producerId: producer.id,
      producerName: producer.name,
      itemDescription: 'Second order',
      quantity: 1,
      unit: 'lot',
      orderedAt: DateTime(2026, 3, 2),
      amount: 500,
      paymentRecordId: payment.id,
    );

    final summary = await purchaseService.load(repositories);

    expect(summary.hasProducers, isTrue);
    expect(summary.totalOrders, 2);
    expect(summary.totalSpend, 1700);
    expect(summary.recentOrders.first.itemDescription, 'Second order');
  });
}
