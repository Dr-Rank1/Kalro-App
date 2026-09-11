import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../components/components.dart';
import '../models/farm_profile.dart';
import '../services/app_repositories.dart';
import '../services/cloud_sync_service.dart';
import '../services/farmer_summary_service.dart';
import '../services/notification_service.dart';
import '../services/permission_service.dart';
import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';
import 'reminder_settings_screen.dart';
import 'reports_screen.dart';
import 'package:kalro/l10n/translator.dart';

class FarmerHubScreen extends StatefulWidget {
  FarmerHubScreen({
    super.key,
    required this.session,
    required this.repositories,
    required this.userPreferences,
    this.notificationService,
    this.cloudSyncService,
    this.onNavigateToTab,
    this.farmerSummaryService,
  });

  final UserSession session;
  final AppRepositories repositories;
  final UserPreferences userPreferences;
  final NotificationService? notificationService;
  final CloudSyncService? cloudSyncService;
  final ValueChanged<int>? onNavigateToTab;
  final FarmerSummaryService? farmerSummaryService;

  @override
  State<FarmerHubScreen> createState() => _FarmerHubScreenState();
}

class _FarmerHubScreenState extends State<FarmerHubScreen> {
  static const _permissions = PermissionService();
  late final FarmerSummaryService _summaryService;
  late Future<FarmerSummary> _summaryFuture;
  var _syncing = false;

  bool get _canEdit => _permissions.canEditData(widget.session.user);
  bool get _canSync => _permissions.canSyncCloud(widget.session.user);

  @override
  void initState() {
    super.initState();
    _summaryService = widget.farmerSummaryService ?? FarmerSummaryService();
    _reload();
  }

  void _reload() {
    setState(() {
      _summaryFuture = _summaryService.load(
        repositories: widget.repositories,
        userPreferences: widget.userPreferences,
      );
    });
  }

  void _goHome() {
    widget.onNavigateToTab?.call(0);
    Navigator.of(context).pop();
  }

