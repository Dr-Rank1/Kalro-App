import { createRxDatabase, RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { batchRxSchema, feedLogRxSchema, mortalityLogRxSchema } from './schemas';
import { NsrcPowerSyncRxReplicationConnector } from './replication';
import { KalroDatabase } from './types';

export const powerSyncConnector = new NsrcPowerSyncRxReplicationConnector();

let rxDbPromise: Promise<KalroDatabase | null> | null = null;

export async function getRxDatabase(): Promise<KalroDatabase | null> {
  if (rxDbPromise) return rxDbPromise;
  if (typeof window === 'undefined') return null;

  if ((window as any).__kalro_rxdb_promise__) {
    rxDbPromise = (window as any).__kalro_rxdb_promise__;
    return rxDbPromise;
  }

  let resolvePromise!: (db: KalroDatabase | null) => void;
  rxDbPromise = new Promise<KalroDatabase | null>((resolve) => {
    resolvePromise = resolve;
  });
  (window as any).__kalro_rxdb_promise__ = rxDbPromise;

  (async () => {
    try {
      const storageAdapter = window.indexedDB
        ? getRxStorageDexie()
        : getRxStorageMemory();

      const db = await createRxDatabase<any>({
        name: 'kalro_sericulture_rxdb_v1',
        storage: storageAdapter as any,
      });

      await db.addCollections({
        batches: { schema: batchRxSchema },
        feed_logs: { schema: feedLogRxSchema },
        mortality_logs: { schema: mortalityLogRxSchema },
      });

      // Setup PowerSync active-active background replication
      powerSyncConnector.registerCollectionReplication(db.batches);
      powerSyncConnector.registerCollectionReplication(db.feed_logs);
      powerSyncConnector.registerCollectionReplication(db.mortality_logs);

      resolvePromise(db as unknown as KalroDatabase);
    } catch (err) {
      console.warn('RxDB initialization notice:', err);
      resolvePromise(null);
    }
  })();

  return rxDbPromise;
}
