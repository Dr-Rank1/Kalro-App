import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../components/components.dart';
import '../models/farm_profile.dart';
import '../models/species.dart';
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
  late final TextEditingController _countyController;
  late final TextEditingController _phoneController;
  late final TextEditingController _housesController;
  late final TextEditingController _notesController;
  Species? _species;
  var _saving = false;

  @override
  void initState() {
    super.initState();
    _auth = widget.authRepository ?? AuthRepository();
    final farm = widget.session.farm;
    _orgController = TextEditingController(text: farm.orgName);
    _countyController = TextEditingController(text: farm.county ?? '');
    _phoneController = TextEditingController(text: farm.phone ?? '');
    _housesController = TextEditingController(
      text: farm.houseCount == null ? '' : '${farm.houseCount}',
    );
    _notesController = TextEditingController(text: farm.notes ?? '');
    _species = farm.primarySpecies;
  }

  @override
  void dispose() {
    _orgController.dispose();
    _countyController.dispose();
    _phoneController.dispose();
    _housesController.dispose();
    _notesController.dispose();
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
      final houses = int.tryParse(_housesController.text.trim());
      final county = _countyController.text.trim();
      final phone = _phoneController.text.trim();
      final notes = _notesController.text.trim();
      final updated = FarmProfile(
        id: widget.session.farm.id,
        orgName: orgName,
        syncCode: widget.session.farm.syncCode,
        createdAt: widget.session.farm.createdAt,
        county: county.isEmpty ? null : county,
        phone: phone.isEmpty ? null : phone,
        houseCount: houses,
        primarySpecies: _species,
        notes: notes.isEmpty ? null : notes,
      );
      await _auth.updateFarm(updated);
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

  Future<void> _copySyncCode() async {
    await Clipboard.setData(
      ClipboardData(text: widget.session.farm.syncCode),
    );
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Sync code copied'.tr)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat.yMMMd(Translator.dateLocale);
    final farm = widget.session.farm;
    final canEdit = _permissions.canManageUsers(widget.session.user);

    return AdminPageScaffold(
      title: 'Farm settings'.tr,
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          AdminSectionHeader(
            title: 'Organization'.tr,
            subtitle: 'This name appears on your profile, backups, and reports.'.tr,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _orgController,
            enabled: !_saving && canEdit,
            decoration: InputDecoration(
              labelText: 'Farm / organization'.tr,
              hintText: 'e.g. Kalro Sericulture Farm'.tr,
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _countyController,
            enabled: !_saving && canEdit,
            decoration: InputDecoration(
              labelText: 'County / location'.tr,
              hintText: 'e.g. Kiambu'.tr,
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _phoneController,
            enabled: !_saving && canEdit,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              labelText: 'Farm phone (optional)'.tr,
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _housesController,
            enabled: !_saving && canEdit,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: InputDecoration(
              labelText: 'Rearing houses'.tr,
              hintText: 'How many houses or racks'.tr,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Main stock'.tr,
            style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(
                label: Text('Bombyx & Eri'.tr),
                selected: _species == null,
                onSelected: !canEdit || _saving
                    ? null
                    : (_) => setState(() => _species = null),
              ),
              ChoiceChip(
                label: Text(Species.bombyx.label),
                selected: _species == Species.bombyx,
                onSelected: !canEdit || _saving
                    ? null
                    : (_) => setState(() => _species = Species.bombyx),
              ),
              ChoiceChip(
                label: Text(Species.eri.label),
                selected: _species == Species.eri,
                onSelected: !canEdit || _saving
                    ? null
                    : (_) => setState(() => _species = Species.eri),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _notesController,
            enabled: !_saving && canEdit,
            maxLines: 3,
            decoration: InputDecoration(
              labelText: 'Notes (optional)'.tr,
              hintText: 'Leaf source, CRC, seed unit…'.tr,
            ),
          ),
          const SizedBox(height: 24),
          AdminSectionHeader(title: 'Farm details'.tr),
          const SizedBox(height: 12),
          AdminInfoCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _detailRow('Farm ID'.tr, farm.id),
                const Divider(height: 24),
                Row(
                  children: [
                    Expanded(child: _detailRow('Sync code'.tr, farm.syncCode)),
                    IconButton(
                      onPressed: _copySyncCode,
                      tooltip: 'Copy'.tr,
                      icon: const Icon(Icons.copy, size: 18),
                    ),
                  ],
                ),
                const Divider(height: 24),
                _detailRow('Created'.tr, dateFormat.format(farm.createdAt)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          if (canEdit)
            KalroPrimaryButton(
              label: _saving ? 'Saving...'.tr : 'Save changes'.tr,
              onPressed: _saving ? null : _save,
            )
          else
            Text(
              'Ask an admin to change farm name, county, or houses.'.tr,
              style: GoogleFonts.poppins(
                fontSize: 13,
                color: KalroColors.textMuted,
              ),
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
