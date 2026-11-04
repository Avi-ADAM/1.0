/**
 * The lead actions against an in-memory Strapi (docs/inprogress/PLAN_LEADS.md L1).
 *
 * The pure rules are in src/lib/leads/leads.test.ts; this file is about the
 * writes: a lead and its task, a retry that changes nothing, the same person
 * writing again, the append-only log, a lead from another rikma, and the task
 * pulling the lead along.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const nested = vi.hoisted(() => ({
  executeAction: vi.fn(async (..._a: any[]): Promise<any> => ({ success: true, data: { id: '900' } }))
}));
vi.mock('../index.js', () => ({ actionService: nested }));

import { createLeadConfig } from './createLead.js';
import { logLeadActivityConfig } from './logLeadActivity.js';
import { updateLeadStatusConfig } from './updateLeadStatus.js';
import { updateLeadPlanConfig } from './updateLeadPlan.js';
import { mergeLeadsConfig } from './mergeLeads.js';
import { exportLeadContactsConfig } from './exportLeadContacts.js';
import { syncLeadFromTask } from '$lib/server/leads/taskSync';

type Row = Record<string, any>;

function makeDb() {
  return {
    leads: new Map<string, Row>(),
    activities: [] as Row[],
    acts: new Map<string, Row>(),
    settings: null as any,
    members: ['5', '6'],
    orderStatus: {} as Record<string, string>,
    nextId: 70
  };
}
let db: ReturnType<typeof makeDb>;

const rel = (id: any) => ({ data: id != null ? { id: String(id) } : null });
function leadNode(id: string) {
  const l = db.leads.get(id)!;
  return {
    id,
    attributes: { ...l, project: rel(l.project), owner: rel(l.owner), act: rel(l.act) }
  };
}

const strapi = {
  execute: vi.fn(async (qid: string, vars: any, jwt: any) => {
    // Lead qids are serviceAdmin-only: they must run under the admin token.
    if (qid.startsWith('lead') && jwt !== undefined) throw new Error(`${qid} ran with a user token`);
    switch (qid) {
      case 'leadProjectSettings':
        return {
          data: {
            project: {
              data: { id: vars.pid, attributes: { leadSettings: db.settings, user_1s: { data: db.members.map((id) => ({ id })) } } }
            }
          }
        };
      case 'rikmaApiProduct':
        return { data: { matanots: { data: vars.productId === '123' ? [{ id: '123' }] : [] } } };
      case 'leadByExternalId': {
        const hit = [...db.leads.keys()].find(
          (id) => db.leads.get(id)!.project === vars.pid && db.leads.get(id)!.externalId === vars.externalId
        );
        return { data: { leads: { data: hit ? [leadNode(hit)] : [] } } };
      }
      case 'leadsByContact': {
        const pid = vars.filters.project.id.eq;
        const parts: string[] = vars.filters.or.map((o: any) => o.dedupeKey.contains);
        const hits = [...db.leads.keys()]
          .filter((id) => {
            const l = db.leads.get(id)!;
            return l.project === pid && parts.some((p) => (l.dedupeKey ?? '').includes(p));
          })
          .reverse();
        return { data: { leads: { data: hits.map(leadNode) } } };
      }
      case 'leadCreate': {
        const id = String(db.nextId++);
        db.leads.set(id, { ...vars.data, createdAt: new Date().toISOString() });
        return { data: { createLead: { data: { id, attributes: { status: vars.data.status } } } } };
      }
      case 'leadUpdate': {
        Object.assign(db.leads.get(vars.id)!, vars.data);
        return { data: { updateLead: { data: { id: vars.id } } } };
      }
      case 'leadById':
        return { data: { lead: { data: db.leads.has(vars.id) ? leadNode(vars.id) : null } } };
      case 'leadActivityCreate':
        db.activities.push(vars.data);
        return { data: { createLeadActivity: { data: { id: String(db.activities.length) } } } };
      case 'tasksApiActStatus': {
        const a = db.acts.get(vars.id);
        return {
          data: {
            act: {
              data: a
                ? { id: vars.id, attributes: { ...a, my: { data: a.my ? [{ id: a.my }] : [] } } }
                : null
            }
          }
        };
      }
      case 'leadMergeSide': {
        const l = db.leads.get(vars.id);
        if (!l) return { data: { lead: { data: null } } };
        const ids = (v: any) => ({ data: (v ?? []).map((id: any) => ({ id: String(id), attributes: { status: db.orderStatus[String(id)] ?? 'sent' } })) });
        return {
          data: {
            lead: {
              data: {
                id: vars.id,
                attributes: { ...l, project: rel(l.project), act: rel(l.act), orders: ids(l.orders), products: ids(l.products) }
              }
            }
          }
        };
      }
      case 'leadContactsForExport': {
        const hits = [...db.leads.keys()].filter((id) => {
          const l = db.leads.get(id)!;
          return l.project === vars.pid && l.status !== 'spam' && !l.anonymizedAt;
        });
        return { data: { leads: { data: hits.map((id) => ({ id, attributes: { phone: db.leads.get(id)!.phone ?? null, email: db.leads.get(id)!.email ?? null } })) } } };
      }
      default:
        throw new Error(`unexpected qid ${qid}`);
    }
  })
};

const context = { userId: '5', jwt: 'user-jwt', lang: 'he', fetch: globalThis.fetch };
const consent = { text: 'אני מסכים/ה שהפרטים יועברו לרקמה', at: '2026-11-03T10:00:00Z' };
const createLead = (p: Record<string, any>) =>
  (createLeadConfig.graphqlOperation as any)({ projectId: '57', ...p }, context, { strapi });
const call = (config: any, p: Record<string, any>, userId = '5') =>
  config.graphqlOperation({ projectId: '57', ...p }, { ...context, userId }, { strapi });

beforeEach(() => {
  db = makeDb();
  strapi.execute.mockClear();
  nested.executeAction.mockClear();
});

describe('createLead', () => {
  it('writes the lead, an inbound entry and its task, and tells the members', async () => {
    const r = await createLead({ name: 'דנה', phone: '050-0000000', organization: 'הרצל 12', consent, productId: '123' });
    expect(r).toMatchObject({ leadId: '70', status: 'new', taskId: '900', duplicated: false, warnings: [] });
    expect(r.notifyUserIds).toEqual(['5', '6']);

    const lead = db.leads.get('70')!;
    expect(lead).toMatchObject({ project: '57', status: 'new', source: 'api', act: '900', products: ['123'] });
    expect(lead.dedupeKey).toMatch(/^p:[0-9a-f]{16}$/);
    expect(lead.dedupeKey).not.toContain('0500000000');
    expect(db.activities).toEqual([expect.objectContaining({ lead: '70', kind: 'inbound', direction: 'in' })]);

    const [key, params, ctx] = nested.executeAction.mock.calls[0];
    expect(key).toBe('createTask');
    expect(params).toMatchObject({ projectId: '57', externalId: 'lead:70', source: 'api', isAssigned: false, name: 'ליד: דנה — הרצל 12' });
    // The task never carries contact details — it shows in heart cards and notifications.
    expect(JSON.stringify(params)).not.toContain('050');
    expect(ctx).toBe(context);
  });

  it('hands the task to the lead roles, and then leaves the notice to the task', async () => {
    db.settings = { leadRoleIds: ['3'], leadResponseHours: 2 };
    const r = await createLead({ name: 'דנה', email: 'd@x.io', consent });
    const params = nested.executeAction.mock.calls[0][1];
    expect(params).toMatchObject({ isAssigned: false, tafkidims: ['3'] });
    expect(Date.parse(params.dateF) - Date.parse(params.dateS)).toBe(2 * 3600_000);
    expect(r.notifyUserIds).toEqual([]);
  });

  it('refuses a lead without consent from a site, and a product of another rikma', async () => {
    await expect(createLead({ name: 'דנה', phone: '0500000000' })).rejects.toMatchObject({ code: 'CONSENT_REQUIRED' });
    await expect(createLead({ name: 'דנה', phone: '0500000000', consent, productId: '999' })).rejects.toMatchObject({
      code: 'NOT_FOUND'
    });
    expect(db.leads.size).toBe(0);
  });

  it('a member recording a phone call needs no consent text', async () => {
    const r = await createLead({ name: 'דנה', phone: '0500000000', source: 'manual' });
    expect(r.duplicated).toBe(false);
    expect(db.activities[0]).toMatchObject({ kind: 'inbound', actor: '5' });
  });

  it('a retry with the same externalId returns the same lead and writes nothing', async () => {
    const first = await createLead({ name: 'דנה', phone: '0500000000', consent, externalId: 'x-1' });
    const writes = db.activities.length;
    const again = await createLead({ name: 'דנה', phone: '0500000000', consent, externalId: 'x-1' });
    expect(again).toMatchObject({ leadId: first.leadId, duplicated: true, reason: 'externalId' });
    expect(db.leads.size).toBe(1);
    expect(db.activities.length).toBe(writes);
    expect(nested.executeAction).toHaveBeenCalledTimes(1);
  });

  it('the same person writing again is an inbound entry on the open lead, told to its owner', async () => {
    await createLead({ name: 'דנה', phone: '050-0000000', consent });
    db.leads.get('70')!.owner = '6';
    const again = await createLead({ name: 'דנה כהן', phone: '+972 50 000 0000', email: 'new@x.io', consent, message: 'עדיין רלוונטי' });
    expect(again).toMatchObject({ leadId: '70', duplicated: true, reason: 'sameContact', notifyUserIds: ['6'] });
    expect(db.leads.size).toBe(1);
    expect(db.activities.at(-1)).toMatchObject({ lead: '70', kind: 'inbound', body: 'עדיין רלוונטי' });
  });

  it('a paused lead that writes again comes back as due', async () => {
    await createLead({ name: 'דנה', phone: '0500000000', consent });
    db.leads.get('70')!.status = 'paused';
    await createLead({ name: 'דנה', phone: '0500000000', consent });
    expect(db.leads.get('70')!.followUpAt).toBeTruthy();
  });

  it('a customer writing again is a new lead pointing back at the old one', async () => {
    await createLead({ name: 'דנה', phone: '0500000000', consent });
    db.leads.get('70')!.status = 'won';
    const r = await createLead({ name: 'דנה', phone: '0500000000', consent });
    expect(r).toMatchObject({ leadId: '71', duplicated: false });
    expect(db.leads.get('71')!.previousLead).toBe('70');
  });

  it('keeps the lead when its task cannot be opened', async () => {
    nested.executeAction.mockResolvedValueOnce({ success: false, error: { message: 'boom' } });
    const r = await createLead({ name: 'דנה', phone: '0500000000', consent });
    expect(r).toMatchObject({ leadId: '70', taskId: null, warnings: ['TASK_NOT_CREATED'] });
    expect(r.notifyUserIds).toEqual(['5', '6']);
    expect(db.leads.has('70')).toBe(true);
  });
});

describe('logLeadActivity / updateLeadStatus / updateLeadPlan', () => {
  beforeEach(async () => {
    await createLead({ name: 'דנה', phone: '0500000000', consent });
    db.activities = [];
  });

  it('the first outgoing call marks the lead contacted, logged by the member', async () => {
    const r = await call(logLeadActivityConfig, { leadId: '70', kind: 'call', direction: 'out', body: 'דיברנו' });
    expect(r.status).toBe('contacted');
    expect(db.leads.get('70')!.status).toBe('contacted');
    expect(db.activities).toEqual([
      expect.objectContaining({ kind: 'call', direction: 'out', body: 'דיברנו', actor: '5' }),
      expect.objectContaining({ kind: 'statusChange', fromStatus: 'new', toStatus: 'contacted', actor: '5' })
    ]);
  });

  it('refuses a lead of another rikma, a system kind, and a date too far back', async () => {
    await expect(call(logLeadActivityConfig, { projectId: '58', leadId: '70', kind: 'note', body: 'x' })).rejects.toMatchObject({
      code: 'NOT_FOUND'
    });
    await expect(call(logLeadActivityConfig, { leadId: '70', kind: 'statusChange' })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED'
    });
    const old = new Date(Date.now() - 31 * 86_400_000).toISOString();
    await expect(call(logLeadActivityConfig, { leadId: '70', kind: 'call', at: old })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED'
    });
    expect(db.activities).toEqual([]);
  });

  it('"not now" takes a reason and a date, and is logged', async () => {
    await expect(call(updateLeadStatusConfig, { leadId: '70', status: 'paused' })).rejects.toMatchObject({
      code: 'PAUSED_REASON_REQUIRED'
    });
    await call(updateLeadStatusConfig, {
      leadId: '70',
      status: 'paused',
      pausedReason: 'timing',
      pausedNote: 'אחרי החגים',
      followUpAt: '2026-12-01T09:00:00Z'
    });
    expect(db.leads.get('70')).toMatchObject({ status: 'paused', pausedReason: 'timing', followUpAt: '2026-12-01T09:00:00.000Z' });
    expect(db.activities.at(-1)).toMatchObject({ kind: 'statusChange', fromStatus: 'new', toStatus: 'paused', actor: '5' });
  });

  it('no form makes a lead won, or moves one off won', async () => {
    await expect(call(updateLeadStatusConfig, { leadId: '70', status: 'won' })).rejects.toMatchObject({ code: 'NOT_MANUAL' });
    db.leads.get('70')!.status = 'won';
    await expect(call(updateLeadStatusConfig, { leadId: '70', status: 'talking' })).rejects.toMatchObject({
      code: 'DERIVED_LOCKED'
    });
  });

  it('the next step and the day to come back are set, cleared, and not logged as contact', async () => {
    const before = db.leads.get('70')!.lastActivityAt;
    await call(updateLeadPlanConfig, { leadId: '70', nextAction: '  לשלוח מחירון ', followUpAt: '2026-12-01T09:00:00Z' });
    expect(db.leads.get('70')).toMatchObject({ nextAction: 'לשלוח מחירון', followUpAt: '2026-12-01T09:00:00.000Z' });
    await call(updateLeadPlanConfig, { leadId: '70', followUpAt: '' });
    expect(db.leads.get('70')).toMatchObject({ nextAction: 'לשלוח מחירון', followUpAt: null });
    expect(db.leads.get('70')!.lastActivityAt).toBe(before);
    expect(db.activities).toEqual([]);
  });

  it('refuses an empty plan, a bad date, and another rikma', async () => {
    await expect(call(updateLeadPlanConfig, { leadId: '70' })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    await expect(call(updateLeadPlanConfig, { leadId: '70', followUpAt: 'soon' })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    await expect(call(updateLeadPlanConfig, { projectId: '58', leadId: '70', nextAction: 'x' })).rejects.toMatchObject({
      code: 'NOT_FOUND'
    });
  });
});

describe('the task pulls the lead along', () => {
  beforeEach(async () => {
    await createLead({ name: 'דנה', phone: '0500000000', consent });
    db.activities = [];
    db.acts.set('900', { externalId: 'lead:70', my: null, myIshur: false, naasa: false });
  });
  const sync = (params: Record<string, any>, userId = '6') =>
    syncLeadFromTask({ params: { id: '900', projectId: '57', ...params }, context: { ...context, userId }, strapi });

  it('taking and accepting the task makes the taker the owner', async () => {
    db.acts.set('900', { externalId: 'lead:70', my: '6', myIshur: true, naasa: false });
    await sync({ myIshur: true });
    expect(db.leads.get('70')!.owner).toBe('6');
    expect(db.activities).toEqual([expect.objectContaining({ kind: 'assign', actor: '6' })]);
  });

  it('handing it back releases the lead', async () => {
    db.leads.get('70')!.owner = '6';
    await sync({ isAssigned: false, uid: [], myIshur: false });
    expect(db.leads.get('70')!.owner).toBeNull();
    expect(db.activities).toEqual([expect.objectContaining({ kind: 'release', actor: '6' })]);
  });

  it('done marks a new lead contacted but does not close it', async () => {
    db.acts.set('900', { externalId: 'lead:70', my: '6', myIshur: true, naasa: true });
    db.leads.get('70')!.owner = '6';
    await sync({ naasa: true });
    expect(db.leads.get('70')!.status).toBe('contacted');
  });

  it('ignores tasks that are not a lead, and progress moves', async () => {
    db.acts.set('900', { externalId: 'gh:12', my: '6', myIshur: true, naasa: true });
    await sync({ naasa: true });
    await sync({ status: 40 });
    expect(db.activities).toEqual([]);
    expect(db.leads.get('70')!.status).toBe('new');
  });
});

describe('mergeLeads / exportLeadContacts (L5)', () => {
  beforeEach(async () => {
    await createLead({ name: 'דנה', phone: '0500000000', consent });
    await createLead({ name: 'דנה כהן', email: 'dana@example.com', organization: 'הרצל 12', consent });
    db.activities = [];
  });

  it('folds the duplicate in: its contact and orders move, it becomes spam, both logs say so', async () => {
    db.leads.get('71')!.orders = ['40'];
    db.orderStatus['40'] = 'paid';
    const r = await call(mergeLeadsConfig, { keepId: '70', mergeId: '71' });
    expect(r).toMatchObject({ keepId: '70', mergedId: '71', status: 'won', movedOrders: 1 });
    expect(db.leads.get('70')).toMatchObject({ email: 'dana@example.com', organization: 'הרצל 12', orders: ['40'], status: 'won' });
    expect(db.leads.get('70')!.dedupeKey.split('|')).toHaveLength(2);
    expect(db.leads.get('71')).toMatchObject({ status: 'spam', orders: [] });
    expect(db.activities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ lead: '70', kind: 'system', body: 'mergedFrom:71', actor: '5' }),
        expect.objectContaining({ lead: '71', kind: 'system', body: 'mergedInto:70', actor: '5' }),
        expect.objectContaining({ lead: '71', kind: 'statusChange', toStatus: 'spam' })
      ])
    );
  });

  it('refuses itself and a lead of another rikma', async () => {
    await expect(call(mergeLeadsConfig, { keepId: '70', mergeId: '70' })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    db.leads.get('71')!.project = '58';
    await expect(call(mergeLeadsConfig, { keepId: '70', mergeId: '71' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('exports contacts only on the record — one log line per lead it gave away', async () => {
    db.leads.get('71')!.status = 'spam';
    const r = await call(exportLeadContactsConfig, {});
    expect(r.contacts).toEqual([{ leadId: '70', phone: '0500000000', email: null }]);
    expect(r.logged).toBe(1);
    expect(db.activities).toEqual([expect.objectContaining({ lead: '70', kind: 'system', body: 'contactsExported', actor: '5' })]);
  });
});

describe('createLead with openTask: false (the demo form, L6)', () => {
  it('records the lead only — no second task, no second notice', async () => {
    const r = await createLead({ name: 'דנה', email: 'dana@example.com', source: 'demo', consent, openTask: false });
    expect(r).toMatchObject({ duplicated: false, taskId: null, notifyUserIds: [] });
    expect(nested.executeAction).not.toHaveBeenCalled();
    expect(db.leads.get(r.leadId)).toMatchObject({ source: 'demo', status: 'new' });
  });
});
