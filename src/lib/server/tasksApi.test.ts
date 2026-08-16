import { describe, it, expect } from 'vitest';
import {
  validateTasksPayload,
  buildCreateTaskParams,
  toTaskStatusView,
  TASK_SOURCE
} from './tasksApi.js';

/** Convenience: validate and assert success, returning the normalised payload. */
function ok(body: any) {
  const r = validateTasksPayload(body);
  if (r.ok === false) throw new Error(`expected valid, got ${r.status}: ${r.message}`);
  return r.value;
}

describe('validateTasksPayload', () => {
  it('accepts a minimal body and defaults the rest', () => {
    const v = ok({ name: 'Fix the save button' });
    expect(v).toEqual({
      name: 'Fix the save button',
      description: '',
      link: '',
      externalId: '',
      missionId: null,
      assignedUserId: null,
      roleIds: [],
      urgency: 'white',
      dateS: null,
      dateF: null
    });
  });

  it('requires a non-blank name', () => {
    for (const body of [{}, { name: '' }, { name: '   ' }, { name: null }]) {
      const r = validateTasksPayload(body);
      expect(r.ok).toBe(false);
      if (r.ok === false) expect(r.status).toBe(400);
    }
  });

  it('rejects a non-object body', () => {
    for (const body of [null, 'x', 42, []]) {
      expect(validateTasksPayload(body).ok).toBe(false);
    }
  });

  it('coerces ids to trimmed strings', () => {
    const v = ok({ name: 'n', missionId: 456, assignedUserId: ' 45 ' });
    expect(v.missionId).toBe('456');
    expect(v.assignedUserId).toBe('45');
  });

  it('coerces role ids and drops blanks', () => {
    expect(ok({ name: 'n', roleIds: [3, ' 7 ', ''] }).roleIds).toEqual(['3', '7']);
  });

  it('treats empty-string ids as absent rather than as the id ""', () => {
    const v = ok({ name: 'n', missionId: '', assignedUserId: '  ' });
    expect(v.missionId).toBeNull();
    expect(v.assignedUserId).toBeNull();
  });

  it('refuses a person AND a role — createTask would silently drop the roles', () => {
    const r = validateTasksPayload({ name: 'n', assignedUserId: '45', roleIds: ['3'] });
    expect(r.ok).toBe(false);
    if (r.ok === false) {
      expect(r.status).toBe(400);
      expect(r.message).toMatch(/not both/i);
    }
  });

  it('allows a role alone and a person alone', () => {
    expect(ok({ name: 'n', roleIds: ['3'] }).roleIds).toEqual(['3']);
    expect(ok({ name: 'n', assignedUserId: '45' }).assignedUserId).toBe('45');
  });

  it('rejects roleIds that is not an array', () => {
    const r = validateTasksPayload({ name: 'n', roleIds: '3' });
    expect(r.ok).toBe(false);
  });

  it('accepts every valid urgency and rejects anything else', () => {
    for (const u of ['white', 'green', 'yellow', 'red']) {
      expect(ok({ name: 'n', urgency: u }).urgency).toBe(u);
    }
    const r = validateTasksPayload({ name: 'n', urgency: 'critical' });
    expect(r.ok).toBe(false);
    if (r.ok === false) expect(r.message).toMatch(/urgency/);
  });

  it('validates dates as ISO and keeps them verbatim', () => {
    const v = ok({ name: 'n', dateS: '2026-09-01T00:00:00Z', dateF: '2026-09-30T00:00:00Z' });
    expect(v.dateS).toBe('2026-09-01T00:00:00Z');
    expect(v.dateF).toBe('2026-09-30T00:00:00Z');

    for (const bad of [{ dateS: 'tomorrow' }, { dateF: '' }, { dateS: 12 }]) {
      expect(validateTasksPayload({ name: 'n', ...bad }).ok).toBe(false);
    }
  });
});

