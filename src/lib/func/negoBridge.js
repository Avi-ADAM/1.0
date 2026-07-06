// Bridge between the value-vs-value negotiation cards (negoPend / negoM) and the
// consensus mediation app (consensus.1lev1.com). A card hands its original vs.
// proposed terms to the consensus app, which runs a structured mediation and
// returns the agreed values via a `negoBridge` URL param. The final approval
// still goes through the existing vote round — the discussion shapes the
// proposal, it doesn't bypass consensus.
//
// See consensus1lev1/docs/main-repo-bridge-spec.md (§3, §4).

import { sendToSer } from '$lib/send/sendToSer.js';

const CONSENSUS_APP_URL = 'https://consensus.1lev1.com';
const CONSENSUS_BRIDGE_URL = `${CONSENSUS_APP_URL}/negotiation/bridge`;

/**
 * base64url-encode a JSON-serializable object (URL-safe, no padding).
 * @param {unknown} obj
 */
export function encodeBridgePayload(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode a base64url `negoBridge` param back to its object, or null if invalid.
 * @param {string | null | undefined} raw
 */
export function decodeBridgeParam(raw) {
  if (!raw) return null;
  try {
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

/**
 * @typedef {Object} BridgeField
 * @property {string} key    stable matching key for the value on return
 * @property {string} label  Issue title in the discussion — keep it stable
 * @property {'text'|'number'|'date'} kind
 * @property {any} original
 * @property {any} proposed
 */

/**
 * Open the consensus mediation discussion for a negotiation card in a new tab.
 * Sends every negotiable term (unchanged ones are marked agreed in the middle),
 * with `proposed` being the current editable value.
 * @param {{ sourceType: string, sourceId: string|number, title?: any,
 *   projectName?: any, fields: BridgeField[] }} args
 */
export function openNegoBridge({ sourceType, sourceId, title, projectName, fields }) {
  if (typeof window === 'undefined') return;
  const returnUrl = new URL(window.location.href);
  returnUrl.searchParams.delete('negoBridge');
  const payload = {
    v: 1,
    sourceType,
    sourceId: String(sourceId),
    title: title ?? null,
    projectName: projectName ?? null,
    returnUrl: returnUrl.toString(),
    fields
  };
  window.open(
    `${CONSENSUS_BRIDGE_URL}?d=${encodeBridgePayload(payload)}`,
    '_blank',
    'noopener'
  );
}

/**
 * Read the `negoBridge` return param and return its agreed values, but only when
 * it targets the given source id (so other cards don't get prefilled).
 * @param {string|number} sourceId
 * @returns {Record<string, any> | null}
 */
export function readNegoBridgeReturn(sourceId) {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('negoBridge');
  const agreed = decodeBridgeParam(raw);
  if (agreed?.v === 1 && String(agreed.sourceId) === String(sourceId) && agreed.values) {
    return agreed.values;
  }
  return null;
}

/**
 * @typedef {Object} BridgeResolution
 * @property {1} v
 * @property {string} sourceType
 * @property {string} sourceId
 * @property {string} positionId  the position the decision was derived from
 * @property {string} heading     title of the chosen position
 * @property {string} summary     its description — human summary of the agreement
 * @property {Record<string, string|number>} values  key → agreed value
 * @property {Array<{key: string, label: string, kind: string, value: any, body: string|null, stance: number|null}>} terms
 * @property {string} decidedAt   ISO timestamp
 */

/**
 * The durable half of the way back: fetch the decision that was SIGNED in the
 * consensus discussion and persisted on the Negotiation record. Unlike the
 * `negoBridge` URL param (which only reaches whoever clicked the link), this is
 * visible to every member who opens the source card. Returns null when there is
 * no discussion, no signed decision yet, or the request fails (e.g. the
 * `resolution` field is not in Strapi yet) — callers just skip the banner.
 *
 * @param {string} sourceType e.g. 'pmash' | 'mission' | 'tosplit'
 * @param {string|number} sourceId
 * @param {typeof globalThis.fetch} [fetchFn]
 * @returns {Promise<{ negotiationId: string, topic: string, status: string,
 *   discussionUrl: string, resolution: BridgeResolution } | null>}
 */
export async function fetchBridgeResolution(sourceType, sourceId, fetchFn = globalThis.fetch) {
  try {
    const res = await sendToSer(
      { sourceType, sourceId: String(sourceId) },
      'GetNegotiationResolutionBySource',
      0,
      0,
      false,
      fetchFn,
      { silent: true }
    );
    const node = res?.data?.negotiations?.data?.[0];
    if (!node) return null;
    const a = node.attributes ?? {};
    let resolution = a.resolution;
    if (typeof resolution === 'string') {
      try {
        resolution = JSON.parse(resolution);
      } catch {
        return null;
      }
    }
    if (resolution?.v !== 1 || !resolution.values) return null;
    if (String(resolution.sourceId) !== String(sourceId)) return null;
    return {
      negotiationId: String(node.id),
      topic: a.topic ?? '',
      status: a.status ?? '',
      discussionUrl: `${CONSENSUS_APP_URL}/negotiation/${node.id}`,
      resolution
    };
  } catch {
    return null;
  }
}
