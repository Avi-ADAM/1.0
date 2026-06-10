import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    productId,
    projectId,
    userId,
    total,
    quantity,
    saleDate,
    availableQuantity,
    kindOf = 'total',
    startDate = null,
    finishDate = null,
    note = ''
  } = params as {
    productId: string;
    projectId: string;
    userId: string;
    total: number;
    quantity: number;
    saleDate: string;
    availableQuantity: number;
    kindOf?: string;
    startDate?: string | null;
    finishDate?: string | null;
    note?: string;
  };

  const now = new Date().toISOString();

  // 1. Create the sale record
  const saleVars: Record<string, unknown> = {
    project: projectId,
    matanot: productId,
    users_permissions_user: userId,
    in: Number(total),
    unit: Number(quantity),
    date: saleDate,
    publishedAt: now
  };
  if (startDate) saleVars.startDate = startDate;
  if (finishDate) saleVars.finishDate = finishDate;
  if ((note as string)?.trim()) saleVars.note = (note as string).trim();

  const saleRes = await strapi.execute('createSaleRecord', saleVars, context.jwt, context.fetch);
  const saleData = saleRes?.data?.createSale?.data;
  if (!saleData?.id) throw new Error('Failed to create sale');
  const saleId = String(saleData.id);

  // 2. Decrement product quantity if not unlimited
  let newQuantity: number | undefined;
  if (Number(quantity) > 0 && Number(availableQuantity) !== -1) {
    const newQuant = Number(availableQuantity) - Number(quantity);
    try {
      const quantRes = await strapi.execute(
        'updateMatanotQuant',
        { id: productId, quant: newQuant },
        context.jwt,
        context.fetch
      );
      newQuantity = quantRes?.data?.updateMatanot?.data?.attributes?.quant;
    } catch (err) {
      console.warn('[createSale] quantity update failed:', err);
    }
  }

  // 3. Create recurring Monter for open-ended monthly/yearly sales
  if ((kindOf === 'monthly' || kindOf === 'yearly') && startDate && !finishDate) {
    try {
      await strapi.execute(
        'createMonterForSale',
        { saleId, start: startDate },
        context.jwt,
        context.fetch
      );
    } catch (err) {
      console.warn('[createSale] monter creation failed:', err);
    }
  }

  return {
    success: true,
    saleId,
    saleIn: saleData.attributes?.in,
    newQuantity,
    matana: saleData
  };
};

export const createSaleConfig: ActionConfig = {
  key: 'createSale',
  description: 'Report a sale: create sale record, decrement product quantity, and start a recurring Monter for open-ended subscriptions',
  graphqlOperation: handler,
  paramSchema: {
    productId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    userId: { type: 'string', required: true },
    total: { type: 'number', required: true },
    quantity: { type: 'number', required: true },
    saleDate: { type: 'string', required: true },
    availableQuantity: { type: 'number', required: true },
    kindOf: { type: 'string', required: false },
    startDate: { type: 'string', required: false },
    finishDate: { type: 'string', required: false },
    note: { type: 'string', required: false }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be logged in to report a sale' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only project members can report sales'
    }
  ]
};