  void _goInventory() {
    widget.onNavigateToTab?.call(3);
    Navigator.of(context).pop();
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
          userPreferences: widget.userPreferences,
        ),
      ),
    );
  }

  Future<void> _uploadWork() async {
    if (!_canSync) return;
    setState(() => _syncing = true);
    try {
      final sync = widget.cloudSyncService ?? CloudSyncService();
      final result = await sync.upload(
        repositories: widget.repositories,
        farm: widget.session.farm,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result.message)));
    } finally {
      if (mounted) setState(() => _syncing = false);
    }
  }

  String _formatFeed(double grams) {
    if (grams >= 1000) return '${(grams / 1000).toStringAsFixed(1)} kg';
    return '${grams.round()} g';
  }

  String _milestoneLabel(FarmerSummary summary) {
    final next = summary.nextMilestone;
    if (next == null) return 'No upcoming milestones';
    final when = DateFormat('MMM d').format(next.milestone.effectiveDate);
    if (next.isToday) return '${next.milestone.label} today';
    if (next.isOverdue) return '${next.milestone.label} overdue';
    return '${next.milestone.label} · $when';
  }

  @override
  Widget build(BuildContext context) {
    final permission = widget.session.user.permission;

    return AdminPageScaffold(
      title: 'My farm work'.tr,
      onRefresh: () async => _reload(),
      body: AsyncContent(
        future: _summaryFuture,
        builder: (context, summary) {
          return ListView(
            padding: EdgeInsets.all(20),
            children: [
              AdminInfoCard(
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 26,
                      backgroundColor: permission.badgeColor.withValues(alpha: 0.15),
                      child: Icon(permission.icon, color: permission.badgeColor),
                    ),
                    SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            summary.displayName,
                            style: GoogleFonts.poppins(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            '${summary.farmRoleLabel} · ${widget.session.farm.orgName}',
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              color: KalroColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    PermissionBadge(permission: permission, compact: true),
                  ],
                ),
              ),
              SizedBox(height: 16),
              AdminSectionHeader(
                title: 'Today on the farm'.tr,
                subtitle: 'Tasks and alerts that need your attention'.tr,
              ),
              SizedBox(height: 12),
              AdminInfoCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        _todayStat('Tasks', summary.todayTaskCount.toString(), Icons.checklist),
                        _todayStat('Alerts', summary.alertCount.toString(), Icons.warning_amber_outlined),
                        _todayStat('Fed today', _formatFeed(summary.feedTodayGrams), Icons.restaurant_outlined),
                      ],
                    ),
                    if (summary.todayTasks.isNotEmpty) ...[
                      Divider(height: 24),
                      ...summary.todayTasks.map(
                        (task) => Padding(
                          padding: EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              Icon(Icons.circle, size: 8, color: KalroColors.primaryGreen),
                              SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  task.title,
                                  style: GoogleFonts.poppins(fontSize: 13),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                    if (summary.alerts.isNotEmpty) ...[
                      Divider(height: 16),
                      ...summary.alerts.map(
                        (alert) => Padding(
                          padding: EdgeInsets.only(bottom: 8),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(Icons.error_outline, size: 16, color: Colors.orange.shade800),
                              SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  alert.message,
                                  style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                    if (summary.todayTasks.isEmpty && summary.alerts.isEmpty)
                      Text(
                        'All clear for now. Check Home for upcoming milestones.',
                        style: GoogleFonts.poppins(fontSize: 13, color: KalroColors.textMuted),
                      ),
                  ],
                ),
              ),
              SizedBox(height: 16),
              Row(
                children: [
                  AdminStatChip(
                    label: 'Active batches'.tr,
                    value: summary.activeBatchCount.toString(),
                    icon: Icons.layers_outlined,
                  ),
                  SizedBox(width: 10),
                  AdminStatChip(
                    label: 'Survival avg'.tr,
                    value: '${summary.averageSurvivalPercent.round()}%',
                    icon: Icons.favorite_outline,
                  ),
                ],
              ),
              SizedBox(height: 10),
              Row(
                children: [
                  AdminStatChip(
                    label: 'Bombyx'.tr,
                    value: '${summary.bombyxLarvaeCount}',
                    icon: Icons.eco_outlined,
                  ),
                  SizedBox(width: 10),
                  AdminStatChip(
                    label: 'Eri'.tr,
                    value: '${summary.eriLarvaeCount}',
                    icon: Icons.grass_outlined,
                  ),
                ],
              ),
              SizedBox(height: 24),
              AdminInfoCard(
                child: Row(
                  children: [
                    Icon(Icons.event_outlined, color: KalroColors.headerGreen),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _milestoneLabel(summary),
                        style: GoogleFonts.poppins(fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 24),
              AdminSectionHeader(
                title: _canEdit ? 'Quick actions' : 'View farm data',
                subtitle: _canEdit
                    ? 'Jump straight to daily rearing tasks'
                    : 'You have read-only access to batches and logs',
              ),
              SizedBox(height: 12),
              AdminHubTile(
                icon: Icons.home_outlined,
                title: 'Today\'s dashboard',
                subtitle: 'Tasks, alerts, and batch overview'.tr,
                onTap: _goHome,
              ),
              SizedBox(height: 10),
              AdminHubTile(
                icon: Icons.inventory_2_outlined,
                title: 'Batches & inventory'.tr,
                subtitle: 'View larvae stock and batch details'.tr,
                onTap: _goInventory,
              ),
              SizedBox(height: 24),
              AdminSectionHeader(
                title: 'Tools'.tr,
                subtitle: 'Reports, reminders, and field support'.tr,
              ),
              SizedBox(height: 12),
              AdminHubTile(
                icon: Icons.show_chart,
                title: 'Reports'.tr,
                subtitle: 'Feed trends, harvest, and batch comparison'.tr,
                onTap: _openReports,
              ),
              SizedBox(height: 10),
              if (_canEdit)
                AdminHubTile(
                  icon: Icons.notifications_outlined,
                  title: 'My reminders'.tr,
                  subtitle: summary.remindersEnabled
                      ? 'Reminders are on'
                      : 'Reminders are off',
                  onTap: _openReminders,
                ),
              if (_canEdit) SizedBox(height: 10),
              if (_canSync)
                AdminHubTile(
                  icon: Icons.cloud_upload_outlined,
                  title: 'Upload my latest data'.tr,
                  subtitle: _syncing ? 'Uploading...' : 'Share today\'s logs with the farm cloud',
                  onTap: _syncing ? null : _uploadWork,
                  enabled: !_syncing,
                ),
              if (_canSync) SizedBox(height: 10),
              AdminHubTile(
                icon: Icons.menu_book_outlined,
                title: 'Field guides'.tr,
                subtitle: 'Rearing tips and tutorials'.tr,
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Field guides coming soon'.tr)),
                  );
                },
              ),
              if (!_canEdit) ...[
                SizedBox(height: 20),
                PermissionDescriptionCard(permission: permission),
              ],
            ],
          );
        },
      ),
    );
  }

  Widget _todayStat(String label, String value, IconData icon) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, size: 20, color: KalroColors.headerGreen),
          SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 16),
          ),
          Text(
            label,
            style: GoogleFonts.poppins(fontSize: 11, color: KalroColors.textMuted),
          ),
        ],
      ),
    );
  }
}
