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

class _ReportsBundle {
  const _ReportsBundle({required this.summary, required this.charts});

  final ReportsSummary summary;
  final ReportChartData charts;
}

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({
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
  final _reportsService = const ReportsService();
  final _chartService = const ReportChartService();
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
      const SnackBar(content: Text('Farm data copied to clipboard as CSV')),
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
        SnackBar(content: Text('PDF saved to ${file.path}')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('PDF export failed: $error')),
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
        title: const Text('Reports'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Container(
        decoration: const BoxDecoration(
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
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
                  children: [
                    Text(
                      summary.orgName,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Generated ${dateFormat.format(summary.generatedAt)}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: KalroColors.textMuted,
                          ),
                    ),
                    const SizedBox(height: 24),
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 1.45,
                      children: [
                        KalroStatCard(
                          icon: Icons.layers_outlined,
                          title: 'Active Batches',
                          value: summary.activeBatches.toString(),
                        ),
                        KalroStatCard(
                          icon: Icons.bug_report_outlined,
                          title: 'Total Larvae',
                          value: NumberFormat.decimalPattern()
                              .format(summary.bombyxLarvae + summary.eriLarvae),
                        ),
                        KalroStatCard(
                          icon: Icons.restaurant_outlined,
                          title: 'Feed Logged',
                          value: _formatFeed(summary.totalFeedGrams),
                        ),
                        KalroStatCard(
                          icon: Icons.favorite_outline,
                          title: 'Survival',
                          value: '${summary.averageSurvivalPercent.toStringAsFixed(0)}%',
                        ),
                      ],
                    ),
                    const SizedBox(height: 28),
                    _ChartSection(
                      title: 'Feed trend (14 days)',
                      child: FeedTrendChart(points: charts.feedTrend),
                    ),
                    const SizedBox(height: 20),
                    _ChartSection(
                      title: 'Mortality trend (14 days)',
                      child: MortalityTrendChart(points: charts.mortalityTrend),
                    ),
                    const SizedBox(height: 20),
                    _ChartSection(
                      title: 'Live larvae by species',
                      child: SpeciesSplitChart(
                        bombyxLarvae: charts.bombyxLarvae,
                        eriLarvae: charts.eriLarvae,
                      ),
                    ),
                    const SizedBox(height: 20),
                    _ChartSection(
                      title: 'Batch comparison',
                      child: BatchComparisonTable(rows: charts.batchComparisons),
                    ),
                    const SizedBox(height: 28),
                    ReportSectionCard(
                      title: 'Rearing',
                      children: [
                        ReportMetricRow(
                          label: 'Total batches',
                          value: summary.totalBatches.toString(),
                          icon: Icons.inventory_2_outlined,
                        ),
                        ReportMetricRow(
                          label: 'Active batches',
                          value: summary.activeBatches.toString(),
                          icon: Icons.eco_outlined,
                        ),
                        ReportMetricRow(
                          label: 'Closed batches',
                          value: summary.closedBatches.toString(),
                          icon: Icons.archive_outlined,
                        ),
                        ReportMetricRow(
                          label: 'Bombyx larvae',
                          value: summary.bombyxLarvae.toString(),
                          icon: Icons.home_outlined,
                        ),
                        ReportMetricRow(
                          label: 'Eri larvae',
                          value: summary.eriLarvae.toString(),
                          icon: Icons.storefront_outlined,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    ReportSectionCard(
                      title: 'Feeding',
                      children: [
                        ReportMetricRow(
                          label: 'Total feed logged',
                          value: _formatFeed(summary.totalFeedGrams),
                          icon: Icons.restaurant_outlined,
                        ),
                        ReportMetricRow(
                          label: 'Feed log entries',
                          value: summary.feedLogCount.toString(),
                          icon: Icons.list_alt_outlined,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    ReportSectionCard(
                      title: 'Health & harvest',
                      children: [
                        ReportMetricRow(
                          label: 'Total mortality',
                          value: summary.totalMortality.toString(),
                          icon: Icons.health_and_safety_outlined,
                        ),
                        ReportMetricRow(
                          label: 'Average survival',
                          value: '${summary.averageSurvivalPercent.toStringAsFixed(0)}%',
                          icon: Icons.favorite_outline,
                        ),
                        ReportMetricRow(
                          label: 'Harvest records',
                          value: summary.harvestCount.toString(),
                          icon: Icons.inventory_outlined,
                        ),
                        ReportMetricRow(
                          label: 'Total cocoon weight',
                          value: _formatFeed(summary.totalHarvestWeightGrams),
                          icon: Icons.scale_outlined,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    KalroPrimaryButton(
                      label: _exportingPdf ? 'Exporting PDF...' : 'Export PDF report',
                      onPressed: _exportingPdf ? null : _exportPdf,
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: _exportCsv,
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                        side: const BorderSide(color: KalroColors.headerGreen),
                      ),
                      child: const Text('Export CSV to clipboard'),
                    ),
                    const SizedBox(height: 24),
                    ReportSectionCard(
                      title: 'Financial',
                      children: [
                        ReportMetricRow(
                          label: 'Pending receivable',
                          value: currency.format(summary.totalReceivable),
                          icon: Icons.arrow_downward,
                        ),
                        ReportMetricRow(
                          label: 'Pending payable',
                          value: currency.format(summary.totalPayable),
                          icon: Icons.arrow_upward,
                        ),
                        ReportMetricRow(
                          label: 'Purchase spend',
                          value: currency.format(summary.purchaseSpend),
                          icon: Icons.shopping_bag_outlined,
                        ),
                        ReportMetricRow(
                          label: 'Purchase orders',
                          value: summary.purchaseOrderCount.toString(),
                          icon: Icons.receipt_long_outlined,
                        ),
                        ReportMetricRow(
                          label: 'Settled payments',
                          value: summary.settledPayments.toString(),
                          icon: Icons.check_circle_outline,
                        ),
                        ReportMetricRow(
                          label: 'Pending payments',
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
      padding: const EdgeInsets.all(16),
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
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}
