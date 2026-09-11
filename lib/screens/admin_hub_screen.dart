import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../components/components.dart';
import '../models/farm_profile.dart';
import '../services/admin_summary_service.dart';
import '../services/app_repositories.dart';
import '../services/auth_repository.dart';
import '../services/notification_service.dart';
import '../services/permission_service.dart';
import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';
import 'cloud_sync_screen.dart';
import 'data_management_screen.dart';
import 'farm_settings_screen.dart';
import 'reminder_settings_screen.dart';
import 'reports_screen.dart';
import 'user_management_screen.dart';

class AdminHubScreen extends StatefulWidget {
  const AdminHubScreen({
    super.key,
    required this.session,
    required this.repositories,
    this.onDataChanged,
    this.onFarmUpdated,
    this.userPreferences,
    this.authRepository,
    this.adminSummaryService,
    this.notificationService,
    this.embedded = false,
  });

  final UserSession session;
  final AppRepositories repositories;
  final VoidCallback? onDataChanged;
  final ValueChanged<FarmProfile>? onFarmUpdated;
  final UserPreferences? userPreferences;
  final AuthRepository? authRepository;
  final AdminSummaryService? adminSummaryService;
  final NotificationService? notificationService;
  final bool embedded;

  @override
  State<AdminHubScreen> createState() => _AdminHubScreenState();
}

class _AdminHubScreenState extends State<AdminHubScreen> {
  static const _permissions = PermissionService();
  late final AdminSummaryService _summaryService;
  late Future<AdminSummary> _summaryFuture;

  @override
  void initState() {
    super.initState();
    _summaryService = widget.adminSummaryService ?? AdminSummaryService();
    _reload();
  }

  void _reload() {
    setState(() {
      _summaryFuture = _summaryService.load(
        repositories: widget.repositories,
        farmId: widget.session.farm.id,
        farm: widget.session.farm,
      );
    });
  }

