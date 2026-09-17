import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../models/batch.dart';
import '../models/batch_status.dart';
import '../services/batch_metrics_service.dart';
import '../services/lifecycle_engine.dart';
import '../services/prediction_adjuster.dart';
import '../services/app_repositories.dart';
import '../services/lifecycle_planning_service.dart';
import '../models/rearing_conditions.dart';
import '../models/cycle_memory.dart';
import '../models/environment_log.dart';
import '../services/rearing_conditions_service.dart';
import '../theme/kalro_colors.dart';
import '../components/components.dart';
import '../l10n/translator.dart';
import '../services/rearing_day_service.dart';
import '../services/cycle_memory_service.dart';
import 'create_batch_screen.dart';
import 'field_guide_screen.dart';

class BatchDetailScreen extends StatefulWidget {
  static const routeName = "/batch";

  const BatchDetailScreen({
    super.key,
    required this.repositories,
    required this.batchId,
  });

  final AppRepositories repositories;
  final String batchId;

  @override
  State<BatchDetailScreen> createState() => _BatchDetailScreenState();
}

class _BatchDetailScreenState extends State<BatchDetailScreen> {
  final _planning = LifecyclePlanningService();
  final _adjuster = PredictionAdjuster();
  final _metricsService = BatchMetricsService();
  final _lifecycleEngine = LifecycleEngine();
  final _conditionsService = RearingConditionsService();

