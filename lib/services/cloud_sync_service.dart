import '../utils/file_utils.dart';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

import '../models/farm_profile.dart';
import '../models/sync_settings.dart';
import 'app_repositories.dart';
import 'auth_repository.dart';
import 'backup_service.dart';

/// Uploads and downloads farm backups using a sync code.
/// Uses a shared local cloud folder and an optional HTTP server URL.
class CloudSyncService {
  CloudSyncService({
    BackupService? backupService,
    AuthRepository? authRepository,
    http.Client? httpClient,
    Directory? localCloudDirectory,
  })  : _backupService = backupService ?? const BackupService(),
        _authRepository = authRepository ?? AuthRepository(),
        _http = httpClient ?? http.Client(),
        _localCloudDirectory = localCloudDirectory;

  final BackupService _backupService;
  final AuthRepository _authRepository;
  final http.Client _http;
  final Directory? _localCloudDirectory;

  Future<Directory> _localCloudRoot() async {
    if (_localCloudDirectory != null) {
      if (!await _localCloudDirectory.exists()) {
        await _localCloudDirectory.create(recursive: true);
      }
      return _localCloudDirectory;
    }
    final docs = await getApplicationDocumentsDirectory();
    final dir = Directory('${docs.path}/kalro_cloud');
    if (!await dir.exists()) {
      await dir.create(recursive: true);
    }
    return dir;
  }

  Future<File> _localSnapshotFile(String syncCode) async {
    final root = await _localCloudRoot();
    final farmDir = Directory('${root.path}/$syncCode');
    if (!await farmDir.exists()) {
      await farmDir.create(recursive: true);
    }
    return File('${farmDir.path}/latest.json');
  }

  SyncSettings settingsForFarm(FarmProfile farm, {String? serverUrl}) {
    return SyncSettings(
      syncCode: farm.syncCode,
      serverUrl: serverUrl,
    );
  }

  Future<SyncResult> upload({
    required AppRepositories repositories,
    required FarmProfile farm,
    String? serverUrl,
  }) async {
    try {
      final backupFile = await _backupService.exportBackup(repositories);
      final payload = await backupFile.readAsString();

      final localFile = await _localSnapshotFile(farm.syncCode);
      await FileUtils.atomicWriteAsString(localFile, payload);

      if (serverUrl != null && serverUrl.trim().isNotEmpty) {
        final uri = Uri.parse('${serverUrl.trim().replaceAll(RegExp(r'/+$'), '')}/farms/${farm.syncCode}/backup');
        final response = await _http.put(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: payload,
        );
        if (response.statusCode < 200 || response.statusCode >= 300) {
          return SyncResult(
            success: false,
            message: 'Remote upload failed (${response.statusCode})',
          );
        }
      }

      await _updateFarmSyncMetadata(farm, uploadedAt: DateTime.now());

      return SyncResult(
        success: true,
        message: serverUrl == null || serverUrl.trim().isEmpty
            ? 'Uploaded to local cloud folder for sync code ${farm.syncCode}'
            : 'Uploaded to cloud successfully',
        timestamp: DateTime.now(),
      );
    } catch (error) {
      return SyncResult(success: false, message: 'Upload failed: $error');
    }
  }

  Future<SyncResult> download({
    required AppRepositories repositories,
    required FarmProfile farm,
    String? serverUrl,
  }) async {
    try {
      String payload;

      if (serverUrl != null && serverUrl.trim().isNotEmpty) {
        final uri = Uri.parse('${serverUrl.trim().replaceAll(RegExp(r'/+$'), '')}/farms/${farm.syncCode}/backup');
        final response = await _http.get(uri);
        if (response.statusCode != 200) {
          return SyncResult(
            success: false,
            message: 'Remote download failed (${response.statusCode})',
          );
        }
        payload = response.body;
      } else {
        final localFile = await _localSnapshotFile(farm.syncCode);
        if (!await localFile.exists()) {
          return const SyncResult(
            success: false,
            message: 'No cloud snapshot found for this sync code',
          );
        }
        payload = await localFile.readAsString();
      }

      final decoded = jsonDecode(payload) as Map<String, dynamic>;
      if (decoded['version'] != BackupService.version) {
        return SyncResult(
          success: false,
          message: 'Unsupported backup version in cloud snapshot',
        );
      }

      final tempDir = await repositories.storageDirectory();
      final tempFile = File('${tempDir.path}/kalro_cloud_restore.json');
      await FileUtils.atomicWriteAsString(tempFile, payload);
      await _backupService.importBackup(repositories, tempFile);
      if (await tempFile.exists()) {
        await tempFile.delete();
      }
      await _updateFarmSyncMetadata(farm, downloadedAt: DateTime.now());

      return SyncResult(
        success: true,
        message: 'Cloud data downloaded and applied',
        timestamp: DateTime.now(),
      );
    } catch (error) {
      return SyncResult(success: false, message: 'Download failed: $error');
    }
  }

  Future<void> _updateFarmSyncMetadata(
    FarmProfile farm, {
    DateTime? uploadedAt,
    DateTime? downloadedAt,
  }) async {
    final dir = await _authRepository.farmDirectory(farm.id);
    final metaFile = File('${dir.path}/sync_meta.json');
    Map<String, dynamic> meta = {};
    if (await metaFile.exists()) {
      meta = jsonDecode(await metaFile.readAsString()) as Map<String, dynamic>;
    }
    if (uploadedAt != null) {
      meta['lastUploadedAt'] = uploadedAt.toIso8601String();
    }
    if (downloadedAt != null) {
      meta['lastDownloadedAt'] = downloadedAt.toIso8601String();
    }
    await FileUtils.atomicWriteAsString(metaFile, jsonEncode(meta));
  }

  Future<SyncSettings> loadSyncMeta(FarmProfile farm) async {
    final dir = await _authRepository.farmDirectory(farm.id);
    final metaFile = File('${dir.path}/sync_meta.json');
    DateTime? uploaded;
    DateTime? downloaded;
    String? serverUrl;

    if (await metaFile.exists()) {
      final meta = jsonDecode(await metaFile.readAsString()) as Map<String, dynamic>;
      if (meta['lastUploadedAt'] != null) {
        uploaded = DateTime.parse(meta['lastUploadedAt'] as String);
      }
      if (meta['lastDownloadedAt'] != null) {
        downloaded = DateTime.parse(meta['lastDownloadedAt'] as String);
      }
      serverUrl = meta['serverUrl'] as String?;
    }

    return SyncSettings(
      syncCode: farm.syncCode,
      serverUrl: serverUrl,
      lastUploadedAt: uploaded,
      lastDownloadedAt: downloaded,
    );
  }

  Future<void> saveServerUrl(FarmProfile farm, String? serverUrl) async {
    final dir = await _authRepository.farmDirectory(farm.id);
    final metaFile = File('${dir.path}/sync_meta.json');
    Map<String, dynamic> meta = {};
    if (await metaFile.exists()) {
      meta = jsonDecode(await metaFile.readAsString()) as Map<String, dynamic>;
    }
    if (serverUrl == null || serverUrl.trim().isEmpty) {
      meta.remove('serverUrl');
    } else {
      meta['serverUrl'] = serverUrl.trim();
    }
    await FileUtils.atomicWriteAsString(metaFile, jsonEncode(meta));
  }
}
