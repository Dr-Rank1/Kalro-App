import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/batch.dart';
import '../models/feed_log.dart';
import '../models/mortality_log.dart';
import 'batch_repository.dart';
import 'farm_store.dart';
import 'feed_log_repository.dart';
import 'mortality_log_repository.dart';

/// Central FarmStore provider backed by PowerSync
final farmStoreProvider = Provider<FarmStore>((ref) {
  final store = FarmStore();
  ref.onDispose(store.dispose);
  return store;
});

/// Batch repository provider
final batchRepositoryProvider = Provider<BatchRepository>((ref) {
  final store = ref.watch(farmStoreProvider);
  return BatchRepository(store: store);
});

/// FeedLog repository provider
final feedLogRepositoryProvider = Provider<FeedLogRepository>((ref) {
  final store = ref.watch(farmStoreProvider);
  return FeedLogRepository(store: store);
});

/// MortalityLog repository provider
final mortalityLogRepositoryProvider = Provider<MortalityLogRepository>((ref) {
  final store = ref.watch(farmStoreProvider);
  return MortalityLogRepository(store: store);
});

/// Reactive stream of all batches powered by PowerSync
final batchesStreamProvider = StreamProvider<List<Batch>>((ref) {
  final repo = ref.watch(batchRepositoryProvider);
  return repo.watchAll();
});

/// Reactive stream of feed logs for a specific batch powered by PowerSync
final feedLogsStreamProvider = StreamProvider.family<List<FeedLog>, String>((ref, batchId) {
  final repo = ref.watch(feedLogRepositoryProvider);
  return repo.watchByBatchId(batchId);
});

/// Reactive stream of mortality logs for a specific batch powered by PowerSync
final mortalityLogsStreamProvider = StreamProvider.family<List<MortalityLog>, String>((ref, batchId) {
  final repo = ref.watch(mortalityLogRepositoryProvider);
  return repo.watchByBatchId(batchId);
});
