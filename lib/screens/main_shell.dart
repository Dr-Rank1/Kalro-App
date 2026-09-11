import 'package:flutter/material.dart';

import '../models/farm_profile.dart';
import '../services/app_repositories.dart';
import '../services/notification_service.dart';
import '../services/permission_service.dart';
import '../services/user_preferences.dart';
import 'batch_detail_screen.dart';
import 'dashboard_screen.dart';
import 'inventory_screen.dart';
import 'payments_screen.dart';
import 'profile_screen.dart';
import 'purchase_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({
    super.key,
    required this.repositories,
    required this.userPreferences,
    required this.session,
    this.notificationService,
    this.onLogout,
  });

  final AppRepositories repositories;
  final UserPreferences userPreferences;
  final UserSession session;
  final NotificationService? notificationService;
  final VoidCallback? onLogout;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  var _index = 0;
  static const _permissions = PermissionService();
  late UserSession _session;

  @override
  void initState() {
    super.initState();
    _session = widget.session;
    widget.notificationService?.syncReminders(widget.repositories);
  }

  @override
  void didUpdateWidget(MainShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.session != widget.session) {
      _session = widget.session;
    }
  }

  void _reloadAll() => setState(() {});

  void _onFarmUpdated(FarmProfile farm) {
    setState(() {
      _session = UserSession(
        farm: farm,
        user: _session.user,
        farmDirectoryPath: _session.farmDirectoryPath,
      );
    });
  }

  void _navigateToTab(int index) => setState(() => _index = index);

  bool get _canEdit => _permissions.canEditData(_session.user);

  @override
  Widget build(BuildContext context) {
    final screens = [
      DashboardScreen(
        repositories: widget.repositories,
        userPreferences: widget.userPreferences,
        onBatchChanged: _reloadAll,
      ),
      PaymentsScreen(
        repositories: widget.repositories,
        userPreferences: widget.userPreferences,
        readOnly: !_canEdit,
      ),
      PurchaseScreen(
        repositories: widget.repositories,
        userPreferences: widget.userPreferences,
        readOnly: !_canEdit,
      ),
      InventoryScreen(
        repositories: widget.repositories,
        onBatchChanged: _reloadAll,
        canCreateBatch: _canEdit,
      ),
      ProfileScreen(
        repositories: widget.repositories,
        userPreferences: widget.userPreferences,
        session: _session,
        notificationService: widget.notificationService,
        onDataChanged: _reloadAll,
        onFarmUpdated: _onFarmUpdated,
        onLogout: widget.onLogout,
        onNavigateToTab: _navigateToTab,
      ),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (value) => setState(() => _index = value),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.payments_outlined), activeIcon: Icon(Icons.payments), label: 'Payments'),
          BottomNavigationBarItem(icon: Icon(Icons.add_shopping_cart_outlined), activeIcon: Icon(Icons.add_shopping_cart), label: 'Purchase'),
          BottomNavigationBarItem(icon: Icon(Icons.inventory_2_outlined), activeIcon: Icon(Icons.inventory_2), label: 'Inventory'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
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
