// S2b shadow-spec derivation (HANDOFF T4 step 6) — pure mapping tests,
// no crypto/IDB needed (same approach as shadowSign.test.ts).

import { describe, it, expect } from 'vitest';
import { deriveConsentEventFromAction } from '$lib/client/shadowSign';
import { s2bShadowJobs } from './s2b';

describe('createMission shadow jobs', () => {
  const params = {
    projectId: 'p1', missionName: 'build', nhours: 10, valph: 50
  };

  it('maps the pendm branch to mission.create with branch:pend and the stage id', () => {
    const jobs = s2bShadowJobs.createMission(params, {
      missionId: '77', createdEntityId: '900', createdEntityType: 'pendm'
    });
    expect(jobs).toHaveLength(1);
    const ev = deriveConsentEventFromAction(jobs[0].spec, jobs[0].params);
    expect(ev?.action).toBe('mission.create');
    expect(ev?.subject).toEqual({ type: 'mission', id: '77' });
    expect(ev?.predicate).toMatchObject({
      name: 'build', hours: 10, perhour: 50, branch: 'pend', stageIds: ['900']
    });
  });

  it('maps mesimabetahalich to branch:self and an assigned multi-user to branch:ask', () => {
    const self = s2bShadowJobs.createMission(params, {
      missionId: '77', createdEntityId: '901', createdEntityType: 'mesimabetahalich'
    });
    expect(deriveConsentEventFromAction(self[0].spec, self[0].params)?.predicate)
      .toMatchObject({ branch: 'self' });

    const asked = s2bShadowJobs.createMission({ ...params, assignedUserId: '5' }, {
      missionId: '77', createdEntityId: '902', createdEntityType: 'openMission'
    });
    expect(deriveConsentEventFromAction(asked[0].spec, asked[0].params)?.predicate)
      .toMatchObject({ branch: 'ask', assignee: '5' });
  });

  it('shadow-skips when the server returned no missionId', () => {
    expect(s2bShadowJobs.createMission(params, {})).toEqual([]);
  });
});

describe('completeMission / createChatMessage / createHaluka shadow jobs', () => {
  it('completeMission signs mission.complete with hoursDone + why', () => {
    const jobs = s2bShadowJobs.completeMission(
      { missionId: 'mb-3', hoursdon: '8', why: 'done' }, {}
    );
    const ev = deriveConsentEventFromAction(jobs[0].spec, jobs[0].params);
    expect(ev?.action).toBe('mission.complete');
    expect(ev?.subject).toEqual({ type: 'mission', id: 'mb-3' });
    expect(ev?.predicate).toMatchObject({ hoursDone: 8, why: 'done' });
  });

  it('createChatMessage signs message.post with the message as subject', () => {
    const jobs = s2bShadowJobs.createChatMessage(
      { forumId: 'F1', message: 'hello' }, { messageId: 'm-42' }
    );
    const ev = deriveConsentEventFromAction(jobs[0].spec, jobs[0].params);
    expect(ev?.action).toBe('message.post');
    expect(ev?.subject).toEqual({ type: 'message', id: 'm-42' });
    expect(ev?.predicate).toMatchObject({ forumId: 'F1', body: 'hello' });
    // no messageId → skip, never throw
    expect(s2bShadowJobs.createChatMessage({ forumId: 'F1', message: 'x' }, {})).toEqual([]);
  });

  it('createHaluka signs haluka.create from the GraphQL result shape', () => {
    const jobs = s2bShadowJobs.createHaluka(
      { data: { usersend: '1', userrecive: '2', tosplit: 'T1', amount: 120, matbea: 'ILS' } },
      { createHaluka: { data: { id: 'H9' } } }
    );
    const ev = deriveConsentEventFromAction(jobs[0].spec, jobs[0].params);
    expect(ev?.action).toBe('haluka.create');
    expect(ev?.subject).toEqual({ type: 'haluka', id: 'H9' });
    expect(ev?.predicate).toMatchObject({
      from: '1', to: '2', tosplitId: 'T1', amount: 120, code: 'ILS'
    });
  });
});
