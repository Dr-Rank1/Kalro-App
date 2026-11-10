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
  dataVersion: 'kalro_user_profiles_v4',
  theme: 'kalro_theme',
  lang: 'kalro_lang',
};

// Default empty states - Zero fake data, zero pre-seeded profiles
const DEFAULT_USERS: UserAccount[] = [];
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
          resolve(null);
        };
      } catch (err) {
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
    } catch {
      // IndexedDB optional background mirror
    }
  }

  // Remove key from IndexedDB in background
  private async idbDelete(key: string): Promise<void> {
    try {
      const db = await this.initIndexedDb();
      if (!db) return;
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.delete(key);
    } catch {
      // IndexedDB optional background mirror
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
      this.idbSet(key, value);
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
    }
  }

  // Resolve tenant-namespaced storage key
  private getTenantKey(collection: string, userId?: string): string {
    const uid = userId || this.getActiveUserId() || 'guest';
    return `kalro_u_${uid}_${collection}`;
  }

  // --------------------------------------------------------------------------
  // Multi-Tenant User Registry Management (No Default Profiles)
  // --------------------------------------------------------------------------

  // Returns all registered user accounts
  getAllUsers(): UserAccount[] {
    return this.get<UserAccount[]>(GLOBAL_KEYS.usersRegistry, DEFAULT_USERS);
  }

  // Returns the active user ID, or null if no users exist
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

  // Returns the active user account, or null if no user is set up
  getActiveUser(): UserAccount | null {
    const activeId = this.getActiveUserId();
    if (!activeId) return null;
    const users = this.getAllUsers();
    return users.find((u) => u.id === activeId) || null;
  }

  // Check if at least one profile is set up
  hasProfile(): boolean {
    return this.getActiveUser() !== null;
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
    subCounty?: string;
    phone?: string;
    email?: string;
    houseCount?: number;
    mulberryAcreage?: number;
    syncCode?: string;
    avatarColor?: string;
    pinCode?: string;
  }): { user: UserAccount; profile: FarmProfile } {
    const users = this.getAllUsers();
    const newId = `user-kalro-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Compute initials & distinctive color
    const parts = data.username.trim().split(/\s+/);
    const initials =
      parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : data.username.slice(0, 2).toUpperCase() || 'FP';

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
      avatarColor,
      avatarInitials: initials,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.saveUsers(users);

    const generatedCode =
      data.syncCode?.trim() ||
      `KALRO-SERI-${(data.county || 'KBU').slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newProfile: FarmProfile = {
      id: `farm-${newId}`,
      userId: newId,
      orgName: data.stationName.trim(),
      county: data.county,
      subCounty: data.subCounty?.trim() || '',
      houseCount: Number(data.houseCount) || 1,
      mulberryAcreage: Number(data.mulberryAcreage) || 1.0,
      syncCode: generatedCode,
      managerName: data.username.trim(),
      managerRole: data.role,
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      avatarColor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.saveProfile(newProfile, newId);
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
    return { user: newUser, profile: newProfile };
  }

  // Update an existing farmer profile account
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
        : data.username.slice(0, 2).toUpperCase() || 'FP';

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
      lastActiveAt: new Date().toISOString(),
    };
    users[userIdx] = updatedUser;
    this.saveUsers(users);

    const existingProfile = this.getProfile(uid) || {
      id: `farm-${uid}`,
      userId: uid,
      orgName: data.stationName,
      county: data.county,
      houseCount: 1,
      syncCode: 'KALRO-001',
      managerName: data.username,
    };

    const updatedProfile: FarmProfile = {
      ...existingProfile,
      managerName: data.username.trim(),
      managerRole: data.role,
      orgName: data.stationName.trim(),
      county: data.county,
      subCounty: data.subCounty?.trim() || '',
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      houseCount: Number(data.houseCount) || existingProfile.houseCount || 1,
      mulberryAcreage: Number(data.mulberryAcreage) || existingProfile.mulberryAcreage || 1.0,
      syncCode: data.syncCode?.trim() || existingProfile.syncCode,
      avatarColor: updatedUser.avatarColor,
      updatedAt: new Date().toISOString(),
    };
    this.saveProfile(updatedProfile, uid);

    return { user: updatedUser, profile: updatedProfile };
  }

  // Delete a user profile and all their isolated tenant data
  deleteUserProfile(userId: string): boolean {
    const users = this.getAllUsers();
    const currentActiveId = localStorage.getItem(GLOBAL_KEYS.activeUserId);
    const isDeletingActive = currentActiveId === userId || (!currentActiveId && users[0]?.id === userId);

    const filtered = users.filter((u) => u.id !== userId);
    this.saveUsers(filtered);

    // Remove tenant collections from localStorage and IndexedDB
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
      const key = `kalro_u_${userId}_${col}`;
      localStorage.removeItem(key);
      this.idbDelete(key);
    });

    if (filtered.length === 0) {
      localStorage.removeItem(GLOBAL_KEYS.activeUserId);
      this.idbDelete(GLOBAL_KEYS.activeUserId);
    } else if (isDeletingActive) {
      this.setActiveUserId(filtered[0].id);
    }

    return true;
  }

  // --------------------------------------------------------------------------
  // Storage Initialization (Zero Fake Profiles)
  // --------------------------------------------------------------------------

  initDefaults(): void {
    const isCleanVersion = localStorage.getItem(GLOBAL_KEYS.dataVersion);

    if (!isCleanVersion) {
      // Check if users currently stored are the pre-seeded demo users; if so, clear them
      const users = this.getAllUsers();
      const hasDemoUsers = users.some((u) => u.id === 'user-kalro-01' || u.id === 'user-kalro-02');
      if (hasDemoUsers) {
        localStorage.removeItem(GLOBAL_KEYS.usersRegistry);
        localStorage.removeItem(GLOBAL_KEYS.activeUserId);
        localStorage.removeItem('kalro_u_user-kalro-01_batches');
        localStorage.removeItem('kalro_u_user-kalro-01_profile');
        localStorage.removeItem('kalro_u_user-kalro-02_batches');
        localStorage.removeItem('kalro_u_user-kalro-02_profile');
      }
      localStorage.setItem(GLOBAL_KEYS.dataVersion, 'true');
    }
  }

  // --------------------------------------------------------------------------
  // Per-Tenant Data Collections
  // --------------------------------------------------------------------------

  // Batches
  getBatches(userId?: string): Batch[] {
    const uid = userId || this.getActiveUserId();
    if (!uid) return DEFAULT_BATCHES;
    return this.get<Batch[]>(this.getTenantKey('batches', uid), DEFAULT_BATCHES);
  }
  saveBatches(batches: Batch[], userId?: string): void {
    const uid = userId || this.getActiveUserId();
    if (!uid) return;
    this.set(this.getTenantKey('batches', uid), batches);
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
    const uid = userId || this.getActiveUserId();
    if (!uid) return DEFAULT_FEED_LOGS;
    return this.get<FeedLog[]>(this.getTenantKey('feed_logs', uid), DEFAULT_FEED_LOGS);
  }
  saveFeedLogs(logs: FeedLog[], userId?: string): void {
    const uid = userId || this.getActiveUserId();
    if (!uid) return;
    this.set(this.getTenantKey('feed_logs', uid), logs);
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
    const uid = userId || this.getActiveUserId();
    if (!uid) return DEFAULT_MORTALITY_LOGS;
    return this.get<MortalityLog[]>(this.getTenantKey('mortality_logs', uid), DEFAULT_MORTALITY_LOGS);
  }
  saveMortalityLogs(logs: MortalityLog[], userId?: string): void {
    const uid = userId || this.getActiveUserId();
    if (!uid) return;
    this.set(this.getTenantKey('mortality_logs', uid), logs);
  }
  addMortalityLog(log: MortalityLog): void {
    const list = this.getMortalityLogs();
    list.unshift(log);
    this.saveMortalityLogs(list);
  }

  // Environment Logs
  getEnvironmentLogs(userId?: string): EnvironmentLog[] {
    const uid = userId || this.getActiveUserId();
    if (!uid) return DEFAULT_ENV_LOGS;
    return this.get<EnvironmentLog[]>(this.getTenantKey('environment_logs', uid), DEFAULT_ENV_LOGS);
  }
  saveEnvironmentLogs(logs: EnvironmentLog[], userId?: string): void {
    const uid = userId || this.getActiveUserId();
    if (!uid) return;
    this.set(this.getTenantKey('environment_logs', uid), logs);
  }
  addEnvironmentLog(log: EnvironmentLog): void {
    const list = this.getEnvironmentLogs();
    list.unshift(log);
    this.saveEnvironmentLogs(list);
  }

  // Cocoon Harvests
  getCocoonHarvests(userId?: string): CocoonHarvest[] {
    const uid = userId || this.getActiveUserId();
    if (!uid) return DEFAULT_HARVESTS;
    return this.get<CocoonHarvest[]>(this.getTenantKey('cocoon_harvests', uid), DEFAULT_HARVESTS);
  }
  saveCocoonHarvests(harvests: CocoonHarvest[], userId?: string): void {
    const uid = userId || this.getActiveUserId();
    if (!uid) return;
    this.set(this.getTenantKey('cocoon_harvests', uid), harvests);
  }
  addCocoonHarvest(harvest: CocoonHarvest): void {
    const list = this.getCocoonHarvests();
    list.unshift(harvest);
    this.saveCocoonHarvests(list);
  }

  // Leaf Inventory
  getLeafInventory(userId?: string): LeafInventory {
    const uid = userId || this.getActiveUserId();
    if (!uid) return DEFAULT_LEAF_INVENTORY;
    return this.get<LeafInventory>(this.getTenantKey('leaf_inventory', uid), DEFAULT_LEAF_INVENTORY);
  }
  saveLeafInventory(inv: LeafInventory, userId?: string): void {
    const uid = userId || this.getActiveUserId();
    if (!uid) return;
    inv.lastUpdated = new Date().toISOString();
    this.set(this.getTenantKey('leaf_inventory', uid), inv);
  }

  // Leaf Movements
  getLeafMovements(userId?: string): LeafMovement[] {
    const uid = userId || this.getActiveUserId();
    if (!uid) return DEFAULT_LEAF_MOVEMENTS;
    return this.get<LeafMovement[]>(this.getTenantKey('leaf_movements', uid), DEFAULT_LEAF_MOVEMENTS);
  }
  saveLeafMovements(movements: LeafMovement[], userId?: string): void {
    const uid = userId || this.getActiveUserId();
    if (!uid) return;
    this.set(this.getTenantKey('leaf_movements', uid), movements);
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
    const uid = userId || this.getActiveUserId();
    if (!uid) return DEFAULT_PAYMENTS;
    return this.get<PaymentRecord[]>(this.getTenantKey('payments', uid), DEFAULT_PAYMENTS);
  }
  savePayments(payments: PaymentRecord[], userId?: string): void {
    const uid = userId || this.getActiveUserId();
    if (!uid) return;
    this.set(this.getTenantKey('payments', uid), payments);
  }
  addPayment(payment: PaymentRecord): void {
    const list = this.getPayments();
    list.unshift(payment);
    this.savePayments(list);
  }

  // Farm Profile
  getProfile(userId?: string): FarmProfile | null {
    const uid = userId || this.getActiveUserId();
    if (!uid) return null;
    const raw = localStorage.getItem(this.getTenantKey('profile', uid));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as FarmProfile;
    } catch {
      return null;
    }
  }

  saveProfile(profile: FarmProfile, userId?: string): void {
    const uid = userId || profile.userId || this.getActiveUserId();
    if (!uid) return;
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
    if (!uid || !user) {
      return JSON.stringify({ message: 'No active farmer profile to export.' }, null, 2);
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

  // Restore backup
  async importBackupJson(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const payload = JSON.parse(jsonString);

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
        return { success: true, message: 'Farm database restored successfully!' };
      }

      // Format B: Single User Tenant Export
      if (payload.data?.user || payload.format === 'kalro_user_export_v1') {
        const d = payload.data;
        const user = d.user as UserAccount;
        if (user && user.id) {
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
        if (uid) {
          if (Array.isArray(d.batches)) this.saveBatches(d.batches, uid);
          if (Array.isArray(d.feedLogs)) this.saveFeedLogs(d.feedLogs, uid);
          if (Array.isArray(d.mortalityLogs)) this.saveMortalityLogs(d.mortalityLogs, uid);
          if (Array.isArray(d.environmentLogs)) this.saveEnvironmentLogs(d.environmentLogs, uid);
          if (Array.isArray(d.cocoonHarvests)) this.saveCocoonHarvests(d.cocoonHarvests, uid);
          if (d.leafInventory) this.saveLeafInventory(d.leafInventory, uid);
          if (Array.isArray(d.leafMovements)) this.saveLeafMovements(d.leafMovements, uid);
          if (Array.isArray(d.payments)) this.savePayments(d.payments, uid);
          if (d.profile) this.saveProfile(d.profile, uid);
          return { success: true, message: 'Backup restored successfully!' };
        }
      }

      return { success: false, message: 'Unrecognized backup file format.' };
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

  // Clear data for the current active tenant ONLY
  clearActiveUserRecords(): void {
    const uid = this.getActiveUserId();
    if (!uid) return;
    this.saveBatches([], uid);
    this.saveFeedLogs([], uid);
    this.saveMortalityLogs([], uid);
    this.saveEnvironmentLogs([], uid);
    this.saveCocoonHarvests([], uid);
    this.saveLeafInventory({ ...DEFAULT_LEAF_INVENTORY }, uid);
    this.saveLeafMovements([], uid);
    this.savePayments([], uid);
  }

  // Clear all tenants and reset database
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
