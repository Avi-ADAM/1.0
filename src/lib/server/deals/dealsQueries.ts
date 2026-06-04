import type { SaleData } from '$lib/stores/levStores';
import { mapSaleData } from '$lib/utils/levDataExtractors';
import { stripHtml } from '$lib/utils/stripHtml';
import { qids } from '../../../routes/api/send/qids.js';

export interface PendingRequestData {
  id: string;
  productName: string;
  productId?: string;
  productKindOf?: string;
  productPic?: string;
  projectId: string;
  projectName: string;
  price: number;
  quant: number;
  total: number;
  startDate?: string;
  finnishDate?: string;
  requesterId?: string;
  requesterName?: string;
  requesterPic?: string;
  createdAt?: string;
  /** Set when the Sheirutpend was opened from a Ratson (wish) — PLAN_CONCIERGE §5.1. */
  sourceRatsonId?: string;
  sourceRatsonName?: string;
  sourceProposalId?: string;
  sourceProposalKind?: string;
}

/**
 * A wish (Ratson) in which the current user was personally invited to provide a
 * task or resource — `requestSuggestion` Track B (PLAN_CONCIERGE §5). The wisher
 * picked this member directly, so the proposal carries them in `proposer_users`
 * rather than opening a Sheirutpend (which is what Track A / product requests do).
 */
export interface IncomingWishInvitation {
  proposalId: string;
  status: string;
  /** 'existing_project' | 'partial' — roughly person vs. resource invitation. */
  kind: string;
  createdAt?: string;
  ratsonId: string;
  ratsonName: string;
  ratsonDesc: string;
  ratsonStatus: string;
  startDate?: string;
  finnishDate?: string;
  totalBounti?: number | null;
  wisherName: string;
  wisherPic?: string;
  /** Main wish forum — where the conversation with the wisher happens. */
  chatForumId?: string;
  values: string[];
  categories: string[];
}

function mapWishInvitation(node: any): IncomingWishInvitation | null {
  const pa = node?.attributes ?? {};
  const ratNode = pa.ratson?.data;
  if (!ratNode) return null;
  const ra = ratNode.attributes ?? {};
  const wisher = ra.users_permissions_users?.data?.[0];

  return {
    proposalId: String(node.id),
    status: pa.status_proposal || 'suggested',
    kind: pa.kind || 'partial',
    createdAt: pa.createdAt || undefined,
    ratsonId: String(ratNode.id),
    ratsonName: ra.name || '',
    ratsonDesc: stripHtml(ra.longDes || ra.desc || ''),
    ratsonStatus: ra.status_ratson || 'open',
    startDate: ra.startDate || undefined,
    finnishDate: ra.finnishDate || undefined,
    totalBounti: typeof ra.totalbounti === 'number' ? ra.totalbounti : null,
    wisherName: wisher?.attributes?.username || '',
    wisherPic: wisher?.attributes?.profilePic?.data?.attributes?.url || undefined,
    chatForumId: ra.chat_forum?.data?.id ? String(ra.chat_forum.data.id) : undefined,
    values: (ra.vallues?.data ?? []).map((v: any) => v.attributes?.valueName).filter(Boolean),
    categories: (ra.categories?.data ?? []).map((c: any) => c.attributes?.name).filter(Boolean)
  };
}

