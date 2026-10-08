/**
 * The life of a direct offer after it is written — docs/inprogress/PLAN_DIRECT_OFFER.md P3–P4.
 *
 *   updateDirectOffer      the provider changes the terms or who it is for, before it is taken
 *   issueDirectOfferLink   the provider gets the link to send (a new one retires the old)
 *   revokeDirectOfferLink  the provider closes the link
 *   claimDirectOffer       the customer takes it: it becomes her wish
 *
 * The link opens a view and nothing else (`/offer/[key]`); taking it needs an account,
 * the link's signature, and — when the provider locked it — the account's own email,
 * read from Strapi by the id in the signed session, never from a cookie.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { claimRefusal, offerView, type OfferView } from '$lib/offer/directOffer.js';
import { checkOfferKey, emailLock, emailMayClaim, mintOfferKey, nextLinkAt, offerKeyId } from '$lib/server/offer/offerKey.js';
import { termsDigest } from '$lib/server/wish/termsDigest.js';
import { entryInput } from '$lib/server/wish/proposal.js';
import { termsPatch } from './updateWishTerms.js';

type Strapi = { execute: (qid: string, vars: any, jwt?: string, fetch?: any) => Promise<any> };

async function loadOffer(strapi: Strapi, context: any, id: string): Promise<{ view: OfferView; raw: any }> {
  const res = await strapi.execute('433directOfferById', { id: String(id) }, context.jwt, context.fetch);
  const view = offerView(res?.data ?? res);
  if (!view) throw new ActionError('NOT_FOUND', 'No such offer');
  return { view, raw: res?.data?.ratson?.data?.attributes ?? {} };
}

/** The provider's own offer, still in their hands. */
async function loadOwn(strapi: Strapi, context: any, id: string) {
  const loaded = await loadOffer(strapi, context, id);
  if (loaded.view.provider?.id !== String(context.userId)) throw new ActionError('FORBIDDEN', 'Only the provider who wrote the offer may change it');
  return loaded;
}

// ── updateDirectOffer ────────────────────────────────────────────────────────

const update: ActionExecutionHandler = async (params, context, { strapi }) => {
  const p = params as Record<string, any>;
  const id = String(p.ratsonId ?? '');
  const { view, raw } = await loadOwn(strapi as any, context, id);
  if (view.state !== 'draft') throw new ActionError('TAKEN', 'The offer was already taken — it is the customer’s wish now; propose on its parts instead');

  const data: Record<string, unknown> = {};
  const terms = termsPatch(p);
  if (typeof p.recipientHint === 'string') {
    const hint = p.recipientHint.trim();
    if (!hint) throw new Error('Say who the offer is for — only you will see it');
    data.offer_recipient_hint = hint;
  }
  if (typeof p.recipientEmail === 'string') {
    const email = p.recipientEmail.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('That email address does not look right');
    data.offer_email_lock = email ? emailLock(email) : null;
  }
  if (Object.keys(terms).length === 0 && Object.keys(data).length === 0) throw new Error('Nothing to change');

  // Before she took it the terms are the provider's own: a change is not a new version
  // anyone else must answer, so the provider's signatures follow the new digest.
  const digest = termsDigest({ ...raw, ...terms });
  await strapi.execute('434updateDirectOffer', { id, data: { ...terms, ...data, terms_digest: digest } }, context.jwt, context.fetch);
  if (Object.keys(terms).length > 0 && digest !== raw.terms_digest) {
    const res = await strapi.execute('105queryRatsonWithProposals', { id }, context.jwt, context.fetch);
    for (const prop of res?.data?.ratsonProposals?.data ?? []) {
      const entries = prop.attributes?.ratson_willingness_entry ?? [];
      if (entries.length === 0) continue;
      await strapi.execute(
        '387counterRatsonProposal',
        { id: String(prop.id), ratson_willingness_entry: entries.map((e: any) => ({ ...entryInput(e), termsDigest: digest })) },
        context.jwt,
        context.fetch
      );
    }
  }
  return { success: true, data: { ratsonId: id, termsDigest: digest }, updateStrategy: { type: 'none' as const } };
};

