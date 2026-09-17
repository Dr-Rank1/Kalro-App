import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

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
import '../services/role_access.dart';
import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';
import 'batch_detail_screen.dart';
import 'cloud_sync_screen.dart';
import 'create_batch_screen.dart';
import 'data_management_screen.dart';
import 'edit_profile_screen.dart';
import 'farm_settings_screen.dart';
import 'finance_screen.dart';
import 'reminder_settings_screen.dart';
import 'reports_screen.dart';
import 'user_management_screen.dart';
import 'package:kalro/l10n/translator.dart';

class FarmerProfileScreen extends StatefulWidget {
  FarmerProfileScreen({
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

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return KalroBackground(
      child: SafeArea(
        child: AsyncContent(
          future: _summaryFuture,
          builder: (context, summary) {
            return RefreshIndicator(
              onRefresh: () async => _reload(),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
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
                  const SizedBox(height: 12),
                  FarmIdentityCard(
                    farm: _session.farm,
                    onOpen: _openFarmSettings,
                  ),
                  const SizedBox(height: 20),
                  KalroSectionHeader(
                    title: 'This season'.tr,
                    subtitle: summary.memberSince == null
                        ? null
                        : Translator.fill('Member since {date}', {
                            'date': DateFormat.yMMMd(Translator.dateLocale)
                                .format(summary.memberSince!),
                          }),
                  ),
                  const SizedBox(height: 8),
                  if (summary.totalLots == 0)
                    EmptyStateCard(
                      icon: Icons.layers_outlined,
                      title: 'No lots yet'.tr,
                      message: 'Start a lot to build your farm record.'.tr,
                      actionLabel: _canEdit ? 'Start a lot'.tr : 'OK'.tr,
                      onAction: _canEdit ? () => _startLot() : () {},
                    )
                  else ...[
                    SeasonRecordGrid(summary: summary),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: KalroColors.divider),
                      ),
                      child: StockSplitRow(
                        leftTitle: 'Bombyx live'.tr,
                        leftValue: '${summary.bombyxLarvaeCount}',
                        rightTitle: 'Eri live'.tr,
                        rightValue: '${summary.eriLarvaeCount}',
                      ),
                    ),
                  ],
                  if (summary.lastCycle != null) ...[
                    const SizedBox(height: 16),
                    KalroSectionHeader(
                      title: 'Last closed lot'.tr,
                      subtitle: 'Survival, harvest, and cost per kg'.tr,
                    ),
                    const SizedBox(height: 8),
                    CycleMemoryCard(
                      memory: summary.lastCycle!,
                      showMoney: true,
                      onOpen: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => BatchDetailScreen(
                              repositories: widget.repositories,
                              batchId: summary.lastCycle!.batch.id,
                            ),
                          ),
                        );
                      },
                      onStartLikeThis: _canEdit
                          ? () => _startLot(
                                screen: CreateBatchScreen(
                                  repository: widget.repositories.batches,
                                  producers: widget.repositories.producers,
                                  copyFrom: summary.lastCycle!.batch,
                                ),
                              )
                          : null,
                    ),
                  ],
                  const SizedBox(height: 16),
                  FarmTeamStrip(
                    members: summary.teamMembers,
                    currentUserId: _session.user.id,
                    onManage: _canManage ? _openTeam : null,
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'You · account'.tr,
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 10),
                  _AccountCard(
                    icon: Icons.language,
                    title: l10n?.profileLanguage ?? 'Language'.tr,
                    child: Row(
                      children: [
                        _LangChip(
                          label: l10n?.profileEnglish ?? 'English'.tr,
                          selected: _language == 'en',
                          onTap: () {
                            setState(() => _language = 'en');
                            widget.onLanguageChanged('en');
                          },
                        ),
                        const SizedBox(width: 8),
                        _LangChip(
                          label: l10n?.profileSwahili ?? 'Swahili'.tr,
                          selected: _language == 'sw',
                          onTap: () {
                            setState(() => _language = 'sw');
                            widget.onLanguageChanged('sw');
                          },
                        ),
                      ],
                    ),
                  ),
                  if (_canEdit)
                    _ProfileTile(
                      icon: Icons.notifications_outlined,
                      title: l10n?.profileMyReminders ?? 'My reminders'.tr,
                      subtitle: summary.remindersEnabled
                          ? Translator.fill('On · {time}', {
                              'time': summary.reminderClock,
                            })
                          : 'Reminders off'.tr,
                      onTap: () async {
                        await Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => ReminderSettingsScreen(
                              repositories: widget.repositories,
                              notificationService: widget.notificationService,
                            ),
                          ),
                        );
                        _reload();
                      },
                    ),
                  _ProfileTile(
                    icon: Icons.lock_outline,
                    title: 'Change PIN'.tr,
                    subtitle: 'Used to sign in on this farm'.tr,
                    onTap: _changePin,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Farm & data'.tr,
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 10),
                  _ProfileTile(
                    icon: Icons.home_work_outlined,
                    title: 'Farm settings'.tr,
                    subtitle: 'County, houses, stock, and sync code'.tr,
                    onTap: _openFarmSettings,
                  ),
                  if (_canManage)
                    _ProfileTile(
                      icon: Icons.groups_outlined,
                      title: 'Team members'.tr,
                      subtitle: Translator.fill('{n} people', {
                        'n': '${summary.teamMembers.length}',
                      }),
                      onTap: _openTeam,
                    ),
                  if (RoleAccess.showReports(_role))
                    _ProfileTile(
                      icon: Icons.bar_chart_outlined,
                      title: 'Reports'.tr,
                      subtitle: 'Harvest, survival, and cost per kg'.tr,
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => ReportsScreen(
                              repositories: widget.repositories,
                              userPreferences: widget.userPreferences,
                            ),
                          ),
                        );
                      },
                    ),
                  if (RoleAccess.showFinance(_role))
                    _ProfileTile(
                      icon: Icons.payments_outlined,
                      title: 'Finance'.tr,
                      subtitle: 'Payments, receivables, and seed purchases.'.tr,
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => FinanceScreen(
                              repositories: widget.repositories,
                              userPreferences: widget.userPreferences,
                              readOnly: !_canEdit,
                            ),
                          ),
                        );
                      },
                    ),
                  _ProfileTile(
                    icon: Icons.cloud_upload_outlined,
                    title: l10n?.profileDataBackup ?? 'Data & Backup'.tr,
                    subtitle:
                        l10n?.profileBackupDesc ?? 'Secure your data locally'.tr,
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
                  _ProfileTile(
                    icon: Icons.cloud_sync_outlined,
                    title: 'Send to CRC'.tr,
                    subtitle: summary.lastBackupAt == null
                        ? 'No cloud backup yet'.tr
                        : Translator.fill('Last backup {date}', {
                            'date': DateFormat.yMMMd(Translator.dateLocale)
                                .add_jm()
                                .format(summary.lastBackupAt!),
                          }),
                    onTap: () async {
                      await Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => CloudSyncScreen(
                            session: _session,
                            repositories: widget.repositories,
                            onDataChanged: _reload,
                          ),
                        ),
                      );
                      _reload();
                    },
                  ),
                  if (widget.onLogout != null)
                    _ProfileTile(
                      icon: Icons.logout,
                      title: l10n?.profileSignOut ?? 'Sign out'.tr,
                      iconColor: Colors.redAccent,
                      textColor: Colors.redAccent,
                      onTap: _confirmSignOut,
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

class _AccountCard extends StatelessWidget {
  const _AccountCard({
    required this.icon,
    required this.title,
    required this.child,
  });

  final IconData icon;
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: KalroColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: KalroColors.primaryGreen),
              const SizedBox(width: 10),
              Text(
                title,
                style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 10),
          child,
        ],
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
    return Expanded(
      child: Material(
        color: selected ? KalroColors.headerGreen : KalroColors.background,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w600,
                color: selected ? Colors.white : KalroColors.textDark,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ProfileTile extends StatelessWidget {
  const _ProfileTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.onTap,
    this.iconColor,
    this.textColor,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;
  final Color? iconColor;
  final Color? textColor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.antiAlias,
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          leading: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: (iconColor ?? KalroColors.primaryGreen).withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor ?? KalroColors.primaryGreen),
          ),
          title: Text(
            title,
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              color: textColor ?? KalroColors.textDark,
            ),
          ),
          subtitle: subtitle == null
              ? null
              : Text(
                  subtitle!,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: KalroColors.textMuted,
                  ),
                ),
          trailing: const Icon(Icons.chevron_right, color: KalroColors.textMuted),
          onTap: onTap,
        ),
      ),
    );
  }
}
