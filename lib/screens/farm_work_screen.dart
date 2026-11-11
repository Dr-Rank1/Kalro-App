import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../services/app_repositories.dart';
import '../services/farm_work_stats.dart';
import '../services/leaf_ledger_service.dart';
import '../services/role_access.dart';
import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';
import 'feeding_screen.dart';
import 'field_guide_screen.dart';
import 'finance_screen.dart';
import 'harvest_screen.dart';
import 'health_screen.dart';
import 'inventory_screen.dart';
import 'reports_screen.dart';

import 'package:kalro/l10n/translator.dart';

/// Agronomy and farm management hub with streamlined tools and live KPIs.
class FarmWorkScreen extends StatefulWidget {
  const FarmWorkScreen({
    super.key,
    required this.repositories,
    required this.userPreferences,
    required this.canEdit,
    required this.onChanged,
    this.reloadCounter = 0,
  });

  final AppRepositories repositories;
  final UserPreferences userPreferences;
  final bool canEdit;
  final VoidCallback onChanged;
  final int reloadCounter;

  @override
  State<FarmWorkScreen> createState() => _FarmWorkScreenState();
}

class _FarmWorkScreenState extends State<FarmWorkScreen> {
  UserRole _role = UserRole.swr;
  late Future<FarmWorkStats> _statsFuture;

  @override
  void initState() {
    super.initState();
    _statsFuture = const FarmWorkStatsService().load(widget.repositories);
    widget.userPreferences.getRole().then((role) {
      if (mounted) setState(() => _role = role);
    });
  }