export const updateDirectOfferConfig: ActionConfig = {
  key: 'updateDirectOffer',
  description: 'The provider changes a direct offer’s terms, or who it is for, before the customer took it.',
  graphqlOperation: update,
  paramSchema: {
    ratsonId: { type: 'string', required: true },
    name: { type: 'string', required: false },
    longDes: { type: 'string', required: false },
    startDate: { type: 'string', required: false },
    finnishDate: { type: 'string', required: false },
    isOnline: { type: 'boolean', required: false },
    location_hint: { type: 'string', required: false },
    recipientHint: { type: 'string', required: false },
    recipientEmail: { type: 'string', required: false, description: 'Empty string removes the lock' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to change an offer' }],
  updateStrategy: { type: 'none' }
};

// ── issue / revoke the link ──────────────────────────────────────────────────

const issue: ActionExecutionHandler = async (params, context, { strapi }) => {
  const id = String((params as any).ratsonId ?? '');
  const { view } = await loadOwn(strapi as any, context, id);
  if (view.state !== 'draft') throw new ActionError('TAKEN', 'The offer was already taken');
  const linkAt = nextLinkAt(view.linkAt, new Date());
  await strapi.execute('434updateDirectOffer', { id, data: { offer_link_at: linkAt } }, context.jwt, context.fetch);
  return { success: true, data: { ratsonId: id, path: `/offer/${mintOfferKey(id, linkAt)}`, linkAt }, updateStrategy: { type: 'none' as const } };
};

export const issueDirectOfferLinkConfig: ActionConfig = {
  key: 'issueDirectOfferLink',
  description: 'The provider gets the link to a direct offer. A new link retires the one before it.',
  graphqlOperation: issue,
  paramSchema: { ratsonId: { type: 'string', required: true } },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' }
};

const revoke: ActionExecutionHandler = async (params, context, { strapi }) => {
  const id = String((params as any).ratsonId ?? '');
  await loadOwn(strapi as any, context, id);
  await strapi.execute('434updateDirectOffer', { id, data: { offer_link_at: null } }, context.jwt, context.fetch);
  return { success: true, data: { ratsonId: id }, updateStrategy: { type: 'none' as const } };
};

export const revokeDirectOfferLinkConfig: ActionConfig = {
  key: 'revokeDirectOfferLink',
  description: 'The provider closes the link to a direct offer; whoever holds it sees that it is no longer valid.',
  graphqlOperation: revoke,
  paramSchema: { ratsonId: { type: 'string', required: true } },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' }
};

// ── claimDirectOffer ─────────────────────────────────────────────────────────

const CLAIM_MESSAGES = {
  claimed: 'This offer was already taken',
  closed: 'This offer is closed',
  self: 'This is your own offer — send the link to the person it is for',
  email: 'This offer was written for another email address — sign in with the account it was sent to'
} as const;

const claim: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const key = String((params as any).key ?? '');
  const me = String(context.userId);
  const id = offerKeyId(key);
  if (!id) throw new ActionError('INVALID_LINK', 'This link is not valid');

  const { view, raw } = await loadOffer(strapi as any, context, id);
  const check = checkOfferKey(key, { id, offer_link_at: view.linkAt, offer_expires_at: view.expiresAt });
  if (check !== 'ok') throw new ActionError(check === 'expired' ? 'EXPIRED_LINK' : 'INVALID_LINK', 'This link is not valid any more');

  let emailOk = true;
  if (raw.offer_email_lock) {
    // The address the account really has — by the id from the signed session, on the
    // service token (an account cannot read its own row through the content API).
    const res = await strapi.execute('436accountEmail', { id: me }, undefined, context.fetch);
    emailOk = emailMayClaim(raw.offer_email_lock, res?.data?.usersPermissionsUser?.data?.attributes?.email ?? null);
  }
  const refusal = claimRefusal(view, me, emailOk);
  if (refusal) throw new ActionError(`OFFER_${refusal.toUpperCase()}`, CLAIM_MESSAGES[refusal]);

  const now = new Date().toISOString();
  await strapi.execute(
    '434updateDirectOffer',
    { id, data: { users_permissions_users: [me], claimed_at: now, status_ratson: 'negotiating' } },
    context.jwt,
    context.fetch
  );

  const chatForumId = raw.chat_forum?.data?.id ?? null;
  if (chatForumId) {
    try {
      await strapi.execute(
        '1chatsend',
        { fid: chatForumId, fidn: parseInt(String(chatForumId), 10), idL: me, da: now, mes: 'קיבלתי את ההצעה. מכאן נעבור על הפרטים ועל כל חלק יחד.' },
        context.jwt,
        context.fetch
      );
    } catch {
      /* best-effort */
    }
  }

  const providerId = view.provider?.id;
  if (notifier && providerId) {
    try {
      await notifier.notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipientIds' } },
          templates: {
            title: { he: 'ההצעה שלך התקבלה', en: 'Your offer was taken', ar: 'تم قبول عرضك' },
            body: {
              he: `"${view.name}" היא עכשיו משאלה של הלקוח/ה. אפשר לדבר שם על כל חלק.`,
              en: `"${view.name}" is now the customer's wish. Each part can be discussed there.`,
              ar: `"${view.name}" أصبحت الآن أمنية الزبون. يمكن مناقشة كل جزء هناك.`
            }
          },
          channels: ['socket', 'push'],
          metadata: { priority: 'high', type: 'directOffer', url: `/deals/offers/${id}` }
        },
        params,
        { recipientIds: [providerId], data: { ratsonId: id } },
        context
      );
    } catch (err) {
      console.warn('[claimDirectOffer] notification failed (non-fatal):', err);
    }
  }

  return { success: true, data: { ratsonId: id, path: `/concierge/${id}` }, updateStrategy: { type: 'none' as const } };
};

export const claimDirectOfferConfig: ActionConfig = {
  key: 'claimDirectOffer',
  description: 'The customer takes a direct offer from its link: the wish becomes hers, and every part the provider priced is a version she approves or counters.',
  graphqlOperation: claim,
  paramSchema: { key: { type: 'string', required: true } },
  authRules: [{ type: 'jwt', errorMessage: 'Sign in to take the offer' }],
  updateStrategy: { type: 'none' }
};
