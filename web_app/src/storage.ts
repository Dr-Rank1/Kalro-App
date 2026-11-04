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
};

// Realistic Kenyan sericulture demo seed data
const SEED_BATCHES: Batch[] = [
  {
    id: 'batch-bm-2026-01',
    species: 'bombyx',
    startDate: new Date(Date.now() - 17 * 86400000).toISOString().split('T')[0], // Day 17 (4th instar)
    eggCount: 40000, // 2 dfls (disease-free layings)
    status: 'active',
    batchTag: 'TRAY-BM-01',
    displayTag: 'Bombyx Lot #1 (Murang\'a High Yield)',
    roomName: 'House 1 - Main Rearing Room',
    notes: 'Healthy chawki rearing completed at center. Worms feeding vigorously.',
  },
  {
    id: 'batch-eri-2026-02',
    species: 'eri',
    startDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0], // Day 10 (3rd instar)
    eggCount: 20000,
    status: 'active',
    batchTag: 'TRAY-ERI-02',
    displayTag: 'Eri Lot #2 (Castor Fed)',
    roomName: 'House 2 - Eri Shed',
    notes: 'Castor forage supplied from farm plot A. Zero mortality in 1st/2nd instars.',
  },
  {
    id: 'batch-bm-2026-prior',
    species: 'bombyx',
    startDate: new Date(Date.now() - 50 * 86400000).toISOString().split('T')[0],
    eggCount: 40000,
    status: 'closed',
    batchTag: 'TRAY-BM-PREV',
    displayTag: 'Harvested Lot Sept 2026',
    roomName: 'House 1',
    notes: 'Completed cycle. Achieved Grade A with 22.5% shell ratio.',
  },
];

const SEED_FEED_LOGS: FeedLog[] = [
  {
    id: 'fl-1',
    batchId: 'batch-bm-2026-01',
    recordedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    quantityGrams: 8500,
    leafType: 'mulberry',
    wasSkipped: false,
  },
  {
    id: 'fl-2',
    batchId: 'batch-eri-2026-02',
    recordedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    quantityGrams: 4200,
    leafType: 'castor',
    wasSkipped: false,
  },
];

const SEED_MORTALITY_LOGS: MortalityLog[] = [
  {
    id: 'ml-1',
    batchId: 'batch-bm-2026-01',
    recordedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    count: 24,
    cause: 'Bed heat stress',
    symptoms: 'Sluggish behavior before bed cleaning',
  },
];

const SEED_ENV_LOGS: EnvironmentLog[] = [
  {
    id: 'el-1',
    batchId: 'batch-bm-2026-01',
    recordedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    temperatureCelsius: 25.4,
    humidityPercent: 74,
    ventilationStatus: 'optimal',
    notes: 'Cross-ventilation open, thermometer checked',
  },
  {
    id: 'el-2',
    batchId: 'batch-eri-2026-02',
    recordedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    temperatureCelsius: 24.8,
    humidityPercent: 70,
    ventilationStatus: 'optimal',
    notes: 'Curtains rolled up, good airflow',
  },
];

const SEED_HARVESTS: CocoonHarvest[] = [
  {
    id: 'ch-prev',
    batchId: 'batch-bm-2026-prior',
    harvestDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    cocoonCount: 36200,
    totalWeightGrams: 65160, // 65.16 kg
    shellWeightGrams: 36.2, // ~1.81g cocoon, 0.407g shell -> ~22.5% shell ratio
    defectiveCount: 1100, // ~3% defect rate
    doubleCount: 420,
    uziCount: 120,
    stainedCount: 280,
    flimsyCount: 180,
    meltedCount: 100,
    reeledWeightGrams: 9300, // Renditta ~7.0
    breakCount: 12,
  },
];

const SEED_LEAF_INVENTORY: LeafInventory = {
  mulberryKg: 145.0,
  castorKg: 80.0,
  kesseruKg: 30.0,
  lastUpdated: new Date().toISOString(),
};

const SEED_LEAF_MOVEMENTS: LeafMovement[] = [
  {
    id: 'lm-1',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    leafType: 'mulberry',
    quantityKg: 50,
    direction: 'inflow',
    reason: 'Morning harvest from Mulberry Plot 1',
  },
  {
    id: 'lm-2',
    date: new Date().toISOString().split('T')[0],
    leafType: 'castor',
    quantityKg: 30,
    direction: 'inflow',
    reason: 'Farm border castor collection',
  },
];

const SEED_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-1',
    date: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
    amount: 58640,
    direction: 'inflow',
    category: 'cocoon_sale',
    partyName: 'KALRO Sericulture Reeling Center Thika',
    status: 'settled',
    notes: 'Grade A silk cocoon sale @ KES 900/kg',
  },
  {
    id: 'pay-2',
    date: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
    amount: 4500,
    direction: 'outflow',
    category: 'egg_purchase',
    partyName: 'National Sericulture Seed Station',
    status: 'settled',
    notes: '2 DFLs certified Bombyx mori disease-free eggs',
  },
];

