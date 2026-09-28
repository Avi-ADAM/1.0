// Minimal user lookups for the consent/recovery routes: a username to show
// next to a guardian id, and the email + language a recovery warning is sent
// to. Server-only, service token, never returned wholesale to a client.
//
// Users-permissions REST answers a flat array (not `{ data }`), in v4 and v5
// alike. Best-effort like the mirror: a failed lookup degrades to "no name",
// it never fails the request that asked.

import { env } from '$env/dynamic/private';
import { STRAPI_URL } from '$lib/server/strapiUrl.js';

function adminToken(): string {
  return String(env.ADMINMONTHER ?? '').replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');
}

type UserRow = { id: number | string; username?: string; email?: string; lang?: string | null };

async function usersById(ids: string[], fields: string[]): Promise<UserRow[]> {
  const clean = [...new Set(ids.filter((id) => /^\d+$/.test(id)))];
  if (clean.length === 0 || !adminToken()) return [];
  const qs = new URLSearchParams();
  clean.forEach((id, i) => qs.set(`filters[id][$in][${i}]`, id));
  fields.forEach((f, i) => qs.set(`fields[${i}]`, f));
  qs.set('pagination[limit]', String(clean.length));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${STRAPI_URL}/api/users?${qs}`, {
      headers: { Authorization: `Bearer ${adminToken()}` },
      signal: controller.signal
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
  } catch (e) {
    console.warn('[consent/userDirectory] lookup failed:', (e as Error).message);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** id → username for the ids that resolve. */
export async function usernamesFor(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const u of await usersById(ids, ['username'])) {
    if (u.username) out[String(u.id)] = u.username;
  }
  return out;
}

export async function userContact(
  id: string
): Promise<{ username: string; email: string; lang: string } | null> {
  const [u] = await usersById([id], ['username', 'email', 'lang']);
  if (!u?.email) return null;
  return { username: u.username ?? '', email: u.email, lang: u.lang ?? 'he' };
}
