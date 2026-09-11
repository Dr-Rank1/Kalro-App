import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../components/components.dart';
import '../models/rearing_conditions.dart';
import '../models/species.dart';
import '../services/app_repositories.dart';
import '../services/lifecycle_planning_service.dart';
import '../services/prediction_adjuster.dart';
import '../services/rearing_conditions_service.dart';
import '../theme/kalro_colors.dart';
import 'batch_detail_screen.dart';
import 'create_batch_screen.dart';
import 'package:kalro/l10n/translator.dart';

class LifecyclePlannerScreen extends StatefulWidget {
  LifecyclePlannerScreen({
    super.key,
    required this.repositories,
    this.canEdit = true,
  });

  final AppRepositories repositories;
  final bool canEdit;

  @override
  State<LifecyclePlannerScreen> createState() => _LifecyclePlannerScreenState();
}

class _LifecyclePlannerScreenState extends State<LifecyclePlannerScreen> {
  static const _planning = LifecyclePlanningService();
  static const _conditionsService = RearingConditionsService();
  static const _adjuster = PredictionAdjuster();
  var _tab = 0;
  late Future<List<FarmPlanEvent>> _eventsFuture;

  Species _species = Species.bombyx;
  DateTime _startDate = DateTime.now();
  RearingScenario _scenario = RearingScenario.typical;

  @override
  void initState() {
    super.initState();
    _eventsFuture = _loadEvents();
  }

  Future<List<FarmPlanEvent>> _loadEvents() async {
    final batches = await widget.repositories.batches.getAll();
    final environmentLogs = await widget.repositories.environmentLogs.getAll();
    final feedLogs = await widget.repositories.feedLogs.getAll();
    final observations = <String, Map<String, DateTime>>{};
    final conditions = <String, RearingConditions>{};
    for (final batch in batches) {
      observations[batch.id] =
          await widget.repositories.milestoneObservations.stageDatesForBatch(batch.id);
      conditions[batch.id] = _conditionsService.fromLogs(
        batch: batch,
        environmentLogs: environmentLogs,
        feedLogs: feedLogs,
      );
    }
    return _planning.upcomingForBatches(
      batches: batches,
      observationsByBatch: observations,
      conditionsByBatch: conditions,
    );
  }

  void _reload() {
    setState(() {
      _eventsFuture = _loadEvents();
    });
  }

  PlannedCycle get _previewCycle => _planning.planCycle(
        species: _species,
        startDate: _startDate,
        conditions: _scenario.conditionsFor(_species),
      );

