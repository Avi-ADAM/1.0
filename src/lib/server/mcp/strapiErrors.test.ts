import { describe, expect, it, vi, beforeEach } from 'vitest';
import { strapiErrors, describeStrapiFailure } from './strapiErrors';

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));

describe('strapiErrors', () => {
  it('returns null for a clean response', () => {
    expect(strapiErrors({ data: { project: { data: {} } } })).toBeNull();
    expect(strapiErrors({ errors: [] })).toBeNull();
    expect(strapiErrors(null)).toBeNull();
  });

  it('deduplicates the one message a partial denial repeats per field', () => {
    const res = { errors: Array.from({ length: 96 }, () => ({ message: 'Forbidden access' })) };
    expect(strapiErrors(res)).toEqual({ messages: ['Forbidden access'], forbidden: true });
  });

  it('is not a permission problem when any error is something else', () => {
    const res = { errors: [{ message: 'Forbidden access' }, { message: 'Cannot query field "x"' }] };
    expect(strapiErrors(res)?.forbidden).toBe(false);
  });
});

describe('describeStrapiFailure', () => {
  it('says nothing when there is nothing wrong', () => {
    expect(describeStrapiFailure({ data: {} }, 'tag')).toBeNull();
  });

  it('never lets a denial read as an empty result', () => {
    const msg = describeStrapiFailure({ errors: [{ message: 'Forbidden access' }] }, 'tag')!;
    expect(msg).toMatch(/not readable/i);
    expect(msg).toMatch(/nothing found/i);
  });

  it('keeps the raw backend wording out of the answer, and in the log', () => {
    const msg = describeStrapiFailure({ errors: [{ message: 'Cannot query field "secret"' }] }, 'tag')!;
    expect(msg).not.toMatch(/secret/);
    expect(console.error).toHaveBeenCalled();
  });
});
