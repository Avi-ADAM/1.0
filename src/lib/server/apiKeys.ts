// src/lib/server/apiKeys.ts
import crypto from 'crypto';
import 'dotenv/config';

const STRAPI_URL   = process.env.STRAPI_URL!;
const STRAPI_TOKEN = process.env.STRAPI_API_NEW!;

export const KEY_PREFIX = '1lev1_';
const ALLOWED_HOSTS = (process.env.MCP_ALLOWED_HOSTS ?? '').split(',');

export function isValidCallback(url: string): boolean {
  try {
    const parsed = new URL(url);
    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    const isAllowed   = ALLOWED_HOSTS.includes(parsed.hostname);
    const isHttps     = parsed.protocol === 'https:';
    return isLocalhost || (isHttps && isAllowed);
  } catch {
    return false;
  }
}
// ⚠️ חובה להגדיר ב-.env — מחרוזת ארוכה ואקראית
const NONCE = process.env.API_KEY_NONCE!;
if (!NONCE || NONCE.length < 32) {
  throw new Error('API_KEY_NONCE חייב להיות מוגדר ולהכיל לפחות 32 תווים');
}

// ─── Encoding helpers ────────────────────────────────────────────

function encodeUserId(id: number): string {
  return id.toString(36); // קומפקטי: 71 → "1z", 1000 → "rs"
}

function decodeUserId(encoded: string): number {
  return parseInt(encoded, 36);
}

// ─── יצירה ────────────────────────────────────────────────────────

export function generateApiKey(userId: number): {
  raw: string;
  hash: string;
  prefix: string;
} {
  console.log(userId);
  const userPart = encodeUserId(userId);
  const randPart = crypto.randomBytes(24).toString('hex');
  const raw      = `${KEY_PREFIX}${userPart}_${randPart}`;
  const hash     = hashKey(raw);
  const prefix   = raw.slice(-4);
  console.log(raw, hash, prefix);
  return { raw, hash, prefix };
}

// ─── HMAC במקום SHA-256 פשוט ─────────────────────────────────────

export function hashKey(raw: string): string {
  return crypto
    .createHmac('sha256', NONCE)
    .update(raw)
    .digest('hex');
}

// ─── חילוץ userId ממפתח גולמי ────────────────────────────────────

export function extractUserIdFromKey(raw: string): number | null {
  if (!raw.startsWith(KEY_PREFIX)) return null;
  // אחרי הפרפיקס: "{userPart}_{randPart}"
  const withoutPrefix = raw.slice(KEY_PREFIX.length);
  const underscoreIdx = withoutPrefix.indexOf('_');
  if (underscoreIdx === -1) return null;

  const userPart = withoutPrefix.slice(0, underscoreIdx);
  const userId   = decodeUserId(userPart);
  return Number.isFinite(userId) ? userId : null;
}

// ─── Cache קצר-טווח למניעת שאילתות כפולות לStrapi ──────────────

export interface VerifiedApiKey {
  /** The key's owner (reporter). Kept as `{ id }` for legacy callers. */
  user: { id: string; [k: string]: any };
  /** Strapi api-key record id (for lastUsedAt updates). */
  keyId: string;
  name: string | null;
  /** Rikma the key is scoped to, if any. Sales-API keys always carry one. */
  project: { id: string } | null;
  /** Granted scopes, e.g. ["sales:report"]. Empty ⇒ legacy/unscoped key. */
  scopes: string[];
  revoked: boolean;
  /** Optional hardening: allowed request origins. */
  allowedOrigins: string[];
  lastUsedAt: string | null;
}

