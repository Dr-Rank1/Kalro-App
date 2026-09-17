import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../components/dashboard/farm_kpi_cards.dart';
import '../models/dashboard_summary.dart';
import '../services/app_repositories.dart';
import '../services/dashboard_service.dart';
import '../services/rearing_day_service.dart';
import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';
import 'batch_detail_screen.dart';
import 'lifecycle_planner_screen.dart';
import 'create_batch_screen.dart';
import 'field_guide_screen.dart';

import 'package:kalro/l10n/translator.dart';

/// Primary home screen — today's rearing work and active batches.
class RearingHubScreen extends StatefulWidget {
  RearingHubScreen({
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
    _reload();
    widget.onBatchChanged();
  }

  void _openPlanner() {
    if (widget.onOpenPlan != null) {
      widget.onOpenPlan!();
      return;
    }
    Navigator.of(context)
        .push(
          MaterialPageRoute(
            builder: (_) => LifecyclePlannerScreen(
              repositories: widget.repositories,
              canEdit: widget.canEdit,
            ),
          ),
        )
        .then((_) {
          _reload();
          widget.onBatchChanged();
        });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
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
        final focusBatch = active.isEmpty ? null : active.first;
        final focus = focusBatch == null ? null : plans[focusBatch.id];
        final leafKg = plans.values.fold<double>(
          0,
          (sum, plan) => sum + (plan.leafKgToHarvest ?? 0),
        );

        return Scaffold(
          backgroundColor: Colors.transparent,
          body: KalroBackground(
            child: SafeArea(
              child: RefreshIndicator(
                onRefresh: () async => _reload(),
                child: ListView(
                  padding: const EdgeInsets.only(top: 8, bottom: 100),
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      child: KalroWelcomeHeader(
                        displayName: summary.displayName,
                      ),
                    ),
                    const SizedBox(height: 16),
                    FarmKpiCards(summary: summary),
                    const SizedBox(height: 20),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: LifecyclePlanHomeCard(
                        onOpenPlanner: _openPlanner,
                        nextLabel: summary.nextMilestone?.milestone.label.tr,
                        nextWhen: summary.nextMilestone == null
                            ? null
                            : summary.nextMilestone!.isToday
                            ? 'today'.tr
                            : summary.nextMilestone!.isOverdue
                            ? 'overdue'.tr
                            : Translator.fill('in {n} days', {
                                'n': '${summary.nextMilestone!.daysUntil}',
                              }),
                        conditionNote: focus?.feedLabel,
                      ),
                    ),
                    if (active.isNotEmpty) ...[
                      const SizedBox(height: 20),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          'Today’s work'.tr,
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
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
                            fedToday: summary.fedTodayByBatch[batch.id] ?? false,
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
                    ],
                    if (leafKg > 0 || summary.leafNeedTodayKg > 0) ...[
                      const SizedBox(height: 16),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: InkWell(
                          onTap: widget.onOpenFarm,
                          borderRadius: BorderRadius.circular(18),
                          child: _LeafNeedStrip(
                            remainingKg: leafKg,
                            todayKg: summary.leafNeedTodayKg,
                            mulberryStockKg: summary.mulberryStockKg,
                            eriHostStockKg: summary.eriHostStockKg,
                          ),
                        ),
                      ),
                    ],
                    if (summary.todayTasks.isNotEmpty) ...[
                      const SizedBox(height: 22),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: DashboardTodayTasks(
                          tasks: summary.todayTasks,
                          onTaskTap: (task) => _openBatch(task.batchId),
                        ),
                      ),
                    ],
                    if (summary.alerts.isNotEmpty) ...[
                      const SizedBox(height: 22),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          l10n?.dashboardNeedsAttention ?? 'Needs attention'.tr,
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: DashboardAlertsBanner(
                          alerts: summary.alerts.take(3).toList(),
                          onAlertTap: (alert) {
                            if (alert.batchId != null)
                              _openBatch(alert.batchId!);
                          },
                        ),
                      ),
                    ],
                    if (active.isEmpty) ...[
                      const SizedBox(height: 28),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: _GettingStartedCard(
                          canEdit: widget.canEdit,
                          onPlan: _openPlanner,
                          onFarm: widget.onOpenFarm,
                          onCreateBatch: widget.canEdit
                              ? () async {
                                  await Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => CreateBatchScreen(
                                        repository: widget.repositories.batches,
                                        producers: widget.repositories.producers,
                                      ),
                                    ),
                                  );
                                  _reload();
                                  widget.onBatchChanged();
                                }
                              : null,
                        ),
                      ),
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

class _LeafNeedStrip extends StatelessWidget {
  const _LeafNeedStrip({
    required this.remainingKg,
    required this.todayKg,
    required this.mulberryStockKg,
    required this.eriHostStockKg,
  });

