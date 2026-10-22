import { describe, it, expect } from 'vitest';
import { describeActionError } from './actionErrors';

describe('describeActionError', () => {
  it('never renders an error object as [object Object]', () => {
    const out = describeActionError({ code: 'UNAUTHORIZED', message: 'רק חבר רקמה יכול ליצור בה מוצר' });
    expect(out).not.toContain('[object Object]');
    expect(out).toBe('רק חבר רקמה יכול ליצור בה מוצר [UNAUTHORIZED]');
  });

  it('includes validation details', () => {
    const out = describeActionError({
      code: 'VALIDATION_FAILED',
      message: 'Parameter validation failed',
      details: ['Parameter quant must be of type number, got string']
    });
    expect(out).toBe('Parameter validation failed: Parameter quant must be of type number, got string [VALIDATION_FAILED]');
  });

  it('includes deduplicated Strapi error messages', () => {
    const out = describeActionError({
      code: 'STRAPI_ERROR',
      message: 'Database operation failed',
      details: [{ message: 'Forbidden access' }, { message: 'Forbidden access' }]
    });
    expect(out).toBe('Database operation failed: Forbidden access [STRAPI_ERROR]');
  });

  it('passes strings and Errors through, and falls back on nothing', () => {
    expect(describeActionError('boom')).toBe('boom');
    expect(describeActionError(new Error('bad'))).toBe('bad');
    expect(describeActionError(undefined)).toBe('The action reported a failure.');
    expect(describeActionError({})).toBe('The action reported a failure.');
  });
});
