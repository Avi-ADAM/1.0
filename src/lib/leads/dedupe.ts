/**
 * Recognising the same person writing again (docs/inprogress/PLAN_LEADS.md §2.4).
 *
 * A lead's `dedupeKey` holds one part per contact channel it has —
 * `p:<hash>` for the phone, `e:<hash>` for the email — joined by `|`. A new
 * enquiry matches an open lead when any of its parts appears in the stored key,
 * so the same phone with a new email is still the same person.
 *
 * Hashing is injected: this module stays pure and the server passes sha-256.
 */

/**
 * Digits only, Israeli international form folded to the local one
 * (`+972 50-000-0000` ⇒ `0500000000`). Shorter than 7 digits is not a phone.
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (typeof phone !== 'string') return null;
  let digits = phone.replace(/\D+/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('972')) digits = '0' + digits.slice(3);
  return digits.length >= 7 ? digits : null;
}

export function normalizeEmail(email: string | null | undefined): string | null {
  if (typeof email !== 'string') return null;
  const e = email.trim().toLowerCase();
  return e.includes('@') ? e : null;
}

/** The unhashed parts, phone first. Empty when there is nothing to match on. */
export function contactParts(email: string | null | undefined, phone: string | null | undefined): string[] {
  const parts: string[] = [];
  const p = normalizePhone(phone);
  const e = normalizeEmail(email);
  if (p) parts.push(`p:${p}`);
  if (e) parts.push(`e:${e}`);
  return parts;
}

/** `p:<hash>|e:<hash>` — what is stored on the lead. Null when there is no contact at all. */
export function dedupeKeyOf(
  email: string | null | undefined,
  phone: string | null | undefined,
  hash: (s: string) => string
): string | null {
  const keys = dedupeLookupKeys(email, phone, hash);
  return keys.length ? keys.join('|') : null;
}

/** Each hashed part on its own — the values a lookup searches the stored keys for. */
export function dedupeLookupKeys(
  email: string | null | undefined,
  phone: string | null | undefined,
  hash: (s: string) => string
): string[] {
  return contactParts(email, phone).map((part) => `${part.slice(0, 2)}${hash(part)}`);
}

/** Whether a stored key shares any part with these lookup keys. */
export function sharesContact(storedKey: string | null | undefined, lookupKeys: string[]): boolean {
  if (!storedKey) return false;
  const stored = new Set(storedKey.split('|'));
  return lookupKeys.some((k) => stored.has(k));
}
