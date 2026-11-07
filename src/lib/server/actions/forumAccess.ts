import type { ActionContext, AuthorizationResult } from './types.js';

type StrapiLike = {
  execute(
    queryId: string,
    variables: Record<string, any>,
    userJwt?: string,
    fetchFn?: typeof globalThis.fetch
  ): Promise<any>;
};

export type ForumKind =
  | 'project'
  | 'process'
  | 'mission'
  | 'ask'
  | 'sheirut'
  | 'haluka'
  | 'meeting'
  | 'wish'
  | 'wishoffer'
  | 'saleClaim'
  | 'lead';

/**
 * A lead's conversation (PLAN_LEADS L4): the rikma's members and the person
 * who asked, signed in on the site. The subject starts with this — but only
 * to name the thread. Who may read it is never taken from the subject (any
 * user can still rename a forum through `92updateForumSubject`): the person
 * is added only when a lead row points to this forum (`Lead.forum`), and
 * lead rows are written by the server alone.
 */
export const LEAD_FORUM_PREFIX = 'LEAD::';

export function leadForumSubject(leadId: string | number, title: string): string {
  return `${LEAD_FORUM_PREFIX}${leadId}::${title.replace(/::/g, ':').slice(0, 120)}`;
}

export interface ForumMessageView {
  id: string;
  message: string;
  username: string;
  pic: string;
  timestamp: string | null;
  sentByMe: boolean;
  pending: boolean;
  what: boolean;
}

export interface ForumView {
  id: string;
  kind: ForumKind;
  title: string;
  subtitle: string;
  projectId: string | null;
  projectName: string;
  projectPic: string | null;
  lastMessage: ForumMessageView | null;
  unreadCount: number;
  updatedAt: string | null;
  href: string;
  messages: ForumMessageView[];
  recipients: string[];
  md: Record<string, any>;
}

const DEFAULT_PIC =
  'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';

function asArray(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function entityArray(relation: any): any[] {
  return asArray(relation?.data).filter(Boolean);
}

function entityId(entity: any): string | null {
  return entity?.id == null ? null : String(entity.id);
}

function profilePic(entity: any): string | null {
  const attrs = entity?.attributes || {};
  return (
    attrs.profilePic?.data?.attributes?.formats?.thumbnail?.url ||
    attrs.profilePic?.data?.attributes?.url ||
    null
  );
}

function projectFromForum(attrs: any): any {
  return attrs?.project?.data || null;
}

function firstProject(attrs: any): any {
  return (
    attrs?.project?.data ||
    attrs?.haluka?.data?.attributes?.project?.data ||
    attrs?.asks?.data?.[0]?.attributes?.project?.data ||
    attrs?.sheiruts?.data?.[0]?.attributes?.project?.data ||
    attrs?.mesimabetahaliches?.data?.[0]?.attributes?.project?.data ||
    null
  );
}

function projectMembers(project: any): string[] {
  return entityArray(project?.attributes?.user_1s).map((user) => String(user.id));
}

function uniqueIds(ids: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(ids.filter((id): id is string => !!id && String(id).trim() !== '').map(String))
  );
}

function ratsonOwners(attrs: any): string[] {
  return entityArray(attrs?.ratson?.data?.attributes?.users_permissions_users).map((user) =>
    String(user.id)
  );
}

// A wishoffer forum coordinates the wish owner and the community volunteer before
// the owner accepts the proposal. It links back via `ratson_proposal`, whose
// `ratson` carries the owners and whose `proposer_users` carry the volunteer(s).
function ratsonProposalParticipants(attrs: any): string[] {
  const proposal = attrs?.ratson_proposal?.data?.attributes;
  if (!proposal) return [];
  const owners = entityArray(proposal?.ratson?.data?.attributes?.users_permissions_users).map(
    (user) => String(user.id)
  );
  const proposers = entityArray(proposal?.proposer_users).map((user) => String(user.id));
  return [...owners, ...proposers];
}

// A saleClaim decision-forum is bilateral (PLAN_sale_holder_consent): the chat
// is private to the reporter (who logged the sale) and the holder (on whom it
// was logged). We read them off the linked saleClaim Decision's sale. The
// forum queries fetch `decisions(filters:{kind:{eq:"saleClaim"}})` so this is
// present only for those forums; every other decision forum (pic, pmash…)
// stays rikma-wide 'project' kind.
function saleClaimSale(attrs: any): any {
  const dec = entityArray(attrs?.decisions).find(
    (d) => d?.attributes?.kind === 'saleClaim'
  );
  return dec?.attributes?.sale?.data || null;
}