  Future<_BatchDetailData>? _dataFuture;
  RearingScenario? _scenario;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _dataFuture = _loadData();
    });
  }

  Future<_BatchDetailData> _loadData() async {
    final batch = await widget.repositories.batches.getById(widget.batchId);
    if (batch == null) {
      return _BatchDetailData(
        batch: null,
        observations: {},
        totalMortality: 0,
        conditions: RearingConditions.typical,
        environmentLogs: const [],
      );
    }

    final observations = await widget.repositories.milestoneObservations
        .stageDatesForBatch(batch.id);
    final totalMortality = await widget.repositories.mortalityLogs
        .totalMortalityForBatch(batch.id);
    final environmentLogs = await widget.repositories.environmentLogs
        .getByBatchId(batch.id);
    final feedLogs = await widget.repositories.feedLogs.getByBatchId(batch.id);
    final mortalityLogs = await widget.repositories.mortalityLogs.getByBatchId(
      batch.id,
    );
    final harvests = await widget.repositories.cocoonHarvests.getByBatchId(
      batch.id,
    );
    final purchases = await widget.repositories.purchaseOrders.getAll();
    final prices = await widget.repositories.inventorySettings.get();
    final memory = const CycleMemoryService().build(
      batch: batch,
      feedLogs: feedLogs,
      mortalityLogs: mortalityLogs,
      harvests: harvests,
      purchases: purchases,
      prices: prices,
      observedStageDates: observations,
    );

    return _BatchDetailData(
      batch: batch,
      observations: observations,
      totalMortality: totalMortality,
      conditions: _conditionsService.fromLogs(
        batch: batch,
        environmentLogs: environmentLogs,
        feedLogs: feedLogs,
      ),
      environmentLogs: environmentLogs,
      memory: memory,
    );
  }

  Future<void> _updateStatus(Batch batch, BatchStatus status) async {
    await widget.repositories.batches.update(batch.copyWith(status: status));
    _reload();
  }

  Future<void> _markObserved(Batch batch, String stageKey) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: batch.startDate,
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked == null) return;

    await widget.repositories.milestoneObservations.record(
      batchId: batch.id,
      stageKey: stageKey,
      observedDate: picked,
    );
    _reload();
  }

  Future<void> _markObservedToday(Batch batch, String stageKey) async {
    await widget.repositories.milestoneObservations.record(
      batchId: batch.id,
      stageKey: stageKey,
      observedDate: DateTime.now(),
    );
    _reload();
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: KalroColors.background,
        body: FutureBuilder<_BatchDetailData>(
          future: _dataFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return Scaffold(
                appBar: AppBar(title: Text('Loading...'.tr)),
                body: const Center(child: CircularProgressIndicator()),
              );
            }

            final data = snapshot.data;
            final batch = data?.batch;
            if (batch == null) {
              return Scaffold(
                appBar: AppBar(title: Text('Batch Details'.tr)),
                body: Center(child: Text('Batch not found'.tr)),
              );
            }

            final observations = data!.observations;
            final loggedConditions = data.conditions;
            final conditions =
                _scenario?.conditionsFor(batch.species) ?? loggedConditions;
            final cycle = _planning.planBatch(
              batch,
              observedStageDates: observations,
              conditions: conditions,
            );
            final metrics = _metricsService.compute(batch, data.totalMortality);
            final milestones = cycle.milestones;
            final current = _lifecycleEngine.currentStage(
              batch,
              observedStageDates: observations,
              conditions: conditions,
            );

            final adjustment = _adjuster.adjust(batch.species, conditions);
            final dayPlan = RearingDayService().planFor(
              batch,
              observedStageDates: observations,
              conditions: conditions,
              liveCount: metrics.liveCount,
            );

            return NestedScrollView(
              headerSliverBuilder: (context, innerBoxIsScrolled) {
                return [
                  SliverAppBar(
                    expandedHeight: 228,
                    pinned: true,
                    backgroundColor: KalroColors.headerGreen,
                    title: Text(batch.species.label.tr),
                    flexibleSpace: FlexibleSpaceBar(
                      background: _buildHeroHeader(
                        batch,
                        metrics,
                        current,
                        dayPlan,
                      ),
                    ),
                    bottom: TabBar(
                      labelColor: Colors.white,
                      unselectedLabelColor: Colors.white70,
                      indicatorColor: KalroColors.peach,
                      indicatorWeight: 3,
                      tabs: [
                        Tab(text: 'Today'.tr),
                        Tab(text: 'Timeline'.tr),
                        Tab(text: 'Records'.tr),
                      ],
                    ),
                  ),
                ];
              },
              body: TabBarView(
                children: [
                  ListView(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                    children: [
                      if (dayPlan != null) ...[
                        TodayPlanCard(
                          plan: dayPlan,
                          speciesLabel: batch.species.label,
                        ),
                        const SizedBox(height: 12),
                        FloorActionsBar(
                          batch: batch,
                          plan: dayPlan,
                          repositories: widget.repositories,
                          onChanged: _reload,
                          onMarkStage: () =>
                              _markObservedToday(batch, dayPlan.stage.key),
                        ),
                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: TextButton.icon(
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => FieldGuideScreen(
                                    species: batch.species,
                                    cycleDay: dayPlan.cycleDay,
                                    stageKey: dayPlan.stage.key,
                                    isMoult: dayPlan.stage.isMoult,
                                    isLightFeedDay: dayPlan.isLightFeedDay,
                                    actionTitle: dayPlan.actionTitle,
                                  ),
                                ),
                              );
                            },
                            icon: const Icon(Icons.menu_book_outlined, size: 18),
                            label: Text('Field guide for this stage'.tr),
                          ),
                        ),
                        if (dayPlan.readinessSigns.isNotEmpty) ...[
                          ReadinessChecklist(
                            title: dayPlan.stage.isMoult
                                ? 'Pre-moult signs'.tr
                                : 'Ready to spin?'.tr,
                            signs: dayPlan.readinessSigns,
                            onConfirm: () =>
                                _markObservedToday(batch, dayPlan.stage.key),
                            confirmLabel: Translator.fill(
                              'I see this — mark {stage} today',
                              {'stage': dayPlan.stage.label},
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                      ],
                      HouseHistoryStrip(logs: data.environmentLogs),
                      const SizedBox(height: 16),
                      _buildHealthMetricsCards(metrics),
                      const SizedBox(height: 20),
                      FeedLogSection(
                        batchId: batch.id,
                        repository: widget.repositories.feedLogs,
                        defaultFeedType: batch.feedMaterial,
                        onChanged: _reload,
                        feedHint: dayPlan?.feedLabel,
                        suggestedGrams: dayPlan?.suggestedGrams,
                        farmRepositories: widget.repositories,
                        species: batch.species,
                      ),
                      const SizedBox(height: 20),
                      MortalityLogSection(
                        batchId: batch.id,
                        batchLabel: batch.species.label,
                        repository: widget.repositories.mortalityLogs,
                        onChanged: _reload,
                      ),
                      if (dayPlan?.isHarvestWork == true) ...[
                        const SizedBox(height: 20),
                        CocoonHarvestSection(
                          batchId: batch.id,
                          startingCount: batch.eggCount,
                          harvestRepository: widget.repositories.cocoonHarvests,
                          batchRepository: widget.repositories.batches,
                          onHarvestRecorded: _reload,
                        ),
                      ],
                    ],
                  ),
                  ListView(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                    children: [
                      PredictionConditionsBanner(
                        adjustment: adjustment,
                        logged: _scenario == null && loggedConditions.fromLogs,
                        harvestShiftDays: cycle.harvestShiftDays,
                        shiftSummary: cycle.shiftSummary,
                        snapshot: conditions.snapshotLabel,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'What if weather or leaf changes?'.tr,
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      PredictionScenarioBar(
                        selected: _scenario,
                        includeRecorded: true,
                        onSelected: (value) =>
                            setState(() => _scenario = value),
                      ),
                      const SizedBox(height: 16),
                      LifecycleKeyDatesCard(cycle: cycle),
                      const SizedBox(height: 16),
                      PredictionOutcomeCard(cycle: cycle),
                      const SizedBox(height: 20),
                      Text(
                        'Lifecycle timeline'.tr,
                        style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Dates move with temperature, humidity, and how much leaf you log. Mark a stage when you see it.'
                            .tr,
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          color: KalroColors.textMuted,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: KalroColors.softShadow,
                        ),
                        child: MilestoneTimeline(
                          milestones: milestones,
                          onMarkObserved: (milestone) {
                            if (milestone.stageKey != null) {
                              _markObserved(batch, milestone.stageKey!);
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                  ListView(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                    children: [
                      if (data.memory != null) ...[
                        CycleMemoryCard(
                          memory: data.memory!,
                          showMoney: true,
                          onStartLikeThis: () async {
                            final created = await Navigator.of(context)
                                .push<bool>(
                              MaterialPageRoute(
                                builder: (_) => CreateBatchScreen(
                                  repository: widget.repositories.batches,
                                  producers: widget.repositories.producers,
                                  copyFrom: batch,
                                ),
                              ),
                            );
                            if (created == true && mounted) _reload();
                          },
                        ),
                        const SizedBox(height: 20),
                      ],
                      EnvironmentLogSection(
                        batch: batch,
                        repository: widget.repositories.environmentLogs,
                        onChanged: _reload,
                      ),
                      const SizedBox(height: 20),
                      CocoonHarvestSection(
                        batchId: batch.id,
                        startingCount: batch.eggCount,
                        harvestRepository: widget.repositories.cocoonHarvests,
                        batchRepository: widget.repositories.batches,
                        onHarvestRecorded: _reload,
                      ),
                      const SizedBox(height: 24),
                      _buildBeautifulInfoGrid(batch),
                      const SizedBox(height: 24),
                      Text(
                        'Update status'.tr,
                        style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: KalroColors.softShadow,
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<BatchStatus>(
                            value: batch.status,
                            isExpanded: true,
                            icon: const Icon(
                              Icons.arrow_drop_down,
                              color: KalroColors.primaryGreen,
                            ),
                            items: BatchStatus.values.map((s) {
                              return DropdownMenuItem(
                                value: s,
                                child: Text(
                                  s.label.tr,
                                  style: GoogleFonts.poppins(fontSize: 16),
                                ),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null && val != batch.status) {
                                _updateStatus(batch, val);
                              }
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildHeroHeader(
    Batch batch,
    BatchMetrics metrics,
    dynamic current,
    RearingDayPlan? dayPlan,
  ) {
    final progress = dayPlan?.progress ?? 0;
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 88, 20, 56),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [KalroColors.headerGreen, KalroColors.primaryGreen],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: KalroColors.peach,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  batch.species.label.tr,
                  style: GoogleFonts.poppins(
                    color: KalroColors.textDark,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  batch.status.label.tr,
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ),
              const Spacer(),
              if (dayPlan != null)
                Text(
                  'Day ${dayPlan.cycleDay} / ${dayPlan.cycleLengthDays}'.tr,
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
            ],
          ),
          const Spacer(),
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 6,
              backgroundColor: Colors.white.withValues(alpha: 0.2),
              color: KalroColors.peach,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Live larvae'.tr,
                      style: GoogleFonts.poppins(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      '${metrics.liveCount}',
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        height: 1.1,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'Current stage'.tr,
                      style: GoogleFonts.poppins(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      (dayPlan?.stage.label ?? current?.label ?? '—')
                          .toString()
                          .tr,
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                      textAlign: TextAlign.right,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBeautifulInfoGrid(Batch batch) {
    final dateFormat = DateFormat.yMMMd();
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 2.2,
      children: [
        _buildGridItem(
          Icons.calendar_today,
          'Started'.tr,
          dateFormat.format(batch.startDate),
        ),
        if (batch.eggSource != null)
          _buildGridItem(Icons.store, 'Source'.tr, batch.eggSource!),
        if (batch.strain != null)
          _buildGridItem(Icons.biotech, 'Strain'.tr, batch.strain!),
        if (batch.location != null)
          _buildGridItem(Icons.location_on, 'Location'.tr, batch.location!),
        if (batch.caretaker != null)
          _buildGridItem(Icons.person, 'Caretaker'.tr, batch.caretaker!),
        if (batch.feedMaterial != null)
          _buildGridItem(Icons.eco, 'Feed'.tr, batch.feedMaterial!),
      ],
    );
  }

  Widget _buildGridItem(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: KalroColors.background,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: KalroColors.primaryGreen, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  label,
                  style: GoogleFonts.poppins(
                    fontSize: 11,
                    color: KalroColors.textMuted,
                  ),
                ),
                Text(
                  value,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHealthMetricsCards(BatchMetrics metrics) {
    return Row(
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: KalroColors.primaryGreen.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.health_and_safety, color: KalroColors.primaryGreen),
                const SizedBox(height: 12),
                Text(
                  'Survival'.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: KalroColors.primaryGreen,
                  ),
                ),
                Text(
                  '${metrics.survivalRatePercent.toStringAsFixed(1)}%',
                  style: GoogleFonts.poppins(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: KalroColors.textDark,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.orange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.warning_amber, color: Colors.orange),
                const SizedBox(height: 12),
                Text(
                  'Mortality'.tr,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: Colors.orange,
                  ),
                ),
                Text(
                  '${metrics.totalMortality}',
                  style: GoogleFonts.poppins(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: KalroColors.textDark,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _BatchDetailData {
  const _BatchDetailData({
    required this.batch,
    required this.observations,
    required this.totalMortality,
    required this.conditions,
    required this.environmentLogs,
    this.memory,
  });

  final Batch? batch;
  final Map<String, DateTime> observations;
  final int totalMortality;
  final RearingConditions conditions;
  final List<EnvironmentLog> environmentLogs;
  final CycleMemory? memory;
}
