import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_sw.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('sw'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'Kalro Sericulture'**
  String get appTitle;

  /// No description provided for @onboardingWelcomeTitle.
  ///
  /// In en, this message translates to:
  /// **'Karibu Kalro!'**
  String get onboardingWelcomeTitle;

  /// No description provided for @onboardingWelcomeDesc.
  ///
  /// In en, this message translates to:
  /// **'Your digital sericulture assistant. Plan, track, and improve every rearing cycle.'**
  String get onboardingWelcomeDesc;

  /// No description provided for @onboardingTrackTitle.
  ///
  /// In en, this message translates to:
  /// **'Track Daily Logs'**
  String get onboardingTrackTitle;

  /// No description provided for @onboardingTrackDesc.
  ///
  /// In en, this message translates to:
  /// **'Log metric weights (grams/kg) of feeding and monitor disease and farm health.'**
  String get onboardingTrackDesc;

  /// No description provided for @onboardingPredictTitle.
  ///
  /// In en, this message translates to:
  /// **'Predict Harvests'**
  String get onboardingPredictTitle;

  /// No description provided for @onboardingPredictDesc.
  ///
  /// In en, this message translates to:
  /// **'Know exactly when your cocoons will be ready with our AI-powered predictions.'**
  String get onboardingPredictDesc;

  /// No description provided for @getStarted.
  ///
  /// In en, this message translates to:
  /// **'Get Started'**
  String get getStarted;

  /// No description provided for @navHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navBatches.
  ///
  /// In en, this message translates to:
  /// **'Batches'**
  String get navBatches;

  /// No description provided for @navProfile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get navProfile;

  /// No description provided for @dashboardLiveLarvae.
  ///
  /// In en, this message translates to:
  /// **'Live Larvae'**
  String get dashboardLiveLarvae;

  /// No description provided for @dashboardLiveLarvaeSub.
  ///
  /// In en, this message translates to:
  /// **'{count} batches'**
  String dashboardLiveLarvaeSub(Object count);

  /// No description provided for @dashboardSurvivalRate.
  ///
  /// In en, this message translates to:
  /// **'Survival Rate'**
  String get dashboardSurvivalRate;

  /// No description provided for @dashboardExpectedYield.
  ///
  /// In en, this message translates to:
  /// **'Expected Yield'**
  String get dashboardExpectedYield;

  /// No description provided for @dashboardYieldSub.
  ///
  /// In en, this message translates to:
  /// **'Estimated cocoon'**
  String get dashboardYieldSub;

  /// No description provided for @dashboardNeedsAttention.
  ///
  /// In en, this message translates to:
  /// **'Needs Attention'**
  String get dashboardNeedsAttention;

  /// No description provided for @dashboardActiveBatches.
  ///
  /// In en, this message translates to:
  /// **'Active batches'**
  String get dashboardActiveBatches;

  /// No description provided for @dashboardActiveBatchesSub.
  ///
  /// In en, this message translates to:
  /// **'{count} in progress'**
  String dashboardActiveBatchesSub(Object count);

  /// No description provided for @dashboardStartFirstBatch.
  ///
  /// In en, this message translates to:
  /// **'Start Your First Batch'**
  String get dashboardStartFirstBatch;

  /// No description provided for @dashboardStartFirstBatchDesc.
  ///
  /// In en, this message translates to:
  /// **'No rearing cycles in progress. Tap the + button below to create a new batch and start tracking feeding, health, and harvests.'**
  String get dashboardStartFirstBatchDesc;

  /// No description provided for @profileTotalCycles.
  ///
  /// In en, this message translates to:
  /// **'Total Cycles'**
  String get profileTotalCycles;

  /// No description provided for @profileLifetimeYield.
  ///
  /// In en, this message translates to:
  /// **'Lifetime Yield'**
  String get profileLifetimeYield;

  /// No description provided for @profileAvgSurvival.
  ///
  /// In en, this message translates to:
  /// **'Avg Survival'**
  String get profileAvgSurvival;

  /// No description provided for @profileLanguage.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get profileLanguage;

  /// No description provided for @profileEnglish.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get profileEnglish;

  /// No description provided for @profileSwahili.
  ///
  /// In en, this message translates to:
  /// **'Swahili'**
  String get profileSwahili;

  /// No description provided for @profileDataBackup.
  ///
  /// In en, this message translates to:
  /// **'Data & Backup'**
  String get profileDataBackup;

  /// No description provided for @profileBackupDesc.
  ///
  /// In en, this message translates to:
  /// **'Secure your data locally'**
  String get profileBackupDesc;

  /// No description provided for @profileBackupNow.
  ///
  /// In en, this message translates to:
  /// **'Backup Now'**
  String get profileBackupNow;

  /// No description provided for @profileKnowledgeBase.
  ///
  /// In en, this message translates to:
  /// **'Kalro Knowledge Base'**
  String get profileKnowledgeBase;

  /// No description provided for @profileSignOut.
  ///
  /// In en, this message translates to:
  /// **'Sign Out'**
  String get profileSignOut;

  /// No description provided for @profileEditName.
  ///
  /// In en, this message translates to:
  /// **'Edit Name'**
  String get profileEditName;

  /// No description provided for @profileMyReminders.
  ///
  /// In en, this message translates to:
  /// **'My Reminders'**
  String get profileMyReminders;

  /// No description provided for @batchesTitle.
  ///
  /// In en, this message translates to:
  /// **'Batches'**
  String get batchesTitle;

  /// No description provided for @batchesSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Create cycles and log feeding, health, and harvest.'**
  String get batchesSubtitle;

  /// No description provided for @batchesActiveCount.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get batchesActiveCount;

  /// No description provided for @batchesClosedCount.
  ///
  /// In en, this message translates to:
  /// **'Closed'**
  String get batchesClosedCount;

  /// No description provided for @batchesTotalCount.
  ///
  /// In en, this message translates to:
  /// **'Total'**
  String get batchesTotalCount;

  /// No description provided for @batchesActiveHeader.
  ///
  /// In en, this message translates to:
  /// **'Active batches'**
  String get batchesActiveHeader;

  /// No description provided for @batchesInProgress.
  ///
  /// In en, this message translates to:
  /// **'in progress'**
  String get batchesInProgress;

  /// No description provided for @batchesNoActive.
  ///
  /// In en, this message translates to:
  /// **'No active batches'**
  String get batchesNoActive;

  /// No description provided for @batchesNoActiveDesc.
  ///
  /// In en, this message translates to:
  /// **'Start a rearing cycle to plan milestones and record daily work.'**
  String get batchesNoActiveDesc;

  /// No description provided for @batchesNoActiveDescViewer.
  ///
  /// In en, this message translates to:
  /// **'No batches are running right now.'**
  String get batchesNoActiveDescViewer;

  /// No description provided for @batchesCreateAction.
  ///
  /// In en, this message translates to:
  /// **'Create batch'**
  String get batchesCreateAction;

  /// No description provided for @batchesClosedHeader.
  ///
  /// In en, this message translates to:
  /// **'Closed batches'**
  String get batchesClosedHeader;

  /// No description provided for @batchesArchived.
  ///
  /// In en, this message translates to:
  /// **'archived'**
  String get batchesArchived;

  /// No description provided for @batchesLarvaeLabel.
  ///
  /// In en, this message translates to:
  /// **'larvae'**
  String get batchesLarvaeLabel;

  /// No description provided for @batchesClosedLabel.
  ///
  /// In en, this message translates to:
  /// **'Closed'**
  String get batchesClosedLabel;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'sw'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'sw':
      return AppLocalizationsSw();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
