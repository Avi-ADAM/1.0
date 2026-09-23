/**
 * The `fx-rate` collection as an `FxStore` (docs/PLAN_MULTI_CURRENCY.md D-C5).
 *
 * Service token only: the table is not member data, no user writes it, and a
 * client has no reason to reach it except through `/api/fx`. Needs the
 * collection's find/create permission on the server's API token (Settings →
 * API Tokens); without it every call fails soft and the service simply asks the
 * provider once per process instead of once per day.
 */

import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';
import { adminToken } from '$lib/server/adminToken.js';
import type { FxRow, FxStore } from './rates.js';

async function gql(fetchFn: typeof fetch, query: string, variables: Record<string, unknown>) {
  const res = await fetchFn(STRAPI_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken()}` },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  // /graphql answers a validation error with HTTP 200 — check the body, not the status.
  if (json?.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

const FIELDS = 'data { id attributes { date base rates source } }';

function toRow(data: any): FxRow | null {
  const a = data?.[0]?.attributes;
  if (!a) return null;
  return { date: a.date, base: a.base, rates: a.rates, source: a.source };
}

export function strapiFxStore(fetchFn: typeof fetch): FxStore {
  return {
    async getDay(date) {
      const d = await gql(
        fetchFn,
        `query FxDay($date: String!) { fxRates(filters: { date: { eq: $date } }, pagination: { limit: 1 }) { ${FIELDS} } }`,
        { date }
      );
      return toRow(d?.fxRates?.data);
    },
    async getLatest() {
      const d = await gql(
        fetchFn,
        `query FxLatest { fxRates(sort: ["date:desc"], pagination: { limit: 1 }) { ${FIELDS} } }`,
        {}
      );
      return toRow(d?.fxRates?.data);
    },
    async putDay(row) {
      try {
        await gql(
          fetchFn,
          `mutation FxPut($data: FxRateInput!) { createFxRate(data: $data) { data { id } } }`,
          { data: { ...row, fetchedAt: new Date().toISOString() } }
        );
      } catch (e) {
        // Two cold instances racing on the first request of the day: `date` is
        // unique, the second create loses, and the first one's row is just as good.
        if (e instanceof Error && /unique/i.test(e.message)) return;
        throw e;
      }
    }
  };
}
