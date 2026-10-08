import { sendToSer } from '$lib/send/sendToSer.js';
import { matbeaCode } from '$lib/money/resolve.js';
import { error, redirect } from '@sveltejs/kit';
import { actionViaProxy } from '$lib/server/actionViaProxy.js';
import { enrichWish, placeKey, EMPTY_ENRICHMENT, type WishEnrichment } from '$lib/server/ai/enrichWish';
import { extractWish, type WishExtraction } from '$lib/server/ai/extractWish';
import { GEMINI_API_KEY } from '$env/static/private';
import { loadBell } from '$lib/server/concierge/bell';
import { loadWishNotices } from '$lib/server/concierge/notices';
import { negotiationView } from '$lib/server/wish/negotiationView';
import { normalizeRestime } from '$lib/wish/restime';
import { externalConfig } from '$lib/server/concierge/externalConfig';
import {
  DISABLED_PANEL,
  externalPanel,
  needsOf,
  proposalsFromLoader,
  type ExternalPanel
} from '$lib/server/concierge/externalView';
import type { PageServerLoad } from './$types';
import { wishGaps } from '$lib/wish/gaps';
import { lineNames } from '$lib/wish/lineNames';
import { readDealStages } from '$lib/server/deal/dealChain';
import { sendViaProxy } from '$lib/server/sendViaProxy.js';

type PublishedNeed = { name: string; extractedKey: string | null };

export type WishForumMessage = {
  id: string;
  from: string;
  text: string;
  sentByMe: boolean;
  ts: string | null;
};

function shortCode(id: string | number): string {
  const s = String(id).padStart(6, '0');
  return `R-${s.slice(-6)}`;
}

function nameOf(user: any): string {
  if (!user) return 'משתמש/ת';
  const a = user.attributes || user;
  return a.username || 'משתמש/ת';
}

