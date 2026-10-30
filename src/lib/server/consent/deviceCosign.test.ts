import { describe, it, expect, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: { SPACE_SYNC_PROJECTS: '' } }));

import { requestDeviceCosign, cosignPushMessage } from './deviceCosign';
import { judgeCosignRequest } from '$lib/consent/cosign';

const NOW = Date.now();
const iso = (ms: number) => new Date(ms).toISOString();

const stopParams = {
  timerId: '900',
  projectId: '7',
  userId: '256',
  isActive: false,
  timers: [{ start: iso(NOW - 600_000), stop: iso(NOW) }]
};

function fakeFetch(devices: Array<{ id: string; jsoni?: string }>, lang = 'en') {
  const pushes: any[] = [];
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/api/send') {
      return new Response(
        JSON.stringify({
          data: {
            usersPermissionsUser: {
              data: {
                id: '256',
                attributes: {
                  lang,
                  machshirs: { data: devices.map((d) => ({ id: d.id, attributes: { jsoni: d.jsoni } })) }
                }
              }
            }
          }
        })
      );
    }
    if (url === '/api/pusher') {
      pushes.push(JSON.parse(String(init?.body)));
      return new Response('');
    }
    throw new Error('unexpected ' + url);
  });
  return { fn: fn as unknown as typeof fetch, pushes };
}

const base = { actionKey: 'timerStop', params: stopParams, result: null, userId: '256', via: 'telegram' as const };

describe('requestDeviceCosign', () => {
  it('pushes one signable request to every device of the member', async () => {
    const { fn, pushes } = fakeFetch([{ id: '1', jsoni: '{"endpoint":"a"}' }, { id: '2', jsoni: '{"endpoint":"b"}' }]);
    const res = await requestDeviceCosign({ ...base, fetch: fn, spaceProjects: ['7'] });
    expect(res).toEqual({ asked: 1, devices: 2 });
    expect(pushes.map((p) => p.machshirId)).toEqual(['1', '2']);
    expect(pushes[0].ttl).toBe(3600);
    const m = pushes[0].messege;
    expect(m.title).toBe('Your timer stopped');
    expect(m.body).toBe('From Telegram.');
    expect(m.bodySigned).toBe('From Telegram. This device signed it for you.');
    expect(m.actions).toEqual([{ action: 'notme', title: 'Not me', url: '/me/settings' }]);
    // What travels is exactly what the device will accept.
    expect(judgeCosignRequest(m.cosign, { deviceUserId: '256', now: NOW }).ok).toBe(true);
  });

  it('asks nothing for a rikma that is not on the Space', async () => {
    const { fn, pushes } = fakeFetch([{ id: '1', jsoni: '{}' }]);
    expect(await requestDeviceCosign({ ...base, fetch: fn, spaceProjects: ['8'] })).toEqual({ asked: 0, devices: 0 });
    expect(pushes).toEqual([]);
  });

  it('asks nothing for an action outside the clock', async () => {
    const { fn } = fakeFetch([{ id: '1', jsoni: '{}' }]);
    await requestDeviceCosign({ ...base, actionKey: 'createMission', fetch: fn, spaceProjects: ['7'] });
    expect(fn).not.toHaveBeenCalled();
  });

  it('skips devices with no push subscription and never throws', async () => {
    const { fn, pushes } = fakeFetch([{ id: '1' }]);
    expect(await requestDeviceCosign({ ...base, fetch: fn, spaceProjects: ['7'] })).toEqual({ asked: 1, devices: 0 });
    expect(pushes).toEqual([]);
    const broken = (async () => { throw new Error('down'); }) as unknown as typeof fetch;
    expect(await requestDeviceCosign({ ...base, fetch: broken, spaceProjects: ['7'] })).toEqual({ asked: 0, devices: 0 });
  });
});

describe('cosignPushMessage', () => {
  it('speaks the member\'s language and sends MCP "not me" to the key page', () => {
    const [req] = [{ v: 1, action: 'time.tick', actor: '256', projectId: '7', via: 'mcp', params: { timerId: '9', op: 'start', order: NOW } }] as any;
    const m = cosignPushMessage(req, 'he');
    expect(m.title).toBe('הטיימר הופעל');
    expect(m.actions[0]).toEqual({ action: 'notme', title: 'לא אני', url: '/me/settings/mcp' });
  });
});
