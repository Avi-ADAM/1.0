/**
 * Turn a product's bill of materials into live work in its rikma, for one deal.
 *
 * Moved out of `createSheirutFromPending` (behaviour unchanged there) so the
 * off-site deal (`startOffsiteDeal`, docs/inprogress/PLAN_OFFSITE_CLIENT.md)
 * starts the same work the same way:
 *
 * - a mission line that already holds a `mesimabetahalich` keeps it — the timer
 *   already running on it is now the deal's work, no second mission (and a
 *   reminder act, unless `remindExisting: false`);
 * - a line without one opens a mission in progress for whoever committed to it
 *   (`pendm.rishon`), or for `fallbackSellerId`, plus a reminder act;
 * - `consumeExisting` lines are left to their own flow (M5.5);
 * - a resource line with a `pmash` and no `mashabetahalich` opens a maap.
 *
 * Every write is best-effort, as it always was: a failed line is logged and the
 * rest go on. Returns the in-progress mission of every mission line it reached.
 */

type Exec = (qid: string, vars: Record<string, unknown>) => Promise<any>;

export interface ActivateBomInput {
  projectId: string;
  /** `matanot.data` as read with its recipe lines (the shape qid 72 reads). */
  matanot: { id?: string | number; attributes?: any } | null | undefined;
  /** Who works a line nobody committed to — the member opening the deal. */
  fallbackSellerId: string | null | undefined;
  /** false: no reminder act on a line that already had its mission (default: remind, as before). */
  remindExisting?: boolean;
}

export async function activateBom(exec: Exec, input: ActivateBomInput): Promise<{ missionIds: string[] }> {
  const { projectId, matanot: product, fallbackSellerId } = input;
  const matanot = product?.attributes;
  if (!matanot) return { missionIds: [] };
  const now = new Date().toISOString();
  const recipeMissions: any[] = matanot.matanot_recipe_missions?.data ?? [];
  const recipeResources: any[] = matanot.matanot_recipe_resources?.data ?? [];
  const missionIds: string[] = [];

  for (const rm of recipeMissions) {
    const attrs = rm.attributes ?? {};
    const existingMesima = attrs.mesimabetahalich?.data;
    const pendm = attrs.pendm?.data;
    let mesimaId: string | null = existingMesima?.id ? String(existingMesima.id) : null;
    // The seller (rishon on pendm) who committed to doing this mission, not the
    // client who ordered the product.
    const sellerId = pendm?.attributes?.rishon?.data?.id
      ? String(pendm.attributes.rishon.data.id)
      : fallbackSellerId
        ? String(fallbackSellerId)
        : null;
    const lineName = pendm?.attributes?.name || attrs.notes || '';

    if (!mesimaId && attrs.mode !== 'consumeExisting') {
      try {
      const mesData: Record<string, unknown> = {
        project: projectId,
        name: lineName || `${matanot.name} - משימה`,
        descrip: pendm?.attributes?.descrip || '',
        hoursassinged: Number(attrs.hoursPerUnit) || 0,
        perhour: Number(attrs.ratePerHour) || 0,
        users_permissions_user: sellerId,
        publishedAt: now
      };
      const missionId = pendm?.attributes?.mission?.data?.id;
      if (missionId) mesData.mission = String(missionId);

      const mesRes = await exec('139createMesimabetahalich', { data: mesData });
      mesimaId = mesRes?.data?.createMesimabetahalich?.data?.id
        ? String(mesRes.data.createMesimabetahalich.data.id)
        : null;
      } catch (err) {
        console.warn('[activateBom] createMesimabetahalich failed:', err);
      }
    }

    if (mesimaId) missionIds.push(mesimaId);
    // A line already being worked on gets no reminder when the caller says so — the
    // member is already at it (the off-site deal on a running timer).
    if (mesimaId && !(existingMesima?.id && input.remindExisting === false)) {
      try {
        await exec('140createAct', {
          data: {
            project: projectId,
            shem: `יש לך מוצר ליצור - ${matanot.name}`,
            des: `נדרשת לבצע משימה "${lineName}" עבור ${matanot.name}`,
            isAssigned: true,
            my: sellerId,
            vali: sellerId,
            mesimabetahaliches: mesimaId,
            publishedAt: now
          }
        });
      } catch (err) {
        console.warn('[activateBom] createAct reminder failed:', err);
      }
    }
  }

  for (const rr of recipeResources) {
    const attrs = rr.attributes ?? {};
    if (attrs.mode === 'consumeExisting' || attrs.mashabetahalich?.data?.id) continue;
    const pmash = attrs.pmash?.data;
    if (!pmash?.id) continue;
    try {
      await exec('141createMaap', {
        data: {
          project: projectId,
          name: pmash.attributes?.name || `${matanot.name} - משאב`,
          pmash: String(pmash.id),
          archived: false,
          publishedAt: now
        }
      });
    } catch (err) {
      console.warn('[activateBom] createMaap failed:', err);
    }
  }

  return { missionIds };
}
