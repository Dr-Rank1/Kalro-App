import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../utils/kalro_formatters.dart';

import '../components/components.dart';
import '../components/reports/report_charts.dart';
import '../models/report_chart_data.dart';
import '../models/reports_summary.dart';
import '../services/app_repositories.dart';
import '../services/csv_export_service.dart';
import '../services/pdf_export_service.dart';
import '../services/report_chart_service.dart';
import '../services/reports_service.dart';
import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';
import 'package:kalro/l10n/translator.dart';

class _ReportsBundle {
  const _ReportsBundle({required this.summary, required this.charts});

  final ReportsSummary summary;
  final ReportChartData charts;
}

class ReportsScreen extends StatefulWidget {
  ReportsScreen({
    super.key,
    required this.repositories,
    required this.userPreferences,
  });

  final AppRepositories repositories;
  final UserPreferences userPreferences;

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final _reportsService = ReportsService();
  final _chartService = ReportChartService();
  static const _csvExport = CsvExportService();
  static const _pdfExport = PdfExportService();
  late Future<_ReportsBundle> _bundleFuture;
  var _exportingPdf = false;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _bundleFuture = _loadBundle();
    });
  }

  Future<_ReportsBundle> _loadBundle() async {
    final results = await Future.wait([
      _reportsService.load(
        repositories: widget.repositories,
        userPreferences: widget.userPreferences,
      ),
      _chartService.load(widget.repositories),
    ]);
    return _ReportsBundle(
      summary: results[0] as ReportsSummary,
      charts: results[1] as ReportChartData,
    );
  }

  Future<void> _exportCsv() async {
    final batches = await widget.repositories.batches.getAll();
    final feedLogs = await widget.repositories.feedLogs.getAll();
    final mortalityLogs = await widget.repositories.mortalityLogs.getAll();
    final environmentLogs = await widget.repositories.environmentLogs.getAll();
    final harvests = await widget.repositories.cocoonHarvests.getAll();

    final csv = _csvExport.exportFarmSummary(
      batches: batches,
      feedLogs: feedLogs,
      mortalityLogs: mortalityLogs,
      environmentLogs: environmentLogs,
      harvests: harvests,
    );

    await Clipboard.setData(ClipboardData(text: csv));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Farm data copied to clipboard as CSV'.tr)),
    );
  }

  Future<void> _exportPdf() async {
    setState(() => _exportingPdf = true);
    try {
      final file = await _pdfExport.exportFarmReport(
        repositories: widget.repositories,
        userPreferences: widget.userPreferences,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('PDF saved to ${file.path}'.tr)),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('PDF export failed: $error'.tr)),
      );
    } finally {
      if (mounted) setState(() => _exportingPdf = false);
    }
  }

  String _formatFeed(double grams) {
    if (grams >= 1000) return '${(grams / 1000).toStringAsFixed(1)} kg';
    return '${grams.round()} g';
  }

  @override
  Widget build(BuildContext context) {
    final currency = KalroFormatters.currency;
    final dateFormat = DateFormat('MMM d, yyyy · h:mm a');

    return Scaffold(
      backgroundColor: KalroColors.headerGreen,
      appBar: AppBar(
        title: Text('Reports'.tr),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Container(
        decoration: BoxDecoration(
          color: KalroColors.background,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: AsyncContent(
          future: _bundleFuture,
          builder: (context, bundle) {
            final summary = bundle.summary;
            final charts = bundle.charts;

            return KalroBackground(
              child: RefreshIndicator(
                onRefresh: () async => _reload(),
                child: ListView(
                  padding: EdgeInsets.fromLTRB(20, 20, 20, 24),
                  children: [
                    Text(
                      summary.orgName,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Generated ${dateFormat.format(summary.generatedAt)}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: KalroColors.textMuted,
                          ),
                    ),
                    SizedBox(height: 24),
                    GridView.count(
                      shrinkWrap: true,
                      physics: NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 1.45,
                      children: [
                        KalroStatCard(
                          icon: Icons.layers_outlined,
                          title: 'Active Batches'.tr,
                          value: summary.activeBatches.toString(),
                        ),
                        KalroStatCard(
                          icon: Icons.bug_report_outlined,
                          title: 'Total Larvae'.tr,
                          value: NumberFormat.decimalPattern()
                              .format(summary.bombyxLarvae + summary.eriLarvae),
                        ),
                        KalroStatCard(
                          icon: Icons.restaurant_outlined,
                          title: 'Feed Logged'.tr,
                          value: _formatFeed(summary.totalFeedGrams),
                        ),
                        KalroStatCard(
                          icon: Icons.favorite_outline,
                          title: 'Survival'.tr,
                          value: '${summary.averageSurvivalPercent.toStringAsFixed(0)}%',
                        ),
                      ],
                    ),
                    SizedBox(height: 28),
                    _ChartSection(
                      title: 'Feed trend (14 days)'.tr,
                      child: FeedTrendChart(points: charts.feedTrend),
                    ),
                    SizedBox(height: 20),
                    _ChartSection(
                      title: 'Mortality trend (14 days)'.tr,
                      child: MortalityTrendChart(points: charts.mortalityTrend),
                    ),
                    SizedBox(height: 20),
                    _ChartSection(
                      title: 'Live larvae by species'.tr,
                      child: SpeciesSplitChart(
                        bombyxLarvae: charts.bombyxLarvae,
                        eriLarvae: charts.eriLarvae,
                      ),
                    ),
                    SizedBox(height: 20),
                    _ChartSection(
                      title: 'Batch comparison'.tr,
                      child: BatchComparisonTable(rows: charts.batchComparisons),
                    ),
                    SizedBox(height: 28),
                    ReportSectionCard(
                      title: 'Rearing'.tr,
                      children: [
                        ReportMetricRow(
                          label: 'Total batches'.tr,
                          value: summary.totalBatches.toString(),
                          icon: Icons.inventory_2_outlined,
                        ),
                        ReportMetricRow(
                          label: 'Active batches'.tr,
                          value: summary.activeBatches.toString(),
                          icon: Icons.eco_outlined,
                        ),
                        ReportMetricRow(
                          label: 'Closed batches'.tr,
                          value: summary.closedBatches.toString(),
                          icon: Icons.archive_outlined,
                        ),
                        ReportMetricRow(
                          label: 'Bombyx larvae'.tr,
                          value: summary.bombyxLarvae.toString(),
                          icon: Icons.home_outlined,
                        ),
                        ReportMetricRow(
                          label: 'Eri larvae'.tr,
                          value: summary.eriLarvae.toString(),
                          icon: Icons.storefront_outlined,
                        ),
                      ],
                    ),
                    SizedBox(height: 24),
                    ReportSectionCard(
                      title: 'Feeding'.tr,
                      children: [
                        ReportMetricRow(
                          label: 'Total feed logged'.tr,
                          value: _formatFeed(summary.totalFeedGrams),
                          icon: Icons.restaurant_outlined,
                        ),
                        ReportMetricRow(
                          label: 'Feed log entries'.tr,
                          value: summary.feedLogCount.toString(),
                          icon: Icons.list_alt_outlined,
                        ),
                      ],
                    ),
                    SizedBox(height: 24),
                    ReportSectionCard(
                      title: 'Health & harvest'.tr,
                      children: [
                        ReportMetricRow(
                          label: 'Total mortality'.tr,
                          value: summary.totalMortality.toString(),
                          icon: Icons.health_and_safety_outlined,
                        ),
                        ReportMetricRow(
                          label: 'Average survival'.tr,
                          value: '${summary.averageSurvivalPercent.toStringAsFixed(0)}%',
                          icon: Icons.favorite_outline,
                        ),
                        ReportMetricRow(
                          label: 'Harvest records'.tr,
                          value: summary.harvestCount.toString(),
                          icon: Icons.inventory_outlined,
                        ),
                        ReportMetricRow(
                          label: 'Total cocoon weight'.tr,
                          value: _formatFeed(summary.totalHarvestWeightGrams),
                          icon: Icons.scale_outlined,
                        ),
                      ],
                    ),
                    SizedBox(height: 24),
                    KalroPrimaryButton(
                      label: _exportingPdf ? 'Exporting PDF...' : 'Export PDF report',
                      onPressed: _exportingPdf ? null : _exportPdf,
                    ),
                    SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: _exportCsv,
                      style: OutlinedButton.styleFrom(
                        minimumSize: Size.fromHeight(48),
                        side: BorderSide(color: KalroColors.headerGreen),
                      ),
                      child: Text('Export CSV to clipboard'.tr),
                    ),
                    SizedBox(height: 24),
                    ReportSectionCard(
                      title: 'Financial'.tr,
                      children: [
                        ReportMetricRow(
                          label: 'Pending receivable'.tr,
                          value: currency.format(summary.totalReceivable),
                          icon: Icons.arrow_downward,
                        ),
                        ReportMetricRow(
                          label: 'Pending payable'.tr,
                          value: currency.format(summary.totalPayable),
                          icon: Icons.arrow_upward,
                        ),
                        ReportMetricRow(
                          label: 'Purchase spend'.tr,
                          value: currency.format(summary.purchaseSpend),
                          icon: Icons.shopping_bag_outlined,
                        ),
                        ReportMetricRow(
                          label: 'Purchase orders'.tr,
                          value: summary.purchaseOrderCount.toString(),
                          icon: Icons.receipt_long_outlined,
                        ),
                        ReportMetricRow(
                          label: 'Settled payments'.tr,
                          value: summary.settledPayments.toString(),
                          icon: Icons.check_circle_outline,
                        ),
                        ReportMetricRow(
                          label: 'Pending payments'.tr,
                          value: summary.pendingPayments.toString(),
                          icon: Icons.schedule,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _ChartSection extends StatelessWidget {
  const _ChartSection({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: KalroColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title,
            style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600),
          ),
          SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}
