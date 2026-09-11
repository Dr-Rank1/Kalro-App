import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../utils/kalro_formatters.dart';

import '../../models/dashboard_summary.dart';
import 'kalro_stat_card.dart';

class DashboardStatGrid extends StatelessWidget {
  DashboardStatGrid({super.key, required this.stats});

  final List<DashboardStat> stats;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.45,
      children: stats
          .map(
            (stat) => KalroStatCard(
              icon: stat.icon,
              title: stat.title,
              value: stat.value,
            ),
          )
          .toList(),
    );
  }

  static List<DashboardStat> defaultPaymentStats() {
    final currency = KalroFormatters.currency;
    return [
      DashboardStat(Icons.show_chart, 'Total Sales', currency.format(0)),
      DashboardStat(Icons.shopping_bag_outlined, 'Total Purchase', currency.format(0)),
      DashboardStat(Icons.savings_outlined, 'Total Received', currency.format(0)),
      DashboardStat(Icons.credit_card_outlined, 'Total Paid', currency.format(0)),
    ];
  }

  static List<DashboardStat> fromRearingSummary(DashboardSummary summary) {
    final number = NumberFormat.decimalPattern();
    return [
      DashboardStat(
        Icons.layers_outlined,
        'Active Batches',
        summary.activeBatchCount.toString(),
      ),
      DashboardStat(
        Icons.bug_report_outlined,
        'Live Larvae',
        number.format(summary.liveLarvae),
      ),
      DashboardStat(
        Icons.favorite_outline,
        'Survival',
        '${summary.averageSurvivalPercent.toStringAsFixed(0)}%',
      ),
      DashboardStat(
        Icons.notifications_outlined,
        'Alerts',
        summary.alertCount.toString(),
      ),
    ];
  }

}

class DashboardStat {
  DashboardStat(this.icon, this.title, this.value);

  final IconData icon;
  final String title;
  final String value;
}
