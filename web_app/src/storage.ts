import {
  AuditLogEntry,
  Batch,
  CocoonHarvest,
  EnvironmentLog,
  FarmProfile,
  FeedLog,
  LeafInventory,
  LeafMovement,
  MortalityLog,
  PaymentRecord,
  UserAccount,
  UserRole,
} from './types';
import {
  createRxDatabase,
  RxDatabase,
  RxCollection,
  RxJsonSchema,
} from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { replicateRxCollection, RxReplicationState } from 'rxdb/plugins/replication';
import { BehaviorSubject } from 'rxjs';

const GLOBAL_KEYS = {
  usersRegistry: 'kalro_users_registry',
  activeUserId: 'kalro_active_user_id',
  dataVersion: 'kalro_sericulture_staff_v7_rxdb',
  theme: 'kalro_theme',
  lang: 'kalro_lang',
  stationBatches: 'kalro_station_batches',
  stationFeedLogs: 'kalro_station_feed_logs',
  stationEnvLogs: 'kalro_station_env_logs',
  stationMortalityLogs: 'kalro_station_mortality_logs',
  stationHarvests: 'kalro_station_harvests',
  stationLeafInventory: 'kalro_station_leaf_inventory',
  stationLeafMovements: 'kalro_station_leaf_movements',
  stationPayments: 'kalro_station_payments',
  stationProfile: 'kalro_station_profile',
  stationAuditLog: 'kalro_station_audit_log',
};

// Kenyan Institutional Station Defaults (KALRO National Sericulture Research Centre, Thika)
const DEFAULT_STATION_PROFILE: FarmProfile = {
  id: 'station-kalro-nsrc-thika',
  userId: 'staff-joyce-njuguna',
  orgName: 'KALRO National Sericulture Research Centre (NSRC), Thika',
  county: 'Kiambu',
  subCounty: 'Thika West',
  houseCount: 4,
  rearingBaysCount: 4,
  syncCode: 'KALRO-NSRC-THK-01',
  managerName: 'Dr. Joyce Njuguna',
  managerRole: 'station_manager',
  phone: '+254 722 000 111',
  email: 'sericulture.thika@kalro.org',
  mulberryAcreage: 15.0,
  mulberryCultivars: ['V1', 'Thika', 'Embu', 'Ithaanga', 'Limuru', 'Kanva 2', 'S36', 'S54', 'Ichinose', 'Thailand', 'Unknown 2'],
  accreditationLevel: 'Research Station',
  avatarColor: '#143D2B',
  createdAt: '2026-10-01T08:00:00.000Z',
  updatedAt: new Date().toISOString(),
};

// Default Rotating Staff Roster (Sericulture Specialists)
const DEFAULT_STAFF_ROSTER: UserAccount[] = [
  {
    id: 'staff-joyce-njuguna',
    username: 'Dr. Joyce Njuguna',
    role: 'station_manager',
    stationName: 'KALRO National Sericulture Research Centre (NSRC), Thika',
    county: 'Kiambu',
    staffId: 'KALRO-SRO-01',
    shift: 'general',
    phone: '+254 722 000 111',
    email: 'joyce.njuguna@kalro.org',
    avatarColor: '#143D2B',
    avatarInitials: 'JN',
    createdAt: '2026-10-01T08:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'staff-peter-otieno',
    username: 'Peter Otieno',
    role: 'lead_technician',
    stationName: 'KALRO National Sericulture Research Centre (NSRC), Thika',
    county: 'Kiambu',
    staffId: 'KALRO-CHW-02',
    shift: 'morning',
    phone: '+254 723 111 222',
    email: 'peter.otieno@kalro.org',
    avatarColor: '#2B5775',
    avatarInitials: 'PO',
    createdAt: '2026-10-01T08:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'staff-mary-wambua',
    username: 'Mary Wambua',
    role: 'rearing_technician',
    stationName: 'KALRO National Sericulture Research Centre (NSRC), Thika',
    county: 'Kiambu',
    staffId: 'KALRO-REC-03',
    shift: 'midday',
    phone: '+254 724 222 333',
    email: 'mary.wambua@kalro.org',
    avatarColor: '#C68A14',
    avatarInitials: 'MW',
    createdAt: '2026-10-01T08:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'staff-kevin-kiprop',
    username: 'Kevin Kiprop',
    role: 'moriculture_attendant',
    stationName: 'KALRO National Sericulture Research Centre (NSRC), Thika',
    county: 'Kiambu',
    staffId: 'KALRO-MOR-04',
    shift: 'morning',
    phone: '+254 725 333 444',
    email: 'kevin.kiprop@kalro.org',
    avatarColor: '#2E7D32',
    avatarInitials: 'KK',
    createdAt: '2026-10-01T08:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'staff-faith-achieng',
    username: 'Faith Achieng',
    role: 'cocoon_inspector',
    stationName: 'KALRO National Sericulture Research Centre (NSRC), Thika',
    county: 'Kiambu',
    staffId: 'KALRO-GRA-05',
    shift: 'midday',
    phone: '+254 726 444 555',
    email: 'faith.achieng@kalro.org',
    avatarColor: '#BF360C',
    avatarInitials: 'FA',
    createdAt: '2026-10-01T08:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
  },
];

function getDateOffset(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 86400000);
  return d.toISOString().split('T')[0];
}

function createInitialBatches(): Batch[] {
  return [
    {
      id: 'batch-kalro-csr2-01',
      species: 'bombyx',
      startDate: getDateOffset(23),
      eggCount: 20000,
      status: 'active',
      strain: 'KSK',
      targetForageCultivar: 'V1',
      orchardBlock: 'Centre Genebank (Ex-Thika, Block C2)',
      batchTag: 'KSK Bivoltine Commercial Strain',
      displayTag: 'Batch KSK-THK-01 (House 1, Bay A)',
      roomName: 'House 1',
      createdBy: 'staff-joyce-njuguna',
      createdByName: 'Dr. Joyce Njuguna',
      notes: 'Active commercial bivoltine trial. Voracious 5th instar shoot feeding with V1 & Thika cultivars from Centre Genebank Block C2.',
    },
  ];
}

const DEFAULT_INITIAL_INVENTORY: LeafInventory = {
  mulberryKg: 180.0,
  castorKg: 45.0,
  kesseruKg: 10.0,
  mulberryByType: {
    'V1': 80.0,
    'Thika': 50.0,
    'Kanva 2': 30.0,
    'Embu': 20.0,
  },
  castorByType: {
    'NUU 70': 30.0,
    'KC6': 15.0,
  },
  lastUpdated: new Date().toISOString(),
};

// --------------------------------------------------------------------------
// RxDB Collection Schemas
// --------------------------------------------------------------------------

