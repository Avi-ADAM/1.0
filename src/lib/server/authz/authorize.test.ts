/**
 * Unit tests for the static authorization layer.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: {} }));

import { env } from '$env/dynamic/private';
import {
  authorizeOperation,
  checkApiKeyProjectScope,
  applyAuthz,
  getAuthzMode
} from './authorize.js';
import { registerAction, actionRegistry } from '$lib/server/actions/registry.js';
import type { ActionConfig } from '$lib/server/actions/types.js';
import type { Principal } from './types.js';

const user: Principal = { kind: 'user', userId: '7' };
const serviceAdmin: Principal = { kind: 'serviceAdmin' };
const serviceConsensus: Principal = { kind: 'serviceConsensus' };
const anonymous: Principal = { kind: 'anonymous' };
const apiKey = (scopes?: Principal['scopes']): Principal => ({
  kind: 'apiKey',
  userId: '7',
  ...(scopes ? { scopes } : {})
});

function makeAction(key: string, extra: Partial<ActionConfig> = {}): ActionConfig {
  return {
    key,
    description: `test action ${key}`,
    graphqlOperation: '1testQuery',
    paramSchema: {},
    authRules: [{ type: 'jwt' }],
    ...extra
  } as ActionConfig;
}

beforeEach(() => {
  actionRegistry.clear();
  for (const k of Object.keys(env)) delete (env as any)[k];
});

afterEach(() => {
  actionRegistry.clear();
});

describe('authorizeOperation — send namespace', () => {
  it('allows a user on a user-allowed qid', () => {
    // '12mission' is classified ['user', 'serviceAdmin'] in the manifest
    expect(authorizeOperation(user, 'send:12mission').result).toBe('allowed');
  });

  it('denies a user on a service-only qid', () => {
    // '7getTelegramIds' is cron/bot only
    const d = authorizeOperation(user, 'send:7getTelegramIds');
    expect(d.result).toBe('denied');
    expect(d.reason).toContain('user');
  });

  it('allows serviceAdmin on a service-only qid', () => {
    expect(authorizeOperation(serviceAdmin, 'send:7getTelegramIds').result).toBe('allowed');
  });

  it('denies serviceAdmin on a consensus qid but allows serviceConsensus', () => {
    expect(authorizeOperation(serviceAdmin, 'send:39GetNegotiation').result).toBe('denied');
    expect(authorizeOperation(serviceConsensus, 'send:39GetNegotiation').result).toBe('allowed');
  });

  it('denies anonymous everywhere', () => {
    expect(authorizeOperation(anonymous, 'send:12mission').result).toBe('denied');
  });

  it('denies unknown qids', () => {
    expect(authorizeOperation(serviceAdmin, 'send:noSuchQid').result).toBe('denied');
  });

  it('denies malformed operations', () => {
    expect(authorizeOperation(user, 'sendnocolon').result).toBe('denied');
    expect(authorizeOperation(user, 'send:').result).toBe('denied');
    expect(authorizeOperation(user, 'weird:12mission').result).toBe('denied');
  });
});

describe('authorizeOperation — action namespace', () => {
  it('defaults to user+serviceAdmin when access is not declared', () => {
    registerAction(makeAction('plainAction'));
    expect(authorizeOperation(user, 'action:plainAction').result).toBe('allowed');
    expect(authorizeOperation(serviceAdmin, 'action:plainAction').result).toBe('allowed');
    expect(authorizeOperation(apiKey(), 'action:plainAction').result).toBe('denied');
  });

  it('honours an explicit access list', () => {
    registerAction(makeAction('apiAction', { access: ['user', 'serviceAdmin', 'apiKey'] }));
    expect(authorizeOperation(apiKey(), 'action:apiAction').result).toBe('allowed');
  });

  it('returns conditional when entity-level authRules exist', () => {
    registerAction(
      makeAction('memberAction', {
        authRules: [{ type: 'jwt' }, { type: 'projectMember' }] as any
      })
    );
    const d = authorizeOperation(user, 'action:memberAction');
    expect(d.result).toBe('conditional');
  });

  it('denies unknown actions', () => {
    expect(authorizeOperation(user, 'action:missingAction').result).toBe('denied');
  });

  it('enforces API-key op scopes on top of the manifest', () => {
    registerAction(makeAction('apiAction', { access: ['user', 'serviceAdmin', 'apiKey'] }));
    const scoped = apiKey({ ops: ['action:somethingElse'] });
    expect(authorizeOperation(scoped, 'action:apiAction').result).toBe('denied');
    const wildcard = apiKey({ ops: ['*'] });
    expect(authorizeOperation(wildcard, 'action:apiAction').result).toBe('allowed');
  });
});

describe('checkApiKeyProjectScope', () => {
  it('ignores non-apiKey principals', () => {
    expect(checkApiKeyProjectScope(user, {}).result).toBe('allowed');
  });

  it('allows unscoped keys', () => {
    expect(checkApiKeyProjectScope(apiKey(), { projectId: '5' }).result).toBe('allowed');
    expect(checkApiKeyProjectScope(apiKey({ projects: ['*'] }), {}).result).toBe('allowed');
  });

  it('requires a projectId param for project-scoped keys', () => {
    const d = checkApiKeyProjectScope(apiKey({ projects: ['5'] }), {});
    expect(d.result).toBe('denied');
  });

  it('matches projectId / pid / project params against the scope', () => {
    const key = apiKey({ projects: ['5', '9'] });
    expect(checkApiKeyProjectScope(key, { projectId: '5' }).result).toBe('allowed');
    expect(checkApiKeyProjectScope(key, { pid: 9 }).result).toBe('allowed');
    expect(checkApiKeyProjectScope(key, { project: '6' }).result).toBe('denied');
  });
});

describe('applyAuthz — modes', () => {
  it('defaults to enforce mode and blocks unauthorized users', () => {
    expect(getAuthzMode()).toBe('enforce');
    const { blocked, decision } = applyAuthz({ principal: user, op: 'send:7getTelegramIds' });
    expect(blocked).toBe(true);
    expect(decision.result).toBe('denied');
  });

  it('shadow-logs without blocking in log mode', () => {
    (env as any).AUTHZ_MODE = 'log';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { blocked } = applyAuthz({ principal: user, op: 'send:7getTelegramIds' });
    expect(blocked).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[authz-shadow]'));
    warn.mockRestore();
  });

  it('blocks in enforce mode', () => {
    (env as any).AUTHZ_MODE = 'enforce';
    const { blocked, decision } = applyAuthz({ principal: user, op: 'send:7getTelegramIds' });
    expect(blocked).toBe(true);
    expect(decision.result).toBe('denied');
  });

  it('never computes in off mode for non-apiKey principals', () => {
    (env as any).AUTHZ_MODE = 'off';
    const { blocked } = applyAuthz({ principal: user, op: 'send:7getTelegramIds' });
    expect(blocked).toBe(false);
  });

  it('always enforces for API keys, regardless of mode', () => {
    (env as any).AUTHZ_MODE = 'log';
    registerAction(makeAction('plainAction'));
    const { blocked } = applyAuthz({ principal: apiKey(), op: 'action:plainAction' });
    expect(blocked).toBe(true);
  });

  it('enforces API-key project scopes through params', () => {
    (env as any).AUTHZ_MODE = 'log';
    registerAction(makeAction('apiAction', { access: ['user', 'serviceAdmin', 'apiKey'] }));
    const key = apiKey({ projects: ['5'] });
    expect(applyAuthz({ principal: key, op: 'action:apiAction', params: { projectId: '5' } }).blocked).toBe(false);
    expect(applyAuthz({ principal: key, op: 'action:apiAction', params: { projectId: '6' } }).blocked).toBe(true);
  });
});
