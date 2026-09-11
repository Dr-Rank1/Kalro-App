import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../models/farm_profile.dart';
import '../services/auth_repository.dart';
import '../services/session_service.dart';
import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({
    super.key,
    required this.onLoggedIn,
    this.authRepository,
    this.sessionService,
    this.userPreferences,
  });

  final void Function(UserSession session) onLoggedIn;
  final AuthRepository? authRepository;
  final SessionService? sessionService;
  final UserPreferences? userPreferences;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();

  late final AuthRepository _auth;
  late final SessionService _sessionService;

  FarmProfile? _selectedFarm;
  List<FarmProfile> _farms = [];
  var _preparing = true;
  var _loading = false;
  var _showAdvanced = false;
  var _logoTapCount = 0;
  String? _errorMessage;

  final _usernameController = TextEditingController();
  final _pinController = TextEditingController();
  var _obscurePin = true;

  static const _advancedTapThreshold = 5;

  @override
  void initState() {
    super.initState();
    _auth = widget.authRepository ?? AuthRepository();
    _sessionService = widget.sessionService ?? SessionService(authRepository: _auth);
    _prepareFarm();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _pinController.dispose();
    super.dispose();
  }

  void _onLogoTap() {
    _logoTapCount++;
    if (_logoTapCount >= _advancedTapThreshold) {
      _logoTapCount = 0;
      setState(() => _showAdvanced = !_showAdvanced);
    }
  }

  Future<void> _prepareFarm() async {
    setState(() {
      _preparing = true;
      _errorMessage = null;
    });

    try {
      final prefs = widget.userPreferences ?? UserPreferences();
      final orgName = await prefs.getOrgName();
      final displayName = await prefs.getDisplayName();
      final adminUsername = await prefs.getAdminUsername();

      await _sessionService.migrateLegacyDataIfNeeded(
        orgName: orgName,
        adminUsername: adminUsername,
        adminDisplayName: displayName,
        adminPin: '1234',
      );
      await _sessionService.ensureFarmFromPreferences(
        orgName: orgName,
        adminUsername: adminUsername,
        adminDisplayName: displayName,
        adminPin: '1234',
      );

      final farms = await _auth.listFarms();
      final primaryFarm = AuthRepository.resolvePrimaryFarm(farms, orgName);
      if (primaryFarm != null) {
        await _auth.ensureManagerAccount(
          farmId: primaryFarm.id,
          adminUsername: adminUsername,
          adminDisplayName: displayName,
          adminPin: '1234',
        );
      }
      if (!mounted) return;
      setState(() {
        _farms = farms;
        _selectedFarm = primaryFarm;
        _preparing = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _preparing = false;
        _errorMessage = 'Could not prepare farm account: $error';
      });
    }
  }

  Future<void> _login() async {
    if (_selectedFarm == null) {
      setState(() => _errorMessage = 'No farm account is available yet.');
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final login = await _auth.authenticateLogin(
        username: _usernameController.text.trim(),
        pin: _pinController.text.trim(),
        farm: _selectedFarm,
        farms: _farms,
      );

      if (login == null) {
        if (mounted) setState(() => _errorMessage = 'Wrong username or PIN.');
        return;
      }

      final farmDir = await _auth.farmDirectory(login.farm.id);
      final session = UserSession(
        farm: login.farm,
        user: login.user,
        farmDirectoryPath: farmDir.path,
      );
      await _sessionService.saveSession(session);
      if (!mounted) return;
      widget.onLoggedIn(session);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KalroColors.headerGreen,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
      child: Column(
        children: [
          GestureDetector(
            onTap: _onLogoTap,
            child: Image.asset('assets/images/kalro_app_icon.png', height: 56),
          ),
          const SizedBox(height: 10),
          Text(
            'Kalro Sericulture',
            style: GoogleFonts.poppins(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
          if (_selectedFarm != null && !_showAdvanced) ...[
            const SizedBox(height: 4),
            Text(
              _selectedFarm!.orgName,
              style: GoogleFonts.poppins(color: Colors.white70, fontSize: 12),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildBody() {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: KalroColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: _preparing
          ? const Center(child: CircularProgressIndicator())
          : _farms.isEmpty
              ? _buildNoFarmState()
              : _buildLoginForm(),
    );
  }

  Widget _buildNoFarmState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.cloud_off_outlined, size: 40, color: KalroColors.textMuted),
            const SizedBox(height: 12),
            Text(
              'Setup required',
              style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage ?? 'Complete app setup first.',
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(fontSize: 13, color: KalroColors.textMuted),
            ),
            const SizedBox(height: 20),
            KalroPrimaryButton(label: 'Retry', onPressed: _prepareFarm),
          ],
        ),
      ),
    );
  }

  Widget _buildLoginForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_showAdvanced) ...[
              _buildAdvancedSection(),
              const SizedBox(height: 20),
            ],
            TextFormField(
              controller: _usernameController,
              textInputAction: TextInputAction.next,
              autocorrect: false,
              decoration: const InputDecoration(
                labelText: 'Username',
                filled: true,
                fillColor: Colors.white,
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Enter your username';
                }
                return null;
              },
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _pinController,
              obscureText: _obscurePin,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: InputDecoration(
                labelText: 'PIN',
                filled: true,
                fillColor: Colors.white,
                suffixIcon: IconButton(
                  icon: Icon(_obscurePin ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                  onPressed: () => setState(() => _obscurePin = !_obscurePin),
                ),
              ),
              validator: (value) {
                if (value == null || value.trim().length < 4) {
                  return 'PIN must be at least 4 digits';
                }
                return null;
              },
              onFieldSubmitted: (_) => _loading ? null : _login(),
            ),
            if (_errorMessage != null) ...[
              const SizedBox(height: 14),
              Text(
                _errorMessage!,
                style: GoogleFonts.poppins(fontSize: 13, color: Colors.red.shade700),
              ),
            ],
            const SizedBox(height: 24),
            KalroPrimaryButton(
              label: _loading ? 'Signing in...' : 'Sign in',
              onPressed: _loading ? null : _login,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdvancedSection() {
    final farm = _selectedFarm!;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: KalroColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Farm details',
            style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          if (_farms.length > 1)
            DropdownButtonFormField<FarmProfile>(
              initialValue: _selectedFarm,
              decoration: const InputDecoration(
                labelText: 'Farm',
                isDense: true,
                filled: true,
                fillColor: Colors.white,
              ),
              items: _farms
                  .map((f) => DropdownMenuItem(value: f, child: Text(f.orgName)))
                  .toList(),
              onChanged: (value) => setState(() => _selectedFarm = value),
            )
          else
            Text(
              farm.orgName,
              style: GoogleFonts.poppins(fontSize: 13),
            ),
          const SizedBox(height: 4),
          Text(
            'Sync code ${farm.syncCode}',
            style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
          ),
        ],
      ),
    );
  }
}
