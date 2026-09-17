import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

import 'app_repositories.dart';
import 'lifecycle_engine.dart';
import 'rearing_conditions_service.dart';
import 'rearing_day_service.dart';
import 'reminder_preferences.dart';
import '../l10n/translator.dart';

/// Schedules local notifications on mobile; on desktop the app relies on in-app alerts.
class NotificationService {
  NotificationService({
    FlutterLocalNotificationsPlugin? plugin,
    ReminderPreferences? preferences,
    LifecycleEngine? lifecycleEngine,
    RearingDayService? rearingDayService,
    RearingConditionsService? conditionsService,
  }) : _plugin = plugin ?? FlutterLocalNotificationsPlugin(),
       _preferences = preferences ?? ReminderPreferences(),
       _lifecycleEngine = lifecycleEngine ?? const LifecycleEngine(),
       _rearingDay = rearingDayService ?? const RearingDayService(),
       _conditions = conditionsService ?? const RearingConditionsService();

  final FlutterLocalNotificationsPlugin _plugin;
  final ReminderPreferences _preferences;
  final LifecycleEngine _lifecycleEngine;
  final RearingDayService _rearingDay;
  final RearingConditionsService _conditions;

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
      const ios = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );
      const settings = InitializationSettings(android: android, iOS: ios);

      final ok = await _plugin.initialize(settings);
      _available = ok ?? false;
      if (_available) {
        await requestPermission();
      }
    } catch (_) {
      _available = false;
    }
  }

  bool get _supportsNativeNotifications {
    if (kIsWeb) return false;
    return Platform.isAndroid || Platform.isIOS;
  }

  Future<bool> requestPermission() async {
    if (!_supportsNativeNotifications) return false;
    await initialize();
    try {
      if (Platform.isAndroid) {
        final android = _plugin
            .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin
            >();
        return await android?.requestNotificationsPermission() ?? false;
      }
      if (Platform.isIOS) {
        final ios = _plugin
            .resolvePlatformSpecificImplementation<
              IOSFlutterLocalNotificationsPlugin
            >();
        return await ios?.requestPermissions(
              alert: true,
              badge: true,
              sound: true,
            ) ??
            false;
      }
    } catch (_) {}
    return false;
  }

  Future<void> syncReminders(AppRepositories repositories) async {
    await initialize();
    final settings = await _preferences.getSettings();
    if (!settings.enabled) {
      await _cancelAll();
      return;
    }

    if (!_available) return;

    await _scheduleDailyFromCalendar(repositories, settings);

    if (settings.milestoneReminders) {
      await _scheduleMilestoneReminders(repositories);
    } else {
      for (var id = _milestoneBaseId; id < _milestoneBaseId + 50; id++) {
        await _plugin.cancel(id);
      }
    }
  }

  Future<void> _scheduleDailyFromCalendar(
    AppRepositories repositories,
    ReminderSettings settings,
  ) async {
    final copy = await dailyCopy(repositories);
    final scheduled = _nextInstanceOfTime(
      settings.dailyFeedingHour,
      settings.dailyFeedingMinute,
    );

    await _plugin.zonedSchedule(
      _dailyFeedId,
      copy.$1,
      copy.$2,
      scheduled,
      NotificationDetails(
        android: AndroidNotificationDetails(
          'kalro_daily',
          'Daily reminders'.tr,
          channelDescription: 'Daily sericulture task reminders'.tr,
        ),
        iOS: DarwinNotificationDetails(),
      ),
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      matchDateTimeComponents: DateTimeComponents.time,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
    );
  }

  Future<(String, String)> dailyCopy(AppRepositories repositories) async {
    final batches = await repositories.batches.getAll();
    final feedLogs = await repositories.feedLogs.getAll();
    final environmentLogs = await repositories.environmentLogs.getAll();
    final mortalityLogs = await repositories.mortalityLogs.getAll();

    for (final batch in batches) {
      if (batch.status.name == 'closed') continue;
      final observations = await repositories.milestoneObservations
          .stageDatesForBatch(batch.id);
      final deaths = mortalityLogs
          .where((log) => log.batchId == batch.id)
          .fold<int>(0, (sum, log) => sum + log.count);
      final live = (batch.eggCount - deaths).clamp(0, batch.eggCount);
      final plan = _rearingDay.planFor(
        batch,
        observedStageDates: observations,
        conditions: _conditions.fromLogs(
          batch: batch,
          environmentLogs: environmentLogs,
          feedLogs: feedLogs,
        ),
        liveCount: live,
      );
      if (plan == null) continue;
      return (
        '${plan.reminderTitle} — ${batch.species.label}',
        plan.reminderBody,
      );
    }
    return (
      'Daily rearing check'.tr,
      'Open Kalro to log feed, house, and deaths.'.tr,
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
      final observations = await repositories.milestoneObservations
          .stageDatesForBatch(batch.id);
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
        '${next.label.tr} — ${batch.species.label}',
        'Expected today. Open Kalro to mark it if you see it.'.tr,
        when,
        NotificationDetails(
          android: AndroidNotificationDetails(
            'kalro_milestones',
            'Milestone reminders'.tr,
            channelDescription: 'Lifecycle milestone reminders'.tr,
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
    var scheduled = tz.TZDateTime(
      tz.local,
      now.year,
      now.month,
      now.day,
      hour,
      minute,
    );
    if (scheduled.isBefore(now)) {
      scheduled = scheduled.add(const Duration(days: 1));
    }
    return scheduled;
  }
}
