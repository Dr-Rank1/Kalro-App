import {
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

// IndexedDB database configuration for Option 3 offline persistence
const IDB_NAME = 'kalro_sericulture_multitenant_db';
const IDB_VERSION = 1;
const IDB_STORE = 'tenant_records';

const GLOBAL_KEYS = {
  usersRegistry: 'kalro_users_registry',
  activeUserId: 'kalro_active_user_id',
  dataVersion: 'kalro_multitenant_v1',
  theme: 'kalro_theme',
  lang: 'kalro_lang',
  // Legacy keys for migration detection
  legacyBatches: 'kalro_batches',
  legacyFeedLogs: 'kalro_feed_logs',
  legacyMortalityLogs: 'kalro_mortality_logs',
  legacyEnvironmentLogs: 'kalro_environment_logs',
  legacyCocoonHarvests: 'kalro_cocoon_harvests',
  legacyLeafInventory: 'kalro_leaf_inventory',
  legacyLeafMovements: 'kalro_leaf_movements',
  legacyPayments: 'kalro_payments',
  legacyProfile: 'kalro_profile',
};

// Default empty states per tenant - 100% real records, zero fake data
const DEFAULT_BATCHES: Batch[] = [];
const DEFAULT_FEED_LOGS: FeedLog[] = [];
const DEFAULT_MORTALITY_LOGS: MortalityLog[] = [];
const DEFAULT_ENV_LOGS: EnvironmentLog[] = [];
const DEFAULT_HARVESTS: CocoonHarvest[] = [];
const DEFAULT_LEAF_MOVEMENTS: LeafMovement[] = [];
const DEFAULT_PAYMENTS: PaymentRecord[] = [];

const DEFAULT_LEAF_INVENTORY: LeafInventory = {
  mulberryKg: 0,
  castorKg: 0,
  kesseruKg: 0,
  lastUpdated: new Date().toISOString(),
};

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user-kalro-01',
    username: 'Dr. Jane Wambua',
    role: 'station_manager',
    stationName: 'KALRO Sericulture Sub-Center, Machakos',
    county: 'Machakos',
    phone: '+254 712 345 678',
    email: 'jane.wambua@kalro.org',
    avatarColor: '#1B5E20',
    avatarInitials: 'JW',
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'user-kalro-02',
    username: 'Peter Kamau',
    role: 'commercial_reeler',
    stationName: 'Kamau Silk Enterprise',
    county: 'Kiambu',
    phone: '+254 722 987 654',
    email: 'peter@kamausilk.co.ke',
    avatarColor: '#E65100',
    avatarInitials: 'PK',
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  },
];

