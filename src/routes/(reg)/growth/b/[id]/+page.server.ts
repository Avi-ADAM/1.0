import { error } from '@sveltejs/kit';
import { growthRepository } from '$lib/server/growth/repo';
import { phoneKey } from '$lib/growth/dedupe';
import type { PageServerLoad } from './$types';

/** One business: the full record, behind the layout's operator check. */
export const load: PageServerLoad = async ({ params, parent, depends }) => {
  depends(`growth:prospect:${params.id}`);
  const { access } = await parent();
  if (access !== 'ok') error(403, 'GROWTH_NOT_OPERATOR');
  const repo = growthRepository();
  const prospect = repo ? await repo.get(params.id) : null;
  if (!prospect) error(404, 'GROWTH_NOT_FOUND');
  return { prospect, phoneDigits: phoneKey(prospect.phone) };
};
