import { redirect, error } from '@sveltejs/kit';
import { fetchDealsForUser } from '$lib/server/deals/dealsQueries';
import { qids } from '../api/send/qids.js';
import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const tok = (locals as any).tok as string | undefined;
  const uid = (locals as any).uid as string | undefined;

  if (!tok || !uid) {
    throw redirect(302, '/login?from=deals');
  }

  // PLAN_RECURRING_SALES: my open monthly cycles as the paying customer of a
  // standing order — each asks "how much did you transfer this month?".
  let customerCycles: any[] = [];
  try {
    const res = await fetch(STRAPI_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tok}`
      },
      body: JSON.stringify({
        query: qids['dealsCustomerPendingCycles'],
        variables: { uid: String(uid) }
      })
    });
    const json = await res.json();
    customerCycles = (json?.data?.sales?.data ?? []).map((s: any) => {
      const at = s.attributes ?? {};
      return {
        id: s.id,
        cycleStart: at.cycleStart,
        cycleEnd: at.cycleEnd,
        note: at.note ?? '',
        customerAmount: at.customerAmount ?? null,
        customerReportedAt: at.customerReportedAt ?? null,
        sellerName: at.users_permissions_user?.data?.attributes?.username ?? '',
        productName: at.matanot?.data?.attributes?.name ?? '',
        projectName: at.project?.data?.attributes?.projectName ?? '',
        expectedAmount: at.recurringSource?.data?.attributes?.in ?? null
      };
    });
  } catch (e) {
    console.error('[deals/+page.server] Failed to load customer cycles:', e);
  }

  try {
    const result = await fetchDealsForUser(fetch, tok, String(uid));
    return {
      purchases: result.purchases,
      sales: result.sales,
      pendingBuy: result.pendingBuy,
      pendingSell: result.pendingSell,
      incomingWishes: result.incomingWishes,
      weaves: result.weaves,
      customerCycles,
      user: {
        username: result.username,
        profilePic: result.profilePic
      }
    };
  } catch (e: any) {
    console.error('[deals/+page.server] Failed to load deals:', e);
    throw error(500, e?.message || 'Failed to load deals');
  }
};
