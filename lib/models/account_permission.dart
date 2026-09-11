import 'package:flutter/material.dart';

import '../theme/kalro_colors.dart';

enum AccountPermission {
  admin('Admin'),
  caretaker('Caretaker'),
  viewer('Viewer');

  const AccountPermission(this.label);

  final String label;

  bool get canManageUsers => this == AccountPermission.admin;

  bool get canEditData => this != AccountPermission.viewer;

  bool get canRestoreBackup => this == AccountPermission.admin;

  bool get canSyncCloud => this != AccountPermission.viewer;

  String get description => switch (this) {
        AccountPermission.admin =>
          'Full access including team management, backups, and cloud sync.',
        AccountPermission.caretaker =>
          'Can record batches, logs, payments, and purchases. Cannot manage users.',
        AccountPermission.viewer => 'Read-only access to farm data and reports.',
      };

  IconData get icon => switch (this) {
        AccountPermission.admin => Icons.admin_panel_settings_outlined,
        AccountPermission.caretaker => Icons.agriculture_outlined,
        AccountPermission.viewer => Icons.visibility_outlined,
      };

  Color get badgeColor => switch (this) {
        AccountPermission.admin => KalroColors.headerGreen,
        AccountPermission.caretaker => KalroColors.primaryGreen,
        AccountPermission.viewer => KalroColors.textMuted,
      };
}
