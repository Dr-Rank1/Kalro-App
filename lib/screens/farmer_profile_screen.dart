import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../l10n/app_localizations.dart';
import '../models/app_user.dart';
import '../models/farm_profile.dart';
import '../models/profile_summary.dart';
import '../services/app_repositories.dart';
import '../services/auth_repository.dart';
import '../services/notification_service.dart';
import '../services/permission_service.dart';
import '../services/profile_photo_service.dart';
import '../services/profile_service.dart';
import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';
import 'create_batch_screen.dart';
import 'data_management_screen.dart';
import 'edit_profile_screen.dart';
import 'farm_settings_screen.dart';
import 'user_management_screen.dart';
import 'package:kalro/l10n/translator.dart';

class FarmerProfileScreen extends StatefulWidget {
  const FarmerProfileScreen({
    super.key,
    required this.repositories,
    required this.userPreferences,
    required this.session,
    this.notificationService,
    this.onLogout,
    required this.onLanguageChanged,
    this.onSessionUpdated,
  });

  final AppRepositories repositories;
  final UserPreferences userPreferences;
  final UserSession session;
  final NotificationService? notificationService;
  final VoidCallback? onLogout;
  final void Function(String) onLanguageChanged;
  final ValueChanged<UserSession>? onSessionUpdated;

  @override
  State<FarmerProfileScreen> createState() => _FarmerProfileScreenState();
}

class _FarmerProfileScreenState extends State<FarmerProfileScreen> {
  static const _permissions = PermissionService();
  final _profileService = ProfileService();
  final _photos = ProfilePhotoService();
  late Future<ProfileSummary> _summaryFuture;
  late UserSession _session;
  late AuthRepository _auth;
  String _language = 'en';
  UserRole _role = UserRole.swr;

  @override
  void initState() {
    super.initState();
    _session = widget.session;
    _auth = AuthRepository.forSession(_session);
    _summaryFuture = _profileService.load(
      repositories: widget.repositories,
      userPreferences: widget.userPreferences,
      session: _session,
    );
    widget.userPreferences.getLanguage().then((lang) {
      if (!mounted) return;
      final sw = lang.toLowerCase().startsWith('sw') ||
          lang.toLowerCase() == 'swahili';
      setState(() => _language = sw ? 'sw' : 'en');
    });
    widget.userPreferences.getRole().then((role) {
      if (mounted) setState(() => _role = role);
    });
  }

  @override
  void didUpdateWidget(covariant FarmerProfileScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    final old = oldWidget.session;
    final next = widget.session;
    if (old.user.id != next.user.id ||
        old.user.displayName != next.user.displayName ||
        old.user.phone != next.user.phone ||
        old.user.photoPath != next.user.photoPath ||
        old.farm.orgName != next.farm.orgName ||
        old.farm.county != next.farm.county ||
        old.farm.houseCount != next.farm.houseCount ||
        old.farm.phone != next.farm.phone ||
        old.farm.notes != next.farm.notes ||
        old.farm.primarySpecies != next.farm.primarySpecies) {
      _session = next;
      _auth = AuthRepository.forSession(_session);
      _reload();
    }
  }

  void _reload() {
    setState(() {
      _summaryFuture = _profileService.load(
        repositories: widget.repositories,
        userPreferences: widget.userPreferences,
        session: _session,
      );
    });
  }

  bool get _canEdit => _permissions.canEditData(_session.user);

  bool get _canManage => _permissions.canManageUsers(_session.user);

  void _applySession(UserSession session) {
    _session = session;
    _auth = AuthRepository.forSession(session);
    widget.onSessionUpdated?.call(session);
  }

  Future<void> _openEditProfile() async {
    final updated = await Navigator.of(context).push<UserSession>(
      MaterialPageRoute(
        builder: (_) => EditProfileScreen(
          session: _session,
          userPreferences: widget.userPreferences,
          authRepository: _auth,
          onSessionUpdated: widget.onSessionUpdated,
        ),
      ),
    );
    if (!mounted) return;
    if (updated != null) _applySession(updated);
    final role = await widget.userPreferences.getRole();
    if (mounted) {
      setState(() => _role = role);
      _reload();
    }
  }

