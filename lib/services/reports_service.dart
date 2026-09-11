import '../models/batch_status.dart';

import '../models/payment_direction.dart';

import '../models/payment_status.dart';

import '../models/reports_summary.dart';

import '../models/species.dart';

import 'app_repositories.dart';

import 'batch_metrics_service.dart';

import 'lifecycle_engine.dart';

import 'user_preferences.dart';



class ReportsService {

  const ReportsService({

    LifecycleEngine? lifecycleEngine,

    BatchMetricsService? metricsService,

  })  : _lifecycleEngine = lifecycleEngine ?? const LifecycleEngine(),

        _metricsService = metricsService ?? const BatchMetricsService();



  final LifecycleEngine _lifecycleEngine;

  final BatchMetricsService _metricsService;



  Future<ReportsSummary> load({

    required AppRepositories repositories,

    required UserPreferences userPreferences,

  }) async {

    final batches = await repositories.batches.getAll();

    final feedLogs = await repositories.feedLogs.getAll();

    final mortalityLogs = await repositories.mortalityLogs.getAll();

    final harvests = await repositories.cocoonHarvests.getAll();

    final payments = await repositories.payments.getAll();

    final purchases = await repositories.purchaseOrders.getAll();

    final orgName = await userPreferences.getOrgName();

    final today = _dateOnly(DateTime.now());



    var activeBatches = 0;

    var closedBatches = 0;

    var bombyxLarvae = 0;

    var eriLarvae = 0;

    var upcomingMilestones = 0;

    var totalMortality = 0;

    var survivalSum = 0.0;

    var survivalSamples = 0;



    for (final batch in batches) {

      if (batch.status == BatchStatus.closed) {

        closedBatches++;

        continue;

      }

      activeBatches++;

      if (batch.species == Species.bombyx) {

        bombyxLarvae += batch.eggCount;

      } else {

        eriLarvae += batch.eggCount;

      }



      final batchMortality = mortalityLogs

          .where((l) => l.batchId == batch.id)

          .fold<int>(0, (sum, l) => sum + l.count);

      totalMortality += batchMortality;

      if (batch.eggCount > 0) {

        survivalSum +=

            _metricsService.compute(batch, batchMortality).survivalRatePercent;

        survivalSamples++;

      }



      final observations =

          await repositories.milestoneObservations.stageDatesForBatch(batch.id);

      for (final milestone in _lifecycleEngine.predict(

        batch,

        observedStageDates: observations,

      )) {

        final daysUntil =

            _dateOnly(milestone.effectiveDate).difference(today).inDays;

        if (daysUntil >= 0 && daysUntil <= 7) {

          upcomingMilestones++;

        }

      }

    }



    var totalFeed = 0.0;

    for (final log in feedLogs) {

      totalFeed += log.quantityGrams;

    }



    var totalHarvestWeight = 0.0;

    for (final harvest in harvests) {

      totalHarvestWeight += harvest.totalWeightGrams;

    }



    var totalReceivable = 0.0;

    var totalPayable = 0.0;

    var settledPayments = 0;

    var pendingPayments = 0;



    for (final payment in payments) {

      if (payment.status == PaymentStatus.settled) {

        settledPayments++;

      } else {

        pendingPayments++;

        if (payment.direction == PaymentDirection.receivable) {

          totalReceivable += payment.amount;

        } else {

          totalPayable += payment.amount;

        }

      }

    }



    var purchaseSpend = 0.0;

    for (final order in purchases) {

      purchaseSpend += order.amount ?? 0;

    }



    return ReportsSummary(

      orgName: orgName,

      generatedAt: DateTime.now(),

      totalBatches: batches.length,

      activeBatches: activeBatches,

      closedBatches: closedBatches,

      bombyxLarvae: bombyxLarvae,

      eriLarvae: eriLarvae,

      totalFeedGrams: totalFeed,

      feedLogCount: feedLogs.length,

      totalReceivable: totalReceivable,

      totalPayable: totalPayable,

      purchaseSpend: purchaseSpend,

      purchaseOrderCount: purchases.length,

      settledPayments: settledPayments,

      pendingPayments: pendingPayments,

      upcomingMilestones: upcomingMilestones,

      totalMortality: totalMortality,

      averageSurvivalPercent:

          survivalSamples > 0 ? survivalSum / survivalSamples : 100,

      totalHarvestWeightGrams: totalHarvestWeight,

      harvestCount: harvests.length,

    );

  }



  DateTime _dateOnly(DateTime date) {

    return DateTime(date.year, date.month, date.day);

  }

}


