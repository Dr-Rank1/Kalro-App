import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/farm_profile.dart';
import '../services/app_repositories.dart';
import '../services/notification_service.dart';
import '../services/permission_service.dart';
import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';
import 'batch_detail_screen.dart';
import 'batches_screen.dart';
import 'feeding_screen.dart';
import 'health_screen.dart';
import 'rearing_hub_screen.dart';
import 'farmer_profile_screen.dart';
import 'lifecycle_planner_screen.dart';
import 'farm_work_screen.dart';
import 'create_batch_screen.dart';
import 'package:kalro/l10n/translator.dart';

/// Main farmer navigation: Today, Batches, Plan, Farm, You.
class FarmerShell extends StatefulWidget {
  FarmerShell({
    super.key,
    required this.repositories,
    required this.userPreferences,
    required this.session,
    this.notificationService,
    this.onLogout,
    required this.onLanguageChanged,
  });

  final AppRepositories repositories;
  final UserPreferences userPreferences;
  final UserSession session;
  final NotificationService? notificationService;
  final VoidCallback? onLogout;
  final void Function(String) onLanguageChanged;

  @override
  State<FarmerShell> createState() => _FarmerShellState();
}

class _FarmerShellState extends State<FarmerShell> {
  var _index = 0;
  var _reloadCount = 0;
  static const _permissions = PermissionService();

  @override
  void initState() {
    super.initState();
    widget.notificationService?.requestPermission();
  }

  void _reloadAll() => setState(() => _reloadCount++);

  bool get _canEdit => _permissions.canEditData(widget.session.user);

  void _goTo(int index) => setState(() => _index = index);

  void _showQuickAddMenu() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: KalroColors.divider,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Quick add'.tr,
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Or use the Farm tab for the full feeding, health, and harvest pages.'
                        .tr,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      color: KalroColors.textMuted,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                _QuickAddTile(
                  icon: Icons.add_circle_outline,
                  color: KalroColors.headerGreen,
                  title: 'Start new batch'.tr,
                  subtitle: 'Eggs in — calendar starts'.tr,
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => CreateBatchScreen(
                          repository: widget.repositories.batches,
                          producers: widget.repositories.producers,
                        ),
                      ),
                    ).then((_) => _reloadAll());
                  },
                ),
                _QuickAddTile(
                  icon: Icons.eco_outlined,
                  color: KalroColors.leaf,
                  title: 'Log feeding'.tr,
                  subtitle: 'Opens the Feeding page'.tr,
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => FeedingScreen(
                          repositories: widget.repositories,
                          canEdit: _canEdit,
                        ),
                      ),
                    ).then((_) => _reloadAll());
                  },
                ),
                _QuickAddTile(
                  icon: Icons.healing_outlined,
                  color: KalroColors.rest,
                  title: 'Record health & mortality'.tr,
                  subtitle: 'Opens the Health page'.tr,
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => HealthScreen(
                          repositories: widget.repositories,
                          canEdit: _canEdit,
                        ),
                      ),
                    ).then((_) => _reloadAll());
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final screens = [
      RearingHubScreen(
        repositories: widget.repositories,
        userPreferences: widget.userPreferences,
        onBatchChanged: _reloadAll,
        canEdit: _canEdit,
        reloadCounter: _reloadCount,
        onOpenPlan: () => _goTo(2),
        onOpenFarm: () => _goTo(3),
        onOpenBatches: () => _goTo(1),
      ),
      BatchesScreen(
        repositories: widget.repositories,
        onBatchChanged: _reloadAll,
        canEdit: _canEdit,
        reloadCounter: _reloadCount,
      ),
      LifecyclePlannerScreen(
        repositories: widget.repositories,
        canEdit: _canEdit,
        asTab: true,
      ),
      FarmWorkScreen(
        repositories: widget.repositories,
        userPreferences: widget.userPreferences,
        canEdit: _canEdit,
        onChanged: _reloadAll,
        reloadCounter: _reloadCount,
      ),
      FarmerProfileScreen(
        repositories: widget.repositories,
        userPreferences: widget.userPreferences,
        session: widget.session,
        notificationService: widget.notificationService,
        onLogout: widget.onLogout,
        onLanguageChanged: widget.onLanguageChanged,
      ),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: screens),
      floatingActionButton: _canEdit && (_index == 0 || _index == 1)
          ? FloatingActionButton(
              onPressed: _showQuickAddMenu,
              backgroundColor: KalroColors.buttonGreen,
              child: const Icon(Icons.add, color: Colors.white),
            )
          : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _goTo,
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.wb_sunny_outlined),
            selectedIcon: const Icon(Icons.wb_sunny_rounded),
            label: l10n?.navHome ?? 'Today'.tr,
          ),
          NavigationDestination(
            icon: const Icon(Icons.layers_outlined),
            selectedIcon: const Icon(Icons.layers_rounded),
            label: l10n?.navBatches ?? 'Batches'.tr,
          ),
          NavigationDestination(
            icon: const Icon(Icons.auto_graph_outlined),
            selectedIcon: const Icon(Icons.auto_graph),
            label: l10n?.navPlan ?? 'Plan'.tr,
          ),
          NavigationDestination(
            icon: const Icon(Icons.agriculture_outlined),
            selectedIcon: const Icon(Icons.agriculture),
            label: l10n?.navFarm ?? 'Farm'.tr,
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline),
            selectedIcon: const Icon(Icons.person_rounded),
            label: l10n?.navProfile ?? 'You'.tr,
          ),
        ],
      ),
    );
  }
}

class _QuickAddTile extends StatelessWidget {
  const _QuickAddTile({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: KalroColors.background,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(icon, color: color),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                      ),
                      Text(
                        subtitle,
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: KalroColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: KalroColors.textLight),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class BatchRoutes {
  static Future<void> openDetail(
    BuildContext context,
    AppRepositories repositories,
    String batchId,
  ) {
    return Navigator.of(
      context,
    ).pushNamed(BatchDetailScreen.routeName, arguments: batchId);
  }
}
