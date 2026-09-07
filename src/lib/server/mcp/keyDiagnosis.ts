// src/lib/server/mcp/keyDiagnosis.ts
//
// Why a rejected key needs an answer of its own.
//
// /api/mcp used to collapse two very different callers into one branch:
// "sent no key at all" and "sent a key we refuse" both fell through to the
// public probe — HTTP 200 carrying `getPlatformInfo` + `howToConnect`. On the
// wire those are byte-identical, so the agent on the other end reads a revoked
// key as a user who never registered, and says the only thing that tool set
// suggests: run `npx 1lev1-mcp`.
//
// The user does. Nothing changes — because minting was never the missing step.
// A stale entry in a higher-precedence config was still shadowing the fresh
// key, and the next restart re-sent the dead one. The loop is stable: identical
// symptom, identical advice, identical outcome, for as many restarts as the
// user's patience allows.
//
// Two fixes, and the second is the one that matters:
//   1. classify the refusal (malformed / unknown / revoked) instead of erasing it;
//   2. tell the agent the thing it cannot deduce from its side of the socket —
//      that the old entry must be DELETED, not merely re-minted.

import {
  extractUserIdFromKey,
  verifyApiKeyDetailed,
  normalizeApiKeyScopes
} from '$lib/server/apiKeys';

/** Where the key stood when we looked it up. */
export type KeyVerdict =
  /** No `Authorization` header at all — an anonymous probe, not a failure. */
  | 'absent'
  /** Not shaped like a 1lev1 key; no user id to extract. */
  | 'malformed'
  /** Well-formed, but no live record matches — deleted, typo'd, or wrong site. */
  | 'unknown'
  /** The record exists and its owner turned it off. */
  | 'revoked'
  /** Verified. */
  | 'ok';

/** True for every verdict that means "a key was presented and refused". */
export function isRejected(verdict: KeyVerdict): boolean {
  return verdict === 'malformed' || verdict === 'unknown' || verdict === 'revoked';
}

export const SITE_ORIGIN = 'https://1lev1.com';
export const MCP_ENDPOINT = 'https://api.1lev1.com/api/mcp';
export const CONNECT_URL = `${SITE_ORIGIN}/mcp-connect`;
export const KEYS_PAGE_URL = `${SITE_ORIGIN}/me/settings/mcp`;

/**
 * The trap, spelled out for whoever is reading the tool result.
 *
 * `npx 1lev1-mcp` writes user-level config. It does not — and from where it
 * runs, cannot reliably — find the other places the same server name is already
 * configured. In Claude Code a project's `.mcp.json` outranks the user-level
 * entry, so one stale block there silently wins over every key ever minted
 * afterwards. Every MCP client has some version of this precedence ladder.
 */
export const SHADOWING_WARNING =
  'Minting a new key does NOT remove an old one. MCP clients read several config ' +
  'files in precedence order, and a stale entry in a higher-precedence file keeps ' +
  'winning over the fresh key — so re-running the installer and restarting looks ' +
  'identical every time. Delete the other entries first, then mint.';

/** Where a `1lev1-mcp` entry hides, highest precedence first. */
export const CONFIG_LOCATIONS = [
  '<project>/.mcp.json  — checked into the repo; OUTRANKS the user-level file in Claude Code',
  '~/.claude.json  → projects["<abs project path>"].mcpServers  — per-project override',
  '~/.claude.json  → mcpServers  — user level; this is the only one `npx 1lev1-mcp` writes',
  '~/.claude/settings.json and <project>/.claude/settings.local.json  — some setups keep it here',
  'Other clients: ~/.cursor/mcp.json, ~/.codeium/windsurf/mcp_config.json, VS Code settings.json'
];

const WHY: Record<'malformed' | 'unknown' | 'revoked', string> = {
  malformed:
    'The value in the Authorization header is not a 1lev1 API key — it carries no ' +
    'user id. Usually a placeholder that was never replaced (“Bearer YOUR_KEY”), a ' +
    'truncated paste, or a key belonging to a different service.',
  unknown:
    'The key is well-formed but no live key matches it. It was deleted from the ' +
    'account, mistyped, or minted against a different 1lev1 deployment.',
  revoked:
    'The key exists and is switched off. Two ways that happens, and the first is ' +
    'self-inflicted by the repair itself: approving again at /mcp-connect mints a new ' +
    'key AND revokes the previous one, so every re-run of the installer kills the key ' +
    'the stale config entry is still sending — each attempt leaves the setup worse, ' +
    'not merely unchanged. The other way is a deliberate revocation after a leak, ' +
    'usually a key committed to a repository; check whether the file holding it is ' +
    'tracked by git before writing a replacement into it.'
};

