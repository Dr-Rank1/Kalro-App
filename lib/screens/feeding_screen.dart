import 'package:flutter/material.dart';

import '../components/components.dart';
import '../models/batch.dart';
import '../models/batch_status.dart';
import '../services/app_repositories.dart';
import '../services/floor_log_service.dart';
import '../services/rearing_day_service.dart';
import '../theme/kalro_colors.dart';
import 'package:kalro/l10n/translator.dart';

class FeedingScreen extends StatefulWidget {
  const FeedingScreen({super.key, required this.repositories, required this.canEdit});

  final AppRepositories repositories;
  final bool canEdit;

  @override
  State<FeedingScreen> createState() => _FeedingScreenState();
}

class _FeedingScreenState extends State<FeedingScreen> {
  late Future<List<Batch>> _batchesFuture;
  Batch? _selectedBatch;
  static const _rearingDay = RearingDayService();

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _batchesFuture = widget.repositories.batches.getAll().then((all) {
        final active = all
            .where((b) => b.status != BatchStatus.closed)
            .toList();
        if (_selectedBatch != null) {
          final matching = active
              .where((b) => b.id == _selectedBatch!.id)
              .firstOrNull;
          _selectedBatch = matching ?? (active.isNotEmpty ? active.first : null);
        } else if (active.isNotEmpty) {
          _selectedBatch = active.first;
        }
        return active;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: KalroBackground(
        child: SafeArea(
          child: FutureBuilder<List<Batch>>(
            future: _batchesFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting && !snapshot.hasData) {
                return const Center(child: CircularProgressIndicator());
              }

              final activeBatches = snapshot.data ?? [];

              return ListView(
                padding: EdgeInsets.all(20),
                children: [
                  KalroToolbar(
                    title: 'Feeding'.tr,
                    subtitle: 'Log daily feed type and quantity per batch.'.tr,
                  ),
                  SizedBox(height: 24),
                  if (activeBatches.isEmpty)
                    RecordEmptyState(
                      icon: Icons.layers_outlined,
                      title: 'No active batches'.tr,
                      message: 'Start a rearing cycle to log feeding.'.tr,
                    )
                  else ...[
                    InputDecorator(
                      decoration: InputDecoration(labelText: 'Select Batch'.tr),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<Batch>(
                          value: _selectedBatch,
                          isExpanded: true,

                          items: activeBatches.map((b) {
                            return DropdownMenuItem(
                              value: b,
                              child: Text(
                                '${b.species.label} - ${b.eggCount} larvae'.tr,
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            setState(() => _selectedBatch = val);
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (_selectedBatch != null)
                      Builder(
                        builder: (context) {
                          final batch = _selectedBatch!;
                          final plan = _rearingDay.planFor(batch);
                          final isRest = plan != null && (plan.stopFeeding || plan.suggestedGrams <= 0);

                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              if (plan != null)
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  margin: const EdgeInsets.only(bottom: 16),
                                  decoration: BoxDecoration(
                                    color: isRest
                                        ? KalroColors.peach.withValues(alpha: 0.6)
                                        : KalroColors.headerGreen.withValues(alpha: 0.08),
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(
                                      color: isRest
                                          ? KalroColors.harvest.withValues(alpha: 0.3)
                                          : KalroColors.headerGreen.withValues(alpha: 0.2),
                                    ),
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Icon(
                                        isRest
                                            ? Icons.pause_circle_outline
                                            : Icons.eco_outlined,
                                        color: isRest
                                            ? KalroColors.harvest
                                            : KalroColors.headerGreen,
                                        size: 22,
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              '${plan.stage.label} · ${plan.actionTitle}'.tr,
                                              style: TextStyle(
                                                fontWeight: FontWeight.w700,
                                                fontSize: 13,
                                                color: isRest
                                                    ? KalroColors.textDark
                                                    : KalroColors.headerGreen,
                                              ),
                                            ),
                                            const SizedBox(height: 3),
                                            Text(
                                              plan.feedLabel,
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: KalroColors.textMuted,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              FeedLogSection(
                                batchId: batch.id,
                                repository: widget.repositories.feedLogs,
                                farmRepositories: widget.repositories,
                                species: batch.species,
                                defaultFeedType: FloorLogService.defaultFeedType(batch),
                                feedHint: plan?.feedLabel,
                                suggestedGrams: plan?.suggestedGrams,
                              ),
                            ],
                          );
                        },
                      ),
                  ],
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
