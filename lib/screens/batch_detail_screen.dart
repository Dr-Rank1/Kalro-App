import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../models/batch.dart';
import '../models/batch_status.dart';
import '../models/species.dart';
import '../services/batch_metrics_service.dart';
import '../services/lifecycle_engine.dart';
import '../services/prediction_adjuster.dart';
import '../services/app_repositories.dart';
import '../services/lifecycle_planning_service.dart';
import '../models/rearing_conditions.dart';
import '../services/rearing_conditions_service.dart';
import '../theme/kalro_colors.dart';
import '../theme/kalro_theme.dart';


import '../components/components.dart';



import '../components/health/environment_log_section.dart';
import '../l10n/translator.dart';

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
      );
    }

    final observations =
        await widget.repositories.milestoneObservations.stageDatesForBatch(batch.id);
    final totalMortality =
        await widget.repositories.mortalityLogs.totalMortalityForBatch(batch.id);
    final environmentLogs =
        await widget.repositories.environmentLogs.getByBatchId(batch.id);
    final feedLogs = await widget.repositories.feedLogs.getByBatchId(batch.id);

    return _BatchDetailData(
      batch: batch,
      observations: observations,
      totalMortality: totalMortality,
      conditions: _conditionsService.fromLogs(
        batch: batch,
        environmentLogs: environmentLogs,
        feedLogs: feedLogs,
      ),
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
            final current = _lifecycleEngine.currentStage(batch, observedStageDates: observations, conditions: conditions);
            final next = _lifecycleEngine.nextMilestone(batch, observedStageDates: observations, conditions: conditions);
            final harvestDate = cycle.harvest?.effectiveDate;

            final adjustment = _adjuster.adjust(batch.species, conditions);

            return NestedScrollView(
              headerSliverBuilder: (context, innerBoxIsScrolled) {
                return [
                  SliverAppBar(
                    expandedHeight: 250,
                    pinned: true,
                    backgroundColor: KalroColors.headerGreen,
                    title: Text('Batch ${batch.id.substring(0, 8).toUpperCase()}'),
                    flexibleSpace: FlexibleSpaceBar(
                      background: _buildHeroHeader(batch, metrics, current),
                    ),
                    bottom: TabBar(
                      labelColor: Colors.white,
                      unselectedLabelColor: Colors.white54,
                      indicatorColor: KalroColors.peach,
                      indicatorWeight: 4,
                      tabs: [
                        Tab(text: 'Overview'.tr),
                        Tab(text: 'Timeline'.tr),
                        Tab(text: 'Environment'.tr),
                      ],
                    ),
                  ),
                ];
              },
              body: TabBarView(
                children: [
                  // Tab 1: Overview
                  ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      _buildBeautifulInfoGrid(batch),
                      const SizedBox(height: 24),
                      Text(
                        'Health Metrics'.tr,
                        style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      _buildHealthMetricsCards(metrics),
                      const SizedBox(height: 24),
                      Text(
                        'Update status'.tr,
                        style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<BatchStatus>(
                            value: batch.status,
                            isExpanded: true,
                            icon: const Icon(Icons.arrow_drop_down, color: KalroColors.primaryGreen),
                            items: BatchStatus.values.map((s) {
                              return DropdownMenuItem(
                                value: s,
                                child: Text(s.label.tr, style: GoogleFonts.poppins(fontSize: 16)),
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
                  
                  // Tab 2: Timeline & Predictions
                  ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      PredictionOutcomeCard(cycle: cycle),
                      const SizedBox(height: 16),
                      PredictionScenarioBar(
                        selected: _scenario,
                        includeRecorded: true,
                        onSelected: (value) => setState(() => _scenario = value),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Lifecycle timeline'.tr,
                        style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Dates move with temperature, humidity, and how much leaf you log. Mark a stage when you see it.'.tr,
                        style: GoogleFonts.poppins(fontSize: 13, color: KalroColors.textMuted),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
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
                  
                  // Tab 3: Environment
                  ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      EnvironmentLogSection(
                        batch: batch,
                        repository: widget.repositories.environmentLogs,
                        onChanged: _reload,
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

  Widget _buildHeroHeader(Batch batch, BatchMetrics metrics, dynamic current) {
    return Container(
      padding: const EdgeInsets.only(top: 80, left: 20, right: 20),
      decoration: const BoxDecoration(
        color: KalroColors.headerGreen,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: KalroColors.peach,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  batch.species.label.tr,
                  style: GoogleFonts.poppins(
                    color: KalroColors.textDark,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  batch.status.label.tr,
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
          const Spacer(),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Live Larvae'.tr,
                      style: GoogleFonts.poppins(color: Colors.white70, fontSize: 14),
                    ),
                    Text(
                      '${metrics.liveCount}',
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              if (current != null)
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'Current stage'.tr,
                        style: GoogleFonts.poppins(color: Colors.white70, fontSize: 14),
                      ),
                      Text(
                        current.label.tr,
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                        textAlign: TextAlign.right,
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 60), // Space for bottom TabBar
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
        _buildGridItem(Icons.calendar_today, 'Started'.tr, dateFormat.format(batch.startDate)),
        if (batch.eggSource != null) _buildGridItem(Icons.store, 'Source'.tr, batch.eggSource!),
        if (batch.strain != null) _buildGridItem(Icons.biotech, 'Strain'.tr, batch.strain!),
        if (batch.location != null) _buildGridItem(Icons.location_on, 'Location'.tr, batch.location!),
        if (batch.caretaker != null) _buildGridItem(Icons.person, 'Caretaker'.tr, batch.caretaker!),
        if (batch.feedMaterial != null) _buildGridItem(Icons.eco, 'Feed'.tr, batch.feedMaterial!),
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
            color: Colors.black.withOpacity(0.04),
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
                  style: GoogleFonts.poppins(fontSize: 11, color: KalroColors.textMuted),
                ),
                Text(
                  value,
                  style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600),
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
              color: KalroColors.primaryGreen.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.health_and_safety, color: KalroColors.primaryGreen),
                const SizedBox(height: 12),
                Text(
                  'Survival'.tr,
                  style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.primaryGreen),
                ),
                Text(
                  '${metrics.survivalRatePercent.toStringAsFixed(1)}%',
                  style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.bold, color: KalroColors.textDark),
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
              color: Colors.orange.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.warning_amber, color: Colors.orange),
                const SizedBox(height: 12),
                Text(
                  'Mortality'.tr,
                  style: GoogleFonts.poppins(fontSize: 12, color: Colors.orange),
                ),
                Text(
                  '${metrics.totalMortality}',
                  style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.bold, color: KalroColors.textDark),
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
  });

  final Batch? batch;
  final Map<String, DateTime> observations;
  final int totalMortality;
  final RearingConditions conditions;
}
