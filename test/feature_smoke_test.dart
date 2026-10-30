import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/app.dart';
import 'package:kalro/screens/farm_work_screen.dart';
import 'package:kalro/screens/farmer_shell.dart';
import 'package:kalro/screens/feeding_screen.dart';
import 'package:kalro/screens/field_guide_screen.dart';
import 'package:kalro/screens/finance_screen.dart';
import 'package:kalro/screens/harvest_screen.dart';
import 'package:kalro/screens/health_screen.dart';
import 'package:kalro/screens/inventory_screen.dart';
import 'package:kalro/screens/onboarding_screen.dart';
import 'package:kalro/screens/reports_screen.dart';
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
      'user_role': 'crc',
    });
    tempDir = await Directory.systemTemp.createTemp('kalro_smoke');
  });

  tearDown(() async {
    if (tempDir.existsSync()) await tempDir.delete(recursive: true);
  });

  Future<void> flushIo(WidgetTester tester) async {
    await tester.runAsync(() async {
      await Future<void>.delayed(const Duration(milliseconds: 50));
    });
    await tester.pump();
  }

  Future<void> tapNav(WidgetTester tester, String label) async {
    await tester.tap(
      find.descendant(
        of: find.byType(NavigationBar),
        matching: find.text(label),
      ),
    );
    await tester.pump();
    await flushIo(tester);
  }

  Future<void> openFarmTile(
    WidgetTester tester, {
    required String title,
    required Type screen,
    required String loadedText,
  }) async {
    final tile = find.descendant(
      of: find.byType(FarmWorkScreen),
      matching: find.text(title),
    );
    await tester.ensureVisible(tile);
    await tester.pump();
    await tester.tap(tile);
    await tester.pump();
    for (var i = 0; i < 8; i++) {
      await flushIo(tester);
      if (find.byType(screen).evaluate().isNotEmpty &&
          find.text(loadedText).evaluate().isNotEmpty) {
        break;
      }
    }
    expect(find.byType(screen), findsOneWidget);
    expect(find.text(loadedText), findsWidgets);
    await tester.tap(find.byIcon(Icons.arrow_back));
    await tester.pump();
    await flushIo(tester);
    expect(find.byType(screen), findsNothing);
  }

  testWidgets('onboarding, shell tabs, and farm tools open without errors',
      (tester) async {
    SharedPreferences.setMockInitialValues({});
    final repositories = AppRepositories(storageDirectory: tempDir);
    await tester.pumpWidget(
      KalroApp(
        repositories: repositories,
        userPreferences: UserPreferences(),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));
    expect(find.byType(OnboardingScreen), findsOneWidget);
    expect(find.text('Set up your farm profile'), findsOneWidget);
    expect(find.text('Login name'), findsOneWidget);
    expect(find.text('Get started'), findsOneWidget);
  });

  testWidgets('Today Batches Plan Farm You and farm pages load', (tester) async {
    final repositories = AppRepositories(storageDirectory: tempDir);
    await tester.runAsync(() async {
      await repositories.batches.getAll();
    });

    await tester.pumpWidget(
      KalroApp(
        repositories: repositories,
        userPreferences: UserPreferences(),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));
    await flushIo(tester);

    expect(find.byType(FarmerShell), findsOneWidget);

    await tapNav(tester, 'Batches');
    expect(
      find.text('Create cycles and log feeding, health, and harvest.'),
      findsOneWidget,
    );

    await tapNav(tester, 'Plan');
    expect(
      find.text('Hatch, moult rest days, harvest window, moths.'),
      findsOneWidget,
    );

    await tapNav(tester, 'Farm');
    expect(
      find.text('Log work, leaf, money, and the field guide.'),
      findsOneWidget,
    );

    await openFarmTile(
      tester,
      title: 'Feeding',
      screen: FeedingScreen,
      loadedText: 'Log daily feed type and quantity per batch.',
    );
    await openFarmTile(
      tester,
      title: 'Health & mortality',
      screen: HealthScreen,
      loadedText: 'Record losses, disease photos, and house conditions.',
    );
    await openFarmTile(
      tester,
      title: 'Cocoon harvest',
      screen: HarvestScreen,
      loadedText: 'Record harvest weight, count, and shell samples.',
    );
    await openFarmTile(
      tester,
      title: 'Leaf & stock',
      screen: InventoryScreen,
      loadedText: 'Bombyx Stock',
    );
    await openFarmTile(
      tester,
      title: 'Field guide',
      screen: FieldGuideScreen,
      loadedText: 'From KALRO predictive rearing sheets',
    );
    await openFarmTile(
      tester,
      title: 'Finance',
      screen: FinanceScreen,
      loadedText: 'Payments, receivables, and seed purchases.',
    );
    await openFarmTile(
      tester,
      title: 'Reports',
      screen: ReportsScreen,
      loadedText: 'Active Batches',
    );

    await tapNav(tester, 'You');
    var loaded = false;
    for (var i = 0; i < 12; i++) {
      await flushIo(tester);
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
    expect(find.text('Farmer'), findsWidgets);
  });
}
