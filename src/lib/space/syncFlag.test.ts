// A1 — the Space is turned on per rikma (server allowlist), with the old
// localStorage flag kept as a developer override.

import { describe, it, expect } from 'vitest';
import { decideSpaceSync, parseSpaceSyncProjects, SPACE_SYNC_OVERRIDE_ON } from './syncFlag';

describe('decideSpaceSync — the three modes', () => {
  it('no env and no override: off everywhere (identical to before A1)', () => {
    expect(decideSpaceSync({ override: null, projectId: '12', allowlist: [] })).toBe(false);
    expect(decideSpaceSync({ override: null, projectId: '12', allowlist: undefined })).toBe(false);
    expect(decideSpaceSync({ override: null, allowlist: [] })).toBe(false);
  });

  it('developer override: on for every space, with or without a project', () => {
    const override = SPACE_SYNC_OVERRIDE_ON;
    expect(decideSpaceSync({ override, projectId: '12', allowlist: [] })).toBe(true);
    expect(decideSpaceSync({ override, projectId: null, allowlist: [] })).toBe(true);
    expect(decideSpaceSync({ override, allowlist: undefined })).toBe(true);
  });

  it('server allowlist: on only for the listed rikmas', () => {
    const allowlist = ['12', '40'];
    expect(decideSpaceSync({ override: null, projectId: '12', allowlist })).toBe(true);
    expect(decideSpaceSync({ override: null, projectId: 40, allowlist })).toBe(true);
    expect(decideSpaceSync({ override: null, projectId: '13', allowlist })).toBe(false);
  });

  it('server allowlist does not reach a call with no rikma context', () => {
    const allowlist = ['12'];
    expect(decideSpaceSync({ override: null, allowlist })).toBe(false);
    expect(decideSpaceSync({ override: null, projectId: null, allowlist })).toBe(false);
    expect(decideSpaceSync({ override: null, projectId: '', allowlist })).toBe(false);
  });

  it('only the exact override value turns everything on', () => {
    for (const override of ['0', 'true', 'yes', ' 1', '']) {
      expect(decideSpaceSync({ override, projectId: '12', allowlist: [] })).toBe(false);
    }
  });
});

describe('parseSpaceSyncProjects', () => {
  it('unset or empty is off', () => {
    expect(parseSpaceSyncProjects(undefined)).toEqual([]);
    expect(parseSpaceSyncProjects(null)).toEqual([]);
    expect(parseSpaceSyncProjects('')).toEqual([]);
    expect(parseSpaceSyncProjects(' , ')).toEqual([]);
  });

  it('takes commas and whitespace, trims, dedupes', () => {
    expect(parseSpaceSyncProjects('12,40')).toEqual(['12', '40']);
    expect(parseSpaceSyncProjects(' 12 , 40\n12 ')).toEqual(['12', '40']);
  });

  it('drops anything that is not a plain id — the list goes to every client', () => {
    expect(parseSpaceSyncProjects('12,<script>,project:9,../x,40')).toEqual(['12', '40']);
  });
});
