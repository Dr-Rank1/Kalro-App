import { RxCollection, RxDatabase } from 'rxdb';
import { Batch, FeedLog, MortalityLog } from '../../types';

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'offline' | 'error';
  lastSyncedAt: string | null;
  pendingPushes: number;
}

export type BatchCollection = RxCollection<Batch>;
export type FeedLogCollection = RxCollection<FeedLog>;
export type MortalityLogCollection = RxCollection<MortalityLog>;

export type KalroDatabaseCollections = {
  batches: BatchCollection;
  feed_logs: FeedLogCollection;
  mortality_logs: MortalityLogCollection;
};

export type KalroDatabase = RxDatabase<KalroDatabaseCollections>;
