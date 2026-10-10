import { describe, it, expect } from 'vitest';
import {
  rtDependencyMatches,
  levSlicesForScopes,
  moachSectionsForChange,
  touchesVotes,
  LEV_PATTERNS
} from './routing';
import { isScopePattern, SCOPE_ENTITIES, DECISION_KINDS } from './scopes';

describe('rtDependencyMatches — kit loads', () => {
  it('matches an rt: key against the changed scopes, wildcards included', () => {
    expect(rtDependencyMatches('rt:project:12', ['project:12'])).toBe(true);
    expect(rtDependencyMatches('rt:mission:*', ['project:12', 'mission:7'])).toBe(true);
    expect(rtDependencyMatches('rt:decision:*:7', ['decision:pendm:7'])).toBe(true);
    expect(rtDependencyMatches('rt:project:13', ['project:12'])).toBe(false);
  });

  it('never touches a dependency that is not ours', () => {
    expect(rtDependencyMatches('app:moach:12', ['project:12'])).toBe(false);
    expect(rtDependencyMatches('https://x/api/send', ['project:12'])).toBe(false);
  });
});

describe('levSlicesForScopes — the heart page', () => {
  it('a vote moves its own slice, by kind', () => {
    expect(levSlicesForScopes(['project:1', 'decision:pendm:3'])).toEqual(['pends']);
    expect(levSlicesForScopes(['decision:askm:3'])).toEqual(['askedResources']);
    expect(levSlicesForScopes(['decision:finiapruval:3'])).toEqual(['fiapp']);
  });

  it('a project-only change moves nothing on the heart page', () => {
    expect(levSlicesForScopes(['project:1'])).toEqual([]);
  });

  it('every pattern it listens to is a valid pattern', () => {
    for (const p of LEV_PATTERNS) expect(isScopePattern(p), p).toBe(true);
  });
});

describe('moachSectionsForChange — the rikma tabs', () => {
  it('only a change about this rikma touches it', () => {
    expect(moachSectionsForChange({ scopes: ['project:13', 'mission:1'] }, '12')).toEqual([]);
    expect(moachSectionsForChange({ scopes: ['mission:1'] }, '12')).toEqual([]);
  });

  it('maps entities to sections', () => {
    expect(moachSectionsForChange({ scopes: ['project:12', 'mission:1'] }, 12)).toEqual(['missions']);
    expect(moachSectionsForChange({ scopes: ['project:12', 'sale:1'] }, 12)).toEqual(['financials']);
    expect(moachSectionsForChange({ scopes: ['project:12', 'decision:maap:1'] }, 12).sort()).toEqual(['financials', 'missions']);
  });

  it('the rikma itself changed and nothing more was said ⇒ base', () => {
    expect(moachSectionsForChange({ scopes: ['project:12'] }, 12)).toEqual(['base']);
  });

  it('every entity and decision kind is routed somewhere, or deliberately nowhere', () => {
    // A new entity must be placed here on purpose; the lev page ignores some, moach none.
    for (const e of SCOPE_ENTITIES) {
      if (['project', 'decision', 'forum', 'meeting', 'wish', 'maagad', 'user'].includes(e)) continue;
      expect(moachSectionsForChange({ scopes: ['project:1', `${e}:2`] }, 1), e).not.toEqual(['base']);
    }
    for (const k of DECISION_KINDS) {
      expect(moachSectionsForChange({ scopes: ['project:1', `decision:${k}:2`] }, 1).length, k).toBeGreaterThan(0);
      expect(levSlicesForScopes([`decision:${k}:2`]).length, k).toBeGreaterThan(0);
    }
  });

  it('the votes badge follows decisions of this rikma only', () => {
    expect(touchesVotes({ scopes: ['project:12', 'decision:pendm:1'] }, 12)).toBe(true);
    expect(touchesVotes({ scopes: ['project:12', 'mission:1'] }, 12)).toBe(false);
    expect(touchesVotes({ scopes: ['project:13', 'decision:pendm:1'] }, 12)).toBe(false);
  });
});
