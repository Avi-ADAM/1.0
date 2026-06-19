import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    projectId,
    memberId,
    amount,
    publishedAt,
    adjustDirection,
    adjustReason,
    proposedAmount,
    sourceProjectId,
    transferHalukaIds
  } = params as {
    projectId: string;
    memberId: string;
    amount: number;
    publishedAt: string;
    adjustDirection?: string;
    adjustReason?: string | null;
    proposedAmount?: number;
    sourceProjectId?: string | null;
    transferHalukaIds?: Array<string | number> | null;
  };

  // Site-share income is auto-approved (PLAN §5). We record an audit trail in the
  // Sale note (no dedicated adjustment fields on Sale yet — see
  // src/generated/SITE_SHARE_TRANSFER_SPEC.md): the adjustment direction/reason/
  // original suggestion, the source rikma, and the cross-rikma transfer Haluka ids
  // so an archive can link the income (here) to the physical transfer (source project).
  const parts: string[] = ['site-share'];
  if (adjustDirection && adjustDirection !== 'as_is') {
    parts.push(adjustDirection);
    if (typeof proposedAmount === 'number') parts.push(`proposed=${proposedAmount}`);
    if (adjustReason) parts.push(`reason="${adjustReason}"`);
  }
  parts.push(`paid=${amount}`);
  if (sourceProjectId) parts.push(`from_project=${sourceProjectId}`);
  if (Array.isArray(transferHalukaIds) && transferHalukaIds.length > 0) {
    parts.push(`halukas=${transferHalukaIds.join(',')}`);
  }
  const note: string = parts.join(' · ');

  const res = await strapi.execute(
    '206createPlatformSale',
    {
      project: String(projectId),
      userId: String(memberId),
      amount: parseFloat(String(amount)),
      publishedAt,
      note,
    },
    context.jwt,
    context.fetch,
  );

  const saleId = res?.data?.createSale?.data?.id;
  return {
    data: saleId ? { success: true, saleId } : { success: false },
    updateStrategy: { type: 'none' },
  };
};

export const createPlatformSaleConfig: ActionConfig = {
  key: 'createPlatformSale',
  description: 'Record the site-share income as a Sale in the platform project for its main product.',
  graphqlOperation: handler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    memberId: { type: 'string', required: true },
    amount: { type: 'number', required: true },
    publishedAt: { type: 'string', required: true },
    adjustDirection: { type: 'string', required: false },
    adjustReason: { type: 'string', required: false },
    proposedAmount: { type: 'number', required: false },
    sourceProjectId: { type: 'string', required: false },
    transferHalukaIds: { type: 'array', required: false },
  },
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'none' },
};