function mapSheirutpend(node: any, projectId?: string, projectName?: string): PendingRequestData {
  const attrs = node?.attributes ?? {};
  const matanot = attrs.matanots?.data?.[0];
  const mAttrs = matanot?.attributes ?? {};
  const proj = attrs.project?.data;
  const user = attrs.users_permissions_user?.data;
  const rp = attrs.ratson_proposal?.data;
  const rpRatson = rp?.attributes?.ratson?.data;

  return {
    id: String(node.id),
    productName: mAttrs.name || '',
    productId: matanot?.id ? String(matanot.id) : undefined,
    productKindOf: mAttrs.kindOf || undefined,
    productPic: mAttrs.pic?.data?.attributes?.url || undefined,
    projectId: proj?.id ? String(proj.id) : (projectId ?? ''),
    projectName: proj?.attributes?.projectName || projectName || '',
    price: Number(attrs.price) || 0,
    quant: Number(attrs.quant) || 0,
    total: Number(attrs.total) || 0,
    startDate: attrs.startDate || undefined,
    finnishDate: attrs.finnishDate || undefined,
    requesterId: user?.id ? String(user.id) : undefined,
    requesterName: user?.attributes?.username || undefined,
    requesterPic: user?.attributes?.profilePic?.data?.attributes?.url || undefined,
    createdAt: attrs.createdAt || undefined,
    sourceRatsonId: rpRatson?.id ? String(rpRatson.id) : undefined,
    sourceRatsonName: rpRatson?.attributes?.name || undefined,
    sourceProposalId: rp?.id ? String(rp.id) : undefined,
    sourceProposalKind: rp?.attributes?.kind || undefined
  };
}

async function gql<T = any>(
  fetchFn: typeof fetch,
  jwt: string,
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const endpoint = (import.meta.env.VITE_URL as string) + '/graphql';
  const res = await fetchFn(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'GraphQL error');
  }
  return json.data as T;
}

function isActiveSheirut(attrs: any): boolean {
  if (!attrs) return false;
  if (attrs.archived) return false;
  if (!attrs.isApruved) return false;
  if (attrs.moneyTransfered && attrs.productExepted) return false;
  return true;
}

/** A weave (project) the user belongs to — host options for a wish contribution. */
export interface UserWeave {
  id: string;
  name: string;
  src?: string;
  memberCount: number;
  restime?: string;
  memberIds: string[];
}

export async function fetchUserWeaves(
  fetchFn: typeof fetch,
  jwt: string,
  userId: string
): Promise<UserWeave[]> {
  const query = (qids as Record<string, string>)['141listMyWeavesDetailed'];
  if (!query) return [];
  try {
    const data = await gql(fetchFn, jwt, query, { uid: userId });
    const nodes = data?.usersPermissionsUser?.data?.attributes?.projects_1s?.data ?? [];
    return nodes.map((p: any) => {
      const a = p.attributes ?? {};
      const members = a.user_1s?.data ?? [];
      return {
        id: String(p.id),
        name: a.projectName || '',
        src: a.profilePic?.data?.attributes?.url || undefined,
        memberCount: members.length,
        restime: a.restime || undefined,
        memberIds: members.map((m: any) => String(m.id))
      };
    });
  } catch (e) {
    console.error('[deals] fetchUserWeaves failed (non-fatal):', e);
    return [];
  }
}

export interface DealsForUserResult {
  purchases: SaleData[];
  sales: SaleData[];
  pendingBuy: PendingRequestData[];
  pendingSell: PendingRequestData[];
  incomingWishes: IncomingWishInvitation[];
  weaves: UserWeave[];
  userId: string;
  username: string;
  profilePic?: string;
}

/**
 * Wish invitations addressed to me — `requestSuggestion` Track B. Best-effort:
 * a failure here (e.g. ratson-proposal not yet deployed) returns an empty list
 * rather than breaking the whole deals page.
 */
export async function fetchWishInvitationsForUser(
  fetchFn: typeof fetch,
  jwt: string,
  userId: string
): Promise<IncomingWishInvitation[]> {
  const query = (qids as Record<string, string>)['111listMyWishInvitations'];
  if (!query) return [];

  try {
    const data = await gql(fetchFn, jwt, query, { uid: userId, limit: 60 });
    const nodes = data?.ratsonProposals?.data ?? [];
    return nodes
      .map(mapWishInvitation)
      .filter((x: IncomingWishInvitation | null): x is IncomingWishInvitation => x !== null);
  } catch (e) {
    console.error('[deals] fetchWishInvitationsForUser failed (non-fatal):', e);
    return [];
  }
}

