import { describe, it, expect } from 'vitest';
import * as N from './maturedNotices';
import type { MaturedNotice } from './matured';

const ALL: Array<[string, MaturedNotice[]]> = [
  ['pendmOpened', [N.pendmOpened({ projectId: 7, name: 'M' })]],
  ['pendmOfferedToAssignee', N.pendmOfferedToAssignee({ projectId: 7, name: 'M', assigneeId: 4 })],
  ['pmashOpened', [N.pmashOpened({ projectId: 7, name: 'R' })]],
  ['askAccepted', N.askAccepted({ projectId: 7, name: 'M', takerId: 4, takerName: 'dana' })],
  ['askOfferLapsed', N.askOfferLapsed({ projectId: 7, name: 'M', takerId: 4 })],
  ['askmAccepted', N.askmAccepted({ projectId: 7, name: 'R', takerId: 4 })],
  ['finiapprovalMatured', [N.finiapprovalMatured({ projectId: 7, name: 'M', hours: 3, isHours: true })]],
  ['objectChangeApplied', N.objectChangeApplied({ projectId: 7, decisionId: 9, decisionName: 'D', endedMemberId: 4 })],
  ['decisionAwaitsCustomer', [N.decisionAwaitsCustomer({ projectId: 7, decisionName: 'D', clientIds: [5] })]],
  ['stipendAwaitsFunder', [N.stipendAwaitsFunder({ projectId: 7, decisionName: 'D', funderId: 5 })]],
  ['stipendApplied', [N.stipendApplied({ projectId: 7, decisionName: 'D' })]],
  ['rikmaDecisionApplied', [N.rikmaDecisionApplied({ projectId: 7, decisionId: 9, decisionName: null })]],
  ['saleClaimMatured', [N.saleClaimMatured({ projectId: 7, holderId: 4, reporterId: 5 })]],
  ['tosplitMatured', [N.tosplitMatured({ projectId: 7 })]],
  ['maapSettled', [N.maapSettled({ projectId: 7, name: 'R' })]],
  ['sheirutApproved', [N.sheirutApproved({ projectId: 7, name: 'S' })]],
  ['quoteMatured', N.quoteMatured({ projectId: 7, productName: 'P', customerId: 5 })],
  ['askwantApproved', [N.askwantApproved({ requesterId: 5, name: 'S' })]],
  ['stipendPaymentConfirmed', N.stipendPaymentConfirmed({ projectId: 7, projectName: 'X', amount: 100, moved: true, recipientId: 4, funderId: 5 })],
  ['dormancyOpened', N.dormancyOpened({ projectId: 7, decisionId: 9, name: 'M', ownerId: 4 })],
  ['archiveTookEffect', [N.archiveTookEffect({ projectId: 7, name: 'R', kind: 'matanot' })]],
  ['rosterClosed', [N.rosterClosed({ projectId: 7 })]],
  ['fulfillmentRuleMatured', N.fulfillmentRuleMatured({ projectId: 7, name: 'משלוח', agreedIds: [4], proposerId: 5, live: true })],
  ['fulfillmentActDue', [N.fulfillmentActDue({ projectId: 7, name: 'משלוח · #1', userIds: [4], overdue: false })]],
  ['stockReceiptSettled', [N.stockReceiptSettled({ projectId: 7, name: 'צנצנות', quantity: 50 })]]
];

describe('every matured notice', () => {
  it.each(ALL)('%s says something in he, en and ar, and links to a path', (_name, notices) => {
    for (const n of notices) {
      for (const part of [n.title, n.body]) {
        expect(part.he.trim()).not.toBe('');
        expect(part.en.trim()).not.toBe('');
        expect(part.ar?.trim()).toBeTruthy();
      }
      expect(n.url.startsWith('/')).toBe(true);
    }
  });

  it.each(ALL)('%s uses the platform words — רקמה, rikma, ريكما', (_name, notices) => {
    for (const n of notices) {
      const all = [n.title, n.body].map((p) => `${p.he} ${p.en} ${p.ar}`).join(' ');
      expect(all).not.toMatch(/ריקמה|FreeMate|\bweave\b|\btissue\b|نسيج/);
    }
  });

  it('every builder is covered here', () => {
    const builders = Object.keys(N).filter((k) => typeof (N as any)[k] === 'function');
    expect(builders.sort()).toEqual(ALL.map(([name]) => name).sort());
  });
});

