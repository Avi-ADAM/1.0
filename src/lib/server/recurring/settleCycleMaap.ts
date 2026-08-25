/**
 * Settling one cycle of a recurring resource — one implementation, two routes.
 *
 * A recurring expense (server rent, an apartment, a stall) runs on a
 * `mashabetahalich` engine. Each month `/api/monthi` opens a cycle `Maap`, the
 * responsible member reports what was actually spent, and the rikma approves
 * that month. Settling means: the spend becomes a delivery line on the engine's
 * `Rikmash`, the cycle Maap is archived, the engine's running total grows, and
 * the deadline clock stops.
 *
 * That can now happen two ways — every member signs (`voteOnMaap`), or the
 * rikma's restime runs out with the responsible's signature already on the
 * table and nobody objecting (the timegrama finalizer, PLAN_TIMEGRAMA D1).
 * Both call this, so the two cannot settle a month differently.
 */

export interface CycleStrapi {
  execute(
    queryId: string,
    variables: Record<string, any>,
    userJwt?: string,
    fetchFn?: typeof globalThis.fetch
  ): Promise<any>;
}

export interface CycleExecCtx {
  jwt?: string;
  fetch?: typeof globalThis.fetch;
}

export interface SettleCycleMaapInput {
  /** The cycle Maap being settled. */
  maapId: string;
  projectId: string;
  /** The recurring engine this cycle belongs to. */
  mashId: string;
  /** The engine's attributes as read from Strapi (name, pricePerUnit, kindOf, rikmash, …). */
  mashAttrs: any;
  /** Fallback name when the engine has none. */
  maapName?: string | null;
  cycleIndex: number;
  /** The confirmed spend for this cycle. */
  spend: number;
  /** The full vote list to stamp on the archived Maap. */
  vots: Array<Record<string, any>>;
  /** Whose confirmation this delivery is recorded under. */
  confirmedBy: string;
  /** The clock to stop, when there is one. */
  timegramaId?: string | null;
  now?: Date;
}

export async function settleCycleMaap(
  strapi: CycleStrapi,
  ctx: CycleExecCtx,
  input: SettleCycleMaapInput
): Promise<{ rikmashId: string | null }> {
  const {
    maapId,
    projectId,
    mashId,
    mashAttrs,
    maapName,
    cycleIndex,
    spend,
    vots,
    confirmedBy,
    timegramaId = null
  } = input;
  const now = input.now ?? new Date();
  const kindOf = mashAttrs?.kindOf ?? 'monthly';
  const responsibleId = String(mashAttrs?.users_permissions_user?.data?.id ?? '');

  let rikmashId: string | null = mashAttrs?.rikmash?.data?.id ?? null;
  const delivery = {
    cycleIndex,
    deliveredAt: now.toISOString(),
    quantity: spend,
    maap: maapId,
    confirmedBy
  };

  if (rikmashId) {
    const rRes = await strapi.execute('mrGetRikmashForDelivery', { id: rikmashId }, ctx.jwt, ctx.fetch);
    const rAttrs = rRes?.data?.rikmash?.data?.attributes ?? {};
    // Rewriting the whole component array, so every existing line has to be
    // carried over verbatim — dropping one would erase a settled month.
    const existingDeliveries = (rAttrs.deliveries ?? []).map((d: any) => ({
      id: d.id,
      cycleIndex: d.cycleIndex,
      deliveredAt: d.deliveredAt,
      quantity: d.quantity,
      ...(d.note ? { note: d.note } : {}),
      ...(d.maap?.data?.id ? { maap: d.maap.data.id } : {})
    }));
    await strapi.execute(
      'mrUpdateRikmash',
      {
        id: rikmashId,
        data: {
          deliveries: [...existingDeliveries, delivery],
          total: (rAttrs.total ?? 0) + spend,
          cyclesCount: (rAttrs.cyclesCount ?? 0) + 1,
          lastDeliveryAt: now.toISOString()
        }
      },
      ctx.jwt,
      ctx.fetch
    );
  } else {
    const created = await strapi.execute(
      'mrCreateRikmash',
      {
        data: {
          name: mashAttrs?.name ?? maapName ?? 'משאב',
          project: projectId,
          mashabetahalich: mashId,
          kindOf,
          ...(responsibleId ? { users_permissions_user: responsibleId } : {}),
          total: spend,
          agprice: mashAttrs?.pricePerUnit ?? spend,
          cyclesCount: 1,
          firstDeliveryAt: now.toISOString(),
          lastDeliveryAt: now.toISOString(),
          deliveries: [delivery],
          maaps: [maapId],
          publishedAt: now.toISOString()
        }
      },
      ctx.jwt,
      ctx.fetch
    );
    rikmashId = created?.data?.createRikmash?.data?.id ?? null;
    if (rikmashId) {
      await strapi.execute('mrLinkRikmashToMashabetahalich', { id: mashId, rikmash: rikmashId }, ctx.jwt, ctx.fetch);
    }
  }

  // Archive the cycle Maap + accumulate the engine's running total.
  await strapi.execute(
    'mrUpdateCycleMaap',
    {
      id: maapId,
      data: { archived: true, vots, quantityDelivered: spend, ...(rikmashId ? { rikmash: rikmashId } : {}) }
    },
    ctx.jwt,
    ctx.fetch
  );

  await strapi.execute(
    'mrUpdateMashabetahalich',
    { id: mashId, data: { quantityDelivered: (mashAttrs?.quantityDelivered ?? 0) + spend } },
    ctx.jwt,
    ctx.fetch
  );

  // Stop the deadline clock — the cycle is settled.
  if (timegramaId) {
    await strapi.execute('mrSetTimegramaDone', { id: String(timegramaId), done: true }, ctx.jwt, ctx.fetch);
  }

  return { rikmashId };
}
