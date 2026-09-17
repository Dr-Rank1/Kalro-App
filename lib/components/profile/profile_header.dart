import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../l10n/translator.dart';
import '../../models/farm_profile.dart';
import '../../services/user_preferences.dart';
import '../../theme/kalro_colors.dart';

class ProfileHeader extends StatelessWidget {
  const ProfileHeader({
    super.key,
    required this.session,
    required this.role,
    this.onEdit,
    this.onEditPhoto,
  });

  final UserSession session;
  final UserRole role;
  final VoidCallback? onEdit;
  final VoidCallback? onEditPhoto;

  @override
  Widget build(BuildContext context) {
    final user = session.user;
    final farm = session.farm;
    final photo = resolvedPhoto(session);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: KalroColors.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Avatar(
                name: user.farmerFacingName,
                photoPath: photo,
                onEditPhoto: onEditPhoto,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.farmerFacingName,
                      style: GoogleFonts.poppins(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        height: 1.15,
                      ),
                    ),
                    if (user.showsLoginName) ...[
                      const SizedBox(height: 2),
                      Text(
                        Translator.fill('Signed in as {name}', {
                          'name': user.username,
                        }),
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          color: KalroColors.textMuted,
                        ),
                      ),
                    ],
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        _Chip(
                          icon: user.permission.icon,
                          label: user.permission.label,
                          color: user.permission.badgeColor,
                        ),
                        _Chip(
                          icon: Icons.agriculture_outlined,
                          label: role.label,
                          color: KalroColors.headerGreen,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (onEdit != null)
                IconButton(
                  onPressed: onEdit,
                  tooltip: 'Edit profile'.tr,
                  icon: const Icon(
                    Icons.edit_outlined,
                    color: KalroColors.primaryGreen,
                  ),
                ),
            ],
          ),
          if ((user.phone ?? '').isNotEmpty) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.phone_outlined, size: 16, color: KalroColors.textMuted),
                const SizedBox(width: 8),
                Text(
                  user.phone!,
                  style: GoogleFonts.poppins(fontSize: 13, color: KalroColors.textDark),
                ),
              ],
            ),
          ],
          const SizedBox(height: 8),
          Text(
            farm.locationLine,
            style: GoogleFonts.poppins(
              fontSize: 13,
              color: KalroColors.textMuted,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            user.permission.description,
            style: GoogleFonts.poppins(
              fontSize: 12,
              color: KalroColors.textMuted,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }

  static String? resolvedPhoto(UserSession session) {
    final stored = session.user.photoPath;
    if (stored == null || stored.isEmpty) return null;
    final path = stored.startsWith('/')
        ? stored
        : '${session.farmDirectoryPath}/$stored';
    return File(path).existsSync() ? path : null;
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({
    required this.name,
    required this.photoPath,
    this.onEditPhoto,
  });

  final String name;
  final String? photoPath;
  final VoidCallback? onEditPhoto;

  @override
  Widget build(BuildContext context) {
    final initials = _initials(name);
    return Stack(
      children: [
        CircleAvatar(
          radius: 36,
          backgroundColor: KalroColors.primaryGreen.withValues(alpha: 0.12),
          backgroundImage: photoPath == null ? null : FileImage(File(photoPath!)),
          child: photoPath == null
              ? Text(
                  initials,
                  style: GoogleFonts.poppins(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: KalroColors.primaryGreen,
                  ),
                )
              : null,
        ),
        if (onEditPhoto != null)
          Positioned(
            right: 0,
            bottom: 0,
            child: GestureDetector(
              onTap: onEditPhoto,
              child: Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: KalroColors.headerGreen,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
                child: const Icon(Icons.camera_alt, size: 12, color: Colors.white),
              ),
            ),
          ),
      ],
    );
  }

  static String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return '${parts.first.substring(0, 1)}${parts.last.substring(0, 1)}'
        .toUpperCase();
  }
}

class _Chip extends StatelessWidget {
  const _Chip({
    required this.icon,
    required this.label,
    required this.color,
  });

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class FarmIdentityCard extends StatelessWidget {
  const FarmIdentityCard({
    super.key,
    required this.farm,
    this.onOpen,
  });

  final FarmProfile farm;
  final VoidCallback? onOpen;

  Future<void> _copySync(BuildContext context) async {
    await Clipboard.setData(ClipboardData(text: farm.syncCode));
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Sync code copied'.tr)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final houses = farm.houseCount;
    final species = farm.primarySpecies;
    final notes = farm.notes?.trim();
    final phone = farm.phone?.trim();
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: Ink(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: KalroColors.divider),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            InkWell(
              onTap: onOpen,
              borderRadius: BorderRadius.circular(12),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: KalroColors.leaf.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.home_work_outlined, color: KalroColors.leaf),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          farm.orgName,
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                        Text(
                          farm.county?.trim().isNotEmpty == true
                              ? farm.county!
                              : 'Add county and rearing houses'.tr,
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: KalroColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (onOpen != null)
                    const Icon(Icons.chevron_right, color: KalroColors.textLight),
                ],
              ),
            ),
              if (phone != null && phone.isNotEmpty) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.phone_outlined, size: 14, color: KalroColors.textMuted),
                    const SizedBox(width: 6),
                    Text(
                      phone,
                      style: GoogleFonts.poppins(fontSize: 13),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _Fact(
                    label: 'Sync code'.tr,
                    value: farm.syncCode,
                    onCopy: () => _copySync(context),
                  ),
                  _Fact(
                    label: 'Houses'.tr,
                    value: houses == null ? '—' : '$houses',
                  ),
                  _Fact(
                    label: 'Main stock'.tr,
                    value: species?.label ?? 'Bombyx & Eri'.tr,
                  ),
                ],
              ),
              if (notes != null && notes.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  notes,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: KalroColors.textMuted,
                    height: 1.35,
                  ),
                ),
              ],
            ],
          ),
        ),
      );
  }
}

class _Fact extends StatelessWidget {
  const _Fact({
    required this.label,
    required this.value,
    this.onCopy,
  });

  final String label;
  final String value;
  final VoidCallback? onCopy;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: KalroColors.background,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.poppins(fontSize: 10, color: KalroColors.textMuted),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                value,
                style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              if (onCopy != null)
                GestureDetector(
                  onTap: onCopy,
                  child: const Padding(
                    padding: EdgeInsets.only(left: 6),
                    child: Icon(Icons.copy, size: 14, color: KalroColors.textMuted),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
