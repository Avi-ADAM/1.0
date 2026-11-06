// A2b — the settings vocabulary (SPEC §6.6): what a Decision changes, how it
// is written, and that the signed predicates fold the way the vector says.

import { describe, it, expect } from 'vitest';
import { deriveConsentEventFromAction } from '$lib/client/shadowSign';
import { project } from '$lib/consent/projection';
import type { ConsentEvent } from '$lib/consent/event';
import {
  AMEND_PATHS,
  amendOrder,
  amendToStrapiWrite,
  decisionToAmend,
  directEditAmends,
  identityAmend,
  planLazySettingsSigns,
  projectAmendConsentSpec,
  settingsDecisionCreateConsentSpec,
  type MaturedSettingRow
} from './projectAmend';

describe('decisionToAmend', () => {
  it('maps every settings Decision kind to its path and whole value', () => {
    expect(decisionToAmend('name', { newname: '  רקמה  ' })).toEqual({ path: 'name', value: 'רקמה' });
    expect(decisionToAmend('pubdes', { newpubdes: '' })).toEqual({ path: 'publicDescription', value: null });
    expect(decisionToAmend('prides', { newprides: 'for whom' })).toEqual({ path: 'descripFor', value: 'for whom' });
    expect(decisionToAmend('newFlink', { newFlink: null })).toEqual({ path: 'links/facebook', value: null });
    expect(decisionToAmend('newWlink', { newWlink: 'https://x' })).toEqual({ path: 'links/website', value: 'https://x' });
    expect(decisionToAmend('timtoM', { timtoM: 'feh' })).toEqual({ path: 'restime', value: 'feh' });
    expect(decisionToAmend('pic', { newpic: { data: { id: 55 } } })).toEqual({ path: 'pic', value: '55' });
    expect(decisionToAmend('pic', { newpic: { data: { id: 55 } } }, { newPicId: '60' })).toEqual({ path: 'pic', value: '60' });
    expect(decisionToAmend('codeLicense', { newCodeLicense: 'mit' })).toEqual({
      path: 'codeLicense',
      value: { license: 'mit', openYears: null }
    });
  });

  it('values is the whole set after the change, sorted by code units', () => {
    const current = ['9', '7'];
    expect(decisionToAmend('vallueadd', { valluesadd: { data: [{ id: 12 }, { id: 7 }] } }, { currentValueIds: current }))
      .toEqual({ path: 'values', value: ['12', '7', '9'] });
    expect(decisionToAmend('vallueles', { valluesles: { data: [{ id: 9 }] } }, { currentValueIds: current }))
      .toEqual({ path: 'values', value: ['7'] });
    // without the current set there is nothing exact to sign
    expect(decisionToAmend('vallueadd', { valluesadd: { data: [{ id: 1 }] } })).toBeNull();
  });

  it('returns null where the appliers write nothing', () => {
    expect(decisionToAmend('name', { newname: '' })).toBeNull();
    expect(decisionToAmend('timtoM', {})).toBeNull();
    expect(decisionToAmend('codeLicense', { newCodeLicense: 'not-a-license' })).toBeNull();
    expect(decisionToAmend('pic', {})).toBeNull();
    expect(decisionToAmend('archiveObject', {})).toBeNull();
    expect(decisionToAmend('address', { newSlug: 'x' })).toBeNull(); // identityAmend owns it
  });

  it('identity amends report what was applied', () => {
    expect(identityAmend('address', { newSlug: 'garden' })).toEqual({ path: 'address', value: 'garden' });
    expect(identityAmend('look', { newLook: null })).toEqual({ path: 'look', value: null });
  });

  it('every path it can produce is in the closed list', () => {
    for (const a of [
      decisionToAmend('name', { newname: 'n' }),
      decisionToAmend('vallueadd', { valluesadd: { data: [] } }, { currentValueIds: [] }),
      identityAmend('look', {})
    ]) expect(AMEND_PATHS).toContain(a!.path);
  });
});

