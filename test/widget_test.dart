import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/app.dart';
import 'package:kalro/services/app_repositories.dart';
import 'package:kalro/services/user_preferences.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;

  setUp(() async {
    SharedPreferences.setMockInitialValues({'onboarding_complete': true});
    tempDir = await Directory.systemTemp.createTemp('kalro_widget_test');
  });

  tearDown(() async {
    if (tempDir.existsSync()) {
      await tempDir.delete(recursive: true);
    }
  });

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

    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Finance'), findsOneWidget);
    expect(find.text('Batches'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);
  });
}