function saleClaimParticipants(attrs: any): string[] {
  const sale = saleClaimSale(attrs);
  if (!sale) return [];
  return uniqueIds([
    entityId(sale?.attributes?.reporter?.data),
    entityId(sale?.attributes?.users_permissions_user?.data)
  ]);
}

function forumKind(attrs: any): ForumKind {
  // A bilateral sale-holder consent chat is private to the two parties — checked
  // first so it never falls through to the rikma-wide 'project' kind.
  if (saleClaimSale(attrs)) return 'saleClaim';
  // A community-volunteer coordination chat links back via `ratson_proposal`
  // (checked before `ratson` since a proposal forum has no direct ratson link).
  if (attrs?.ratson_proposal?.data) return 'wishoffer';
  // A wish's chat_forum links back via `ratson` and has none of the
  // project/ask/sheirut relations the other kinds key off.
  if (attrs?.ratson?.data) return 'wish';
  if (attrs?.haluka?.data) return 'haluka';
  if (attrs?.pgisha?.data) return 'meeting';
  if (entityArray(attrs?.asks).length > 0) return 'ask';
  if (entityArray(attrs?.sheiruts).length > 0 || attrs?.sheirutpend?.data) return 'sheirut';
  if (entityArray(attrs?.mesimabetahaliches).length > 0) return 'mission';
  if (String(attrs?.subject || '').startsWith('PROCESS')) return 'process';
  // Display only — access for the person comes from the lead row (leadOfForum).
  if (String(attrs?.subject || '').startsWith(LEAD_FORUM_PREFIX)) return 'lead';
  return 'project';
}

function forumTitle(kind: ForumKind, attrs: any, projectName: string): string {
  const subject = String(attrs?.subject || '').trim();
  if (kind === 'wishoffer') {
    return (
      attrs?.ratson_proposal?.data?.attributes?.ratson?.data?.attributes?.name ||
      subject ||
      'Wish offer chat'
    );
  }
  if (kind === 'wish') {
    return attrs?.ratson?.data?.attributes?.name || subject || 'Wish chat';
  }
  if (kind === 'haluka') {
    const haluka = attrs?.haluka?.data?.attributes;
    const sender = haluka?.usersend?.data?.attributes?.username;
    const receiver = haluka?.userrecive?.data?.attributes?.username;
    return sender && receiver ? `${sender} <-> ${receiver}` : subject || 'Money transfer';
  }
  if (kind === 'meeting') {
    return attrs?.pgisha?.data?.attributes?.name || subject || 'Meeting chat';
  }
  if (kind === 'ask') {
    const asker = attrs?.asks?.data?.[0]?.attributes?.users_permissions_user?.data?.attributes?.username;
    return asker ? `Join request - ${asker}` : subject || 'Join request';
  }
  if (kind === 'sheirut') {
    return attrs?.sheiruts?.data?.[0]?.attributes?.name || subject || 'Service chat';
  }
  if (kind === 'mission') {
    return attrs?.mesimabetahaliches?.data?.[0]?.attributes?.name || subject || 'Mission chat';
  }
  if (kind === 'process') {
    const [, , title = ''] = subject.split('::');
    return title || subject || 'Process forum';
  }
  if (kind === 'lead') {
    const [, , title = ''] = subject.split('::');
    return title || projectName || 'Enquiry';
  }
  return subject || projectName || 'Forum';
}

function forumSubtitle(kind: ForumKind, attrs: any, projectName: string): string {
  if (kind === 'wishoffer')
    return attrs?.ratson_proposal?.data?.attributes?.ratson?.data?.attributes?.name || projectName;
  if (kind === 'wish') return attrs?.ratson?.data?.attributes?.name || projectName;
  if (kind === 'haluka') {
    const amount = attrs?.haluka?.data?.attributes?.amount;
    return amount ? `${projectName} · ${amount}` : projectName;
  }
  if (kind === 'meeting') return attrs?.pgisha?.data?.attributes?.desc || projectName;
  if (kind === 'ask') return projectName;
  if (kind === 'sheirut') return attrs?.sheiruts?.data?.[0]?.attributes?.descrip || projectName;
  if (kind === 'mission') return attrs?.mesimabetahaliches?.data?.[0]?.attributes?.descrip || projectName;
  if (kind === 'process') return projectName;
  return projectName;
}

