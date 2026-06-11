import { sendToSer } from '$lib/send/sendToSer.js';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

function shortCode(id: string | number): string {
  const s = String(id).padStart(6, '0');
  return `R-${s.slice(-6)}`;
}

function nameOf(user: any): string {
  if (!user) return 'משתמשת';
  const a = user.attributes || user;
  return a.username || 'משתמשת';
}

function initials(name: string): string {
  const parts = String(name || '').trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).slice(0, 2) || 'מש';
}

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
  const uid = (locals as any)?.uid ?? null;

  let wish: any = null;
  let proposalsCount = 0;
  let myProposals: any[] = [];
  let loadOk = false;

  try {
    const res: any = await sendToSer(
      { id: params.id },
      '105queryRatsonWithProposals',
      0,
      0,
      false,
      fetch
    );

    const node = res?.data?.ratson?.data;
    if (!node) {
      throw error(404, 'משאלה לא נמצאה');
    }

    const a = node.attributes || {};

    // Public access guard — `personal` means private.
    if (a.access_mode === 'personal') {
      // If the owner is viewing their own private wish via the /wish URL, redirect them
      // to their management page rather than blocking.
      const owners = a.users_permissions_users?.data ?? [];
      const isOwnerHere = owners.some((o: any) => String(o.id) === String(uid));
      if (isOwnerHere) {
        throw redirect(302, `/concierge/${params.id}`);
      }
      throw error(403, 'משאלה זו אינה פתוחה לציבור');
    }

    const owners = a.users_permissions_users?.data ?? [];
    const ownerName = nameOf(owners[0]);

    // Owner always manages from the concierge view.
    const isOwner = owners.some((o: any) => String(o.id) === String(uid));
    if (isOwner) {
      throw redirect(302, `/concierge/${params.id}`);
    }

    wish = {
      id: node.id,
      code: shortCode(node.id),
      name: a.name || '(ללא שם)',
      longDes: a.longDes || a.desc || '',
      status: a.status_ratson || (a.fulfilled ? 'fulfilled' : 'open'),
      fulfilled: !!a.fulfilled,
      startDate: a.startDate ?? null,
      finnishDate: a.finnishDate ?? null,
      totalBounti: typeof a.totalbounti === 'number' ? a.totalbounti : null,
      accessMode: a.access_mode ?? 'public',
      locationHint: a.location_hint ?? null,
      ownerName,
      ownerAvatar: initials(ownerName),
      values: (a.vallues?.data ?? []).map((v: any) => v.attributes?.valueName).filter(Boolean),
      categories: (a.categories?.data ?? []).map((c: any) => c.attributes?.name).filter(Boolean),
      extractedMissions: (a.extracted_missions ?? []).map((e: any) => ({
        id: e.id,
        name: e.name,
        hoursEst: e.hoursEst ?? null,
        importance: e.importance || 'nice',
      })),
      extractedResources: (a.extracted_resources ?? []).map((e: any) => ({
        id: e.id,
        name: e.name,
        quantityEst: e.quantityEst ?? null,
        importance: e.importance || 'nice',
      })),
    };

    const allProposals = res?.data?.ratsonProposals?.data ?? [];
    proposalsCount = allProposals.length;

    // Proposals where the current (logged-in) user is listed as proposer.
    if (uid) {
      myProposals = allProposals
        .filter((p: any) =>
          (p.attributes?.proposer_users?.data ?? []).some(
            (u: any) => String(u.id) === String(uid)
          )
        )
        .map((p: any) => {
          const pa = p.attributes || {};
          return {
            id: String(p.id),
            kind: pa.kind || 'custom_offer',
            status: pa.status_proposal || 'suggested',
            totalPrice: typeof pa.total_price === 'number' ? pa.total_price : null,
            coveredMissions: (pa.covered_missions ?? []).map((c: any) => ({
              id: String(c.id ?? ''),
              extractedMissionIdx: String(c.extracted_mission_idx ?? ''),
              hours: c.hours ?? null,
              price: c.price ?? null
            })),
            coveredResources: (pa.covered_resources ?? []).map((c: any) => ({
              id: String(c.id ?? ''),
              extractedResourceIdx: String(c.extracted_resource_idx ?? ''),
              quantity: c.quantity ?? null,
              price: c.price ?? null
            }))
          };
        });
    }

    loadOk = true;
  } catch (e: any) {
    if (e?.status) throw e;
    console.error('[wish/:id] 105queryRatsonWithProposals failed', e);
  }

  return { wish, proposalsCount, myProposals, uid, isLoggedIn: !!uid, loadOk };
};
