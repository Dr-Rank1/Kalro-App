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

/// Daily logs and farm tools with live numbers on each row.
class FarmWorkScreen extends StatefulWidget {
  FarmWorkScreen({
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

  String _feedValue(FarmWorkStats stats) {
    final logged = stats.feedTodayGrams >= 1000
        ? '${(stats.feedTodayGrams / 1000).toStringAsFixed(1)} kg'
        : '${stats.feedTodayGrams.round()} g';
    if (stats.suggestedTodayGrams <= 0) return logged;
    final suggested = stats.suggestedTodayGrams >= 1000
        ? '${(stats.suggestedTodayGrams / 1000).toStringAsFixed(1)} kg'
        : '${stats.suggestedTodayGrams.round()} g';
    return '$logged / $suggested';
  }

  String _leafValue(FarmWorkStats stats) {
    if (stats.leafNeedTodayKg <= 0) {
      return Translator.fill('{kg} kg stock', {
        'kg': stats.leafStockKg.toStringAsFixed(1),
      });
    }
    final days = LeafLedgerService.daysOfCover(
      stockKg: stats.leafStockKg,
      dailyNeedKg: stats.leafNeedTodayKg,
    );
    return Translator.fill('{n} days cover', {
      'n': days >= 99 ? '—' : days.toStringAsFixed(1),
    });
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
                  Text(
                    'Daily records'.tr,
                    style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  _WorkTile(
                    icon: Icons.eco_outlined,
                    color: KalroColors.leaf,
                    title: 'Feeding'.tr,
                    subtitle: 'Logged vs suggested today'.tr,
                    value: stats == null ? '…' : _feedValue(stats),
                    onTap: () => _open(
                      FeedingScreen(
                        repositories: widget.repositories,
                        canEdit: widget.canEdit,
                      ),
                    ),
                  ),
                  _WorkTile(
                    icon: Icons.healing_outlined,
                    color: KalroColors.rest,
                    title: 'Health & mortality'.tr,
                    subtitle: 'Deaths logged today'.tr,
                    value: stats == null
                        ? '…'
                        : Translator.fill('{n}', {'n': '${stats.deathsToday}'}),
                    onTap: () => _open(
                      HealthScreen(
                        repositories: widget.repositories,
                        canEdit: widget.canEdit,
                      ),
                    ),
                  ),
                  _WorkTile(
                    icon: Icons.inventory_2_outlined,
                    color: KalroColors.harvest,
                    title: 'Cocoon harvest'.tr,
                    subtitle: stats?.harvestWindowOpen == true
                        ? 'Harvest window open'.tr
                        : 'Last recorded weight'.tr,
                    value: stats == null
                        ? '…'
                        : stats.harvestWindowOpen
                            ? 'Open'.tr
                            : '${stats.lastHarvestKg.toStringAsFixed(2)} kg',
                    onTap: () => _open(
                      HarvestScreen(
                        repositories: widget.repositories,
                        canEdit: widget.canEdit,
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    'Leaf, money & guides'.tr,
                    style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  _WorkTile(
                    icon: Icons.grass_outlined,
                    color: KalroColors.leaf,
                    title: 'Leaf & stock'.tr,
                    subtitle: 'Days of cover at today’s larvae'.tr,
                    value: stats == null ? '…' : _leafValue(stats),
                    onTap: () => _open(
                      InventoryScreen(
                        repositories: widget.repositories,
                        onBatchChanged: widget.onChanged,
                        canCreateBatch: widget.canEdit,
                      ),
                    ),
                  ),
                  _WorkTile(
                    icon: Icons.menu_book_outlined,
                    color: KalroColors.headerGreen,
                    title: 'Field guide'.tr,
                    subtitle: 'KALRO hatch, moult rest, spinning signs'.tr,
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
                    _WorkTile(
                      icon: Icons.account_balance_wallet_outlined,
                      color: KalroColors.accentBrown,
                      title: 'Finance'.tr,
                      subtitle: 'Payments and farm money'.tr,
                      onTap: () => _open(
                        FinanceScreen(
                          repositories: widget.repositories,
                          userPreferences: widget.userPreferences,
                          readOnly: !widget.canEdit,
                        ),
                      ),
                    ),
                  if (RoleAccess.showReports(_role))
                    _WorkTile(
                      icon: Icons.assessment_outlined,
                      color: KalroColors.info,
                      title: 'Reports'.tr,
                      subtitle: 'Cycle, feed, and harvest summaries'.tr,
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

class _WorkTile extends StatelessWidget {
  const _WorkTile({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.value,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final String? value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14),
                      ),
                      Text(
                        subtitle,
                        style: GoogleFonts.poppins(fontSize: 11, color: KalroColors.textMuted),
                      ),
                    ],
                  ),
                ),
                if (value != null)
                  Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: Text(
                      value!,
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: color,
                      ),
                    ),
                  ),
                const Icon(Icons.chevron_right, color: KalroColors.textLight, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
