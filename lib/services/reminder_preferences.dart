import 'package:shared_preferences/shared_preferences.dart';

class ReminderSettings {
  const ReminderSettings({
    required this.enabled,
    required this.dailyFeedingHour,
    required this.dailyFeedingMinute,
    required this.milestoneReminders,
  });

  final bool enabled;
  final int dailyFeedingHour;
  final int dailyFeedingMinute;
  final bool milestoneReminders;

  ReminderSettings copyWith({
    bool? enabled,
    int? dailyFeedingHour,
    int? dailyFeedingMinute,
    bool? milestoneReminders,
  }) {
    return ReminderSettings(
      enabled: enabled ?? this.enabled,
      dailyFeedingHour: dailyFeedingHour ?? this.dailyFeedingHour,
      dailyFeedingMinute: dailyFeedingMinute ?? this.dailyFeedingMinute,
      milestoneReminders: milestoneReminders ?? this.milestoneReminders,
    );
  }

  static const defaults = ReminderSettings(
    enabled: true,
    dailyFeedingHour: 8,
    dailyFeedingMinute: 0,
    milestoneReminders: true,
  );
}

class ReminderPreferences {
  static const _enabledKey = 'reminders_enabled';
  static const _hourKey = 'reminder_feed_hour';
  static const _minuteKey = 'reminder_feed_minute';
  static const _milestoneKey = 'reminder_milestones';

  Future<ReminderSettings> getSettings() async {
    final prefs = await SharedPreferences.getInstance();
    return ReminderSettings(
      enabled: prefs.getBool(_enabledKey) ?? true,
      dailyFeedingHour: prefs.getInt(_hourKey) ?? 8,
      dailyFeedingMinute: prefs.getInt(_minuteKey) ?? 0,
      milestoneReminders: prefs.getBool(_milestoneKey) ?? true,
    );
  }

  Future<void> saveSettings(ReminderSettings settings) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_enabledKey, settings.enabled);
    await prefs.setInt(_hourKey, settings.dailyFeedingHour);
    await prefs.setInt(_minuteKey, settings.dailyFeedingMinute);
    await prefs.setBool(_milestoneKey, settings.milestoneReminders);
  }
}