  void _openTeam() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => UserManagementScreen(
          session: widget.session,
          authRepository: widget.authRepository,
        ),
      ),
    ).then((_) => _reload());
  }

  void _openFarmSettings() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => FarmSettingsScreen(
          session: widget.session,
          authRepository: widget.authRepository,
          userPreferences: widget.userPreferences,
          onFarmUpdated: widget.onFarmUpdated,
        ),
      ),
    );
  }

  void _openCloudSync() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => CloudSyncScreen(
          session: widget.session,
          repositories: widget.repositories,
          onDataChanged: () {
            widget.onDataChanged?.call();
            _reload();
          },
        ),
      ),
    ).then((_) => _reload());
  }

  void _openBackup() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => DataManagementScreen(
          repositories: widget.repositories,
          session: widget.session,
          onDataChanged: () {
            widget.onDataChanged?.call();
            _reload();
          },
        ),
      ),
    );
  }

  void _openReminders() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ReminderSettingsScreen(
          repositories: widget.repositories,
          notificationService: widget.notificationService,
        ),
      ),
    );
  }

  void _openReports() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ReportsScreen(
          repositories: widget.repositories,
          userPreferences: widget.userPreferences!,
        ),
      ),
    );
  }

  String _formatSyncStatus(AdminSummary summary) {
    final dateFormat = DateFormat('MMM d · HH:mm');
    if (summary.hasRecentUpload && summary.syncSettings.lastUploadedAt != null) {
      return 'Uploaded ${dateFormat.format(summary.syncSettings.lastUploadedAt!)}';
    }
    if (summary.hasRecentDownload && summary.syncSettings.lastDownloadedAt != null) {
      return 'Downloaded ${dateFormat.format(summary.syncSettings.lastDownloadedAt!)}';
    }
    return 'Not synced yet';
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.embedded && !_permissions.canManageUsers(widget.session.user)) {
      return AdminPageScaffold(
        title: 'Farm management',
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.lock_outline, size: 48, color: KalroColors.textMuted),
                const SizedBox(height: 16),
                Text(
                  'Admin access only',
                  style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                Text(
                  'Farm management is for administrators. Use My farm work for daily rearing tasks.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(fontSize: 13, color: KalroColors.textMuted),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (widget.embedded) {
      return KalroBackground(
        child: SafeArea(
          child: RefreshIndicator(
            onRefresh: () async => _reload(),
            child: _buildBody(),
          ),
        ),
      );
    }

    return AdminPageScaffold(
      title: 'Farm management',
      onRefresh: () async => _reload(),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    return AsyncContent(
      future: _summaryFuture,
      builder: (context, summary) {
        return ListView(
          padding: const EdgeInsets.all(20),
          children: _managementSections(summary),
        );
      },
    );
  }

  List<Widget> _managementSections(AdminSummary summary) {
    return [
              const AdminSectionHeader(
                title: 'Operations overview',
                subtitle: 'Farm health, team, and financial activity',
              ),
              const SizedBox(height: 12),
              AdminInfoCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            widget.session.farm.orgName,
                            style: GoogleFonts.poppins(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        PermissionBadge(permission: widget.session.user.permission),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Sync code ${widget.session.farm.syncCode} · ${_formatSyncStatus(summary)}',
                      style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  AdminStatChip(
                    label: 'Team members',
                    value: summary.teamCount.toString(),
                    icon: Icons.people_outline,
                  ),
                  const SizedBox(width: 10),
                  AdminStatChip(
                    label: 'Active batches',
                    value: summary.activeBatchCount.toString(),
                    icon: Icons.layers_outlined,
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  AdminStatChip(
                    label: 'Payments',
                    value: summary.paymentCount.toString(),
                    icon: Icons.payments_outlined,
                  ),
                  const SizedBox(width: 10),
                  AdminStatChip(
                    label: 'Feed logs',
                    value: summary.feedLogCount.toString(),
                    icon: Icons.restaurant_outlined,
                  ),
                ],
              ),
              const SizedBox(height: 24),
              const AdminSectionHeader(
                title: 'Organization',
                subtitle: 'Farm identity and user access',
              ),
              const SizedBox(height: 12),
              AdminHubTile(
                icon: Icons.settings_outlined,
                title: 'Farm settings',
                subtitle: 'Organization name and farm metadata',
                onTap: _openFarmSettings,
              ),
              const SizedBox(height: 10),
              AdminHubTile(
                icon: Icons.people_outline,
                title: 'Team users',
                subtitle: '${summary.teamCount} active ${summary.teamCount == 1 ? 'user' : 'users'}',
                onTap: _openTeam,
              ),
              const SizedBox(height: 24),
              const AdminSectionHeader(
                title: 'Data & systems',
                subtitle: 'Backups, cloud sync, and farm-wide notifications',
              ),
              const SizedBox(height: 12),
              AdminHubTile(
                icon: Icons.cloud_sync_outlined,
                title: 'Cloud sync',
                subtitle: _formatSyncStatus(summary),
                onTap: _openCloudSync,
              ),
              const SizedBox(height: 10),
              AdminHubTile(
                icon: Icons.backup_outlined,
                title: 'Data & backup',
                subtitle: 'Export or restore full farm JSON',
                onTap: _openBackup,
              ),
              const SizedBox(height: 10),
              AdminHubTile(
                icon: Icons.notifications_outlined,
                title: 'Farm reminders',
                subtitle: 'Configure feeding and milestone alerts',
                onTap: _openReminders,
              ),
              const SizedBox(height: 24),
              const AdminSectionHeader(
                title: 'Analytics',
                subtitle: 'Financial and production reports',
              ),
              const SizedBox(height: 12),
              AdminHubTile(
                icon: Icons.show_chart,
                title: 'Reports & exports',
                subtitle: 'Charts, CSV, and PDF for farm records',
                onTap: widget.userPreferences == null ? null : _openReports,
              ),
              const SizedBox(height: 16),
              AdminInfoCard(
                child: Text(
                  'Management tools control users, backups, and farm-wide settings. Field workers use a separate sign-in.',
                  style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                ),
              ),
    ];
  }
}
