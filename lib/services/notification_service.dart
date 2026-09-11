import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

import 'app_repositories.dart';
import 'lifecycle_engine.dart';
import 'reminder_preferences.dart';

/// Schedules local notifications on mobile; on desktop the app relies on in-app alerts.
class NotificationService {
  NotificationService({
    FlutterLocalNotificationsPlugin? plugin,
    ReminderPreferences? preferences,
    LifecycleEngine? lifecycleEngine,
  })  : _plugin = plugin ?? FlutterLocalNotificationsPlugin(),
        _preferences = preferences ?? ReminderPreferences(),
        _lifecycleEngine = lifecycleEngine ?? const LifecycleEngine();

  final FlutterLocalNotificationsPlugin _plugin;
  final ReminderPreferences _preferences;
  final LifecycleEngine _lifecycleEngine;

  static const _dailyFeedId = 1001;
  static const _milestoneBaseId = 2000;

  bool _initialized = false;
  bool _available = false;

  bool get isAvailable => _available;

  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;

    if (!_supportsNativeNotifications) {
      _available = false;
      return;
    }

    try {
      tz_data.initializeTimeZones();
      const android = AndroidInitializationSettings('@mipmap/ic_launcher');
      const ios = DarwinInitializationSettings();
      const settings = InitializationSettings(android: android, iOS: ios);

      final ok = await _plugin.initialize(settings);
      _available = ok ?? false;
    } catch (_) {
      _available = false;
    }
  }

  bool get _supportsNativeNotifications {
    if (kIsWeb) return false;
    return Platform.isAndroid || Platform.isIOS;
  }

  Future<void> syncReminders(AppRepositories repositories) async {
    await initialize();
    final settings = await _preferences.getSettings();
    if (!settings.enabled) {
      await _cancelAll();
      return;
    }

    if (!_available) return;

    await _scheduleDailyFeeding(settings);

    if (settings.milestoneReminders) {
      await _scheduleMilestoneReminders(repositories);
    } else {
      for (var id = _milestoneBaseId; id < _milestoneBaseId + 50; id++) {
        await _plugin.cancel(id);
      }
    }
  }

  Future<void> _scheduleDailyFeeding(ReminderSettings settings) async {
    final scheduled = _nextInstanceOfTime(settings.dailyFeedingHour, settings.dailyFeedingMinute);

    await _plugin.zonedSchedule(
      _dailyFeedId,
      'Daily feeding check',
      'Log feed and mortality for your active batches.',
      scheduled,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'kalro_daily',
          'Daily reminders',
          channelDescription: 'Daily sericulture task reminders',
        ),
        iOS: DarwinNotificationDetails(),
      ),
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      matchDateTimeComponents: DateTimeComponents.time,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
    );
  }

  Future<void> _scheduleMilestoneReminders(AppRepositories repositories) async {
    for (var id = _milestoneBaseId; id < _milestoneBaseId + 50; id++) {
      await _plugin.cancel(id);
    }

    final batches = await repositories.batches.getAll();
    var notificationId = _milestoneBaseId;
    for (final batch in batches) {
      if (batch.status.name == 'closed') continue;
      final observations =
          await repositories.milestoneObservations.stageDatesForBatch(batch.id);
      final next = _lifecycleEngine.nextMilestone(
        batch,
        observedStageDates: observations,
      );
      if (next == null) continue;

      final when = tz.TZDateTime.from(
        DateTime(
          next.effectiveDate.year,
          next.effectiveDate.month,
          next.effectiveDate.day,
          7,
        ),
        tz.local,
      );
      if (when.isBefore(tz.TZDateTime.now(tz.local))) continue;

      await _plugin.zonedSchedule(
        notificationId++,
        '${next.label} — ${batch.species.label}',
        'Milestone expected today. Open Kalro to update your batch.',
        when,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'kalro_milestones',
            'Milestone reminders',
            channelDescription: 'Lifecycle milestone reminders',
          ),
          iOS: DarwinNotificationDetails(),
        ),
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
      );

      if (notificationId >= _milestoneBaseId + 50) break;
    }
  }

  Future<void> _cancelAll() async {
    if (!_available) return;
    await _plugin.cancel(_dailyFeedId);
    for (var id = _milestoneBaseId; id < _milestoneBaseId + 50; id++) {
      await _plugin.cancel(id);
    }
  }

  tz.TZDateTime _nextInstanceOfTime(int hour, int minute) {
    final now = tz.TZDateTime.now(tz.local);
    var scheduled = tz.TZDateTime(tz.local, now.year, now.month, now.day, hour, minute);
    if (scheduled.isBefore(now)) {
      scheduled = scheduled.add(const Duration(days: 1));
    }
    return scheduled;
  }
}
