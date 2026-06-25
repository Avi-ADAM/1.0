import { sendToSer } from '$lib/send/sendToSer.js';
import { redirect } from '@sveltejs/kit';
import { actionService } from '$lib/server/actions/index.js';
import { enrichWish, EMPTY_ENRICHMENT, type WishEnrichment } from '$lib/server/ai/enrichWish';
import { extractWish, type WishExtraction } from '$lib/server/ai/extractWish';
import { GEMINI_API_KEY } from '$env/static/private';
import type { PageServerLoad } from './$types';

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
  if (!user) return 'משתמשת';
  const a = user.attributes || user;
  return a.username || 'משתמשת';
}

function initials(name: string): string {
  const parts = String(name || '').trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).slice(0, 2) || 'מש';
}

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
  const uid = (locals as any)?.uid;
  const tok = (locals as any)?.tok;

  let wish: any = null;
  let proposals: any[] = [];
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
        fulfilled: !!a.fulfilled,
        fulfillmentScore: typeof a.fulfillment_score === 'number' ? a.fulfillment_score : null,
        lastMatchedAt: a.last_matched_at ?? null,
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

      const propsNodes = res?.data?.ratsonProposals?.data ?? [];
      proposals = propsNodes.map((p: any) => {
        const pa = p.attributes || {};
        const proposerUsers = pa.proposer_users?.data ?? [];
        const project = pa.project?.data;
        const firstProposer = proposerUsers[0];
        const proposerName = firstProposer
          ? nameOf(firstProposer)
          : (project?.attributes?.projectName || 'מציעה');
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
          negoIds: (pa.negos?.data ?? []).map((n: any) => n.id),
          currencyName: pa.matbea?.data?.attributes?.name ?? null,
          currencySymbol: pa.matbea?.data?.attributes?.simbol ?? '₪',
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
    console.error('[concierge/:id] 105queryRatsonWithProposals failed', e);
  }

  const isOwner = wish ? wish.owners.some((o: any) => String(o.id) === String(uid)) : false;

  // Non-owners land on the public provider view.
  if (wish && !isOwner) {
    throw redirect(302, `/wish/${params.id}`);
  }

  // ── Auto-extract on load ──────────────────────────────────────────────────
  //    A wish that loaded without a structured breakdown (created outside
  //    /concierge/new, or where the live extraction never ran) would otherwise
  //    fall through to the client's design-mock. Run the same Gemini extraction
  //    here, persist it, and continue with real data so the page never shows
  //    demo content for a real wish. Owner-only (we're past the non-owner
  //    redirect) and best-effort — a failure just leaves the panel empty.
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
              await actionService.executeAction(
                'updateRatsonExtraction',
                {
                  ratsonId: String(wish.id),
                  extracted_missions: wish.extractedMissions.map((m: any) => ({
                    name: m.name,
                    importance: m.importance
                  })),
                  extracted_resources: wish.extractedResources.map((r: any) => ({
                    name: r.name,
                    importance: r.importance
                  }))
                },
                {
                  userId: String(uid),
                  jwt: String(tok),
                  lang: String((locals as any)?.lang || 'he'),
                  fetch
                }
              );
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
      const res = await actionService.executeAction(
        'getForumThread',
        { forumId: String(wish.chatForumId) },
        { userId: String(uid), jwt: String(tok), lang: String((locals as any)?.lang || 'he'), fetch }
      );
      const msgs = res?.success ? res.data?.forum?.messages ?? [] : [];
      forumMessages = msgs.map((m: any) => ({
        id: String(m.id),
        from: m.username || 'משתמשת',
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
  //    Strapi instead of re-hitting Gemini/Pinecone on every page load. Only
  //    wishes created before this was stored fall back to a live recompute
  //    (still best-effort: a failure degrades to an empty panel).
  let enrichment: WishEnrichment = EMPTY_ENRICHMENT;
  const savedEnrichment = wish?.aiMeta?.enrichment;
  const hasSavedEnrichment =
    savedEnrichment &&
    typeof savedEnrichment === 'object' &&
    ((savedEnrichment.people?.length ?? 0) > 0 ||
      (savedEnrichment.resources?.length ?? 0) > 0 ||
      (savedEnrichment.products?.length ?? 0) > 0 ||
      (savedEnrichment.missions?.length ?? 0) > 0);

  if (hasSavedEnrichment) {
    enrichment = {
      skills: savedEnrichment.skills ?? [],
      missions: savedEnrichment.missions ?? [],
      people: savedEnrichment.people ?? [],
      resources: savedEnrichment.resources ?? [],
      products: savedEnrichment.products ?? []
    };
  } else if (wish && (wish.extractedMissions.length > 0 || wish.extractedResources.length > 0)) {
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
      enrichment = await enrichWish(extraction, fetch);
    } catch (e) {
      console.warn('[concierge/:id] enrichment failed (non-fatal):', e);
    }
  }

  return { wish, proposals, loadOk, uid, isOwner, enrichment, forumMessages, missionTemplates };
};