  final double remainingKg;
  final double todayKg;
  final double mulberryStockKg;
  final double eriHostStockKg;

  @override
  Widget build(BuildContext context) {
    final stock = mulberryStockKg + eriHostStockKg;
    final short = todayKg > stock;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: KalroColors.softShadow,
        border: short
            ? Border.all(color: KalroColors.rest.withValues(alpha: 0.5))
            : null,
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: KalroColors.leaf.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.grass_outlined, color: KalroColors.leaf),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  short ? 'Leaf short for today'.tr : 'Leaf for today'.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  remainingKg > 0
                      ? Translator.fill(
                          'Need {today} kg today · stock {stock} kg · {remaining} kg still to harvest · tap Farm to update.',
                          {
                            'today': todayKg.toStringAsFixed(2),
                            'stock': stock.toStringAsFixed(1),
                            'remaining': remainingKg.toStringAsFixed(1),
                          },
                        )
                      : Translator.fill(
                          'Need {today} kg today · stock {stock} kg · tap Farm to update.',
                          {
                            'today': todayKg.toStringAsFixed(2),
                            'stock': stock.toStringAsFixed(1),
                          },
                        ),
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: KalroColors.textMuted,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _GettingStartedCard extends StatelessWidget {
  const _GettingStartedCard({
    required this.canEdit,
    required this.onPlan,
    this.onFarm,
    this.onCreateBatch,
  });

  final bool canEdit;
  final VoidCallback onPlan;
  final VoidCallback? onFarm;
  final VoidCallback? onCreateBatch;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: KalroColors.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'This is Today once a batch is running'.tr,
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'You will see feed or rest, live larvae, and one-tap Feed / Deaths / House for every batch.'.tr,
            style: GoogleFonts.poppins(
              fontSize: 13,
              color: KalroColors.textMuted,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: KalroColors.background,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: KalroColors.divider),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Bombyx mori · 180 live'.tr, style: GoogleFonts.poppins(fontWeight: FontWeight.w700)),
                Text('5th instar · Full ration · ~120 g'.tr, style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _StartStep(
            number: '1',
            title: 'Plan hatch and harvest'.tr,
            subtitle: 'Open the Plan tab and pick a start date.'.tr,
            onTap: onPlan,
          ),
          _StartStep(
            number: '2',
            title: 'Start a batch of eggs'.tr,
            subtitle: 'Batches tab, or the + button.'.tr,
            onTap: onCreateBatch,
          ),
          _StartStep(
            number: '3',
            title: 'Log feed and deaths'.tr,
            subtitle: 'Farm tab, or Feed on this screen.'.tr,
            onTap: onFarm,
          ),
          if (canEdit) ...[
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: onPlan,
                style: FilledButton.styleFrom(
                  backgroundColor: KalroColors.headerGreen,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: Text(
                  'Open Plan'.tr,
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _StartStep extends StatelessWidget {
  const _StartStep({
    required this.number,
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  final String number;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: KalroColors.background,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                    color: KalroColors.headerGreen,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    number,
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                      ),
                      Text(
                        subtitle,
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: KalroColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
