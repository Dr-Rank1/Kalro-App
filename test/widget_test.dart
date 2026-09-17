import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/app.dart';
import 'package:kalro/screens/farmer_shell.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/user_preferences.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;

  setUp(() async {
    SharedPreferences.setMockInitialValues({
      'onboarding_complete': true,
      'walkthrough_complete': true,
    });
    tempDir = await Directory.systemTemp.createTemp('kalro_widget_test');
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

  Future<void> _flushIo(WidgetTester tester) async {
    await tester.runAsync(() async {
      await Future<void>.delayed(const Duration(milliseconds: 50));
    });
    await tester.pump();
  }

  testWidgets('app shows main shell after onboarding', (tester) async {
    final repositories = AppRepositories(storageDirectory: tempDir);

    await tester.runAsync(() async {
      expect(await repositories.batches.getAll(), isEmpty);
    });

    await tester.pumpWidget(
      KalroApp(
        repositories: repositories,
        userPreferences: UserPreferences(),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.byType(FarmerShell), findsOneWidget);
    expect(find.text('Today'), findsWidgets);
    expect(find.text('Batches'), findsWidgets);
    expect(find.text('Plan'), findsWidgets);
    expect(find.text('Farm'), findsWidgets);
    expect(find.text('You'), findsWidgets);
  });

  testWidgets('You tab shows farm account identity', (tester) async {
    final repositories = AppRepositories(storageDirectory: tempDir);

    await tester.pumpWidget(
      KalroApp(
        repositories: repositories,
        userPreferences: UserPreferences(),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));
    await _flushIo(tester);

    await tester.tap(
      find.descendant(
        of: find.byType(NavigationBar),
        matching: find.text('You'),
      ),
    );
    await tester.pump();

    var loaded = false;
    for (var i = 0; i < 12; i++) {
      await _flushIo(tester);
      if (find
          .text('Your farm account, season record, and backup.')
          .evaluate()
          .isNotEmpty) {
        loaded = true;
        break;
      }
    }
    expect(loaded, isTrue);
    expect(find.text('This season'), findsOneWidget);
    expect(find.text('Test Farm'), findsWidgets);
    expect(find.text('No lots yet'), findsOneWidget);
    expect(find.text('Admin'), findsWidgets);
  });
}
