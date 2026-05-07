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

// ─── handler ───────────────────────────────────────────────────────────────
const createResourceHandler: ActionExecutionHandler = async (params, context) => {
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
    existingSpId,          // ID of an existing Sp record (personal resource)
    restime                // response-time string used for Timegrama deadline
  } = params;

  const now = new Date().toISOString();
  const f = context.fetch as typeof fetch;
  const jwt = context.jwt as string;
  const userId = context.userId as string;

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

  if (mashaabimId)  resourceData.mashaabim  = mashaabimId;
  if (startDate)    resourceData.sqadualed  = startDate;
  if (endDate)      resourceData.sqadualedf = endDate;

  if (isPmash) {
    resourceData.users = [{
      what: true,
      users_permissions_user: userId,
      ide:   parseInt(userId, 10),
      order: 0,
      zman:  now
    }];
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

  // ── 4. Self-assignment follow-up (single-user only) ─────────────────────
  if (isAssigned && !isPmash) {
    let spId = existingSpId ?? null;

    // 4a. Create a new Sp (personal resource record) if no existing one
    if (!spId && mashaabimId) {
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
          myp:        (easy  || 0) > 0,
          linkto:     linkto || '',
          users_permissions_user: userId,
          mashaabim:  mashaabimId,
          publishedAt: now,
          ...(startDate ? { startDate } : {}),
          ...(endDate   ? { finishDate: endDate } : {})
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
          mutation UpdateSp($id: ID!, $data: SpInput!) {
            updateSp(id: $id, data: $data) { data { id } }
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

  // ── 5. Create Timegrama for Pmash (deadline tracking) ──────────────────
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
