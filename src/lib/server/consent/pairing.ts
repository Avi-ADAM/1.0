// T7 — in-memory pairing sessions (PLAN_user_sovereign_consent §Multi-device).
//
// A NEW device opens a pairing session carrying its full key material and
// gets a short human-typable code. An EXISTING (trusted) device of the same
// user looks the code up, the user confirms, the existing device signs a
// DeviceCert and submits it; the server verifies and registers the new key
// with the cert attached.
//
// In-memory is deliberate: sessions live minutes, and pairing is inherently
// interactive — a process restart mid-pairing just means typing a new code.

import { randomInt } from 'node:crypto';

export type PendingPairing = {
  code: string;
  userId: string;
  devicePubB64: string;
  algo: 'Ed25519' | 'ECDSA-P256';
  pubSpkiB64: string;
  label: string;
  kemPubSpkiB64?: string;
  createdAt: number;
};

export const PAIRING_TTL_MS = 10 * 60_000;

// No ambiguous chars (0/O, 1/I/L) — the code is read off one screen and
// typed into another.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const pending = new Map<string, PendingPairing>();

function newCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

function prune(now = Date.now()) {
  for (const [code, p] of pending) {
    if (p.createdAt + PAIRING_TTL_MS <= now) pending.delete(code);
  }
}

export function openPairing(
  req: Omit<PendingPairing, 'code' | 'createdAt'>
): PendingPairing {
  prune();
  // One open session per new device — re-opening replaces the old code.
  for (const [code, p] of pending) {
    if (p.userId === req.userId && p.devicePubB64 === req.devicePubB64) {
      pending.delete(code);
    }
  }
  let code = newCode();
  while (pending.has(code)) code = newCode();
  const session: PendingPairing = { ...req, code, createdAt: Date.now() };
  pending.set(code, session);
  return session;
}

/** Lookup is scoped to the user — a code leaks nothing across accounts. */
export function findPairing(userId: string, code: string): PendingPairing | undefined {
  prune();
  const p = pending.get(code.toUpperCase());
  return p && p.userId === userId ? p : undefined;
}

export function closePairing(code: string): void {
  pending.delete(code.toUpperCase());
}

/** Test hook. */
export function _resetPairings(): void {
  pending.clear();
}
