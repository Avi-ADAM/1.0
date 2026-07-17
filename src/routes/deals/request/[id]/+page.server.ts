import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { qids } from '../../../../routes/api/send/qids.js';
import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';

async function gql<T = any>(
  fetchFn: typeof fetch,
  jwt: string,
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const endpoint = STRAPI_GRAPHQL;
  const res = await fetchFn(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || 'GraphQL error');
  return json.data as T;
}

export const load: PageServerLoad = async ({ locals, params, fetch }) => {
  const tok = (locals as any).tok as string | undefined;
  const uid = (locals as any).uid as string | undefined;

  if (!tok || !uid) throw redirect(302, '/login?from=deals');

  const query = (qids as Record<string, string>)['72getSheirutpendById'];
  if (!query) throw error(500, 'Missing query');

  try {
    const data = await gql(fetch, tok, query, { id: params.id });
    const node = data?.sheirutpend?.data;
    if (!node) throw error(404, 'Request not found');

    const attrs = node.attributes ?? {};
    const matanot = attrs.matanots?.data?.[0];
    const mAttrs = matanot?.attributes ?? {};
    const proj = attrs.project?.data;
    const user = attrs.users_permissions_user?.data;

    const isOwner = user?.id ? String(user.id) === String(uid) : false;
    const members = proj?.attributes?.user_1s?.data ?? [];
    const isProjectMember = members.some((u: any) => String(u.id) === String(uid));

    if (!isOwner && !isProjectMember) throw error(403, 'Not authorized');

    const votes = attrs.votes?.data ?? [];
    const voteCount = votes.filter((v: any) => v.attributes?.what === true).length;
    const alreadyVoted = votes.some((v: any) => {
      const voterId = String(v.attributes?.users_permissions_user?.data?.id ?? '');
      return voterId === String(uid) && v.attributes?.what === true;
    });

    const mAttrsFull = mAttrs;

    return {
      id: params.id,
      kind: isOwner ? 'buy' : 'sell',
      isSeller: !isOwner && isProjectMember,
      memberCount: members.length,
      voteCount,
      alreadyVoted,
      productId: matanot?.id || null,
      productName: mAttrsFull.name || '',
      productKindOf: mAttrsFull.kindOf || '',
      productPic: mAttrsFull.pic?.data?.attributes?.url || null,
      pricingMode: mAttrsFull.pricingMode || 'fixed',
      estimatedPrice: mAttrsFull.estimatedPrice || null,
      marginPct: mAttrsFull.marginPct || null,
      matanot_recipe_missions: mAttrsFull.matanot_recipe_missions?.data ?? [],
      matanot_recipe_resources: mAttrsFull.matanot_recipe_resources?.data ?? [],
      projectId: proj?.id || '',
      projectName: proj?.attributes?.projectName || '',
      projectPic: proj?.attributes?.profilePic?.data?.attributes?.url || null,
      price: Number(attrs.price) || 0,
      quant: Number(attrs.quant) || 0,
      total: Number(attrs.total) || 0,
      startDate: attrs.startDate || null,
      finnishDate: attrs.finnishDate || null,
      requesterId: user?.id || '',
      requesterName: user?.attributes?.username || '',
      requesterPic: user?.attributes?.profilePic?.data?.attributes?.url || null,
      votes: attrs.votes?.data ?? [],
      createdAt: attrs.createdAt || null,
      forumId: attrs.forum?.data?.id || null
    };
  } catch (e: any) {
    if (e?.status) throw e;
    throw error(500, e?.message || 'Failed to load request');
  }
};