const SEED_PROFILE: FarmProfile = {
  id: 'farm-001-ke',
  orgName: 'KALRO Demonstration Silk Farm',
  county: 'Murang\'a',
  houseCount: 3,
  syncCode: 'KALRO-7821',
  managerName: 'Francis Mwangi',
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

  // Init seed data if empty
  initDefaults(): void {
    if (!localStorage.getItem(STORAGE_KEYS.batches)) {
      this.set(STORAGE_KEYS.batches, SEED_BATCHES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.feedLogs)) {
      this.set(STORAGE_KEYS.feedLogs, SEED_FEED_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.mortalityLogs)) {
      this.set(STORAGE_KEYS.mortalityLogs, SEED_MORTALITY_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.environmentLogs)) {
      this.set(STORAGE_KEYS.environmentLogs, SEED_ENV_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.cocoonHarvests)) {
      this.set(STORAGE_KEYS.cocoonHarvests, SEED_HARVESTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.leafInventory)) {
      this.set(STORAGE_KEYS.leafInventory, SEED_LEAF_INVENTORY);
    }
    if (!localStorage.getItem(STORAGE_KEYS.leafMovements)) {
      this.set(STORAGE_KEYS.leafMovements, SEED_LEAF_MOVEMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.payments)) {
      this.set(STORAGE_KEYS.payments, SEED_PAYMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.profile)) {
      this.set(STORAGE_KEYS.profile, SEED_PROFILE);
    }
  }

  // Batches
  getBatches(): Batch[] {
    return this.get<Batch[]>(STORAGE_KEYS.batches, SEED_BATCHES);
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
    return this.get<FeedLog[]>(STORAGE_KEYS.feedLogs, SEED_FEED_LOGS);
  }
  saveFeedLogs(logs: FeedLog[]): void {
    this.set(STORAGE_KEYS.feedLogs, logs);
  }
  addFeedLog(log: FeedLog): void {
    const list = this.getFeedLogs();
    list.unshift(log);
    this.saveFeedLogs(list);

    // Deduct stock automatically
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
    return this.get<MortalityLog[]>(STORAGE_KEYS.mortalityLogs, SEED_MORTALITY_LOGS);
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
    return this.get<EnvironmentLog[]>(STORAGE_KEYS.environmentLogs, SEED_ENV_LOGS);
  }
  saveEnvironmentLogs(logs: EnvironmentLog[]): void {
    this.set(STORAGE_KEYS.environmentLogs, logs);
  }
  addEnvironmentLog(log: EnvironmentLog): void {
    const list = this.getEnvironmentLogs();
    list.unshift(log);
    this.saveEnvironmentLogs(list);
  }

  // Harvests
  getCocoonHarvests(): CocoonHarvest[] {
    return this.get<CocoonHarvest[]>(STORAGE_KEYS.cocoonHarvests, SEED_HARVESTS);
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
    return this.get<LeafInventory>(STORAGE_KEYS.leafInventory, SEED_LEAF_INVENTORY);
  }
  saveLeafInventory(inv: LeafInventory): void {
    this.set(STORAGE_KEYS.leafInventory, { ...inv, lastUpdated: new Date().toISOString() });
  }

  // Leaf Movements
  getLeafMovements(): LeafMovement[] {
    return this.get<LeafMovement[]>(STORAGE_KEYS.leafMovements, SEED_LEAF_MOVEMENTS);
  }
  saveLeafMovements(movements: LeafMovement[]): void {
    this.set(STORAGE_KEYS.leafMovements, movements);
  }
  addLeafMovement(movement: LeafMovement): void {
    const list = this.getLeafMovements();
    list.unshift(movement);
    this.saveLeafMovements(list);

    const inv = this.getLeafInventory();
    const qty = movement.quantityKg * (movement.direction === 'inflow' ? 1 : -1);
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
    return this.get<PaymentRecord[]>(STORAGE_KEYS.payments, SEED_PAYMENTS);
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
    return this.get<FarmProfile>(STORAGE_KEYS.profile, SEED_PROFILE);
  }
  saveProfile(profile: FarmProfile): void {
    this.set(STORAGE_KEYS.profile, profile);
  }

  // Theme & Language
  getTheme(): 'light' | 'dark' {
    return (localStorage.getItem(STORAGE_KEYS.theme) as 'light' | 'dark') || 'light';
  }
  saveTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }

  getLang(): 'en' | 'sw' {
    return (localStorage.getItem(STORAGE_KEYS.lang) as 'en' | 'sw') || 'en';
  }
  saveLang(lang: 'en' | 'sw'): void {
    localStorage.setItem(STORAGE_KEYS.lang, lang);
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

  // Reset to default seed
  resetToDemoData(): void {
    this.set(STORAGE_KEYS.batches, SEED_BATCHES);
    this.set(STORAGE_KEYS.feedLogs, SEED_FEED_LOGS);
    this.set(STORAGE_KEYS.mortalityLogs, SEED_MORTALITY_LOGS);
    this.set(STORAGE_KEYS.environmentLogs, SEED_ENV_LOGS);
    this.set(STORAGE_KEYS.cocoonHarvests, SEED_HARVESTS);
    this.set(STORAGE_KEYS.leafInventory, SEED_LEAF_INVENTORY);
    this.set(STORAGE_KEYS.leafMovements, SEED_LEAF_MOVEMENTS);
    this.set(STORAGE_KEYS.payments, SEED_PAYMENTS);
    this.set(STORAGE_KEYS.profile, SEED_PROFILE);
  }
}

export const storage = new StorageService();
