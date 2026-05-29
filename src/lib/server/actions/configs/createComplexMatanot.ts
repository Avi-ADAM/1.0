/**
 * Create Complex Matanot Action
 *
 * Creates a Matanot product with pricingMode='estimated' (or 'fixed' if mode=simple)
 * plus its bill-of-materials: recipeMissions + recipeResources, all wrapped in a
 * Process anchor so the product gets a main forum and per-item mapping forums.
 *
 * MVP scope:
 *  - creates the matanot row with the new fields
 *  - creates a Process anchor (createProcess) and links matanot.process
 *  - persists each recipeMission / recipeResource row
 *  - returns { matanot, processId, mainForumId, recipeMissionIds, recipeResourceIds }
 *
 * Out of scope for MVP (handled later milestones):
 *  - matanotpend (internal vote) — single-member projects skip it; multi-member
 *    just creates the product in status='voting' and uses the existing addVote on
 *    the main forum until the dedicated entity ships.
 *  - real Mesimabetahalich / Pmash creation per recipe row (M5/M6).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

type RecipeMissionInput = {
  pendmId?: string | null;
  missionId?: string | null; // legacy UI alias for pendmId
  mesimabetahalichId?: string | null;
  name?: string;
  hoursPerUnit?: number;
  unitsPerProduct?: number;
  ratePerHour?: number;
  mode?: 'createNew' | 'consumeExisting';
  assignedMemberId?: string | null;
  onlyPartOf?: boolean;
  notes?: string;
};

type RecipeResourceInput = {
  pmashId?: string | null;
  mashabetahalichId?: string | null;
  name?: string;
  quantityPerUnit?: number;
  pricePerUnit?: number;
  kindOf?: string;
  mode?: 'createNew' | 'consumeExisting' | 'reuseSp';
  assignedMemberId?: string | null;
  onlyPartOf?: boolean;
  notes?: string;
};

const VALID_RESOURCE_KINDOF = new Set(['monthly', 'perUnit', 'rent', 'total', 'yearly']);

function mapResourceKindOf(raw: string | undefined): string | null {
  if (!raw) return null;
  if (VALID_RESOURCE_KINDOF.has(raw)) return raw;
  switch (raw) {
    case 'subscription':
      return 'monthly';
    case 'good':
      return 'perUnit';
    case 'service':
    case 'other':
    default:
      return 'total';
  }
}

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    projectId,
    name,
    desc = '',
    pricingMode = 'estimated',
    marginPct = 0,
    estimatedPrice = 0,
    currency = 'ILS',
    fixedPrice = 0,
    kindOf = 'total',
    quant = 1,
    unlimitedM = false,
    dates = null,
    datef = null,
    oneForeProject = false,
    picId = null,
    recipeMissions = [],
    recipeResources = []
  } = params as {
    projectId: string;
    name: string;
    desc?: string;
    pricingMode?: 'fixed' | 'estimated' | 'quote';
    marginPct?: number;
    estimatedPrice?: number;
    currency?: string;
    fixedPrice?: number;
    kindOf?: 'total' | 'monthly' | 'yearly' | 'unlimited';
    quant?: number;
    unlimitedM?: boolean;
    dates?: string | null;
    datef?: string | null;
    oneForeProject?: boolean;
    picId?: string | null;
    recipeMissions?: RecipeMissionInput[];
    recipeResources?: RecipeResourceInput[];
  };

  const now = new Date().toISOString();
  const isComplex = pricingMode !== 'fixed';

  // Determine member count once (used to decide whether to open a matanotpend
  // flow — deferred for MVP).
  const projectData = await strapi.execute(
    '3projectJSONQue',
    { pid: projectId },
    context.jwt,
    context.fetch
  );
  const memberCount =
    projectData?.data?.project?.data?.attributes?.user_1s?.data?.length ?? 1;
  const multiMember = memberCount > 1;

  // ── 1. Create process anchor (always, even simple products benefit from
  //       having a main forum once they ship) ────────────────────────────────
  let processId: string | null = null;
  let mainForumId: string | null = null;

  try {
    const processRes = await strapi.execute(
      '91createPartof',
      { default: false },
      context.jwt,
      context.fetch
    );
    processId = processRes?.data?.createPartof?.data?.id ?? null;

    if (processId) {
      const forumRes = await strapi.execute(
        '2forumCrBasic',
        { pid: projectId, da: now },
        context.jwt,
        context.fetch
      );
      mainForumId = forumRes?.data?.createForum?.data?.id ?? null;

      if (mainForumId) {
        await strapi.execute(
          '92updateForumSubject',
          {
            id: mainForumId,
            subject: `PROCESS::${processId}::${String(name).trim()}`,
            spec: 'general',
            done: false
          },
          context.jwt,
          context.fetch
        );
      }
    }
  } catch (err) {
    console.warn('[createComplexMatanot] process creation failed, continuing without:', err);
    processId = null;
    mainForumId = null;
  }

  // ── 2. Create matanot row ───────────────────────────────────────────────
  const matanotPrice = isComplex ? Number(estimatedPrice) || 0 : Number(fixedPrice) || 0;
  const statusOfVoting = isComplex ? (multiMember ? 'voting' : 'active') : 'active';

  const createMatanotVars: Record<string, unknown> = {
    projectcreates: projectId,
    name: String(name).trim(),
    desc: String(desc || ''),
    price: matanotPrice,
    quant: unlimitedM || kindOf === 'unlimited' ? -1 : Number(quant) || 1,
    kindOf,
    oneForeProject,
    pricingMode,
    marginPct: Number(marginPct) || 0,
    estimatedPrice: Number(estimatedPrice) || 0,
    status_of_voting: statusOfVoting,
    publishedAt: now
  };
  if (picId) createMatanotVars.pic = picId;
  if (dates) createMatanotVars.startDate = new Date(dates).toISOString();
  if (datef) createMatanotVars.finnishDate = new Date(datef).toISOString();
  if (processId) createMatanotVars.process = processId;

  const matanotRes = await strapi.execute(
    '136createMatanot',
    createMatanotVars,
    context.jwt,
    context.fetch
  );
  const matanot = matanotRes?.data?.createMatanot?.data;
  if (!matanot?.id) {
    throw new Error('Failed to create matanot');
  }
  const matanotId = String(matanot.id);

  // ── 3. Persist recipe rows (complex only) ───────────────────────────────
  const recipeMissionIds: string[] = [];
  const recipeResourceIds: string[] = [];

  if (isComplex) {
    for (const m of recipeMissions) {
      const missionMode = m.mode === 'consumeExisting' ? 'consumeExisting' : 'createNew';
      let pendmId: string | null = m.pendmId ?? m.missionId ?? null;

      // New mission → spawn a global Pendm so the recipe has something to link to.
      if (!pendmId && missionMode === 'createNew' && !m.mesimabetahalichId) {
        try {
          const pendmVars: Record<string, unknown> = {
              name: m.name || `${String(name).trim()} - mission`,
              project: projectId,
              perhour: Number(m.ratePerHour) || 0,
              noofhours:
                (Number(m.hoursPerUnit) || 0) * (Number(m.unitsPerProduct) || 1),
              descrip: m.notes || '',
              publishedAt: now
            };
            if (m.assignedMemberId) pendmVars.rishon = m.assignedMemberId;
          const pendmRes = await strapi.execute(
            '137createPendmForRecipe',
            pendmVars,
            context.jwt,
            context.fetch
          );
          pendmId = pendmRes?.data?.createPendm?.data?.id
            ? String(pendmRes.data.createPendm.data.id)
            : null;
        } catch (err) {
          console.warn('[createComplexMatanot] createPendm failed:', err);
        }
      }

      const vars: Record<string, unknown> = {
        matanot: matanotId,
        hoursPerUnit: Number(m.hoursPerUnit) || 0,
        unitsPerProduct: Number(m.unitsPerProduct) || 1,
        ratePerHour: Number(m.ratePerHour) || 0,
        mode: missionMode,
        notes: m.notes || '',
        publishedAt: now
      };
      if (pendmId) vars.pendm = pendmId;
      if (m.mesimabetahalichId) vars.mesimabetahalich = m.mesimabetahalichId;
      if (processId) vars.partof = processId;

      try {
        const r = await strapi.execute(
          '125createMatanotRecipeMission',
          vars,
          context.jwt,
          context.fetch
        );
        const id = r?.data?.createMatanotRecipeMission?.data?.id;
        if (id) recipeMissionIds.push(String(id));
      } catch (err) {
        console.warn('[createComplexMatanot] recipeMission failed:', err);
      }
    }

    for (const r of recipeResources) {
      const resourceMode = r.mode === 'consumeExisting' ? 'consumeExisting' : 'createNew';
      const enumKindOf = mapResourceKindOf(r.kindOf);
      let pmashId: string | null = r.pmashId ?? null;

      // New resource → spawn a Pmash template so the recipe has a link target.
      if (!pmashId && resourceMode === 'createNew' && !r.mashabetahalichId) {
        try {
          const pmashVars: Record<string, unknown> = {
              name: r.name || `${String(name).trim()} - resource`,
              project: projectId,
              price: Number(r.pricePerUnit) || 0,
              easy: Number(r.pricePerUnit) || 0,
              hm: Number(r.quantityPerUnit) || 1,
              kindOf: enumKindOf || 'total',
              descrip: r.notes || '',
              publishedAt: now
            };
            if (r.assignedMemberId) pmashVars.selfProposalUser = r.assignedMemberId;
          const pmashRes = await strapi.execute(
            '138createPmashForRecipe',
            pmashVars,
            context.jwt,
            context.fetch
          );
          pmashId = pmashRes?.data?.createPmash?.data?.id
            ? String(pmashRes.data.createPmash.data.id)
            : null;
        } catch (err) {
          console.warn('[createComplexMatanot] createPmash failed:', err);
        }
      }

      const vars: Record<string, unknown> = {
        matanot: matanotId,
        quantityPerUnit: Number(r.quantityPerUnit) || 0,
        pricePerUnit: Number(r.pricePerUnit) || 0,
        mode: resourceMode,
        notes: r.notes || '',
        publishedAt: now
      };
      if (enumKindOf) vars.kindOf = enumKindOf;
      if (pmashId) vars.pmash = pmashId;
      if (r.mashabetahalichId) vars.mashabetahalich = r.mashabetahalichId;

      try {
        const resp = await strapi.execute(
          '128createMatanotRecipeResource',
          vars,
          context.jwt,
          context.fetch
        );
        const id = resp?.data?.createMatanotRecipeResource?.data?.id;
        if (id) recipeResourceIds.push(String(id));
      } catch (err) {
        console.warn('[createComplexMatanot] recipeResource failed:', err);
      }
    }
  }

  return {
    success: true,
    matanot,
    matanotId,
    processId,
    mainForumId,
    recipeMissionIds,
    recipeResourceIds,
    statusOfVoting,
    multiMember
  };
};

export const createComplexMatanotConfig: ActionConfig = {
  key: 'createComplexMatanot',
  description:
    'Create a Matanot product (simple or complex BOM) wrapped in a process anchor with a main forum',
  graphqlOperation: handler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    name: { type: 'string', required: true },
    desc: { type: 'string', required: false },
    pricingMode: { type: 'string', required: false },
    marginPct: { type: 'number', required: false },
    estimatedPrice: { type: 'number', required: false },
    currency: { type: 'string', required: false },
    fixedPrice: { type: 'number', required: false },
    kindOf: { type: 'string', required: false },
    quant: { type: 'number', required: false },
    unlimitedM: { type: 'boolean', required: false },
    dates: { type: 'string', required: false },
    datef: { type: 'string', required: false },
    oneForeProject: { type: 'boolean', required: false },
    picId: { type: 'string', required: false },
    recipeMissions: { type: 'array', required: false },
    recipeResources: { type: 'array', required: false }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be logged in to create a product' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only project members can create products'
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
        he: 'מוצר חדש להצבעה',
        en: 'New product for vote',
        ar: 'منتج جديد للتصويت'
      },
      body: {
        he: 'נוצר מוצר חדש בשם "{{name}}"',
        en: 'A new product "{{name}}" was created',
        ar: 'تم إنشاء منتج جديد "{{name}}"'
      }
    },
    channels: ['socket', 'push'],
    metadata: {
      priority: 'normal',
      url: '/gift/{{matanotId}}'
    }
  }
};
