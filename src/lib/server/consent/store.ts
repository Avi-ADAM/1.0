// Server-side mirror of consent events and public keys.
//
// Phase 1 wiring: an in-memory write-through cache in front of the Strapi
// repository (collections: consent-event, user-key — repo 1.0b). Memory
// answers hot reads; Strapi makes the mirror survive restarts. When Strapi is
// unreachable or unconfigured the store degrades to Phase-0 memory-only
// behavior — D-11: the mirror is never the authority, so it must never block.
//
// All methods are async; route handlers await them.

import type { ConsentEvent, DeviceCert } from '$lib/consent/event';
import {
  mirrorSaveEvent,
  mirrorLoadEvent,
  mirrorEventsForSubject,
  mirrorSaveKey,
  mirrorLoadKey,
  mirrorKeysForUser
} from './strapiMirror';

export type StoredPubKey = {
  userId: string;
  devicePubB64: string;        // primary key
  algo: 'Ed25519' | 'ECDSA-P256';
  pubSpkiB64: string;          // base64url-encoded SPKI bytes
  label: string;
  cert?: DeviceCert;           // null for self-cert / TOFU first device
  revokedAt?: number;
  addedAt: number;
};

const events = new Map<string, ConsentEvent>();           // id -> event
const eventsBySubject = new Map<string, Set<string>>();   // `${type}:${id}` -> event ids
const keysByUser = new Map<string, Map<string, StoredPubKey>>(); // userId -> devicePubB64 -> key

function subjectKey(type: string, id: string) {
  return `${type}:${id}`;
}

function cacheEvent(ev: ConsentEvent): boolean {
  if (events.has(ev.id)) return false;
  events.set(ev.id, ev);
  const k = subjectKey(ev.subject.type, ev.subject.id);
  const set = eventsBySubject.get(k) ?? new Set();
  set.add(ev.id);
  eventsBySubject.set(k, set);
  return true;
}

function cacheKey(k: StoredPubKey) {
  const m = keysByUser.get(k.userId) ?? new Map<string, StoredPubKey>();
  m.set(k.devicePubB64, k);
  keysByUser.set(k.userId, m);
}

export const consentStore = {
  async putEvent(ev: ConsentEvent): Promise<boolean> {
    const added = cacheEvent(ev);
    if (added) await mirrorSaveEvent(ev);
    return added;
  },

  async getEvent(id: string): Promise<ConsentEvent | undefined> {
    const local = events.get(id);
    if (local) return local;
    const remote = await mirrorLoadEvent(id);
    if (remote) cacheEvent(remote);
    return remote;
  },

  async eventsForSubject(type: string, id: string): Promise<ConsentEvent[]> {
    // The mirror may know events this process hasn't seen (other instance,
    // pre-restart writes) — merge it into the cache before answering.
    for (const remote of await mirrorEventsForSubject(type, id)) {
      cacheEvent(remote);
    }
    const ids = eventsBySubject.get(subjectKey(type, id));
    if (!ids) return [];
    const out: ConsentEvent[] = [];
    for (const evId of ids) {
      const e = events.get(evId);
      if (e) out.push(e);
    }
    return out;
  },

  async putKey(k: StoredPubKey): Promise<void> {
    cacheKey(k);
    await mirrorSaveKey(k);
  },

  async getKey(userId: string, devicePubB64: string): Promise<StoredPubKey | undefined> {
    const local = keysByUser.get(userId)?.get(devicePubB64);
    if (local) return local;
    const remote = await mirrorLoadKey(userId, devicePubB64);
    if (remote) cacheKey(remote);
    return remote;
  },

  async getKeysForUser(userId: string): Promise<StoredPubKey[]> {
    for (const remote of await mirrorKeysForUser(userId)) {
      cacheKey(remote);
    }
    const m = keysByUser.get(userId);
    return m ? [...m.values()] : [];
  },

  // Test helper
  _reset() {
    events.clear();
    eventsBySubject.clear();
    keysByUser.clear();
  }
};
