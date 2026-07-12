import { sendToSer } from '$lib/send/sendToSer.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Public maagad (demand pool) page — PLAN_DISCOVERY_MAP M2,
 * PLAN_SHARED_PURCHASE §12.
 *
 * Privacy (§2.6) is enforced here, server-side: members are exposed as
 * aggregate counts; a name leaves the server only for members who chose
 * `first_name` / `full` visibility. The caller's own membership is returned
 * so the UI can render join/leave/sign states.
 */
export const load: PageServerLoad = async ({ params, locals, fetch }) => {
  const uid = (locals as any)?.uid ?? null;

  // Public page: anonymous visitors read via the service token (no Strapi
  // Public-role permission needed); logged-in users use their own JWT. `uid`
  // still comes from the cookie either way, so `my` membership resolves.
  const res: any = await sendToSer(
    { id: params.id },
    '229queryMaagadFull',
    0,
    0,
    !uid,
    fetch
  ).catch((e: any) => {
    console.error('[maagad/:id] 229queryMaagadFull failed', e);
    return null;
  });

  const node = res?.data?.maagad?.data;
  if (!node) throw error(404, 'המאגד לא נמצא');
  const a = node.attributes ?? {};

  const members = a.members?.data ?? [];
  const activeStatuses = new Set(['interested', 'signed', 'active']);
  const activeMembers = members.filter((m: any) =>
    activeStatuses.has(m?.attributes?.status_member)
  );

  const namedMembers = activeMembers
    .filter((m: any) => m?.attributes?.visibility && m.attributes.visibility !== 'anonymous')
    .map((m: any) => {
      const username = m.attributes?.user?.data?.attributes?.username ?? '';
      const name =
        m.attributes.visibility === 'first_name'
          ? String(username).split(/\s+/)[0]
          : String(username);
      return { name, avatar: m.attributes?.user?.data?.attributes?.profilePic?.data?.attributes?.url ?? null };
    })
    .filter((m: any) => m.name);

  let my: { memberId: string; status: string; signedOfferId: string | null } | null = null;
  if (uid) {
    const mine = members.find(
      (m: any) => String(m?.attributes?.user?.data?.id) === String(uid)
    );
    if (mine) {
      my = {
        memberId: String(mine.id),
        status: mine.attributes?.status_member ?? 'suggested',
        signedOfferId: mine.attributes?.signed_offer?.data?.id
          ? String(mine.attributes.signed_offer.data.id)
          : null
      };
    }
  }

  const offers = (a.offers?.data ?? []).map((o: any) => {
    const oa = o.attributes ?? {};
    return {
      id: String(o.id),
      title: oa.title ?? '',
      description: oa.description ?? '',
      unitPrice: oa.unit_price ?? null,
      currency: oa.currency?.data?.attributes?.name ?? null,
      priceTiers: oa.price_tiers ?? null,
      min: oa.min_participants ?? null,
      max: oa.max_participants ?? null,
      deadline: oa.sign_deadline ?? null,
      options: oa.options ?? null,
      recurrence: oa.recurrence ?? 'one_time',
      cancellationTerms: oa.cancellation_terms ?? null,
      status: oa.status_offer ?? 'open',
      signedCount: oa.signed_count ?? 0,
      proposerName:
        oa.proposer_project?.data?.attributes?.projectName ??
        oa.proposer_user?.data?.attributes?.username ??
        null,
      proposerIsMe: uid
        ? String(oa.proposer_user?.data?.id ?? '') === String(uid)
        : false
    };
  });

  // Matching existing supply (PLAN_USER_OFFERINGS §4.7 / M8, keyword v1):
  // products (rikma + personal, via 203) and priced mission offers (271) whose
  // names match the pool's name/categories. Discovery bridge only — a formal
  // offer still goes through the pool's threshold-offer flow.
  const terms = [a.name, ...(a.categories?.data ?? []).map((c: any) => c?.attributes?.name)]
    .map((s: any) => (typeof s === 'string' ? s.trim() : ''))
    .filter((s: string) => s.length >= 2)
    .slice(0, 3);
  const productById = new Map<string, any>();
  const offerByUserMission = new Map<string, any>();
  await Promise.all(
    terms.flatMap((q) => [
      sendToSer({ q }, '203findMatanotByText', 0, 0, true, fetch)
        .then((r: any) => {
          for (const n of r?.data?.matanots?.data ?? []) {
            if (productById.has(String(n.id))) continue;
            productById.set(String(n.id), {
              id: String(n.id),
              name: n.attributes?.name ?? '',
              price: n.attributes?.price ?? n.attributes?.estimatedPrice ?? null,
              sellerName: n.attributes?.projectcreates?.data?.[0]?.attributes?.projectName ?? null
            });
          }
        })
        .catch(() => {}),
      sendToSer({ q }, '271findMissionOffersByText', 0, 0, true, fetch)
        .then((r: any) => {
          for (const n of r?.data?.missionOffers?.data ?? []) {
            const oa = n.attributes ?? {};
            const owner = oa.users_permissions_user?.data;
            const key = `${owner?.id ?? ''}-${oa.mission?.data?.id ?? n.id}`;
            if (offerByUserMission.has(key)) continue;
            offerByUserMission.set(key, {
              id: String(n.id),
              name: oa.name ?? oa.mission?.data?.attributes?.missionName ?? '',
              perhour: oa.perhour ?? null,
              price: oa.price ?? null,
              ownerId: owner?.id ? String(owner.id) : null,
              ownerName: owner?.attributes?.username ?? null,
              mine: uid && owner?.id ? String(owner.id) === String(uid) : false
            });
          }
        })
        .catch(() => {})
    ])
  );
  const supplySuggestions = {
    products: [...productById.values()].slice(0, 6),
    missionOffers: [...offerByUserMission.values()].slice(0, 6)
  };

  return {
    uid,
    isLoggedIn: !!uid,
    supplySuggestions,
    maagad: {
      id: String(node.id),
      name: a.name ?? '',
      desc: a.canonical_desc ?? '',
      scope: a.scope ?? 'local',
      frequency: a.frequency ?? null,
      status: a.status_maagad ?? 'forming',
      origin: a.origin ?? 'system_cluster',
      viabilityHint: a.viability_hint ?? null,
      lat: a.lat ?? null,
      lng: a.lng ?? null,
      radius: a.radius ?? null,
      createdAt: a.createdAt ?? null,
      categories: (a.categories?.data ?? [])
        .map((c: any) => c?.attributes?.name)
        .filter(Boolean),
      membersCount: activeMembers.length,
      namedMembers,
      offers
    },
    my
  };
};
