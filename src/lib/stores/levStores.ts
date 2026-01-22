// src/lib/stores/levStores.ts
import { writable, type Writable } from 'svelte/store';

// ========== Type Definitions ==========

/** User profile data */
export interface UserData {
  id: string;
  username: string;
  email: string;
  profilePic?: string;
  lang: string;
  total: number;
}

/** Project data */
export interface ProjectData {
  id: string;
  attributes: {
    projectName: string;
    restime?: any;
    profilePic?: {
      data?: {
        attributes: {
          url: string;
        };
      };
    };
    user_1s: {
      data: Array<{ id: string }>;
    };
  };
}

/** Pending mission data */
export interface PendMissionData {
  id: string;
  projectId: string;
  name: string;
  users: Array<{
    users_permissions_user: { data: { id: string } };
    what: boolean;
    order?: number;
    zman?: string | Date;
    createdAt?: string | Date;
    [key: string]: any;
  }>;
  messages: any[];
  priority?: number;
  [key: string]: any;
}

/** Mission in progress data */
export interface InProgressMissionData {
  id: string;
  projectId: string;
  name: string;
  assignedTo: string;
  progress: number;
  priority?: number;
  activeTimer?: any; // Structure from STRAPI
  zman?: number; // Calculated total time
  running?: boolean; // Calculated active state
  [key: string]: any;
}

/** Approval request data */
export interface ApprovalData {
  id: string;
  projectId: string;
  type: string;
  priority?: number;
  [key: string]: any;
}

/** Ask/join request data */
export interface AskData {
  id: string;
  projectId: string;
  userId: string;
  viewerId?: string;
  priority?: number;
  [key: string]: any;
}

/** Asked resources data (askms - resource requests you've received) */
export interface AskedResourceData {
  id: string;
  projectId: string;
  uid: string;
  username: string;
  requestType?: string;
  priority?: number;
  price?: number;
  easy?: number;
  spnot?: string;
  descrip?: string;
  hm?: number;
  myp?: number;
  kindOf?: string;
  spid?: string;
  deadline?: string;
  openName?: string;
  omid?: string;
  askId?: string;
  users?: any[];
  [key: string]: any;
}

/** Resource Suggestion data (huca) */
export interface ResourceSuggestionData {
  id: string; // open mashaabim id
  projectId: string; // will be extracted from project relation
  oid: string; // user's SP id
  priority?: number;

  // Basic info from open_mashaabim
  spnot?: string;
  price?: number;
  easy?: number;
  kindOf?: string;
  mashname?: string;
  descrip?: string;
  sqedualed?: string;
  sqedualedf?: string;

  // Derived/Related
  myp?: number; // from user SP
  declineddarra?: string[]; // IDs of declined open_mashaabims from SP

  // Project info embedded if needed, or fetched via helpers
  projectName?: string;
  srcb?: string;

  [key: string]: any;
}

/** Suggestion data */
export interface SuggestionData {
  id: string;
  projectId: string;
  content: string;
  priority?: number;
  projectDetails?: {
    name: string;
    description?: string;
    src?: string;
    membersCount?: number;
    memberIds?: string[];
    restime?: any;
  };
  [key: string]: any;
}

/** Pending resource data */
export interface PendResourceData {
  id: string;
  projectId: string;
  resourceType: string;
  priority?: number;
  [key: string]: any;
}

/** Resource request data */
export interface ResourceRequestData {
  id: string;
  projectId: string;
  requestType: string;
  priority?: number;
  [key: string]: any;
}

/** Profit distribution request data */
export interface HalukaData {
  id: string;
  projectId: string;
  amount: number;
  priority?: number;
  [key: string]: any;
}

/** Welcome message data */
export interface WelcomeData {
  id: string;
  projectId: string;
  message: string;
  priority?: number;
  details?: string;
  pd?: string;
  username?: string;
  [key: string]: any;
}

/** Money transfer data */
export interface TransferData {
  id: string;
  projectId: string;
  amount: number;
  priority?: number;
  [key: string]: any;
}

/** Decision data */
export interface DecisionData {
  id: string;
  projectId: string;
  decision: string;
  priority?: number;
  myid?: string;
  kind?: string;
  spdata?: any;
  newpicid?: string;
  [key: string]: any;
}

/** Product Request data (sheirutpend) */
export interface ProductRequestData {
  id: string;
  projectId: string;
  projectName?: string;
  projectSrc?: string;

  // Requester info
  userId: string;
  username: string;
  userSrc?: string;

  // Request details
  name: string; // from sheirut
  descrip?: string; // from sheirut
  price: number;
  quant: number;
  total: number;
  kindOf?: string;
  startDate?: string;
  finishDate?: string;

  // Metadata & Social
  vots: any[];
  messages?: any[];
  priority?: number;
  myid?: string;
  createdAt: string;

  // Relations
  sheirutId?: string;
  matanots?: any[];
  timegramaId?: string;
  timegramaDate?: string;

  [key: string]: any;
}

/** Filter configuration for what to display */
export interface MilonConfig {
  hachla: boolean;   // החלטות
  fiap: boolean;     // אישורים
  welc: boolean;     // ברוכים הבאים
  sugg: boolean;     // הצעות
  pend: boolean;     // ממתינים
  asks: boolean;     // בקשות
  betaha: boolean;   // בתהליך
  desi: boolean;     // החלטות
  ppmash: boolean;   // משאבים ממתינים
  pmashs: boolean;   // הצעות משאבים
  pmaap: boolean;    // בקשות משאבים
  askmap: boolean;   // בקשות משאבים ממני
  sheirutp: boolean; // בקשות שירות/מוצר
}

