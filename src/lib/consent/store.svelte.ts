import { browser } from '$app/environment';
import { setContext, getContext } from 'svelte';
import { idbAll, idbBySubject } from '$lib/crypto/keystore';
import { ingestEvent } from './ingest';
import { project, type ProjectState } from './projection';
import type { ConsentEvent } from './event';
import type { PubKeyResolver } from '$lib/crypto/verify';

const CONSENT_STORE_KEY = Symbol('CONSENT_STORE');

export type ConsentStore = ReturnType<typeof createConsentStore>;

export function createConsentStore() {
  let state = $state({
    eventsById: new Map<string, ConsentEvent>(),
    loaded: false
  });

  async function load() {
    if (!browser || state.loaded) return;
    const all = await idbAll<ConsentEvent>('events');
    const byId = new Map<string, ConsentEvent>();
    for (const e of all) byId.set(e.id, e);
    state.eventsById = byId;
    state.loaded = true;
  }

  async function ingest(raw: unknown, resolve: PubKeyResolver) {
    const res = await ingestEvent(raw, resolve);
    if (res.ok && !res.deduped) {
      const next = new Map(state.eventsById);
      next.set(res.event.id, res.event);
      state.eventsById = next;
    }
    return res;
  }

  function appendVerified(ev: ConsentEvent) {
    if (state.eventsById.has(ev.id)) return;
    const next = new Map(state.eventsById);
    next.set(ev.id, ev);
    state.eventsById = next;
  }

  function eventsForSubject(subjectType: string, subjectId: string): ConsentEvent[] {
    const out: ConsentEvent[] = [];
    for (const e of state.eventsById.values()) {
      if (e.subject.type === subjectType && e.subject.id === subjectId) out.push(e);
    }
    return out;
  }

  function projectFor(projectId: string): ProjectState {
    // For now: project off the full set. Future: index by project once we add
    // a project tag to events.
    return project([...state.eventsById.values()], projectId);
  }

  async function refreshFromIdb(subjectType?: string, subjectId?: string) {
    if (!browser) return;
    if (subjectType && subjectId) {
      const arr = await idbBySubject<ConsentEvent>(subjectType, subjectId);
      const next = new Map(state.eventsById);
      for (const e of arr) next.set(e.id, e);
      state.eventsById = next;
    } else {
      await load();
    }
  }

  return {
    get state() { return state; },
    load,
    ingest,
    appendVerified,
    eventsForSubject,
    projectFor,
    refreshFromIdb
  };
}

export function setConsentStore(): ConsentStore {
  const store = createConsentStore();
  setContext(CONSENT_STORE_KEY, store);
  return store;
}

export function getConsentStore(): ConsentStore {
  const s = getContext<ConsentStore>(CONSENT_STORE_KEY);
  if (!s) throw new Error('ConsentStore not initialized — call setConsentStore() in a layout');
  return s;
}