describe('buildCreateTaskParams', () => {
  const projectId = '12';

  it('maps a person-assigned task onto createTask params', () => {
    const params = buildCreateTaskParams({
      payload: ok({
        name: 'Fix it',
        description: 'from the widget',
        link: 'https://x/t/1',
        externalId: 'ticket_1',
        missionId: '456',
        assignedUserId: '45',
        urgency: 'red',
        dateF: '2026-09-01T00:00:00Z'
      }),
      projectId
    });

    expect(params).toEqual({
      projectId: '12',
      name: 'Fix it',
      description: 'from the widget',
      link: 'https://x/t/1',
      isAssigned: true,
      hashivut: 'red',
      source: TASK_SOURCE,
      myIshur: false,
      assignedUserId: '45',
      missionId: '456',
      externalId: 'ticket_1',
      dateF: '2026-09-01T00:00:00Z'
    });
  });

  it('never pre-approves on the assignee’s behalf', () => {
    const params = buildCreateTaskParams({
      payload: ok({ name: 'n', assignedUserId: '45' }),
      projectId
    });
    expect(params.myIshur).toBe(false);
  });

  it('routes a role-assigned task through isAssigned:false + tafkidims', () => {
    const params = buildCreateTaskParams({
      payload: ok({ name: 'n', roleIds: ['3', '7'] }),
      projectId
    });
    expect(params.isAssigned).toBe(false);
    expect(params.tafkidims).toEqual(['3', '7']);
    expect(params.assignedUserId).toBeUndefined();
  });

  it('drops missionId when there is no person to attach it for', () => {
    // createTask only reads missionId inside the isAssigned branch, so sending
    // it on a role task would be a field that quietly does nothing.
    const params = buildCreateTaskParams({
      payload: ok({ name: 'n', roleIds: ['3'], missionId: '456' }),
      projectId
    });
    expect(params.missionId).toBeUndefined();
  });

  it('leaves an unassigned task open to the whole rikma', () => {
    const params = buildCreateTaskParams({ payload: ok({ name: 'n' }), projectId });
    expect(params.isAssigned).toBe(false);
    expect(params.tafkidims).toBeUndefined();
    expect(params.assignedUserId).toBeUndefined();
  });

  it('omits optional fields entirely rather than sending empty strings', () => {
    const params = buildCreateTaskParams({ payload: ok({ name: 'n' }), projectId });
    expect(params.externalId).toBeUndefined();
    expect(params.dateS).toBeUndefined();
    expect(params.dateF).toBeUndefined();
  });
});

describe('toTaskStatusView', () => {
  const row = (attrs: any) => ({ id: '902', attributes: { externalId: 'ticket_1', ...attrs } });

  it('returns null for a missing row', () => {
    expect(toTaskStatusView(null)).toBeNull();
    expect(toTaskStatusView({})).toBeNull();
  });

  it('is "open" with nobody on it', () => {
    expect(toTaskStatusView(row({ my: { data: [] } }))?.status).toBe('open');
  });

  it('is "awaitingConsent" while the assignee has not accepted', () => {
    const v = toTaskStatusView(
      row({ myIshur: false, my: { data: [{ id: '45', attributes: { username: 'dana' } }] } })
    );
    expect(v?.status).toBe('awaitingConsent');
    expect(v?.assignee).toEqual({ id: '45', username: 'dana' });
  });

  it('is "accepted" once the assignee approved', () => {
    const v = toTaskStatusView(
      row({ myIshur: true, my: { data: [{ id: '45', attributes: { username: 'dana' } }] } })
    );
    expect(v?.status).toBe('accepted');
  });

  it('"done" outranks acceptance', () => {
    const v = toTaskStatusView(
      row({ myIshur: true, naasa: true, my: { data: [{ id: '45', attributes: {} }] } })
    );
    expect(v?.status).toBe('done');
    expect(v?.naasa).toBe(true);
  });

  it('normalises progress and a missing externalId', () => {
    const v = toTaskStatusView({ id: '9', attributes: { status: 40, externalId: '' } });
    expect(v?.progress).toBe(40);
    expect(v?.externalId).toBeNull();
    expect(toTaskStatusView({ id: '9', attributes: {} })?.progress).toBe(0);
  });
});
