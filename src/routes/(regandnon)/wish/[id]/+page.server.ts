import { sendToSer } from '$lib/send/sendToSer.js';
import { error } from '@sveltejs/kit';
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

export const load: PageServerLoad = async ({ params, fetch }) => {
  let wish: any = null;
  let proposalsCount = 0;
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

    // Public access guard. Current schema enum is { personal, free_threshold, pay_to_access }
    // — there is no explicit "public" value. We treat `personal` as private and
    // everything else as community-viewable. The plan (§9) calls for a dedicated
    // `public`/`friends` value; revisit when that enum is added.
    if (a.access_mode === 'personal') {
      throw error(403, 'משאלה זו אינה פתוחה לציבור');
    }

    const owners = a.users_permissions_users?.data ?? [];
    const ownerName = nameOf(owners[0]);

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

    proposalsCount = res?.data?.ratsonProposals?.data?.length ?? 0;
    loadOk = true;
  } catch (e: any) {
    if (e?.status) throw e;
    console.error('[wish/:id] 105queryRatsonWithProposals failed', e);
  }

  return { wish, proposalsCount, loadOk };
};
