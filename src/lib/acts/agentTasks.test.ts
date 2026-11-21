import { describe, expect, it } from 'vitest';
import {
  actClockMeaning,
  formatReturn,
  parseReturn,
  returnProblem,
  claimPlan,
  formatReport,
  nextStepFor,
  parseReport,
  plainText,
  relationsOf,
  reportProblem,
  safeLink,
  taskOf,
  actForumSubject,
  REPORT_LIMITS,
  type ViewerMission
} from './agentTasks';

const user = (id: string, username = `u${id}`) => ({ id, attributes: { username } });

function act(attrs: Record<string, any> = {}, id = '141') {
  return {
    id,
    attributes: {
      shem: 'Bug: no sound in lesson 3',
      des: '<p>What happened: no sound.</p><p>Expected: sound.</p>',
      hashivut: 'yellow',
      status: 0,
      project: { data: { id: '103', attributes: { projectName: 'Calm Coding' } } },
      vali: { data: user('271', 'Maya') },
      my: { data: [] },
      tafkidims: { data: [] },
      mesimabetahaliches: { data: [] },
      ...attrs
    }
  };
}

const mission = (id: string, roleIds: string[] = []): ViewerMission => ({ id, name: `m${id}`, roleIds });

describe('taskOf', () => {
  it('flattens an act and reads its lane from getActStatus', () => {
    const t = taskOf(act({ my: { data: [user('270', 'Dan')] }, isAssigned: true, myIshur: false }))!;
    expect(t.id).toBe('141');
    expect(t.project).toEqual({ id: '103', name: 'Calm Coding' });
    expect(t.assignees.map((p) => p.id)).toEqual(['270']);
    expect(t.validator?.id).toBe('271');
    expect(t.status).toBe('pendingApproval');
    expect(t.description).toBe('What happened: no sound.\nExpected: sound.');
  });

  it('is null for anything that is not an act node', () => {
    expect(taskOf(null)).toBeNull();
    expect(taskOf({ attributes: {} })).toBeNull();
  });
});

describe('plainText', () => {
  it('drops tags and decodes the common entities', () => {
    expect(plainText('<p style="x">a &amp; b</p><br>c')).toBe('a & b\n\nc');
    expect(plainText(42)).toBe('');
  });
});

describe('nextStepFor / relationsOf', () => {
  it('an act handed to me and not yet accepted waits for my yes', () => {
    const t = taskOf(act({ my: { data: [user('270')] }, isAssigned: true }))!;
    expect(nextStepFor(t, '270')).toBe('approve');
    expect(nextStepFor(t, '271')).toBe('none');
    expect(relationsOf(t, '271')).toEqual(['validator']);
  });

  it('an accepted act is work for the assignee', () => {
    const t = taskOf(act({ my: { data: [user('270')] }, isAssigned: true, myIshur: true }))!;
    expect(nextStepFor(t, 270 as any)).toBe('do');
  });

  it('a done act waits on its validator only', () => {
    const t = taskOf(act({ my: { data: [user('270')] }, myIshur: true, naasa: true }))!;
    expect(nextStepFor(t, '271')).toBe('validate');
    expect(nextStepFor(t, '270')).toBe('none');
  });

  it('an act open to a role is claimable by its holders only', () => {
    const t = taskOf(act({ isAssigned: false, tafkidims: { data: [{ id: '9' }] } }))!;
    expect(nextStepFor(t, '270', ['9'])).toBe('claim');
    expect(nextStepFor(t, '270', ['8'])).toBe('none');
    expect(relationsOf(t, '270', ['9'])).toEqual(['roleHolder']);
  });

  it('an act open to nobody in particular is claimable by any member', () => {
    expect(nextStepFor(taskOf(act())!, '270')).toBe('claim');
  });
});

describe('claimPlan', () => {
  it('approves an act handed to me, linking it to my only mission', () => {
    const t = taskOf(act({ my: { data: [user('270')] }, isAssigned: true }))!;
    expect(claimPlan(t, '270', [mission('222')])).toEqual({ kind: 'approve', missionId: '222' });
  });

  it('does not relink an act already on one of my missions', () => {
    const t = taskOf(
      act({
        my: { data: [user('270')] },
        isAssigned: true,
        mesimabetahaliches: { data: [{ id: '222', attributes: { name: 'Edit' } }] }
      })
    )!;
    expect(claimPlan(t, '270', [mission('222'), mission('223')])).toEqual({ kind: 'approve', missionId: null });
  });

  it('says "already" for an act I accepted before', () => {
    const t = taskOf(act({ my: { data: [user('270')] }, isAssigned: true, myIshur: true }))!;
    expect(claimPlan(t, '270', [])).toEqual({ kind: 'already' });
  });

  it('refuses an act someone else has', () => {
    const t = taskOf(act({ my: { data: [user('99')] }, isAssigned: true }))!;
    expect(claimPlan(t, '270', [mission('222')])).toMatchObject({ kind: 'refuse', code: 'TAKEN' });
  });

  it('refuses a finished act', () => {
    const t = taskOf(act({ my: { data: [user('270')] }, naasa: true }))!;
    expect(claimPlan(t, '270', [])).toMatchObject({ kind: 'refuse', code: 'DONE' });
  });

  it('takes a role act onto my mission in that role, and refuses without one', () => {
    const t = taskOf(act({ isAssigned: false, tafkidims: { data: [{ id: '9' }] } }))!;
    expect(claimPlan(t, '270', [mission('1', ['8']), mission('2', ['9'])])).toEqual({ kind: 'take', missionId: '2' });
    expect(claimPlan(t, '270', [mission('1', ['8'])])).toMatchObject({ kind: 'refuse', code: 'NOT_IN_ROLE' });
    expect(claimPlan(t, '270', [mission('1', ['8']), mission('2', ['9'])], '1')).toMatchObject({
      kind: 'refuse',
      code: 'NOT_IN_ROLE'
    });
  });

  it('refuses a requested mission that is not mine', () => {
    expect(claimPlan(taskOf(act())!, '270', [mission('222')], '999')).toMatchObject({
      kind: 'refuse',
      code: 'NOT_YOUR_MISSION'
    });
  });

  it('takes an open act unlinked when I have several missions and named none', () => {
    expect(claimPlan(taskOf(act())!, '270', [mission('1'), mission('2')])).toEqual({ kind: 'take', missionId: null });
    expect(claimPlan(taskOf(act())!, '270', [mission('1'), mission('2')], '2')).toEqual({ kind: 'take', missionId: '2' });
  });
});

