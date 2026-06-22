// Bridge between the value-vs-value negotiation cards (negoPend / negoM) and the
// consensus mediation app (consensus.1lev1.com). A card hands its original vs.
// proposed terms to the consensus app, which runs a structured mediation and
// returns the agreed values via a `negoBridge` URL param. The final approval
// still goes through the existing vote round — the discussion shapes the
// proposal, it doesn't bypass consensus.
//
// See consensus1lev1/docs/main-repo-bridge-spec.md (§3, §4).

const CONSENSUS_BRIDGE_URL = 'https://consensus.1lev1.com/negotiation/bridge';

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
