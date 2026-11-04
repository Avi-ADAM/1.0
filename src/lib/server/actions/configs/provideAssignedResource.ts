/**
 * Action: provideAssignedResource
 *
 * The answer of a member a resource was offered to (createResource
 * `assignedUserId`, docs/inprogress/PLAN_RESOURCE_ASSIGNMENT.md). Their Askm carries
 * no Sp — what they bring is theirs to say — so agreeing *is* saying it: they
 * pick one of their own resources (`spId`) or create one from the need's terms
 * (`create`), and that same click is their yes to the standing round.
 *
 * Then it is the ordinary candidacy: `finalizeAskmAcceptance` records the yes
 * at the standing round and materializes only when every member has said yes
 * too (or leaves it to restime silence — which, now that the assignee has
 * answered, may complete it). Their own silence never did: see
 * nego/askmAssigned.ts.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';
import { askmSpId } from '../../nego/askmAssigned.js';
import { scope, decisionScope, scopeList } from '$lib/realtime/scopes.js';

async function gql(f: typeof fetch, jwt: string, query: string, variables: Record<string, unknown>) {
  const res = await f(STRAPI_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

const READ_ASKM = `query ProvideAssignedReadAskm($id: ID!) {
  askm(id: $id) { data { id attributes {
    archived
    users_permissions_user { data { id } }
    sp { data { id } }
    project { data { id } }
    open_mashaabim { data { id attributes {
      name descrip kindOf hm price easy spnot linkto sqadualed sqadualedf
      mashaabim { data { id } }
    } } }
  } } }
}`;

const READ_SP = `query ProvideAssignedReadSp($id: ID!) {
  sp(id: $id) { data { id attributes { users_permissions_user { data { id } } } } }
}`;

const CREATE_SP = `mutation ProvideAssignedCreateSp($data: SpInput!) {
  createSp(data: $data) { data { id } }
}`;

const SET_ASKM_SP = `mutation ProvideAssignedSetSp($id: ID!, $sp: ID!) {
  updateAskm(id: $id, data: { sp: $sp }) { data { id } }
}`;

const handler: ActionExecutionHandler = async (params, context) => {
  const { askmId, projectId, spId, create, expectRound } = params;
  const f = context.fetch as typeof fetch;
  const jwt = context.jwt as string;
  const userId = String(context.userId);

  const read = await gql(f, jwt, READ_ASKM, { id: String(askmId) });
  const attrs = read?.askm?.data?.attributes;
  if (!attrs) throw new ActionError('NOT_FOUND', `Askm ${askmId} not found`);
  if (attrs.archived === true) {
    throw new ActionError('ALREADY_RESOLVED', `Askm ${askmId} was already resolved`);
  }
  if (String(attrs.project?.data?.id ?? '') !== String(projectId)) {
    throw new ActionError('FORBIDDEN', `Askm ${askmId} does not belong to project ${projectId}`);
  }
  if (String(attrs.users_permissions_user?.data?.id ?? '') !== userId) {
    throw new ActionError('FORBIDDEN', 'Only the member this resource was offered to can answer it');
  }
  if (askmSpId(attrs)) {
    throw new ActionError('ALREADY_RESOLVED', 'A resource was already chosen for this offer');
  }

  const om = attrs.open_mashaabim?.data;
  const omAttrs = om?.attributes ?? {};

  let chosenSpId: string | null = null;
  if (spId != null && String(spId) !== '') {
    const sp = await gql(f, jwt, READ_SP, { id: String(spId) });
    const owner = sp?.sp?.data?.attributes?.users_permissions_user?.data?.id;
    if (!sp?.sp?.data || String(owner ?? '') !== userId) {
      throw new ActionError('FORBIDDEN', 'You can bring only a resource of your own');
    }
    chosenSpId = String(spId);
  } else if (create && typeof create === 'object') {
    // A new resource of theirs, from the need's terms. What they value it at
    // is theirs (`myp`); everything else is what the rikma asked for.
    const c = create as Record<string, unknown>;
    const myp = Number(c.myp);
    const created = await gql(f, jwt, CREATE_SP, {
      data: {
        name: String(c.name ?? '').trim() || omAttrs.name || '',
        descrip: typeof c.descrip === 'string' ? c.descrip : omAttrs.descrip || '',
        kindOf: omAttrs.kindOf || 'total',
        unit: omAttrs.hm != null ? omAttrs.hm : 1,
        spnot: typeof c.spnot === 'string' ? c.spnot : omAttrs.spnot || '',
        price: Number(omAttrs.price) || 0,
        myp: Number.isFinite(myp) && myp >= 0 ? myp : Number(omAttrs.easy || omAttrs.price) || 0,
        linkto: omAttrs.linkto || '',
        users_permissions_user: userId,
        ...(omAttrs.mashaabim?.data?.id ? { mashaabim: String(omAttrs.mashaabim.data.id) } : {}),
        ...(omAttrs.sqadualed ? { sdate: omAttrs.sqadualed } : {}),
        ...(omAttrs.sqadualedf ? { fdate: omAttrs.sqadualedf } : {}),
        publishedAt: new Date().toISOString()
      }
    });
    chosenSpId = created?.createSp?.data?.id ? String(created.createSp.data.id) : null;
    if (!chosenSpId) throw new Error('Failed to create the resource');
  } else {
    throw new ActionError('VALIDATION_FAILED', 'Choose one of your resources (spId) or create one (create)');
  }

  await gql(f, jwt, SET_ASKM_SP, { id: String(askmId), sp: chosenSpId });

  // Their yes, at the standing round — and, when it is the last one missing,
  // the registration itself. One path for both, so the gate is the same one
  // every member's yes goes through.
  // Imported here, not at the top: the configs are loaded by the action index.
  const { actionService } = await import('../index.js');
  const result = await actionService.executeAction(
    'finalizeAskmAcceptance',
    {
      variant: 'partial',
      askmId: String(askmId),
      projectId: String(projectId),
      openMashaabimId: om?.id ? String(om.id) : undefined,
      spId: chosenSpId,
      missionName: omAttrs.name ?? undefined,
      acceptedUserId: userId,
      ...(expectRound != null ? { expectRound: Number(expectRound) } : {})
    },
    context
  );
  if (!result?.success) {
    const err: any = result?.error;
    throw new ActionError(err?.code ?? 'VALIDATION_FAILED', err?.message ?? 'Agreeing failed');
  }

  return {
    data: {
      askmId: String(askmId),
      spId: chosenSpId,
      materialized: (result.data as any)?.materialized === true,
      pending: (result.data as any)?.pending ?? null
    },
    updateStrategy: {
      type: 'refetchScope',
      config: { dataKeys: ['askedResources'], projectId: String(projectId) }
    }
  };
};

export const provideAssignedResourceConfig: ActionConfig = {
  key: 'provideAssignedResource',
  description:
    'Answer a resource offered to you in a rikma: bring one of your resources (spId) or create one from the need (create: { myp?, name?, descrip?, spnot? }). It is your yes to the standing terms; the rikma registers it once every member agreed too.',
  graphqlOperation: handler,
  paramSchema: {
    askmId: { type: 'string', required: true, description: 'The Askm offered to you' },
    projectId: { type: 'string', required: true, description: 'The rikma' },
    spId: { type: 'string', required: false, description: 'One of your own resources (Sp) to bring' },
    create: {
      type: 'object',
      required: false,
      description: 'Create a new resource of yours from the need: { myp?, name?, descrip?, spnot? }'
    },
    expectRound: { type: 'number', required: false, description: 'The round you were shown' }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only a member of this rikma can answer a resource offered in it'
    }
  ],
  updateStrategy: { type: 'none' },
  realtime: {
    scopes: (p, r) =>
      scopeList([
        scope('project', p.projectId),
        decisionScope('askm', p.askmId),
        scope('resource', r?.data?.spId)
      ])
  }
};
