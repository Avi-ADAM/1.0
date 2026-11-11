/**
 * Create Resource Action Configuration
 *
 * This action creates a new resource requirement (OpenMashaabim or Pmash) in a project.
 * Supports full self-assignment flow:
 *  - Single-user project  → createOpenMashaabim (open resource)
 *  - Multi-user project   → createPmash (pending assignment)
 *  - Self-assigned        → also creates Sp (personal resource record) if needed,
 *                           then Maap (pending) or Rikmash (received) accordingly
 *  - Pmash               → also creates Timegrama for deadline tracking
 */

import { noticeSubject } from '$lib/notices/links';
import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { matchOpenMashaabimToUsers } from '$lib/server/matching/engine';
import {
  inviteToOpenResource,
  normalizeInviteEmail,
  type MissionInviteOutcome
} from '$lib/server/invites/missionInvite.js';
import { storePendingInvite } from '$lib/server/invites/pendingInvites.js';
import { restimeLabel, voteUrl } from './actionUtils.js';
import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';
import { ENTRY_CURRENCY_PARAM, entryFields, normalizeEntry } from '$lib/server/money/normalizeEntry.js';
import { resolveRecurringPlan, cycleWindowIso } from '$lib/recurring/recurringPlan.js';
import {
  readBackfillEntries,
  normalizeBackfill,
  pastCycleWindows,
  backfillPayload,
  MAX_BACKFILL_CYCLES
} from '$lib/recurring/backfill';
import { settleBackfill } from '$lib/server/recurring/settleBackfill';
import { bestEffort } from '$lib/server/resources/bookingStore.js';
import { openGrantBooking } from '$lib/server/resources/grantBooking.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { scope, decisionScope, scopeList } from '$lib/realtime/scopes.js';
import { ensureCandidacyTimegrama } from '../../nego/timegrama.js';

