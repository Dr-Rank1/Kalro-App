import '../models/leaf_inventory.dart';
import '../models/leaf_movement.dart';
import '../models/species.dart';
import 'app_repositories.dart';

class LeafLedgerService {
  const LeafLedgerService();

  static double daysOfCover({required double stockKg, required double dailyNeedKg}) {
    if (dailyNeedKg <= 0) return stockKg > 0 ? 99 : 0;
    return stockKg / dailyNeedKg;
  }

  static LeafHost hostForSpecies(Species species) =>
      species == Species.bombyx ? LeafHost.mulberry : LeafHost.castor;

  Future<void> addStock({
    required AppRepositories repositories,
    required LeafHost host,
    required double kg,
    required LeafMovementKind kind,
    String? notes,
  }) async {
    if (kg <= 0) return;
    final stock = await repositories.leafInventory.get();
    await repositories.leafInventory.save(_apply(stock, host, kg));
    await repositories.leafMovements.create(
      host: host,
      kg: kg,
      kind: kind,
      notes: notes,
    );
  }

  Future<void> recordFeedDeduction({
    required AppRepositories repositories,
    required Species species,
    required double kg,
    String? batchId,
  }) async {
    if (kg <= 0) return;
    final stock = await repositories.leafInventory.get();
    if (species == Species.bombyx) {
      final used = kg <= stock.mulberryKg ? kg : stock.mulberryKg;
      await repositories.leafInventory.save(
        stock.copyWith(
          mulberryKg: (stock.mulberryKg - used).clamp(0, 1e9),
          updatedAt: DateTime.now(),
        ),
      );
      if (used > 0) {
        await repositories.leafMovements.create(
          host: LeafHost.mulberry,
          kg: -used,
          kind: LeafMovementKind.feed,
          batchId: batchId,
        );
      }
      return;
    }

    var remaining = kg;
    final fromCastor = remaining <= stock.castorKg ? remaining : stock.castorKg;
    remaining -= fromCastor;
    final fromKesseru =
        remaining <= stock.kesseruKg ? remaining : stock.kesseruKg;
    await repositories.leafInventory.save(
      stock.copyWith(
        castorKg: stock.castorKg - fromCastor,
        kesseruKg: stock.kesseruKg - fromKesseru,
        updatedAt: DateTime.now(),
      ),
    );
    if (fromCastor > 0) {
      await repositories.leafMovements.create(
        host: LeafHost.castor,
        kg: -fromCastor,
        kind: LeafMovementKind.feed,
        batchId: batchId,
      );
    }
    if (fromKesseru > 0) {
      await repositories.leafMovements.create(
        host: LeafHost.kesseru,
        kg: -fromKesseru,
        kind: LeafMovementKind.feed,
        batchId: batchId,
      );
    }
  }

  Future<void> recordStockAdjust({
    required AppRepositories repositories,
    required LeafInventory previous,
    required LeafInventory next,
  }) async {
    Future<void> delta(LeafHost host, double before, double after) async {
      final change = after - before;
      if (change.abs() < 0.0005) return;
      await repositories.leafMovements.create(
        host: host,
        kg: change,
        kind: LeafMovementKind.adjust,
        notes: 'Manual stock edit',
      );
    }

    await delta(LeafHost.mulberry, previous.mulberryKg, next.mulberryKg);
    await delta(LeafHost.castor, previous.castorKg, next.castorKg);
    await delta(LeafHost.kesseru, previous.kesseruKg, next.kesseruKg);
  }

  LeafInventory _apply(LeafInventory stock, LeafHost host, double kg) {
    switch (host) {
      case LeafHost.mulberry:
        return stock.copyWith(
          mulberryKg: stock.mulberryKg + kg,
          updatedAt: DateTime.now(),
        );
      case LeafHost.castor:
        return stock.copyWith(
          castorKg: stock.castorKg + kg,
          updatedAt: DateTime.now(),
        );
      case LeafHost.kesseru:
        return stock.copyWith(
          kesseruKg: stock.kesseruKg + kg,
          updatedAt: DateTime.now(),
        );
    }
  }
}
