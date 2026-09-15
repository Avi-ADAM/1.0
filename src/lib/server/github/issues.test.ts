import { describe, it, expect } from 'vitest';
import {
  chooseIssueAssignee,
  chooseIssueCreator,
  classifyIssueEvent,
  isLiveConnection,
  issueTaskParams,
  toConnectedRepo,
  toIssueEvent
} from './issues';

const base = (over: any = {}) => ({
  action: 'opened',
  installation: { id: 9 },
  repository: { id: 1001, name: 'web', full_name: 'acme/web', owner: { login: 'acme' } },
  issue: {
    number: 42,
    title: '  Login button does nothing ',
    body: 'Steps…',
    labels: [{ name: 'bug' }, { name: '1lev1' }],
    user: { id: 77 },
    assignees: [{ id: 88 }, { id: 99 }]
  },
  ...over
});

describe('toIssueEvent', () => {
  it('reads the fields the rikma needs', () => {
    expect(toIssueEvent(base())).toEqual({
      installationId: '9',
      repoId: '1001',
      owner: 'acme',
      name: 'web',
      number: 42,
      title: 'Login button does nothing',
      body: 'Steps…',
      url: 'https://github.com/acme/web/issues/42',
      labels: ['bug', '1lev1'],
      authorGithubId: '77',
      assigneeGithubIds: ['88', '99']
    });
  });

  it('refuses a pull request and a payload without an installation', () => {
    expect(toIssueEvent(base({ issue: { ...base().issue, pull_request: {} } }))).toBeNull();
    expect(toIssueEvent(base({ installation: undefined }))).toBeNull();
  });
});

describe('classifyIssueEvent', () => {
  it('opens a task only for the opt-in label', () => {
    expect(classifyIssueEvent(base()).type).toBe('issueTask');
    const unlabelled = base({ issue: { ...base().issue, labels: [{ name: 'bug' }] } });
    expect(classifyIssueEvent(unlabelled).type).toBe('ignored');
    expect(classifyIssueEvent({ ...unlabelled, action: 'reopened' }).type).toBe('ignored');
  });

  it('reacts to labelling only when the added label is ours', () => {
    expect(classifyIssueEvent(base({ action: 'labeled', label: { name: '1LEV1' } })).type).toBe('issueTask');
    expect(classifyIssueEvent(base({ action: 'labeled', label: { name: 'bug' } })).type).toBe('ignored');
  });

  it('reports every close — the task may exist from an earlier label', () => {
    const closed = base({ action: 'closed', issue: { ...base().issue, labels: [] } });
    expect(classifyIssueEvent(closed).type).toBe('issueClosed');
  });

  it('ignores edits and unknown actions', () => {
    expect(classifyIssueEvent(base({ action: 'edited' })).type).toBe('ignored');
  });
});

describe('creator and assignee', () => {
  const members = new Set(['1', '2']);

  it('prefers the linked author, then whoever connected the repository', () => {
    expect(chooseIssueCreator({ authorUserId: '2', connectedById: '1', memberIds: members })).toBe('2');
    expect(chooseIssueCreator({ authorUserId: '5', connectedById: '1', memberIds: members })).toBe('1');
    expect(chooseIssueCreator({ authorUserId: null, connectedById: '5', memberIds: members })).toBeNull();
  });

  it('assigns the first assignee who is a member', () => {
    expect(chooseIssueAssignee([null, '5', '2', '1'], members)).toBe('2');
    expect(chooseIssueAssignee(['5'], members)).toBeNull();
  });
});

describe('toConnectedRepo / isLiveConnection', () => {
  const res = (attributes: any) => ({ data: { projectRepos: { data: [{ id: 1, attributes }] } } });
  const attrs = {
    owner: 'acme',
    name: 'web',
    installationId: '9',
    status: 'active',
    project: { data: { id: 3 } },
    connectedBy: { data: { id: 2 } }
  };

  it('reads the row', () => {
    expect(toConnectedRepo(res(attrs))).toEqual({
      projectId: '3',
      owner: 'acme',
      name: 'web',
      installationId: '9',
      status: 'active',
      connectedById: '2'
    });
    expect(toConnectedRepo(res({ ...attrs, project: { data: null } }))).toBeNull();
    expect(toConnectedRepo({ data: { projectRepos: { data: [] } } })).toBeNull();
  });

  it('acts only on an active row reached through its own installation', () => {
    const row = toConnectedRepo(res(attrs));
    expect(isLiveConnection(row, '9')).toBe(true);
    expect(isLiveConnection(row)).toBe(true);
    expect(isLiveConnection(row, '10')).toBe(false);
    expect(isLiveConnection(toConnectedRepo(res({ ...attrs, status: 'removed' })), '9')).toBe(false);
    expect(isLiveConnection(toConnectedRepo(res({ ...attrs, status: null })), '9')).toBe(true);
  });
});

describe('issueTaskParams', () => {
  it('writes an idempotent, unconsented task that links back to the issue', () => {
    const issue = toIssueEvent(base())!;
    expect(issueTaskParams(issue, { projectId: '3', assignedUserId: '2' })).toEqual({
      projectId: '3',
      name: 'Login button does nothing',
      description: 'Steps…',
      link: 'https://github.com/acme/web/issues/42',
      externalId: 'gh:1001#42',
      source: 'api',
      hashivut: 'white',
      isAssigned: true,
      myIshur: false,
      assignedUserId: '2'
    });
    expect(issueTaskParams({ ...issue, title: '' }, { projectId: '3', assignedUserId: null })).toMatchObject({
      name: 'web#42',
      isAssigned: false
    });
  });
});
