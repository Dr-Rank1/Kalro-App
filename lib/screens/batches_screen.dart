import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../l10n/app_localizations.dart';
import '../models/batch.dart';
import '../models/batch_status.dart';
import '../models/cycle_memory.dart';
import '../models/rearing_conditions.dart';
import '../models/species.dart';
import '../services/app_repositories.dart';
import '../services/batch_metrics_service.dart';
import '../services/cycle_memory_service.dart';
import '../services/lifecycle_engine.dart';
import '../services/rearing_conditions_service.dart';
import '../theme/kalro_colors.dart';
import 'batch_detail_screen.dart';
import 'create_batch_screen.dart';
import 'package:kalro/l10n/translator.dart';

/// List, create, and open batches for recording and updates.
class BatchesScreen extends StatefulWidget {
  BatchesScreen({
    super.key,
    required this.repositories,
    required this.onBatchChanged,
    this.canEdit = true,
    this.reloadCounter = 0,
  });

  final AppRepositories repositories;
  final VoidCallback onBatchChanged;
  final bool canEdit;
  final int reloadCounter;

  @override
  State<BatchesScreen> createState() => _BatchesScreenState();
}

enum _BatchWindow { all, thisWeek, thisMonth }

class _BatchesScreenState extends State<BatchesScreen> {
  @override
  void didUpdateWidget(covariant BatchesScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.reloadCounter != widget.reloadCounter) {
      _reload();
    }
  }

  final _lifecycleEngine = LifecycleEngine();
  static const _conditionsService = RearingConditionsService();
  static const _metrics = BatchMetricsService();
  static const _memory = CycleMemoryService();
  late Future<_BatchesBundle> _batchesFuture;
  Species? _speciesFilter;
  _BatchWindow _window = _BatchWindow.all;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _batchesFuture = _load();
    });
  }

  Future<_BatchesBundle> _load() async {
    final batches = await widget.repositories.batches.getAll();
    final environmentLogs = await widget.repositories.environmentLogs.getAll();
    final feedLogs = await widget.repositories.feedLogs.getAll();
    final mortalityLogs = await widget.repositories.mortalityLogs.getAll();
    final harvests = await widget.repositories.cocoonHarvests.getAll();
    final purchases = await widget.repositories.purchaseOrders.getAll();
    final prices = await widget.repositories.inventorySettings.get();
    final observations = <String, Map<String, DateTime>>{};
    final conditions = <String, RearingConditions>{};
    await Future.wait(
      batches.map((batch) async {
        observations[batch.id] = await widget.repositories.milestoneObservations
            .stageDatesForBatch(batch.id);
        conditions[batch.id] = _conditionsService.fromLogs(
          batch: batch,
          environmentLogs: environmentLogs,
          feedLogs: feedLogs,
        );
      }),
    );

    final today = DateTime(
      DateTime.now().year,
      DateTime.now().month,
      DateTime.now().day,
    );
    final liveByBatch = <String, int>{};
    final fedToday = <String, bool>{};
    final survival = <String, double>{};
    for (final batch in batches) {
      final deaths = mortalityLogs
          .where((e) => e.batchId == batch.id)
          .fold<int>(0, (sum, e) => sum + e.count);
      final metrics = _metrics.compute(batch, deaths);
      liveByBatch[batch.id] = metrics.liveCount;
      survival[batch.id] = metrics.survivalRatePercent;
      fedToday[batch.id] = feedLogs.any((e) {
        if (e.batchId != batch.id) return false;
        final at = DateTime(e.recordedAt.year, e.recordedAt.month, e.recordedAt.day);
        return at == today;
      });
    }

    final memories = <String, CycleMemory>{};
    for (final batch in batches.where(_isClosed)) {
      memories[batch.id] = _memory.build(
        batch: batch,
        feedLogs: feedLogs,
        mortalityLogs: mortalityLogs,
        harvests: harvests,
        purchases: purchases,
        prices: prices,
        observedStageDates: observations[batch.id],
      );
    }

    return _BatchesBundle(
      batches: batches,
      observations: observations,
      conditions: conditions,
      liveByBatch: liveByBatch,
      fedToday: fedToday,
      survival: survival,
      memories: memories,
    );
  }

  bool _isClosed(Batch batch) =>
      batch.status == BatchStatus.closed ||
      batch.status == BatchStatus.harvested;

  List<Batch> _active(List<Batch> batches) =>
      batches.where((b) => !_isClosed(b)).toList();

  List<Batch> _closed(List<Batch> batches) =>
      batches.where(_isClosed).toList()
        ..sort((a, b) => b.startDate.compareTo(a.startDate));

  bool _matches(Batch batch) {
    if (_speciesFilter != null && batch.species != _speciesFilter) return false;
    final now = DateTime.now();
    switch (_window) {
      case _BatchWindow.all:
        break;
      case _BatchWindow.thisWeek:
        if (now.difference(batch.startDate).inDays > 7) return false;
      case _BatchWindow.thisMonth:
        if (batch.startDate.year != now.year ||
            batch.startDate.month != now.month) {
          return false;
        }
    }
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return true;
    final hay = [
      batch.species.label,
      batch.location,
      batch.caretaker,
      batch.strain,
      batch.eggSource,
      '${batch.eggCount}',
    ].whereType<String>().join(' ').toLowerCase();
    return hay.contains(q);
  }

  Future<void> _openCreateBatch({Batch? copyFrom}) async {
    if (!widget.canEdit) return;
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => CreateBatchScreen(
          repository: widget.repositories.batches,
          producers: widget.repositories.producers,
          copyFrom: copyFrom,
        ),
      ),
    );
    if (created == true) {
      _reload();
      widget.onBatchChanged();
    }
  }

  Future<void> _openBatch(String batchId) async {
    await Navigator.of(
      context,
    ).pushNamed(BatchDetailScreen.routeName, arguments: batchId);
    _reload();
    widget.onBatchChanged();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: KalroBackground(
        child: SafeArea(
          child: RefreshIndicator(
            onRefresh: () async => _reload(),
            child: FutureBuilder<_BatchesBundle>(
              future: _batchesFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting &&
                    !snapshot.hasData) {
                  return const Center(child: CircularProgressIndicator());
                }

                final bundle = snapshot.data;
                final all = bundle?.batches ?? [];
                final active = _active(all).where(_matches).toList();
                final closed = _closed(all).where(_matches).toList();
                final unfilteredActive = _active(all);
                final unfilteredClosed = _closed(all);

                return ListView(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 88),
                  children: [
                    KalroToolbar(
                      title: l10n?.batchesTitle ?? 'Batches',
                      subtitle:
                          l10n?.batchesSubtitle ??
                          'Create cycles and log feeding, health, and harvest.',
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      onChanged: (value) => setState(() => _query = value),
                      decoration: InputDecoration(
                        hintText: 'Search name, house, caretaker'.tr,
                        prefixIcon: const Icon(Icons.search),
                        filled: true,
                        fillColor: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _FilterChip(
                          label: 'All'.tr,
                          selected: _speciesFilter == null,
                          onTap: () => setState(() => _speciesFilter = null),
                        ),
                        _FilterChip(
                          label: Species.bombyx.label,
                          selected: _speciesFilter == Species.bombyx,
                          onTap: () => setState(() {
                            _speciesFilter = _speciesFilter == Species.bombyx
                                ? null
                                : Species.bombyx;
                          }),
                        ),
                        _FilterChip(
                          label: Species.eri.label,
                          selected: _speciesFilter == Species.eri,
                          onTap: () => setState(() {
                            _speciesFilter = _speciesFilter == Species.eri
                                ? null
                                : Species.eri;
                          }),
                        ),
                        _FilterChip(
                          label: 'This week'.tr,
                          selected: _window == _BatchWindow.thisWeek,
                          onTap: () => setState(() {
                            _window = _window == _BatchWindow.thisWeek
                                ? _BatchWindow.all
                                : _BatchWindow.thisWeek;
                          }),
                        ),
                        _FilterChip(
                          label: 'This month'.tr,
                          selected: _window == _BatchWindow.thisMonth,
                          onTap: () => setState(() {
                            _window = _window == _BatchWindow.thisMonth
                                ? _BatchWindow.all
                                : _BatchWindow.thisMonth;
                          }),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    RecordSummaryBar(
                      items: [
                        RecordSummaryItem(
                          label: l10n?.batchesActiveCount ?? 'Active',
                          value: '${unfilteredActive.length}',
                        ),
                        RecordSummaryItem(
                          label: l10n?.batchesClosedCount ?? 'Closed',
                          value: '${unfilteredClosed.length}',
                        ),
                        RecordSummaryItem(
                          label: l10n?.batchesTotalCount ?? 'Total',
                          value: '${all.length}',
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    KalroSectionHeader(
                      title: l10n?.batchesActiveHeader ?? 'Active batches',
                      subtitle: active.isEmpty
                          ? null
                          : '${active.length} ${l10n?.batchesInProgress ?? "in progress"}',
                    ),
                    const SizedBox(height: 10),
                    if (active.isEmpty && closed.isEmpty && (unfilteredActive.isNotEmpty || unfilteredClosed.isNotEmpty))
                      RecordEmptyState(
                        icon: Icons.search_off_outlined,
                        title: 'No lots match this filter'.tr,
                        message:
                            'Try All, another species, or clear the search.'.tr,
                      )
                    else if (unfilteredActive.isEmpty)
                      RecordEmptyState(
                        icon: Icons.layers_outlined,
                        title: l10n?.batchesNoActive ?? 'No active batches',
                        message: widget.canEdit
                            ? (l10n?.batchesNoActiveDesc ??
                                  'Start a rearing cycle to plan milestones and record daily work.')
                            : (l10n?.batchesNoActiveDescViewer ??
                                  'No batches are running right now.'),
                        actionLabel: widget.canEdit
                            ? (l10n?.batchesCreateAction ?? 'Create batch')
                            : null,
                        onAction: widget.canEdit ? _openCreateBatch : null,
                      )
                    else if (active.isEmpty)
                      RecordEmptyState(
                        icon: Icons.search_off_outlined,
                        title: 'No lots match this filter'.tr,
                        message:
                            'Try All, another species, or clear the search.'.tr,
                      )
                    else
                      ...active.map(
                        (batch) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: BatchHorizontalCard(
                            batch: batch,
                            lifecycleEngine: _lifecycleEngine,
                            observedStageDates: bundle?.observations[batch.id],
                            conditions: bundle?.conditions[batch.id],
                            liveCount: bundle?.liveByBatch[batch.id],
                            fedToday: bundle?.fedToday[batch.id],
                            survivalPercent: bundle?.survival[batch.id],
                            onTap: () => _openBatch(batch.id),
                          ),
                        ),
                      ),
                    if (closed.isNotEmpty) ...[
                      const SizedBox(height: 20),
                      KalroSectionHeader(
                        title: l10n?.batchesClosedHeader ?? 'Closed batches',
                        subtitle: 'Harvest, survival, and cost per kg'.tr,
                      ),
                      const SizedBox(height: 10),
                      ...closed.map((batch) {
                        final memory = bundle?.memories[batch.id];
                        if (memory == null) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: CycleMemoryCard(
                            memory: memory,
                            showMoney: true,
                            onOpen: () => _openBatch(batch.id),
                            onStartLikeThis: widget.canEdit
                                ? () => _openCreateBatch(copyFrom: batch)
                                : null,
                          ),
                        );
                      }),
                    ],
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}

class _BatchesBundle {
  const _BatchesBundle({
    required this.batches,
    required this.observations,
    required this.conditions,
    required this.liveByBatch,
    required this.fedToday,
    required this.survival,
    required this.memories,
  });

  final List<Batch> batches;
  final Map<String, Map<String, DateTime>> observations;
  final Map<String, RearingConditions> conditions;
  final Map<String, int> liveByBatch;
  final Map<String, bool> fedToday;
  final Map<String, double> survival;
  final Map<String, CycleMemory> memories;
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
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
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selected ? KalroColors.headerGreen : KalroColors.divider,
            ),
          ),
          child: Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: selected ? Colors.white : KalroColors.textDark,
            ),
          ),
        ),
      ),
    );
  }
}
