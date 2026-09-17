import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../models/farm_profile.dart';
import '../services/app_repositories.dart';
import '../services/backup_service.dart';
import '../services/permission_service.dart';
import '../theme/kalro_colors.dart';
import 'package:kalro/l10n/translator.dart';

class DataManagementScreen extends StatefulWidget {
  DataManagementScreen({
    super.key,
    required this.repositories,
    required this.session,
    this.onDataChanged,
  });

  final AppRepositories repositories;
  final UserSession session;
  final VoidCallback? onDataChanged;

  @override
  State<DataManagementScreen> createState() => _DataManagementScreenState();
}

class _DataManagementScreenState extends State<DataManagementScreen> {
  static const _backupService = BackupService();
  static const _permissions = PermissionService();
  var _busy = false;

  Future<void> _exportBackup() async {
    setState(() => _busy = true);
    try {
      final file = await _backupService.exportBackup(widget.repositories);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Backup saved to ${file.path}'.tr)),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Backup failed: $error'.tr)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _importBackup() async {
    if (!_permissions.canRestoreBackup(widget.session.user)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Admin access required to restore backups'.tr)),
      );
      return;
    }

    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['json'],
    );
    if (result == null || result.files.single.path == null) return;

    if (!mounted) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Restore backup?'.tr),
        content: Text(
          'This replaces all local farm data with the backup file. Continue?'
              .tr,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel'.tr),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Restore'.tr),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _busy = true);
    try {
      await _backupService.importBackup(
        widget.repositories,
        File(result.files.single.path!),
      );
      widget.onDataChanged?.call();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Backup restored successfully'.tr)),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Restore failed: $error'.tr)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canRestore = _permissions.canRestoreBackup(widget.session.user);

    return AdminPageScaffold(
      title: 'Data & backup'.tr,
      body: ListView(
        padding: EdgeInsets.all(20),
        children: [
          AdminSectionHeader(
            title: 'Full farm backup'.tr,
            subtitle:
                'Export batches, logs, payments, inventory, and settings as JSON.'
                    .tr,
          ),
          SizedBox(height: 16),
          AdminInfoCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.info_outline,
                      size: 18,
                      color: KalroColors.headerGreen,
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Backups are saved to your Documents/kalro_exports folder.'
                            .tr,
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: KalroColors.textMuted,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          SizedBox(height: 24),
          KalroPrimaryButton(
            label: _busy ? 'Working...' : 'Export backup (JSON)',
            onPressed: _busy ? null : _exportBackup,
          ),
          SizedBox(height: 24),
          AdminSectionHeader(
            title: 'Restore'.tr,
            subtitle: canRestore
                ? 'Replace local data with a backup file from another device.'
                : 'Admin access required to restore backups.',
          ),
          SizedBox(height: 16),
          OutlinedButton(
            onPressed: _busy || !canRestore ? null : _importBackup,
            style: OutlinedButton.styleFrom(
              minimumSize: Size.fromHeight(48),
              side: BorderSide(color: KalroColors.headerGreen),
            ),
            child: Text('Restore from backup'.tr),
          ),
        ],
      ),
    );
  }
}
