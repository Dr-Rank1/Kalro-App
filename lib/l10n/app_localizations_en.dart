// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Kalro Sericulture';

  @override
  String get onboardingWelcomeTitle => 'Karibu Kalro!';

  @override
  String get onboardingWelcomeDesc =>
      'Your digital sericulture assistant. Plan, track, and improve every rearing cycle.';

  @override
  String get onboardingTrackTitle => 'Track Daily Logs';

  @override
  String get onboardingTrackDesc =>
      'Log metric weights (grams/kg) of feeding and monitor disease and farm health.';

  @override
  String get onboardingPredictTitle => 'Predict Harvests';

  @override
  String get onboardingPredictDesc =>
      'Know exactly when your cocoons will be ready with our AI-powered predictions.';

  @override
  String get getStarted => 'Get Started';

  @override
  String get navHome => 'Home';

  @override
  String get navBatches => 'Batches';

  @override
  String get navProfile => 'Profile';

  @override
  String get dashboardLiveLarvae => 'Live Larvae';

  @override
  String dashboardLiveLarvaeSub(Object count) {
    return '$count batches';
  }

  @override
  String get dashboardSurvivalRate => 'Survival Rate';

  @override
  String get dashboardExpectedYield => 'Expected Yield';

  @override
  String get dashboardYieldSub => 'Estimated cocoon';

  @override
  String get dashboardNeedsAttention => 'Needs Attention';

  @override
  String get dashboardActiveBatches => 'Active batches';

  @override
  String dashboardActiveBatchesSub(Object count) {
    return '$count in progress';
  }

  @override
  String get dashboardStartFirstBatch => 'Start Your First Batch';

  @override
  String get dashboardStartFirstBatchDesc =>
      'No rearing cycles in progress. Tap the + button below to create a new batch and start tracking feeding, health, and harvests.';

  @override
  String get profileTotalCycles => 'Total Cycles';

  @override
  String get profileLifetimeYield => 'Lifetime Yield';

  @override
  String get profileAvgSurvival => 'Avg Survival';

  @override
  String get profileLanguage => 'Language';

  @override
  String get profileEnglish => 'English';

  @override
  String get profileSwahili => 'Swahili';

  @override
  String get profileDataBackup => 'Data & Backup';

  @override
  String get profileBackupDesc => 'Secure your data locally';

  @override
  String get profileBackupNow => 'Backup Now';

  @override
  String get profileKnowledgeBase => 'Kalro Knowledge Base';

  @override
  String get profileSignOut => 'Sign Out';

  @override
  String get profileEditName => 'Edit Name';

  @override
  String get profileMyReminders => 'My Reminders';

  @override
  String get batchesTitle => 'Batches';

  @override
  String get batchesSubtitle =>
      'Create cycles and log feeding, health, and harvest.';

  @override
  String get batchesActiveCount => 'Active';

  @override
  String get batchesClosedCount => 'Closed';

  @override
  String get batchesTotalCount => 'Total';

  @override
  String get batchesActiveHeader => 'Active batches';

  @override
  String get batchesInProgress => 'in progress';

  @override
  String get batchesNoActive => 'No active batches';

  @override
  String get batchesNoActiveDesc =>
      'Start a rearing cycle to plan milestones and record daily work.';

  @override
  String get batchesNoActiveDescViewer => 'No batches are running right now.';

  @override
  String get batchesCreateAction => 'Create batch';

  @override
  String get batchesClosedHeader => 'Closed batches';

  @override
  String get batchesArchived => 'archived';

  @override
  String get batchesLarvaeLabel => 'larvae';

  @override
  String get batchesClosedLabel => 'Closed';
}
