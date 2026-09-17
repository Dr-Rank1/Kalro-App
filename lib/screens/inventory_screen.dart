import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../utils/kalro_formatters.dart';

import '../components/components.dart';
import '../models/inventory_summary.dart';
import '../services/app_repositories.dart';
import '../services/inventory_service.dart';
import '../services/leaf_ledger_service.dart';
import '../theme/kalro_colors.dart';
import 'batch_detail_screen.dart';
import 'create_batch_screen.dart';
import 'package:kalro/l10n/translator.dart';

class InventoryScreen extends StatefulWidget {
  InventoryScreen({
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
  final _inventoryService = InventoryService();
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
        builder: (_) =>
            CreateBatchScreen(
              repository: widget.repositories.batches,
              producers: widget.repositories.producers,
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
          title: Text('Update $title'.tr),
          content: TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: InputDecoration(
              labelText: 'Price per unit'.tr,
              prefixText: KalroFormatters.currencyPrefix,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text('Cancel'.tr),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: Text('Save'.tr),
            ),
          ],
        );
      },
    );

    if (saved != true) return;

    final parsed = double.tryParse(controller.text.trim());
    if (parsed == null || parsed <= 0) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Enter a valid price'.tr)));
      return;
    }

    await onSave(parsed);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$title updated to ${currency.format(parsed)}'.tr),
      ),
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
                  child: Icon(Icons.add),
                )
              : null,
          body: KalroBackground(
            child: SafeArea(
              child: RefreshIndicator(
                onRefresh: () async => _reload(),
                child: ListView(
                  padding: EdgeInsets.fromLTRB(20, 20, 20, 24),
                  children: [
                    KalroToolbar(
                      title: 'Inventory'.tr,
                      subtitle:
                          '${summary.activeBatchCount} active batch${summary.activeBatchCount == 1 ? '' : 'es'}. Tap price cards to update.',
                    ),
                    SizedBox(height: 24),
                    GridView.count(
                      shrinkWrap: true,
                      physics: NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 16,
                      childAspectRatio: 1.0,
                      children: [
                        KalroInventoryCard(
                          icon: Icons.home_outlined,
                          title: 'Bombyx Stock'.tr,
                          value:
                              '${summary.bombyxLarvaeCount} larvae\n${_formatFeedGrams(summary.bombyxFeedGrams)}',
                          onTap: _openCreateBatch,
                        ),
                        KalroInventoryCard(
                          icon: Icons.storefront_outlined,
                          title: 'Eri Stock'.tr,
                          value:
                              '${summary.eriLarvaeCount} larvae\n${_formatFeedGrams(summary.eriFeedGrams)}',
                          onTap: _openCreateBatch,
                        ),
                        KalroInventoryCard(
                          icon: Icons.sell_outlined,
                          title: 'Bombyx Price'.tr,
                          value: currency.format(summary.settings.bombyxPrice),
                          onTap: () => _editPrice(
                            title: 'Bombyx Price'.tr,
                            current: summary.settings.bombyxPrice,
                            onSave: (value) => widget
                                .repositories
                                .inventorySettings
                                .update(bombyxPrice: value),
                          ),
                        ),
                        KalroInventoryCard(
                          icon: Icons.monetization_on_outlined,
                          title: 'Eri Price'.tr,
                          value: currency.format(summary.settings.eriPrice),
                          onTap: () => _editPrice(
                            title: 'Eri Price'.tr,
                            current: summary.settings.eriPrice,
                            onSave: (value) => widget
                                .repositories
                                .inventorySettings
                                .update(eriPrice: value),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 24),
                    LeafInventorySection(
                      repository: widget.repositories.leafInventory,
                      farmRepositories: widget.repositories,
                      onChanged: _reload,
                    ),
                    SizedBox(height: 12),
                    Text(
                      Translator.fill('{n} days of cover at today’s feed', {
                        'n': () {
                          final cover = LeafLedgerService.daysOfCover(
                            stockKg: summary.leafStockKg,
                            dailyNeedKg: summary.leafNeedTodayKg,
                          );
                          return cover >= 99 ? '—' : cover.toStringAsFixed(1);
                        }(),
                      }),
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: KalroColors.textDark,
                      ),
                    ),
                    SizedBox(height: 16),
                    LeafLedgerSection(
                      repositories: widget.repositories,
                      canEdit: widget.canCreateBatch,
                      dailyNeedKg: summary.leafNeedTodayKg,
                      onChanged: _reload,
                    ),
                    SizedBox(height: 16),
                    _LeafDemandCard(summary: summary),
                    SizedBox(height: 32),
                    KalroSectionHeader(title: 'All Batches'.tr),
                    SizedBox(height: 12),
                    if (summary.batches.isEmpty)
                      EmptyStateCard(
                        title: 'No batches in inventory'.tr,
                        message:
                            'Create a rearing batch to track Bombyx and Eri stock.'
                                .tr,
                        actionLabel: 'Create Batch'.tr,
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

class _LeafDemandCard extends StatelessWidget {
  const _LeafDemandCard({required this.summary});

  final InventorySummary summary;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: KalroColors.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: KalroColors.leaf.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.grass_outlined,
                  color: KalroColors.leaf,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Leaf needed to harvest'.tr,
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _LeafBar(
            label: 'Mulberry'.tr,
            needed: summary.mulberryNeededKg,
            stock: summary.mulberryStockKg,
          ),
          const SizedBox(height: 12),
          _LeafBar(
            label: 'Castor / kesseru'.tr,
            needed: summary.eriLeafNeededKg,
            stock: summary.eriStockKg,
          ),
        ],
      ),
    );
  }
}

class _LeafBar extends StatelessWidget {
  const _LeafBar({
    required this.label,
    required this.needed,
    required this.stock,
  });

  final String label;
  final double needed;
  final double stock;

  @override
  Widget build(BuildContext context) {
    final gap = needed - stock;
    final ratio = needed <= 0 ? 1.0 : (stock / needed).clamp(0.0, 1.0);
    final short = gap > 0.05;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
            Text(
              short ? 'Short ${gap.toStringAsFixed(1)} kg' : 'Covered',
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: short ? KalroColors.rest : KalroColors.success,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(99),
          child: LinearProgressIndicator(
            value: needed <= 0 ? 1 : ratio,
            minHeight: 8,
            backgroundColor: KalroColors.divider,
            color: short ? KalroColors.rest : KalroColors.leaf,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Need ${needed.toStringAsFixed(1)} kg · stock ${stock.toStringAsFixed(1)} kg',
          style: GoogleFonts.poppins(
            fontSize: 12,
            color: KalroColors.textMuted,
          ),
        ),
      ],
    );
  }
}
