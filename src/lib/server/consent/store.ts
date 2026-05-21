// Server-side mirror of consent events and public keys.
//
// Phase 0 uses an in-memory store. Phase 1+ will swap the impl for a Strapi-backed
// repository (collections: consent-event, user-key). The interface here is the
// integration seam — wire Strapi behind these functions, not in the route handlers.

import type { ConsentEvent, DeviceCert } from '$lib/consent/event';

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

export const consentStore = {
  putEvent(ev: ConsentEvent) {
    if (events.has(ev.id)) return false;
    events.set(ev.id, ev);
    const k = subjectKey(ev.subject.type, ev.subject.id);
    const set = eventsBySubject.get(k) ?? new Set();
    set.add(ev.id);
    eventsBySubject.set(k, set);
    return true;
  },

  getEvent(id: string) {
    return events.get(id);
  },

  eventsForSubject(type: string, id: string): ConsentEvent[] {
    const ids = eventsBySubject.get(subjectKey(type, id));
    if (!ids) return [];
    const out: ConsentEvent[] = [];
    for (const evId of ids) {
      const e = events.get(evId);
      if (e) out.push(e);
    }
    return out;
  },

  putKey(k: StoredPubKey) {
    const m = keysByUser.get(k.userId) ?? new Map<string, StoredPubKey>();
    m.set(k.devicePubB64, k);
    keysByUser.set(k.userId, m);
  },

  getKey(userId: string, devicePubB64: string): StoredPubKey | undefined {
    return keysByUser.get(userId)?.get(devicePubB64);
  },

  getKeysForUser(userId: string): StoredPubKey[] {
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
