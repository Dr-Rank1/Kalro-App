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
}

export interface FeedLog {
  id: string;
  batchId: string;
  recordedAt: string; // ISO timestamp
  quantityGrams: number;
  leafType: LeafType;
  wasSkipped?: boolean;
  skippedReason?: string;
}

export interface MortalityLog {
  id: string;
  batchId: string;
  recordedAt: string;
  count: number;
  cause?: string;
  symptoms?: string;
  photoUrl?: string;
}

export interface EnvironmentLog {
  id: string;
  batchId: string;
  recordedAt: string;
  temperatureCelsius: number;
  humidityPercent: number;
  ventilationStatus?: 'optimal' | 'low' | 'excessive';
  notes?: string;
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
}

export interface LeafMovement {
  id: string;
  date: string;
  leafType: LeafType;
  quantityKg: number;
  direction: 'inflow' | 'outflow';
  reason: string;
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
  | 'station_manager'
  | 'lead_technician'
  | 'commercial_reeler'
  | 'extension_officer'
  | 'apprentice';

export interface UserAccount {
  id: string; // unique user UUID
  username: string; // farmer / operator name
  email?: string;
  phone?: string;
  role: UserRole;
  stationName: string;
  county: string;
  avatarColor: string;
  avatarInitials: string;
  pinCode?: string; // 4-digit PIN lock
  createdAt: string;
  lastActiveAt: string;
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
  swahiliName: string;
  pathogen: string;
  signs: string;
  swahiliSigns: string;
  action: string;
  swahiliAction: string;
  seedLotRisk: boolean;
  severity: 'high' | 'critical' | 'moderate';
}

export interface MilestoneStage {
  instarNumber: number | null;
  name: string;
  swahiliName: string;
  dayStart: number;
  dayEnd: number;
  isMoult: boolean;
  isHarvest: boolean;
  leafRecommendation: string;
  idealTemp: string;
  idealHumidity: string;
}