// ─── helpers ───────────────────────────────────────────────────────────────
async function gql(
  fetchFn: typeof fetch,
  jwt: string,
  query: string,
  variables?: Record<string, unknown>
) {
  const res = await fetchFn(STRAPI_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

async function ensureMashaabim(
  fetchFn: typeof fetch,
  jwt: string,
  input: {
    id?: unknown;
    name: string;
    description?: string;
    price?: number;
    kindOf?: string;
    linkto?: string;
    publishedAt: string;
  }
) {
  if (input.id) return String(input.id);

  const existing = await gql(fetchFn, jwt, `
    query FindMashaabim($name: String!) {
      mashaabims(filters: { name: { eqi: $name } }, pagination: { limit: 1 }) {
        data { id }
      }
    }
  `, { name: input.name });

  const existingId = existing?.mashaabims?.data?.[0]?.id;
  if (existingId) return String(existingId);

  const created = await gql(fetchFn, jwt, `
    mutation CreateMashaabim($data: MashaabimInput!) {
      createMashaabim(data: $data) {
        data { id }
      }
    }
  `, {
    data: {
      name: input.name,
      descrip: input.description || '',
      price: input.price || 0,
      kindOf: input.kindOf || 'total',
      linkto: input.linkto || '',
      publishedAt: input.publishedAt
    }
  });

  const createdId = created?.createMashaabim?.data?.id;
  if (!createdId) throw new Error('Failed to create Mashaabim');
  return String(createdId);
}

// ─── recurring-resource helpers ──────────────────────────────────────────
async function createMashabetahalichRecord(
  fetchFn: typeof fetch,
  jwt: string,
  data: Record<string, unknown>
): Promise<string> {
  const res = await gql(fetchFn, jwt, `
    mutation MrCreateMashabetahalich($data: MashabetahalichInput!) {
      createMashabetahalich(data: $data) { data { id } }
    }
  `, { data });
  const id = res?.createMashabetahalich?.data?.id;
  if (!id) throw new Error('Failed to create Mashabetahalich');
  return String(id);
}

// ─── location helper ───────────────────────────────────────────────────────
function buildLocationInput(
  isOnline?: boolean,
  lat?: number | null,
  lng?: number | null,
  radius?: number | null,
  location_hint?: string | null
): Record<string, unknown> | null {
  if (lat == null && lng == null && !location_hint && isOnline === undefined) return null;
  const loc: Record<string, unknown> = {};
  if (lat != null) loc.lat = lat;
  if (lng != null) loc.lng = lng;
  if (radius != null) loc.radius = Math.round(radius);
  if (location_hint) loc.location_hint = location_hint;
  if (isOnline === true) loc.location_mode = 'online';
  return Object.keys(loc).length > 0 ? loc : null;
}

// ─── handler ───────────────────────────────────────────────────────────────
const createResourceHandler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const {
    projectId,
    name,
    description = '',
    price: priceTyped = 0,
    kindOf = 'total',
    hm = 1,
    spnot = '',
    easy: easyTyped = 0,
    linkto = '',
    mashaabimId,
    startDate,
    endDate,
    // Self-assignment params
    isAssigned: isAssignedParam = false,
    // Offer the resource to a member (docs/inprogress/PLAN_RESOURCE_ASSIGNMENT.md).
    // Self → the self-assignment flow; another member → an Askm they answer.
    assignedUserId,
    isReceived = false,
    recurring = false,     // monthly/yearly recurring expense (server rent, apartment…)
    cycleSize = 1,         // recurrence period in units of kindOf (e.g. every N months)
    existingSpId,          // ID of an existing Sp record (personal resource)
    restime,               // response-time string used for Timegrama deadline
    isOnline,
    lat,
    lng,
    radius,
    location_hint,
    // "Invite someone new to this resource" (PLAN_INVITE_PARTNER_TO_MISSION):
    // the resource stays open; the invitee offers it and the rikma approves as
    // usual. `{ email? }` — without an email it is a link-only invite.
    invite
  } = params;

  // Who brings it. `assignedUserId` naming the creator is the self-assignment
  // flow under another name; naming another member is an offer to them — an
  // Askm with no Sp, which they answer by choosing or creating the resource
  // they bring (provideAssignedResource). Their silence is not their yes.
  const assigneeId =
    assignedUserId != null && String(assignedUserId).trim() !== '' && String(assignedUserId) !== 'self'
      ? String(assignedUserId)
      : null;
  const assignsOther = assigneeId != null && assigneeId !== String(context.userId);
  const isAssigned = !assignsOther && (Boolean(isAssignedParam) || String(assignedUserId) === 'self' || assigneeId != null);
  if (assignsOther && isAssignedParam) {
    throw new Error('A resource is either yours to provide or offered to another member — not both');
  }
  if (assignsOther && isReceived) {
    throw new Error('A resource offered to another member cannot be marked as already received');
  }

  // Checked before anything is written, so a bad address cannot leave a
  // resource behind whose invite was silently lost.
  const wantsInvite = invite != null && typeof invite === 'object';
  if (wantsInvite && assignsOther) {
    throw new Error('A resource offered to a member is not open — it cannot also carry an invite');
  }
  const inviteEmail = wantsInvite ? normalizeInviteEmail((invite as any).email) : undefined;
  if (wantsInvite && isAssigned) {
    throw new Error('A resource with an invite is open — it cannot also be self-assigned');
  }

  if ((kindOf === 'monthly' || kindOf === 'yearly') && !startDate) {
    throw new Error('Start date is required for monthly and yearly resources');
  }
  // Non-recurring monthly/yearly resources are priced over a fixed window and
  // still need an end date; recurring ones run until the user marks them done.
  if ((kindOf === 'monthly' || kindOf === 'yearly') && !recurring && !endDate) {
    throw new Error('End date is required for fixed-term monthly and yearly resources');
  }

  const now = new Date().toISOString();
  const f = context.fetch as typeof fetch;
  const jwt = context.jwt as string;
  const userId = context.userId as string;

  // Past cycles of a recurring expense (src/lib/recurring/backfill.ts) — only at
  // creation, and only for a named member: the creator, or another member who
  // must then agree explicitly.
  const rawBackfill = readBackfillEntries(params.backfill);
  if (rawBackfill.length > 0) {
    if (!(recurring && (kindOf === 'monthly' || kindOf === 'yearly'))) {
      throw new Error('Past cycles can only be entered for a recurring monthly or yearly resource');
    }
    // The table says what one named member paid — an open resource that anybody
    // may yet provide has nobody to have paid it.
    if (!isAssigned && !assignsOther) {
      throw new Error('Past cycles can only be entered for a resource assigned to a member of this rikma');
    }
    if (rawBackfill.some((e) => e.amount < 0)) {
      throw new Error('A past cycle cannot have a negative amount');
    }
    const windows = pastCycleWindows(kindOf === 'yearly' ? 'year' : 'month', startDate, cycleSize);
    if (windows.length === 0) {
      throw new Error('Past cycles need a start date before the current cycle');
    }
    if (windows.length > MAX_BACKFILL_CYCLES) {
      throw new Error(`At most ${MAX_BACKFILL_CYCLES} past cycles can be entered — choose a later start date`);
    }
  }

  // Both prices were typed in the writer's currency; the rikma counts in its
  // own (PLAN_MULTI_CURRENCY C5). Nothing is read when `entryCurrency` is absent.
  // The past cycles were typed in the same currency and ride the same rate.
  const typedAmounts: Record<string, number> = {
    price: Number(priceTyped) || 0,
    easy: Number(easyTyped) || 0
  };
  rawBackfill.forEach((e, i) => {
    typedAmounts[`bf${i}`] = e.amount;
  });
  const entry = await normalizeEntry({
    amounts: typedAmounts,
    entryCurrency: params.entryCurrency,
    projectId,
    jwt,
    fetchFn: f
  });
  const price = entry.values.price ?? 0;
  const easy = entry.values.easy ?? 0;
  const convertedBackfill = rawBackfill.map((e, i) => ({ key: e.key, amount: entry.values[`bf${i}`] ?? 0 }));
  const ensuredMashaabimId = await ensureMashaabim(f, jwt, {
    id: mashaabimId,
    name,
    description,
    price,
    kindOf,
    linkto,
    publishedAt: now
  });

  // ── 1. Determine project member count ───────────────────────────────────
  const projectData = await gql(f, jwt, `
    query GetProjectUsers($id: ID!) {
      project(id: $id) {
        data {
          attributes {
            restime
            projectName
            profilePic { data { attributes { url } } }
            user_1s { data { id attributes { username } } }
          }
        }
      }
    }
  `, { id: projectId });

  const projAttrs = projectData?.project?.data?.attributes ?? {};
  const members: any[] = projAttrs.user_1s?.data ?? [];
  const userCount = members.length;
  const projectName: string = projAttrs.projectName ?? '';
  const projectPic: string =
    projAttrs.profilePic?.data?.attributes?.url ??
    'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png';
  const creatorName: string =
    members.find((m) => String(m.id) === String(userId))?.attributes?.username ?? '';
  const effectiveRestime: string = (restime as string) || projAttrs.restime || 'feh';

  if (assignsOther && !members.some((m) => String(m.id) === assigneeId)) {
    throw new Error('A resource can be offered only to a member of this rikma — invite someone new instead');
  }
  const assigneeName: string = assignsOther
    ? (members.find((m) => String(m.id) === assigneeId)?.attributes?.username ?? '')
    : '';

  // An offer to a named member is not a proposal the rikma votes on first and
  // fills later: like an assigned mission (createMission branch 2) it is an
  // OpenMashaabim already taken (archived) plus the Askm everyone signs — the
  // members for the resource, the assignee for themselves — in one vote.
  const isPmash = userCount > 1 && !assignsOther;

  // A multi-member rikma votes on the resource first, and inviting someone to
  // a resource it has not approved would be acting for it — so the invite waits
  // on the pmash and is emailed when it matures (pendingInvites.ts). Nobody is
  // there to hand a link to at that moment, so here the email is required.
  if (wantsInvite && isPmash && !inviteEmail) {
    throw new Error('An invite in a rikma that votes needs an email — it is sent when the vote matures');
  }

  const operationName = isPmash ? 'createPmash' : 'createOpenMashaabim';
  const typeName      = isPmash ? 'Pmash'       : 'OpenMashaabim';

  // ── Recurring terms (monthly / yearly) ──────────────────────────────────
  // Resolved before the payload is built: `recurring`/`cycleSize` are stamped on
  // the record itself, so a recurring resource stays recognizably recurring
  // while it is still open for the community to discover and offer on. The rules
  // live in $lib/recurring/recurringPlan (pure + tested).
  const plan = resolveRecurringPlan({ recurring, kindOf, isPmash, isAssigned, cycleSize });
  const { isRecurring, unit: cycleUnit, cycleEvery } = plan;
  const pricePerUnit = (easy && easy > 0 ? easy : price) || 0;

  // ── 2. Build the main resource payload ──────────────────────────────────
  const resourceData: Record<string, unknown> = {
    name,
    descrip:     description,
    project:     projectId,
    kindOf,
    hm,
    spnot,
    price,
    easy:        easy || price,
    linkto,
    publishedAt: now,
    archived:    isAssigned || assignsOther,  // archived=true means it's claimed — by the creator or the member it is offered to
    ...entryFields(entry)
  };

  resourceData.mashaabim = ensuredMashaabimId;
  if (startDate)    resourceData.sqadualed  = startDate;
  if (endDate)      resourceData.sqadualedf = endDate;

  // Recurrence lives on the record for both kinds, so an OpenMashaabim that is
  // still looking for a provider carries its own terms into the askm flow.
  if (plan.stampOnRecord) {
    resourceData.recurring = true;
    resourceData.cycleSize = cycleEvery;
  }

  // The past cycles go on the request itself, so the rikma signs them together
  // with the resource — one vote — and activation reads them from there.
  const backfillCycles = isRecurring
    ? normalizeBackfill(convertedBackfill, { unit: cycleUnit, anchor: startDate, size: cycleEvery })
    : [];
  if (backfillCycles.length > 0) {
    resourceData.backfill = backfillPayload(backfillCycles, assignsOther ? assigneeId : null);
  }

  const locationInput = buildLocationInput(isOnline, lat, lng, radius, location_hint);
  if (locationInput) resourceData.location = locationInput;

  if (isPmash) {
    resourceData.users = [{
      what: true,
      users_permissions_user: userId,
      ide:   parseInt(userId, 10),
      order: 0,
      zman:  now
    }];
    if (isAssigned) {
      resourceData.isSelfProposal   = true;
      resourceData.selfProposalUser = userId;
      resourceData.isMaap           = isReceived; // true = delivered already (Maap flow), false = pending vote (Askm flow)
    }
  }

  // ── 3. Create the main resource record ──────────────────────────────────
  const created = await gql(f, jwt, `
    mutation CreateResource($data: ${typeName}Input!) {
      ${operationName}(data: $data) {
        data { id attributes { name } }
      }
    }
  `, { data: resourceData });

  const createdRecord = created[operationName].data;
  const createdId     = createdRecord.id;

  // Open (unclaimed) resource request → tag users who offer this mashaabim
  // with a match-suggestion and notify them by email.
  let inviteOutcome: MissionInviteOutcome | null = null;
  if (isPmash && wantsInvite && inviteEmail) {
    const stored = await storePendingInvite(
      'pmash',
      String(createdId),
      { email: inviteEmail, invitedBy: String(userId), at: now, lang: context.lang },
      strapi
    );
    inviteOutcome = { result: stored ? 'pendingVote' : 'notStored' };
  }
  // ── 3a. Offered to another member → their Askm, with no Sp ──────────────
  if (assignsOther) {
    const askmRes = await gql(f, jwt, `
      mutation CreateAssignedAskm($data: AskmInput!) {
        createAskm(data: $data) { data { id } }
      }
    `, {
      data: {
        publishedAt: now,
        project: projectId,
        open_mashaabim: createdId,
        users_permissions_user: assigneeId,
        // The creator's yes, at the baseline round. It is not the assignee's:
        // nego/askmAssigned.ts reads a missing Sp as "not answered yet".
        vots: [{ what: true, users_permissions_user: userId, order: 0 }]
      }
    });
    const askmId = askmRes?.createAskm?.data?.id;
    if (!askmId) throw new Error('Failed to create the Askm for the assigned member');

    await ensureCandidacyTimegrama(strapi, context, {
      side: 'askm',
      id: String(askmId),
      projectId: String(projectId),
      restime: effectiveRestime
    });

    if (notifier) {
      const restimeHe = restimeLabel(effectiveRestime, 'he');
      const restimeEn = restimeLabel(effectiveRestime, 'en');
      const url = voteUrl(String(projectId), 'askm', String(askmId));
      // Everyone is told before they vote: approving the resource books these.
      const pastNote = {
        he: backfillCycles.length ? ` ההצעה כוללת גם ${backfillCycles.length} מחזורים קודמים ששולמו, שיירשמו עם האישור.` : '',
        en: backfillCycles.length ? ` The proposal also includes ${backfillCycles.length} past cycles already paid, booked on approval.` : '',
      };

      notifier
        .notify(
          {
            recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
            templates: {
              title: {
                he: `${creatorName} מציע/ה שאת/ה תביא/י את המשאב "${name}"`,
                en: `${creatorName} suggests you bring the resource "${name}"`,
              },
              body: {
                he: `ברקמה "${projectName}" ${creatorName} הציע/ה את המשאב "${name}" ובחר/ה בך לספק אותו.${pastNote.he} שום דבר לא נרשם על שמך בלי הסכמתך: בכרטיס בלב בוחרים אחד מהמשאבים שלך או יוצרים חדש, ואז מאשרים - או מדייקים את התנאים בהצעה נגדית או פותחים שיחה. לחצו כדי לצפות בפרטים.`,
                en: `In "${projectName}", ${creatorName} proposed the resource "${name}" and picked you to provide it.${pastNote.en} Nothing is registered under your name without your consent: on the card in your heart page you choose one of your resources or create a new one, then approve - or refine the terms with a counter-offer or open a discussion. Tap to see the details.`,
              },
            },
            intent: 'consent',
            subject: () => noticeSubject('askm', String(askmId), projectId),
            metadata: { type: 'voteUpdate', url, priority: 'high' },
          },
          { recipients: [assigneeId], projectId },
          { projectId, createdId, askmId },
          context,
        )
        .catch((e: unknown) => console.warn('[createResource] assignee notification failed:', e));

      const otherMemberIds = members
        .map((m) => String(m.id))
        .filter((id) => id !== String(userId) && id !== assigneeId);
      if (otherMemberIds.length > 0) {
        notifier
          .notify(
            {
              recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
              templates: {
                title: {
                  he: `משאב חדש בדרך אל ${assigneeName}: "${name}"`,
                  en: `New resource on its way to ${assigneeName}: "${name}"`,
                },
                body: {
                  he: `${creatorName} הציע/ה ברקמה "${projectName}" את המשאב "${name}" והועיד/ה אותו ל${assigneeName}.${pastNote.he} ההצבעה כפולה - גם על המשאב וגם על מי שמביא אותו - והיא ממתינה להסכמה המפורשת של ${assigneeName}. במהלך ${restimeHe} של זמן התגובה אפשר לאשר, לדייק את התנאים או לפתוח שיחה. לחצו להצבעה.`,
                  en: `${creatorName} proposed the resource "${name}" in "${projectName}" and offered it to ${assigneeName}.${pastNote.en} The vote is double - on the resource and on who brings it - and it awaits ${assigneeName}'s explicit consent. During the ${restimeEn} response window you can approve, refine the terms or open a discussion. Tap to vote.`,
                },
              },
              intent: 'consent',
              subject: () => noticeSubject('askm', String(askmId), projectId),
              metadata: { type: 'voteUpdate', url },
            },
            { recipients: otherMemberIds, projectId },
            { projectId, createdId, askmId },
            context,
          )
          .catch((e: unknown) => console.warn('[createResource] assigned-resource notification failed:', e));
      }
    }

    return { ...createdRecord, createdKind: typeName, askmId: String(askmId), assignedUserId: assigneeId };
  }

  if (!isPmash && !isAssigned) {
    await matchOpenMashaabimToUsers(String(createdId), 'resourceCreated', {
      strapi,
      fetch: context.fetch,
      lang: context.lang
    });

    if (wantsInvite) {
      inviteOutcome = await inviteToOpenResource(
        {
          projectId: String(projectId),
          projectName,
          openMashaabimId: String(createdId),
          resourceName: name,
          inviterId: String(userId),
          email: inviteEmail
        },
        { strapi, fetch: context.fetch, lang: context.lang }
      );
    }
  }

  // ── 3b. Recurring expense engine (monthly / yearly) ──────────────────────
  // A recurring resource is modelled as a "mashabetahalich" with recurring=true.
  // Each month /api/monthi opens a cycle (a Maap) that surfaces on the lev screen;
  // the responsible user confirms the amount and it is archived on a Rikmash.
  //
  // `engineOn: 'now'` means a provider is already known — the solo creator
  // claimed the resource. Otherwise the plan says 'onApproval': the record stays
  // open so it keeps showing on the hub map, the lev feed and
  // /availiableResorce/[id], and the engine is built from the final agreed terms
  // on askm approval (activateRecurringEngine).
  if (plan.engineOn === 'now') {
    // Responsible user = creator. Reuse or create an Sp so the monthly cycle
    // cards carry the provider's identity.
    let spId = existingSpId ?? null;
    if (!spId) {
      const spData = await gql(f, jwt, `
        mutation CreateSp($data: SpInput!) { createSp(data: $data) { data { id } } }
      `, {
        data: {
          name,
          descrip: description,
          kindOf: kindOf || null,
          unit: hm || null,
          spnot: spnot || '',
          price: price || 0,
          myp: easy || 0,
          linkto: linkto || '',
          users_permissions_user: userId,
          mashaabim: ensuredMashaabimId,
          publishedAt: now,
          ...(startDate ? { sdate: startDate } : {}),
          ...(endDate ? { fdate: endDate } : {}),
          ...(locationInput ? { location: locationInput } : {})
        }
      });
      spId = spData?.createSp?.data?.id ?? null;
    }

    const mashabetahalichId = await createMashabetahalichRecord(f, jwt, {
      name,
      descrip: description,
      project: projectId,
      mashaabim: ensuredMashaabimId,
      users_permissions_user: userId,
      kindOf,
      unit: cycleUnit,
      status_mashab: 'active',
      recurring: true,
      start: startDate || now,
      ...(endDate ? { end: endDate } : {}),
      cycleSize: cycleEvery,
      pricePerUnit,
      finnished: false,
      publishedAt: now
    });

    // Past cycles first. A solo creator is the whole quorum, so their own yes
    // is the signature on each month.
    const settledPast = backfillCycles.length
      ? await settleBackfill(
          strapi,
          { jwt, fetch: f },
          {
            projectId: String(projectId),
            mashId: mashabetahalichId,
            mashAttrs: {
              name,
              kindOf,
              pricePerUnit,
              users_permissions_user: { data: { id: String(userId) } }
            },
            name,
            cycles: backfillCycles,
            vots: [{ what: true, users_permissions_user: String(userId), order: 0 }],
            confirmedBy: String(userId),
            spId
          }
        )
      : 0;

    // Open the first cycle so the card shows on lev right away, anchored to the
    // start date so a cycleSize > 1 resource lines up with monthi's windows.
    const { cycleStart, cycleEnd } = cycleWindowIso(
      cycleUnit,
      startDate ? new Date(startDate) : new Date(now),
      cycleEvery
    );
    await gql(f, jwt, `
      mutation MrCreateCycleMaap($data: MaapInput!) { createMaap(data: $data) { data { id } } }
    `, {
      data: {
        project: projectId,
        name,
        mashabetahalich: mashabetahalichId,
        ...(spId ? { sp: spId } : {}),
        cycleIndex: settledPast + 1,
        cycleStart,
        cycleEnd,
        quantityDelivered: pricePerUnit,
        publishedAt: now
      }
    });

    // The OpenMashaabim is vestigial once the engine exists — the engine + its
    // cycle Maaps drive the card. It was already created archived (`archived:
    // isAssigned` above, and this branch only runs when isAssigned), so there is
    // nothing left to close.
    return { ...createdRecord, createdKind: typeName, mashabetahalichId, recurring: true };
  }

  // ── 4. Self-assignment follow-up (single-user only) ─────────────────────
  if (isAssigned && !isPmash) {
    let spId = existingSpId ?? null;

    // 4a. Create a new Sp (personal resource record) if no existing one
    if (!spId) {
      const spData = await gql(f, jwt, `
        mutation CreateSp($data: SpInput!) {
          createSp(data: $data) { data { id } }
        }
      `, {
        data: {
          name,
          descrip:    description,
          kindOf:     kindOf || null,
          unit:       hm     || null,
          spnot:      spnot  || '',
          price:      price  || 0,
          myp:        easy   || 0,
          linkto:     linkto || '',
          users_permissions_user: userId,
          mashaabim:  ensuredMashaabimId,
          publishedAt: now,
          ...(startDate ? { sdate: startDate } : {}),
          ...(endDate   ? { fdate: endDate } : {}),
          ...(locationInput ? { location: locationInput } : {})
        }
      });
      spId = spData?.createSp?.data?.id ?? null;
    }

    if (spId) {
      if (!isReceived) {
        // 4b-i. Create Maap (resource is pending / not yet received)
        await gql(f, jwt, `
          mutation CreateMaap($data: MaapInput!) {
            createMaap(data: $data) { data { id } }
          }
        `, {
          data: {
            project:        projectId,
            name,
            sp:             spId,
            publishedAt:    now,
            open_mashaabim: createdId
          }
        });
      } else {
        // 4b-ii. Create Rikmash (resource already received) + mark Sp as taken
        const easyVal = easy > 0 ? easy : price;
        let total = easyVal;
        if      (kindOf === 'perUnit')  total = easyVal * hm;
        else if (kindOf === 'monthly' && startDate && endDate) {
          const months =
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24 * 30.44);
          total = +(easyVal * Math.max(months, 0)).toFixed(2);
        } else if (kindOf === 'yearly' && startDate && endDate) {
          const years =
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24 * 365.25);
          total = +(easyVal * Math.max(years, 0)).toFixed(2);
        }

        await gql(f, jwt, `
          mutation CreateRikmash($data: RikmashInput!) {
            createRikmash(data: $data) { data { id } }
          }
        `, {
          data: {
            publishedAt:    now,
            total,
            name,
            kindOf,
            price,
            agprice:        easyVal,
            project:        projectId,
            hm,
            open_mashaabim: createdId,
            spnot:          spnot ? `${spnot}-${description}` : description,
            users_permissions_user: userId,
            sp:             spId,
            ...(startDate ? { sqadualed:  startDate } : {}),
            ...(endDate   ? { sqadualef:  endDate   } : {})
          }
        });

        // Mark Sp as no longer available
        await gql(f, jwt, `
          mutation UpdateSp($id: ID!, $data: SpInput!) {
            updateSp(id: $id, data: $data) { data { id } }
          }
        `, { id: spId, data: { panui: false } });

        // …and record *why* it is unavailable, with dates. `panui` alone cannot
        // say "until March", cannot be undone, and is plain wrong for a pool
        // that still has units. `syncPanui` inside `openGrantBooking` rewrites
        // the flag from the ledger straight after.
        await bestEffort('createResourceSelfAssign', () =>
          openGrantBooking(execFromContext({ jwt, fetch: f }), {
            spId,
            projectId,
            openMashaabimId: createdId,
            ownerId: userId,
            note: name,
            terms: { kindOf, sqadualed: startDate, sqadualedf: endDate, hm },
          })
        );
      }
    }
  }

  // ── 5. Multi-user self-assignment follow-up ─────────────────────────────
  if (isAssigned && isPmash) {
    let spId = existingSpId ?? null;

    // 5a. Create a new Sp if no existing one was supplied
    if (!spId) {
      const spData = await gql(f, jwt, `
        mutation CreateSp($data: SpInput!) {
          createSp(data: $data) { data { id } }
        }
      `, {
        data: {
          name,
          descrip:    description,
          kindOf:     kindOf || null,
          unit:       hm     || null,
          spnot:      spnot  || '',
          price:      price  || 0,
          myp:        easy   || 0,
          linkto:     linkto || '',
          users_permissions_user: userId,
          mashaabim:  ensuredMashaabimId,
          publishedAt: now,
          ...(startDate ? { sdate: startDate } : {}),
          ...(endDate   ? { fdate: endDate }   : {}),
          ...(locationInput ? { location: locationInput } : {})
        }
      });
      spId = spData?.createSp?.data?.id ?? null;
    }

    if (spId) {
      if (!isReceived) {
        // 5b-i. Resource not yet received: create Askm (pending the main Pmash vote)
        //       The proposer's vote is pre-cast in favour.
        await gql(f, jwt, `
          mutation CreateAskm($data: AskmInput!) {
            createAskm(data: $data) { data { id } }
          }
        `, {
          data: {
            publishedAt:    now,
            project:        projectId,
            sp:             spId,
            pmash:          createdId,
            isSelfProposal: true,
            pendingMainVote: true,
            vots: [{ what: true, users_permissions_user: userId }]
          }
        });
      } else {
        // 5b-ii. Resource already received: create Maap linked to Pmash
        //        The proposer has already delivered — mark isSelfProposal so the
        //        UI knows this Maap depends on the Pmash vote outcome.
        await gql(f, jwt, `
          mutation CreateMaap($data: MaapInput!) {
            createMaap(data: $data) { data { id } }
          }
        `, {
          data: {
            project:        projectId,
            name,
            sp:             spId,
            publishedAt:    now,
            pmash:          createdId,
            isSelfProposal: true
          }
        });
      }
    }
  }

  // ── 6. Create Timegrama for Pmash (deadline tracking) ──────────────────
  if (isPmash && restime) {
    // Calculate deadline offset from restime string (e.g. "7d", "2h")
    let offsetMs = 0;
    const match = String(restime).match(/(\d+)([dhm])/);
    if (match) {
      const val  = parseInt(match[1], 10);
      const unit = match[2];
      if      (unit === 'd') offsetMs = val * 86400000;
      else if (unit === 'h') offsetMs = val *  3600000;
      else if (unit === 'm') offsetMs = val *    60000;
    }
    const deadline = new Date(Date.now() + offsetMs).toISOString();

    await gql(f, jwt, `
      mutation CreateTimegrama($data: TimegramaInput!) {
        createTimegrama(data: $data) { data { id } }
      }
    `, {
      data: {
        date:        deadline,
        whatami:     'pmash',
        pmash:       createdId,
        publishedAt: now
      }
    });
  }

  // ── 7. Case-specific notification (multi-member only, fire-and-forget) ──
  // Every other member gets a deep link to the pmash vote page plus an
  // explanation that during the restime the proposal is theirs to reshape.
  if (isPmash && notifier) {
    const restimeHe = restimeLabel(effectiveRestime, 'he');
    const restimeEn = restimeLabel(effectiveRestime, 'en');
    const url = voteUrl(String(projectId), 'pmash', createdId);
    const selfProposal = Boolean(isAssigned);
    // Voters see the invite before they vote — it is part of what they approve.
    const invites = inviteOutcome?.result === 'pendingVote';
    const inviteNote = {
      he: invites ? ' ההצעה כוללת הזמנה של שותף חדש מחוץ לרקמה - היא תישלח רק אם המשאב יאושר.' : '',
      en: invites ? ' The proposal includes inviting a new partner from outside the rikma - it is sent only if the resource is approved.' : '',
    };

    const title = selfProposal
      ? {
          he: `${creatorName} מציע/ה לספק את המשאב "${name}"`,
          en: `${creatorName} offers to provide the resource "${name}"`,
        }
      : {
          he: `משאב חדש להצבעה: "${name}"`,
          en: `New resource up for a vote: "${name}"`,
        };
    const body = selfProposal
      ? {
          he: `${creatorName} הציע/ה ברקמה "${projectName}" את המשאב "${name}"${isReceived ? ' - שכבר סופק על ידו/ה' : ' ומציע/ה לספק אותו בעצמו/ה'}. במהלך ${restimeHe} של זמן התגובה אפשר לאשר, לפתוח שיחה או להציע גרסה מדויקת משלך - ההצעה האחרונה שעל השולחן מאושרת אוטומטית בתום הזמן. לחצו להצבעה.`,
          en: `${creatorName} proposed the resource "${name}" in the "${projectName}" rikma${isReceived ? ' - already delivered by them' : ' and offers to provide it themselves'}. During the ${restimeEn} response window you can approve, open a discussion or counter with your own refined version - the last version on the table is auto-approved when time runs out. Tap to vote.`,
        }
      : {
          he: `${creatorName} הציע/ה ברקמה "${projectName}" את המשאב "${name}". במהלך ${restimeHe} של זמן התגובה אפשר לאשר, לפתוח שיחה או להציע גרסה מדויקת משלך - ההצעה משתנה כרצונך וההצעה האחרונה שעל השולחן מאושרת אוטומטית בתום הזמן.${inviteNote.he} לחצו להצבעה.`,
          en: `${creatorName} proposed the resource "${name}" in the "${projectName}" rikma. During the ${restimeEn} response window you can approve, open a discussion or counter with your own refined version - the proposal is yours to shape, and the last version on the table is auto-approved when time runs out.${inviteNote.en} Tap to vote.`,
        };

    notifier
      .notify(
        {
          recipients: {
            type: 'projectMembers',
            config: { projectIdParam: 'projectId', excludeSender: true },
          },
          templates: { title, body },
          // Every member is asked to vote on the proposed resource, against the rikma's clock.
          intent: 'consent',
          subject: () => noticeSubject('pmash', createdId, projectId),
          emailTemplate: 'PendJustCreated',
          emailTemplateData: {
            un: creatorName,
            pl: projectPic,
            pn: projectName,
            kind: 'pendmash',
            rishon: selfProposal ? creatorName : '',
            name,
            restime: effectiveRestime,
            pid: projectId,
            eid: createdId,
          },
          metadata: { type: 'voteUpdate', url },
        },
        params,
        { projectId, createdId },
        context,
      )
      .catch((e: unknown) => console.warn('[createResource] pmash notification failed:', e));
  }

  // `createdKind` says which entity `id` is — the realtime scopes need it.
  return { ...createdRecord, createdKind: typeName, ...(inviteOutcome ? { invite: inviteOutcome } : {}) };
};

