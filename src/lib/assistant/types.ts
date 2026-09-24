/**
 * The shared shape of an assistant session (docs/PLAN_AI_SIGNUP_CONCIERGE.md §3).
 *
 * One `assistant-session` row holds one living list — a member's profile
 * suggestions, a rikma blueprint, or a wish breakdown — and both the site chat
 * and an outside agent over MCP change it the same way: by sending small ops
 * that `applyOps` applies. Nothing here talks to Strapi; the file is shared by
 * the server, the review screen and the tests.
 */

export type AssistantKind = 'profile' | 'rikma' | 'wish';

/**
 * - `proposed` — suggested, nobody said anything about it yet
 * - `kept`     — "that one is right"
 * - `dropped`  — "not now": reversible, never deletes anything on the platform
 * - `applied`  — already on the profile / already exists in the rikma or wish
 */
export type ItemStatus = 'proposed' | 'kept' | 'dropped' | 'applied';

export const PROFILE_GROUPS = ['skills', 'roles', 'methods', 'vallues', 'missions', 'resources'] as const;
export const RIKMA_GROUPS = ['products', 'rikmaMissions', 'rikmaResources', 'partners'] as const;
export const WISH_GROUPS = ['wishMissions', 'wishResources'] as const;

export type ProfileGroup = (typeof PROFILE_GROUPS)[number];
export type RikmaGroup = (typeof RIKMA_GROUPS)[number];
export type WishGroup = (typeof WISH_GROUPS)[number];
export type ItemGroup = ProfileGroup | RikmaGroup | WishGroup;

export const GROUPS_BY_KIND: Record<AssistantKind, readonly ItemGroup[]> = {
  profile: PROFILE_GROUPS,
  rikma: RIKMA_GROUPS,
  wish: WISH_GROUPS
};

/**
 * Top-level fields each kind may set with `setField`. A profile has none: all
 * of it is items. For a rikma these are exactly what `createWeave` takes (plus
 * the location and the track); for a wish, what `extraction.details` carries.
 */
export const FIELDS_BY_KIND: Record<AssistantKind, readonly string[]> = {
  profile: [],
  rikma: [
    'track',
    'name',
    'publicDescription',
    'descripFor',
    'linkToWebsite',
    'vals',
    'location',
    'currency',
    'restime'
  ],
  wish: ['title', 'dateFrom', 'dateTo', 'budget', 'currency', 'place', 'online', 'groupKind']
};

export type ItemOrigin = 'extract' | 'agent' | 'revision' | 'manual' | 'profile' | 'project';

export interface AssistantItem {
  /** Stable for the whole session; the model and the agent refer to items only by it. */
  key: string;
  group: ItemGroup;
  label: string;
  /** Real id once matched to the vocabulary / a template / an existing entity. */
  existingId?: string;
  status: ItemStatus;
  /** What a `dropped` item was before, so `restore` puts it back exactly. */
  droppedFrom?: Exclude<ItemStatus, 'dropped'>;
  origin: ItemOrigin;
  /** One sentence: where this came from ("the site lists 'baking workshop — 180'"). */
  why?: string;
  /** Kind-specific details: price, kindOf, hours, skills, holder, recipe… */
  spec?: Record<string, unknown>;
  /** wish: a supplier already answered this row — changing it is a conversation, not an edit. */
  committed?: { proposalId?: string; bomRowId?: string };
  /** rikma: created by materialize. From then on it is edited on the site, not here. */
  createdRef?: { type: string; id: string };
}

export interface AssistantState {
  items: AssistantItem[];
  fields?: Record<string, unknown>;
  questions?: string[];
}

export type AssistantOp =
  | { op: 'keep' | 'drop' | 'restore'; key: string }
  | { op: 'add'; group: ItemGroup; label: string; why?: string; spec?: Record<string, unknown> }
  | { op: 'rename'; key: string; label: string }
  | { op: 'setSpec'; key: string; spec: Record<string, unknown> }
  | { op: 'link'; productKey: string; missionKeys?: string[]; resourceKeys?: string[] }
  | { op: 'setField'; field: string; value: unknown };

export type AssistantVia = 'site' | 'agent';

/** One entry of `assistant-session.revisions` — the transcript both surfaces see. */
export interface Revision {
  v: number;
  at: string;
  via: AssistantVia;
  instruction?: string;
  say?: string;
  ops: AssistantOp[];
  /** What the ops changed, so "undo last" is exact (see `revertChanges`). */
  changes: StateChange[];
}

/** One item or field before and after a revision; `null` = did not exist. */
export type StateChange =
  | { kind: 'item'; key: string; before: AssistantItem | null; after: AssistantItem | null }
  | { kind: 'field'; field: string; before: unknown; after: unknown };

/** Hard caps, so neither a runaway model nor a hostile caller can bloat a row. */
export const LIMITS = {
  items: 120,
  label: 200,
  why: 300,
  specKeys: 30,
  opsPerCall: 60,
  revisions: 30
} as const;
