import { describe, it, expect } from 'vitest';
import { markPickable, planRepoSync, repoUrl, toRepoRow, type RepoRowInput } from './repos';

const row = (repoId: string, name = `r${repoId}`): RepoRowInput => ({
  repoId,
  owner: 'acme',
  name,
  defaultBranch: 'main',
  license: null,
  isPrivate: false
});

describe('toRepoRow', () => {
  it('reads the full repository object', () => {
    expect(
      toRepoRow({
        id: 42,
        name: 'widget',
        owner: { login: 'acme' },
        default_branch: 'main',
        private: true,
        license: { spdx_id: 'MIT' }
      })
    ).toEqual({
      repoId: '42',
      owner: 'acme',
      name: 'widget',
      defaultBranch: 'main',
      license: 'MIT',
      isPrivate: true
    });
  });

  it('reads the partial object in installation_repositories webhooks', () => {
    expect(toRepoRow({ id: 7, name: 'lib', full_name: 'org/lib', private: false })).toMatchObject({
      repoId: '7',
      owner: 'org',
      name: 'lib',
      defaultBranch: null
    });
  });

  it('drops NOASSERTION licenses and malformed repos', () => {
    expect(toRepoRow({ id: 1, name: 'x', owner: { login: 'o' }, license: { spdx_id: 'NOASSERTION' } })?.license).toBeNull();
    expect(toRepoRow({ name: 'x' })).toBeNull();
    expect(toRepoRow({ id: 3 })).toBeNull();
  });
});

describe('planRepoSync', () => {
  it('creates new rows and refreshes this rikma’s own', () => {
    const plan = planRepoSync('5', [row('1'), row('2')], [
      { id: '90', repoId: '2', projectId: '5', status: 'suspended' }
    ]);
    expect(plan.create.map((r) => r.repoId)).toEqual(['1']);
    expect(plan.update).toEqual([{ rowId: '90', row: row('2') }]);
    expect(plan.conflicts).toEqual([]);
  });

  it('never moves a repository still connected to another rikma', () => {
    const plan = planRepoSync('5', [row('1')], [{ id: '91', repoId: '1', projectId: '6', status: 'active' }]);
    expect(plan.conflicts.map((r) => r.repoId)).toEqual(['1']);
    expect(plan.create).toEqual([]);
    expect(plan.update).toEqual([]);
  });

  it('takes up a repository whose connection elsewhere was removed', () => {
    const plan = planRepoSync('5', [row('1')], [{ id: '92', repoId: '1', projectId: '6', status: 'removed' }]);
    expect(plan.update).toEqual([{ rowId: '92', row: row('1') }]);
  });

  it('ignores duplicates in one delivery', () => {
    expect(planRepoSync('5', [row('1'), row('1')], []).create).toHaveLength(1);
  });
});

describe('markPickable', () => {
  it('marks each repository and puts the connectable ones first', () => {
    const marked = markPickable('5', [row('1', 'zeta'), row('2', 'beta'), row('3', 'alpha'), row('4', 'gamma')], [
      { id: '90', repoId: '1', projectId: '5', status: 'active' },
      { id: '91', repoId: '2', projectId: '6', status: 'active' },
      { id: '92', repoId: '4', projectId: '6', status: 'removed' }
    ]);
    expect(marked.map((r) => [r.name, r.pick])).toEqual([
      ['alpha', 'available'],
      ['gamma', 'available'],
      ['zeta', 'here'],
      ['beta', 'elsewhere']
    ]);
  });

  it('offers again a repository this rikma disconnected', () => {
    const [r] = markPickable('5', [row('1')], [{ id: '90', repoId: '1', projectId: '5', status: 'removed' }]);
    expect(r.pick).toBe('available');
  });
});

describe('repoUrl', () => {
  it('builds the GitHub URL', () => {
    expect(repoUrl({ owner: 'acme', name: 'widget' })).toBe('https://github.com/acme/widget');
  });
});