describe('who is told, and what is asked of them', () => {
  const to = (n: MaturedNotice) => n.to;

  it('a rikma-wide result is an outcome to the members', () => {
    for (const n of [N.pendmOpened({ projectId: 7, name: 'M' }), N.tosplitMatured({ projectId: 7 }), N.rosterClosed({ projectId: 7 })]) {
      expect(n.intent).toBe('outcome');
      expect(to(n)).toEqual({ projectId: 7 });
    }
  });

  it("an assigned mission asks its assignee — their silence is not a yes — and the rest hear it once", () => {
    const [members, assignee] = N.pendmOfferedToAssignee({ projectId: 7, name: 'M', assigneeId: 4 });
    expect(members.to).toEqual({ projectId: 7, except: [4] });
    expect(assignee).toMatchObject({ intent: 'consent', to: { userIds: [4] } });
  });

  it('an accepted candidate hears it personally, and is left out of the rikma-wide notice', () => {
    const [members, taker] = N.askAccepted({ projectId: 7, name: 'M', takerId: 4, takerName: 'dana' });
    expect(members).toMatchObject({ intent: 'outcome', to: { projectId: 7, except: [4] } });
    expect(taker).toMatchObject({ intent: 'personal', to: { userIds: [4] } });
    expect(members.body.he).toContain('dana');
  });

  it('a sale claim stays between the reporter and the holder', () => {
    const n = N.saleClaimMatured({ projectId: 7, holderId: 4, reporterId: 5 });
    expect(n).toMatchObject({ intent: 'personal', to: { userIds: [4, 5] } });
  });

  it('whoever the clock could not answer for is asked — consent, not told', () => {
    expect(N.decisionAwaitsCustomer({ projectId: 7, decisionName: 'D', clientIds: [5] })).toMatchObject({ intent: 'consent', to: { userIds: [5] } });
    expect(N.stipendAwaitsFunder({ projectId: 7, decisionName: 'D', funderId: 5 })).toMatchObject({ intent: 'consent', to: { userIds: [5] } });
    for (const n of N.dormancyOpened({ projectId: 7, decisionId: 9, name: 'M', ownerId: 4 })) {
      expect(n.intent).toBe('consent');
    }
  });

  it('a membership that ended is told to that member, apart from the rikma', () => {
    const [members, ended] = N.objectChangeApplied({ projectId: 7, decisionId: 9, decisionName: 'D', endedMemberId: 4 });
    expect(members.to).toEqual({ projectId: 7, except: [4] });
    expect(ended).toMatchObject({ intent: 'personal', to: { userIds: [4] } });
    expect(N.objectChangeApplied({ projectId: 7, decisionId: 9, decisionName: 'D' })).toHaveLength(1);
  });

  it('votes link to the vote page; an end-of-cycle change says when', () => {
    const [n] = N.objectChangeApplied({ projectId: 7, decisionId: 9, decisionName: 'D', effectiveFrom: '2026-11-01' });
    expect(n.url).toBe('/moach/7/votes/decision/9');
    expect(n.body.en).toMatch(/end of the cycle/);
  });
});

describe('order automation notices (PLAN_SHOP_OPERATIONS A2/A3)', () => {
  it('a rule matured on silence tells the people whose silence it was, and its author', () => {
    const [agreed, author] = N.fulfillmentRuleMatured({ projectId: 7, name: 'R', agreedIds: [4, 6], proposerId: 5, live: true });
    expect(agreed.to).toEqual({ userIds: [4, 6] });
    expect(agreed.intent).toBe('personal');
    expect(author.to).toEqual({ userIds: [5] });
    // An author who was also asked hears it once.
    expect(N.fulfillmentRuleMatured({ projectId: 7, name: 'R', agreedIds: [5], proposerId: 5, live: true })).toHaveLength(1);
  });

  it('a reminder goes to whoever holds the act', () => {
    expect(N.fulfillmentActDue({ projectId: 7, name: 'A', userIds: [4], overdue: true }).to).toEqual({ userIds: [4] });
  });
});
