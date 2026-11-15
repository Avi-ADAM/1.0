import { describe, it, expect } from 'vitest';
import { statusForActionError } from './httpStatus';

describe('statusForActionError', () => {
  it('keeps crashes at 500', () => {
    expect(statusForActionError(undefined)).toBe(500);
    expect(statusForActionError('INTERNAL_ERROR')).toBe(500);
    expect(statusForActionError('STRAPI_ERROR')).toBe(500);
    expect(statusForActionError('CREATE_FAILED')).toBe(500);
  });

  it('answers a deliberate domain refusal with a 4xx, not 500', () => {
    expect(statusForActionError('VARIANT_REQUIRED')).toBe(409);
    expect(statusForActionError('ALREADY_RESOLVED')).toBe(409);
    expect(statusForActionError('SOME_NEW_CODE')).toBe(409);
  });

  it('maps the known families', () => {
    expect(statusForActionError('VALIDATION_FAILED')).toBe(400);
    expect(statusForActionError('INVALID_STOCK')).toBe(400);
    expect(statusForActionError('UNAUTHORIZED')).toBe(403);
    expect(statusForActionError('FORBIDDEN')).toBe(403);
    expect(statusForActionError('NOT_MEMBER')).toBe(403);
    expect(statusForActionError('NOT_FOUND')).toBe(404);
    expect(statusForActionError('VARIANT_NOT_FOUND')).toBe(404);
    expect(statusForActionError('UNKNOWN_ACTION')).toBe(404);
  });
});