export const createResourceAction: ActionConfig = {
  key: 'createResource',
  description: 'Create a new resource requirement in a project',
  graphqlOperation: createResourceHandler,
  
  paramSchema: {
    entryCurrency: ENTRY_CURRENCY_PARAM,
    projectId: {
      type: 'string',
      required: true,
      description: 'ID of the project'
    },
    name: {
      type: 'string',
      required: true,
      description: 'Resource name'
    },
    description: {
      type: 'string',
      required: false,
      description: 'Resource description'
    },
    price: {
      type: 'number',
      required: false,
      description: 'Price/Value'
    },
    kindOf: {
      type: 'string',
      required: false,
      description: 'Type of value (total, monthly, yearly, perUnit, rent)'
    },
    hm: {
      type: 'number',
      required: false,
      description: 'Quantity'
    },
    spnot: {
      type: 'string',
      required: false,
      description: 'Special notes'
    },
    easy: {
      type: 'number',
      required: false,
      description: 'Easy value'
    },
    linkto: {
      type: 'string',
      required: false,
      description: 'Link to resource details'
    },
    mashaabimId: {
      type: 'string',
      required: false,
      description: 'ID of the Mashaabim template'
    },
    startDate: {
      type: 'string',
      required: false,
      description: 'Start date'
    },
    endDate: {
      type: 'string',
      required: false,
      description: 'End date'
    },
    isOnline: {
      type: 'boolean',
      required: false,
      description: 'Whether the resource can be provided online'
    },
    lat: {
      type: 'number',
      required: false,
      description: 'Resource latitude'
    },
    lng: {
      type: 'number',
      required: false,
      description: 'Resource longitude'
    },
    radius: {
      type: 'number',
      required: false,
      description: 'Resource service radius in km'
    },
    location_hint: {
      type: 'string',
      required: false,
      description: 'Human-readable location hint'
    },
    isAssigned: {
      type: 'boolean',
      required: false,
      description: 'Whether the current user provides this resource themselves (any rikma; a rikma that votes gets the double-vote self-proposal)'
    },
    assignedUserId: {
      type: 'string',
      required: false,
      description: 'Offer the resource to this member. Self → same as isAssigned; another member → an archived OpenMashaabim + an Askm with no Sp that they answer by choosing or creating their resource (provideAssignedResource). Their silence is not consent. Not with invite — docs/inprogress/PLAN_RESOURCE_ASSIGNMENT.md'
    },
    isReceived: {
      type: 'boolean',
      required: false,
      description: 'Whether the resource has already been received (creates Rikmash instead of Maap)'
    },
    recurring: {
      type: 'boolean',
      required: false,
      description: 'Recurring monthly/yearly expense (server rent, apartment, stall). Creates a mashabetahalich engine driven by /api/monthi'
    },
    cycleSize: {
      type: 'number',
      required: false,
      description: 'Recurrence period in units of kindOf (default 1 = every month/year)'
    },
    backfill: {
      type: 'array',
      required: false,
      description:
        'Recurring resource only, at creation only, self-assigned only: what each past cycle cost, [{ key: "YYYY-MM", amount }]. Signed with the resource and settled on activation — src/lib/recurring/backfill.ts'
    },
    existingSpId: {
      type: 'string',
      required: false,
      description: 'ID of an existing Sp (personal resource record) to link instead of creating new'
    },
    restime: {
      type: 'string',
      required: false,
      description: 'Response time string for Timegrama deadline calculation (e.g. "7d", "2h")'
    },
    invite: {
      type: 'object',
      required: false,
      description: 'Invite someone new to this open resource: { email? }. Solo rikma → sent now, returns invite { result, link }; a rikma that votes needs the email and gets { result: pendingVote } — it is sent when the pmash matures. Cannot be combined with isAssigned — docs/inprogress/PLAN_INVITE_PARTNER_TO_MISSION.md'
    }
  },
  
  authRules: [
    {
      type: 'jwt',
      errorMessage: 'You must be logged in to create resources'
    },
    {
      type: 'projectMember',
      config: {
        projectIdParam: 'projectId'
      },
      errorMessage: 'You must be a member of this project to create resources'
    }
  ],
  
  // Notifications are sent from the handler itself (case-specific: pmash vote
  // link + restime explanation, self-proposal variant) — no static config here
  // to avoid doubles. Solo projects have nobody else to notify.,

  realtime: {
    scopes: (p, r) =>
      scopeList([
        scope('project', p.projectId),
        r?.createdKind === 'Pmash' ? decisionScope('pmash', r?.id) : scope('resource', r?.id),
        r?.askmId ? decisionScope('askm', r.askmId) : null,
        scope('resource', r?.mashabetahalichId),
      ]),
  },
};
