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
import 'harvest_screen.dart';
import 'rearing_hub_screen.dart';
import 'farmer_profile_screen.dart';
import 'finance_screen.dart';
import 'reports_screen.dart';
import 'create_batch_screen.dart';

/// Main app navigation using Hybrid Nav (Bottom Bar + Drawer).
class FarmerShell extends StatefulWidget {
  const FarmerShell({
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
  static const _permissions = PermissionService();

  void _reloadAll() => setState(() {});

  bool get _canEdit => _permissions.canEditData(widget.session.user);

  void _pushScreen(Widget screen) {
    Navigator.pop(context); // Close drawer
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  void _showQuickAddMenu() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Quick Add',
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                ListTile(
                  leading: const Icon(Icons.add_circle_outline, color: KalroColors.primaryGreen),
                  title: const Text('Start New Batch'),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => CreateBatchScreen(
                          repository: widget.repositories.batches,
                        ),
                      ),
                    ).then((_) => _reloadAll());
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.restaurant_outlined, color: KalroColors.primaryGreen),
                  title: const Text('Log Feeding'),
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
                ListTile(
                  leading: const Icon(Icons.healing_outlined, color: KalroColors.primaryGreen),
                  title: const Text('Record Health & Mortality'),
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
      ),
      BatchesScreen(
        repositories: widget.repositories,
        onBatchChanged: _reloadAll,
        canEdit: _canEdit,
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
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(color: KalroColors.primaryGreen),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    'Kalro Sericulture',
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.session.user.displayName,
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.restaurant_outlined),
              title: const Text('Feeding'),
              onTap: () => _pushScreen(FeedingScreen(
                repositories: widget.repositories,
                canEdit: _canEdit,
              )),
            ),
            ListTile(
              leading: const Icon(Icons.healing_outlined),
              title: const Text('Health & Mortality'),
              onTap: () => _pushScreen(HealthScreen(
                repositories: widget.repositories,
                canEdit: _canEdit,
              )),
            ),
            ListTile(
              leading: const Icon(Icons.egg_outlined),
              title: const Text('Cocoon Harvest'),
              onTap: () => _pushScreen(HarvestScreen(
                repositories: widget.repositories,
                canEdit: _canEdit,
              )),
            ),
            ListTile(
              leading: const Icon(Icons.account_balance_wallet_outlined),
              title: const Text('Finance'),
              onTap: () => _pushScreen(FinanceScreen(
                repositories: widget.repositories,
                userPreferences: widget.userPreferences,
                readOnly: !_canEdit,
              )),
            ),
            ListTile(
              leading: const Icon(Icons.assessment_outlined),
              title: const Text('Reports'),
              onTap: () => _pushScreen(ReportsScreen(
                repositories: widget.repositories,
                userPreferences: widget.userPreferences,
              )),
            ),
          ],
        ),
      ),
      body: IndexedStack(index: _index, children: screens),
      floatingActionButton: _canEdit
          ? FloatingActionButton(
              onPressed: _showQuickAddMenu,
              backgroundColor: KalroColors.primaryGreen,
              child: const Icon(Icons.add, color: Colors.white),
            )
          : null,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (idx) => setState(() => _index = idx),
        selectedItemColor: KalroColors.primaryGreen,
        unselectedItemColor: Colors.grey,
        items: [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: l10n?.navHome ?? 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.layers_outlined),
            activeIcon: Icon(Icons.layers),
            label: l10n?.navBatches ?? 'Batches',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: l10n?.navProfile ?? 'Profile',
          ),
        ],
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
    return Navigator.of(context).pushNamed(
      BatchDetailScreen.routeName,
      arguments: batchId,
    );
  }
}