const batchRxSchema: RxJsonSchema<Batch> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    species: { type: 'string' },
    startDate: { type: 'string' },
    eggCount: { type: 'number' },
    status: { type: 'string' },
    batchTag: { type: 'string' },
    displayTag: { type: 'string' },
    notes: { type: 'string' },
    roomName: { type: 'string' },
    strain: { type: 'string' },
    createdBy: { type: 'string' },
    createdByName: { type: 'string' },
    assignedStaff: {
      type: 'array',
      items: { type: 'string' },
    },
    bedAreaSqMeters: { type: 'number' },
    currentInstar: { type: 'number' },
    currentTraysCount: { type: 'number' },
    targetForageCultivar: { type: 'string' },
    orchardBlock: { type: 'string' },
    isQuarantined: { type: 'boolean' },
    quarantineReason: { type: 'string' },
    quarantinedAt: { type: 'string' },
    quarantinedBy: { type: 'string' },
  },
  required: ['id', 'species', 'startDate', 'eggCount', 'status'],
};

const feedLogRxSchema: RxJsonSchema<FeedLog> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    batchId: { type: 'string', maxLength: 100 },
    recordedAt: { type: 'string' },
    quantityGrams: { type: 'number' },
    leafType: { type: 'string' },
    cultivar: { type: 'string' },
    wasSkipped: { type: 'boolean' },
    skippedReason: { type: 'string' },
    operatorId: { type: 'string' },
    operatorName: { type: 'string' },
    operatorRole: { type: 'string' },
    shift: { type: 'string' },
    notes: { type: 'string' },
  },
  required: ['id', 'batchId', 'recordedAt', 'quantityGrams', 'leafType'],
  indexes: ['batchId'],
};

const mortalityLogRxSchema: RxJsonSchema<MortalityLog> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    batchId: { type: 'string', maxLength: 100 },
    recordedAt: { type: 'string' },
    count: { type: 'number' },
    cause: { type: 'string' },
    symptoms: { type: 'string' },
    photoUrl: { type: 'string' },
    operatorId: { type: 'string' },
    operatorName: { type: 'string' },
    operatorRole: { type: 'string' },
    notes: { type: 'string' },
  },
  required: ['id', 'batchId', 'recordedAt', 'count'],
  indexes: ['batchId'],
};

// --------------------------------------------------------------------------
// PowerSync RxDB Replication Connector
// --------------------------------------------------------------------------

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'offline' | 'error';
  lastSyncedAt: string | null;
  pendingPushes: number;
}

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

// --------------------------------------------------------------------------
// StorageService with RxDB and RxJS Observables
// --------------------------------------------------------------------------

class StorageService {
  private rxDbPromise: Promise<RxDatabase | null> | null = null;
  public powerSyncConnector = new NsrcPowerSyncRxReplicationConnector();

  // Reactive RxJS Observables for direct UI consumption
  public batches$ = new BehaviorSubject<Batch[]>([]);
  public feedLogs$ = new BehaviorSubject<FeedLog[]>([]);
  public mortalityLogs$ = new BehaviorSubject<MortalityLog[]>([]);
  public envLogs$ = new BehaviorSubject<EnvironmentLog[]>([]);
  public harvests$ = new BehaviorSubject<CocoonHarvest[]>([]);
  public inventory$ = new BehaviorSubject<LeafInventory>({ ...DEFAULT_INITIAL_INVENTORY });
  public leafMovements$ = new BehaviorSubject<LeafMovement[]>([]);
  public payments$ = new BehaviorSubject<PaymentRecord[]>([]);
  public auditLogs$ = new BehaviorSubject<AuditLogEntry[]>([]);
  public users$ = new BehaviorSubject<UserAccount[]>(DEFAULT_STAFF_ROSTER);
  public profile$ = new BehaviorSubject<FarmProfile | null>(DEFAULT_STATION_PROFILE);
  public syncStatus$ = this.powerSyncConnector.syncStatus$;

  constructor() {
    this.initDefaults();
    this.initRxDb();
  }

