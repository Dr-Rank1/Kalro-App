import '../models/batch.dart';
import '../models/leaf_inventory.dart';
import '../models/leaf_movement.dart';
import '../models/species.dart';
import 'app_repositories.dart';
import 'rearing_day_service.dart';

enum DepletionUrgency {
  safe,
  warning,
  critical,
  exhausted,
}

class LeafDepletionForecast {
  const LeafDepletionForecast({
    required this.currentStockKg,
    required this.dailyProjectedNeedsKg,
    required this.daysUntilDepletion,
    required this.depletionDate,
    required this.totalCycleNeedKg,
    required this.deficitKg,
    required this.urgency,
  });

  final double currentStockKg;
  final List<double> dailyProjectedNeedsKg;
  final int daysUntilDepletion;
  final DateTime? depletionDate;
  final double totalCycleNeedKg;
  final double deficitKg;
  final DepletionUrgency urgency;
}

class LeafLedgerService {
  const LeafLedgerService();

  LeafDepletionForecast calculateDepletionForecast({
    required double currentStockKg,
    required List<Batch> activeBatches,
    RearingDayService rearingDayService = const RearingDayService(),
    DateTime? now,
  }) {
    final today = now ?? DateTime.now();
    final dailyNeeds = <double>[];
    var runningStock = currentStockKg;
    int? depletionDay;
    var totalNeed = 0.0;

    for (var d = 0; d < 14; d++) {
      final targetDate = today.add(Duration(days: d));
      var dayGrams = 0.0;
      for (final batch in activeBatches) {
        final plan = rearingDayService.planFor(
          batch,
          liveCount: batch.eggCount,
          now: targetDate,
        );
        if (plan != null) {
          dayGrams += plan.suggestedGrams;
        }
      }
      final dayKg = dayGrams / 1000.0;
      dailyNeeds.add(dayKg);
      totalNeed += dayKg;

      runningStock -= dayKg;
      if (runningStock <= 0 && depletionDay == null) {
        depletionDay = d;
      }
    }

    final days = currentStockKg <= 0
        ? 0
        : (depletionDay ?? (runningStock > 0 ? 14 : 0));
    final depDate = days < 14 ? today.add(Duration(days: days)) : null;
    final deficit = (totalNeed - currentStockKg).clamp(0.0, 1e9);

    final DepletionUrgency urgency;
    if (currentStockKg <= 0 && totalNeed > 0) {
      urgency = DepletionUrgency.exhausted;
    } else if (days < 3) {
      urgency = DepletionUrgency.critical;
    } else if (days <= 7) {
      urgency = DepletionUrgency.warning;
    } else {
      urgency = DepletionUrgency.safe;
    }

    return LeafDepletionForecast(
      currentStockKg: currentStockKg,
      dailyProjectedNeedsKg: dailyNeeds,
      daysUntilDepletion: days,
      depletionDate: depDate,
      totalCycleNeedKg: totalNeed,
      deficitKg: deficit,
      urgency: urgency,
    );
  }

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
