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
} from './types';

const STORAGE_KEYS = {
  batches: 'kalro_batches',
  feedLogs: 'kalro_feed_logs',
  mortalityLogs: 'kalro_mortality_logs',
  environmentLogs: 'kalro_environment_logs',
  cocoonHarvests: 'kalro_cocoon_harvests',
  leafInventory: 'kalro_leaf_inventory',
  leafMovements: 'kalro_leaf_movements',
  payments: 'kalro_payments',
  profile: 'kalro_profile',
  theme: 'kalro_theme',
  lang: 'kalro_lang',
  dataVersion: 'kalro_clean_real_only_v3',
};

// Default empty states - Zero fake records
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

const DEFAULT_PROFILE: FarmProfile = {
  id: 'station-01',
  orgName: 'KALRO Sericulture Farm',
  county: 'Kiambu',
  houseCount: 1,
  syncCode: 'KALRO-001',
  managerName: '',
};

class StorageService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to localStorage`, e);
    }
  }

  // Initialize storage: purges any legacy fake/seed records and sets up clean initial storage
  initDefaults(): void {
    const isClean = localStorage.getItem(STORAGE_KEYS.dataVersion);
    if (!isClean) {
      this.clearAll();
      localStorage.setItem(STORAGE_KEYS.dataVersion, 'true');
      return;
    }

    if (!localStorage.getItem(STORAGE_KEYS.batches)) {
      this.set(STORAGE_KEYS.batches, DEFAULT_BATCHES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.feedLogs)) {
      this.set(STORAGE_KEYS.feedLogs, DEFAULT_FEED_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.mortalityLogs)) {
      this.set(STORAGE_KEYS.mortalityLogs, DEFAULT_MORTALITY_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.environmentLogs)) {
      this.set(STORAGE_KEYS.environmentLogs, DEFAULT_ENV_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.cocoonHarvests)) {
      this.set(STORAGE_KEYS.cocoonHarvests, DEFAULT_HARVESTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.leafInventory)) {
      this.set(STORAGE_KEYS.leafInventory, DEFAULT_LEAF_INVENTORY);
    }
    if (!localStorage.getItem(STORAGE_KEYS.leafMovements)) {
      this.set(STORAGE_KEYS.leafMovements, DEFAULT_LEAF_MOVEMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.payments)) {
      this.set(STORAGE_KEYS.payments, DEFAULT_PAYMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.profile)) {
      this.set(STORAGE_KEYS.profile, DEFAULT_PROFILE);
    }
  }

  // Batches
  getBatches(): Batch[] {
    return this.get<Batch[]>(STORAGE_KEYS.batches, DEFAULT_BATCHES);
  }
  saveBatches(batches: Batch[]): void {
    this.set(STORAGE_KEYS.batches, batches);
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
  getFeedLogs(): FeedLog[] {
    return this.get<FeedLog[]>(STORAGE_KEYS.feedLogs, DEFAULT_FEED_LOGS);
  }
  saveFeedLogs(logs: FeedLog[]): void {
    this.set(STORAGE_KEYS.feedLogs, logs);
  }
  addFeedLog(log: FeedLog): void {
    const list = this.getFeedLogs();
    list.unshift(log);
    this.saveFeedLogs(list);

    // Deduct stock if available
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
  getMortalityLogs(): MortalityLog[] {
    return this.get<MortalityLog[]>(STORAGE_KEYS.mortalityLogs, DEFAULT_MORTALITY_LOGS);
  }
  saveMortalityLogs(logs: MortalityLog[]): void {
    this.set(STORAGE_KEYS.mortalityLogs, logs);
  }
  addMortalityLog(log: MortalityLog): void {
    const list = this.getMortalityLogs();
    list.unshift(log);
    this.saveMortalityLogs(list);
  }

  // Environment Logs
  getEnvironmentLogs(): EnvironmentLog[] {
    return this.get<EnvironmentLog[]>(STORAGE_KEYS.environmentLogs, DEFAULT_ENV_LOGS);
  }
  saveEnvironmentLogs(logs: EnvironmentLog[]): void {
    this.set(STORAGE_KEYS.environmentLogs, logs);
  }
  addEnvironmentLog(log: EnvironmentLog): void {
    const list = this.getEnvironmentLogs();
    list.unshift(log);
    this.saveEnvironmentLogs(list);
  }

  // Cocoon Harvests
  getCocoonHarvests(): CocoonHarvest[] {
    return this.get<CocoonHarvest[]>(STORAGE_KEYS.cocoonHarvests, DEFAULT_HARVESTS);
  }
  saveCocoonHarvests(harvests: CocoonHarvest[]): void {
    this.set(STORAGE_KEYS.cocoonHarvests, harvests);
  }
  addCocoonHarvest(harvest: CocoonHarvest): void {
    const list = this.getCocoonHarvests();
    list.unshift(harvest);
    this.saveCocoonHarvests(list);
  }

  // Leaf Inventory
  getLeafInventory(): LeafInventory {
    return this.get<LeafInventory>(STORAGE_KEYS.leafInventory, DEFAULT_LEAF_INVENTORY);
  }
  saveLeafInventory(inv: LeafInventory): void {
    inv.lastUpdated = new Date().toISOString();
    this.set(STORAGE_KEYS.leafInventory, inv);
  }

  // Leaf Movements
  getLeafMovements(): LeafMovement[] {
    return this.get<LeafMovement[]>(STORAGE_KEYS.leafMovements, DEFAULT_LEAF_MOVEMENTS);
  }
  saveLeafMovements(movements: LeafMovement[]): void {
    this.set(STORAGE_KEYS.leafMovements, movements);
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
  getPayments(): PaymentRecord[] {
    return this.get<PaymentRecord[]>(STORAGE_KEYS.payments, DEFAULT_PAYMENTS);
  }
  savePayments(payments: PaymentRecord[]): void {
    this.set(STORAGE_KEYS.payments, payments);
  }
  addPayment(payment: PaymentRecord): void {
    const list = this.getPayments();
    list.unshift(payment);
    this.savePayments(list);
  }

  // Profile
  getProfile(): FarmProfile {
    return this.get<FarmProfile>(STORAGE_KEYS.profile, DEFAULT_PROFILE);
  }
  saveProfile(profile: FarmProfile): void {
    this.set(STORAGE_KEYS.profile, profile);
  }

  // SHA-256 backup export
  async exportBackupJson(): Promise<string> {
    const data = {
      batches: this.getBatches(),
      feedLogs: this.getFeedLogs(),
      mortalityLogs: this.getMortalityLogs(),
      environmentLogs: this.getEnvironmentLogs(),
      cocoonHarvests: this.getCocoonHarvests(),
      leafInventory: this.getLeafInventory(),
      leafMovements: this.getLeafMovements(),
      payments: this.getPayments(),
      profile: this.getProfile(),
    };

    const dataJson = JSON.stringify(data);
    const msgBuffer = new TextEncoder().encode(dataJson);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      checksum,
      data,
    };

    return JSON.stringify(payload, null, 2);
  }

  // Restore backup with SHA-256 verification
  async importBackupJson(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const payload = JSON.parse(jsonString);
      if (!payload.data || payload.version !== 1) {
        return { success: false, message: 'Invalid or unsupported KALRO backup file format.' };
      }

      if (payload.checksum) {
        const dataJson = JSON.stringify(payload.data);
        const msgBuffer = new TextEncoder().encode(dataJson);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const actualHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        if (actualHash !== payload.checksum) {
          return { success: false, message: 'Checksum mismatch! Backup file may be corrupted or modified.' };
        }
      }

      const d = payload.data;
      if (Array.isArray(d.batches)) this.saveBatches(d.batches);
      if (Array.isArray(d.feedLogs)) this.saveFeedLogs(d.feedLogs);
      if (Array.isArray(d.mortalityLogs)) this.saveMortalityLogs(d.mortalityLogs);
      if (Array.isArray(d.environmentLogs)) this.saveEnvironmentLogs(d.environmentLogs);
      if (Array.isArray(d.cocoonHarvests)) this.saveCocoonHarvests(d.cocoonHarvests);
      if (d.leafInventory) this.saveLeafInventory(d.leafInventory);
      if (Array.isArray(d.leafMovements)) this.saveLeafMovements(d.leafMovements);
      if (Array.isArray(d.payments)) this.savePayments(d.payments);
      if (d.profile) this.saveProfile(d.profile);

      return { success: true, message: 'Farm backup restored successfully!' };
    } catch (e) {
      return { success: false, message: `Failed to restore: ${(e as Error).message}` };
    }
  }

  // Export CSV of batch rearing summary
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

  // Reset to clean storage with zero fake records
  clearAll(): void {
    this.set(STORAGE_KEYS.batches, DEFAULT_BATCHES);
    this.set(STORAGE_KEYS.feedLogs, DEFAULT_FEED_LOGS);
    this.set(STORAGE_KEYS.mortalityLogs, DEFAULT_MORTALITY_LOGS);
    this.set(STORAGE_KEYS.environmentLogs, DEFAULT_ENV_LOGS);
    this.set(STORAGE_KEYS.cocoonHarvests, DEFAULT_HARVESTS);
    this.set(STORAGE_KEYS.leafInventory, DEFAULT_LEAF_INVENTORY);
    this.set(STORAGE_KEYS.leafMovements, DEFAULT_LEAF_MOVEMENTS);
    this.set(STORAGE_KEYS.payments, DEFAULT_PAYMENTS);
    this.set(STORAGE_KEYS.profile, DEFAULT_PROFILE);
  }
}

export const storage = new StorageService();
