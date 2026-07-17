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

const KEY_CACHE = new Map<string, { user: any; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 דקות

// ─── Scopes ──────────────────────────────────────────────────────
// Scopes narrow what a key may do on behalf of its owning user:
//   { projects: [projectIds], ops: ['action:createTask', ...] }
// A legacy plain array is treated as project ids (per-project scoping).
// The `scopes` JSON field may not exist yet on the api-key content type in
// Strapi — the query falls back gracefully so verification keeps working.

export interface ApiKeyScopes {
  projects?: string[];
  ops?: string[];
}

export function normalizeApiKeyScopes(raw: unknown): ApiKeyScopes | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const projects = raw.map(String).filter(Boolean);
    return projects.length ? { projects } : null;
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const projects = Array.isArray(obj.projects) ? obj.projects.map(String).filter(Boolean) : undefined;
    const ops = Array.isArray(obj.ops) ? obj.ops.map(String).filter(Boolean) : undefined;
    if (!projects?.length && !ops?.length) return null;
    return {
      ...(projects?.length ? { projects } : {}),
      ...(ops?.length ? { ops } : {})
    };
  }
  return null;
}

// ─── verifyApiKey מהיר יותר עם userId ────────────────────────────

export async function verifyApiKey(rawKey: string) {
  // 1. חלץ userId מהמפתח — בלי לשאול את Strapi
  const userId = extractUserIdFromKey(rawKey);
  console.log(`[API Keys] Verifying key for userId: ${userId}`);
  if (!userId) return null;

  // 2. בדוק cache לפני שאילתה לStrapi
  const cached = KEY_CACHE.get(rawKey);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`[API Keys] Cache hit for userId: ${userId}`);
    return cached.user;
  }

  // 2. שלוף רק מפתחות של אותו משתמש (סט קטן בהרבה)
  const hash = hashKey(rawKey);
  console.log(`[API Keys] Generated hash: ${hash.slice(0, 10)}...`);
  const buildQuery = (withScopes: boolean) => `
    query GetApiKey($hash: String!) {
      apiKeys(filters: { key_hash: { eq: $hash } }) {
        data {
          id
          attributes {
            ${withScopes ? 'scopes' : ''}
            users_permissions_user {
              data {
                id
              }
            }
          }
        }
      }
    }
  `;

  const runQuery = async (withScopes: boolean) =>
    fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_TOKEN}`
      },
      body: JSON.stringify({
        query: buildQuery(withScopes),
        variables: { hash }
      })
    });

  let res = await runQuery(true);
  console.log(`[API Keys] GraphQL request status: ${res.status}`);

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[API Keys] GraphQL error: ${errorText}`);
    return null;
  }

  let { data: gqlData, errors } = await res.json();

  // The `scopes` field may not exist yet in the Strapi schema — retry without it.
  if (errors && JSON.stringify(errors).includes('scopes')) {
    console.warn('[API Keys] api-key.scopes not in Strapi schema yet — querying without it');
    res = await runQuery(false);
    if (!res.ok) {
      console.error(`[API Keys] GraphQL error on fallback: ${await res.text()}`);
      return null;
    }
    ({ data: gqlData, errors } = await res.json());
  }

  if (errors) {
    console.error(`[API Keys] GraphQL Errors: ${JSON.stringify(errors)}`);
    return null;
  }

  const keys = gqlData?.apiKeys?.data || [];
  console.log(`[API Keys] GraphQL returned ${keys.length} matching keys`);
  
  if (keys.length === 0) return null;

  const keyData = keys[0].attributes;
  const userObj = keyData.users_permissions_user?.data;
  const keyUserId = userObj?.id;

  console.log(`[API Keys] Extracted keyUserId: ${keyUserId}`);

  if (keyUserId && parseInt(keyUserId) === parseInt(userId)) {
      console.log(`[API Keys] Match found! Authorized as user ${keyUserId}`);
      const scopes = normalizeApiKeyScopes(keyData.scopes);
      const verified = scopes ? { ...userObj, scopes } : userObj;
      KEY_CACHE.set(rawKey, { user: verified, expiresAt: Date.now() + CACHE_TTL_MS });
      return verified;
  }

  console.warn(`[API Keys] Key exists but user mismatch: Key belongs to ${keyUserId}, request is for ${userId}`);
  return null;
}