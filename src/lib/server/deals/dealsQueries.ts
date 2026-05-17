import type { SaleData } from '$lib/stores/levStores';
import { mapSaleData } from '$lib/utils/levDataExtractors';
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
}

function mapSheirutpend(node: any, projectId?: string, projectName?: string): PendingRequestData {
  const attrs = node?.attributes ?? {};
  const matanot = attrs.matanots?.data?.[0];
  const mAttrs = matanot?.attributes ?? {};
  const proj = attrs.project?.data;
  const user = attrs.users_permissions_user?.data;

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
    createdAt: attrs.createdAt || undefined
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

export interface DealsForUserResult {
  purchases: SaleData[];
  sales: SaleData[];
  pendingBuy: PendingRequestData[];
  pendingSell: PendingRequestData[];
  userId: string;
  username: string;
  profilePic?: string;
}

export async function fetchDealsForUser(
  fetchFn: typeof fetch,
  jwt: string,
  userId: string
): Promise<DealsForUserResult> {
  const query = (qids as Record<string, string>)['123dealsForUser'];
  if (!query) throw new Error('qid 123dealsForUser missing');

  const data = await gql(fetchFn, jwt, query, { idL: userId });
  const userData = data?.usersPermissionsUser?.data;
  if (!userData) {
    return { purchases: [], sales: [], pendingBuy: [], pendingSell: [], userId, username: '' };
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
