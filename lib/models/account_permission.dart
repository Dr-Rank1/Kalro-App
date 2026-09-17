import 'package:flutter/material.dart';

import '../l10n/translator.dart';
import '../theme/kalro_colors.dart';

enum AccountPermission {
  admin('Farm owner'),
  caretaker('Farm worker'),
  viewer('View only');

  const AccountPermission(this._label);

  final String _label;

  String get label => _label.tr;

  bool get canManageUsers => this == AccountPermission.admin;

  bool get canEditData => this != AccountPermission.viewer;

  bool get canRestoreBackup => this == AccountPermission.admin;

  bool get canSyncCloud => this != AccountPermission.viewer;

  String get description => switch (this) {
        AccountPermission.admin =>
          'You can run this farm, add people, and restore backups.'.tr,
        AccountPermission.caretaker =>
          'You can record lots, feeding, and harvests.'.tr,
        AccountPermission.viewer =>
          'You can look at farm records. You cannot change them.'.tr,
      };

  IconData get icon => switch (this) {
        AccountPermission.admin => Icons.home_outlined,
        AccountPermission.caretaker => Icons.agriculture_outlined,
        AccountPermission.viewer => Icons.visibility_outlined,
      };

  Color get badgeColor => switch (this) {
        AccountPermission.admin => KalroColors.headerGreen,
        AccountPermission.caretaker => KalroColors.primaryGreen,
        AccountPermission.viewer => KalroColors.textMuted,
      };
}