describe('reportProblem', () => {
  it('lets only the assignee report, and not on a validated act', () => {
    const mine = taskOf(act({ my: { data: [user('270')] }, myIshur: true }))!;
    expect(reportProblem(mine, '270')).toBeNull();
    expect(reportProblem(mine, '271')).toMatch(/assigned/);
    expect(reportProblem(taskOf(act())!, '270')).toMatch(/take it first/);
    const closed = taskOf(act({ my: { data: [user('270')] }, naasa: true, valiIshur: true }))!;
    expect(reportProblem(closed, '270')).toMatch(/closed/);
  });
});

describe('formatReport / parseReport', () => {
  it('round-trips a done report', () => {
    const text = formatReport({
      phase: 'done',
      summary: 'Re-encoded lesson 3 with AAC audio.\nSafari plays it now.',
      links: ['https://github.com/x/y/pull/7', 'javascript:alert(1)'],
      verifySteps: ['Open lesson 3 on an iPhone', 'Check the sound'],
      remaining: ['Lessons 4-5 use the same encoder']
    });
    expect(text.split('\n')[0]).toBe('[1lev1:report phase=done]');
    expect(text).not.toContain('javascript:');
    expect(parseReport(text)).toEqual({
      phase: 'done',
      summary: 'Re-encoded lesson 3 with AAC audio.\nSafari plays it now.',
      links: ['https://github.com/x/y/pull/7'],
      verifySteps: ['Open lesson 3 on an iPhone', 'Check the sound'],
      remaining: ['Lessons 4-5 use the same encoder']
    });
  });

  it('is null for an ordinary message', () => {
    expect(parseReport('thanks!')).toBeNull();
    expect(parseReport(undefined)).toBeNull();
  });

  it('stays inside the chat limit', () => {
    const text = formatReport({
      phase: 'progress',
      summary: 'x'.repeat(10_000),
      verifySteps: Array.from({ length: 40 }, () => 'y'.repeat(1000))
    });
    expect(text.length).toBeLessThanOrEqual(REPORT_LIMITS.total);
  });

  it('keeps only http(s) links', () => {
    expect(safeLink(' https://a.b/c ')).toBe('https://a.b/c');
    expect(safeLink('data:text/html,x')).toBeNull();
  });
});

describe('returnProblem / formatReturn', () => {
  it('lets only the validator send back a task that waits for them', () => {
    const waiting = taskOf(act({ my: { data: [user('270')] }, myIshur: true, naasa: true }))!;
    expect(returnProblem(waiting, '271')).toBeNull();
    expect(returnProblem(waiting, '270')).toMatch(/Only the validator/);
    const underWay = taskOf(act({ my: { data: [user('270')] }, myIshur: true }))!;
    expect(returnProblem(underWay, '271')).toMatch(/not waiting/);
    const closed = taskOf(act({ my: { data: [user('270')] }, naasa: true, valiIshur: true }))!;
    expect(returnProblem(closed, '271')).toMatch(/closed/);
  });

  it('round-trips the note', () => {
    const text = formatReturn('  Still silent on Android  ');
    expect(text).toBe('[1lev1:return]\nStill silent on Android');
    expect(parseReturn(text)).toEqual({ note: 'Still silent on Android' });
    expect(parseReturn('[1lev1:report phase=done]')).toBeNull();
  });
});

describe('actClockMeaning', () => {
  const base = { exists: true, automatic: false, naasa: true, valiIshur: false, hasValidator: true };
  it('matures a done report nobody answered', () => {
    expect(actClockMeaning(base)).toBe('mature');
  });
  it('leaves an automatic act to its reminder', () => {
    expect(actClockMeaning({ ...base, automatic: true })).toBe('reminder');
  });
  it('is stale once sent back, validated, gone, or without a validator', () => {
    expect(actClockMeaning({ ...base, naasa: false })).toBe('stale');
    expect(actClockMeaning({ ...base, valiIshur: true })).toBe('stale');
    expect(actClockMeaning({ ...base, exists: false })).toBe('stale');
    expect(actClockMeaning({ ...base, hasValidator: false })).toBe('stale');
  });
});

describe('actForumSubject', () => {
  it('names the act and cannot be split by a crafted name', () => {
    expect(actForumSubject(141, 'a::b')).toBe('ACT::141::a:b');
  });
});
