/**
 * Signing the agreement a second time with the same email.
 *
 * `Chezin.email` is unique, so a person who goes back to a form that is still
 * open, or signs again from the agreement site, gets a validation error from
 * Strapi for a signature that is already there. /api/chezin carries them on to
 * /signup when the browser proves the earlier signature is its own: the
 * `fpval` cookie that signature left, naming a row with this very email.
 *
 * Never by the email alone. Anyone can type an address, and the row id is what
 * /signup attaches to the new account.
 */
import type { ExtendedSignatureRow } from '$lib/server/assistant/extendedSignature.js';

const UNIQUE_MESSAGE = 'This attribute must be unique';

/** Whether a GraphQL result is Strapi refusing a value that already exists. */
export function isUniqueViolation(result: unknown): boolean {
  const errors = (result as { errors?: unknown } | null | undefined)?.errors;
  return Array.isArray(errors) && errors.some((e) => e?.message === UNIQUE_MESSAGE);
}

/**
 * Whether the row the browser's cookie names may stand as this signature.
 *
 * A row that already has an account belongs at /login. A short signature cannot
 * stand in for an extended one being signed now: the person would be told it
 * worked while the row still says they never signed it.
 */
export function canResumeSignature(
  row: ExtendedSignatureRow | null,
  { email, fullAgreement }: { email: string; fullAgreement: boolean }
): boolean {
  if (!row?.email || !email || row.userId) return false;
  const norm = (s: string) => s.trim().toLowerCase();
  if (norm(row.email) !== norm(email)) return false;
  return !fullAgreement || row.fullAgreement === true;
}
