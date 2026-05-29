export type DealStatus          = 'active' | 'pending' | 'approval' | 'done';
export type MissionStatus       = 'done' | 'in-progress' | 'waiting' | 'needs-approval';
export type TimelineStatus      = 'done' | 'active' | 'future';
export type AuthorType          = 'client' | 'creator' | 'manager';
export type PricingMode         = 'fixed' | 'estimated' | 'quote';
export type MatanotProductStatus = 'draft' | 'voting' | 'active' | 'archived';
export type BomMissionMode      = 'createNew' | 'consumeExisting';
export type BomResourceMode     = 'createNew' | 'consumeExisting' | 'reuseSp';

export interface Deal {
  id: string;
  product: string;
  project: string;
  category: string;
  icon: string;
  iconBg: string;
  status: DealStatus;
  missions:   { done: number; inProgress: number; total: number };
  hours:      { done: number; total: number };
  resources:  { done: number; total: number };
  totalCost: number;
  paid: number;
  startDate: string;
  endDate: string;
  pendingApprovalCount: number;
  progressPct: number;
  kind?: 'sale' | 'purchase';
  sheirutId?: string;
  pricingMode?: PricingMode;
  status_of_voting?: MatanotProductStatus;
  fulfillmentId?: string;
  matanodId?: string;
}

export interface Mission {
  id: string;
  name: string;
  status: MissionStatus;
  hours: number;
  hoursDone: number;
  paid: boolean;
  sub?: string;
}

export interface Resource {
  id: string;
  name: string;
  cost: number;
  maxCost: number;
  needsApproval: boolean;
}

export interface TimelineEvent {
  date: string;
  label: string;
  desc: string;
  status: TimelineStatus;
}

export interface ForumMessage {
  id: string;
  author: string;
  initials: string;
  authorType: AuthorType;
  content: string;
  timeAgo: string;
}

export interface Party {
  name: string;
  initials: string;
  role: string;
  avatarStyle: string;
  status: 'active' | 'waiting';
}

export interface PendingApproval {
  id: string;
  name: string;
  type: 'mission' | 'resource';
  hours?: number;
  cost: number;
}

export interface CostBreakdown {
  missions: number;
  resources: number;
}

export interface DealDetailData extends Deal {
  missionList: Mission[];
  resourceList: Resource[];
  timeline: TimelineEvent[];
  messages: ForumMessage[];
  parties: Party[];
  pendingApprovals: PendingApproval[];
  costBreakdown: CostBreakdown;
  recipeMissions?: BomMission[];
  recipeResources?: BomResource[];
  mainForumId?: string;
  processId?: string;
  estimatedPrice?: number;
  marginPct?: number;
  matanotStatus?: MatanotProductStatus;
}

export interface DashboardStats {
  activeDeals: number;
  totalPaid: number;
  totalCost: number;
  pendingApprovals: number;
  completedDeals: number;
}

export interface BomMission {
  id: string;
  name: string;
  hoursPerUnit: number;
  hoursDelivered: number;
  status: MissionStatus;
  mode: BomMissionMode;
  mesimabetahalichId?: string;
}

export interface BomResource {
  id: string;
  name: string;
  quantityPerUnit: number;
  pricePerUnit: number;
  delivered: boolean;
  status: 'pending' | 'ordered' | 'delivered';
  mode: BomResourceMode;
  openMashaabimId?: string;
}
