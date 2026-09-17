import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:kalro/l10n/translator.dart';

import '../models/farm_profile.dart';
import '../theme/kalro_colors.dart';
import 'auth_repository.dart';

class ProfilePhotoService {
  ProfilePhotoService({ImagePicker? picker}) : _picker = picker ?? ImagePicker();

  final ImagePicker _picker;

  Future<ImageSource?> chooseSource(BuildContext context) {
    return showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: KalroColors.divider,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 16),
                ListTile(
                  leading: const Icon(Icons.photo_camera_outlined),
                  title: Text('Take photo'.tr),
                  onTap: () => Navigator.pop(context, ImageSource.camera),
                ),
                ListTile(
                  leading: const Icon(Icons.photo_library_outlined),
                  title: Text('Choose from gallery'.tr),
                  onTap: () => Navigator.pop(context, ImageSource.gallery),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<UserSession?> save({
    required UserSession session,
    required AuthRepository auth,
    required ImageSource source,
  }) async {
    final picked = await _picker.pickImage(
      source: source,
      imageQuality: 70,
      maxWidth: 800,
    );
    if (picked == null) return null;
    final dir = Directory('${session.farmDirectoryPath}/avatars');
    await dir.create(recursive: true);
    final relative = 'avatars/${session.user.id}.jpg';
    await File(picked.path).copy('${session.farmDirectoryPath}/$relative');
    final updated = session.user.copyWith(photoPath: relative);
    await auth.updateUser(updated);
    return session.copyWith(user: updated);
  }
}
