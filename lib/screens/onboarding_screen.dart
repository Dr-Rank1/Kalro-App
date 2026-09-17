import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../models/account_permission.dart';
import '../models/farm_profile.dart';
import '../services/auth_repository.dart';
import '../services/session_service.dart';
import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';
import 'package:kalro/l10n/translator.dart';

class OnboardingScreen extends StatefulWidget {
  OnboardingScreen({
    super.key,
    required this.userPreferences,
    required this.authRepository,
    required this.sessionService,
    required this.onComplete,
  });

  final UserPreferences userPreferences;
  final AuthRepository authRepository;
  final SessionService sessionService;
  final VoidCallback onComplete;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  UserRole? _role = UserRole.swr;
  final _nameController = TextEditingController(text: 'Farmer');
  final _orgController = TextEditingController(text: 'Kalro Sericulture Farm');
  final _usernameController = TextEditingController(text: 'admin');
  final _pinController = TextEditingController();
  final _confirmPinController = TextEditingController();
  var _saving = false;

  static const _roles = [
    (UserRole.asr, 'Adopted Seed Rearer', Icons.egg_outlined),
    (UserRole.rsp, 'Registered Seed Producer', Icons.flutter_dash_outlined),
    (UserRole.crc, 'Rearing Support Unit', Icons.grass_outlined),
    (UserRole.swr, 'Silkworm Rearer', Icons.eco_outlined),
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _orgController.dispose();
    _usernameController.dispose();
    _pinController.dispose();
    _confirmPinController.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    if (_role == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Please choose your role'.tr)));
      return;
    }

    if (_pinController.text.trim().length < 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('PIN must be at least 4 digits'.tr)),
      );
      return;
    }

    if (_pinController.text.trim() != _confirmPinController.text.trim()) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('PINs do not match'.tr)));
      return;
    }

    setState(() => _saving = true);
    try {
      final farm = await widget.authRepository.createFarm(
        orgName: _orgController.text,
      );

      final user = await widget.authRepository.createUser(
        farmId: farm.id,
        username: _usernameController.text,
        displayName: _nameController.text,
        pin: _pinController.text.trim(),
        permission: AccountPermission.admin,
      );

      await widget.userPreferences.completeOnboarding(
        language: 'English',
        role: _role!,
        name: _nameController.text,
        orgName: _orgController.text,
        adminUsername: _usernameController.text,
      );

      final farmDir = await widget.authRepository.farmDirectory(farm.id);
      await widget.sessionService.saveSession(
        UserSession(farm: farm, user: user, farmDirectoryPath: farmDir.path),
      );

      if (!mounted) return;
      widget.onComplete();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Setup failed: $error'.tr)));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KalroColors.headerGreen,
      body: Column(
        children: [
          SafeArea(
            bottom: false,
            child: Padding(
              padding: EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: Column(
                children: [
                  Text(
                    'Kalro Sericulture'.tr,
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Eri & Bombyx mori rearing management'.tr,
                    style: GoogleFonts.poppins(
                      color: Colors.white70,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: KalroColors.background,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: KalroBackground(
                child: SingleChildScrollView(
                  padding: EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Image.asset(
                        'assets/images/kalro_app_icon.png',
                        height: 100,
                      ),
                      SizedBox(height: 20),
                      Text(
                        'Set up your farm profile'.tr,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: KalroColors.textDark,
                        ),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'Create your farm, then we will show you the five tabs: Today, Batches, Plan, Farm, and You.'
                            .tr,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          color: KalroColors.textMuted,
                        ),
                      ),
                      SizedBox(height: 24),
                      TextFormField(
                        controller: _nameController,
                        decoration: InputDecoration(labelText: 'Your name'.tr),
                        enabled: !_saving,
                      ),
                      SizedBox(height: 16),
                      TextFormField(
                        controller: _orgController,
                        decoration: InputDecoration(
                          labelText: 'Farm / organization'.tr,
                        ),
                        enabled: !_saving,
                      ),
                      SizedBox(height: 16),
                      TextFormField(
                        controller: _usernameController,
                        decoration: InputDecoration(labelText: 'Login name'.tr),
                        enabled: !_saving,
                      ),
                      SizedBox(height: 16),
                      TextFormField(
                        controller: _pinController,
                        decoration: InputDecoration(
                          labelText: 'PIN (4+ digits)'.tr,
                        ),
                        obscureText: true,
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                        ],
                        enabled: !_saving,
                      ),
                      SizedBox(height: 16),
                      TextFormField(
                        controller: _confirmPinController,
                        decoration: InputDecoration(
                          labelText: 'Confirm PIN'.tr,
                        ),
                        obscureText: true,
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                        ],
                        enabled: !_saving,
                      ),
                      SizedBox(height: 24),
                      Text(
                        'Your role'.tr,
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w600,
                          color: KalroColors.textDark,
                        ),
                      ),
                      SizedBox(height: 12),
                      GridView.count(
                        shrinkWrap: true,
                        physics: NeverScrollableScrollPhysics(),
                        crossAxisCount: 2,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 0.85,
                        children: _roles.map((entry) {
                          final (role, _, icon) = entry;
                          return OptionGridCard(
                            primaryLabel: role.label,
                            secondaryLabel: '',
                            icon: icon,
                            aspectRatio: 0.85,
                            selected: _role == role,
                            onTap: _saving
                                ? () {}
                                : () => setState(() => _role = role),
                          );
                        }).toList(),
                      ),
                      SizedBox(height: 28),
                      KalroPrimaryButton(
                        label: _saving ? 'Setting up...'.tr : 'Get started'.tr,
                        onPressed: _saving ? null : _finish,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
