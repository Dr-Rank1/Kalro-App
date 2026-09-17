class SyncSettings {
  const SyncSettings({
    required this.syncCode,
    this.serverUrl,
    this.lastUploadedAt,
    this.lastDownloadedAt,
    this.lastSnapshotExportedAt,
  });

  final String syncCode;
  final String? serverUrl;
  final DateTime? lastUploadedAt;
  final DateTime? lastDownloadedAt;
  final DateTime? lastSnapshotExportedAt;

  SyncSettings copyWith({
    String? syncCode,
    String? serverUrl,
    DateTime? lastUploadedAt,
    DateTime? lastDownloadedAt,
    DateTime? lastSnapshotExportedAt,
  }) {
    return SyncSettings(
      syncCode: syncCode ?? this.syncCode,
      serverUrl: serverUrl?.trim().isEmpty == true ? null : (serverUrl ?? this.serverUrl),
      lastUploadedAt: lastUploadedAt ?? this.lastUploadedAt,
      lastDownloadedAt: lastDownloadedAt ?? this.lastDownloadedAt,
      lastSnapshotExportedAt: lastSnapshotExportedAt ?? this.lastSnapshotExportedAt,
    );
  }

  bool get hasRemoteServer =>
      serverUrl != null && serverUrl!.trim().isNotEmpty;
}

class SyncResult {
  const SyncResult({
    required this.success,
    required this.message,
    this.timestamp,
    this.wouldOverwriteNewerLocal = false,
  });

  final bool success;
  final String message;
  final DateTime? timestamp;
  final bool wouldOverwriteNewerLocal;
}
