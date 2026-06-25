/**
 * Lev Slice Registry
 *
 * Declarative map of every quantum-loadable data type.  Each entry links a
 * logical key (same string used as the socket dataKey) to:
 *  - the static qid registered in src/routes/api/send/qids.js
 *  - the extractor from levDataExtractors.ts
 *  - the target raw store from levStores.ts
 *  - the ani values this type renders as (used for hub deep-links / counts)
 *  - whether the collection hangs off a project or the user directly
 *
 * Adding a new slice type: add an entry here + register the qid + done.
 * The loader (levSliceLoader.ts) reads this registry at runtime.
 */

import type { Writable } from 'svelte/store';
import {
  pendsStore,
  mtahaStore,
  fiappStore,
  askedStore,
  askedResourcesStore,
  pmashesStore,
  wegetsStore,
  halukasStore,
  welcomeStore,
  transfersStore,
  decisionsStore,
  sheirutpStore,
  salesStore,
  purchasesStore
} from '$lib/stores/levStores';
import {
  extractPends,
  extractMtaha,
  extractFiapp,
  extractAsked,
  extractAskedResources,
  extractPmashes,
  extractWegets,
  extractHalukas,
  extractWelcome,
  extractTransfers,
  extractDecisions,
  extractProductRequests,
  extractSales,
  extractPurchases
} from './levDataExtractors';

export interface LevSliceDef {
  /** qid registered in src/routes/api/send/qids.js — null = not yet implemented */
  qid: string | null;
  /** Extractor from levDataExtractors.ts — receives the mini-userData node */
  extract: (userData: any) => any[];
  /** Target raw store from levStores.ts */
  store: Writable<any[]>;
  /** ani values this type renders as (used to match ?focus= params) */
  anis: string[];
  /** Collection hangs off a project or directly off the user */
  source: 'project' | 'user';
}

export const LEV_SLICES: Record<string, LevSliceDef> = {
  // ── project-scoped types ─────────────────────────────────────────────────

  sheirutpends: {
    qid: '87levSliceSheirutp',
    extract: extractProductRequests,
    store: sheirutpStore,
    anis: ['sheirutp'],
    source: 'project'
  },

  pends: {
    qid: '87levSlicePends',
    extract: extractPends,
    store: pendsStore,
    anis: ['pends'],
    source: 'project'
  },

  fiapp: {
    qid: '87levSliceFiapp',
    extract: extractFiapp,
    store: fiappStore,
    anis: ['fiapp'],
    source: 'project'
  },

  pmashes: {
    qid: null, // TODO: add 87levSlicePmashes query
    extract: extractPmashes,
    store: pmashesStore,
    anis: ['pmashes'],
    source: 'project'
  },

  wegets: {
    qid: null, // TODO: add 87levSliceWegets query
    extract: extractWegets,
    store: wegetsStore,
    anis: ['wegets'],
    source: 'project'
  },

  halukas: {
    qid: null, // TODO: add 87levSliceHalukas query
    extract: extractHalukas,
    store: halukasStore,
    anis: ['haluk'],
    source: 'project'
  },

  welcome: {
    qid: null, // TODO: add 87levSliceWelcome query
    extract: extractWelcome,
    store: welcomeStore,
    anis: ['walcomen'],
    source: 'project'
  },

  transfers: {
    qid: null, // TODO: add 87levSliceTransfers query
    extract: extractTransfers,
    store: transfersStore,
    anis: ['vidu'],
    source: 'project'
  },

  decisions: {
    qid: '87levSliceDecisions',
    extract: extractDecisions,
    store: decisionsStore,
    anis: ['hachla'],
    source: 'project'
  },

  sales: {
    qid: '87levSliceSales',
    extract: extractSales,
    store: salesStore,
    anis: ['sale'],
    source: 'project'
  },

  // ── user-scoped types ────────────────────────────────────────────────────

  mtaha: {
    qid: null, // TODO: add 87levSliceMtaha query (user-scoped)
    extract: extractMtaha,
    store: mtahaStore,
    anis: ['mtaha'],
    source: 'user'
  },

  asked: {
    qid: null, // TODO: add 87levSliceAsked query (user-scoped)
    extract: extractAsked,
    store: askedStore,
    anis: ['askedcoin'],
    source: 'user'
  },

  askedResources: {
    qid: null, // TODO: add 87levSliceAskedResources query (user-scoped)
    extract: extractAskedResources,
    store: askedResourcesStore,
    anis: ['askedm'],
    source: 'user'
  },

  purchases: {
    qid: null, // TODO: add 87levSlicePurchases query (user-scoped)
    extract: extractPurchases,
    store: purchasesStore,
    anis: ['buy'],
    source: 'user'
  }

  // ── intentionally excluded from quantum loading ──────────────────────────
  // suggestions (meData): requires the query-84 enrichment pass
  //   (updateSuggestionsWithDetails in levDataLoader.ts) and scoring.
  // resourceSuggestions (huca): same — enrichment-dependent.
};

/**
 * Find all slice keys whose anis array contains the given ani value.
 * Used to translate a ?focus= param into slice keys.
 */
export function sliceKeysForAni(ani: string): string[] {
  return Object.entries(LEV_SLICES)
    .filter(([, def]) => def.anis.includes(ani))
    .map(([key]) => key);
}

/**
 * Return only the slice keys that have a qid registered (ready to use).
 */
export function runnableSliceKeys(): string[] {
  return Object.entries(LEV_SLICES)
    .filter(([, def]) => def.qid !== null)
    .map(([key]) => key);
}
