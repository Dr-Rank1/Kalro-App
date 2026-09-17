import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../components/components.dart';
import '../models/farm_profile.dart';
import '../models/sync_settings.dart';
import '../services/app_repositories.dart';
import '../services/cloud_sync_service.dart';
import '../theme/kalro_colors.dart';
import 'package:kalro/l10n/translator.dart';

class CloudSyncScreen extends StatefulWidget {
  CloudSyncScreen({
    super.key,
    required this.session,
    required this.repositories,
    this.onDataChanged,
    this.cloudSyncService,
  });

  final UserSession session;
  final AppRepositories repositories;
  final VoidCallback? onDataChanged;
  final CloudSyncService? cloudSyncService;

  @override
  State<CloudSyncScreen> createState() => _CloudSyncScreenState();
}

class _CloudSyncScreenState extends State<CloudSyncScreen> {
  late final CloudSyncService _sync;
  late Future<SyncSettings> _settingsFuture;
  final _serverController = TextEditingController();
  var _busy = false;

  @override
  void initState() {
    super.initState();
    _sync = widget.cloudSyncService ?? CloudSyncService();
    _reload();
  }

  @override
  void dispose() {
    _serverController.dispose();
    super.dispose();
  }

  void _reload() {
    setState(() {
      _settingsFuture = _sync.loadSyncMeta(widget.session.farm).then((
        settings,
      ) {
        _serverController.text = settings.serverUrl ?? '';
        return settings;
      });
    });
  }

  Future<void> _saveServerUrl() async {
    await _sync.saveServerUrl(widget.session.farm, _serverController.text);
    _reload();
  }

  Future<void> _upload(SyncSettings settings) async {
    setState(() => _busy = true);
    try {
      await _saveServerUrl();
      final result = await _sync.upload(
        repositories: widget.repositories,
        farm: widget.session.farm,
        serverUrl: _serverController.text,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(result.message)));
    } finally {
      if (mounted) {
        setState(() => _busy = false);
        _reload();
      }
    }
  }

  Future<void> _download(SyncSettings settings) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Download cloud data?'.tr),
        content: Text(
          'This replaces local farm data with the cloud snapshot. Continue?'.tr,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel'.tr),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Download'.tr),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _busy = true);
    try {
      await _saveServerUrl();
      var result = await _sync.download(
        repositories: widget.repositories,
        farm: widget.session.farm,
        serverUrl: _serverController.text,
      );
      if (!mounted) return;
      if (result.wouldOverwriteNewerLocal) {
        final replace = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: Text('Newer data on this phone'.tr),
            content: Text(
              'This phone already uploaded a newer snapshot. Replace it with the cloud copy?'
                  .tr,
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: Text('Cancel'.tr),
              ),
              TextButton(
                onPressed: () => Navigator.pop(context, true),
                child: Text('Replace'.tr),
              ),
            ],
          ),
        );
        if (replace == true) {
          result = await _sync.download(
            repositories: widget.repositories,
            farm: widget.session.farm,
            serverUrl: _serverController.text,
            overwriteNewerLocal: true,
          );
        } else {
          return;
        }
      }
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(result.message)));
      if (result.success) widget.onDataChanged?.call();
    } finally {
      if (mounted) {
        setState(() => _busy = false);
        _reload();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM d, yyyy · HH:mm');

    return AdminPageScaffold(
      title: 'Cloud sync'.tr,
      body: FutureBuilder<SyncSettings>(
        future: _settingsFuture,
        builder: (context, snapshot) {
          final settings = snapshot.data;
          if (settings == null &&
              snapshot.connectionState != ConnectionState.done) {
            return Center(child: CircularProgressIndicator());
          }

          return ListView(
            padding: EdgeInsets.all(20),
            children: [
              AdminSectionHeader(
                title: 'Farm sync code'.tr,
                subtitle: 'Share this code with team devices on your farm.'.tr,
              ),
              SizedBox(height: 12),
              AdminInfoCard(
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        widget.session.farm.syncCode,
                        style: GoogleFonts.poppins(
                          fontSize: 32,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () {
                        Clipboard.setData(
                          ClipboardData(text: widget.session.farm.syncCode),
                        );
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Sync code copied'.tr)),
                        );
                      },
                      icon: Icon(Icons.copy),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 24),
              AdminSectionHeader(
                title: 'Sync server'.tr,
                subtitle: 'Optional HTTP endpoint for multi-device sync.'.tr,
              ),
              SizedBox(height: 12),
              TextField(
                controller: _serverController,
                decoration: InputDecoration(
                  labelText: 'Server URL'.tr,
                  hintText: 'https://your-server.example.com/api',
                ),
                enabled: !_busy,
              ),
              SizedBox(height: 8),
              Text(
                'Leave empty to use the built-in local cloud folder on this device.'
                    .tr,
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  color: KalroColors.textMuted,
                ),
              ),
              if (settings != null &&
                  (settings.lastUploadedAt != null ||
                      settings.lastDownloadedAt != null)) ...[
                SizedBox(height: 20),
                AdminInfoCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Sync history'.tr,
                        style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                      ),
                      if (settings.lastUploadedAt != null) ...[
                        SizedBox(height: 8),
                        Text(
                          'Last upload: ${dateFormat.format(settings.lastUploadedAt!)}',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: KalroColors.textMuted,
                          ),
                        ),
                      ],
                      if (settings.lastDownloadedAt != null) ...[
                        SizedBox(height: 4),
                        Text(
                          'Last download: ${dateFormat.format(settings.lastDownloadedAt!)}',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: KalroColors.textMuted,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
              SizedBox(height: 24),
              KalroPrimaryButton(
                label: _busy ? 'Uploading...' : 'Upload to cloud',
                onPressed: _busy || settings == null
                    ? null
                    : () => _upload(settings),
              ),
              SizedBox(height: 12),
              OutlinedButton(
                onPressed: _busy || settings == null
                    ? null
                    : () => _download(settings),
                style: OutlinedButton.styleFrom(
                  minimumSize: Size.fromHeight(48),
                  side: BorderSide(color: KalroColors.headerGreen),
                ),
                child: Text(_busy ? 'Working...' : 'Download from cloud'),
              ),
            ],
          );
        },
      ),
    );
  }
}
