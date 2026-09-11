import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/inventory_settings.dart';
import 'package:kalro/services/inventory_settings_repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late InventorySettingsRepository repository;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('kalro_inventory_settings_test');
    repository = InventorySettingsRepository(storageDirectory: tempDir);
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  test('returns defaults and persists updates', () async {
    final initial = await repository.get();
    expect(initial.bombyxPrice, InventorySettings.defaults.bombyxPrice);

    await repository.update(eriPrice: 750);

    final reloaded = InventorySettingsRepository(storageDirectory: tempDir);
    final updated = await reloaded.get();
    expect(updated.eriPrice, 750);
    expect(updated.bombyxPrice, InventorySettings.defaults.bombyxPrice);
  });
}
