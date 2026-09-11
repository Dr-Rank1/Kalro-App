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

class DataManagementScreen extends StatefulWidget {
  const DataManagementScreen({
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
        SnackBar(content: Text('Backup saved to ${file.path}')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Backup failed: $error')),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _importBackup() async {
    if (!_permissions.canRestoreBackup(widget.session.user)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Admin access required to restore backups')),
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
        title: const Text('Restore backup?'),
        content: const Text(
          'This replaces all local farm data with the backup file. Continue?',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Restore')),
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
        const SnackBar(content: Text('Backup restored successfully')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Restore failed: $error')),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canRestore = _permissions.canRestoreBackup(widget.session.user);

    return AdminPageScaffold(
      title: 'Data & backup',
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const AdminSectionHeader(
            title: 'Full farm backup',
            subtitle: 'Export batches, logs, payments, inventory, and settings as JSON.',
          ),
          const SizedBox(height: 16),
          AdminInfoCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.info_outline, size: 18, color: KalroColors.headerGreen),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Backups are saved to your Documents/kalro_exports folder.',
                        style: GoogleFonts.poppins(fontSize: 12, color: KalroColors.textMuted),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          KalroPrimaryButton(
            label: _busy ? 'Working...' : 'Export backup (JSON)',
            onPressed: _busy ? null : _exportBackup,
          ),
          const SizedBox(height: 24),
          AdminSectionHeader(
            title: 'Restore',
            subtitle: canRestore
                ? 'Replace local data with a backup file from another device.'
                : 'Admin access required to restore backups.',
          ),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: _busy || !canRestore ? null : _importBackup,
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
              side: const BorderSide(color: KalroColors.headerGreen),
            ),
            child: const Text('Restore from backup'),
          ),
        ],
      ),
    );
  }
}
