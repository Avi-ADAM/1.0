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

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { matchOpenMashaabimToUsers } from '$lib/server/matching/engine';

// ─── helpers ───────────────────────────────────────────────────────────────
async function gql(
  fetchFn: typeof fetch,
  jwt: string,
  query: string,
  variables?: Record<string, unknown>
) {
  const res = await fetchFn(import.meta.env.VITE_URL + '/graphql', {
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
/** Month/year bounds for the cycle that contains `ref` (default: now). */
function currentCycleBounds(unit: 'month' | 'year', ref = new Date()) {
  if (unit === 'year') {
    const start = new Date(ref.getFullYear(), 0, 1);
    const end = new Date(ref.getFullYear(), 11, 31, 23, 59, 59);
    return { cycleStart: start.toISOString(), cycleEnd: end.toISOString() };
  }
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59);
  return { cycleStart: start.toISOString(), cycleEnd: end.toISOString() };
}

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
const createResourceHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    projectId,
    name,
    description = '',
    price = 0,
    kindOf = 'total',
    hm = 1,
    spnot = '',
    easy = 0,
    linkto = '',
    mashaabimId,
    startDate,
    endDate,
    // Self-assignment params
    isAssigned = false,
    isReceived = false,
    recurring = false,     // monthly/yearly recurring expense (server rent, apartment…)
    cycleSize = 1,         // recurrence period in units of kindOf (e.g. every N months)
    existingSpId,          // ID of an existing Sp record (personal resource)
    restime,               // response-time string used for Timegrama deadline
    isOnline,
    lat,
    lng,
    radius,
    location_hint
  } = params;

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
            user_1s { data { id } }
          }
        }
      }
    }
  `, { id: projectId });

  const userCount =
    projectData?.project?.data?.attributes?.user_1s?.data?.length ?? 0;

  const isPmash = userCount > 1;
  const operationName = isPmash ? 'createPmash' : 'createOpenMashaabim';
  const typeName      = isPmash ? 'Pmash'       : 'OpenMashaabim';

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
    archived:    isAssigned   // archived=true means it's self-assigned / claimed
  };

  resourceData.mashaabim = ensuredMashaabimId;
  if (startDate)    resourceData.sqadualed  = startDate;
  if (endDate)      resourceData.sqadualedf = endDate;

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
    // Recurring expense flag lives on the Pmash so members can negotiate it.
    // The mashabetahalich engine itself is created on askm approval from the
    // final (possibly negotiated) Pmash terms — see runResourceAskmAcceptance.
    if (recurring && (kindOf === 'monthly' || kindOf === 'yearly')) {
      resourceData.recurring = true;
      resourceData.cycleSize = cycleSize ?? 1;
    }
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
  if (!isPmash && !isAssigned) {
    await matchOpenMashaabimToUsers(String(createdId), 'resourceCreated', {
      strapi,
      fetch: context.fetch,
      lang: context.lang
    });
  }

  // ── 3b. Recurring expense engine (monthly / yearly) ──────────────────────
  // A recurring resource is modelled as a "mashabetahalich" with recurring=true.
  // Each month /api/monthi opens a cycle (a Maap) that surfaces on the lev screen;
  // the responsible user confirms the amount and it is archived on a Rikmash.
  const isRecurring =
    Boolean(recurring) && (kindOf === 'monthly' || kindOf === 'yearly');
  const cycleUnit: 'month' | 'year' = kindOf === 'yearly' ? 'year' : 'month';
  const pricePerUnit = (easy && easy > 0 ? easy : price) || 0;

  // Multi-member recurring resources carry `recurring`/`cycleSize` on the Pmash
  // (set above) and the engine is created on approval — nothing more to do here.

  if (isRecurring && !isPmash) {
    // Single-member: activate immediately, responsible user = creator. Reuse or
    // create an Sp so the monthly cycle cards carry the provider's identity.
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
      cycleSize: 1,
      pricePerUnit,
      finnished: false,
      publishedAt: now
    });

    // Open the first cycle (current month) so the card shows on lev right away.
    const { cycleStart, cycleEnd } = currentCycleBounds(cycleUnit);
    await gql(f, jwt, `
      mutation MrCreateCycleMaap($data: MaapInput!) { createMaap(data: $data) { data { id } } }
    `, {
      data: {
        project: projectId,
        name,
        mashabetahalich: mashabetahalichId,
        ...(spId ? { sp: spId } : {}),
        cycleIndex: 1,
        cycleStart,
        cycleEnd,
        quantityDelivered: pricePerUnit,
        publishedAt: now
      }
    });

    // The OpenMashaabim is vestigial for a recurring resource — the engine + its
    // monthly cycle Maaps drive the card. Archive it so it doesn't linger as an
    // open need on the lev screen.
    await gql(f, jwt, `
      mutation ArchiveOm($id: ID!) { updateOpenMashaabim(id: $id, data: { archived: true }) { data { id } } }
    `, { id: createdId });

    return { ...createdRecord, mashabetahalichId, recurring: true };
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

  return createdRecord;
};

export const createResourceAction: ActionConfig = {
  key: 'createResource',
  description: 'Create a new resource requirement in a project',
  graphqlOperation: createResourceHandler,
  
  paramSchema: {
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
      description: 'Whether the current user is self-assigning this resource (single-user project)'
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
    existingSpId: {
      type: 'string',
      required: false,
      description: 'ID of an existing Sp (personal resource record) to link instead of creating new'
    },
    restime: {
      type: 'string',
      required: false,
      description: 'Response time string for Timegrama deadline calculation (e.g. "7d", "2h")'
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
  
  notification: {
    recipients: {
      type: 'projectMembers',
      config: {
        projectIdParam: 'projectId',
        excludeSender: true
      }
    },
    templates: {
      title: {
        he: 'משאב חדשה',
        en: 'New Resource Request'
      },
      body: {
        he: 'בקשת משאב חדשה בשם "{{name}}" נוספה לפרויקט',
        en: 'A new resource request  "{{name}}" was added to the project'
      }
    },
    channels: ['socket', 'push'],
    metadata: {
      priority: 'normal',
      url: '/lev?project={{projectId}}'
    }
  }
};
