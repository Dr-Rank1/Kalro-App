import 'dart:io';

import 'package:flutter/material.dart';

import '../models/account_permission.dart';
import '../models/app_user.dart';
import '../models/farm_profile.dart';
import '../services/app_repositories.dart';
import '../services/auth_repository.dart';
import '../services/notification_service.dart';
import '../services/session_service.dart';
import '../services/user_preferences.dart';
import 'l10n/translator.dart';
import '../theme/kalro_theme.dart';
import 'screens/batch_detail_screen.dart';
import 'screens/farmer_shell.dart';
import 'screens/login_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/walkthrough_screen.dart';
import 'l10n/app_localizations.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

class KalroApp extends StatefulWidget {
  KalroApp({
    super.key,
    AppRepositories? repositories,
    UserPreferences? userPreferences,
    NotificationService? notificationService,
    AuthRepository? authRepository,
    SessionService? sessionService,
  })  : initialRepositories = repositories,
        userPreferences = userPreferences ?? UserPreferences(),
        notificationService = notificationService ?? NotificationService(),
        authRepository = authRepository ?? AuthRepository(),
        sessionService = sessionService ?? SessionService();

  final AppRepositories? initialRepositories;
  final UserPreferences userPreferences;
  final NotificationService notificationService;
  final AuthRepository authRepository;
  final SessionService sessionService;

  @override
  State<KalroApp> createState() => _KalroAppState();
}

class _KalroAppState extends State<KalroApp> {
  bool _loading = true;
  bool _onboardingComplete = false;
  bool _walkthroughComplete = false;
  Locale? _currentLocale;
  UserSession? _session;
  AppRepositories? _repositories;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final onboardingDone = await widget.userPreferences.hasCompletedOnboarding();
    final walkthroughDone = await widget.userPreferences.hasSeenWalkthrough();
    final lang = await widget.userPreferences.getLanguage();
    Locale? savedLocale;
    if ((lang.toLowerCase().startsWith('sw') || lang.toLowerCase() == 'swahili')) {
      savedLocale = const Locale('sw');
      Translator.currentLanguage = 'sw';
    } else {
      savedLocale = const Locale('en');
      Translator.currentLanguage = 'en';
    }

    if (widget.initialRepositories != null) {
      final dir = await widget.initialRepositories!.storageDirectory();
      _repositories = widget.initialRepositories;
      _session = UserSession(
        farm: FarmProfile(
          id: 'test-farm',
          orgName: 'Test Farm',
          syncCode: '000000',
          createdAt: DateTime(2020),
        ),
        user: AppUser(
          id: 'test-user',
          farmId: 'test-farm',
          username: 'admin',
          displayName: 'Admin',
          pinHash: 'test',
          permission: AccountPermission.admin,
          createdAt: DateTime(2020),
        ),
        farmDirectoryPath: dir.path,
      );
      setState(() {
        _onboardingComplete = onboardingDone;
        _walkthroughComplete = walkthroughDone;
        _currentLocale = savedLocale;
        _loading = false;
      });
      return;
    }

    if (onboardingDone) {
      final orgName = await widget.userPreferences.getOrgName();
      final displayName = await widget.userPreferences.getDisplayName();
      final adminUsername = await widget.userPreferences.getAdminUsername();

      await widget.sessionService.migrateLegacyDataIfNeeded(
        orgName: orgName,
        adminUsername: adminUsername,
        adminDisplayName: displayName,
        adminPin: '',
      );
      await widget.sessionService.ensureFarmFromPreferences(
        orgName: orgName,
        adminUsername: adminUsername,
        adminDisplayName: displayName,
        adminPin: '',
      );
      final session = await widget.sessionService.loadSession();
      if (session != null) {
        _session = session;
        _repositories = AppRepositories(
          storageDirectory: Directory(session.farmDirectoryPath),
        );
        await widget.notificationService.syncReminders(_repositories!);
      }
    }

    if (!mounted) return;
    setState(() {
      _onboardingComplete = onboardingDone;
      _walkthroughComplete = walkthroughDone;
        _currentLocale = savedLocale;
      _loading = false;
    });
  }

  Future<void> _changeLanguage(String langCode) async {
    await widget.userPreferences.setLanguage(langCode);
    setState(() {
      _currentLocale = Locale(langCode);
      Translator.currentLanguage = langCode;
    });
  }

  Future<void> _onWalkthroughComplete() async {
    await widget.userPreferences.completeWalkthrough();
    setState(() => _walkthroughComplete = true);
  }

  Future<void> _onOnboardingComplete() async {
    setState(() => _loading = true);
    await _bootstrap();
  }

  Future<void> _onLoggedIn(UserSession session) async {
    final repositories = AppRepositories(
      storageDirectory: Directory(session.farmDirectoryPath),
    );
    await widget.notificationService.syncReminders(repositories);
    setState(() {
      _session = session;
      _repositories = repositories;
      _loading = false;
    });
  }

  Future<void> _onLogout() async {
    await widget.sessionService.clearSession();
    setState(() {
      _session = null;
      _repositories = null;
    });
  }

  Widget _buildHome() {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (!_onboardingComplete) {
      return OnboardingScreen(
        userPreferences: widget.userPreferences,
        authRepository: widget.authRepository,
        sessionService: widget.sessionService,
        onComplete: _onOnboardingComplete,
      );
    }

    if (!_walkthroughComplete) {
      return WalkthroughScreen(onComplete: _onWalkthroughComplete);
    }

    if (_session != null && _repositories != null) {
      return FarmerShell(
        repositories: _repositories!,
        userPreferences: widget.userPreferences,
        notificationService: widget.notificationService,
        session: _session!,
        onLogout: widget.initialRepositories == null ? _onLogout : null,
        onLanguageChanged: _changeLanguage,
      );
    }

    return LoginScreen(
      authRepository: widget.authRepository,
      sessionService: widget.sessionService,
      userPreferences: widget.userPreferences,
      onLoggedIn: _onLoggedIn,
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      key: ValueKey(_currentLocale?.languageCode),
      title: 'Kalro',
      debugShowCheckedModeBanner: false,
      theme: KalroTheme.light(),
      locale: _currentLocale,
      localizationsDelegates: [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en'), // English
        Locale('sw'), // Swahili
      ],
      home: _buildHome(),
      onGenerateRoute: (settings) {
        if (_repositories == null) return null;
        if (settings.name == BatchDetailScreen.routeName) {
          final batchId = settings.arguments as String;
          return MaterialPageRoute(
            builder: (_) => BatchDetailScreen(
              repositories: _repositories!,
              batchId: batchId,
            ),
          );
        }
        return null;
      },
    );
  }
}
