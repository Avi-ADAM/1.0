import type { PageServerLoad } from './$types';
import { loadRikmaVariantContext } from '$lib/server/shop/productEditor.js';
import { loadBomPickers, NO_BOM_PICKERS } from '$lib/server/shop/bomPickers.js';

export const load: PageServerLoad = async ({ params, fetch, parent }) => {
  const { projectId } = params;
  // The axes and SKUs read with the service token: members only.
  await parent();

  try {
    const variantContextRead = loadRikmaVariantContext(projectId, { fetch });
    const pickers = await loadBomPickers(projectId, fetch);
    const variantContext = await variantContextRead;
    return {
      projectId,
      ...pickers,
      rikmaAxes: variantContext.rikmaAxes,
      takenSkus: variantContext.takenSkus
    };
  } catch (e) {
    console.error('[sales/new] load error', e);
    return { projectId, ...NO_BOM_PICKERS, rikmaAxes: [], takenSkus: [] };
  }
};