function messageView(message: any, userId: string): ForumMessageView {
  const attrs = message?.attributes || {};
  const user = attrs.users_permissions_user?.data;
  return {
    id: String(message?.id || `message-${attrs.when || Date.now()}`),
    message: attrs.content || '',
    username: user?.attributes?.username || '',
    pic: profilePic(user) || DEFAULT_PIC,
    timestamp: attrs.when || null,
    sentByMe: String(user?.id) === String(userId),
    pending: false,
    what: true
  };
}

export function normalizeForum(entity: any, userId: string): ForumView | null {
  if (!entity?.id || !entity.attributes) return null;

  const attrs = entity.attributes;
  const kind = forumKind(attrs);
  const project = firstProject(attrs);
  const projectId = entityId(project);
  const projectName = project?.attributes?.projectName || '';
  const messages = entityArray(attrs.messages).map((message) => messageView(message, userId));
  const sortedMessages = [...messages].sort((a, b) => {
    const at = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const bt = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return at - bt;
  });
  const lastMessage = sortedMessages[sortedMessages.length - 1] || null;
  const recipients = participantIdsForForum(entity);

  return {
    id: String(entity.id),
    kind,
    title: forumTitle(kind, attrs, projectName),
    subtitle: forumSubtitle(kind, attrs, projectName),
    projectId,
    projectName,
    projectPic: profilePic(project),
    lastMessage,
    unreadCount: 0,
    updatedAt: attrs.updatedAt || lastMessage?.timestamp || attrs.publishedAt || attrs.createdAt || null,
    href: `/forum/${entity.id}`,
    messages: sortedMessages,
    recipients,
    md: {
      pid: projectId,
      projectName,
      projectPic: profilePic(project),
      mesimaName: attrs?.mesimabetahaliches?.data?.[0]?.attributes?.name || '',
      transferDetails: kind === 'haluka' ? forumSubtitle(kind, attrs, projectName) : '',
      participants: recipients
    }
  };
}

export function participantIdsForForum(entity: any): string[] {
  const attrs = entity?.attributes || {};
  const kind = forumKind(attrs);
  const project = firstProject(attrs);

  if (kind === 'saleClaim') {
    // Bilateral — ONLY the reporter and the holder, never the whole rikma.
    return saleClaimParticipants(attrs);
  }

  if (kind === 'wishoffer') {
    return uniqueIds(ratsonProposalParticipants(attrs));
  }

  if (kind === 'wish') {
    return uniqueIds(ratsonOwners(attrs));
  }

  if (kind === 'haluka') {
    const haluka = attrs.haluka?.data?.attributes || {};
    return uniqueIds([
      entityId(haluka.usersend?.data),
      entityId(haluka.userrecive?.data)
    ]);
  }

  if (kind === 'meeting') {
    return uniqueIds(
      entityArray(attrs.pgisha?.data?.attributes?.pgishausers).map((participant) =>
        entityId(participant?.attributes?.users_permissions_user?.data)
      )
    );
  }

  if (kind === 'ask') {
    const askerIds = entityArray(attrs.asks).map((ask) =>
      entityId(ask?.attributes?.users_permissions_user?.data)
    );
    return uniqueIds([...projectMembers(project), ...askerIds]);
  }

  if (kind === 'sheirut') {
    const sheirutCustomerIds = entityArray(attrs.sheiruts)
      .flatMap((sheirut) => entityArray(sheirut?.attributes?.sheirutpends))
      .map((pend) => entityId(pend?.attributes?.users_permissions_user?.data));
    const directUsers = entityArray(attrs.sheiruts)
      .flatMap((sheirut) => entityArray(sheirut?.attributes?.users_permissions_users))
      .map((user) => entityId(user));
    const sheirutpendUser = entityId(attrs.sheirutpend?.data?.attributes?.users_permissions_user?.data);
    return uniqueIds([...projectMembers(project), ...sheirutCustomerIds, ...directUsers, sheirutpendUser]);
  }

  return uniqueIds(projectMembers(project));
}

export function userCanAccessForum(entity: any, userId: string): boolean {
  return participantIdsForForum(entity).includes(String(userId));
}

export interface LeadOfForum {
  leadId: string;
  projectId: string | null;
  customerUserId: string | null;
  status: string | null;
}

/**
 * The lead that points to this forum, read with the admin token (lead qids
 * are serviceAdmin-only). Null when none does — and when `Lead.forum` is not
 * deployed yet, so before that every forum reads exactly as it did.
 */
