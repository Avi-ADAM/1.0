/**
 * Action: nominateSelfResource (PLAN_SELF_NOMINATION §3.2)
 *
 * The resource-side twin of nominateSelfMission: a non-member offers to bring
 * a resource to a rikma on their own terms ("I'll bring…"). Creates:
 *
 *  1. Sp (the candidate's personal resource) — unless an existing spId is given
 *  2. OpenMashaabim with source:'selfNomination' (never listed publicly)
 *  3. Askm without a vote (Path A) — timegrama deferred to first member vote
 *
 * The existing Askm machine (counters, finalizeAskmAcceptance, negoGate)
 * takes over unchanged.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { projectId, name, descrip, spnot, price, hm, kindOf, recurring, spId: spIdParam } = params;

  const now = new Date();
  const nowISO = now.toISOString();
  const requesterId = String(context.userId);

  // 1. Members are redirected to the internal path.
  const projectRes = await strapi.execute(
    '128getProjectMembersAndRestime',
    { pid: projectId },
    context.jwt,
    context.fetch
  );
  const projectAttrs = projectRes?.data?.project?.data?.attributes;
  if (!projectAttrs) throw new Error('Project not found');
  const memberIds: string[] = (projectAttrs.user_1s?.data ?? []).map((m: any) => String(m.id));
  if (memberIds.includes(requesterId)) {
    throw new Error('Project members offer resources from the moach, not by self-nomination');
  }

  // 2. Resolve the Sp: reuse the candidate's existing one or create it now.
  let spId = spIdParam ? String(spIdParam) : null;
  if (!spId) {
    const spRes = await strapi.execute(
      '218createSelfNomSp',
      {
        name,
        descrip: descrip ?? null,
        spnot: spnot ?? null,
        price: price ?? null,
        unit: hm ?? 1,
        kindOf: kindOf ?? 'total',
        userId: requesterId,
        publishedAt: nowISO,
      },
      context.jwt,
      context.fetch
    );
    spId = spRes?.data?.createSp?.data?.id ? String(spRes.data.createSp.data.id) : null;
  }
  if (!spId) throw new Error('Failed to resolve Sp for the offered resource');

  // 3. OpenMashaabim carrying the candidate's terms.
  let openMashaabimId: string | undefined;
  try {
    const omRes = await strapi.execute(
      '215createSelfNomOpenMashaabim',
      {
        projectId,
        name,
        descrip: descrip ?? null,
        spnot: spnot ?? null,
        price: price ?? null,
        hm: hm ?? 1,
        kindOf: kindOf ?? 'total',
        recurring: recurring ?? false,
        source: 'selfNomination',
        publishedAt: nowISO,
      },
      context.jwt,
      context.fetch
    );
    openMashaabimId = omRes?.data?.createOpenMashaabim?.data?.id;
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (msg.includes('ENUM_OPENMASHAABIM_SOURCE') || /source/i.test(msg)) {
      throw new Error(
        "Self-nomination needs the 'selfNomination' value added to open-mashaabim.source in Strapi (then npm run types:update)"
      );
    }
    throw e;
  }
  if (!openMashaabimId) throw new Error('Failed to create OpenMashaabim');

  // 4. Askm — no vots (external candidate, Path A); timegrama deferred.
  const askmRes = await strapi.execute(
    '125createAskm',
    { publishedAt: nowISO, openMashaabimId, projectId, spId, userId: requesterId },
    context.jwt,
    context.fetch
  );
  const askmId = askmRes?.data?.createAskm?.data?.id;
  if (!askmId) throw new Error('Failed to create Askm');

  // 5. Mark the Sp as applied to this OpenMashaabim (same as createMashaabimRequest).
  await strapi.execute(
    '126updateSpDeclined',
    { id: spId, openMashaabimId },
    context.jwt,
    context.fetch
  );

  return {
    data: { openMashaabimId, askmId, spId, projectId },
    updateStrategy: { type: 'none' },
  };
};

export const nominateSelfResourceConfig: ActionConfig = {
  key: 'nominateSelfResource',
  description:
    "Self-nomination (resource): a non-member authors an OpenMashaabim with their own terms (source:'selfNomination') + Sp + Askm. Existing candidacy machine takes over.",
  graphqlOperation: handler,

  paramSchema: {
    projectId: { type: 'string', required: true },
    name: { type: 'string', required: true, description: 'What the candidate offers to bring' },
    descrip: { type: 'string', required: false },
    spnot: { type: 'string', required: false },
    price: { type: 'number', required: false, description: "Candidate's ideal price" },
    hm: { type: 'number', required: false, description: 'Quantity/units' },
    kindOf: { type: 'string', required: false, description: 'total | monthly | perUnit | rent | yearly' },
    recurring: { type: 'boolean', required: false },
    spId: { type: 'string', required: false, description: 'Existing Sp to offer (created when absent)' },
  },

  authRules: [{ type: 'jwt' }],

  notification: {
    recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId' } },
    templates: {
      title: {
        he: 'מישהו מציע להביא משאב לריקמה שלכם 🌱',
        en: 'Someone offers to bring a resource to your rikma 🌱',
        ar: 'شخص ما يعرض جلب مورد لنسيجكم 🌱',
      },
      body: {
        he: 'התקבלה הצעה עצמית חדשה — משאב בתנאי המציע/ה. היכנסו ללב כדי להגיב.',
        en: 'A new self-nomination arrived — a resource on the candidate’s terms. Open Lev to respond.',
        ar: 'وصل ترشيح ذاتي جديد — مورد بشروط المرشّح. افتحوا ليف للرد.',
      },
    },
    channels: ['socket', 'email', 'push'],
    metadata: { type: 'selfNomination', url: 'lev', priority: 'high' },
  },

  updateStrategy: { type: 'none' },
};
