import { RxCollection } from 'rxdb';
import { replicateRxCollection, RxReplicationState } from 'rxdb/plugins/replication';
import { BehaviorSubject } from 'rxjs';
import { SyncStatus } from './types';

export class NsrcPowerSyncRxReplicationConnector {
  public endpoint: string;
  public token: string | null;
  public syncStatus$ = new BehaviorSubject<SyncStatus>({
    status: 'idle',
    lastSyncedAt: null,
    pendingPushes: 0,
  });

  private activeReplications: Map<string, RxReplicationState<any, any>> = new Map();

  constructor(endpoint = 'https://powersync.kalro-nsrc.go.ke', token: string | null = null) {
    this.endpoint = endpoint;
    this.token = token;
  }

  public registerCollectionReplication<T extends { id: string }>(
    collection: RxCollection<T>
  ): RxReplicationState<T, any> {
    const replicationState = replicateRxCollection<T, any>({
      collection,
      replicationIdentifier: `powersync-nsrc-${collection.name}`,
      live: true,
      retryTime: 5000,
      autoStart: true,
      pull: {
        handler: async (lastCheckpoint, batchSize) => {
          if (!navigator.onLine || !this.token) {
            return {
              checkpoint: lastCheckpoint ?? { lastModified: 0 },
              documents: [],
            };
          }
          try {
            this.syncStatus$.next({
              ...this.syncStatus$.value,
              status: 'syncing',
            });
            const res = await fetch(
              `${this.endpoint}/api/powersync/pull/${collection.name}?batchSize=${batchSize}`,
              {
                headers: {
                  Authorization: `Bearer ${this.token}`,
                },
              }
            );
            if (res.ok) {
              const data = await res.json();
              this.syncStatus$.next({
                status: 'idle',
                lastSyncedAt: new Date().toISOString(),
                pendingPushes: 0,
              });
              return {
                checkpoint: data.checkpoint,
                documents: data.documents || [],
              };
            }
          } catch {
            this.syncStatus$.next({
              ...this.syncStatus$.value,
              status: 'offline',
            });
          }
          return {
            checkpoint: lastCheckpoint ?? { lastModified: 0 },
            documents: [],
          };
        },
      },
      push: {
        handler: async (changeDocs) => {
          if (!navigator.onLine || !this.token || changeDocs.length === 0) {
            return [];
          }
          try {
            this.syncStatus$.next({
              ...this.syncStatus$.value,
              status: 'syncing',
              pendingPushes: changeDocs.length,
            });
            const res = await fetch(
              `${this.endpoint}/api/powersync/push/${collection.name}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${this.token}`,
                },
                body: JSON.stringify({ documents: changeDocs }),
              }
            );
            if (res.ok) {
              this.syncStatus$.next({
                status: 'idle',
                lastSyncedAt: new Date().toISOString(),
                pendingPushes: 0,
              });
              return [];
            }
          } catch {
            // Rural cellular disruption: changes remain safe in local RxDB IndexedDB
            this.syncStatus$.next({
              ...this.syncStatus$.value,
              status: 'offline',
            });
          }
          return [];
        },
      },
    });

    this.activeReplications.set(collection.name, replicationState);
    return replicationState;
  }
}
