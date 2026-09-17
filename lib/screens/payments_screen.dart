import 'package:flutter/material.dart';
import '../utils/kalro_formatters.dart';

import '../components/components.dart';
import '../models/payments_summary.dart';
import '../services/app_repositories.dart';
import '../services/payments_service.dart';
import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';
import 'record_payment_screen.dart';
import 'package:kalro/l10n/translator.dart';

class PaymentsScreen extends StatefulWidget {
  PaymentsScreen({
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
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> {
  final _paymentsService = PaymentsService();
  late Future<PaymentsSummary> _summaryFuture;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _summaryFuture = _paymentsService.load(widget.repositories);
    });
  }

  Future<void> _openRecordPayment() async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) =>
            RecordPaymentScreen(repository: widget.repositories.payments),
      ),
    );
    if (created == true) _reload();
  }

  Future<void> _settleRecord(String id) async {
    await widget.repositories.payments.markSettled(id);
    _reload();
  }

  Future<void> _deleteRecord(String id) async {
    await widget.repositories.payments.delete(id);
    _reload();
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
                  onPressed: _openRecordPayment,
                  backgroundColor: KalroColors.buttonGreen,
                  child: Icon(Icons.add),
                ),
          body: KalroBackground(
            child: SafeArea(
              child: RefreshIndicator(
                onRefresh: () async => _reload(),
                child: ListView(
                  padding: EdgeInsets.fromLTRB(20, 20, 20, 24),
                  children: [
                    if (widget.showToolbar) ...[
                      KalroToolbar(
                        title: 'Payments'.tr,
                        subtitle:
                            'Track receivables, payables, and settlement history.'
                                .tr,
                      ),
                      SizedBox(height: 24),
                    ],
                    PaymentSummaryCard(
                      title: 'Total Receivable'.tr,
                      value: currency.format(summary.totalReceivable),
                      icon: Icons.arrow_downward,
                    ),
                    SizedBox(height: 12),
                    PaymentSummaryCard(
                      title: 'Total Payable'.tr,
                      value: currency.format(summary.totalPayable),
                      icon: Icons.arrow_upward,
                    ),
                    SizedBox(height: 12),
                    PaymentSummaryCard(
                      title: 'Pending Settlements'.tr,
                      value: currency.format(summary.pendingSettlements),
                      icon: Icons.schedule,
                    ),
                    SizedBox(height: 24),
                    KalroSectionHeader(title: 'Recent Activity'.tr),
                    SizedBox(height: 12),
                    if (summary.isEmpty)
                      EmptyStateCard(
                        title: 'No payments recorded yet'.tr,
                        message:
                            'Log cocoon sales, seed purchases, and other transactions.'
                                .tr,
                        actionLabel: 'Record Payment'.tr,
                        onAction: widget.readOnly ? () {} : _openRecordPayment,
                        icon: Icons.payments_outlined,
                      )
                    else
                      ...summary.recentRecords.map(
                        (record) => PaymentRecordTile(
                          record: record,
                          onSettle: widget.readOnly || !record.isPending
                              ? null
                              : () => _settleRecord(record.id),
                          onDelete: widget.readOnly
                              ? null
                              : () => _deleteRecord(record.id),
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