  Future<void> _changePhoto() async {
    final source = await _photos.chooseSource(context);
    if (source == null) return;
    try {
      final updated = await _photos.save(
        session: _session,
        auth: _auth,
        source: source,
      );
      if (updated == null || !mounted) return;
      _applySession(updated);
      setState(() {});
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not update photo: $error'.tr)),
      );
    }
  }

  Future<void> _openFarmSettings() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => FarmSettingsScreen(
          session: _session,
          authRepository: _auth,
          userPreferences: widget.userPreferences,
          onFarmUpdated: (farm) {
            _applySession(_session.copyWith(farm: farm));
          },
        ),
      ),
    );
    if (mounted) {
      setState(() {});
      _reload();
    }
  }

  Future<void> _openTeam() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => UserManagementScreen(
          session: _session,
          authRepository: _auth,
        ),
      ),
    );
    if (mounted) _reload();
  }

  Future<void> _startLot({CreateBatchScreen? screen}) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) =>
            screen ??
            CreateBatchScreen(
              repository: widget.repositories.batches,
              producers: widget.repositories.producers,
              farmRepositories: widget.repositories,
            ),
      ),
    );
    if (mounted) _reload();
  }

  Future<void> _changePin() async {
    final updated = await showDialog<AppUser>(
      context: context,
      builder: (context) => _ChangePinDialog(auth: _auth, user: _session.user),
    );
    if (updated == null || !mounted) return;
    _applySession(_session.copyWith(user: updated));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('PIN updated'.tr)),
    );
  }

  Future<void> _confirmSignOut() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Sign out?'.tr),
        content: Text(
          'You will need your farm name, username, and PIN to sign in again.'.tr,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel'.tr),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Sign out'.tr),
          ),
        ],
      ),
    );
    if (ok == true) widget.onLogout?.call();
  }

  Future<void> _confirmDeleteProfile() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete profile?'.tr),
        content: Text(
          Translator.fill(
            'Are you sure you want to delete {name}? All local account data will be permanently removed.',
            {'name': _session.user.farmerFacingName},
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('Cancel'.tr),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: KalroColors.danger),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('Delete'.tr),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await _auth.deleteUser(_session.user);
      if (mounted) {
        widget.onLogout?.call();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return KalroBackground(
      child: SafeArea(
        child: AsyncContent(
          future: _summaryFuture,
          builder: (context, summary) {
            final hasLots = summary.totalLots > 0;
            return RefreshIndicator(
              onRefresh: () async => _reload(),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                children: [
                  KalroToolbar(
                    title: l10n?.navProfile ?? 'You'.tr,
                    subtitle: 'Your farm account, season record, and backup.'.tr,
                  ),
                  const SizedBox(height: 16),
                  ProfileHeader(
                    session: _session,
                    role: _role,
                    onEdit: _openEditProfile,
                    onEditPhoto: _changePhoto,
                  ),
                  const SizedBox(height: 16),
                  KalroSectionHeader(
                    title: 'This season'.tr,
                  ),
                  const SizedBox(height: 8),
                  if (hasLots) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: KalroColors.softShadow,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _MetricPill(
                            label: 'Active Batches'.tr,
                            value: '${summary.activeBatchCount}',
                            color: KalroColors.primaryGreen,
                          ),
                          Container(width: 1, height: 36, color: KalroColors.divider),
                          _MetricPill(
                            label: 'Harvest'.tr,
                            value: '${summary.harvestKg.toStringAsFixed(1)} kg',
                            color: KalroColors.harvest,
                          ),
                          Container(width: 1, height: 36, color: KalroColors.divider),
                          _MetricPill(
                            label: 'Houses'.tr,
                            value: _session.farm.houseCount == null ? '1' : '${_session.farm.houseCount}',
                            color: KalroColors.leaf,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ] else ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: KalroColors.softShadow,
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: KalroColors.leaf.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.eco_outlined, color: KalroColors.primaryGreen),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'No lots yet'.tr,
                                  style: GoogleFonts.poppins(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: KalroColors.textDark,
                                  ),
                                ),
                                Text(
                                  'Start a lot to build your farm record.'.tr,
                                  style: GoogleFonts.poppins(
                                    fontSize: 11,
                                    color: KalroColors.textMuted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (_canEdit)
                            TextButton(
                              onPressed: () => _startLot(),
                              child: Text(
                                '+ Start Lot'.tr,
                                style: GoogleFonts.poppins(
                                  fontWeight: FontWeight.w700,
                                  color: KalroColors.primaryGreen,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  // Settings Container
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: KalroColors.softShadow,
                    ),
                    child: Column(
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
                          child: Row(
                            children: [
                              const Icon(Icons.language, size: 20, color: KalroColors.primaryGreen),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  l10n?.profileLanguage ?? 'Language'.tr,
                                  style: GoogleFonts.poppins(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: KalroColors.textDark,
                                  ),
                                ),
                              ),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  _LangChip(
                                    label: 'EN',
                                    selected: _language == 'en',
                                    onTap: () {
                                      setState(() => _language = 'en');
                                      widget.onLanguageChanged('en');
                                    },
                                  ),
                                  const SizedBox(width: 6),
                                  _LangChip(
                                    label: 'SW',
                                    selected: _language == 'sw',
                                    onTap: () {
                                      setState(() => _language = 'sw');
                                      widget.onLanguageChanged('sw');
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const Divider(height: 1, indent: 16, endIndent: 16, color: KalroColors.divider),
                        _CleanTile(
                          icon: Icons.home_work_outlined,
                          title: 'Farm Settings'.tr,
                          subtitle: 'County, houses, and sync code'.tr,
                          onTap: _openFarmSettings,
                        ),
                        const Divider(height: 1, indent: 16, endIndent: 16, color: KalroColors.divider),
                        _CleanTile(
                          icon: Icons.cloud_upload_outlined,
                          title: l10n?.profileDataBackup ?? 'Data & Backup'.tr,
                          subtitle: 'Export and secure farm data'.tr,
                          onTap: () async {
                            await Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => DataManagementScreen(
                                  repositories: widget.repositories,
                                  session: _session,
                                  onDataChanged: _reload,
                                ),
                              ),
                            );
                            _reload();
                          },
                        ),
                        const Divider(height: 1, indent: 16, endIndent: 16, color: KalroColors.divider),
                        _CleanTile(
                          icon: Icons.lock_outline,
                          title: 'Change PIN'.tr,
                          subtitle: 'Security PIN for login'.tr,
                          onTap: _changePin,
                        ),
                        if (_canManage) ...[
                          const Divider(height: 1, indent: 16, endIndent: 16, color: KalroColors.divider),
                          _CleanTile(
                            icon: Icons.groups_outlined,
                            title: 'Team Members'.tr,
                            subtitle: Translator.fill('{n} people', {
                              'n': '${summary.teamMembers.length}',
                            }),
                            onTap: _openTeam,
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      if (widget.onLogout != null)
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _confirmSignOut,
                            icon: const Icon(Icons.logout, size: 18),
                            label: Text(l10n?.profileSignOut ?? 'Sign out'.tr),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: KalroColors.textMuted,
                              side: const BorderSide(color: KalroColors.divider),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                          ),
                        ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _confirmDeleteProfile,
                          icon: const Icon(Icons.delete_outline, size: 18, color: KalroColors.danger),
                          label: Text(
                            'Delete Profile'.tr,
                            style: const TextStyle(color: KalroColors.danger),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: KalroColors.danger.withValues(alpha: 0.3)),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _ChangePinDialog extends StatefulWidget {
  const _ChangePinDialog({required this.auth, required this.user});

  final AuthRepository auth;
  final AppUser user;

  @override
  State<_ChangePinDialog> createState() => _ChangePinDialogState();
}

class _ChangePinDialogState extends State<_ChangePinDialog> {
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  var _saving = false;
  String? _error;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final current = _current.text.trim();
    final next = _next.text.trim();
    final confirm = _confirm.text.trim();
    if (next.length < 4) {
      setState(() => _error = 'PIN must be at least 4 digits'.tr);
      return;
    }
    if (next != confirm) {
      setState(() => _error = 'PINs do not match'.tr);
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final user = await widget.auth.changePin(
        user: widget.user,
        currentPin: current,
        newPin: next,
      );
      if (mounted) Navigator.pop(context, user);
    } catch (error) {
      setState(() {
        _saving = false;
        _error = error is StateError
            ? error.message.tr
            : 'Could not change PIN: $error'.tr;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Change PIN'.tr),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _current,
            obscureText: true,
            enabled: !_saving,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: InputDecoration(labelText: 'Current PIN'.tr),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _next,
            obscureText: true,
            enabled: !_saving,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: InputDecoration(labelText: 'New PIN (4+ digits)'.tr),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _confirm,
            obscureText: true,
            enabled: !_saving,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: InputDecoration(labelText: 'Confirm new PIN'.tr),
          ),
          if (_error != null) ...[
            const SizedBox(height: 10),
            Text(
              _error!,
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: KalroColors.danger,
              ),
            ),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: _saving ? null : () => Navigator.pop(context),
          child: Text('Cancel'.tr),
        ),
        TextButton(
          onPressed: _saving ? null : _save,
          child: Text(_saving ? 'Saving...'.tr : 'Save'.tr),
        ),
      ],
    );
  }
}

class _MetricPill extends StatelessWidget {
  const _MetricPill({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 11,
            color: KalroColors.textMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

class _CleanTile extends StatelessWidget {
  const _CleanTile({
    required this.icon,
    required this.title,
    this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Icon(icon, size: 20, color: KalroColors.primaryGreen),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: KalroColors.textDark,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 1),
                    Text(
                      subtitle!,
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        color: KalroColors.textMuted,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const Icon(Icons.chevron_right, size: 18, color: KalroColors.textMuted),
          ],
        ),
      ),
    );
  }
}

class _LangChip extends StatelessWidget {
  const _LangChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: selected ? KalroColors.primaryGreen : KalroColors.background,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected ? KalroColors.primaryGreen : KalroColors.divider,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: selected ? Colors.white : KalroColors.textDark,
          ),
        ),
      ),
    );
  }
}
