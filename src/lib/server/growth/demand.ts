/**
 * Reads customer demand for the Growth Agent (PLAN_GROWTH_AGENT §9.2, §10.3):
 * the open concierge wishes of the last DEMAND_DAYS, under the server token,
 * reduced to counts per category and place by `$lib/growth/demand`.
 *
 * Only an operator path calls this (the /growth layout after the operator
 * check, the growth MCP tools), and only counts leave it. Cached for a few
 * minutes: it walks every open wish, and the dashboard reloads often.
 * A failed read is `null` — "demand unknown", shown as such — never an empty
 * summary that would read as "nobody is asking".
 */

import { DEMAND_DAYS, summarizeDemand, wishFromNode, type DemandSummary, type DemandWish } from '$lib/growth/demand';

type Execute = (qid: string, vars: Record<string, unknown>, jwt?: string, fetchFn?: typeof fetch) => Promise<any>;

const PAGE = 200;
const MAX_ROWS = 5000;
const TTL_MS = 5 * 60 * 1000;

let cache: { at: number; value: DemandSummary } | null = null;

export async function loadDemand(
  strapi: { execute: Execute },
  fetchFn?: typeof fetch,
  now: number = Date.now()
): Promise<DemandSummary | null> {
  if (cache && now - cache.at < TTL_MS) return cache.value;
  try {
    const since = new Date(now - DEMAND_DAYS * 86_400_000).toISOString();
    const wishes: DemandWish[] = [];
    for (let start = 0; start < MAX_ROWS; start += PAGE) {
      const res = await strapi.execute('growthDemandWishes', { since, start, limit: PAGE }, undefined, fetchFn);
      if (res?.errors?.length) throw new Error(res.errors.map((e: any) => e?.message).join('; '));
      const data = res?.data?.ratsons?.data;
      if (!Array.isArray(data)) throw new Error('unexpected answer');
      for (const node of data) {
        const w = wishFromNode(node);
        if (w) wishes.push(w);
      }
      if (data.length < PAGE) break;
    }
    const value = summarizeDemand(wishes, now);
    cache = { at: now, value };
    return value;
  } catch (e) {
    console.warn('[growth] demand read failed:', e);
    return null;
  }
}

/** Tests only. */
export function clearDemandCache(): void {
  cache = null;
}
