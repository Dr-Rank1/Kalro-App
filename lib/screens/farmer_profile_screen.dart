import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../models/batch.dart';
import '../models/batch_status.dart';
import '../services/auth_repository.dart';
import '../models/app_user.dart';
import '../models/cocoon_harvest.dart';
import '../models/farm_profile.dart';
import '../services/app_repositories.dart';
import '../services/notification_service.dart';
import '../services/permission_service.dart';
import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';
import 'reminder_settings_screen.dart';
import '../l10n/app_localizations.dart';
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
  });

  final AppRepositories repositories;
  final UserPreferences userPreferences;
  final UserSession session;
  final NotificationService? notificationService;
  final VoidCallback? onLogout;
  final void Function(String) onLanguageChanged;

  @override
  State<FarmerProfileScreen> createState() => _FarmerProfileScreenState();
}

class _FarmerProfileScreenState extends State<FarmerProfileScreen> {
  static const _permissions = PermissionService();

  Future<_ProfileData>? _dataFuture;
  String _selectedLanguage = 'en';
  AppUser? _currentUser;

  @override
  void initState() {
    super.initState();
    _dataFuture = _loadData();
    _loadLanguage();
  }

  Future<_ProfileData> _loadData() async {
    final allBatches = await widget.repositories.batches.getAll();
    final allHarvests = await widget.repositories.cocoonHarvests.getAll();
    final harvestedBatches = allBatches.where((b) => b.status == BatchStatus.harvested).toList();
    return _ProfileData(harvestedBatches, allHarvests);
  }

  Future<void> _loadLanguage() async {
    final lang = await widget.userPreferences.getLanguage();
    if (lang != null && (lang.toLowerCase().startsWith('sw') || lang.toLowerCase() == 'swahili')) {
      setState(() => _selectedLanguage = 'sw');
    } else {
      setState(() => _selectedLanguage = 'en');
    }
  }

  bool get _canEdit => _permissions.canEditData(widget.session.user);