export interface RepairPlan {
  status: 'rejected';
  reason: 'malformed' | 'unknown' | 'revoked';
  connected: false;
  message: string;
  why: string;
  warning: string;
  /** Ordered, and step 1 is the one people skip. */
  fix: string[];
  lookIn: string[];
  mintCommand: string;
  connectUrl: string;
  manageKeysUrl: string;
  endpoint: string;
  agentGuidance: string[];
}

/**
 * The full repair story for a refused key.
 *
 * Written to be read by an agent and relayed to a human, so it states the
 * diagnosis before the steps: an agent that only sees "run this command" will
 * paste the command a third time.
 */
export function repairPlan(reason: 'malformed' | 'unknown' | 'revoked'): RepairPlan {
  return {
    status: 'rejected',
    reason,
    connected: false,
    message:
      `The 1lev1 API key this client sent was rejected (${reason}). You are NOT ` +
      'connected to the user\'s account, and no account data is available on this ' +
      'connection. Do not present platform data you did not read from a tool.',
    why: WHY[reason],
    warning: SHADOWING_WARNING,
    fix: [
      'FIRST, find every place a "1lev1-mcp" server is configured and DELETE the stale ' +
        'ones, so exactly one entry remains. This step is what makes the rest work; ' +
        'skipping it is why a reinstall appears to do nothing.',
      `Mint a replacement: run \`npx 1lev1-mcp\` (it opens ${CONNECT_URL}, the user ` +
        'approves, and it writes the key into the user-level config).',
      `Manual alternative: ${KEYS_PAGE_URL} → create a key → set the header ` +
        `{ "Authorization": "Bearer <key>" } against ${MCP_ENDPOINT}.`,
      'Restart the MCP client so it re-reads its configuration.',
      'Never leave a key in a file tracked by git. If the config file is committed, ' +
        'revoke that key and keep the replacement in the user-level config only.'
    ],
    lookIn: CONFIG_LOCATIONS,
    mintCommand: 'npx 1lev1-mcp',
    connectUrl: CONNECT_URL,
    manageKeysUrl: KEYS_PAGE_URL,
    endpoint: MCP_ENDPOINT,
    agentGuidance: [
      'Tell the user plainly that their key was rejected — not that they are unregistered.',
      'Walk step 1 (delete the stale entries) before suggesting the installer, and say ' +
        'why: a higher-precedence config file is overriding the new key.',
      'A quick way to prove which key is live: POST {"jsonrpc":"2.0","id":1,' +
        `"method":"tools/list","params":{}} to ${MCP_ENDPOINT} with the key in the ` +
        'header. A working key lists the full mission/timer tool set; a rejected one ' +
        'lists only the connection tools you are reading now.',
      'Do not retry other tools on this connection — none of them are exposed.'
    ]
  };
}

export interface KeyCheck {
  /** The owning user (with normalized scopes) when the key verifies, else null. */
  user: any | null;
  verdict: KeyVerdict;
}

/**
 * Verify a raw key and keep the reason it failed.
 *
 * `verifyApiKey` maps malformed, unknown and revoked all to `null`, which is
 * exactly the information the caller needs and exactly what it throws away.
 * The detailed lookup is cached upstream, so this costs no extra round trip.
 */
export async function checkApiKey(rawKey: string | null | undefined): Promise<KeyCheck> {
  if (!rawKey) return { user: null, verdict: 'absent' };
  if (!extractUserIdFromKey(rawKey)) return { user: null, verdict: 'malformed' };

  const detailed = await verifyApiKeyDetailed(rawKey);
  if (!detailed) return { user: null, verdict: 'unknown' };
  if (detailed.revoked) return { user: null, verdict: 'revoked' };

  const scopes = normalizeApiKeyScopes(detailed.scopes);
  return {
    user: scopes ? { ...detailed.user, scopes } : detailed.user,
    verdict: 'ok'
  };
}