  @override
  void didUpdateWidget(covariant FarmWorkScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.reloadCounter != widget.reloadCounter) {
      _reload();
    }
  }

  void _reload() {
    setState(() {
      _statsFuture = const FarmWorkStatsService().load(widget.repositories);
    });
  }

  Future<void> _open(Widget screen) async {
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
    widget.onChanged();
    _reload();
  }

  String _leafDaysCover(FarmWorkStats stats) {
    if (stats.leafNeedTodayKg <= 0) {
      return '${stats.leafStockKg.toStringAsFixed(1)} kg';
    }
    final days = LeafLedgerService.daysOfCover(
      stockKg: stats.leafStockKg,
      dailyNeedKg: stats.leafNeedTodayKg,
    );
    return days >= 99 ? 'Ample stock' : '${days.toStringAsFixed(1)} days cover';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: KalroBackground(
        child: SafeArea(
          child: FutureBuilder<FarmWorkStats>(
            future: _statsFuture,
            builder: (context, snapshot) {
              final stats = snapshot.data;
              return ListView(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 100),
                children: [
                  KalroToolbar(
                    title: 'Farm'.tr,
                    subtitle: 'Log work, leaf, money, and the field guide.'.tr,
                  ),
                  const SizedBox(height: 16),

                  // Station Overview KPI Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: KalroColors.divider),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Leaf Inventory'.tr,
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: KalroColors.textMuted,
                                  letterSpacing: 0.3,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                stats == null
                                    ? '…'
                                    : '${stats.leafStockKg.toStringAsFixed(1)} kg',
                                style: GoogleFonts.poppins(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: KalroColors.leaf,
                                ),
                              ),
                              Text(
                                stats == null ? '' : _leafDaysCover(stats),
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  color: KalroColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          width: 1,
                          height: 44,
                          color: KalroColors.divider,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Cocoon Reeling'.tr,
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: KalroColors.textMuted,
                                  letterSpacing: 0.3,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                stats == null
                                    ? '…'
                                    : stats.harvestWindowOpen
                                        ? 'Window Open'.tr
                                        : '${stats.lastHarvestKg.toStringAsFixed(1)} kg',
                                style: GoogleFonts.poppins(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: stats?.harvestWindowOpen == true
                                      ? KalroColors.harvest
                                      : KalroColors.headerGreen,
                                ),
                              ),
                              Text(
                                stats?.harvestWindowOpen == true
                                    ? 'Ready to mount & harvest'.tr
                                    : 'Last harvest weight'.tr,
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  color: KalroColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Daily Operations
                  _SectionHeader(title: 'Daily Operations'.tr),
                  const SizedBox(height: 8),
                  _ModernFarmTile(
                    icon: Icons.eco_outlined,
                    color: KalroColors.leaf,
                    title: 'Feeding'.tr,
                    subtitle: 'Feed logs & ration history'.tr,
                    badge: stats == null || stats.feedTodayGrams <= 0
                        ? null
                        : '${stats.feedTodayGrams.round()} g today',
                    onTap: () => _open(
                      FeedingScreen(
                        repositories: widget.repositories,
                        canEdit: widget.canEdit,
                      ),
                    ),
                  ),
                  _ModernFarmTile(
                    icon: Icons.healing_outlined,
                    color: KalroColors.rest,
                    title: 'Health & mortality'.tr,
                    subtitle: 'Loss logs & rearing room conditions'.tr,
                    badge: stats != null && stats.deathsToday > 0
                        ? '-${stats.deathsToday} today'
                        : null,
                    onTap: () => _open(
                      HealthScreen(
                        repositories: widget.repositories,
                        canEdit: widget.canEdit,
                      ),
                    ),
                  ),
                  _ModernFarmTile(
                    icon: Icons.inventory_2_outlined,
                    color: KalroColors.harvest,
                    title: 'Cocoon harvest'.tr,
                    subtitle: 'Commercial silk grading & yield quality'.tr,
                    badge: stats?.harvestWindowOpen == true ? 'Ready' : null,
                    onTap: () => _open(
                      HarvestScreen(
                        repositories: widget.repositories,
                        canEdit: widget.canEdit,
                      ),
                    ),
                  ),

                  const SizedBox(height: 18),

                  // Forage & Station Management
                  _SectionHeader(title: 'Forage, Guides & Management'.tr),
                  const SizedBox(height: 8),
                  _ModernFarmTile(
                    icon: Icons.grass_outlined,
                    color: KalroColors.leaf,
                    title: 'Leaf & stock'.tr,
                    subtitle: 'Forage inventory & harvest addition'.tr,
                    badge: stats == null ? null : '${stats.leafStockKg.toStringAsFixed(1)} kg',
                    onTap: () => _open(
                      InventoryScreen(
                        repositories: widget.repositories,
                        onBatchChanged: widget.onChanged,
                        canCreateBatch: widget.canEdit,
                      ),
                    ),
                  ),
                  _ModernFarmTile(
                    icon: Icons.menu_book_outlined,
                    color: KalroColors.headerGreen,
                    title: 'Field guide'.tr,
                    subtitle: 'Sericulture disease symptoms & diagnostics'.tr,
                    onTap: () => _open(
                      FieldGuideScreen(
                        species: stats?.guideSpecies,
                        cycleDay: stats?.guideCycleDay,
                        stageKey: stats?.guideStageKey,
                        isMoult: stats?.guideIsMoult ?? false,
                        isLightFeedDay: stats?.guideIsLightFeedDay ?? false,
                        actionTitle: stats?.guideActionTitle,
                      ),
                    ),
                  ),
                  if (RoleAccess.showFinance(_role))
                    _ModernFarmTile(
                      icon: Icons.account_balance_wallet_outlined,
                      color: KalroColors.accentBrown,
                      title: 'Finance'.tr,
                      subtitle: 'Cocoon sales & farm expense ledger'.tr,
                      onTap: () => _open(
                        FinanceScreen(
                          repositories: widget.repositories,
                          userPreferences: widget.userPreferences,
                          readOnly: !widget.canEdit,
                        ),
                      ),
                    ),
                  if (RoleAccess.showReports(_role))
                    _ModernFarmTile(
                      icon: Icons.assessment_outlined,
                      color: KalroColors.info,
                      title: 'Reports'.tr,
                      subtitle: 'Official PDF reports & CSV export'.tr,
                      onTap: () => _open(
                        ReportsScreen(
                          repositories: widget.repositories,
                          userPreferences: widget.userPreferences,
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        title,
        style: GoogleFonts.poppins(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: KalroColors.textDark,
        ),
      ),
    );
  }
}

class _ModernFarmTile extends StatelessWidget {
  const _ModernFarmTile({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.badge,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final String? badge;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: color, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                          color: KalroColors.textDark,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          color: KalroColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                if (badge != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    margin: const EdgeInsets.only(right: 6),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      badge!,
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w600,
                        fontSize: 11,
                        color: color,
                      ),
                    ),
                  ),
                const Icon(
                  Icons.chevron_right,
                  color: KalroColors.textLight,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