export async function leadOfForum(
  strapi: StrapiLike,
  forumId: string,
  context: ActionContext
): Promise<LeadOfForum | null> {
  try {
    const { adminToken } = await import('../adminToken.js');
    const res = await strapi.execute('leadOfForum', { forumId: String(forumId) }, adminToken(), context.fetch);
    const row = res?.data?.leads?.data?.[0];
    if (!row?.id) return null;
    const a = row.attributes ?? {};
    return {
      leadId: String(row.id),
      projectId: entityId(a.project?.data),
      customerUserId: entityId(a.customer_user?.data),
      status: a.status ?? null
    };
  } catch {
    return null;
  }
}

/**
 * Everyone in a forum. The same as `participantIdsForForum`, plus — for a
 * lead's conversation — the person who asked. Only forums named as a lead's
 * pay the extra read.
 */
export async function forumParticipantIds(
  strapi: StrapiLike,
  entity: any,
  context: ActionContext
): Promise<string[]> {
  const base = participantIdsForForum(entity);
  if (forumKind(entity?.attributes || {}) !== 'lead' || !entity?.id) return base;
  const lead = await leadOfForum(strapi, String(entity.id), context);
  return lead?.customerUserId ? uniqueIds([...base, lead.customerUserId]) : base;
}

export async function userCanAccessForumAsync(
  strapi: StrapiLike,
  entity: any,
  userId: string,
  context: ActionContext
): Promise<boolean> {
  if (userCanAccessForum(entity, userId)) return true;
  return (await forumParticipantIds(strapi, entity, context)).includes(String(userId));
}

export async function getForumEntity(
  strapi: StrapiLike,
  forumId: string,
  context: ActionContext,
  mode: 'thread' | 'summary' = 'thread'
): Promise<any | null> {
  const result = await strapi.execute(
    mode === 'thread' ? '103getForumThreadById' : '105getForumSummaryById',
    { forumId: String(forumId) },
    context.jwt,
    context.fetch
  );
  return result?.data?.forum?.data || null;
}

export async function authorizeForumParticipant(
  strapi: StrapiLike,
  userId: string,
  forumId: string,
  context: ActionContext
): Promise<AuthorizationResult> {
  if (!forumId) {
    return { authorized: false, reason: 'Forum ID is required' };
  }

  const forum = await getForumEntity(strapi, forumId, context, 'summary');
  if (!forum) {
    return { authorized: false, reason: 'Forum not found' };
  }

  if (!(await userCanAccessForumAsync(strapi, forum, userId, context))) {
    return { authorized: false, reason: 'User is not a participant in this forum' };
  }

  return { authorized: true };
}

export function collectForumEntitiesFromUserSources(data: any): any[] {
  const attrs = data?.usersPermissionsUser?.data?.attributes || {};
  const forums: any[] = [];

  entityArray(attrs.projects_1s).forEach((project) => {
    entityArray(project?.attributes?.forums).forEach((forum) => forums.push(forum));
  });

  [...entityArray(attrs.halukasres), ...entityArray(attrs.halukasend)].forEach((haluka) => {
    const forum = haluka?.attributes?.forum?.data;
    if (forum) forums.push(forum);
  });

  entityArray(attrs.pgishausers).forEach((pgishauser) => {
    entityArray(pgishauser?.attributes?.pgishas).forEach((meeting) => {
      const forum = meeting?.attributes?.forum?.data;
      if (forum) forums.push(forum);
    });
  });

  entityArray(attrs.asks).forEach((ask) => {
    entityArray(ask?.attributes?.forums).forEach((forum) => forums.push(forum));
  });

  entityArray(attrs.sheirutpends).forEach((pend) => {
    const pendForum = pend?.attributes?.forum?.data;
    if (pendForum) forums.push(pendForum);
    entityArray(pend?.attributes?.sheirut?.data?.attributes?.forums).forEach((forum) => forums.push(forum));
  });

  entityArray(attrs.sheiruts).forEach((sheirut) => {
    entityArray(sheirut?.attributes?.forums).forEach((forum) => forums.push(forum));
  });

  // Wishoffer coordination chats — reachable as the volunteer (proposer side)…
  entityArray(attrs.ratson_proposals).forEach((proposal) => {
    const forum = proposal?.attributes?.forum?.data;
    if (forum) forums.push(forum);
  });

  // …and as the wish owner (ratsons → ratson_proposals → forum).
  entityArray(attrs.ratsons).forEach((ratson) => {
    entityArray(ratson?.attributes?.ratson_proposals).forEach((proposal) => {
      const forum = proposal?.attributes?.forum?.data;
      if (forum) forums.push(forum);
    });
  });

  return forums;
}
