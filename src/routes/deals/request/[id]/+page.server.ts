import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { sendViaProxy } from '$lib/server/sendViaProxy.js';
import { actionViaProxy } from '$lib/server/actionViaProxy.js';

export const load: PageServerLoad = async ({ locals, params, fetch }) => {
  const tok = (locals as any).tok as string | undefined;
  const uid = (locals as any).uid as string | undefined;

  if (!tok || !uid) throw redirect(302, '/login?from=deals');

  try {
    const data: any = await sendViaProxy(fetch, '72getSheirutpendById', { id: params.id });
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
    // Counted per round once prices are negotiated: a yes to an earlier price
    // is not a yes to the one on the table now.
    const yesAt = (order: number | null) =>
      votes.filter(
        (v: any) =>
          v.attributes?.what === true &&
          (order === null || Number(v.attributes?.order ?? 0) === order)
      );

    const mAttrsFull = mAttrs;

    // Price rounds and whose turn it is (PLAN_CONCIERGE_LOCAL_PROVIDERS §6).
    // Best-effort: without it the page behaves as it always did.
    let quote: any = null;
    try {
      const q = await actionViaProxy(fetch, 'getSheirutpendQuote', { sheirutpendId: params.id });
      if (q?.success && q.data?.state) quote = q.data;
    } catch (e) {
      console.warn('[deals/request] quote load failed (non-fatal):', e);
    }
    const roundVotes = yesAt(quote && quote.state.rounds.length > 0 ? quote.state.order : null);
    const memberIdSet = new Set(members.map((m: any) => String(m.id)));
    const voteCount = roundVotes.filter((v: any) =>
      memberIdSet.has(String(v.attributes?.users_permissions_user?.data?.id ?? ''))
    ).length;
    const alreadyVoted = roundVotes.some(
      (v: any) => String(v.attributes?.users_permissions_user?.data?.id ?? '') === String(uid)
    );

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
      forumId: attrs.forum?.data?.id || null,
      quote
    };
  } catch (e: any) {
    if (e?.status) throw e;
    throw error(500, e?.message || 'Failed to load request');
  }
};