const KEY_CACHE = new Map<string, { verified: VerifiedApiKey; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 דקות

/**
 * Full verification: returns the owning user plus the key's scoping metadata
 * (project, scopes, revoked, allowed_origins). Returns the record even when
 * `revoked` is true so callers can distinguish "revoked" from "unknown key"
 * — the thin `verifyApiKey` wrapper below maps revoked ⇒ null.
 */
export async function verifyApiKeyDetailed(rawKey: string): Promise<VerifiedApiKey | null> {
  // 1. חלץ userId מהמפתח — בלי לשאול את Strapi
  const userId = extractUserIdFromKey(rawKey);
  console.log(`[API Keys] Verifying key for userId: ${userId}`);
  if (!userId) return null;

  // 2. בדוק cache לפני שאילתה לStrapi
  const cached = KEY_CACHE.get(rawKey);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`[API Keys] Cache hit for userId: ${userId}`);
    return cached.verified;
  }

  // 3. שלוף רק מפתחות של אותו משתמש (סט קטן בהרבה)
  const hash = hashKey(rawKey);
  console.log(`[API Keys] Generated hash: ${hash.slice(0, 10)}...`);
  const query = `
    query GetApiKey($hash: String!) {
      apiKeys(filters: { key_hash: { eq: $hash } }) {
        data {
          id
          attributes {
            name
            scopes
            revoked
            allowed_origins
            lastUsedAt
            users_permissions_user {
              data {
                id
              }
            }
            project {
              data {
                id
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch(`${STRAPI_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`
    },
    body: JSON.stringify({
      query,
      variables: { hash }
    })
  });

  console.log(`[API Keys] GraphQL request status: ${res.status}`);

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[API Keys] GraphQL error: ${errorText}`);
    return null;
  }

  const { data: gqlData, errors } = await res.json();

  if (errors) {
    console.error(`[API Keys] GraphQL Errors: ${JSON.stringify(errors)}`);
    return null;
  }

  const keys = gqlData?.apiKeys?.data || [];
  console.log(`[API Keys] GraphQL returned ${keys.length} matching keys`);

  if (keys.length === 0) return null;

  const keyId = keys[0].id;
  const keyData = keys[0].attributes;
  const userObj = keyData.users_permissions_user?.data;
  const keyUserId = userObj?.id;

  console.log(`[API Keys] Extracted keyUserId: ${keyUserId}`);

  if (!keyUserId || parseInt(String(keyUserId), 10) !== userId) {
    console.warn(`[API Keys] Key exists but user mismatch: Key belongs to ${keyUserId}, request is for ${userId}`);
    return null;
  }

  console.log(`[API Keys] Match found! Authorized as user ${keyUserId}`);

  const verified: VerifiedApiKey = {
    user: userObj,
    keyId: String(keyId),
    name: keyData.name ?? null,
    project: keyData.project?.data ? { id: String(keyData.project.data.id) } : null,
    scopes: Array.isArray(keyData.scopes) ? keyData.scopes : [],
    revoked: !!keyData.revoked,
    allowedOrigins: Array.isArray(keyData.allowed_origins) ? keyData.allowed_origins : [],
    lastUsedAt: keyData.lastUsedAt ?? null
  };

  KEY_CACHE.set(rawKey, { verified, expiresAt: Date.now() + CACHE_TTL_MS });
  return verified;
}

// ─── verifyApiKey מהיר יותר עם userId ────────────────────────────
// Backwards-compatible wrapper: returns just the owning user object (or null).
// A revoked key resolves to null everywhere it is used.

export async function verifyApiKey(rawKey: string) {
  const verified = await verifyApiKeyDetailed(rawKey);
  if (!verified || verified.revoked) return null;
  return verified.user;
}

/** True iff the verified key was granted the given scope. */
export function assertScope(key: VerifiedApiKey, scope: string): boolean {
  return Array.isArray(key.scopes) && key.scopes.includes(scope);
}

/**
 * Fire-and-forget "seen last at" stamp. Never throws and never blocks the
 * response — a failed stamp must not fail a sale report.
 */
export function touchLastUsed(keyId: string, fetchFn: typeof globalThis.fetch = fetch): void {
  const mutation = `
    mutation TouchApiKeyLastUsed($id: ID!, $lastUsedAt: DateTime!) {
      updateApiKey(id: $id, data: { lastUsedAt: $lastUsedAt }) {
        data { id }
      }
    }
  `;
  fetchFn(`${STRAPI_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`
    },
    body: JSON.stringify({
      query: mutation,
      variables: { id: keyId, lastUsedAt: new Date().toISOString() }
    })
  }).catch((err) => console.warn('[API Keys] lastUsedAt update failed:', err));
}