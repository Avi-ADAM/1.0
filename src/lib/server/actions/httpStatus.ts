/**
 * The HTTP status `/api/action` answers a failed action with.
 *
 * Only a crash is a 5xx: `INTERNAL_ERROR` (an unexpected throw), `STRAPI_ERROR`
 * and the `*_FAILED` codes a config throws when a Strapi write did not land.
 * Every other code is an `ActionError` a config threw on purpose — an answer
 * about the request or the state it met (`VARIANT_REQUIRED`, `ALREADY_RESOLVED`,
 * `TAKEN`, …) — and used to fall through to 500, so the browser logged a
 * server error for "pick a variant first". Those are 4xx; an unlisted one is a
 * conflict with the current state, 409.
 */
export function statusForActionError(code?: string): number {
  if (!code || code === 'INTERNAL_ERROR' || code === 'STRAPI_ERROR') return 500;
  if (code.endsWith('_FAILED') && code !== 'VALIDATION_FAILED') return 500;

  switch (code) {
    case 'VALIDATION_FAILED':
    case 'INVALID_LINK':
      return 400;
    case 'SESSION_REQUIRED':
    case 'NO_ACCOUNT':
      return 401;
    case 'UNAUTHORIZED':
    case 'FORBIDDEN':
    case 'NOT_ALLOWED':
    case 'NOT_MEMBER':
    case 'NOT_YOURS':
    case 'NOT_PROPOSER':
    case 'NOT_GIVER':
    case 'NOT_TARGET':
    case 'NOT_IN_ROLE':
      return 403;
    case 'UNKNOWN_ACTION':
    case 'NOT_FOUND':
      return 404;
  }
  if (code.endsWith('_NOT_FOUND')) return 404;
  if (code.startsWith('INVALID_')) return 400;
  return 409;
}
