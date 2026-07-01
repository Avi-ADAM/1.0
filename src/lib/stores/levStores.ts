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
  /** Location component (location_mode, lat, lng, radius, location_hint) */
  location?: any;
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
  sqadualedf?: string;
  /** Recurring expense terms (per-cycle cost, monthly/yearly approval). */
  recurring?: boolean;
  cycleSize?: number;
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
  sqadualed?: string; // start date (correct Strapi field name)
  sqadualedf?: string; // end date (correct Strapi field name)

  // Recurring expense terms (open-ended monthly/yearly cost, monthly approval)
  recurring?: boolean;
  cycleSize?: number;

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
  /** Location component (location_mode, lat, lng, radius, location_hint) */
  location?: any;
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
/** Platform (1💗1) service-share line attached to a proposal, summed from the
 *  tosplit's `siteShareHalukas` (SITE_SHARE_TRANSFER_SPEC.md §7). Present only
 *  when the cross-rikma fields are live; `undefined` otherwise. */
export interface HalukaSiteShare {
  /** Total amount routed to the platform for this proposal. */
  amount: number;
  /** All linked transfers confirmed by both sides. */
  confirmed: boolean;
  /** The giver(s) have marked the money as sent. */
  senderconf: boolean;
  /** Original suggestion before any adjustment (reports). */
  proposedAmount?: number;
  /** 'as_is' | 'less' | 'more'. */
  adjustDirection?: string;
  adjustReason?: string | null;
}

export interface HalukaData {
  id: string;
  projectId: string;
  amount: number;
  priority?: number;
  siteShare?: HalukaSiteShare;
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

/** Sale data (sheirut - approved product/service sale) */
export interface SaleData {
  id: string;
  projectId: string;
  projectName?: string;
  projectSrc?: string;

  // Customer info
  customerId: string;
  customerName: string;
  customerSrc?: string;

  // Product details
  name: string;
  descrip?: string;
  price: number;
  quant: number;
  total: number;
  kindOf?: string;
  startDate?: string;
  finnishDate?: string;
  productPic?: string;

  // Status flags
  isApruved: boolean;
  iGotIt: boolean; // Customer confirmed delivery
  iTransferMoney: boolean; // Customer says they transferred money
  moneyTransfered: boolean; // Project confirmed money arrived
  productExepted: boolean; // Product delivered

  // Money handling
  iCanGetMonay?: {
    id: string;
    username: string;
    profilePic?: string;
  }[];  // manyToMany - list of project members who can receive money
  iTransferedTo?: {
    id: string;
    username: string;
    profilePic?: string;
  };
  iGotMoney?: any[]; // Component (repeatable) for who got paid

  // Delivery confirmation voting
  weFinnish: any[]; // Array of Vote relations

  // Communication
  forumId?: string;
  messages?: any[];

  // Haluka (money transfer tracking)
  halukaId?: string | null;
  halukaForumId?: string | null;
  senderconf?: boolean;
  halukaConfirmed?: boolean;

  // Site-share income (platform rikma is the receiver): one transfer Haluka per
  // contributing member (giver → chosen volunteer), each confirmed both-sides.
  isSiteShareIncome?: boolean;
  transferHalukas?: {
    id: string;
    amount?: number | null;
    senderconf: boolean;
    confirmed: boolean;
    forumId?: string | null;
    sender?: { id: string; username: string; profilePic?: string } | null;
    receiver?: { id: string; username: string; profilePic?: string } | null;
  }[];

  // Additional fields
  matanots?: any[];
  equaliSplited?: boolean;
  oneTime?: boolean;
  myid?: string;

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

/** A community volunteer's pending proposal on a wish I own (concierge).
 *  A member responded positively to an openMission I published from my wish
 *  (applyToMission → kind 'custom_offer', status 'suggested', open_mission set).
 *  Surfaced as an ask-like lev card so I can accept (acceptRatsonProposal) or
 *  reject (rejectRatsonProposal) the volunteer. See PLAN_MISSION_AI / concierge. */
export interface WishOfferData {
  id: string;              // ratson_proposal id
  projectId: string;       // '' — concierge wishes are project-less
  priority?: number;

