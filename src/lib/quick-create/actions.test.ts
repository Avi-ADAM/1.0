import { describe, expect, it } from 'vitest';
import {
  buildQuickCreateHref,
  resolveQuickCreateProjectId,
  type QuickCreateProject
} from './actions';

const projects: QuickCreateProject[] = [
  { id: '12', projectName: 'Rikma one', profilePic: null },
  { id: '34', projectName: 'Rikma two', profilePic: null }
];

describe('buildQuickCreateHref', () => {
  it('routes each supported kind to its existing form', () => {
    expect(buildQuickCreateHref('task', '12')).toBe(
      '/moach/12/acts?action=createtask'
    );
    expect(buildQuickCreateHref('mission', '12')).toBe(
      '/moach/12/create?action=createmission'
    );
    expect(buildQuickCreateHref('resource', '12')).toBe(
      '/moach/12/create?action=createresource'
    );
  });

  it('encodes the project identifier as one route segment', () => {
    expect(buildQuickCreateHref('task', 'team/one')).toBe(
      '/moach/team%2Fone/acts?action=createtask'
    );
  });
});

describe('resolveQuickCreateProjectId', () => {
  it('uses the current rikma before a remembered rikma', () => {
    expect(resolveQuickCreateProjectId(projects, '34', '12')).toBe('34');
  });

  it('uses the remembered rikma only while it is still a membership', () => {
    expect(resolveQuickCreateProjectId(projects, null, '12')).toBe('12');
    expect(resolveQuickCreateProjectId(projects, null, 'missing')).toBeNull();
  });

  it('auto-selects a sole rikma but never guesses among several', () => {
    expect(resolveQuickCreateProjectId([projects[0]])).toBe('12');
    expect(resolveQuickCreateProjectId(projects)).toBeNull();
    expect(resolveQuickCreateProjectId([])).toBeNull();
  });
});
