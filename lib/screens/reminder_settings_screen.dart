import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../services/app_repositories.dart';
import '../services/notification_service.dart';
import '../services/reminder_preferences.dart';
import '../theme/kalro_colors.dart';

class ReminderSettingsScreen extends StatefulWidget {
  const ReminderSettingsScreen({
    super.key,
    required this.repositories,
    this.notificationService,
    this.reminderPreferences,
  });

  final AppRepositories repositories;
  final NotificationService? notificationService;
  final ReminderPreferences? reminderPreferences;

  @override
  State<ReminderSettingsScreen> createState() => _ReminderSettingsScreenState();
}

class _ReminderSettingsScreenState extends State<ReminderSettingsScreen> {
  late final NotificationService _notifications;
  late final ReminderPreferences _preferences;
  late Future<ReminderSettings> _settingsFuture;

  @override
  void initState() {
    super.initState();
    _notifications = widget.notificationService ?? NotificationService();
    _preferences = widget.reminderPreferences ?? ReminderPreferences();
    _reload();
  }

  void _reload() {
    setState(() {
      _settingsFuture = _preferences.getSettings();
    });
  }

  Future<void> _save(ReminderSettings settings) async {
    await _preferences.saveSettings(settings);
    await _notifications.syncReminders(widget.repositories);
    _reload();
  }

  Future<void> _pickTime(ReminderSettings settings) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(
        hour: settings.dailyFeedingHour,
        minute: settings.dailyFeedingMinute,
      ),
    );
    if (picked == null) return;
    await _save(
      settings.copyWith(
        dailyFeedingHour: picked.hour,
        dailyFeedingMinute: picked.minute,
      ),
    );
  }

  String _formatTime(ReminderSettings settings) {
    final hour = settings.dailyFeedingHour.toString().padLeft(2, '0');
    final minute = settings.dailyFeedingMinute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  @override
  Widget build(BuildContext context) {
    return AdminPageScaffold(
      title: 'Reminders',
      body: AsyncContent(
        future: _settingsFuture,
        builder: (context, settings) {
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              const AdminSectionHeader(
                title: 'Notification schedule',
                subtitle: 'Stay on top of feeding and lifecycle milestones.',
              ),
              const SizedBox(height: 16),
              AdminInfoCard(
                child: Column(
                  children: [
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Enable reminders'),
                      value: settings.enabled,
                      onChanged: (value) => _save(settings.copyWith(enabled: value)),
                    ),
                    const Divider(height: 1),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Daily feeding reminder'),
                      subtitle: Text(_formatTime(settings)),
                      trailing: const Icon(Icons.schedule),
                      enabled: settings.enabled,
                      onTap: settings.enabled ? () => _pickTime(settings) : null,
                    ),
                    const Divider(height: 1),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Milestone reminders'),
                      subtitle: const Text('Hatch, moult, and harvest dates'),
                      value: settings.milestoneReminders,
                      onChanged: settings.enabled
                          ? (value) => _save(settings.copyWith(milestoneReminders: value))
                          : null,
                    ),
                  ],
                ),
              ),
              if (!_notifications.isAvailable) ...[
                const SizedBox(height: 16),
                AdminInfoCard(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.smartphone_outlined, color: KalroColors.headerGreen),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Push notifications work on Android and iOS. On this device, use Home tab alerts instead.',
                          style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}