export async function fetchDealsForUser(
  fetchFn: typeof fetch,
  jwt: string,
  userId: string
): Promise<DealsForUserResult> {
  const query = (qids as Record<string, string>)['123dealsForUser'];
  if (!query) throw new Error('qid 123dealsForUser missing');

  // Fetch the user's deal data, their personal wish invitations, and their
  // weaves (host options for contributing) together.
  const [data, incomingWishes, weaves] = await Promise.all([
    gql(fetchFn, jwt, query, { idL: userId }),
    fetchWishInvitationsForUser(fetchFn, jwt, userId),
    fetchUserWeaves(fetchFn, jwt, userId)
  ]);
  const userData = data?.usersPermissionsUser?.data;
  if (!userData) {
    return {
      purchases: [],
      sales: [],
      pendingBuy: [],
      pendingSell: [],
      incomingWishes,
      weaves,
      userId,
      username: ''
    };
  }

  const purchases: SaleData[] = [];
  for (const sheirut of userData.attributes?.sheiruts?.data ?? []) {
    if (!isActiveSheirut(sheirut?.attributes)) continue;
    const projectId = sheirut?.attributes?.project?.data?.id || '';
    purchases.push(mapSaleData(sheirut, projectId, userData, 'buy'));
  }

  const pendingBuy: PendingRequestData[] = [];
  for (const sp of userData.attributes?.sheirutpends?.data ?? []) {
    pendingBuy.push(mapSheirutpend(sp));
  }

  const sales: SaleData[] = [];
  const pendingSell: PendingRequestData[] = [];
  for (const project of userData.attributes?.projects_1s?.data ?? []) {
    for (const sheirut of project?.attributes?.sheiruts?.data ?? []) {
      if (!isActiveSheirut(sheirut?.attributes)) continue;
      sales.push(mapSaleData(sheirut, project.id, userData, 'sale'));
    }
    for (const sp of project?.attributes?.sheirutpends?.data ?? []) {
      pendingSell.push(mapSheirutpend(sp, project.id, project?.attributes?.projectName));
    }
  }

  return {
    purchases,
    sales,
    pendingBuy,
    pendingSell,
    incomingWishes,
    weaves,
    userId,
    username: userData.attributes?.username || '',
    profilePic: userData.attributes?.profilePic?.data?.attributes?.url || ''
  };
}

export interface SingleDealResult {
  sale: SaleData | null;
  kind: 'sale' | 'purchase' | null;
}

export async function fetchSingleDeal(
  fetchFn: typeof fetch,
  jwt: string,
  userId: string,
  sheirutId: string,
  username?: string
): Promise<SingleDealResult> {
  const query = (qids as Record<string, string>)['124sheirutForDeal'];
  if (!query) throw new Error('qid 124sheirutForDeal missing');

  const data = await gql(fetchFn, jwt, query, { id: sheirutId });
  const sheirut = data?.sheirut?.data;
  if (!sheirut) return { sale: null, kind: null };

  const attrs = sheirut.attributes;
  const projectId = attrs?.project?.data?.id || '';
  const projectMembers: any[] = attrs?.project?.data?.attributes?.user_1s?.data ?? [];
  const customers: any[] = attrs?.users_permissions_users?.data ?? [];

  const isCustomer = customers.some((u: any) => String(u.id) === String(userId));
  const isProjectMember = projectMembers.some((u: any) => String(u.id) === String(userId));

  let kind: 'sale' | 'purchase' | null = null;
  if (isCustomer) kind = 'purchase';
  else if (isProjectMember) kind = 'sale';
  else return { sale: null, kind: null };

  const userData = { id: userId, attributes: { username: username || '' } };
  const sale = mapSaleData(sheirut, projectId, userData, kind === 'purchase' ? 'buy' : 'sale');

  return { sale, kind };
}
