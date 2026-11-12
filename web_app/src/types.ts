export type Species = 'bombyx' | 'eri';

export type BatchStatus = 'active' | 'closed';

export type LeafType = 'mulberry' | 'castor' | 'kesseru';

export type PaymentDirection = 'inflow' | 'outflow';

export type PaymentCategory =
  | 'cocoon_sale'
  | 'egg_purchase'
  | 'leaf_purchase'
  | 'equipment'
  | 'labor'
  | 'other';

export interface Batch {
  id: string;
  species: Species;
  startDate: string; // ISO date YYYY-MM-DD
  eggCount: number;
  status: BatchStatus;
  batchTag?: string;
  displayTag?: string;
  notes?: string;
  roomName?: string;
  // Operator Attribution & Institutional Tracking
  createdBy?: string;
  createdByName?: string;
  assignedStaff?: string[];
  bedAreaSqMeters?: number;
  currentInstar?: number;
  currentTraysCount?: number;
  targetForageCultivar?: string;
  orchardBlock?: string;
  isQuarantined?: boolean;
  quarantineReason?: string;
  quarantinedAt?: string;
  quarantinedBy?: string;
}

export interface FeedLog {
  id: string;
  batchId: string;
  recordedAt: string; // ISO timestamp
  quantityGrams: number;
  leafType: LeafType;
  cultivar?: string; // Specific Mulberry Cultivar (S-13, TR-10, Kanva-2) or Castor Variety (GRC-1, Local Green)
  wasSkipped?: boolean;
  skippedReason?: string;
  // Operator Attribution
  operatorId?: string;
  operatorName?: string;
  operatorRole?: string;
  shift?: 'morning' | 'midday' | 'evening' | 'night';
  notes?: string;
}

export interface MortalityLog {
  id: string;
  batchId: string;
  recordedAt: string;
  count: number;
  cause?: string;
  symptoms?: string;
  photoUrl?: string;
  // Operator Attribution
  operatorId?: string;
  operatorName?: string;
  operatorRole?: string;
  notes?: string;
}

export interface EnvironmentLog {
  id: string;
  batchId: string;
  recordedAt: string;
  temperatureCelsius: number;
  humidityPercent: number;
  ventilationStatus?: 'optimal' | 'low' | 'excessive';
  notes?: string;
  roomName?: string;
  // Psychrometric calculation fields
  dryBulbCelsius?: number;
  wetBulbCelsius?: number;
  saturationDeficit?: number;
  // Operator Attribution
  operatorId?: string;
  operatorName?: string;
  operatorRole?: string;
}

export interface CocoonHarvest {
  id: string;
  batchId: string;
  harvestDate: string;
  cocoonCount: number;
  totalWeightGrams: number;
  shellWeightGrams?: number;
  defectiveCount: number;
  doubleCount?: number;
  uziCount?: number;
  stainedCount?: number;
  flimsyCount?: number;
  meltedCount?: number;
  reeledWeightGrams?: number;
  breakCount?: number;
  // Kenya Cocoon Quality Grades & Grainage Metrics
  gradeAWeightGrams?: number;
  gradeBWeightGrams?: number;
  gradeCWeightGrams?: number;
  singleCocoonWeightGrams?: number;
  singleShellWeightGrams?: number;
  shellRatioPercent?: number;
  renditta?: number;
  // Operator Attribution
  operatorId?: string;
  operatorName?: string;
  operatorRole?: string;
  notes?: string;
}

export interface CocoonMetrics {
  cocoonCount: number;
  totalWeightGrams: number;
  defectiveCount: number;
  averageCocoonWeightGrams: number;
  defectRatePercent: number;
  shellRatioPercent: number | null;
  survivalPercent: number;
  yieldPer100EggsGrams: number;
  renditta: number | null;
  reelabilityPercent: number | null;
  commercialGrade: 'Grade A' | 'Grade B' | 'Grade C' | 'Ungraded';
}

export interface LeafInventory {
  mulberryKg: number;
  castorKg: number;
  kesseruKg: number;
  lastUpdated: string;
  mulberryByType?: Record<string, number>;
  castorByType?: Record<string, number>;
}

export interface LeafMovement {
  id: string;
  date: string;
  leafType: LeafType;
  quantityKg: number;
  direction: 'inflow' | 'outflow';
  reason: string;
  // Operator Attribution & Cultivar details
  operatorId?: string;
  operatorName?: string;
  operatorRole?: string;
  cultivar?: string;
  orchardBlock?: string;
  witheringAlert?: boolean;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  direction: PaymentDirection;
  category: PaymentCategory;
  partyName: string;
  status: 'settled' | 'pending';
  notes?: string;
}

export type UserRole =
  | 'station_manager'      // Station Head / Senior Research Scientist
  | 'lead_technician'      // Chawki Master & Larval Specialist
  | 'rearing_technician'   // Silkworm Rearing Technician
  | 'moriculture_attendant'// Moriculture & Forage Attendant
  | 'cocoon_inspector'     // Cocoon Quality & Grainage Inspector
  | 'commercial_reeler'    // Commercial Sericulture Reeler
  | 'extension_officer'    // Sericulture Extension Officer
  | 'apprentice';          // Rearing Attendant / Assistant

export interface UserAccount {
  id: string; // unique user UUID
  username: string; // staff / operator name
  email?: string;
  phone?: string;
  role: UserRole;
  stationName: string;
  county: string;
  avatarColor: string;
  avatarInitials: string;
  staffId?: string; // Institutional Staff ID (e.g. KALRO-STF-02)
  shift?: 'morning' | 'midday' | 'evening' | 'night' | 'general';
  pinCode?: string; // 4-digit PIN lock
  createdAt: string;
  lastActiveAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601 string
  operatorId?: string;
  operatorName: string;
  operatorRole: string;
  actionType:
    | 'feed_log'
    | 'climate_check'
    | 'mortality_log'
    | 'cocoon_harvest'
    | 'leaf_inflow'
    | 'leaf_outflow'
    | 'batch_created'
    | 'batch_updated'
    | 'shift_handover';
  title: string;
  batchId?: string;
  batchTag?: string;
  roomName?: string;
  details: string;
  metrics?: string;
}

export interface FarmProfile {
  id: string;
  userId?: string;
  orgName: string;
  county: string;
  houseCount: number;
  syncCode: string;
  managerName: string;
  managerRole?: UserRole;
  phone?: string;
  email?: string;
  nationalId?: string;
  subCounty?: string;
  ward?: string;
  altitudeMeters?: number;
  accreditationLevel?: 'Research Station' | 'Commercial Producer' | 'Master Seed Lot' | 'Smallholder Cluster';
  
  // Agronomy & Rearing Facility Capacity
  rearingBaysCount?: number;
  maxTrayCapacity?: number;
  mulberryAcreage?: number;
  mulberryCultivars?: string[];
  castorAcreage?: number;
  kesseruTreesCount?: number;
  targetMarket?: string;

  // Security & Visuals
  pinCode?: string;
  avatarColor?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DiseaseInfo {
  name: string;
  pathogen: string;
  signs: string;
  action: string;
  seedLotRisk: boolean;
  severity: 'high' | 'critical' | 'moderate';
}

export interface MilestoneStage {
  instarNumber: number | null;
  name: string;
  dayStart: number;
  dayEnd: number;
  isMoult: boolean;
  isHarvest: boolean;
  leafRecommendation: string;
  idealTemp: string;
  idealHumidity: string;
}