  Future<void> _editName() async {
    final user = _currentUser ?? widget.session.user;
    final currentName = user.displayName;
    final nameController = TextEditingController(text: currentName);
    final l10n = AppLocalizations.of(context);
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n?.profileEditName ?? 'Edit Name'),
        content: TextField(
          controller: nameController,
          decoration: InputDecoration(labelText: 'Display name'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text('Cancel'.tr)),
          TextButton(onPressed: () => Navigator.pop(context, true), child: Text('Save'.tr)),
        ],
      ),
    );
    if (saved != true || !mounted) return;
    
    final updatedUser = user.copyWith(displayName: nameController.text);
    await AuthRepository().updateUser(updatedUser);
    
    setState(() {
      _currentUser = updatedUser;
    });
  }

  void _openReminders() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ReminderSettingsScreen(
          repositories: widget.repositories,
          notificationService: widget.notificationService,
        ),
      ),
    );
  }

  void _changeLanguage(String langCode) {
    setState(() => _selectedLanguage = langCode);
    widget.onLanguageChanged(langCode);
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.session.user;
    final l10n = AppLocalizations.of(context);

    return KalroBackground(
      child: SafeArea(
        child: FutureBuilder<_ProfileData>(
          future: _dataFuture ?? Future.value(_ProfileData([], [])),
          builder: (context, snapshot) {
            final data = snapshot.data;
            final harvestedBatches = data?.harvestedBatches ?? [];
            final harvests = data?.harvests ?? [];
            
            // Calculate Stats
            final totalCycles = harvestedBatches.length;
            double totalYield = 0;
            double totalSurvival = 0;
            int survivalCount = 0;
            
            for (var batch in harvestedBatches) {
              final batchHarvests = harvests.where((h) => h.batchId == batch.id).toList();
              if (batchHarvests.isNotEmpty) {
                final h = batchHarvests.first;
                totalYield += (h.totalWeightGrams / 1000.0);
                if (batch.eggCount > 0) {
                  totalSurvival += (h.cocoonCount / batch.eggCount);
                  survivalCount++;
                }
              }
            }
            
            final avgSurvival = survivalCount > 0 ? (totalSurvival / survivalCount * 100) : 0.0;

            return ListView(
              padding: EdgeInsets.fromLTRB(20, 20, 20, 88),
              children: [
                // Hero Card
                Container(
                  padding: EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: const [
                      BoxShadow(
                        color: Colors.black12,
                        blurRadius: 10,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          CircleAvatar(
                            radius: 36,
                            backgroundColor: KalroColors.primaryGreen.withValues(alpha: 0.15),
                            child: Text(
                              _initials(user.displayName),
                              style: GoogleFonts.poppins(
                                fontSize: 24,
                                fontWeight: FontWeight.w700,
                                color: KalroColors.primaryGreen,
                              ),
                            ),
                          ),
                          SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  user.displayName,
                                  style: GoogleFonts.poppins(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w700,
                                    color: KalroColors.textDark,
                                  ),
                                ),
                                Text(
                                  '@${user.username}',
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    color: KalroColors.textMuted,
                                  ),
                                ),
                                SizedBox(height: 4),
                                Container(
                                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: KalroColors.primaryGreen.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    widget.session.farm.orgName,
                                    style: GoogleFonts.poppins(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: KalroColors.primaryGreen,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: _editName,
                            icon: Icon(Icons.edit_outlined, color: KalroColors.primaryGreen),
                          ),
                        ],
                      ),
                      SizedBox(height: 24),
                      // Stats Row
                      Row(
                        children: [
                          Expanded(
                            child: _StatItem(
                              value: '$totalCycles',
                              label: l10n?.profileTotalCycles ?? 'Total Cycles',
                              icon: Icons.loop,
                            ),
                          ),
                          Container(width: 1, height: 40, color: KalroColors.divider),
                          Expanded(
                            child: _StatItem(
                              value: '${totalYield.toStringAsFixed(1)} kg',
                              label: l10n?.profileLifetimeYield ?? 'Lifetime Yield',
                              icon: Icons.scale_outlined,
                            ),
                          ),
                          Container(width: 1, height: 40, color: KalroColors.divider),
                          Expanded(
                            child: _StatItem(
                              value: '${avgSurvival.toStringAsFixed(1)}%',
                              label: l10n?.profileAvgSurvival ?? 'Avg Survival',
                              icon: Icons.health_and_safety_outlined,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                SizedBox(height: 24),
                
                // Settings & Tools
                Text(
                  'Settings & Tools',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: KalroColors.textDark,
                  ),
                ),
                SizedBox(height: 12),
                
                // Language Card
                _ProfileCardTile(
                  icon: Icons.language,
                  title: l10n?.profileLanguage ?? 'Language',
                  trailing: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedLanguage,
                      items: [
                        DropdownMenuItem(
                          value: 'en',
                          child: Text(l10n?.profileEnglish ?? 'English', style: GoogleFonts.poppins()),
                        ),
                        DropdownMenuItem(
                          value: 'sw',
                          child: Text(l10n?.profileSwahili ?? 'Swahili', style: GoogleFonts.poppins()),
                        ),
                      ],
                      onChanged: (val) {
                        if (val != null) _changeLanguage(val);
                      },
                    ),
                  ),
                ),
                SizedBox(height: 12),

                if (_canEdit) ...[
                  _ProfileCardTile(
                    icon: Icons.notifications_outlined,
                    title: l10n?.profileMyReminders ?? 'My reminders',
                    onTap: _openReminders,
                  ),
                  SizedBox(height: 12),
                ],

                // Backup Card
                _ProfileCardTile(
                  icon: Icons.cloud_upload_outlined,
                  title: l10n?.profileDataBackup ?? 'Data & Backup',
                  subtitle: l10n?.profileBackupDesc ?? 'Secure your data locally',
                  trailing: ElevatedButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(l10n?.profileBackupDesc ?? 'Backup successful')),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: KalroColors.primaryGreen.withValues(alpha: 0.2),
                      foregroundColor: KalroColors.primaryGreen,
                      elevation: 0,
                    ),
                    child: Text(l10n?.profileBackupNow ?? 'Backup'),
                  ),
                ),
                SizedBox(height: 12),

                _ProfileCardTile(
                  icon: Icons.menu_book_outlined,
                  title: l10n?.profileKnowledgeBase ?? 'Kalro Knowledge Base',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Field guides coming soon'.tr)),
                    );
                  },
                ),
                SizedBox(height: 12),

                if (widget.onLogout != null)
                  _ProfileCardTile(
                    icon: Icons.logout,
                    title: l10n?.profileSignOut ?? 'Sign out',
                    iconColor: Colors.redAccent,
                    textColor: Colors.redAccent,
                    onTap: widget.onLogout!,
                  ),
              ],
            );
          },
        ),
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return '${parts.first.substring(0, 1)}${parts.last.substring(0, 1)}'.toUpperCase();
  }
}

class _StatItem extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;

  const _StatItem({required this.value, required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: KalroColors.primaryGreen, size: 20),
        SizedBox(height: 8),
        Text(
          value,
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: KalroColors.textDark,
          ),
        ),
        Text(
          label,
          textAlign: TextAlign.center,
          style: GoogleFonts.poppins(
            fontSize: 11,
            color: KalroColors.textMuted,
          ),
        ),
      ],
    );
  }
}

class _ProfileCardTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;
  final Widget? trailing;
  final Color? iconColor;
  final Color? textColor;

  const _ProfileCardTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.onTap,
    this.trailing,
    this.iconColor,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        leading: Container(
          padding: EdgeInsets.all(10),
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
        subtitle: subtitle != null
            ? Text(subtitle!, style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted))
            : null,
        trailing: trailing ?? (onTap != null ? Icon(Icons.chevron_right, color: KalroColors.textMuted) : null),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}


class _ProfileData {
  final List<Batch> harvestedBatches;
  final List<CocoonHarvest> harvests;
  _ProfileData(this.harvestedBatches, this.harvests);
}
