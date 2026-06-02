// Optional WebAuthn "gate": before letting the device sign a batch of consent
// events, we require a fresh user-verification step (Touch ID / Face ID /
// platform PIN). The Passkey isn't used to sign the consent events themselves —
// raw WebCrypto signs those. The Passkey is the physical proof that the user is
// present at the device at the time of signing.
//
// Gate lifetime is kept short (default 5 min) and stored in sessionStorage so it
// doesn't survive a tab close.

import { browser } from '$app/environment';

const GATE_KEY = 'consent.gate.until';
const DEFAULT_GATE_MS = 5 * 60_000;

export function isPasskeyAvailable(): boolean {
  return browser && typeof window !== 'undefined' &&
    'PublicKeyCredential' in window &&
    typeof navigator !== 'undefined' &&
    !!navigator.credentials;
}

export function isGateOpen(now = Date.now()): boolean {
  if (!browser) return false;
  const until = Number(sessionStorage.getItem(GATE_KEY) ?? 0);
  return until > now;
}

export function openGate(durationMs = DEFAULT_GATE_MS) {
  if (!browser) return;
  sessionStorage.setItem(GATE_KEY, String(Date.now() + durationMs));
}

export function closeGate() {
  if (!browser) return;
  sessionStorage.removeItem(GATE_KEY);
}

// Request a user-verification ceremony. If Passkeys aren't available we degrade
// to a UI confirm() — the caller decides whether that's acceptable.
export async function ensurePasskeyGate(opts: {
  rpId?: string;
  durationMs?: number;
  fallbackConfirm?: () => boolean | Promise<boolean>;
} = {}): Promise<boolean> {
  if (isGateOpen()) return true;

  if (isPasskeyAvailable()) {
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const cred = await navigator.credentials.get({
        publicKey: {
          challenge,
          userVerification: 'required',
          rpId: opts.rpId,
          timeout: 60_000
        }
      });
      if (!cred) return false;
      openGate(opts.durationMs);
      return true;
    } catch {
      // User cancelled or no credential — fall through to fallback.
    }
  }

  if (opts.fallbackConfirm) {
    const ok = await opts.fallbackConfirm();
    if (ok) openGate(opts.durationMs);
    return ok;
  }
  return false;
}
