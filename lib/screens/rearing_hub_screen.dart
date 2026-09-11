import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../components/dashboard/farm_kpi_cards.dart';
import '../components/dashboard/batch_grid_card.dart';
import '../models/dashboard_summary.dart';
import '../services/app_repositories.dart';
import '../services/dashboard_service.dart';
import '../services/lifecycle_engine.dart';

import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';
import 'batch_detail_screen.dart';



/// Primary home screen — the eight core sericulture capabilities.
class RearingHubScreen extends StatefulWidget {
  RearingHubScreen({
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
  State<RearingHubScreen> createState() => _RearingHubScreenState();
}

class _RearingHubScreenState extends State<RearingHubScreen> {
  final _lifecycleEngine = LifecycleEngine();
  final _dashboardService = DashboardService();
  late Future<DashboardSummary> _summaryFuture;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _summaryFuture = _dashboardService.load(
        repositories: widget.repositories,
        userPreferences: widget.userPreferences,
      );
    });
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
    return AsyncContent(
      future: _summaryFuture,
      builder: (context, summary) {
        final active = summary.activeBatches;

        return Scaffold(
          backgroundColor: Colors.transparent,
          body: KalroBackground(
            child: SafeArea(
              child: RefreshIndicator(
                onRefresh: () async => _reload(),
                child: ListView(
                  padding: EdgeInsets.only(top: 16, bottom: 88),
                  children: [
                    Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: KalroWelcomeHeader(displayName: summary.displayName)),
                    SizedBox(height: 8),
                    Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Text(
                      'Kalro Sericulture — plan, track, and improve every rearing cycle.',
                      style: GoogleFonts.poppins(fontSize: 13, color: KalroColors.textMuted),
                    )),
                    SizedBox(height: 16),
                    FarmKpiCards(summary: summary),
                    if (summary.alerts.isNotEmpty) ...[
                      SizedBox(height: 24),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          l10n?.dashboardNeedsAttention ?? 'Needs Attention',
                          style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                      ),
                      SizedBox(height: 8),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: DashboardAlertsBanner(
                          alerts: summary.alerts.take(3).toList(),
                          onAlertTap: (alert) {
                            if (alert.batchId != null) _openBatch(alert.batchId!);
                          },
                        ),
                      ),
                    ],
                    if (active.isNotEmpty) ...[
                      SizedBox(height: 24),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: KalroSectionHeader(
                          title: l10n?.dashboardActiveBatches ?? 'Active batches',
                          subtitle: l10n?.dashboardActiveBatchesSub(active.length) ?? '${active.length} in progress',
                        ),
                      ),
                      SizedBox(height: 10),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: GridView.builder(
                          shrinkWrap: true,
                          physics: NeverScrollableScrollPhysics(),
                          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: 0.85,
                          ),
                          itemCount: active.length,
                          itemBuilder: (context, index) {
                            final batch = active[index];
                            return BatchGridCard(
                              batch: batch,
                              engine: _lifecycleEngine,
                              observations: summary.observationsByBatch[batch.id],
                              onTap: () => _openBatch(batch.id),
                            );
                          },
                        ),
                      ),
                    ] else ...[
                      SizedBox(height: 32),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: Container(
                          padding: EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: KalroColors.primaryGreen.withValues(alpha: 0.05),
                                blurRadius: 10,
                                offset: Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              Container(
                                padding: EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: KalroColors.primaryGreen.withValues(alpha: 0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.eco_outlined,
                                  size: 48,
                                  color: KalroColors.primaryGreen,
                                ),
                              ),
                              SizedBox(height: 16),
                              Text(
                                l10n?.dashboardStartFirstBatch ?? 'Start Your First Batch',
                                style: GoogleFonts.poppins(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                  color: KalroColors.textDark,
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                l10n?.dashboardStartFirstBatchDesc ?? 'No rearing cycles in progress. Tap the + button below to create a new batch and start tracking feeding, health, and harvests.',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  color: KalroColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
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