  Future<void> _pickStartDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(Duration(days: 365)),
    );
    if (picked != null) setState(() => _startDate = picked);
  }

  Future<void> _openBatch(String batchId) async {
    await Navigator.of(context).pushNamed(
      BatchDetailScreen.routeName,
      arguments: batchId,
    );
    if (!mounted) return;
    _reload();
  }

  Future<void> _startBatchFromPlan() async {
    if (!widget.canEdit) return;
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => CreateBatchScreen(
          repository: widget.repositories.batches,
          initialSpecies: _species,
          initialStartDate: _startDate,
        ),
      ),
    );
    if (created == true && mounted) {
      setState(() => _tab = 0);
      _reload();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KalroColors.headerGreen,
      appBar: AppBar(
        title: Text('Lifecycle planner'.tr),
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
        child: KalroBackground(
          child: Column(
            children: [
              Padding(
                padding: EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: _TabChip(
                        label: 'My batches'.tr,
                        selected: _tab == 0,
                        onTap: () => setState(() => _tab = 0),
                      ),
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: _TabChip(
                        label: 'Plan a cycle'.tr,
                        selected: _tab == 1,
                        onTap: () => setState(() => _tab = 1),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: _tab == 0 ? _buildFarmPlan() : _buildWhatIf(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFarmPlan() {
    return AsyncContent(
      future: _eventsFuture,
      builder: (context, events) {
        if (events.isEmpty) {
          return ListView(
            padding: EdgeInsets.fromLTRB(20, 8, 20, 24),
            children: [
              EmptyStateCard(
                icon: Icons.auto_graph_outlined,
                title: 'No predicted dates yet'.tr,
                message:
                    'Start a batch, or plan a cycle to see hatch, spinning, harvest, and moth dates.',
                actionLabel: 'Plan a cycle',
                onAction: () => setState(() => _tab = 1),
              ),
            ],
          );
        }

        return RefreshIndicator(
          onRefresh: () async => _reload(),
          child: ListView(
            padding: EdgeInsets.fromLTRB(20, 8, 20, 24),
            children: [
              Text(
                'Dates use logged weather and feeding when you have records. Cool or dry houses, short leaf, and missed feeds each move hatch, harvest, and moths differently.',
                style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
              ),
              SizedBox(height: 16),
              ..._grouped(events).entries.expand((entry) {
                return [
                  KalroSectionHeader(title: entry.key, subtitle: '${entry.value.length}'),
                  SizedBox(height: 8),
                  ...entry.value.map(
                    (event) => Padding(
                      padding: EdgeInsets.only(bottom: 10),
                      child: _FarmEventTile(
                        event: event,
                        onTap: () => _openBatch(event.batch.id),
                      ),
                    ),
                  ),
                  SizedBox(height: 8),
                ];
              }),
            ],
          ),
        );
      },
    );
  }

  Widget _buildWhatIf() {
    final cycle = _previewCycle;
    final adjustment = _adjuster.adjust(_species, _scenario.conditionsFor(_species));

    return ListView(
      padding: EdgeInsets.fromLTRB(20, 8, 20, 24),
      children: [
        Text(
          'Pick species and start date, then test weather and leaf scenarios before you start eggs.',
          style: GoogleFonts.poppins(fontSize: 13, color: KalroColors.textMuted),
        ),
        SizedBox(height: 16),
        KalroSpeciesDropdown(
          key: ValueKey(_species),
          value: _species,
          onChanged: (value) {
            if (value != null) setState(() => _species = value);
          },
        ),
        SizedBox(height: 8),
        KalroDateRow(
          label: 'Egg start date'.tr,
          date: _startDate,
          onTap: _pickStartDate,
        ),
        SizedBox(height: 16),
        Text(
          'What if conditions change?',
          style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600),
        ),
        SizedBox(height: 4),
        Text(
          _scenario.detail,
          style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
        ),
        SizedBox(height: 8),
        PredictionScenarioBar(
          selected: _scenario,
          onSelected: (value) {
            if (value != null) setState(() => _scenario = value);
          },
        ),
        SizedBox(height: 16),
        PredictionOutcomeCard(cycle: cycle),
        SizedBox(height: 12),
        LifecycleKeyDatesCard(
          cycle: cycle,
          footnote: cycle.shiftSummary == null
              ? 'Typical ${_species.label} durations from the rearing spec.'
              : 'Compared with a typical house and enough leaf.',
        ),
        SizedBox(height: 12),
        PredictionConditionsBanner(
          adjustment: adjustment,
          harvestShiftDays: cycle.harvestShiftDays,
          shiftSummary: cycle.shiftSummary,
          snapshot: _scenario.conditionsFor(_species).snapshotLabel,
        ),
        SizedBox(height: 20),
        KalroSectionHeader(
          title: 'Full predicted timeline'.tr,
          subtitle: 'What to prepare'.tr,
        ),
        SizedBox(height: 8),
        PlanningTimeline(cycle: cycle, planning: _planning),
        if (widget.canEdit) ...[
          SizedBox(height: 24),
          KalroPrimaryButton(
            label: 'Start this batch'.tr,
            onPressed: _startBatchFromPlan,
          ),
        ],
      ],
    );
  }

  Map<String, List<FarmPlanEvent>> _grouped(List<FarmPlanEvent> events) {
    final groups = <String, List<FarmPlanEvent>>{};
    for (final event in events) {
      final label = _groupLabel(event);
      groups.putIfAbsent(label, () => []).add(event);
    }
    return groups;
  }

  String _groupLabel(FarmPlanEvent event) {
    if (event.isOverdue) return 'Overdue';
    if (event.isToday) return 'Today';
    if (event.daysUntil == 1) return 'Tomorrow';
    if (event.daysUntil <= 7) return 'This week';
    return 'Coming up';
  }
}

class _TabChip extends StatelessWidget {
  const _TabChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? KalroColors.headerGreen : Colors.white,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          alignment: Alignment.center,
          padding: EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: selected ? KalroColors.headerGreen : KalroColors.divider,
            ),
          ),
          child: Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: selected ? Colors.white : KalroColors.textDark,
            ),
          ),
        ),
      ),
    );
  }
}

class _FarmEventTile extends StatelessWidget {
  const _FarmEventTile({required this.event, required this.onTap});

  final FarmPlanEvent event;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat.MMMd();
    final timing = event.isOverdue
        ? '${-event.daysUntil}d late'
        : event.isToday
            ? 'Today'
            : event.daysUntil == 1
                ? 'Tomorrow'
                : 'In ${event.daysUntil} days';

    return KalroOutlineCard(
      onTap: onTap,
      padding: EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            padding: EdgeInsets.symmetric(vertical: 6),
            decoration: BoxDecoration(
              color: event.isOverdue
                  ? Color(0xFFFFE8E8)
                  : event.isToday
                      ? KalroColors.peach.withValues(alpha: 0.5)
                      : KalroColors.background,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                Text(
                  DateFormat('MMM').format(event.milestone.effectiveDate).toUpperCase(),
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: event.isOverdue ? Colors.red.shade700 : KalroColors.accentBrown,
                  ),
                ),
                Text(
                  '${event.milestone.effectiveDate.day}',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event.title,
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                SizedBox(height: 2),
                Text(
                  '${event.batch.species.label} · ${dateFormat.format(event.milestone.effectiveDate)} · $timing',
                  style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                ),
                SizedBox(height: 6),
                Text(
                  event.prepNote,
                  style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textDark),
                ),
                if (event.conditionNote != null) ...[
                  SizedBox(height: 4),
                  Text(
                    event.conditionNote!,
                    style: GoogleFonts.poppins(fontSize: 11, color: KalroColors.accentBrown),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}