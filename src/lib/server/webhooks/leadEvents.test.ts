import { describe, it, expect, vi, beforeEach } from 'vitest';

const sent = vi.hoisted(() => [] as Array<{ url: string; body: any; event: string }>);
vi.mock('./dispatch.js', () => ({
  deliver: vi.fn(async (t: any, body: string, event: string) => {
    sent.push({ url: t.url, body: JSON.parse(body), event });
  })
}));
const targets = vi.hoisted(() => ({ list: [] as any[] }));
vi.mock('./targets.js', () => ({
  getWebhookTargets: vi.fn(async () => targets.list),
  wants: (t: any, e: string) => t.events.length === 0 || t.events.includes(e)
}));

import { onLeadChanged } from './leadEvents';
import { leadEventsFor, mayReceiveLead } from '$lib/server/leadsApi';

const strapi = {
  execute: vi.fn(async () => ({ data: { lead: { data: { id: '77', attributes: { externalId: 'lead_6f1c' } } } } }))
};
const context = { userId: '5', jwt: 'x', lang: 'he', fetch: vi.fn() as any };
const target = (scopes: string[], events: string[] = []) => ({ keyId: '3', name: null, url: 'https://vaad.example/hook', events, scopes });

beforeEach(() => {
  sent.length = 0;
  targets.list = [];
  strapi.execute.mockClear();
});

describe('lead events', () => {
  it('a retry or a repeat contact is no event; a quiet log entry is none either', () => {
    expect(leadEventsFor('createLead', { leadId: '77', duplicated: false })).toEqual(['lead.created']);
    expect(leadEventsFor('createLead', { leadId: '77', duplicated: true })).toEqual([]);
    expect(leadEventsFor('logLeadActivity', { statusChanged: false })).toEqual([]);
    expect(leadEventsFor('logLeadActivity', { statusChanged: true })).toEqual(['lead.statusChanged']);
    expect(leadEventsFor('updateLeadStatus', { status: 'paused' })).toEqual(['lead.statusChanged']);
  });

  it('only a key that deals in leads hears about them', () => {
    expect(mayReceiveLead(['leads:create'])).toBe(true);
    expect(mayReceiveLead(['tasks:create', 'orders:read'])).toBe(false);
  });

  it('sends ids and status — never the person', async () => {
    targets.list = [target(['leads:create']), target(['tasks:create'])];
    await onLeadChanged({
      actionKey: 'createLead',
      params: { projectId: '57', name: 'דנה', phone: '0500000000', email: 'd@x.io' },
      result: { leadId: '77', externalId: 'lead_6f1c', status: 'new', duplicated: false },
      context,
      strapi
    });
    expect(sent).toHaveLength(1);
    expect(sent[0].body).toMatchObject({
      event: 'lead.created',
      projectId: '57',
      data: { leadId: '77', externalId: 'lead_6f1c', status: 'new' }
    });
    const raw = JSON.stringify(sent[0].body);
    expect(raw).not.toContain('0500000000');
    expect(raw).not.toContain('d@x.io');
    expect(raw).not.toContain('דנה');
    expect(strapi.execute).not.toHaveBeenCalled();
  });

  it('reads the externalId back for a status change', async () => {
    targets.list = [target(['leads:read'], ['lead.statusChanged'])];
    await onLeadChanged({
      actionKey: 'updateLeadStatus',
      params: { projectId: '57', leadId: '77', status: 'paused' },
      result: { leadId: '77', status: 'paused', fromStatus: 'talking' },
      context,
      strapi
    });
    expect(sent[0].body.data).toEqual({ leadId: '77', externalId: 'lead_6f1c', status: 'paused' });
  });

  it('does not even look when nobody listens', async () => {
    targets.list = [target(['leads:create'], ['lead.won'])];
    await onLeadChanged({
      actionKey: 'updateLeadStatus',
      params: { projectId: '57' },
      result: { leadId: '77', status: 'paused' },
      context,
      strapi
    });
    expect(sent).toEqual([]);
    expect(strapi.execute).not.toHaveBeenCalled();
  });
});
