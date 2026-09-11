import '../models/account_permission.dart';
import '../models/app_user.dart';

class PermissionService {
  const PermissionService();

  bool canEditData(AppUser? user) => user?.permission.canEditData ?? false;

  bool canManageUsers(AppUser? user) => user?.permission.canManageUsers ?? false;

  bool canRestoreBackup(AppUser? user) => user?.permission.canRestoreBackup ?? false;

  bool canSyncCloud(AppUser? user) => user?.permission.canSyncCloud ?? false;

  bool canAccessManagementPortal(AppUser? user) =>
      user?.permission == AccountPermission.admin;

  bool canAccessFieldPortal(AppUser? user) =>
      user != null && user.permission != AccountPermission.admin;
}
