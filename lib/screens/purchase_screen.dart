import 'package:flutter/material.dart';
import '../utils/kalro_formatters.dart';

import '../components/components.dart';
import '../models/producer.dart';
import '../models/purchase_summary.dart';
import '../services/app_repositories.dart';
import '../services/purchase_service.dart';
import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';
import 'add_producer_screen.dart';
import 'create_purchase_screen.dart';

class PurchaseScreen extends StatefulWidget {
  const PurchaseScreen({
    super.key,
    required this.repositories,
    required this.userPreferences,
    this.readOnly = false,
    this.showToolbar = true,
  });

  final AppRepositories repositories;
  final UserPreferences userPreferences;
  final bool readOnly;
  final bool showToolbar;

  @override
  State<PurchaseScreen> createState() => _PurchaseScreenState();
}

class _PurchaseScreenState extends State<PurchaseScreen> {
  final _purchaseService = const PurchaseService();
  late Future<PurchaseSummary> _summaryFuture;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _summaryFuture = _purchaseService.load(widget.repositories);
    });
  }

  Future<void> _openAddProducer() async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => AddProducerScreen(repositories: widget.repositories),
      ),
    );
    if (created == true) _reload();
  }

  Future<void> _openCreatePurchase(Producer producer) async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => CreatePurchaseScreen(
          repositories: widget.repositories,
          producer: producer,
        ),
      ),
    );
    if (created == true) _reload();
  }

  Future<void> _deleteOrder(String id) async {
    await widget.repositories.purchaseOrders.delete(id);
    _reload();
  }

  String _producerDetail(Producer producer) {
    final parts = <String>[];
    if (producer.location != null) parts.add(producer.location!);
    if (producer.species != null) parts.add(producer.species!);
    return parts.join(' · ');
  }

  @override
  Widget build(BuildContext context) {
    final currency = KalroFormatters.currency;

    return AsyncContent(
      future: _summaryFuture,
      builder: (context, summary) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          floatingActionButton: widget.readOnly
              ? null
              : FloatingActionButton(
                  onPressed: _openAddProducer,
                  backgroundColor: KalroColors.buttonGreen,
                  child: const Icon(Icons.add),
                ),
          body: KalroBackground(
            child: SafeArea(
              child: RefreshIndicator(
                onRefresh: () async => _reload(),
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
                  children: [
                    if (widget.showToolbar) ...[
                      const KalroToolbar(
                        title: 'Purchase',
                        subtitle: 'Find KALRO seed suppliers and rearing support.',
                      ),
                      const SizedBox(height: 24),
                    ],
                    Row(
                      children: [
                        Expanded(
                          child: PaymentSummaryCard(
                            title: 'Total Orders',
                            value: summary.totalOrders.toString(),
                            icon: Icons.receipt_long_outlined,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: PaymentSummaryCard(
                            title: 'Total Spend',
                            value: currency.format(summary.totalSpend),
                            icon: Icons.payments_outlined,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    const KalroSectionHeader(title: 'Producers'),
                    const SizedBox(height: 12),
                    ...summary.producers.map(
                      (producer) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: ProducerListingCard(
                          title: producer.name,
                          subtitle: producer.type.label,
                          detail: _producerDetail(producer).isEmpty ? null : _producerDetail(producer),
                          onAction: () => _openCreatePurchase(producer),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const KalroSectionHeader(title: 'Recent Purchases'),
                    const SizedBox(height: 12),
                    if (summary.recentOrders.isEmpty)
                      EmptyStateCard(
                        title: 'No purchases yet',
                        message: 'Tap Purchase on a producer to log seed or chawki orders.',
                        actionLabel: 'Add Producer',
                        onAction: _openAddProducer,
                        icon: Icons.add_shopping_cart_outlined,
                      )
                    else
                      ...summary.recentOrders.map(
                        (order) => PurchaseOrderTile(
                          order: order,
                          onDelete: () => _deleteOrder(order.id),
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
