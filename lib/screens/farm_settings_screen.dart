import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../components/components.dart';
import '../models/farm_profile.dart';
import '../services/auth_repository.dart';
import '../services/permission_service.dart';
import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';
import 'package:kalro/l10n/translator.dart';

class FarmSettingsScreen extends StatefulWidget {
  FarmSettingsScreen({
    super.key,
    required this.session,
    this.authRepository,
    this.userPreferences,
    this.onFarmUpdated,
  });

  final UserSession session;
  final AuthRepository? authRepository;
  final UserPreferences? userPreferences;
  final ValueChanged<FarmProfile>? onFarmUpdated;

  @override
  State<FarmSettingsScreen> createState() => _FarmSettingsScreenState();
}

class _FarmSettingsScreenState extends State<FarmSettingsScreen> {
  static const _permissions = PermissionService();
  late final AuthRepository _auth;
  late final TextEditingController _orgController;
  var _saving = false;

  @override
  void initState() {
    super.initState();
    _auth = widget.authRepository ?? AuthRepository();
    _orgController = TextEditingController(text: widget.session.farm.orgName);
  }

  @override
  void dispose() {
    _orgController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_permissions.canManageUsers(widget.session.user)) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Admin access required'.tr)));
      return;
    }

    final orgName = _orgController.text.trim();
    if (orgName.isEmpty) return;

    setState(() => _saving = true);
    try {
      final updated = await _auth.updateFarm(
        widget.session.farm,
        orgName: orgName,
      );
      await widget.userPreferences?.updateProfile(orgName: orgName);
      widget.onFarmUpdated?.call(updated);
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Farm settings saved'.tr)));
      Navigator.of(context).pop();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Save failed: $error'.tr)));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM d, yyyy');
    final farm = widget.session.farm;

    return AdminPageScaffold(
      title: 'Farm settings'.tr,
      body: ListView(
        padding: EdgeInsets.all(20),
        children: [
          AdminSectionHeader(
            title: 'Organization'.tr,
            subtitle: 'This name appears on your profile and exports.'.tr,
          ),
          SizedBox(height: 16),
          TextField(
            controller: _orgController,
            enabled: !_saving,
            decoration: InputDecoration(
              labelText: 'Organization name'.tr,
              hintText: 'e.g. Kalro Sericulture Farm'.tr,
            ),
          ),
          SizedBox(height: 24),
          AdminSectionHeader(title: 'Farm details'.tr),
          SizedBox(height: 12),
          AdminInfoCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _detailRow('Farm ID', farm.id),
                Divider(height: 24),
                _detailRow('Sync code', farm.syncCode),
                Divider(height: 24),
                _detailRow('Created', dateFormat.format(farm.createdAt)),
              ],
            ),
          ),
          SizedBox(height: 24),
          KalroPrimaryButton(
            label: _saving ? 'Saving...' : 'Save changes',
            onPressed: _saving ? null : _save,
          ),
        ],
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 13,
              color: KalroColors.textMuted,
            ),
          ),
        ),
        Expanded(
          flex: 3,
          child: Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }
}
