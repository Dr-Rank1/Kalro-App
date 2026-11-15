import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'app.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  GoogleFonts.config.allowRuntimeFetching = false;
  await initializeDateFormatting('sw');
  await initializeDateFormatting('en');
  final notifications = NotificationService();
  await notifications.initialize();
  runApp(
    ProviderScope(
      child: KalroApp(notificationService: notifications),
    ),
  );
}
