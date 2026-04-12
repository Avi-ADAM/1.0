// src/lib/server/apiKeys.ts
import crypto from 'crypto';
import 'dotenv/config';

const STRAPI_URL   = process.env.STRAPI_URL!;
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN!;

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

// ─── verifyApiKey מהיר יותר עם userId ────────────────────────────

export async function verifyApiKey(rawKey: string) {
  // 1. חלץ userId מהמפתח — בלי לשאול את Strapi
  const userId = extractUserIdFromKey(rawKey);
  if (!userId) return null;

  // 2. שלוף רק מפתחות של אותו משתמש (סט קטן בהרבה)
  const hash = hashKey(rawKey);
  const res  = await fetch(
    `${STRAPI_URL}/api/api-keys` +
    `?filters[user][id][$eq]=${userId}` +
    `&filters[key_hash][$eq]=${hash}` +
    `&populate=user&fields[0]=id`,
    { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } }
  );

  if (!res.ok) return null;
  const { data } = await res.json();
  if (!data?.length) return null;

  return data[0].attributes.user?.data ?? null;
}