import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../services/app_repositories.dart';
import '../services/notification_service.dart';
import '../services/reminder_preferences.dart';
import '../theme/kalro_colors.dart';
import 'package:kalro/l10n/translator.dart';

class ReminderSettingsScreen extends StatefulWidget {
  ReminderSettingsScreen({
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
      title: 'Reminders'.tr,
      body: AsyncContent(
        future: _settingsFuture,
        builder: (context, settings) {
          return ListView(
            padding: EdgeInsets.all(20),
            children: [
              AdminSectionHeader(
                title: 'Notification schedule'.tr,
                subtitle: 'Stay on top of feeding and lifecycle milestones.'.tr,
              ),
              SizedBox(height: 16),
              AdminInfoCard(
                child: Column(
                  children: [
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text('Enable reminders'.tr),
                      value: settings.enabled,
                      onChanged: (value) async {
                        if (value) await _notifications.requestPermission();
                        await _save(settings.copyWith(enabled: value));
                      },
                    ),
                    Divider(height: 1),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text('Daily rearing reminder'.tr),
                      subtitle: Text(
                        '${_formatTime(settings)} · ${'today’s feed, rest, or harvest'.tr}',
                      ),
                      trailing: Icon(Icons.schedule),
                      enabled: settings.enabled,
                      onTap: settings.enabled
                          ? () => _pickTime(settings)
                          : null,
                    ),
                    Divider(height: 1),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text('Milestone reminders'.tr),
                      subtitle: Text('Hatch, moult, and harvest dates'.tr),
                      value: settings.milestoneReminders,
                      onChanged: settings.enabled
                          ? (value) => _save(
                              settings.copyWith(milestoneReminders: value),
                            )
                          : null,
                    ),
                  ],
                ),
              ),
              if (!_notifications.isAvailable) ...[
                SizedBox(height: 16),
                AdminInfoCard(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.smartphone_outlined,
                        color: KalroColors.headerGreen,
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Push notifications work on Android and iOS. On this device, use Home tab alerts instead.'
                              .tr,
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: KalroColors.textMuted,
                          ),
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
