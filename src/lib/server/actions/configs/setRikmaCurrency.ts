/**
 * `setRikmaCurrency` — choose the currency a rikma counts in
 * (docs/PLAN_MULTI_CURRENCY.md D-C8).
 *
 * Deliberately **not** part of `updateProjectDetails`: the other fields there
 * are text, and a wrong one is a typo. This one re-denominates every number in
 * the rikma, so it comes with a hard gate — it is allowed only while nothing
 * has been recorded in money yet. Past that point the rows themselves hold
 * amounts in the old currency; flipping the label would silently multiply or
 * divide every balance, every split and every share. Changing it afterwards
 * needs a conversion of the stored rows and the rikma's consent to it
 * (O-C1, `rebaseCurrency`), which is not built.
 *
 * Nothing about *display* depends on this: every member already reads amounts
 * in their own currency. This only decides which currency the rikma's own
 * books are kept in.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';
import { normalizeCode } from '$lib/money/currencies.js';
import { rikmaCurrency } from '$lib/money/resolve.js';

async function gql(fetchFn: typeof fetch, jwt: string, query: string, variables: Record<string, unknown>) {
  const res = await fetchFn(STRAPI_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  // A GraphQL error arrives with HTTP 200; the body is the only truth.
  if (json?.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

/**
 * "Has any money been written down here yet?" — one round-trip, counts only.
 * A product, a mission or a resource priced at zero does not count: nothing
 * about it changes meaning under another currency.
 */
const MONEY_PROBE = `
  query RikmaHasMoney($pid: ID!) {
    project(id: $pid) { data { attributes { currencyCode projectName } } }
    sales(filters: { project: { id: { eq: $pid } } }, pagination: { limit: 1 }) {
      meta { pagination { total } }
    }
    halukas(filters: { project: { id: { eq: $pid } } }, pagination: { limit: 1 }) {
      meta { pagination { total } }
    }
    matanots(filters: { projectcreates: { id: { eq: $pid } }, price: { gt: 0 } }, pagination: { limit: 1 }) {
      meta { pagination { total } }
    }
    mesimabetahaliches(filters: { project: { id: { eq: $pid } }, perhour: { gt: 0 } }, pagination: { limit: 1 }) {
      meta { pagination { total } }
    }
    openMissions(filters: { project: { id: { eq: $pid } }, perhour: { gt: 0 } }, pagination: { limit: 1 }) {
      meta { pagination { total } }
    }
    mashabetahaliches(filters: { project: { id: { eq: $pid } }, price: { gt: 0 } }, pagination: { limit: 1 }) {
      meta { pagination { total } }
    }
  }
`;

const total = (node: any) => Number(node?.meta?.pagination?.total ?? 0);

export async function rikmaHasMoney(
  fetchFn: typeof fetch,
  jwt: string,
  projectId: string
): Promise<{ hasMoney: boolean; current: string }> {
  const d = await gql(fetchFn, jwt, MONEY_PROBE, { pid: String(projectId) });
  const hasMoney =
    total(d?.sales) + total(d?.halukas) + total(d?.matanots) + total(d?.mesimabetahaliches) +
      total(d?.openMissions) + total(d?.mashabetahaliches) >
    0;
  return { hasMoney, current: rikmaCurrency(d?.project?.data?.attributes) };
}

const handler: ActionExecutionHandler = async (params, context) => {
  const projectId = String(params.projectId);
  const code = normalizeCode(params.currency);
  if (!code) throw new Error('currency must be an ISO-4217 code, e.g. "ILS" or "USD"');

  const jwt = context.jwt as string;
  const fetchFn = context.fetch as typeof fetch;

  const { hasMoney, current } = await rikmaHasMoney(fetchFn, jwt, projectId);
  if (code === current) {
    return { data: { currencyCode: current, changed: false }, updateStrategy: { type: 'none' } };
  }
  if (hasMoney) {
    throw new Error(
      `This rikma already records money in ${current}, so its currency can no longer be changed — every stored amount is in ${current}`
    );
  }

  const d = await gql(
    fetchFn,
    jwt,
    'mutation SetRikmaCurrency($id: ID!, $code: String) { updateProject(id: $id, data: { currencyCode: $code }) { data { id attributes { currencyCode } } } }',
    { id: projectId, code }
  );

  return {
    data: { currencyCode: d?.updateProject?.data?.attributes?.currencyCode ?? code, changed: true },
    updateStrategy: { type: 'fullRefresh' }
  };
};

export const setRikmaCurrencyConfig: ActionConfig = {
  key: 'setRikmaCurrency',
  description:
    "Set the currency a rikma keeps its books in. Allowed only while no money has been recorded yet (PLAN_MULTI_CURRENCY D-C8); display currency is each member's own and unaffected.",
  graphqlOperation: handler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    currency: { type: 'string', required: true, description: 'ISO-4217 code, e.g. ILS / USD / EUR' }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only a member of the rikma can set its currency'
    }
  ]
};
