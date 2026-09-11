import 'package:flutter/material.dart';

import '../components/components.dart';
import '../models/dashboard_summary.dart';
import '../services/app_repositories.dart';
import '../services/dashboard_service.dart';
import '../services/lifecycle_engine.dart';
import '../services/user_preferences.dart';
import 'batch_detail_screen.dart';
import 'create_batch_screen.dart';
import 'package:kalro/l10n/translator.dart';

class DashboardScreen extends StatefulWidget {
  DashboardScreen({
    super.key,
    required this.repositories,
    required this.userPreferences,
    required this.onBatchChanged,
  });

  final AppRepositories repositories;
  final UserPreferences userPreferences;
  final VoidCallback onBatchChanged;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _lifecycleEngine = LifecycleEngine();
  final _dashboardService = DashboardService();
  late Future<DashboardSummary> _summaryFuture;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _summaryFuture = _dashboardService.load(
        repositories: widget.repositories,
        userPreferences: widget.userPreferences,
      );
    });
  }

  Future<void> _openCreateBatch() async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => CreateBatchScreen(repository: widget.repositories.batches),
      ),
    );
    if (created == true) {
      _reload();
      widget.onBatchChanged();
    }
  }

  Future<void> _openBatch(String batchId) async {
    await Navigator.of(context).pushNamed(
      BatchDetailScreen.routeName,
      arguments: batchId,
    );
    _reload();
    widget.onBatchChanged();
  }

  @override
  Widget build(BuildContext context) {
    return AsyncContent(
      future: _summaryFuture,
      builder: (context, summary) {
        final active = summary.activeBatches;
        final upcoming = summary.upcomingMilestones.take(5).toList();

        return KalroBackground(
          child: SafeArea(
            child: RefreshIndicator(
              onRefresh: () async => _reload(),
              child: ListView(
                padding: EdgeInsets.fromLTRB(16, 16, 16, 24),
                children: [
                  KalroWelcomeHeader(displayName: summary.displayName),
                  SizedBox(height: 20),
                  DashboardStatGrid(stats: DashboardStatGrid.fromRearingSummary(summary)),
                  if (summary.alerts.isNotEmpty) ...[
                    SizedBox(height: 16),
                    DashboardAlertsBanner(
                      alerts: summary.alerts,
                      onAlertTap: (alert) {
                        if (alert.batchId != null) _openBatch(alert.batchId!);
                      },
                    ),
                  ],
                  if (summary.todayTasks.isNotEmpty) ...[
                    SizedBox(height: 16),
                    DashboardTodayTasks(
                      tasks: summary.todayTasks,
                      onTaskTap: (task) => _openBatch(task.batchId),
                    ),
                  ],
                  if (summary.nextMilestone != null) ...[
                    SizedBox(height: 16),
                    DashboardNextEventBanner(
                      item: summary.nextMilestone!,
                      onTap: () => _openBatch(summary.nextMilestone!.batch.id),
                    ),
                  ],
                  if (upcoming.isNotEmpty) ...[
                    SizedBox(height: 24),
                    KalroSectionHeader(title: 'Upcoming This Week'),
                    SizedBox(height: 8),
                    ...upcoming.map(
                      (item) => Padding(
                        padding: EdgeInsets.only(bottom: 8),
                        child: DashboardUpcomingTile(
                          item: item,
                          onTap: () => _openBatch(item.batch.id),
                        ),
                      ),
                    ),
                  ],
                  SizedBox(height: 24),
                  KalroSectionHeader(title: 'Active Rearing Batches'),
                  SizedBox(height: 12),
                  if (active.isEmpty)
                    EmptyStateCard(
                      title: 'No active batches yet'.tr,
                      message: 'Start a rearing batch to track lifecycle dates.',
                      actionLabel: 'Create Batch',
                      onAction: _openCreateBatch,
                      icon: Icons.eco_outlined,
                    )
                  else
                    ...active.map(
                      (batch) => Padding(
                        padding: EdgeInsets.only(bottom: 10),
                        child: BatchHorizontalCard(
                          batch: batch,
                          lifecycleEngine: _lifecycleEngine,
                          onTap: () => _openBatch(batch.id),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
