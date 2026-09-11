import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../utils/kalro_formatters.dart';

import '../components/components.dart';
import '../models/inventory_summary.dart';
import '../services/app_repositories.dart';
import '../services/inventory_service.dart';
import '../theme/kalro_colors.dart';
import 'batch_detail_screen.dart';
import 'create_batch_screen.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({
    super.key,
    required this.repositories,
    required this.onBatchChanged,
    this.canCreateBatch = true,
  });

  final AppRepositories repositories;
  final VoidCallback onBatchChanged;
  final bool canCreateBatch;

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  final _inventoryService = const InventoryService();
  late Future<InventorySummary> _summaryFuture;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _summaryFuture = _inventoryService.load(widget.repositories);
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

  Future<void> _editPrice({
    required String title,
    required double current,
    required Future<void> Function(double value) onSave,
  }) async {
    final controller = TextEditingController(text: current.toStringAsFixed(0));
    final currency = KalroFormatters.currency;

    final saved = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Update $title'),
          content: TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: InputDecoration(
              labelText: 'Price per unit',
              prefixText: KalroFormatters.currencyPrefix,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Save'),
            ),
          ],
        );
      },
    );

    if (saved != true) return;

    final parsed = double.tryParse(controller.text.trim());
    if (parsed == null || parsed <= 0) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid price')),
      );
      return;
    }

    await onSave(parsed);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$title updated to ${currency.format(parsed)}')),
    );
    _reload();
  }

  String _formatFeedGrams(double grams) {
    if (grams >= 1000) return '${(grams / 1000).toStringAsFixed(1)} kg feed';
    if (grams == 0) return 'No feed logged';
    return '${grams.round()} g feed';
  }

  @override
  Widget build(BuildContext context) {
    final currency = KalroFormatters.currency;

    return AsyncContent(
      future: _summaryFuture,
      builder: (context, summary) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          floatingActionButton: widget.canCreateBatch
              ? FloatingActionButton(
                  onPressed: _openCreateBatch,
                  backgroundColor: KalroColors.buttonGreen,
                  child: const Icon(Icons.add),
                )
              : null,
          body: KalroBackground(
            child: SafeArea(
              child: RefreshIndicator(
                onRefresh: () async => _reload(),
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
                  children: [
                    KalroToolbar(
                      title: 'Inventory',
                      subtitle:
                          '${summary.activeBatchCount} active batch${summary.activeBatchCount == 1 ? '' : 'es'}. Tap price cards to update.',
                    ),
                    const SizedBox(height: 24),
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 16,
                      childAspectRatio: 1.0,
                      children: [
                        KalroInventoryCard(
                          icon: Icons.home_outlined,
                          title: 'Bombyx Stock',
                          value: '${summary.bombyxLarvaeCount} larvae\n${_formatFeedGrams(summary.bombyxFeedGrams)}',
                          onTap: _openCreateBatch,
                        ),
                        KalroInventoryCard(
                          icon: Icons.storefront_outlined,
                          title: 'Eri Stock',
                          value: '${summary.eriLarvaeCount} larvae\n${_formatFeedGrams(summary.eriFeedGrams)}',
                          onTap: _openCreateBatch,
                        ),
                        KalroInventoryCard(
                          icon: Icons.sell_outlined,
                          title: 'Bombyx Price',
                          value: currency.format(summary.settings.bombyxPrice),
                          onTap: () => _editPrice(
                            title: 'Bombyx Price',
                            current: summary.settings.bombyxPrice,
                            onSave: (value) => widget.repositories.inventorySettings.update(
                              bombyxPrice: value,
                            ),
                          ),
                        ),
                        KalroInventoryCard(
                          icon: Icons.monetization_on_outlined,
                          title: 'Eri Price',
                          value: currency.format(summary.settings.eriPrice),
                          onTap: () => _editPrice(
                            title: 'Eri Price',
                            current: summary.settings.eriPrice,
                            onSave: (value) => widget.repositories.inventorySettings.update(
                              eriPrice: value,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    LeafInventorySection(
                      repository: widget.repositories.leafInventory,
                    ),
                    const SizedBox(height: 32),
                    const KalroSectionHeader(title: 'All Batches'),
                    const SizedBox(height: 12),
                    if (summary.batches.isEmpty)
                      EmptyStateCard(
                        title: 'No batches in inventory',
                        message: 'Create a rearing batch to track Bombyx and Eri stock.',
                        actionLabel: 'Create Batch',
                        onAction: _openCreateBatch,
                        icon: Icons.inventory_2_outlined,
                      )
                    else
                      ...summary.batches.map(
                        (batch) => BatchInventoryTile(
                          batch: batch,
                          onTap: () => _openBatch(batch.id),
                        ),
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
