import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../components/components.dart';
import '../models/batch.dart';
import '../models/batch_status.dart';
import '../models/rearing_conditions.dart';
import '../services/app_repositories.dart';
import '../services/batch_metrics_service.dart';
import '../services/lifecycle_engine.dart';
import '../services/lifecycle_planning_service.dart';
import '../services/prediction_adjuster.dart';
import '../services/rearing_conditions_service.dart';
import '../theme/kalro_colors.dart';

class BatchDetailScreen extends StatefulWidget {
  const BatchDetailScreen({
    super.key,
    required this.repositories,
    required this.batchId,
  });

  static const routeName = '/batch';

  final AppRepositories repositories;
  final String batchId;

  @override
  State<BatchDetailScreen> createState() => _BatchDetailScreenState();
}

class _BatchDetailScreenState extends State<BatchDetailScreen> {
  final _lifecycleEngine = const LifecycleEngine();
  final _metricsService = const BatchMetricsService();
  static const _planning = LifecyclePlanningService();
  static const _conditionsService = RearingConditionsService();
  static const _adjuster = PredictionAdjuster();
  late Future<_BatchDetailData> _dataFuture;
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
      return const _BatchDetailData(
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
        backgroundColor: KalroColors.headerGreen,
        appBar: AppBar(
          title: const Text('Batch Details'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.of(context).pop(),
          ),
          bottom: const TabBar(
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white54,
            indicatorColor: Colors.white,
            tabs: [
              Tab(text: 'Overview'),
              Tab(text: 'Predictions'),
              Tab(text: 'Environment'),
            ],
          ),
        ),
        body: FutureBuilder<_BatchDetailData>(
          future: _dataFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            final data = snapshot.data;
            final batch = data?.batch;
            if (batch == null) {
              return const Center(child: Text('Batch not found'));
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
            final adjustment = _adjuster.adjust(batch.species, conditions);
            final metrics = _metricsService.compute(batch, data.totalMortality);
            final milestones = cycle.milestones;
            final current = _lifecycleEngine.currentStage(
              batch,
              observedStageDates: observations,
              conditions: conditions,
            );
            final next = _lifecycleEngine.nextMilestone(
              batch,
              observedStageDates: observations,
              conditions: conditions,
            );
            final harvestDate = cycle.harvest?.effectiveDate;
            final dateFormat = DateFormat.yMMMd();

            final infoRows = <BatchInfoRow>[
              BatchInfoRow('Status', batch.status.label),
              BatchInfoRow('Start date', dateFormat.format(batch.startDate)),
              BatchInfoRow('Starting count', '${batch.eggCount}'),
              if (batch.eggSource != null) BatchInfoRow('Egg source', batch.eggSource!),
              if (batch.rearingType != null) BatchInfoRow('Rearing type', batch.rearingType!),
              if (batch.strain != null) BatchInfoRow('Strain', batch.strain!),
              if (batch.feedMaterial != null) BatchInfoRow('Feed', batch.feedMaterial!),
              if (batch.location != null) BatchInfoRow('Location', batch.location!),
              if (batch.caretaker != null) BatchInfoRow('Caretaker', batch.caretaker!),
              if (current != null) BatchInfoRow('Current stage', current.label),
              if (next != null)
                BatchInfoRow(
                  'Next milestone',
                  '${next.label} (${dateFormat.format(next.effectiveDate)})',
                ),
              if (harvestDate != null)
                BatchInfoRow('Expected harvest', dateFormat.format(harvestDate)),
            ];

            return Container(
              decoration: const BoxDecoration(
                color: KalroColors.background,
              ),
              child: KalroBackground(
                child: TabBarView(
                  children: [
                    // Tab 1: Overview
                    ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        BatchInfoPanel(batch: batch, rows: infoRows),
                        const SizedBox(height: 16),
                        BatchMetricsPanel(metrics: metrics),
                        const SizedBox(height: 16),
                        LifecycleKeyDatesCard(cycle: cycle),
                        const SizedBox(height: 20),
                        Text(
                          'Lifecycle timeline',
                          style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Dates move with temperature, humidity, and how much leaf you log. Mark a stage when you see it.',
                          style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                        ),
                        const SizedBox(height: 8),
                        MilestoneTimeline(
                          milestones: milestones,
                          onMarkObserved: (milestone) {
                            if (milestone.stageKey != null) {
                              _markObserved(batch, milestone.stageKey!);
                            }
                          },
                        ),
                        const SizedBox(height: 20),
                        Text(
                          'Update status',
                          style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: KalroColors.divider),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<BatchStatus>(
                              value: batch.status,
                              isExpanded: true,
                              icon: const Icon(Icons.arrow_drop_down, color: KalroColors.primaryGreen),
                              items: BatchStatus.values.map((s) {
                                return DropdownMenuItem(
                                  value: s,
                                  child: Text(s.label, style: GoogleFonts.poppins(fontSize: 15)),
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
                    
                    // Tab 2: Predictions
                    ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        PredictionOutcomeCard(cycle: cycle),
                        const SizedBox(height: 12),
                        PredictionConditionsBanner(
                          adjustment: adjustment,
                          logged: _scenario == null && loggedConditions.fromLogs,
                          harvestShiftDays: cycle.harvestShiftDays,
                          shiftSummary: cycle.shiftSummary,
                          snapshot: conditions.snapshotLabel,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'What if weather or leaf changes?',
                          style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _scenario?.detail ??
                              'Dates follow logs you recorded. Try a scenario to see hatch, harvest, and moths move.',
                          style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                        ),
                        const SizedBox(height: 8),
                        PredictionScenarioBar(
                          selected: _scenario,
                          includeRecorded: true,
                          onSelected: (value) => setState(() => _scenario = value),
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
              ),
            );
          },
        ),
      ),
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
