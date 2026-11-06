// A2b P4 — the settings half of the shadow comparison.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ConsentEvent } from './event';
import { amendedPaths, compareSettings, settingFingerprint } from './settingsShadow';
import { AMEND_PATHS, settingsFromProjectAttrs } from './specs/projectAmend';
import { validateShadowReport } from './shadowTelemetry';

const amend = (path: string, value: unknown) =>
  ({ action: 'project.amend', subject: { type: 'project', id: '45' }, predicate: { path, value } }) as unknown as ConsentEvent;

describe('settingsFromProjectAttrs', () => {
  it('reads a project in the chain vocabulary and normal form', () => {
    const s = settingsFromProjectAttrs({
      projectName: ' הגינה ',
      publicDescription: '',
      githublink: 'https://g',
      restime: 'feh',
      profilePic: { data: { id: 55 } },
      codeLicense: null,
      vallues: { data: [{ id: 9 }, { id: 12 }] },
      slug: 'garden',
      look: { hue: 2 }
    });
    expect(s.get('name')).toBe('הגינה');
    expect(s.get('publicDescription')).toBeNull();
    expect(s.get('links/github')).toBe('https://g');
    expect(s.get('links/drive')).toBeNull();
    expect(s.get('restime')).toBe('feh');
    expect(s.get('pic')).toBe('55');
    expect(s.get('codeLicense')).toEqual({ license: 'none', openYears: null }); // legacy null = none
    expect(s.get('values')).toEqual(['12', '9']);
    expect(s.get('address')).toBe('garden');
    expect(s.get('look')).toEqual({ hue: 2 });
  });
});

describe('compareSettings', () => {
  const strapi = settingsFromProjectAttrs({ projectName: 'הגינה', restime: 'feh', vallues: { data: [{ id: 1 }] } });

  it('compares only the paths the chain amended', () => {
    const paths = amendedPaths([amend('name', 'הגינה'), amend('restime', 'feh'), amend('bogus', 1)]);
    expect([...paths].sort()).toEqual(['name', 'restime']);
    const chain = new Map<string, unknown>([['name', 'הגינה'], ['restime', 'feh'], ['values', ['2']]]);
    expect(compareSettings(chain, strapi, paths)).toEqual({ compared: 2, mismatches: [] });
  });

  it('a difference is reported by path index and fingerprints, never by value', () => {
    const chain = new Map<string, unknown>([['name', 'רקמה אחרת']]);
    const r = compareSettings(chain, strapi, new Set(['name']));
    expect(r.compared).toBe(1);
    expect(r.mismatches).toEqual([
      { kind: 'setting', member: '0', chain: settingFingerprint('רקמה אחרת'), strapi: settingFingerprint('הגינה') }
    ]);
    expect(JSON.stringify(r)).not.toContain('הגינה');
    // and the telemetry gate takes it as is
    expect(validateShadowReport({ v: 1, pid: '45', events: 3, compared: 1, mismatches: r.mismatches })?.mismatches)
      .toEqual(r.mismatches);
  });

  it('values compare as canonical JSON (object key order does not matter)', () => {
    const s = settingsFromProjectAttrs({ codeLicense: 'mit' });
    const chain = new Map<string, unknown>([['codeLicense', { openYears: null, license: 'mit' }]]);
    expect(compareSettings(chain, s, new Set(['codeLicense'])).mismatches).toEqual([]);
  });

  it('nothing is compared until Strapi was read', () => {
    expect(compareSettings(new Map([['name', 'x']]), null, new Set(['name']))).toEqual({ compared: 0, mismatches: [] });
  });

  it('fingerprints are stable decimal strings the report format accepts', () => {
    expect(settingFingerprint('a')).toBe(settingFingerprint('a'));
    expect(settingFingerprint('a')).not.toBe(settingFingerprint('b'));
    expect(settingFingerprint(null)).toMatch(/^\d{1,10}$/);
  });
});

describe('the report script names paths by the same index', () => {
  it('mirrors AMEND_PATHS exactly', () => {
    const src = readFileSync(resolve(process.cwd(), 'scripts/space-shadow-report.mjs'), 'utf8');
    const m = src.match(/const AMEND_PATHS = \[([\s\S]*?)\];/);
    expect(m).not.toBeNull();
    const mirrored = [...m![1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
    expect(mirrored).toEqual([...AMEND_PATHS]);
  });
});
