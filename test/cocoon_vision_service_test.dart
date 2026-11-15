import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/models/batch.dart';
import 'package:kalro/models/batch_status.dart';
import 'package:kalro/models/species.dart';
import 'package:kalro/services/cocoon_analytics_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late CocoonVisionService visionService;
  const analyticsService = CocoonAnalyticsService();

  setUp(() {
    visionService = CocoonVisionService(frameSkipInterval: 5);
  });

  tearDown(() {
    visionService.dispose();
  });

  test('CocoonVisionService initializes and handles fallback mode gracefully', () async {
    await visionService.initialize();
    expect(visionService.isInitialized, isTrue);
    expect(visionService.frameSkipInterval, 5);
  });

  test('simulateStationaryScan produces valid 6-class defect tally and bounding boxes', () {
    final tally = visionService.simulateStationaryScan(sampleSize: 30);

    expect(tally.totalDetected, 30);
    expect(tally.detections.length, 30);
    expect(tally.totalDefects, greaterThanOrEqualTo(0));
    expect(tally.cleanCount, greaterThanOrEqualTo(0));
    expect(tally.totalDetected, tally.cleanCount + tally.totalDefects);

    // Verify normalized bounding boxes are strictly within 0.0 - 1.0 coordinates
    for (final detection in tally.detections) {
      expect(detection.boundingBox.left, greaterThanOrEqualTo(0.0));
      expect(detection.boundingBox.top, greaterThanOrEqualTo(0.0));
      expect(detection.boundingBox.right, lessThanOrEqualTo(1.0));
      expect(detection.boundingBox.bottom, lessThanOrEqualTo(1.0));
      expect(detection.confidence, inInclusiveRange(0.0, 1.0));
      expect(detection.label.isNotEmpty, isTrue);
    }

    // Verify defect rate percent
    final expectedDefectRate = (tally.totalDefects / 30) * 100;
    expect(tally.defectRatePercent, closeTo(expectedDefectRate, 0.01));

    // Verify defect map
    final map = tally.toDefectMap();
    expect(map.containsKey('thin'), isTrue);
    expect(map.containsKey('framed'), isTrue);
    expect(map.containsKey('irregular'), isTrue);
    expect(map.containsKey('melted'), isTrue);
    expect(map.containsKey('double'), isTrue);
    expect(map.containsKey('stained'), isTrue);
  });

  test('CocoonAnalyticsService computes metrics from automated vision tally', () {
    final batch = Batch(
      id: 'batch-test-01',
      species: Species.bombyx,
      strain: 'KSK',
      startDate: DateTime.now().subtract(const Duration(days: 40)),
      eggCount: 100,
      status: BatchStatus.active,
      createdAt: DateTime.now(),
    );

    const tally = CocoonVisionTally(
      cleanCount: 90,
      thinCount: 2,
      framedCount: 1,
      irregularCount: 1,
      meltedCount: 1,
      doubleCount: 1,
      stainedCount: 0,
      inferenceDurationMs: 35,
    );

    expect(tally.totalDetected, 96);
    expect(tally.totalDefects, 6);
    expect(tally.defectRatePercent, closeTo(6.25, 0.01));

    final metrics = analyticsService.computeFromVisionTally(
      batch,
      tally,
      totalWeightGrams: 180.0,
      shellWeightGrams: 0.40,
    );

    expect(metrics.cocoonCount, 96);
    expect(metrics.defectiveCount, 6);
    expect(metrics.defectRatePercent, closeTo(6.25, 0.01));
    expect(metrics.averageCocoonWeightGrams, closeTo(180.0 / 96, 0.01));
    expect(metrics.doubleCount, 1);
    expect(metrics.flimsyCount, 2);
    expect(metrics.meltedCount, 1);
    expect(metrics.stainedCount, 0);
  });

  test('Riverpod cocoonTallyProvider updates and resets vision state', () {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    // Initial state is empty
    expect(container.read(cocoonTallyProvider).totalDetected, 0);

    const newTally = CocoonVisionTally(
      cleanCount: 50,
      thinCount: 3,
      framedCount: 2,
    );

    container.read(cocoonTallyProvider.notifier).updateTally(newTally);
    expect(container.read(cocoonTallyProvider).totalDetected, 55);
    expect(container.read(cocoonTallyProvider).totalDefects, 5);

    container.read(cocoonTallyProvider.notifier).reset();
    expect(container.read(cocoonTallyProvider).totalDetected, 0);
  });
}
