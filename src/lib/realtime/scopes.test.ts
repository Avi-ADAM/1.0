import { describe, it, expect } from 'vitest';
import {
  isKnownScope,
  isScopePattern,
  scopeMatches,
  scope,
  decisionScope,
  scopeList,
  projectIdsOf,
  rtKey
} from './scopes';

describe('isKnownScope — what an action may publish', () => {
  it('accepts entity:id, and decision:kind:id', () => {
    expect(isKnownScope('project:12')).toBe(true);
    expect(isKnownScope('mission:7')).toBe(true);
    expect(isKnownScope('decision:pendm:3')).toBe(true);
    expect(isKnownScope('user:256')).toBe(true);
  });

  it('refuses an unknown entity, a wrong arity, an unknown decision kind', () => {
    expect(isKnownScope('pends:12')).toBe(false);
    expect(isKnownScope('project')).toBe(false);
    expect(isKnownScope('project:1:2')).toBe(false);
    expect(isKnownScope('decision:12')).toBe(false);
    expect(isKnownScope('decision:vote:12')).toBe(false);
  });

  it('never a wildcard or an empty id — those are for listeners', () => {
    expect(isKnownScope('mission:*')).toBe(false);
    expect(isKnownScope('mission:')).toBe(false);
    expect(isKnownScope('mission:a b')).toBe(false);
    expect(isKnownScope(undefined)).toBe(false);
  });
});

describe('isScopePattern / scopeMatches — what a screen listens to', () => {
  it('a pattern may put * in any id position', () => {
    expect(isScopePattern('mission:*')).toBe(true);
    expect(isScopePattern('decision:*:12')).toBe(true);
    expect(isScopePattern('decision:*:*')).toBe(true);
    expect(isScopePattern('*:12')).toBe(false);
  });

  it('matches by segment', () => {
    expect(scopeMatches('mission:*', 'mission:7')).toBe(true);
    expect(scopeMatches('mission:7', 'mission:7')).toBe(true);
    expect(scopeMatches('mission:7', 'mission:8')).toBe(false);
    expect(scopeMatches('decision:*:12', 'decision:pendm:12')).toBe(true);
    expect(scopeMatches('decision:pmash:*', 'decision:pendm:12')).toBe(false);
    expect(scopeMatches('project:*', 'mission:1')).toBe(false);
  });
});

describe('builders', () => {
  it('a missing id gives null, and scopeList drops it', () => {
    expect(scope('project', undefined)).toBeNull();
    expect(scope('project', 12)).toBe('project:12');
    expect(decisionScope('pendm', '3')).toBe('decision:pendm:3');
    expect(scopeList([scope('project', 1), scope('mission', null), 'project:1', false, 'junk'])).toEqual(['project:1']);
  });

  it('the default audience comes from the project scopes', () => {
    expect(projectIdsOf(['project:1', 'mission:2', 'project:9'])).toEqual(['1', '9']);
  });

  it('a depends() key is the pattern under rt:', () => {
    expect(rtKey('project:12')).toBe('rt:project:12');
  });
});
