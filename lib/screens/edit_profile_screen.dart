import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../models/farm_profile.dart';
import '../services/auth_repository.dart';
import '../services/profile_photo_service.dart';
import '../services/user_preferences.dart';
import '../theme/kalro_colors.dart';
import 'package:kalro/l10n/translator.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({
    super.key,
    required this.session,
    required this.userPreferences,
    this.authRepository,
    this.onSessionUpdated,
  });

  final UserSession session;
  final UserPreferences userPreferences;
  final AuthRepository? authRepository;
  final ValueChanged<UserSession>? onSessionUpdated;

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late final AuthRepository _auth;
  late final TextEditingController _name;
  late final TextEditingController _phone;
  final _photos = ProfilePhotoService();
  late UserRole _role;
  late UserSession _session;
  var _saving = false;

  @override
  void initState() {
    super.initState();
    _auth = widget.authRepository ?? AuthRepository.forSession(widget.session);
    _session = widget.session;
    _name = TextEditingController(text: _session.user.farmerFacingName);
    _phone = TextEditingController(text: _session.user.phone ?? '');
    widget.userPreferences.getRole().then((role) {
      if (mounted) setState(() => _role = role);
    });
    _role = UserRole.swr;
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    final source = await _photos.chooseSource(context);
    if (source == null) return;
    try {
      final updated = await _photos.save(
        session: _session,
        auth: _auth,
        source: source,
      );
      if (updated == null || !mounted) return;
      _session = updated;
      widget.onSessionUpdated?.call(_session);
      setState(() {});
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not update photo: $error'.tr)),
      );
    }
  }

  Future<void> _save() async {
    final name = _name.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Enter your name'.tr)),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final phone = _phone.text.trim();
      final updated = _session.user.copyWith(
        displayName: name,
        phone: phone,
        clearPhone: phone.isEmpty,
      );
      await _auth.updateUser(updated);
      await widget.userPreferences.updateProfile(name: name);
      await widget.userPreferences.setRole(_role);
      _session = _session.copyWith(user: updated);
      widget.onSessionUpdated?.call(_session);
      if (!mounted) return;
      Navigator.of(context).pop(_session);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Save failed: $error'.tr)),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _confirmDeleteProfile() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete profile?'.tr),
        content: Text(
          'Are you sure you want to delete profile "${_session.user.farmerFacingName}" from this device? This cannot be undone.'.tr,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('Cancel'.tr),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: Text('Delete'.tr),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _saving = true);
    try {
      await _auth.deleteUser(_session.user);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Profile deleted'.tr)),
      );
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Delete failed: $e'.tr)),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KalroColors.headerGreen,
      appBar: AppBar(title: Text('Edit profile'.tr)),
      body: Container(
        decoration: const BoxDecoration(
          color: KalroColors.background,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: KalroBackground(
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Center(
                child: ProfileHeader(
                  session: _session,
                  role: _role,
                  onEditPhoto: _pickPhoto,
                ),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: _name,
                enabled: !_saving,
                textCapitalization: TextCapitalization.words,
                decoration: InputDecoration(
                  labelText: 'Display name'.tr,
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _phone,
                enabled: !_saving,
                keyboardType: TextInputType.phone,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[0-9+\s-]')),
                ],
                decoration: InputDecoration(
                  labelText: 'Phone (optional)'.tr,
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'My field role'.tr,
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'This is how you work on this farm — not your login PIN role.'.tr,
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  color: KalroColors.textMuted,
                ),
              ),
              const SizedBox(height: 10),
              ...UserRole.values.map((role) {
                final selected = _role == role;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Material(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    child: InkWell(
                      onTap: _saving ? null : () => setState(() => _role = role),
                      borderRadius: BorderRadius.circular(14),
                      child: Ink(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: selected
                                ? KalroColors.headerGreen
                                : KalroColors.divider,
                            width: selected ? 1.6 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              selected
                                  ? Icons.radio_button_checked
                                  : Icons.radio_button_off,
                              color: selected
                                  ? KalroColors.headerGreen
                                  : KalroColors.textMuted,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    role.label,
                                    style: GoogleFonts.poppins(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  Text(
                                    role.blurb,
                                    style: GoogleFonts.poppins(
                                      fontSize: 12,
                                      color: KalroColors.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }),
              const SizedBox(height: 12),
              KalroPrimaryButton(
                label: _saving ? 'Saving...'.tr : 'Save profile'.tr,
                onPressed: _saving ? null : _save,
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                icon: const Icon(Icons.delete_outline, color: Colors.red, size: 18),
                label: Text('Delete profile'.tr, style: const TextStyle(color: Colors.red)),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                  side: const BorderSide(color: Colors.red),
                ),
                onPressed: _saving ? null : _confirmDeleteProfile,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