export const createDefaultProfileForUser = (user: UserAccount): FarmProfile => ({
  id: `farm-${user.id}`,
  userId: user.id,
  orgName: user.stationName || 'KALRO Sericulture Station',
  county: user.county || 'Machakos',
  houseCount: 2,
  rearingBaysCount: 8,
  maxTrayCapacity: 60,
  mulberryAcreage: 2.5,
  mulberryCultivars: ['Kanva-2', 'S36'],
  castorAcreage: 1.0,
  kesseruTreesCount: 15,
  targetMarket: 'KALRO Central Reeling Unit & Thika Silk Mills',
  syncCode: `KALRO-SERI-${(user.county || 'KBU').slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
  managerName: user.username,
  managerRole: user.role,
  phone: user.phone || '',
  email: user.email || '',
  nationalId: '12345678',
  subCounty: user.county === 'Machakos' ? 'Machakos Central' : 'Thika West',
  ward: 'Central Ward',
  altitudeMeters: 1620,
  accreditationLevel: user.role === 'station_manager' ? 'Research Station' : 'Commercial Producer',
  avatarColor: user.avatarColor,
  createdAt: user.createdAt,
  updatedAt: new Date().toISOString(),
});

class StorageService {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  constructor() {
    this.initIndexedDb();
  }

  // Initialize IndexedDB backing layer
  private initIndexedDb(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.dbPromise = Promise.resolve(null);
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
        req.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn('IndexedDB not accessible, falling back to localStorage only.');
          resolve(null);
        };
      } catch (err) {
        console.warn('Failed to open IndexedDB', err);
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  // Save key-value to IndexedDB in background
  private async idbSet<T>(key: string, value: T): Promise<void> {
    try {
      const db = await this.initIndexedDb();
      if (!db) return;
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(value, key);
    } catch (e) {
      console.warn(`IndexedDB write error for key ${key}:`, e);
    }
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

  // Write key-value to localStorage and replicate to IndexedDB
  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Asynchronously mirror to IndexedDB
      this.idbSet(key, value);
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
    }
  }

  // Resolve tenant-namespaced storage key
  private getTenantKey(collection: string, userId?: string): string {
    const uid = userId || this.getActiveUserId();
    return `kalro_u_${uid}_${collection}`;
  }

  // --------------------------------------------------------------------------
  // Multi-Tenant User Registry Management
  // --------------------------------------------------------------------------

  // Returns all registered user accounts
  getAllUsers(): UserAccount[] {
    return this.get<UserAccount[]>(GLOBAL_KEYS.usersRegistry, DEFAULT_USERS);
  }

  // Returns the active user ID
  getActiveUserId(): string {
    const active = localStorage.getItem(GLOBAL_KEYS.activeUserId);
    if (active) return active;
    const users = this.getAllUsers();
    const fallbackId = users[0]?.id || 'user-kalro-01';
    localStorage.setItem(GLOBAL_KEYS.activeUserId, fallbackId);
    return fallbackId;
  }

  // Returns the active user account
  getActiveUser(): UserAccount {
    const activeId = this.getActiveUserId();
    const users = this.getAllUsers();
    return users.find((u) => u.id === activeId) || users[0] || DEFAULT_USERS[0];
  }

  // Switches active tenant/user
  setActiveUserId(userId: string): void {
    const users = this.getAllUsers();
    const found = users.find((u) => u.id === userId);
    if (found) {
      localStorage.setItem(GLOBAL_KEYS.activeUserId, userId);
      found.lastActiveAt = new Date().toISOString();
      this.saveUsers(users);
    }
  }

  // Save user list to registry
  private saveUsers(users: UserAccount[]): void {
    this.set(GLOBAL_KEYS.usersRegistry, users);
  }

  // Create a brand new independent farmer/operator profile
  createUserProfile(data: {
    username: string;
    role: UserRole;
    stationName: string;
    county: string;
    phone?: string;
    email?: string;
    pinCode?: string;
  }): UserAccount {
    const users = this.getAllUsers();
    const newId = `user-kalro-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Compute initials & distinctive color
    const parts = data.username.trim().split(/\s+/);
    const initials =
      parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : data.username.slice(0, 2).toUpperCase();

    const colors = ['#1B5E20', '#0D47A1', '#E65100', '#4A148C', '#00695C', '#BF360C', '#2E7D32'];
    const avatarColor = colors[users.length % colors.length];

    const newUser: UserAccount = {
      id: newId,
      username: data.username.trim(),
      role: data.role,
      stationName: data.stationName.trim(),
      county: data.county,
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      pinCode: data.pinCode?.trim(),
      avatarColor,
      avatarInitials: initials,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.saveUsers(users);

    // Initialize clean default profile & collections for this new user
    const defaultProfile = createDefaultProfileForUser(newUser);
    this.saveProfile(defaultProfile, newId);
    this.saveBatches([], newId);
    this.saveFeedLogs([], newId);
    this.saveMortalityLogs([], newId);
    this.saveEnvironmentLogs([], newId);
    this.saveCocoonHarvests([], newId);
    this.saveLeafInventory({ ...DEFAULT_LEAF_INVENTORY }, newId);
    this.saveLeafMovements([], newId);
    this.savePayments([], newId);

    // Switch to new user
    this.setActiveUserId(newId);
    return newUser;
  }

  // Update an existing farmer profile account
  updateUserProfile(updatedUser: UserAccount): void {
    const users = this.getAllUsers().map((u) => (u.id === updatedUser.id ? updatedUser : u));
    this.saveUsers(users);

    // Also sync with farm profile
    const profile = this.getProfile(updatedUser.id);
    profile.managerName = updatedUser.username;
    profile.managerRole = updatedUser.role;
    profile.orgName = updatedUser.stationName;
    profile.county = updatedUser.county;
    profile.phone = updatedUser.phone;
    profile.email = updatedUser.email;
    profile.avatarColor = updatedUser.avatarColor;
    profile.updatedAt = new Date().toISOString();
    this.saveProfile(profile, updatedUser.id);
  }

  // Delete a user profile and all their isolated tenant data
  deleteUserProfile(userId: string): boolean {
    const users = this.getAllUsers();
    if (users.length <= 1) {
      return false; // Cannot delete the sole user
    }

    const filtered = users.filter((u) => u.id !== userId);
    this.saveUsers(filtered);

    // Remove tenant collections
    const collections = [
      'batches',
      'feed_logs',
      'mortality_logs',
      'environment_logs',
      'cocoon_harvests',
      'leaf_inventory',
      'leaf_movements',
      'payments',
      'profile',
    ];
    collections.forEach((col) => {
      localStorage.removeItem(`kalro_u_${userId}_${col}`);
    });

    // If deleted user was active, switch to first remaining user
    if (this.getActiveUserId() === userId) {
      this.setActiveUserId(filtered[0].id);
    }

    return true;
  }

  // --------------------------------------------------------------------------
  // Storage Initialization & Seamless Migration
  // --------------------------------------------------------------------------

  initDefaults(): void {
    const hasInitialized = localStorage.getItem(GLOBAL_KEYS.dataVersion);

    if (!hasInitialized) {
      // Check if there was legacy unpartitioned data to migrate
      const legacyBatchesStr = localStorage.getItem(GLOBAL_KEYS.legacyBatches);
      const legacyProfileStr = localStorage.getItem(GLOBAL_KEYS.legacyProfile);

      let initialUsers = DEFAULT_USERS;
      const primaryUser = initialUsers[0];

      // If legacy profile existed, adopt its details into the primary user
      if (legacyProfileStr) {
        try {
          const lp = JSON.parse(legacyProfileStr) as FarmProfile;
          if (lp.managerName) primaryUser.username = lp.managerName;
          if (lp.orgName) primaryUser.stationName = lp.orgName;
          if (lp.county) primaryUser.county = lp.county;
        } catch {
          // ignore parsing error
        }
      }

      this.saveUsers(initialUsers);
      localStorage.setItem(GLOBAL_KEYS.activeUserId, primaryUser.id);

      // Migrate existing unpartitioned data into user-kalro-01
      const defaultProfile = createDefaultProfileForUser(primaryUser);
      if (legacyProfileStr) {
        try {
          const lp = JSON.parse(legacyProfileStr);
          Object.assign(defaultProfile, lp);
        } catch {}
      }
      this.saveProfile(defaultProfile, primaryUser.id);

      if (legacyBatchesStr) {
        try {
          const b = JSON.parse(legacyBatchesStr);
          this.saveBatches(b, primaryUser.id);
        } catch {}
      } else {
        this.saveBatches(DEFAULT_BATCHES, primaryUser.id);
      }

      const migrateCollection = (legacyKey: string, tenantCol: string, fallback: any) => {
        const raw = localStorage.getItem(legacyKey);
        if (raw) {
          try {
            this.set(this.getTenantKey(tenantCol, primaryUser.id), JSON.parse(raw));
            localStorage.removeItem(legacyKey);
          } catch {
            this.set(this.getTenantKey(tenantCol, primaryUser.id), fallback);
          }
        } else {
          this.set(this.getTenantKey(tenantCol, primaryUser.id), fallback);
        }
      };

      migrateCollection(GLOBAL_KEYS.legacyFeedLogs, 'feed_logs', DEFAULT_FEED_LOGS);
      migrateCollection(GLOBAL_KEYS.legacyMortalityLogs, 'mortality_logs', DEFAULT_MORTALITY_LOGS);
      migrateCollection(GLOBAL_KEYS.legacyEnvironmentLogs, 'environment_logs', DEFAULT_ENV_LOGS);
      migrateCollection(GLOBAL_KEYS.legacyCocoonHarvests, 'cocoon_harvests', DEFAULT_HARVESTS);
      migrateCollection(GLOBAL_KEYS.legacyLeafInventory, 'leaf_inventory', DEFAULT_LEAF_INVENTORY);
      migrateCollection(GLOBAL_KEYS.legacyLeafMovements, 'leaf_movements', DEFAULT_LEAF_MOVEMENTS);
      migrateCollection(GLOBAL_KEYS.legacyPayments, 'payments', DEFAULT_PAYMENTS);

      // Initialize secondary sample user profile too
      const secondaryUser = initialUsers[1];
      if (secondaryUser) {
        const p2 = createDefaultProfileForUser(secondaryUser);
        this.saveProfile(p2, secondaryUser.id);
        this.saveBatches([], secondaryUser.id);
        this.saveFeedLogs([], secondaryUser.id);
        this.saveMortalityLogs([], secondaryUser.id);
        this.saveEnvironmentLogs([], secondaryUser.id);
        this.saveCocoonHarvests([], secondaryUser.id);
        this.saveLeafInventory({ ...DEFAULT_LEAF_INVENTORY }, secondaryUser.id);
        this.saveLeafMovements([], secondaryUser.id);
        this.savePayments([], secondaryUser.id);
      }

      // Cleanup legacy keys
      localStorage.removeItem(GLOBAL_KEYS.legacyBatches);
      localStorage.removeItem(GLOBAL_KEYS.legacyProfile);

      localStorage.setItem(GLOBAL_KEYS.dataVersion, 'true');
      return;
    }

    // Ensure active user exists in registry
    const users = this.getAllUsers();
    if (users.length === 0) {
      this.saveUsers(DEFAULT_USERS);
      localStorage.setItem(GLOBAL_KEYS.activeUserId, DEFAULT_USERS[0].id);
    }
  }

  // --------------------------------------------------------------------------
  // Per-Tenant Data Collections
  // --------------------------------------------------------------------------

  // Batches
  getBatches(userId?: string): Batch[] {
    return this.get<Batch[]>(this.getTenantKey('batches', userId), DEFAULT_BATCHES);
  }
  saveBatches(batches: Batch[], userId?: string): void {
    this.set(this.getTenantKey('batches', userId), batches);
  }
  addBatch(batch: Batch): void {
    const list = this.getBatches();
    list.unshift(batch);
    this.saveBatches(list);
  }
  updateBatch(batch: Batch): void {
    const list = this.getBatches().map((b) => (b.id === batch.id ? batch : b));
    this.saveBatches(list);
  }

  // Feed Logs
  getFeedLogs(userId?: string): FeedLog[] {
    return this.get<FeedLog[]>(this.getTenantKey('feed_logs', userId), DEFAULT_FEED_LOGS);
  }
  saveFeedLogs(logs: FeedLog[], userId?: string): void {
    this.set(this.getTenantKey('feed_logs', userId), logs);
  }
  addFeedLog(log: FeedLog): void {
    const list = this.getFeedLogs();
    list.unshift(log);
    this.saveFeedLogs(list);

    // Deduct stock if available in current user's inventory
    const inv = this.getLeafInventory();
    const kg = log.quantityGrams / 1000.0;
    if (log.leafType === 'mulberry') {
      inv.mulberryKg = Math.max(0, inv.mulberryKg - kg);
    } else if (log.leafType === 'castor') {
      inv.castorKg = Math.max(0, inv.castorKg - kg);
    } else {
      inv.kesseruKg = Math.max(0, inv.kesseruKg - kg);
    }
    this.saveLeafInventory(inv);
  }

  // Mortality Logs
  getMortalityLogs(userId?: string): MortalityLog[] {
    return this.get<MortalityLog[]>(this.getTenantKey('mortality_logs', userId), DEFAULT_MORTALITY_LOGS);
  }
  saveMortalityLogs(logs: MortalityLog[], userId?: string): void {
    this.set(this.getTenantKey('mortality_logs', userId), logs);
  }
  addMortalityLog(log: MortalityLog): void {
    const list = this.getMortalityLogs();
    list.unshift(log);
    this.saveMortalityLogs(list);
  }

  // Environment Logs
  getEnvironmentLogs(userId?: string): EnvironmentLog[] {
    return this.get<EnvironmentLog[]>(this.getTenantKey('environment_logs', userId), DEFAULT_ENV_LOGS);
  }
  saveEnvironmentLogs(logs: EnvironmentLog[], userId?: string): void {
    this.set(this.getTenantKey('environment_logs', userId), logs);
  }
  addEnvironmentLog(log: EnvironmentLog): void {
    const list = this.getEnvironmentLogs();
    list.unshift(log);
    this.saveEnvironmentLogs(list);
  }

  // Cocoon Harvests
  getCocoonHarvests(userId?: string): CocoonHarvest[] {
    return this.get<CocoonHarvest[]>(this.getTenantKey('cocoon_harvests', userId), DEFAULT_HARVESTS);
  }
  saveCocoonHarvests(harvests: CocoonHarvest[], userId?: string): void {
    this.set(this.getTenantKey('cocoon_harvests', userId), harvests);
  }
  addCocoonHarvest(harvest: CocoonHarvest): void {
    const list = this.getCocoonHarvests();
    list.unshift(harvest);
    this.saveCocoonHarvests(list);
  }

  // Leaf Inventory
  getLeafInventory(userId?: string): LeafInventory {
    return this.get<LeafInventory>(this.getTenantKey('leaf_inventory', userId), DEFAULT_LEAF_INVENTORY);
  }
  saveLeafInventory(inv: LeafInventory, userId?: string): void {
    inv.lastUpdated = new Date().toISOString();
    this.set(this.getTenantKey('leaf_inventory', userId), inv);
  }

  // Leaf Movements
  getLeafMovements(userId?: string): LeafMovement[] {
    return this.get<LeafMovement[]>(this.getTenantKey('leaf_movements', userId), DEFAULT_LEAF_MOVEMENTS);
  }
  saveLeafMovements(movements: LeafMovement[], userId?: string): void {
    this.set(this.getTenantKey('leaf_movements', userId), movements);
  }
  addLeafMovement(movement: LeafMovement): void {
    const list = this.getLeafMovements();
    list.unshift(movement);
    this.saveLeafMovements(list);

    // Update inventory balance
    const inv = this.getLeafInventory();
    const qty = movement.direction === 'inflow' ? movement.quantityKg : -movement.quantityKg;
    if (movement.leafType === 'mulberry') {
      inv.mulberryKg = Math.max(0, inv.mulberryKg + qty);
    } else if (movement.leafType === 'castor') {
      inv.castorKg = Math.max(0, inv.castorKg + qty);
    } else {
      inv.kesseruKg = Math.max(0, inv.kesseruKg + qty);
    }
    this.saveLeafInventory(inv);
  }

  // Payments
  getPayments(userId?: string): PaymentRecord[] {
    return this.get<PaymentRecord[]>(this.getTenantKey('payments', userId), DEFAULT_PAYMENTS);
  }
  savePayments(payments: PaymentRecord[], userId?: string): void {
    this.set(this.getTenantKey('payments', userId), payments);
  }
  addPayment(payment: PaymentRecord): void {
    const list = this.getPayments();
    list.unshift(payment);
    this.savePayments(list);
  }

  // Farm Profile
  getProfile(userId?: string): FarmProfile {
    const uid = userId || this.getActiveUserId();
    const user = this.getAllUsers().find((u) => u.id === uid) || this.getActiveUser();
    const defaultProfile = createDefaultProfileForUser(user);
    return this.get<FarmProfile>(this.getTenantKey('profile', uid), defaultProfile);
  }
  saveProfile(profile: FarmProfile, userId?: string): void {
    const uid = userId || this.getActiveUserId();
    profile.updatedAt = new Date().toISOString();
    this.set(this.getTenantKey('profile', uid), profile);
  }

  // --------------------------------------------------------------------------
  // Exports, Full Backups & Security Signatures (SHA-256)
  // --------------------------------------------------------------------------

  // Export single user backup JSON
  async exportActiveUserBackupJson(): Promise<string> {
    const uid = this.getActiveUserId();
    const user = this.getActiveUser();
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

  // Export full multi-tenant offline database backup JSON
  async exportFullDatabaseBackupJson(): Promise<string> {
    const users = this.getAllUsers();
    const tenantData: Record<string, any> = {};

    users.forEach((u) => {
      tenantData[u.id] = {
        profile: this.getProfile(u.id),
        batches: this.getBatches(u.id),
        feedLogs: this.getFeedLogs(u.id),
        mortalityLogs: this.getMortalityLogs(u.id),
        environmentLogs: this.getEnvironmentLogs(u.id),
        cocoonHarvests: this.getCocoonHarvests(u.id),
        leafInventory: this.getLeafInventory(u.id),
        leafMovements: this.getLeafMovements(u.id),
        payments: this.getPayments(u.id),
      };
    });

    const fullDb = {
      users,
      activeUserId: this.getActiveUserId(),
      tenants: tenantData,
    };

    const dataJson = JSON.stringify(fullDb);
    const msgBuffer = new TextEncoder().encode(dataJson);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const payload = {
      format: 'kalro_multi_tenant_full_db_v1',
      version: 1,
      exportedAt: new Date().toISOString(),
      checksum,
      data: fullDb,
    };

    return JSON.stringify(payload, null, 2);
  }

  // Restore backup with SHA-256 integrity verification
  async importBackupJson(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const payload = JSON.parse(jsonString);

      // Verify SHA-256 checksum if provided
      if (payload.checksum && payload.data) {
        const dataJson = JSON.stringify(payload.data);
        const msgBuffer = new TextEncoder().encode(dataJson);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const actualHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        if (actualHash !== payload.checksum) {
          return {
            success: false,
            message: 'Cryptographic Checksum Mismatch! The backup file is corrupted or has been modified.',
          };
        }
      }

      // Format A: Full Multi-Tenant Database
      if (payload.format === 'kalro_multi_tenant_full_db_v1' || payload.data?.tenants) {
        const db = payload.data;
        if (Array.isArray(db.users)) {
          this.saveUsers(db.users);
        }
        if (db.activeUserId) {
          localStorage.setItem(GLOBAL_KEYS.activeUserId, db.activeUserId);
        }
        if (db.tenants) {
          Object.keys(db.tenants).forEach((uid) => {
            const td = db.tenants[uid];
            if (td.profile) this.saveProfile(td.profile, uid);
            if (Array.isArray(td.batches)) this.saveBatches(td.batches, uid);
            if (Array.isArray(td.feedLogs)) this.saveFeedLogs(td.feedLogs, uid);
            if (Array.isArray(td.mortalityLogs)) this.saveMortalityLogs(td.mortalityLogs, uid);
            if (Array.isArray(td.environmentLogs)) this.saveEnvironmentLogs(td.environmentLogs, uid);
            if (Array.isArray(td.cocoonHarvests)) this.saveCocoonHarvests(td.cocoonHarvests, uid);
            if (td.leafInventory) this.saveLeafInventory(td.leafInventory, uid);
            if (Array.isArray(td.leafMovements)) this.saveLeafMovements(td.leafMovements, uid);
            if (Array.isArray(td.payments)) this.savePayments(td.payments, uid);
          });
        }
        return { success: true, message: 'Full Multi-Tenant Database restored successfully!' };
      }

      // Format B: Single User Tenant Export
      if (payload.data?.user || payload.format === 'kalro_user_export_v1') {
        const d = payload.data;
        const user = d.user as UserAccount;
        if (user && user.id) {
          // Check if user already exists
          const users = this.getAllUsers();
          const existingIdx = users.findIndex((u) => u.id === user.id);
          if (existingIdx >= 0) {
            users[existingIdx] = user;
          } else {
            users.push(user);
          }
          this.saveUsers(users);

          const uid = user.id;
          if (d.profile) this.saveProfile(d.profile, uid);
          if (Array.isArray(d.batches)) this.saveBatches(d.batches, uid);
          if (Array.isArray(d.feedLogs)) this.saveFeedLogs(d.feedLogs, uid);
          if (Array.isArray(d.mortalityLogs)) this.saveMortalityLogs(d.mortalityLogs, uid);
          if (Array.isArray(d.environmentLogs)) this.saveEnvironmentLogs(d.environmentLogs, uid);
          if (Array.isArray(d.cocoonHarvests)) this.saveCocoonHarvests(d.cocoonHarvests, uid);
          if (d.leafInventory) this.saveLeafInventory(d.leafInventory, uid);
          if (Array.isArray(d.leafMovements)) this.saveLeafMovements(d.leafMovements, uid);
          if (Array.isArray(d.payments)) this.savePayments(d.payments, uid);

          this.setActiveUserId(uid);
          return { success: true, message: `Profile and records for "${user.username}" imported successfully!` };
        }
      }

      // Format C: Legacy single station format
      if (payload.data) {
        const d = payload.data;
        const uid = this.getActiveUserId();
        if (Array.isArray(d.batches)) this.saveBatches(d.batches, uid);
        if (Array.isArray(d.feedLogs)) this.saveFeedLogs(d.feedLogs, uid);
        if (Array.isArray(d.mortalityLogs)) this.saveMortalityLogs(d.mortalityLogs, uid);
        if (Array.isArray(d.environmentLogs)) this.saveEnvironmentLogs(d.environmentLogs, uid);
        if (Array.isArray(d.cocoonHarvests)) this.saveCocoonHarvests(d.cocoonHarvests, uid);
        if (d.leafInventory) this.saveLeafInventory(d.leafInventory, uid);
        if (Array.isArray(d.leafMovements)) this.saveLeafMovements(d.leafMovements, uid);
        if (Array.isArray(d.payments)) this.savePayments(d.payments, uid);
        if (d.profile) this.saveProfile(d.profile, uid);

        return { success: true, message: 'Station backup restored into active profile!' };
      }

      return { success: false, message: 'Unrecognized backup format. Please select a valid KALRO backup file.' };
    } catch (e) {
      return { success: false, message: `Import error: ${(e as Error).message}` };
    }
  }

  // Export CSV of batch rearing summary for current active tenant
  exportBatchesCsv(): string {
    const batches = this.getBatches();
    const rows = [
      ['ID', 'Species', 'Batch Tag', 'Egg Count', 'Start Date', 'Status', 'Room', 'Notes'].join(','),
      ...batches.map((b) =>
        [
          b.id,
          b.species,
          `"${b.batchTag || ''}"`,
          b.eggCount,
          b.startDate,
          b.status,
          `"${b.roomName || ''}"`,
          `"${(b.notes || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];
    return rows.join('\n');
  }

  // Clear data for the current active tenant ONLY (preserves other tenants)
  clearActiveUserRecords(): void {
    const uid = this.getActiveUserId();
    this.saveBatches([], uid);
    this.saveFeedLogs([], uid);
    this.saveMortalityLogs([], uid);
    this.saveEnvironmentLogs([], uid);
    this.saveCocoonHarvests([], uid);
    this.saveLeafInventory({ ...DEFAULT_LEAF_INVENTORY }, uid);
    this.saveLeafMovements([], uid);
    this.savePayments([], uid);
  }

  // Clear all tenants and reset database (Factory reset)
  clearAllDatabase(): void {
    localStorage.clear();
    this.initDefaults();
  }

  // Alias for backward compatibility
  clearAll(): void {
    this.clearActiveUserRecords();
  }

  exportBackupJson(): Promise<string> {
    return this.exportActiveUserBackupJson();
  }
}

export const storage = new StorageService();