describe('amendToStrapiWrite', () => {
  const now = '2026-11-06T00:00:00.000Z';
  it('keeps the historical Strapi form — a cleared text is written as ""', () => {
    expect(amendToStrapiWrite('45', { path: 'publicDescription', value: null }, now))
      .toEqual({ qid: 'updateProjectDetails', vars: { id: '45', publicDescription: '' } });
    expect(amendToStrapiWrite('45', { path: 'name', value: 'n' }, now))
      .toEqual({ qid: 'updateProjectDetails', vars: { id: '45', projectName: 'n' } });
  });
  it('writes restime, values, the license (stamping its date) and the picture', () => {
    expect(amendToStrapiWrite('45', { path: 'restime', value: 'feh' }, now)?.vars).toEqual({ id: '45', restime: 'feh' });
    expect(amendToStrapiWrite('45', { path: 'values', value: ['1', '2'] }, now)?.vars).toEqual({ id: '45', vallues: ['1', '2'] });
    expect(amendToStrapiWrite('45', { path: 'codeLicense', value: { license: 'mit', openYears: null } }, now)?.vars)
      .toEqual({ id: '45', codeLicense: 'mit', codeLicenseOpenYears: null, codeLicenseSince: now });
    expect(amendToStrapiWrite('45', { path: 'pic', value: '9' }, now))
      .toEqual({ qid: '43updateProfilePic', vars: { projectId: '45', imageId: '9' } });
  });
  it('leaves address / look to their own applier', () => {
    expect(amendToStrapiWrite('45', { path: 'address', value: 'x' }, now)).toBeNull();
  });
});

describe('directEditAmends', () => {
  it('lists only what moved, normalised the same way', () => {
    const before = {
      projectName: 'a',
      githublink: null,
      publicDescription: 'd',
      restime: 'feh',
      vallues: { data: [{ id: '2' }, { id: '1' }] }
    };
    expect(directEditAmends(before, {
      text: { projectName: 'a ', githublink: 'https://g', publicDescription: '' },
      restime: 'feh',
      valueIds: ['1', '2']
    })).toEqual([
      { path: 'publicDescription', value: null },
      { path: 'links/github', value: 'https://g' }
    ]);
  });
});

describe('the signed predicates', () => {
  let seq = 0;
  const asEvent = (t: ReturnType<typeof deriveConsentEventFromAction>, actor: string, ts: number) =>
    ({ v: 1, id: `a${++seq}`, actor, device: 'd', action: t!.action, subject: t!.subject, predicate: t!.predicate, parents: [], ts, nonce: 'n', sig: 's' }) as ConsentEvent;

  it('project.amend carries path, value, decisionId and the path-scoped order', () => {
    const ev = deriveConsentEventFromAction(projectAmendConsentSpec, { projectId: '45', path: 'name', value: 'n', decisionId: 'D1' });
    expect(ev?.subject).toEqual({ type: 'project', id: '45' });
    expect(ev?.predicate).toEqual({ path: 'name', value: 'n', decisionId: 'D1', order: 'name#D1' });
    expect(amendOrder('links/github')).toBe('links/github#direct');
  });

  it('one member amending two paths keeps both (the dedupe key has no path)', () => {
    const a = deriveConsentEventFromAction(projectAmendConsentSpec, { projectId: '45', path: 'name', value: 'n' });
    const b = deriveConsentEventFromAction(projectAmendConsentSpec, { projectId: '45', path: 'restime', value: 'feh' });
    const state = project([asEvent(a, '256', 1), asEvent(b, '256', 2)], '45');
    expect(state.settings.get('name')).toBe('n');
    expect(state.settings.get('restime')).toBe('feh');
  });

  it('the same Decision signed twice folds into one', () => {
    const t = () => deriveConsentEventFromAction(projectAmendConsentSpec, { projectId: '45', path: 'name', value: 'n', decisionId: 'D1' });
    const events = [asEvent(t(), '256', 1), asEvent(t(), '256', 2)];
    expect(project(events, '45').settings.get('name')).toBe('n');
  });

  it('decision.create records the kind and the path it would change', () => {
    const ev = deriveConsentEventFromAction(settingsDecisionCreateConsentSpec, {
      projectId: '45', decisionId: 'D1', kind: 'name', path: 'name', value: 'n'
    });
    const state = project([asEvent(ev, '256', 1)], '45');
    expect(state.decisions.get('D1')).toMatchObject({ kind: 'name', ref: 'name', createdBy: '256' });
  });
});