// ========== Raw Data Stores ==========

/** User profile data */
export const userStore: Writable<UserData | null> = writable(null);

/** All projects the user is member of */
export const projectsStore: Writable<ProjectData[]> = writable([]);

/** Pending missions (pends) */
export const pendsStore: Writable<PendMissionData[]> = writable([]);

/** Missions in progress (mtaha) */
export const mtahaStore: Writable<InProgressMissionData[]> = writable([]);

/** Resource suggestions (huca) */
export const resourceSuggestionsStore: Writable<ResourceSuggestionData[]> = writable([]);

/** Mission approval requests (fiapp) */
export const fiappStore: Writable<ApprovalData[]> = writable([]);

/** Join requests to missions (askedcoin) */
export const askedStore: Writable<AskData[]> = writable([]);

/** Asked resources (askms - resource requests you've received) */
export const askedResourcesStore: Writable<AskedResourceData[]> = writable([]);

/** Suggested missions (meData) */
export const suggestionsStore: Writable<SuggestionData[]> = writable([]);

/** Pending resources (pmashes) */
export const pmashesStore: Writable<PendResourceData[]> = writable([]);

/** Resource requests (wegets) */
export const wegetsStore: Writable<ResourceRequestData[]> = writable([]);

/** Profit distribution requests (haluask) */
export const halukasStore: Writable<HalukaData[]> = writable([]);

/** Welcome messages (walcomen) */
export const welcomeStore: Writable<WelcomeData[]> = writable([]);

/** Money transfers (tverias) */
export const transfersStore: Writable<TransferData[]> = writable([]);

/** Decisions (hachlatot) */
export const decisionsStore: Writable<DecisionData[]> = writable([]);

/** Product requests (sheirutpends) */
export const sheirutpStore: Writable<ProductRequestData[]> = writable([]);

// ========== UI State Stores ==========

/** Current view mode: true = cards, false = coins */
export const isCardsView: Writable<boolean> = writable(true);

/** Filter configuration for what to display */
export const milon: Writable<MilonConfig> = writable({
  hachla: true,   // החלטות
  fiap: true,     // אישורים
  welc: true,     // ברוכים הבאים
  sugg: true,     // הצעות
  pend: true,     // ממתינים
  asks: true,     // בקשות
  betaha: true,   // בתהליך
  desi: true,     // החלטות
  ppmash: true,   // משאבים ממתינים
  pmashs: true,   // הצעות משאבים
  pmaap: true,    // בקשות משאבים
  askmap: true,   // בקשות משאבים ממני
  sheirutp: true  // בקשות שירות
});

/** Current project filter (null = all projects) */
export const projectFilter: Writable<string | null> = writable(null);

// ========== Snapshot Helpers ==========

/** Current version of the snapshot data structure */
const SNAPSHOT_VERSION = 3;

/** Snapshot data structure for localStorage */
export interface SnapshotData {
  version: number;
  timestamp: number;
  data: {
    user: UserData | null;
    projects: ProjectData[];
    pends: PendMissionData[];
    mtaha: InProgressMissionData[];
    fiapp: ApprovalData[];
    asked: AskData[];
    askedResources: AskedResourceData[];
    suggestions: SuggestionData[];
    pmashes: PendResourceData[];
    wegets: ResourceRequestData[];
    halukas: HalukaData[];
    welcome: WelcomeData[];
    transfers: TransferData[];
    decisions: DecisionData[];
    resourceSuggestions: ResourceSuggestionData[];
    sheirutp: ProductRequestData[];
  };
}

/**
 * Save current state to localStorage snapshot
 * @param data - The snapshot data to save
 */
export function saveSnapshot(data: SnapshotData): void {
  try {
    localStorage.setItem('levSnapshot', JSON.stringify(data));
    console.log('✅ [levStores] Snapshot saved successfully');
  } catch (e) {
    console.error('❌ [levStores] Failed to save snapshot:', e);
    // If quota exceeded, try to clear old snapshot and retry
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('⚠️ [levStores] localStorage quota exceeded, clearing old snapshot');
      clearSnapshot();
    }
  }
}

/**
 * Load snapshot from localStorage
 * @returns The snapshot data or null if not found/invalid
 */
export function loadSnapshot(): SnapshotData | null {
  try {
    const stored = localStorage.getItem('levSnapshot');
    if (!stored) {
      console.log('ℹ️ [levStores] No snapshot found in localStorage');
      return null;
    }

    const snapshot = JSON.parse(stored) as SnapshotData;

    // Validate version
    if (snapshot.version !== SNAPSHOT_VERSION) {
      console.warn(
        `⚠️ [levStores] Snapshot version mismatch (found: ${snapshot.version}, expected: ${SNAPSHOT_VERSION})`
      );
      clearSnapshot();
      return null;
    }

    console.log('✅ [levStores] Snapshot loaded successfully');
    return snapshot;
  } catch (e) {
    console.error('❌ [levStores] Failed to load snapshot:', e);
    clearSnapshot();
    return null;
  }
}

/**
 * Clear snapshot from localStorage
 */
export function clearSnapshot(): void {
  try {
    localStorage.removeItem('levSnapshot');
    console.log('✅ [levStores] Snapshot cleared');
  } catch (e) {
    console.error('❌ [levStores] Failed to clear snapshot:', e);
  }
}

/**
 * Get the current snapshot version
 * Used for testing and debugging
 */
export function getSnapshotVersion(): number {
  return SNAPSHOT_VERSION;
}
