import { describe, it, expect } from 'vitest';
import { withUpdateStrategy } from './ActionService.js';

const partial = { type: 'partialUpdate' as const, config: { dataKeys: ['tasks'] } };

describe('withUpdateStrategy (REALTIME_TRACKING B1)', () => {
  it('carries a config-only strategy to the notifier, keeping the result intact', () => {
    const qidResult = { data: { updateMtaha: { data: { id: '9' } } } };
    expect(withUpdateStrategy(qidResult, partial)).toEqual({ ...qidResult, updateStrategy: partial });
  });

  it("never overrides the handler's own strategy", () => {
    const own = { type: 'refetchScope' as const, config: { dataKeys: ['halukas'] } };
    const result = { data: 1, updateStrategy: own };
    expect(withUpdateStrategy(result, partial)).toBe(result);
  });

  it('leaves results it cannot extend untouched', () => {
    const list = [{ id: 1 }];
    expect(withUpdateStrategy(list, partial)).toBe(list);
    expect(withUpdateStrategy(null, partial)).toBeNull();
    expect(withUpdateStrategy('ok', partial)).toBe('ok');
    const plain = { data: 1 };
    expect(withUpdateStrategy(plain, undefined)).toBe(plain);
  });
});