describe('planLazySettingsSigns (P3)', () => {
  const row = (decisionId: string, path: string, value: unknown, over: Partial<MaturedSettingRow> = {}): MaturedSettingRow =>
    ({
      decisionId,
      kind: 'k',
      amend: { path, value },
      maturedBy: 'silence',
      roundStart: 1000,
      maturedAt: 5000,
      expectedEnd: 4000,
      counted: ['256'],
      ...over
    }) as MaturedSettingRow;
  const amendEv = (path: string, ts: number, decisionId?: string) => ({
    action: 'project.amend',
    ts,
    subject: { type: 'project', id: '45' },
    predicate: { path, value: 'x', decisionId }
  });

  it('silence: consensus.timeout first, then the amend', () => {
    const jobs = planLazySettingsSigns([row('D1', 'name', 'n')], [], '45', 9000);
    expect(jobs.map((j) => j.spec.action)).toEqual(['consensus.timeout', 'project.amend']);
    const timeout = deriveConsentEventFromAction(jobs[0].spec, jobs[0].params);
    expect(timeout?.subject).toEqual({ type: 'decision', id: 'D1' });
    expect(timeout?.predicate).toMatchObject({
      closingRound: 0, roundStart: 1000, expectedEnd: 4000, roundDuration: 3000,
      counted: ['256'], attestedNow: 9000, decision: 'approve'
    });
    expect(deriveConsentEventFromAction(jobs[1].spec, jobs[1].params)?.predicate)
      .toEqual({ path: 'name', value: 'n', decisionId: 'D1', order: 'name#D1' });
  });

  it('a full vote that nobody signed gets the amend only', () => {
    const jobs = planLazySettingsSigns([row('D1', 'name', 'n', { maturedBy: 'vote' })], [], '45', 9000);
    expect(jobs.map((j) => j.spec.action)).toEqual(['project.amend']);
  });

  it('nothing when the chain already has that Decision amend', () => {
    expect(planLazySettingsSigns([row('D1', 'name', 'n')], [amendEv('name', 6000, 'D1')], '45', 9000)).toEqual([]);
  });

  it('only the newest Decision per path — an older one would overwrite it', () => {
    const jobs = planLazySettingsSigns([row('D2', 'name', 'new'), row('D1', 'name', 'old')], [], '45', 9000);
    expect(jobs.filter((j) => j.spec.action === 'project.amend').map((j) => j.params.decisionId)).toEqual(['D2']);
    // when the newest is signed already, the older one is not a candidate either
    expect(
      planLazySettingsSigns([row('D2', 'name', 'new'), row('D1', 'name', 'old')], [amendEv('name', 6000, 'D2')], '45', 9000)
    ).toEqual([]);
  });

  it('skips a Decision a later direct edit of the same path superseded', () => {
    expect(planLazySettingsSigns([row('D1', 'name', 'n')], [amendEv('name', 7000)], '45', 9000)).toEqual([]);
    // an earlier edit does not block it
    expect(planLazySettingsSigns([row('D1', 'name', 'n')], [amendEv('name', 3000)], '45', 9000)).toHaveLength(2);
  });

  it('does not sign a second timeout the chain already has', () => {
    const ev = { action: 'consensus.timeout', ts: 6000, subject: { type: 'decision', id: 'D1' }, predicate: {} };
    expect(planLazySettingsSigns([row('D1', 'name', 'n')], [ev], '45', 9000).map((j) => j.spec.action))
      .toEqual(['project.amend']);
  });

  it('signed through the reducers, the setting lands', () => {
    let n = 0;
    const events = planLazySettingsSigns([row('D1', 'restime', 'feh')], [], '45', 9000).map((j) => {
      const t = deriveConsentEventFromAction(j.spec, j.params)!;
      return {
        v: 1, id: `z${++n}`, actor: '258', device: 'd', action: t.action, subject: t.subject,
        predicate: t.predicate, parents: [], ts: 9000 + n, nonce: 'n', sig: 's'
      } as ConsentEvent;
    });
    expect(project(events, '45').settings.get('restime')).toBe('feh');
  });
});