  // Read key-value from localStorage
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  // Write key-value to localStorage
  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
    }
  }

  public getTenantKey(collection: string, userId?: string): string {
    const uid = userId || this.getActiveUserId() || 'guest';
    return `kalro_u_${uid}_${collection}`;
  }

  // Initialize RxDB database with Dexie IndexedDB adapter
  private async initRxDb(): Promise<RxDatabase | null> {
    if (this.rxDbPromise) return this.rxDbPromise;
    if (typeof window === 'undefined') return null;

    if ((window as any).__kalro_rxdb_promise__) {
      this.rxDbPromise = (window as any).__kalro_rxdb_promise__;
      return this.rxDbPromise;
    }

    let resolvePromise!: (db: RxDatabase | null) => void;
    this.rxDbPromise = new Promise<RxDatabase | null>((resolve) => {
      resolvePromise = resolve;
    });
    (window as any).__kalro_rxdb_promise__ = this.rxDbPromise;

    (async () => {
      try {
        const storageAdapter = window.indexedDB
          ? getRxStorageDexie()
          : getRxStorageMemory();

        const db = await createRxDatabase({
          name: 'kalro_sericulture_rxdb_v1',
          storage: storageAdapter as any,
        });

        await db.addCollections({
          batches: { schema: batchRxSchema },
          feed_logs: { schema: feedLogRxSchema },
          mortality_logs: { schema: mortalityLogRxSchema },
        });

        // Setup PowerSync active-active background replication
        this.powerSyncConnector.registerCollectionReplication(db.batches);
        this.powerSyncConnector.registerCollectionReplication(db.feed_logs);
        this.powerSyncConnector.registerCollectionReplication(db.mortality_logs);

        // Seed initial batches into RxDB
        const localBatches = this.getBatches();
        if (localBatches.length > 0) {
          await db.batches.bulkUpsert(localBatches);
        }

        const localFeed = this.getFeedLogs();
        if (localFeed.length > 0) {
          await db.feed_logs.bulkUpsert(localFeed);
        }

        const localMort = this.getMortalityLogs();
        if (localMort.length > 0) {
          await db.mortality_logs.bulkUpsert(localMort);
        }

        // Subscribe to RxDB real-time changes ($ observable)
        db.batches.find().$.subscribe((docs) => {
          if (docs && docs.length > 0) {
            const list = docs.map((d: any) => d.toJSON() as Batch);
            this.set(GLOBAL_KEYS.stationBatches, list);
            this.batches$.next(list);
          }
        });

        db.feed_logs.find().$.subscribe((docs) => {
          if (docs && docs.length > 0) {
            const list = docs.map((d: any) => d.toJSON() as FeedLog);
            this.set(GLOBAL_KEYS.stationFeedLogs, list);
            this.feedLogs$.next(list);
          }
        });

        db.mortality_logs.find().$.subscribe((docs) => {
          if (docs && docs.length > 0) {
            const list = docs.map((d: any) => d.toJSON() as MortalityLog);
            this.set(GLOBAL_KEYS.stationMortalityLogs, list);
            this.mortalityLogs$.next(list);
          }
        });

        resolvePromise(db);
      } catch (err) {
        console.warn('RxDB initialization notice:', err);
        resolvePromise(null);
      }
    })();

    return this.rxDbPromise;
  }

  initDefaults(): void {
    if (typeof window === 'undefined') return;

    const currentVersion = localStorage.getItem(GLOBAL_KEYS.dataVersion);
    const hasUsers = localStorage.getItem(GLOBAL_KEYS.usersRegistry);

    if (!currentVersion || !hasUsers) {
      this.saveUsers(DEFAULT_STAFF_ROSTER);
      localStorage.setItem(GLOBAL_KEYS.activeUserId, DEFAULT_STAFF_ROSTER[1].id);
      this.saveProfile(DEFAULT_STATION_PROFILE);

      const initialBatches = createInitialBatches();
      this.saveBatches(initialBatches);

      this.saveLeafInventory({ ...DEFAULT_INITIAL_INVENTORY });

      const todayIso = new Date().toISOString().split('T')[0];
      const seedLogs: AuditLogEntry[] = [
        {
          id: 'audit-seed-1',
          timestamp: `${todayIso}T07:15:00.000Z`,
          operatorId: 'staff-kevin-kiprop',
          operatorName: 'Kevin Kiprop',
          operatorRole: 'moriculture_attendant',
          actionType: 'leaf_inflow',
          title: 'Mulberry Shoot Harvest',
          batchTag: 'Station Orchard Block B',
          details: 'Harvested 85.0 kg fresh V1 and Thika shoots at 7:00 AM from Centre Genebank (Ex-Thika, Block C2). High leaf moisture (76%). Stocked in damp gunny cellar.',
          metrics: '+85.0 kg V1 & Thika',
        },
        {
          id: 'audit-seed-2',
          timestamp: `${todayIso}T07:45:00.000Z`,
          operatorId: 'staff-peter-otieno',
          operatorName: 'Peter Otieno',
          operatorRole: 'lead_technician',
          actionType: 'climate_check',
          title: 'Microclimate Monitored',
          roomName: 'House 1',
          details: 'Dry Bulb: 24.8°C · Relative Humidity: 74% RH · Cross-ventilation: Optimal cross-draft louvers with wet gunny curtain.',
          metrics: '24.8°C, 74% RH',
        },
        {
          id: 'audit-seed-3',
          timestamp: `${todayIso}T08:30:00.000Z`,
          operatorId: 'staff-mary-wambua',
          operatorName: 'Mary Wambua',
          operatorRole: 'rearing_technician',
          actionType: 'feed_log',
          title: '5th Instar Shoot Feeding',
          batchId: 'batch-kalro-csr2-01',
          batchTag: 'Batch KSK-THK-01 (House 1, Bay A)',
          details: 'Fed 18.5 kg fresh Thika whole mulberry shoots across rearing racks for voracious 5th instar larvae. Auto-deducted from station stockpile.',
          metrics: '18.5 kg Thika Mulberry',
        },
      ];
      this.saveAuditLogs(seedLogs);

      const initialFeedLogs: FeedLog[] = [
        {
          id: 'fl-seed-1',
          batchId: 'batch-kalro-csr2-01',
          recordedAt: `${todayIso}T08:30:00.000Z`,
          quantityGrams: 18500,
          leafType: 'mulberry',
          cultivar: 'Thika',
          operatorId: 'staff-mary-wambua',
          operatorName: 'Mary Wambua',
          operatorRole: 'rearing_technician',
          shift: 'morning',
        },
      ];
      this.saveFeedLogs(initialFeedLogs);

      const initialEnvLogs: EnvironmentLog[] = [
        {
          id: 'env-seed-1',
          batchId: 'batch-kalro-csr2-01',
          recordedAt: `${todayIso}T07:45:00.000Z`,
          temperatureCelsius: 24.8,
          humidityPercent: 74,
          ventilationStatus: 'optimal',
          roomName: 'House 1',
          operatorId: 'staff-peter-otieno',
          operatorName: 'Peter Otieno',
          operatorRole: 'lead_technician',
        },
      ];
      this.saveEnvironmentLogs(initialEnvLogs);

      const initialMovements: LeafMovement[] = [
        {
          id: 'lm-seed-1',
          date: `${todayIso}T07:15:00.000Z`,
          leafType: 'mulberry',
          cultivar: 'V1',
          quantityKg: 85.0,
          direction: 'inflow',
          reason: 'Morning harvest from Centre Genebank Block C2 (V1 / Thika)',
          operatorId: 'staff-kevin-kiprop',
          operatorName: 'Kevin Kiprop',
          operatorRole: 'moriculture_attendant',
        },
        {
          id: 'lm-seed-2',
          date: `${todayIso}T08:30:00.000Z`,
          leafType: 'mulberry',
          cultivar: 'Thika',
          quantityKg: 18.5,
          direction: 'outflow',
          reason: 'Ration fed to Batch KSK-THK-01 (House 1, Bay A)',
          operatorId: 'staff-mary-wambua',
          operatorName: 'Mary Wambua',
          operatorRole: 'rearing_technician',
        },
      ];
      this.saveLeafMovements(initialMovements);

      localStorage.setItem(GLOBAL_KEYS.dataVersion, 'kalro_sericulture_staff_v7_rxdb');
    }

    // Hydrate RxJS Observables with current snapshots
    this.batches$.next(this.getBatches());
    this.feedLogs$.next(this.getFeedLogs());
    this.mortalityLogs$.next(this.getMortalityLogs());
    this.envLogs$.next(this.getEnvironmentLogs());
    this.harvests$.next(this.getCocoonHarvests());
    this.inventory$.next(this.getLeafInventory());
    this.leafMovements$.next(this.getLeafMovements());
    this.payments$.next(this.getPayments());
    this.auditLogs$.next(this.getAuditLogs());
    this.users$.next(this.getAllUsers());
    this.profile$.next(this.getProfile());
  }

  // --------------------------------------------------------------------------
  // Multi-Tenant Staff Roster Management
  // --------------------------------------------------------------------------

  getAllUsers(): UserAccount[] {
    const list = this.get<UserAccount[]>(GLOBAL_KEYS.usersRegistry, []);
    return list.length > 0 ? list : DEFAULT_STAFF_ROSTER;
  }

  getActiveUserId(): string | null {
    const active = localStorage.getItem(GLOBAL_KEYS.activeUserId);
    if (active) return active;
    const users = this.getAllUsers();
    if (users.length > 0) {
      localStorage.setItem(GLOBAL_KEYS.activeUserId, users[0].id);
      return users[0].id;
    }
    return null;
  }

  getActiveUser(): UserAccount | null {
    const activeId = this.getActiveUserId();
    if (!activeId) return null;
    const users = this.getAllUsers();
    return users.find((u) => u.id === activeId) || users[0] || null;
  }

  hasProfile(): boolean {
    return this.getActiveUser() !== null;
  }

  setActiveUserId(userId: string): void {
    const users = this.getAllUsers();
    const found = users.find((u) => u.id === userId);
    if (found) {
      localStorage.setItem(GLOBAL_KEYS.activeUserId, userId);
      found.lastActiveAt = new Date().toISOString();
      this.saveUsers(users);

      this.addAuditLog({
        id: `audit-shift-${Date.now()}`,
        timestamp: new Date().toISOString(),
        operatorId: found.id,
        operatorName: found.username,
        operatorRole: found.role,
        actionType: 'shift_handover',
        title: 'Staff On Duty Active',
        details: `${found.username} (${found.role}) assumed active rearing supervision.`,
        metrics: found.shift || 'on duty',
      });
    }
  }

  saveUsers(users: UserAccount[]): void {
    this.set(GLOBAL_KEYS.usersRegistry, users);
    this.users$.next(users);
  }

  createUserProfile(data: {
    username: string;
    role: UserRole;
    stationName: string;
    county: string;
    subCounty?: string;
    phone?: string;
    email?: string;
    houseCount?: number;
    mulberryAcreage?: number;
    syncCode?: string;
    avatarColor?: string;
    pinCode?: string;
    staffId?: string;
    shift?: 'morning' | 'midday' | 'evening' | 'night' | 'general';
  }): { user: UserAccount; profile: FarmProfile } {
    const users = this.getAllUsers();
    const newId = `staff-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const parts = data.username.trim().split(/\s+/);
    const initials =
      parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : data.username.slice(0, 2).toUpperCase() || 'SP';

    const colors = ['#143D2B', '#C68A14', '#2B5775', '#4A148C', '#BF360C', '#2E7D32'];
    const avatarColor = data.avatarColor || colors[users.length % colors.length];

    const newUser: UserAccount = {
      id: newId,
      username: data.username.trim(),
      role: data.role,
      stationName: data.stationName.trim(),
      county: data.county,
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      pinCode: data.pinCode?.trim(),
      staffId: data.staffId?.trim() || `KALRO-STF-${String(users.length + 1).padStart(2, '0')}`,
      shift: data.shift || 'general',
      avatarColor,
      avatarInitials: initials,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.saveUsers(users);

    const currentProfile = this.getProfile();
    const updatedProfile: FarmProfile = {
      ...(currentProfile || DEFAULT_STATION_PROFILE),
      id: currentProfile?.id || `farm-${newId}`,
      orgName: data.stationName.trim() || currentProfile?.orgName || 'KALRO Sericulture',
      county: data.county || currentProfile?.county || 'Kiambu',
      subCounty: data.subCounty?.trim() || currentProfile?.subCounty || '',
      houseCount: Number(data.houseCount) || currentProfile?.houseCount || 4,
      mulberryAcreage: Number(data.mulberryAcreage) || currentProfile?.mulberryAcreage || 15.0,
      syncCode: data.syncCode?.trim() || currentProfile?.syncCode || 'KALRO-NSRC-THK-01',
      updatedAt: new Date().toISOString(),
    };
    this.saveProfile(updatedProfile, newId);

    this.addAuditLog({
      id: `audit-staff-add-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorId: newUser.id,
      operatorName: newUser.username,
      operatorRole: newUser.role,
      actionType: 'shift_handover',
      title: 'Staff Member Registered',
      details: `${newUser.username} registered with role "${newUser.role}" for ${updatedProfile.orgName}.`,
      metrics: newUser.staffId,
    });

    return { user: newUser, profile: updatedProfile };
  }

  updateUserProfile(
    data: {
      username: string;
      role: UserRole;
      stationName: string;
      county: string;
      subCounty?: string;
      phone?: string;
      email?: string;
      houseCount?: number;
      mulberryAcreage?: number;
      syncCode?: string;
      avatarColor?: string;
      staffId?: string;
      shift?: 'morning' | 'midday' | 'evening' | 'night' | 'general';
    },
    userId?: string
  ): { user: UserAccount; profile: FarmProfile } | null {
    const uid = userId || this.getActiveUserId();
    if (!uid) return null;

    const users = this.getAllUsers();
    const userIdx = users.findIndex((u) => u.id === uid);
    if (userIdx === -1) return null;

    const parts = data.username.trim().split(/\s+/);
    const initials =
      parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : data.username.slice(0, 2).toUpperCase() || 'SP';

    const existingUser = users[userIdx];
    const updatedUser: UserAccount = {
      ...existingUser,
      username: data.username.trim(),
      role: data.role,
      stationName: data.stationName.trim(),
      county: data.county,
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      avatarColor: data.avatarColor || existingUser.avatarColor,
      avatarInitials: initials,
      staffId: data.staffId !== undefined ? data.staffId : existingUser.staffId,
      shift: data.shift !== undefined ? data.shift : existingUser.shift,
      lastActiveAt: new Date().toISOString(),
    };
    users[userIdx] = updatedUser;
    this.saveUsers(users);

    const existingProfile = this.getProfile() || DEFAULT_STATION_PROFILE;
    const updatedProfile: FarmProfile = {
      ...existingProfile,
      managerName: data.username.trim(),
      managerRole: data.role,
      orgName: data.stationName.trim(),
      county: data.county,
      subCounty: data.subCounty?.trim() || existingProfile.subCounty || '',
      phone: data.phone?.trim() || existingProfile.phone || '',
      email: data.email?.trim() || existingProfile.email || '',
      houseCount: Number(data.houseCount) || existingProfile.houseCount || 4,
      mulberryAcreage: Number(data.mulberryAcreage) || existingProfile.mulberryAcreage || 15.0,
      syncCode: data.syncCode?.trim() || existingProfile.syncCode,
      avatarColor: updatedUser.avatarColor,
      updatedAt: new Date().toISOString(),
    };
    this.saveProfile(updatedProfile, uid);

    return { user: updatedUser, profile: updatedProfile };
  }

  deleteUserProfile(userId: string): boolean {
    const users = this.getAllUsers();
    const currentActiveId = localStorage.getItem(GLOBAL_KEYS.activeUserId);
    const isDeletingActive = currentActiveId === userId || (!currentActiveId && users[0]?.id === userId);

    const filtered = users.filter((u) => u.id !== userId);
    this.saveUsers(filtered);

    if (filtered.length === 0) {
      localStorage.removeItem(GLOBAL_KEYS.activeUserId);
    } else if (isDeletingActive) {
      this.setActiveUserId(filtered[0].id);
    }

    return true;
  }

  // --------------------------------------------------------------------------
  // Station Batches (RxDB Synchronized + Observable Stream)
  // --------------------------------------------------------------------------

  getBatches(userId?: string): Batch[] {
    let batches = this.get<Batch[]>(GLOBAL_KEYS.stationBatches, []);
    if (batches.length === 0) {
      const uid = userId || this.getActiveUserId();
      if (uid) {
        const legacy = this.get<Batch[]>(this.getTenantKey('batches', uid), []);
        if (legacy.length > 0) {
          batches = legacy;
          this.set(GLOBAL_KEYS.stationBatches, batches);
        }
      }
    }
    return batches.length > 0 ? batches : createInitialBatches();
  }

  saveBatches(batches: Batch[], userId?: string): void {
    this.set(GLOBAL_KEYS.stationBatches, batches);
    const uid = userId || this.getActiveUserId();
    if (uid) {
      this.set(this.getTenantKey('batches', uid), batches);
    }
    this.batches$.next(batches);

    // Replicate to RxDB collection in background
    this.initRxDb().then((db) => {
      if (db) {
        db.batches.bulkUpsert(batches).catch(() => {});
      }
    });
  }

  addBatch(batch: Batch, operator?: { id: string; name: string; role: string }): void {
    const list = this.getBatches();
    list.unshift(batch);
    this.saveBatches(list);

    const activeUser = this.getActiveUser();
    const opName = operator?.name || activeUser?.username || 'Station Operator';
    const opRole = operator?.role || activeUser?.role || 'Silkworm Rearing Technician';
    const opId = operator?.id || activeUser?.id;

    this.addAuditLog({
      id: `audit-batch-add-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorId: opId,
      operatorName: opName,
      operatorRole: opRole,
      actionType: 'batch_created',
      title: 'New Silkworm Lot Registered',
      batchId: batch.id,
      batchTag: batch.displayTag || batch.batchTag,
      roomName: batch.roomName,
      details: `Registered lot "${batch.displayTag || batch.batchTag}" (${batch.eggCount.toLocaleString()} eggs) in ${batch.roomName || 'Rearing House'}.`,
      metrics: `${batch.eggCount.toLocaleString()} eggs`,
    });
  }

  updateBatch(batch: Batch, operator?: { id: string; name: string; role: string }): void {
    const list = this.getBatches().map((b) => (b.id === batch.id ? batch : b));
    this.saveBatches(list);

    const activeUser = this.getActiveUser();
    const opName = operator?.name || activeUser?.username || 'Station Operator';
    const opRole = operator?.role || activeUser?.role || 'Silkworm Rearing Technician';
    const opId = operator?.id || activeUser?.id;

    this.addAuditLog({
      id: `audit-batch-upd-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorId: opId,
      operatorName: opName,
      operatorRole: opRole,
      actionType: 'batch_updated',
      title: 'Lot Parameters Updated',
      batchId: batch.id,
      batchTag: batch.displayTag || batch.batchTag,
      roomName: batch.roomName,
      details: `Updated lot "${batch.displayTag || batch.batchTag}" status: ${batch.status}, location: ${batch.roomName || 'Chamber'}.`,
      metrics: batch.status,
    });
  }

  // --------------------------------------------------------------------------
  // Station Feed Logs (RxDB Synchronized + Stock Auto-Deduct)
  // --------------------------------------------------------------------------

  getFeedLogs(userId?: string): FeedLog[] {
    let logs = this.get<FeedLog[]>(GLOBAL_KEYS.stationFeedLogs, []);
    if (logs.length === 0) {
      const uid = userId || this.getActiveUserId();
      if (uid) {
        const legacy = this.get<FeedLog[]>(this.getTenantKey('feed_logs', uid), []);
        if (legacy.length > 0) {
          logs = legacy;
          this.set(GLOBAL_KEYS.stationFeedLogs, logs);
        }
      }
    }
    return logs;
  }

  saveFeedLogs(logs: FeedLog[], userId?: string): void {
    this.set(GLOBAL_KEYS.stationFeedLogs, logs);
    const uid = userId || this.getActiveUserId();
    if (uid) {
      this.set(this.getTenantKey('feed_logs', uid), logs);
    }
    this.feedLogs$.next(logs);

    // Replicate to RxDB collection
    this.initRxDb().then((db) => {
      if (db) {
        db.feed_logs.bulkUpsert(logs).catch(() => {});
      }
    });
  }

  addFeedLog(
    log: FeedLog,
    options?: {
      autoDeductStock?: boolean;
      batchTag?: string;
      operator?: { id: string; name: string; role: string };
    }
  ): void {
    const activeUser = this.getActiveUser();
    const opId = log.operatorId || options?.operator?.id || activeUser?.id;
    const opName = log.operatorName || options?.operator?.name || activeUser?.username || 'Station Operator';
    const opRole = log.operatorRole || options?.operator?.role || activeUser?.role || 'Silkworm Rearing Technician';

    const enrichedLog: FeedLog = {
      ...log,
      operatorId: opId,
      operatorName: opName,
      operatorRole: opRole,
      recordedAt: log.recordedAt || new Date().toISOString(),
    };

    const list = this.getFeedLogs();
    list.unshift(enrichedLog);
    this.saveFeedLogs(list);

    const shouldDeduct = options?.autoDeductStock !== false && !log.wasSkipped && log.quantityGrams > 0;
    if (shouldDeduct) {
      const kg = Math.round((log.quantityGrams / 1000.0) * 100) / 100;
      if (kg > 0) {
        const movement: LeafMovement = {
          id: `lm-feed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          date: enrichedLog.recordedAt,
          leafType: enrichedLog.leafType,
          quantityKg: kg,
          direction: 'outflow',
          reason: `Ration fed to batch ${options?.batchTag || enrichedLog.batchId}`,
          operatorId: opId,
          operatorName: opName,
          operatorRole: opRole,
        };
        this.addLeafMovement(movement);
      }
    }

    this.addAuditLog({
      id: `audit-feed-${Date.now()}`,
      timestamp: enrichedLog.recordedAt,
      operatorId: opId,
      operatorName: opName,
      operatorRole: opRole,
      actionType: 'feed_log',
      title: enrichedLog.wasSkipped ? 'Feeding Fasting Rest' : 'Rearing Feed Distributed',
      batchId: enrichedLog.batchId,
      batchTag: options?.batchTag || enrichedLog.batchId,
      details: enrichedLog.wasSkipped
        ? `Feed skipped: ${enrichedLog.skippedReason || 'Larval moult fasting rest'}.`
        : `Distributed ${(enrichedLog.quantityGrams / 1000).toFixed(1)} kg ${enrichedLog.leafType} forage to ${options?.batchTag || enrichedLog.batchId}.${options?.autoDeductStock !== false ? ' Auto-deducted from station stockpile.' : ''}`,
      metrics: enrichedLog.wasSkipped ? 'Fasting Rest' : `${(enrichedLog.quantityGrams / 1000).toFixed(1)} kg ${enrichedLog.leafType}`,
    });
  }

  // --------------------------------------------------------------------------
  // Station Mortality Logs (RxDB Synchronized)
  // --------------------------------------------------------------------------

  getMortalityLogs(userId?: string): MortalityLog[] {
    let logs = this.get<MortalityLog[]>(GLOBAL_KEYS.stationMortalityLogs, []);
    if (logs.length === 0) {
      const uid = userId || this.getActiveUserId();
      if (uid) {
        const legacy = this.get<MortalityLog[]>(this.getTenantKey('mortality_logs', uid), []);
        if (legacy.length > 0) {
          logs = legacy;
          this.set(GLOBAL_KEYS.stationMortalityLogs, logs);
        }
      }
    }
    return logs;
  }

  saveMortalityLogs(logs: MortalityLog[], userId?: string): void {
    this.set(GLOBAL_KEYS.stationMortalityLogs, logs);
    const uid = userId || this.getActiveUserId();
    if (uid) {
      this.set(this.getTenantKey('mortality_logs', uid), logs);
    }
    this.mortalityLogs$.next(logs);

    this.initRxDb().then((db) => {
      if (db) {
        db.mortality_logs.bulkUpsert(logs).catch(() => {});
      }
    });
  }

  addMortalityLog(log: MortalityLog, operator?: { id: string; name: string; role: string }): void {
    const activeUser = this.getActiveUser();
    const opId = log.operatorId || operator?.id || activeUser?.id;
    const opName = log.operatorName || operator?.name || activeUser?.username || 'Station Operator';
    const opRole = log.operatorRole || operator?.role || activeUser?.role || 'Silkworm Rearing Technician';

    const enriched: MortalityLog = {
      ...log,
      operatorId: opId,
      operatorName: opName,
      operatorRole: opRole,
      recordedAt: log.recordedAt || new Date().toISOString(),
    };

    const list = this.getMortalityLogs();
    list.unshift(enriched);
    this.saveMortalityLogs(list);

    this.addAuditLog({
      id: `audit-mort-${Date.now()}`,
      timestamp: enriched.recordedAt,
      operatorId: opId,
      operatorName: opName,
      operatorRole: opRole,
      actionType: 'mortality_log',
      title: 'Tray Inspection & Bed Loss',
      batchId: enriched.batchId,
      details: `${enriched.count} dead/culled larvae removed from batch bed. Cause: ${enriched.cause || 'Mechanical attrition'}.${enriched.symptoms ? ` Symptoms: ${enriched.symptoms}.` : ''}`,
      metrics: `-${enriched.count} larvae`,
    });
  }

  // --------------------------------------------------------------------------
  // Station Environment Logs
  // --------------------------------------------------------------------------

  getEnvironmentLogs(userId?: string): EnvironmentLog[] {
    let logs = this.get<EnvironmentLog[]>(GLOBAL_KEYS.stationEnvLogs, []);
    if (logs.length === 0) {
      const uid = userId || this.getActiveUserId();
      if (uid) {
        const legacy = this.get<EnvironmentLog[]>(this.getTenantKey('environment_logs', uid), []);
        if (legacy.length > 0) {
          logs = legacy;
          this.set(GLOBAL_KEYS.stationEnvLogs, logs);
        }
      }
    }
    return logs;
  }

  saveEnvironmentLogs(logs: EnvironmentLog[], userId?: string): void {
    this.set(GLOBAL_KEYS.stationEnvLogs, logs);
    const uid = userId || this.getActiveUserId();
    if (uid) {
      this.set(this.getTenantKey('environment_logs', uid), logs);
    }
    this.envLogs$.next(logs);
  }

  addEnvironmentLog(log: EnvironmentLog, operator?: { id: string; name: string; role: string }): void {
    const activeUser = this.getActiveUser();
    const opId = log.operatorId || operator?.id || activeUser?.id;
    const opName = log.operatorName || operator?.name || activeUser?.username || 'Station Operator';
    const opRole = log.operatorRole || operator?.role || activeUser?.role || 'Silkworm Rearing Technician';

    const enriched: EnvironmentLog = {
      ...log,
      operatorId: opId,
      operatorName: opName,
      operatorRole: opRole,
      recordedAt: log.recordedAt || new Date().toISOString(),
    };

    const list = this.getEnvironmentLogs();
    list.unshift(enriched);
    this.saveEnvironmentLogs(list);

    this.addAuditLog({
      id: `audit-env-${Date.now()}`,
      timestamp: enriched.recordedAt,
      operatorId: opId,
      operatorName: opName,
      operatorRole: opRole,
      actionType: 'climate_check',
      title: 'Microclimate Monitored',
      batchId: enriched.batchId,
      roomName: enriched.roomName || 'Rearing House',
      details: `Dry Bulb: ${enriched.temperatureCelsius.toFixed(1)}°C · Humidity: ${enriched.humidityPercent}% RH in ${enriched.roomName || 'Rearing House'}. Airflow: ${enriched.ventilationStatus || 'optimal'}.`,
      metrics: `${enriched.temperatureCelsius.toFixed(1)}°C, ${enriched.humidityPercent}% RH`,
    });
  }

  // --------------------------------------------------------------------------
  // Station Cocoon Harvests
  // --------------------------------------------------------------------------

  getCocoonHarvests(userId?: string): CocoonHarvest[] {
    let harvests = this.get<CocoonHarvest[]>(GLOBAL_KEYS.stationHarvests, []);
    if (harvests.length === 0) {
      const uid = userId || this.getActiveUserId();
      if (uid) {
        const legacy = this.get<CocoonHarvest[]>(this.getTenantKey('cocoon_harvests', uid), []);
        if (legacy.length > 0) {
          harvests = legacy;
          this.set(GLOBAL_KEYS.stationHarvests, harvests);
        }
      }
    }
    return harvests;
  }

  saveCocoonHarvests(harvests: CocoonHarvest[], userId?: string): void {
    this.set(GLOBAL_KEYS.stationHarvests, harvests);
    const uid = userId || this.getActiveUserId();
    if (uid) {
      this.set(this.getTenantKey('cocoon_harvests', uid), harvests);
    }
    this.harvests$.next(harvests);
  }

  addCocoonHarvest(harvest: CocoonHarvest, operator?: { id: string; name: string; role: string }): void {
    const activeUser = this.getActiveUser();
    const opId = harvest.operatorId || operator?.id || activeUser?.id;
    const opName = harvest.operatorName || operator?.name || activeUser?.username || 'Station Operator';
    const opRole = harvest.operatorRole || operator?.role || activeUser?.role || 'Cocoon & Grainage Inspector';

    const enriched: CocoonHarvest = {
      ...harvest,
      operatorId: opId,
      operatorName: opName,
      operatorRole: opRole,
    };

    const list = this.getCocoonHarvests();
    list.unshift(enriched);
    this.saveCocoonHarvests(list);

    this.addAuditLog({
      id: `audit-harv-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorId: opId,
      operatorName: opName,
      operatorRole: opRole,
      actionType: 'cocoon_harvest',
      title: 'Commercial Cocoon Harvest Logged',
      batchId: enriched.batchId,
      details: `Harvested ${enriched.cocoonCount.toLocaleString()} cocoons weighing ${(enriched.totalWeightGrams / 1000).toFixed(1)} kg. Defectives sorted: ${enriched.defectiveCount}.`,
      metrics: `${(enriched.totalWeightGrams / 1000).toFixed(1)} kg (${enriched.cocoonCount} cocoons)`,
    });
  }

  // --------------------------------------------------------------------------
  // Station Forage Inventory & Movements
  // --------------------------------------------------------------------------

  getLeafInventory(userId?: string): LeafInventory {
    const inv = this.get<LeafInventory | null>(GLOBAL_KEYS.stationLeafInventory, null);
    if (inv) return inv;
    const uid = userId || this.getActiveUserId();
    if (uid) {
      const legacy = this.get<LeafInventory | null>(this.getTenantKey('leaf_inventory', uid), null);
      if (legacy) {
        this.set(GLOBAL_KEYS.stationLeafInventory, legacy);
        return legacy;
      }
    }
    return { ...DEFAULT_INITIAL_INVENTORY };
  }

  saveLeafInventory(inv: LeafInventory, userId?: string): void {
    inv.lastUpdated = new Date().toISOString();
    this.set(GLOBAL_KEYS.stationLeafInventory, inv);
    const uid = userId || this.getActiveUserId();
    if (uid) {
      this.set(this.getTenantKey('leaf_inventory', uid), inv);
    }
    this.inventory$.next(inv);
  }

  getLeafMovements(userId?: string): LeafMovement[] {
    let movements = this.get<LeafMovement[]>(GLOBAL_KEYS.stationLeafMovements, []);
    if (movements.length === 0) {
      const uid = userId || this.getActiveUserId();
      if (uid) {
        const legacy = this.get<LeafMovement[]>(this.getTenantKey('leaf_movements', uid), []);
        if (legacy.length > 0) {
          movements = legacy;
          this.set(GLOBAL_KEYS.stationLeafMovements, movements);
        }
      }
    }
    return movements;
  }

  saveLeafMovements(movements: LeafMovement[], userId?: string): void {
    this.set(GLOBAL_KEYS.stationLeafMovements, movements);
    const uid = userId || this.getActiveUserId();
    if (uid) {
      this.set(this.getTenantKey('leaf_movements', uid), movements);
    }
    this.leafMovements$.next(movements);
  }

  addLeafMovement(movement: LeafMovement, operator?: { id: string; name: string; role: string }): void {
    const activeUser = this.getActiveUser();
    const opId = movement.operatorId || operator?.id || activeUser?.id;
    const opName = movement.operatorName || operator?.name || activeUser?.username || 'Station Operator';
    const opRole = movement.operatorRole || operator?.role || activeUser?.role || 'Moriculture & Forage Attendant';

    const enriched: LeafMovement = {
      ...movement,
      operatorId: opId,
      operatorName: opName,
      operatorRole: opRole,
    };

    const list = this.getLeafMovements();
    list.unshift(enriched);
    this.saveLeafMovements(list);

    const inv = this.getLeafInventory();
    const qty = enriched.direction === 'inflow' ? enriched.quantityKg : -enriched.quantityKg;
    if (enriched.leafType === 'mulberry') {
      inv.mulberryKg = Math.max(0, Math.round((inv.mulberryKg + qty) * 100) / 100);
    } else if (enriched.leafType === 'castor') {
      inv.castorKg = Math.max(0, Math.round((inv.castorKg + qty) * 100) / 100);
    } else {
      inv.kesseruKg = Math.max(0, Math.round((inv.kesseruKg + qty) * 100) / 100);
    }
    this.saveLeafInventory(inv);

    if (enriched.direction === 'inflow') {
      this.addAuditLog({
        id: `audit-stock-in-${Date.now()}`,
        timestamp: enriched.date,
        operatorId: opId,
        operatorName: opName,
        operatorRole: opRole,
        actionType: 'leaf_inflow',
        title: 'Forage Stock Harvest & Inflow',
        details: `Received ${enriched.quantityKg.toFixed(1)} kg fresh ${enriched.leafType} into station stockpile. Reason: ${enriched.reason}.`,
        metrics: `+${enriched.quantityKg.toFixed(1)} kg ${enriched.leafType}`,
      });
    }
  }

  // --------------------------------------------------------------------------
  // Station Payments
  // --------------------------------------------------------------------------

  getPayments(userId?: string): PaymentRecord[] {
    let payments = this.get<PaymentRecord[]>(GLOBAL_KEYS.stationPayments, []);
    if (payments.length === 0) {
      const uid = userId || this.getActiveUserId();
      if (uid) {
        const legacy = this.get<PaymentRecord[]>(this.getTenantKey('payments', uid), []);
        if (legacy.length > 0) {
          payments = legacy;
          this.set(GLOBAL_KEYS.stationPayments, payments);
        }
      }
    }
    return payments;
  }

  savePayments(payments: PaymentRecord[], userId?: string): void {
    this.set(GLOBAL_KEYS.stationPayments, payments);
    const uid = userId || this.getActiveUserId();
    if (uid) {
      this.set(this.getTenantKey('payments', uid), payments);
    }
    this.payments$.next(payments);
  }

  addPayment(payment: PaymentRecord): void {
    const list = this.getPayments();
    list.unshift(payment);
    this.savePayments(list);
  }

  // --------------------------------------------------------------------------
  // Station Profile
  // --------------------------------------------------------------------------

  getProfile(userId?: string): FarmProfile | null {
    const stationProfile = this.get<FarmProfile | null>(GLOBAL_KEYS.stationProfile, null);
    if (stationProfile) return stationProfile;

    const uid = userId || this.getActiveUserId();
    if (uid) {
      const raw = localStorage.getItem(this.getTenantKey('profile', uid));
      if (raw) {
        try {
          const prof = JSON.parse(raw) as FarmProfile;
          this.set(GLOBAL_KEYS.stationProfile, prof);
          return prof;
        } catch {}
      }
    }
    return DEFAULT_STATION_PROFILE;
  }

  saveProfile(profile: FarmProfile, userId?: string): void {
    profile.updatedAt = new Date().toISOString();
    this.set(GLOBAL_KEYS.stationProfile, profile);
    const uid = userId || profile.userId || this.getActiveUserId();
    if (uid) {
      this.set(this.getTenantKey('profile', uid), profile);
    }
    this.profile$.next(profile);
  }

  // --------------------------------------------------------------------------
  // Station Operations Audit Log
  // --------------------------------------------------------------------------

  getAuditLogs(): AuditLogEntry[] {
    return this.get<AuditLogEntry[]>(GLOBAL_KEYS.stationAuditLog, []);
  }

  saveAuditLogs(logs: AuditLogEntry[]): void {
    const pruned = logs.slice(0, 600);
    this.set(GLOBAL_KEYS.stationAuditLog, pruned);
    this.auditLogs$.next(pruned);
  }

  addAuditLog(entry: AuditLogEntry): void {
    const list = this.getAuditLogs();
    list.unshift(entry);
    this.saveAuditLogs(list);
  }

  clearAuditLogs(): void {
    this.saveAuditLogs([]);
  }

  exportAuditLogsCsv(): string {
    const logs = this.getAuditLogs();
    const rows = [
      ['Timestamp (ISO)', 'Date', 'Time (EAT)', 'Staff Name', 'Staff Role', 'Staff ID', 'Action Type', 'Batch / Location', 'Metrics', 'Details'].join(','),
      ...logs.map((e) => {
        const d = new Date(e.timestamp);
        const dateStr = d.toLocaleDateString('en-GB');
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return [
          e.timestamp,
          dateStr,
          timeStr,
          `"${e.operatorName.replace(/"/g, '""')}"`,
          `"${e.operatorRole.replace(/"/g, '""')}"`,
          `"${(e.operatorId || '').replace(/"/g, '""')}"`,
          `"${e.actionType}"`,
          `"${(e.batchTag || e.roomName || '').replace(/"/g, '""')}"`,
          `"${(e.metrics || '').replace(/"/g, '""')}"`,
          `"${e.details.replace(/"/g, '""')}"`,
        ].join(',');
      }),
    ];
    return rows.join('\n');
  }

  // --------------------------------------------------------------------------
  // Exports, Full Backups & Security Signatures
  // --------------------------------------------------------------------------

  async exportActiveUserBackupJson(): Promise<string> {
    const uid = this.getActiveUserId();
    const user = this.getActiveUser();
    if (!uid || !user) {
      return JSON.stringify({ message: 'No active staff profile to export.' }, null, 2);
    }

    const data = {
      user,
      profile: this.getProfile(uid),
      batches: this.getBatches(uid),
      feedLogs: this.getFeedLogs(uid),
      mortalityLogs: this.getMortalityLogs(uid),
      environmentLogs: this.getEnvironmentLogs(uid),
      cocoonHarvests: this.getCocoonHarvests(uid),
      leafInventory: this.getLeafInventory(uid),
      leafMovements: this.getLeafMovements(uid),
      payments: this.getPayments(uid),
      auditLogs: this.getAuditLogs(),
    };

    const dataJson = JSON.stringify(data);
    const msgBuffer = new TextEncoder().encode(dataJson);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const payload = {
      format: 'kalro_user_export_v1',
      version: 1,
      userId: uid,
      exportedAt: new Date().toISOString(),
      checksum,
      data,
    };

    return JSON.stringify(payload, null, 2);
  }

  async exportFullDatabaseBackupJson(): Promise<string> {
    const users = this.getAllUsers();
    const fullDb = {
      users,
      profile: this.getProfile(),
      batches: this.getBatches(),
      feedLogs: this.getFeedLogs(),
      mortalityLogs: this.getMortalityLogs(),
      environmentLogs: this.getEnvironmentLogs(),
      cocoonHarvests: this.getCocoonHarvests(),
      leafInventory: this.getLeafInventory(),
      leafMovements: this.getLeafMovements(),
      payments: this.getPayments(),
      auditLogs: this.getAuditLogs(),
    };

    const dataJson = JSON.stringify(fullDb);
    const msgBuffer = new TextEncoder().encode(dataJson);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const payload = {
      format: 'kalro_sericulture_full_station_v1',
      version: 1,
      exportedAt: new Date().toISOString(),
      checksum,
      data: fullDb,
    };

    return JSON.stringify(payload, null, 2);
  }

  async importBackupJson(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const payload = JSON.parse(jsonString);

      if (payload.data) {
        const d = payload.data;
        if (Array.isArray(d.users)) this.saveUsers(d.users);
        if (d.profile) this.saveProfile(d.profile);
        if (Array.isArray(d.batches)) this.saveBatches(d.batches);
        if (Array.isArray(d.feedLogs)) this.saveFeedLogs(d.feedLogs);
        if (Array.isArray(d.mortalityLogs)) this.saveMortalityLogs(d.mortalityLogs);
        if (Array.isArray(d.environmentLogs)) this.saveEnvironmentLogs(d.environmentLogs);
        if (Array.isArray(d.cocoonHarvests)) this.saveCocoonHarvests(d.cocoonHarvests);
        if (d.leafInventory) this.saveLeafInventory(d.leafInventory);
        if (Array.isArray(d.leafMovements)) this.saveLeafMovements(d.leafMovements);
        if (Array.isArray(d.payments)) this.savePayments(d.payments);
        if (Array.isArray(d.auditLogs)) this.saveAuditLogs(d.auditLogs);

        return { success: true, message: 'Station database restored successfully!' };
      }

      return { success: false, message: 'Unrecognized backup file format.' };
    } catch (e) {
      return { success: false, message: `Import error: ${(e as Error).message}` };
    }
  }

  exportBatchesCsv(): string {
    const batches = this.getBatches();
    const rows = [
      ['ID', 'Species', 'Batch Tag', 'Egg Count', 'Start Date', 'Status', 'Room', 'Created By', 'Notes'].join(','),
      ...batches.map((b) =>
        [
          b.id,
          b.species,
          `"${b.batchTag || ''}"`,
          b.eggCount,
          b.startDate,
          b.status,
          `"${b.roomName || ''}"`,
          `"${b.createdByName || ''}"`,
          `"${(b.notes || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];
    return rows.join('\n');
  }

  clearActiveUserRecords(): void {
    this.saveBatches([]);
    this.saveFeedLogs([]);
    this.saveMortalityLogs([]);
    this.saveEnvironmentLogs([]);
    this.saveCocoonHarvests([]);
    this.saveLeafInventory({ ...DEFAULT_INITIAL_INVENTORY });
    this.saveLeafMovements([]);
    this.savePayments([]);
    this.clearAuditLogs();
  }

  clearAllDatabase(): void {
    localStorage.clear();
    this.initDefaults();
  }

  clearAll(): void {
    this.clearActiveUserRecords();
  }

  exportBackupJson(): Promise<string> {
    return this.exportActiveUserBackupJson();
  }
}

export const storage = new StorageService();