  // The wish (ratson) this offer is for
  ratsonId: string;
  ratsonName: string;
  ratsonDesc?: string;
  ratsonLogo?: string;

  // The volunteer who offered
  volunteerId: string;
  volunteerName: string;
  volunteerSrc?: string;

  // What was offered (the published openMission / matched need)
  missionName: string;
  hours?: number | null;
  price?: number | null;
  coveredIdx?: string | null;

  // Coordination chat forum (owner ↔ volunteer), lazily created on first open
  forumId?: string | null;

  createdAt?: string;
  myid?: string;
  [key: string]: any;
}

/** A committed-but-unpaid site-share contribution this member still owes to the
 *  platform (1💗1). Surfaced as a swiper card so the member can pick a volunteer
 *  receiver and send the transfer (PLAN_SITE_SHARE_PER_MEMBER §5, M4). */
export interface SiteSharePayableData {
  contributionId: string;
  amount: number;
  projectId: string;        // the giving rikma (where the member is a member)
  reciveProjectId?: string; // the platform rikma receiving the income
  sheirutId?: string;
  volunteers: { id: string; username: string; profilePic?: string }[];
  rikmaName?: string;
  rikmaLogo?: string;
  // Transfer state — set once createSiteShareTransfer has run. When `halukaId`
  // is present the card switches from "pick a receiver & send" to the
  // both-sides confirmation flow (chat + "I sent", like the regular transfer).
  halukaId?: string | null;
  transferSenderconf?: boolean;
  transferConfirmed?: boolean;
  transferForumId?: string | null;
  receiver?: { id: string; username: string; profilePic?: string } | null;
  [key: string]: any;
}

/**
 * An OPEN (pending) site-share decision whose split is no longer shown as a
 * haluka card (e.g. the split auto-approved by time). Surfaced as a dedicated
 * swiper card that explains the already-approved split and asks the member to
 * ratify their personal giving. Replaces the old top-of-page reminder banner.
 */
export interface OpenSiteShareDecisionData {
  contributionId: string;
  tosplitId: string;
  projectId: string;          // the giving rikma
  reciveProjectId?: string;   // the platform rikma
  projectName?: string;
  projectLogo?: string;
  proposedAmount: number;
  basisAmount: number;
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
  sales: boolean;    // מכירות מאושרות
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

/** Personal acts store (myacts) */
export const myActsStore: Writable<any[]> = writable([]);

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

/** Approved sales (sheiruts) */
export const salesStore: Writable<SaleData[]> = writable([]);

/** My purchases (sheiruts where I am the customer) */
export const purchasesStore: Writable<SaleData[]> = writable([]);

/** Community volunteer offers on wishes I own (concierge) — pending my accept/reject */
export const wishOffersStore: Writable<WishOfferData[]> = writable([]);

// ========== Loading Mode ==========

/**
 * Tracks what data is currently in the stores.
 * 'none'    — stores are empty (cold start, no snapshot)
 * 'partial' — one or more quantum slices loaded, but not the full query 83
 * 'full'    — full initializeLevData cycle completed (snapshot-safe)
 */
export const dataMode: Writable<'none' | 'partial' | 'full'> = writable('none');

/**
 * Per-type record of which project IDs have been covered by a slice load.
 * typeKey → string[] of project IDs.  Merged (never replaced) by loadLevSlice.
 */
export const loadedScopes: Writable<Record<string, string[]>> = writable({});

/** Committed-but-unpaid site-share contributions I still owe the platform */
export const siteSharePayablesStore: Writable<SiteSharePayableData[]> = writable([]);

/** Open (pending) site-share decisions whose split already auto-approved */
export const openSiteShareDecisionsStore: Writable<OpenSiteShareDecisionData[]> = writable([]);

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
  sheirutp: true, // בקשות שירות
  sales: true,    // מכירות מאושרות
  purchases: true // קניות שלי
});

/** Current project filter (null = all projects) */
export const projectFilter: Writable<string | null> = writable(null);

// ========== Snapshot Helpers ==========

/** Current version of the snapshot data structure */
const SNAPSHOT_VERSION = 5;

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
    sales: SaleData[];
    purchases: SaleData[];
    wishOffers: WishOfferData[];
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
