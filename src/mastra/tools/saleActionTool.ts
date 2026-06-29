import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { sendToSer } from '../../lib/send/sendToSer.js';
import { getMcpContext } from '../../lib/server/mcpContext.js';

export const saleActionTool = createTool({
  id: 'saleActionTool',
  description: "Fetch the current user's sellable products across all their projects, to initiate a sale report. Returns a product list for the UI to render.",
  inputSchema: z.object({}),
  execute: async () => {
    const ctx = getMcpContext();
    if (!ctx?.userId || !ctx?.fetchInstance) {
      return { success: false, message: 'Missing user context', products: [] };
    }

    const isServerRequest = !ctx.isInternalBot;

    try {
      const res = await sendToSer(
        { uid: ctx.userId },
        'saleCenterUserProducts',
        0, 0, isServerRequest,
        ctx.fetchInstance
      );

      const projectsData =
        res?.data?.usersPermissionsUser?.data?.attributes?.projects_1s?.data ?? [];

      const products: any[] = [];
      for (const project of projectsData) {
        const projectUsers = project.attributes.user_1s?.data ?? [];
        for (const product of project.attributes.matanotofs?.data ?? []) {
          products.push({
            id: product.id,
            name: product.attributes.name,
            price: product.attributes.price ?? 0,
            quant: product.attributes.quant,
            kindOf: product.attributes.kindOf ?? 'total',
            projectId: project.id,
            projectName: project.attributes.projectName,
            projectUsers // [{ id, attributes: { username } }]
          });
        }
      }

      return {
        success: true,
        products,
        count: products.length,
        userId: ctx.userId
      };
    } catch (error: any) {
      console.error('[saleActionTool] error:', error);
      return { success: false, message: error.message, products: [] };
    }
  }
});
