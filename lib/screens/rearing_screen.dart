import 'package:flutter/material.dart';

import '../components/components.dart';
import '../models/batch.dart';
import '../models/batch_status.dart';
import '../models/inventory_summary.dart';
import '../services/app_repositories.dart';
import '../services/farmer_summary_service.dart';
import '../services/inventory_service.dart';
import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';
import 'batch_detail_screen.dart';
import 'create_batch_screen.dart';
import 'reports_screen.dart';

typedef RearingData = ({InventorySummary inventory, FarmerSummary summary});

class RearingScreen extends StatefulWidget {
  const RearingScreen({
    super.key,
    required this.repositories,
    required this.userPreferences,
    required this.onBatchChanged,
    this.canEdit = true,
  });

  final AppRepositories repositories;
  final UserPreferences userPreferences;
  final VoidCallback onBatchChanged;
  final bool canEdit;

  @override
  State<RearingScreen> createState() => _RearingScreenState();
}

class _RearingScreenState extends State<RearingScreen> {
  final _inventoryService = const InventoryService();
  final _farmerSummary = FarmerSummaryService();
  late Future<RearingData> _dataFuture;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _dataFuture = _load();
    });
  }

  Future<RearingData> _load() async {
    final inventory = await _inventoryService.load(widget.repositories);
    final summary = await _farmerSummary.load(
      repositories: widget.repositories,
      userPreferences: widget.userPreferences,
    );
    return (inventory: inventory, summary: summary);
  }

  List<Batch> _activeBatches(InventorySummary inventory) {
    return inventory.batches
        .where((batch) => batch.status != BatchStatus.closed)
        .toList();
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

  void _openReports() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ReportsScreen(
          repositories: widget.repositories,
          userPreferences: widget.userPreferences,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AsyncContent(
      future: _dataFuture,
      builder: (context, data) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          floatingActionButton: widget.canEdit
              ? FloatingActionButton.extended(
                  onPressed: _openCreateBatch,
                  backgroundColor: KalroColors.buttonGreen,
                  icon: const Icon(Icons.add),
                  label: const Text('New batch'),
                )
              : null,
          body: KalroBackground(
            child: SafeArea(
              child: RefreshIndicator(
                onRefresh: () async => _reload(),
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 88),
                  children: [
                    const KalroToolbar(
                      title: 'Rearing',
                      subtitle: 'Tap a batch to log feeding, health, and harvest.',
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: PaymentSummaryCard(
                            title: 'Active batches',
                            value: data.summary.activeBatchCount.toString(),
                            icon: Icons.layers_outlined,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: PaymentSummaryCard(
                            title: 'Alerts',
                            value: data.summary.alertCount.toString(),
                            icon: Icons.warning_amber_outlined,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    KalroMenuTile(
                      icon: Icons.assessment_outlined,
                      title: 'Reports & exports',
                      onTap: _openReports,
                    ),
                    const SizedBox(height: 24),
                    const KalroSectionHeader(title: 'Active batches'),
                    const SizedBox(height: 12),
                    if (_activeBatches(data.inventory).isEmpty)
                      EmptyStateCard(
                        title: 'No active batches',
                        message: 'Start a rearing cycle to plan feeding, milestones, and harvest.',
                        actionLabel: widget.canEdit ? 'Create batch' : 'View only',
                        onAction: widget.canEdit ? _openCreateBatch : () {},
                        icon: Icons.eco_outlined,
                      )
                    else
                      ..._activeBatches(data.inventory).map(
                        (batch) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: BatchInventoryTile(
                            batch: batch,
                            onTap: () => _openBatch(batch.id),
                          ),
                        ),
                      ),
                    const SizedBox(height: 16),
                    LeafInventorySection(
                      repository: widget.repositories.leafInventory,
                    ),
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
