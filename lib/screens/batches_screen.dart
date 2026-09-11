import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../models/batch.dart';
import '../models/batch_status.dart';
import '../models/rearing_conditions.dart';
import '../services/app_repositories.dart';
import '../services/lifecycle_engine.dart';
import '../services/rearing_conditions_service.dart';
import '../theme/kalro_colors.dart';
import '../l10n/app_localizations.dart';
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
  });

  final AppRepositories repositories;
  final VoidCallback onBatchChanged;
  final bool canEdit;

  @override
  State<BatchesScreen> createState() => _BatchesScreenState();
}

class _BatchesScreenState extends State<BatchesScreen> {
  final _lifecycleEngine = LifecycleEngine();
  static const _conditionsService = RearingConditionsService();
  late Future<_BatchesBundle> _batchesFuture;

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
    final observations = <String, Map<String, DateTime>>{};
    final conditions = <String, RearingConditions>{};
    await Future.wait(batches.map((batch) async {
      observations[batch.id] =
          await widget.repositories.milestoneObservations.stageDatesForBatch(batch.id);
      conditions[batch.id] = _conditionsService.fromLogs(
        batch: batch,
        environmentLogs: environmentLogs,
        feedLogs: feedLogs,
      );
    }));
    return _BatchesBundle(
      batches: batches,
      observations: observations,
      conditions: conditions,
    );
  }

  List<Batch> _active(List<Batch> batches) =>
      batches.where((b) => b.status != BatchStatus.closed).toList();

  List<Batch> _closed(List<Batch> batches) =>
      batches.where((b) => b.status == BatchStatus.closed).toList();

  Future<void> _openCreateBatch() async {
    if (!widget.canEdit) return;
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
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Center(child: CircularProgressIndicator());
                }

                final bundle = snapshot.data;
                final all = bundle?.batches ?? [];
                final active = _active(all);
                final closed = _closed(all);

                return ListView(
                  padding: EdgeInsets.fromLTRB(20, 20, 20, 88),
                  children: [
                    KalroToolbar(
                      title: l10n?.batchesTitle ?? 'Batches',
                      subtitle: l10n?.batchesSubtitle ?? 'Create cycles and log feeding, health, and harvest.',
                    ),
                    SizedBox(height: 16),
                    RecordSummaryBar(
                      items: [
                        RecordSummaryItem(label: l10n?.batchesActiveCount ?? 'Active', value: '${active.length}'),
                        RecordSummaryItem(label: l10n?.batchesClosedCount ?? 'Closed', value: '${closed.length}'),
                        RecordSummaryItem(label: l10n?.batchesTotalCount ?? 'Total', value: '${all.length}'),
                      ],
                    ),
                    SizedBox(height: 24),
                    KalroSectionHeader(
                      title: l10n?.batchesActiveHeader ?? 'Active batches',
                      subtitle: active.isEmpty ? null : '${active.length} ${l10n?.batchesInProgress ?? "in progress"}',
                    ),
                    SizedBox(height: 10),
                    if (active.isEmpty)
                      RecordEmptyState(
                        icon: Icons.layers_outlined,
                        title: l10n?.batchesNoActive ?? 'No active batches',
                        message: widget.canEdit ? (l10n?.batchesNoActiveDesc ?? 'Start a rearing cycle to plan milestones and record daily work.') : (l10n?.batchesNoActiveDescViewer ?? 'No batches are running right now.'),
                        actionLabel: widget.canEdit ? (l10n?.batchesCreateAction ?? 'Create batch') : null,
                        onAction: widget.canEdit ? _openCreateBatch : null,
                      )
                    else
                      ...active.map(
                        (batch) => Padding(
                          padding: EdgeInsets.only(bottom: 10),
                          child: BatchHorizontalCard(
                            batch: batch,
                            lifecycleEngine: _lifecycleEngine,
                            observedStageDates: bundle?.observations[batch.id],
                            conditions: bundle?.conditions[batch.id],
                            onTap: () => _openBatch(batch.id),
                          ),
                        ),
                      ),
                    if (closed.isNotEmpty) ...[
                      SizedBox(height: 20),
                      KalroSectionHeader(
                        title: l10n?.batchesClosedHeader ?? 'Closed batches',
                        subtitle: '${closed.length} ${l10n?.batchesArchived ?? "archived"}'.tr,
                      ),
                      SizedBox(height: 10),
                      ...closed.map(
                        (batch) => Padding(
                          padding: EdgeInsets.only(bottom: 10),
                          child: _ClosedBatchTile(
                            batch: batch,
                            onTap: () => _openBatch(batch.id),
                          ),
                        ),
                      ),
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
  });

  final List<Batch> batches;
  final Map<String, Map<String, DateTime>> observations;
  final Map<String, RearingConditions> conditions;
}

class _ClosedBatchTile extends StatelessWidget {
  const _ClosedBatchTile({required this.batch, required this.onTap});

  final Batch batch;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: KalroColors.divider),
          ),
          padding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: KalroColors.background,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  batch.species.name == 'eri' ? Icons.eco_outlined : Icons.flutter_dash,
                  size: 22,
                  color: KalroColors.textMuted,
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      batch.species.label,
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    Text(
                      '${AppLocalizations.of(context)?.batchesClosedLabel ?? "Closed"} · ${batch.eggCount} ${AppLocalizations.of(context)?.batchesLarvaeLabel ?? "larvae"}',
                      style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: KalroColors.textLight, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}
