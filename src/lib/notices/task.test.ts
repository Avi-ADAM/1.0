import { describe, expect, it } from 'vitest';
import { taskNotices } from './task';
import { taskOf } from '$lib/acts/agentTasks';
import { actThreadRecipients } from '$lib/server/actions/forumAccess';

const act = (attrs: Record<string, any>, id = '141') =>
  taskOf({
    id,
    attributes: {
      shem: 'Bug',
      project: { data: { id: '103', attributes: { projectName: 'Calm' } } },
      vali: { data: { id: '271' } },
      my: { data: [{ id: '270' }] },
      isAssigned: true,
      updatedAt: '2026-11-21T10:00:00Z',
      ...attrs
    }
  })!;

describe('taskNotices', () => {
  it('asks the assignee for their yes, with no clock', () => {
    const [n, ...rest] = taskNotices([act({})], '270');
    expect(rest).toEqual([]);
    expect(n).toMatchObject({
      key: 'task:approve:141',
      sentence: { key: 'notices.task.approve', params: { item: 'Bug' } },
      where: { kind: 'rikma', id: '103', name: 'Calm' },
      clockRuns: false,
      expand: { kind: 'href', href: '/moach/103/acts/141' }
    });
    expect(taskNotices([act({})], '271')).toEqual([]);
  });

  it('asks the validator to check, with the silence clock and a key per clock', () => {
    const due = '2026-11-23T10:00:00.000Z';
    const done = act({ myIshur: true, naasa: true, timegrama: { data: { id: '9', attributes: { date: due, done: false } } } });
    const [n] = taskNotices([done], '271', Date.parse('2026-11-21T10:00:00Z'));
    expect(n).toMatchObject({ key: `task:validate:141:${due}`, deadline: due, clockRuns: true, urgent: false });
    expect(taskNotices([done], '270')).toEqual([]);
  });

  it('says nothing about work under way or finished', () => {
    expect(taskNotices([act({ myIshur: true })], '270')).toEqual([]);
    expect(taskNotices([act({ myIshur: true, naasa: true, valiIshur: true })], '271')).toEqual([]);
  });
});

describe('actThreadRecipients', () => {
  const forum = (acts: any[]) => ({ id: '5', attributes: { project: { data: { id: '103' } }, acts: { data: acts } } });

  it('is the task’s doers and validator', () => {
    const entity = forum([{ id: '141', attributes: { my: { data: [{ id: '270' }] }, vali: { data: { id: '271' } } } }]);
    expect(actThreadRecipients(entity)).toEqual(['270', '271']);
  });

  it('is null for a forum that is not a task’s thread', () => {
    expect(actThreadRecipients(forum([]))).toBeNull();
    expect(
      actThreadRecipients({ id: '6', attributes: { mesimabetahaliches: { data: [{ id: '1' }] }, acts: { data: [{ id: '2' }] } } })
    ).toBeNull();
  });
});