function initials(name: string): string {
  const parts = String(name || '').trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).slice(0, 2) || 'מש';
}

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
  const uid = (locals as any)?.uid;
  const tok = (locals as any)?.tok;

  // Started first, awaited last: it runs beside the slow work below.
  const bellPending = loadBell(uid, fetch);
  const noticesPending = loadWishNotices(uid, fetch);

  let wish: any = null;
  let proposals: any[] = [];
  let loadOk = false;
  // "Not found" and "could not ask" are different answers — the page must never
  // fill the gap with a demo wish (QA_CONCIERGE_E2E C-6).
  let loadFailed = false;
  /** The raw qid-105 answer, for the gaps below (proposals with their covered slots). */
  let rawRatson: any = null;

  try {
    const res: any = await sendToSer(
      { id: params.id },
      '105queryRatsonWithProposals',
      0,
      0,
      false,
      fetch
    );

    // A GraphQL error comes back as a value, not a throw: no `data` at all means
    // we could not ask, which is not the same as "there is no such wish".
    if (!res?.data) loadFailed = true;

    const node = res?.data?.ratson?.data;
    rawRatson = res?.data ?? null;
    if (node) {
      const a = node.attributes || {};
      const owners = a.users_permissions_users?.data ?? [];
      const ownerName = nameOf(owners[0]);

      wish = {
        id: node.id,
        code: shortCode(node.id),
        name: a.name || '(ללא שם)',
        desc: a.desc || '',
        longDes: a.longDes || a.desc || '',
        status: a.status_ratson || (a.fulfilled ? 'fulfilled' : 'open'),
        // The terms as last edited (PLAN_DIRECT_OFFER §4.3) — every proposal's
        // signatures are read against it.
        termsDigest: a.terms_digest ?? null,
        // A direct offer (PLAN_DIRECT_OFFER): who wrote it for her, and when she took it.
        offeredBy: a.offered_by?.data ? { id: String(a.offered_by.data.id), name: a.offered_by.data.attributes?.username ?? '' } : null,
        claimedAt: a.claimed_at ?? null,
        fulfilled: !!a.fulfilled,
        fulfillmentScore: typeof a.fulfillment_score === 'number' ? a.fulfillment_score : null,
        lastMatchedAt: a.last_matched_at ?? null,
        createdAt: a.createdAt ?? null,
        startDate: a.startDate ?? null,
        finnishDate: a.finnishDate ?? null,
        totalBounti: typeof a.totalbounti === 'number' ? a.totalbounti : null,
        allowJoin: !!a.allowJoin,
        accessMode: a.access_mode ?? 'private',
        language: a.language ?? null,
        lat: a.lat ?? null,
        lng: a.lng ?? null,
        radius: a.radius ?? null,
        locationHint: a.location_hint ?? null,
        subCategory: a.sub_category ?? null,
        isOnline: !!a.isOnline,
        aiMeta: a.ai_meta ?? null,
        logoUrl:
          a.logo?.data?.attributes?.formats?.medium?.url ||
          a.logo?.data?.attributes?.url ||
          null,
        owners: owners.map((u: any) => ({ id: u.id, name: nameOf(u) })),
        ownerName,
        ownerAvatar: initials(ownerName),
        values: (a.vallues?.data ?? []).map((v: any) => ({ id: v.id, name: v.attributes?.valueName })),
        categories: (a.categories?.data ?? []).map((c: any) => ({ id: c.id, name: c.attributes?.name })),
        missions: (a.missions?.data ?? []).map((m: any) => ({ id: m.id, name: m.attributes?.missionName })),
        mashaabims: (a.mashaabims?.data ?? []).map((m: any) => ({ id: m.id, name: m.attributes?.name })),
        matanots: (a.matanots?.data ?? []).map((m: any) => ({ id: m.id, name: m.attributes?.name })),
        extractedMissions: (a.extracted_missions ?? []).map((e: any) => ({
          id: e.id,
          name: e.name,
          hoursEst: e.hoursEst ?? null,
          importance: e.importance || 'nice',
          notes: e.notes || '',
          linkedMissions: (e.missions?.data ?? []).map((m: any) => ({ id: m.id, name: m.attributes?.missionName }))
        })),
        extractedResources: (a.extracted_resources ?? []).map((e: any) => ({
          id: e.id,
          name: e.name,
          kindOf: e.kindOf ?? null,
          quantityEst: e.quantityEst ?? null,
          importance: e.importance || 'nice',
          notes: e.notes || '',
          linkedMashaabims: (e.mashaabims?.data ?? []).map((m: any) => ({ id: m.id, name: m.attributes?.name }))
        })),
        chatForumId: a.chat_forum?.data?.id ?? null,
        processId: a.process?.data?.id ?? null,
        derivedComplexMatanot: a.derivedComplexMatanot?.data
          ? { id: a.derivedComplexMatanot.data.id, name: a.derivedComplexMatanot.data.attributes?.name }
          : null,
      };

      // The wish's own pace — how long the other side has before silence answers for them.
      // Read on its own: the field only exists once 1.0b is deployed, and a failed read must
      // never take the page down (the default is 48 h).
      let restime = normalizeRestime(undefined);
      try {
        const rr: any = await sendToSer({ id: params.id }, '388getRatsonRestime', 0, 0, false, fetch);
        restime = normalizeRestime(rr?.data?.ratson?.data?.attributes?.restime);
      } catch {
        /* the default */
      }
      wish.restime = restime;

      // What the owner chose to hide (C-10) — her own view only, and read on its own for the
      // same reason as the pace: a backend without the field answers with an error, which
      // means "nothing is hidden", never a broken page.
      let hiddenIds = new Set<string>();
      if (owners.some((o: any) => String(o.id) === String(uid))) {
        try {
          const hr: any = await sendToSer({ idL: uid }, '394hiddenWishProposals', 0, 0, false, fetch);
          hiddenIds = new Set((hr?.data?.ratsonProposals?.data ?? []).map((h: any) => String(h.id)));
        } catch {
          /* nothing hidden */
        }
      }

      const propsNodes = (res?.data?.ratsonProposals?.data ?? []).filter((p: any) => !hiddenIds.has(String(p.id)));
      proposals = propsNodes.map((p: any) => {
        const pa = p.attributes || {};
        const proposerUsers = pa.proposer_users?.data ?? [];
        const project = pa.project?.data;
        const firstProposer = proposerUsers[0];
        const proposerName = firstProposer
          ? nameOf(firstProposer)
          : (project?.attributes?.projectName || 'מציע/ה');
        return {
          id: p.id,
          kind: pa.kind || 'existing_matanot',
          status: pa.status_proposal || 'suggested',
          matchScore: typeof pa.match_score === 'number' ? pa.match_score : null,
          totalPrice: typeof pa.total_price === 'number' ? pa.total_price : null,
          autoGenerated: !!pa.auto_generated,
          createdAt: pa.createdAt ?? null,
          proposerName,
          proposerAvatar: initials(proposerName),
          proposerUsers: proposerUsers.map((u: any) => ({ id: u.id, name: nameOf(u) })),
          proposerProject: project
            ? { id: project.id, name: project.attributes?.projectName }
            : null,
          matanot: pa.matanot?.data
            ? { id: pa.matanot.data.id, name: pa.matanot.data.attributes?.name }
            : null,
          forumId: pa.forum?.data?.id ?? null,
          // The terms negotiation from her side (C-9): whose move it is and what was said.
          negotiation: negotiationView(
            pa,
            {
              wisherIds: owners.map((o: any) => String(o.id)),
              proposerIds: proposerUsers.map((u: any) => String(u.id))
            },
            'wisher',
            restime,
            wish?.termsDigest ?? null
          ),
          negoIds: (pa.negos?.data ?? []).map((n: any) => n.id),
          currencyName: pa.matbea?.data?.attributes?.name ?? null,
          currencySymbol: pa.matbea?.data?.attributes?.simbol ?? '₪',
          currencyCode: matbeaCode(pa.matbea),
          coveredMissions: (pa.covered_missions ?? []).map((c: any) => ({
            id: c.id,
            extractedMissionIdx: c.extracted_mission_idx,
            hours: c.hours ?? null,
            price: c.price ?? null,
          })),
          coveredResources: (pa.covered_resources ?? []).map((c: any) => ({
            id: c.id,
            extractedResourceIdx: c.extracted_resource_idx,
            quantity: c.quantity ?? null,
            price: c.price ?? null,
          })),
        };
      });
      loadOk = true;
    }
  } catch (e) {
    loadFailed = true;
    console.error('[concierge/:id] 105queryRatsonWithProposals failed', e);
  }

  if (!wish) {
    throw error(
      loadFailed ? 503 : 404,
      loadFailed ? 'לא הצלחנו לטעון את המשאלה עכשיו. אפשר לנסות שוב בעוד רגע.' : 'המשאלה לא נמצאה.'
    );
  }

  const isOwner = wish ? wish.owners.some((o: any) => String(o.id) === String(uid)) : false;

  // Non-owners land on the public provider view.
  if (wish && !isOwner) {
    throw redirect(302, `/wish/${params.id}`);
  }

  // A draft has no plan to review yet — it is finished in the composer.
  if (wish && wish.status === 'draft') {
    throw redirect(302, `/concierge/new?draft=${params.id}`);
  }

  // The deal's stages (PLAN_DIRECT_OFFER P1): the requests and deals this wish
  // became, one tap away. Read while the rest loads; owner-only, like the page.
  const stagesP = readDealStages(
    (qid, vars) => sendViaProxy(fetch as any, qid, vars, { isSer: true }),
    { kind: 'wish', id: String(params.id) },
    'concierge/:id'
  );

  // ── Auto-extract on load ──────────────────────────────────────────────────
  //    A wish that loaded without a structured breakdown (created outside
  //    /concierge/new, or where the live extraction never ran) would otherwise
  //    open on an empty plan. Run the same Gemini extraction here, persist it,
  //    and continue with real data. Owner-only (we're past the non-owner
  //    redirect) and best-effort — a failure just leaves the panel empty (the
  //    page shows its empty state; it has no demo content to fall back on).
  if (
    isOwner &&
    wish &&
    wish.extractedMissions.length === 0 &&
    wish.extractedResources.length === 0
  ) {
    const wishText = String(wish.longDes || wish.desc || '').trim();
    if (wishText.length >= 20) {
      try {
        const extraction = await extractWish(wishText, GEMINI_API_KEY);
        if (extraction.missions.length > 0 || extraction.resources.length > 0) {
          // Reflect immediately in the shapes the page renders this load.
          wish.extractedMissions = extraction.missions.map((m) => ({
            id: null,
            name: m.name,
            hoursEst: null,
            importance: m.imp === 'must' ? 'must' : 'nice',
            notes: '',
            linkedMissions: []
          }));
          wish.extractedResources = extraction.resources.map((r) => ({
            id: null,
            name: r.name,
            kindOf: null,
            quantityEst: null,
            importance: r.imp === 'must' ? 'must' : 'nice',
            notes: '',
            linkedMashaabims: []
          }));
          // Carry inferred skills so the enrichment below can match people.
          wish.aiMeta = {
            ...(wish.aiMeta || {}),
            skills: extraction.skills.map((s) => s.name)
          };

          // Persist so the next load is instant and the breakdown is editable.
          if (uid && tok) {
            try {
              await actionViaProxy(fetch, 'updateRatsonExtraction', {
                ratsonId: String(wish.id),
                extracted_missions: wish.extractedMissions.map((m: any) => ({
                  name: m.name,
                  importance: m.importance
                })),
                extracted_resources: wish.extractedResources.map((r: any) => ({
                  name: r.name,
                  importance: r.importance
                }))
              });
            } catch (e) {
              console.warn('[concierge/:id] auto-extract persist failed (non-fatal):', e);
            }
          }
        }
      } catch (e) {
        console.warn('[concierge/:id] auto-extract failed (non-fatal):', e);
      }
    }
  }

  // Mission templates for the owner's offer-authoring form (specMode autofill).
  let missionTemplates: any[] = [];
  if (isOwner) {
    try {
      const tplRes: any = await sendToSer({}, 'getMissionTemplates', 0, 0, false, fetch);
      missionTemplates = tplRes?.data?.missions?.data ?? [];
    } catch (e) {
      console.warn('[concierge/:id] mission templates load failed (non-fatal):', e);
    }
  }

  // ── Real wish-forum messages (replaces the old demo FORUM_MSGS). Best-effort:
  //    getForumThread authorizes by participation, so a non-participant (e.g. a
  //    provider not yet added to the wish chat) just gets an empty thread rather
  //    than fabricated content. ──────────────────────────────────────────────
  let forumMessages: WishForumMessage[] = [];
  if (wish?.chatForumId && uid && tok) {
    try {
      const res = await actionViaProxy(fetch, 'getForumThread', {
        forumId: String(wish.chatForumId)
      });
      const msgs = res?.success ? res.data?.forum?.messages ?? [] : [];
      forumMessages = msgs.map((m: any) => ({
        id: String(m.id),
        from: m.username || 'משתמש/ת',
        text: m.message || '',
        sentByMe: !!m.sentByMe,
        ts: m.timestamp ?? null
      }));
    } catch (e) {
      console.warn('[concierge/:id] forum thread load failed (non-fatal):', e);
    }
  }

  // ── Ground the breakdown in the live platform: real members who hold the
  //    needed skills + currently-free resource instances (Sp).
  //
  //    Prefer the snapshot persisted at creation (ai_meta.enrichment) — the
  //    analysis already ran in /concierge/new, so we read it straight from
  //    Strapi instead of re-hitting Gemini/Pinecone on every page load. A
  //    snapshot that is missing, or was taken for another place, is recomputed
  //    and saved through `refreshWishMatches` (best-effort: a failure degrades
  //    to a live, unsaved recompute, then to an empty panel).
  let enrichment: WishEnrichment = EMPTY_ENRICHMENT;
  const savedEnrichment = wish?.aiMeta?.enrichment;
  const hasSavedEnrichment =
    savedEnrichment &&
    typeof savedEnrichment === 'object' &&
    ((savedEnrichment.people?.length ?? 0) > 0 ||
      (savedEnrichment.resources?.length ?? 0) > 0 ||
      (savedEnrichment.products?.length ?? 0) > 0 ||
      (savedEnrichment.missions?.length ?? 0) > 0);
  // A snapshot is only as good as the place it was filtered for: taken before
  // the wish had a location (or before locations counted at all), it may list
  // a grocery 100km away and miss the one around the corner.
  const wishPlace = wish
    ? { lat: wish.lat, lng: wish.lng, radius: wish.radius, isOnline: wish.isOnline }
    : null;
  // Snapshots that record their place are trusted even when empty ("nothing
  // reaches her yet" is an answer); older ones only when they have content
  // and the wish has no place to filter by.
  const snapshotFresh =
    !!savedEnrichment &&
    typeof savedEnrichment === 'object' &&
    ('place' in savedEnrichment
      ? (savedEnrichment.place ?? null) === placeKey(wishPlace)
      : hasSavedEnrichment && placeKey(wishPlace) === null);
  const hasNeeds =
    !!wish && (wish.extractedMissions.length > 0 || wish.extractedResources.length > 0);

  if (snapshotFresh) {
    enrichment = {
      skills: savedEnrichment.skills ?? [],
      missions: savedEnrichment.missions ?? [],
      people: savedEnrichment.people ?? [],
      resources: savedEnrichment.resources ?? [],
      products: savedEnrichment.products ?? [],
      place: savedEnrichment.place ?? null
    };
  } else if (hasNeeds) {
    // Recompute for the wish's place and save it, so the next load is instant.
    let refreshed = false;
    if (uid && tok) {
      try {
        const res = await actionViaProxy(fetch, 'refreshWishMatches', {
          ratsonId: String(wish.id)
        });
        if (res?.success && res.data?.enrichment) {
          enrichment = res.data.enrichment;
          refreshed = true;
        }
      } catch (e) {
        console.warn('[concierge/:id] refreshWishMatches failed (non-fatal):', e);
      }
    }
    if (!refreshed) {
      // Not saved (or the breakdown above was only extracted this load) —
      // compute for this render; still best-effort.
      try {
        const aiSkills: string[] = Array.isArray(wish.aiMeta?.skills) ? wish.aiMeta.skills : [];
        const extraction: WishExtraction = {
          missions: wish.extractedMissions.map((m: any) => ({
            name: m.name,
            imp: m.importance === 'must' ? 'must' : 'nice'
          })),
          resources: wish.extractedResources.map((r: any) => ({
            name: r.name,
            imp: r.importance === 'must' ? 'must' : 'nice'
          })),
          skills: aiSkills.map((name: string) => ({ name })),
          categories: [],
          titleSuggestion: '',
          hints: []
        };
        enrichment = await enrichWish(extraction, fetch, { place: wishPlace });
      } catch (e) {
        console.warn('[concierge/:id] enrichment failed (non-fatal):', e);
      }
    }
  }

  // ── Outside offers for the rows nothing inside answers
  //    (docs/inprogress/PLAN_CONCIERGE_EXTERNAL_SOURCES.md). Read-only here: the
  //    search itself is the `fetchExternalOffers` action, called by the page.
  let external: ExternalPanel = DISABLED_PANEL;
  if (wish && isOwner && hasNeeds) {
    const cfg = externalConfig();
    external = externalPanel({
      enabled: cfg.enabled,
      ttlHours: cfg.ttlHours,
      needs: needsOf(wish.extractedMissions, wish.extractedResources),
      enrichment,
      proposals: proposalsFromLoader(proposals),
      place: wishPlace,
      aiMetaExternal: wish.aiMeta?.external
    });
  }

  const bell = await bellPending;
  const notices = await noticesPending;

  // The parts still without a provider, exactly as closing will see them (QA C-19):
  // the same `wishGaps` the server runs, over the proposals *and* the product's BOM
  // lines — an invited supplier who holds a line is not a gap, which the page alone
  // could not know. Owner-only, open wish only, best-effort (null → the page's own count).
  let gaps: Array<{ label: string; imp: 'must' | 'nice' }> | null = null;
  // Which part of the plan each product line is, by name ($lib/wish/lineNames): an
  // invitation proposal points at its line, and the page puts it on that part's row.
  let partLines: Record<string, string[]> | null = null;
  const productId = rawRatson?.ratson?.data?.attributes?.derivedComplexMatanot?.data?.id;
  if (wish && isOwner && !wish.fulfilled && productId) {
    try {
      const rec: any = await sendToSer({ id: String(productId) }, '168wishRecipeForMaterialize', 0, 0, false, fetch);
      const m = rec?.data?.matanot?.data?.attributes;
      if (m) {
        partLines = lineNames(m);
        const ra = rawRatson?.ratson?.data?.attributes ?? {};
        gaps = wishGaps({
          extractedMissions: ra.extracted_missions,
          extractedResources: ra.extracted_resources,
          proposals: rawRatson?.ratsonProposals?.data ?? [],
          recipeMissions: m.matanot_recipe_missions?.data ?? [],
          recipeResources: m.matanot_recipe_resources?.data ?? []
        }).map((g) => ({ label: g.name, imp: g.isMust ? 'must' : 'nice' }));
      }
    } catch {
      /* the page counts by itself */
    }
  }

  // The needs this wish already published to the community (QA C-10): the row shows
  // "published" after a reload too, instead of offering a second publish that opened
  // a duplicate open mission. Owner-only and best-effort — the action itself refuses
  // a duplicate either way.
  let published: { missions: PublishedNeed[]; resources: PublishedNeed[] } = { missions: [], resources: [] };
  if (wish && isOwner) {
    try {
      const pr: any = await sendToSer({ ratson: String(params.id) }, '416wishPublishedNeeds', 0, 0, true, fetch);
      const pick = (n: any): PublishedNeed => ({
        name: String(n?.attributes?.name ?? ''),
        extractedKey: n?.attributes?.extractedKey != null ? String(n.attributes.extractedKey) : null
      });
      published = {
        missions: (pr?.data?.openMissions?.data ?? []).map(pick),
        resources: (pr?.data?.openMashaabims?.data ?? []).map(pick)
      };
    } catch {
      /* the buttons stay; the server still refuses a duplicate */
    }
  }

  const stages = await stagesP;

  return { wish, proposals, loadOk, uid, isOwner, enrichment, forumMessages, missionTemplates, external, bell, notices, published, gaps, stages, partLines };
};
