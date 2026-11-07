/**
 * A lead's conversation (PLAN_LEADS L4): the rikma's members and the person
 * who asked. The lead row decides who is in it — never the forum's subject,
 * which any user can still rename.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: { ADMINMONTHER: 'test-admin' } }));

const { forumParticipantIds, userCanAccessForumAsync, leadForumSubject } = await import('./forumAccess.js');
const { ensureLeadForumConfig } = await import('./configs/ensureLeadForum.js');

type Lead = { id: string; project: string; customer?: string | null; forum?: string | null; name?: string };
let leads: Lead[];
let forums: number;
const members = ['5', '6'];

const strapi = {
  execute: vi.fn(async (qid: string, vars: any) => {
    switch (qid) {
      case 'leadOfForum': {
        const l = leads.find((x) => x.forum === String(vars.forumId));
        return {
          data: {
            leads: {
              data: l
                ? [{ id: l.id, attributes: { status: 'new', project: { data: { id: l.project } }, customer_user: { data: l.customer ? { id: l.customer } : null } } }]
                : []
            }
          }
        };
      }
      case 'leadForumOf': {
        const l = leads.find((x) => x.id === String(vars.id));
        if (!l) return { data: { lead: { data: null } } };
        return {
          data: {
            lead: {
              data: {
                id: l.id,
                attributes: {
                  name: l.name ?? 'Maya',
                  project: { data: { id: l.project, attributes: { user_1s: { data: members.map((id) => ({ id })) } } } },
                  customer_user: { data: l.customer ? { id: l.customer } : null },
                  forum: { data: l.forum ? { id: l.forum } : null }
                }
              }
            }
          }
        };
      }
      case '66CreateForumForAsk':
        return { data: { createForum: { data: { id: String(500 + forums++) } } } };
      case 'leadUpdate': {
        const l = leads.find((x) => x.id === String(vars.id))!;
        if (vars.data.forum) l.forum = String(vars.data.forum);
        return { data: { updateLead: { data: { id: vars.id } } } };
      }
      default:
        throw new Error(`unexpected qid ${qid}`);
    }
  })
};

const ctx = (userId: string) => ({ userId, jwt: 'jwt', lang: 'he', fetch: globalThis.fetch });
const forumNamed = (id: string, subject: string) => ({
  id,
  attributes: { subject, project: { data: { id: '57', attributes: { user_1s: { data: members.map((m) => ({ id: m })) } } } } }
});
const ensure = (p: Record<string, any>, userId: string) =>
  (ensureLeadForumConfig.graphqlOperation as any)(p, ctx(userId), { strapi });

beforeEach(() => {
  leads = [{ id: '70', project: '57', customer: '42' }];
  forums = 0;
  strapi.execute.mockClear();
});

describe('who is in a lead conversation', () => {
  it('the members, and the person the lead names — once the lead points to the forum', async () => {
    leads[0].forum = '9';
    const f = forumNamed('9', leadForumSubject('70', 'Maya'));
    expect(await forumParticipantIds(strapi as any, f, ctx('5') as any)).toEqual(['5', '6', '42']);
    expect(await userCanAccessForumAsync(strapi as any, f, '42', ctx('42') as any)).toBe(true);
    expect(await userCanAccessForumAsync(strapi as any, f, '99', ctx('99') as any)).toBe(false);
  });

  it('a forum renamed to look like a lead conversation lets nobody new in', async () => {
    const f = forumNamed('9', 'LEAD::70::u99::sneaky');
    expect(await forumParticipantIds(strapi as any, f, ctx('99') as any)).toEqual(['5', '6']);
  });

  it('an ordinary forum pays no extra read', async () => {
    await forumParticipantIds(strapi as any, forumNamed('3', 'general'), ctx('5') as any);
    expect(strapi.execute).not.toHaveBeenCalled();
  });
});

describe('ensureLeadForum', () => {
  it('a member opens it once: a rikma forum, linked to the lead; the second time it is found', async () => {
    const first = await ensure({ leadId: '70', projectId: '57' }, '5');
    expect(first).toMatchObject({ forumId: '500', created: true });
    expect(strapi.execute).toHaveBeenCalledWith('66CreateForumForAsk', expect.objectContaining({ pid: '57', subject: 'LEAD::70::Maya' }), undefined, expect.anything());
    expect(leads[0].forum).toBe('500');
    expect(await ensure({ leadId: '70' }, '42')).toMatchObject({ forumId: '500', created: false });
  });

  it('nobody else may open it, and a lead with no account has no one to talk to', async () => {
    await expect(ensure({ leadId: '70' }, '99')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(ensure({ leadId: '70', projectId: '58' }, '5')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    leads[0].customer = null;
    await expect(ensure({ leadId: '70' }, '5')).rejects.toMatchObject({ code: 'NO_ACCOUNT' });
  });

  it('says so when the conversation link is not deployed yet', async () => {
    strapi.execute.mockImplementationOnce(async () => {
      throw new Error('Cannot query field "forum" on type "Lead"');
    });
    await expect(ensure({ leadId: '70' }, '5')).rejects.toMatchObject({ code: 'LEAD_CHAT_NOT_READY' });
  });
});
