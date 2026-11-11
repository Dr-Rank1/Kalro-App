import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../models/dashboard_summary.dart';
import '../services/app_repositories.dart';
import '../services/dashboard_service.dart';
import '../services/rearing_day_service.dart';
import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';
import 'batch_detail_screen.dart';
import 'create_batch_screen.dart';
import 'field_guide_screen.dart';

import 'package:kalro/l10n/translator.dart';

/// Primary home screen — today's rearing work and active batches.
class RearingHubScreen extends StatefulWidget {
  const RearingHubScreen({
    super.key,
    required this.repositories,
    required this.userPreferences,
    required this.onBatchChanged,
    this.canEdit = true,
    this.reloadCounter = 0,
    this.onOpenPlan,
    this.onOpenFarm,
    this.onOpenBatches,
  });

  final AppRepositories repositories;
  final UserPreferences userPreferences;
  final VoidCallback onBatchChanged;
  final bool canEdit;
  final int reloadCounter;
  final VoidCallback? onOpenPlan;
  final VoidCallback? onOpenFarm;
  final VoidCallback? onOpenBatches;

  @override
  State<RearingHubScreen> createState() => _RearingHubScreenState();
}

class _RearingHubScreenState extends State<RearingHubScreen> {
  @override
  void didUpdateWidget(covariant RearingHubScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.reloadCounter != widget.reloadCounter) {
      _reload();
    }
  }

  final _dashboardService = DashboardService();
  final _rearingDay = const RearingDayService();
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

  Future<void> _openBatch(String batchId) async {
    await Navigator.of(
      context,
    ).pushNamed(BatchDetailScreen.routeName, arguments: batchId);
    if (!mounted) return;
    _reload();
    widget.onBatchChanged();
  }

  @override
  Widget build(BuildContext context) {
    return AsyncContent(
      future: _summaryFuture,
      builder: (context, summary) {
        final active = summary.activeBatches;
        final plans = <String, RearingDayPlan>{};
        for (final batch in active) {
          final plan = _rearingDay.planFor(
            batch,
            observedStageDates: summary.observationsByBatch[batch.id],
            conditions: summary.conditionsByBatch[batch.id],
            liveCount: summary.liveCountByBatch[batch.id],
          );
          if (plan != null) plans[batch.id] = plan;
        }

        return Scaffold(
          backgroundColor: Colors.transparent,
          body: KalroBackground(
            child: SafeArea(
              child: RefreshIndicator(
                onRefresh: () async => _reload(),
                child: ListView(
                  padding: const EdgeInsets.only(top: 12, bottom: 100),
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: KalroWelcomeHeader(
                        displayName: summary.displayName,
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (active.isEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: _MinimalEmptyBatchCard(
                          canEdit: widget.canEdit,
                          onCreateBatch: widget.canEdit
                              ? () async {
                                  await Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => CreateBatchScreen(
                                        repository: widget.repositories.batches,
                                        producers: widget.repositories.producers,
                                        farmRepositories: widget.repositories,
                                      ),
                                    ),
                                  );
                                  _reload();
                                  widget.onBatchChanged();
                                }
                              : null,
                          onOpenGuide: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => const FieldGuideScreen(),
                              ),
                            );
                          },
                        ),
                      ),
                    ] else ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          'Today’s Routine'.tr,
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: KalroColors.textDark,
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      ...active.map((batch) {
                        final plan = plans[batch.id];
                        if (plan == null) return const SizedBox.shrink();
                        return Padding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                          child: TodayBatchWorkCard(
                            batch: batch,
                            plan: plan,
                            liveCount:
                                summary.liveCountByBatch[batch.id] ??
                                batch.eggCount,
                            fedToday:
                                summary.fedTodayByBatch[batch.id] ?? false,
                            fedGramsToday:
                                summary.fedTodayGramsByBatch[batch.id],
                            skippedToday:
                                summary.skippedTodayByBatch[batch.id] ?? false,
                            skipReason:
                                summary.skipReasonTodayByBatch[batch.id],
                            repositories: widget.repositories,
                            canEdit: widget.canEdit,
                            onOpen: () => _openBatch(batch.id),
                            onChanged: () {
                              _reload();
                              widget.onBatchChanged();
                            },
                            onOpenGuide: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => FieldGuideScreen(
                                    species: batch.species,
                                    cycleDay: plan.cycleDay,
                                    stageKey: plan.stage.key,
                                    isMoult: plan.stage.isMoult,
                                    isLightFeedDay: plan.isLightFeedDay,
                                    actionTitle: plan.actionTitle,
                                  ),
                                ),
                              );
                            },
                          ),
                        );
                      }),
                      if (summary.alerts.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: DashboardAlertsBanner(
                            alerts: summary.alerts.take(2).toList(),
                            onAlertTap: (alert) {
                              if (alert.batchId != null) {
                                _openBatch(alert.batchId!);
                              }
                            },
                          ),
                        ),
                      ],
                    ],
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _MinimalEmptyBatchCard extends StatelessWidget {
  const _MinimalEmptyBatchCard({
    required this.canEdit,
    this.onCreateBatch,
    this.onOpenGuide,
  });

  final bool canEdit;
  final VoidCallback? onCreateBatch;
  final VoidCallback? onOpenGuide;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: KalroColors.softShadow,
      ),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: KalroColors.leaf.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.eco_outlined,
              size: 32,
              color: KalroColors.primaryGreen,
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'No active rearing cycle'.tr,
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: KalroColors.textDark,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Create your first batch to start recording daily feeding, room climate, and lifecycle progress.'.tr,
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              fontSize: 13,
              color: KalroColors.textMuted,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 24),
          if (canEdit && onCreateBatch != null) ...[
            SizedBox(
              width: double.infinity,
              height: 48,
              child: FilledButton.icon(
                onPressed: onCreateBatch,
                icon: const Icon(Icons.add, size: 20),
                label: Text(
                  'Create First Batch'.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: KalroColors.primaryGreen,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
          if (onOpenGuide != null)
            TextButton.icon(
              onPressed: onOpenGuide,
              icon: const Icon(Icons.menu_book_outlined, size: 18, color: KalroColors.headerGreen),
              label: Text(
                'Explore KALRO Field Guide'.tr,
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: KalroColors.headerGreen,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
