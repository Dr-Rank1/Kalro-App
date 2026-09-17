// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Swahili (`sw`).
class AppLocalizationsSw extends AppLocalizations {
  AppLocalizationsSw([String locale = 'sw']) : super(locale);

  @override
  String get appTitle => 'Kalro Ufugaji wa Hariri';

  @override
  String get onboardingWelcomeTitle => 'Karibu Kalro!';

  @override
  String get onboardingWelcomeDesc =>
      'Msaidizi wako wa kidijitali wa ufugaji hariri. Panga, fuatilia, na uboreshe kila mzunguko.';

  @override
  String get onboardingTrackTitle => 'Fuatilia Rekodi za Kila Siku';

  @override
  String get onboardingTrackDesc =>
      'Weka rekodi za uzito (gramu/kilo) za chakula na ufuatilie magonjwa na afya ya shamba.';

  @override
  String get onboardingPredictTitle => 'Tabiri Mavuno';

  @override
  String get onboardingPredictDesc =>
      'Jua haswa wakati vifukofuko vyako (cocoons) vitakuwa tayari kupitia makadirio ya AI.';

  @override
  String get getStarted => 'Anza Sasa';

  @override
  String get navHome => 'Leo';

  @override
  String get navBatches => 'Makundi';

  @override
  String get navPlan => 'Panga';

  @override
  String get navFarm => 'Shamba';

  @override
  String get navProfile => 'Wewe';

  @override
  String get dashboardLiveLarvae => 'Mabuu Hai';

  @override
  String dashboardLiveLarvaeSub(Object count) {
    return 'Makundi $count';
  }

  @override
  String get dashboardSurvivalRate => 'Kiwango cha Kuishi';

  @override
  String get dashboardExpectedYield => 'Mavuno';

  @override
  String get dashboardYieldSub => 'Vifukofuko vilivyorekodiwa';

  @override
  String get dashboardNeedsAttention => 'Inahitaji Uangalizi';

  @override
  String get dashboardActiveBatches => 'Makundi yanayoendelea';

  @override
  String dashboardActiveBatchesSub(Object count) {
    return '$count yanaendelea';
  }

  @override
  String get dashboardStartFirstBatch => 'Anza Kundi Lako la Kwanza';

  @override
  String get dashboardStartFirstBatchDesc =>
      'Hakuna mizunguko inayoendelea. Gusa kitufe cha + hapa chini kuunda kundi jipya na uanze kufuatilia ulishaji, afya na mavuno.';

  @override
  String get profileTotalCycles => 'Mizunguko';

  @override
  String get profileLifetimeYield => 'Mavuno (Kilo)';

  @override
  String get profileAvgSurvival => 'Kiwango cha Kuishi';

  @override
  String get profileLanguage => 'Lugha';

  @override
  String get profileEnglish => 'Kiingereza';

  @override
  String get profileSwahili => 'Kiswahili';

  @override
  String get profileDataBackup => 'Hifadhi ya Data';

  @override
  String get profileBackupDesc => 'Hifadhi data zako salama';

  @override
  String get profileBackupNow => 'Hifadhi Sasa';

  @override
  String get profileKnowledgeBase => 'Maktaba ya Kalro';

  @override
  String get profileSignOut => 'Ondoka';

  @override
  String get profileEditName => 'Badilisha Jina';

  @override
  String get profileMyReminders => 'Vikumbusho Vyangu';

  @override
  String get batchesTitle => 'Makundi';

  @override
  String get batchesSubtitle =>
      'Unda mizunguko na urekodi chakula, afya, na mavuno.';

  @override
  String get batchesActiveCount => 'Hai';

  @override
  String get batchesClosedCount => 'Yamefungwa';

  @override
  String get batchesTotalCount => 'Jumla';

  @override
  String get batchesActiveHeader => 'Makundi yanayoendelea';

  @override
  String get batchesInProgress => 'yanaendelea';

  @override
  String get batchesNoActive => 'Hakuna makundi hai';

  @override
  String get batchesNoActiveDesc =>
      'Anzisha mzunguko wa ufugaji kupanga hatua na kurekodi kazi ya kila siku.';

  @override
  String get batchesNoActiveDescViewer => 'Hakuna makundi yanayoendelea sasa.';

  @override
  String get batchesCreateAction => 'Unda kundi';

  @override
  String get batchesClosedHeader => 'Makundi yaliyofungwa';

  @override
  String get batchesArchived => 'yaliyohifadhiwa';

  @override
  String get batchesLarvaeLabel => 'mabuu';

  @override
  String get batchesClosedLabel => 'Yamefungwa';
}
