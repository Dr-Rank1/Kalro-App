import '../models/farm_profile.dart';
import '../models/batch_status.dart';
import '../models/sync_settings.dart';
import 'app_repositories.dart';
import 'auth_repository.dart';
import 'cloud_sync_service.dart';

class AdminSummary {
  const AdminSummary({
    required this.teamCount,
    required this.activeBatchCount,
    required this.totalBatchCount,
    required this.feedLogCount,
    required this.paymentCount,
    required this.syncSettings,
  });

  final int teamCount;
  final int activeBatchCount;
  final int totalBatchCount;
  final int feedLogCount;
  final int paymentCount;
  final SyncSettings syncSettings;

  bool get hasRecentUpload => syncSettings.lastUploadedAt != null;
  bool get hasRecentDownload => syncSettings.lastDownloadedAt != null;
}

class AdminSummaryService {
  AdminSummaryService({
    AuthRepository? authRepository,
    CloudSyncService? cloudSyncService,
  })  : _auth = authRepository ?? AuthRepository(),
        _cloudSync = cloudSyncService ?? CloudSyncService();

  final AuthRepository _auth;
  final CloudSyncService _cloudSync;

  Future<AdminSummary> load({
    required AppRepositories repositories,
    required String farmId,
    required FarmProfile farm,
  }) async {
    final batches = await repositories.batches.getAll();
    final feedLogs = await repositories.feedLogs.getAll();
    final payments = await repositories.payments.getAll();
    final teamCount = await _auth.countActiveUsers(farmId);
    final syncSettings = await _cloudSync.loadSyncMeta(farm);

    var activeBatches = 0;
    for (final batch in batches) {
      if (batch.status != BatchStatus.closed) activeBatches++;
    }

    return AdminSummary(
      teamCount: teamCount,
      activeBatchCount: activeBatches,
      totalBatchCount: batches.length,
      feedLogCount: feedLogs.length,
      paymentCount: payments.length,
      syncSettings: syncSettings,
    );
  }
}
