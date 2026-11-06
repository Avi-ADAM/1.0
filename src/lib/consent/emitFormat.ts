// B5 (PLAN_DISTRIBUTED_EXECUTION) — the one switch for what signers EMIT.
//
// Readers accept both forms already: `v: 1` and `v: 2` events (SPEC §4),
// `device` as the SPKI or its deviceId (B4, §1), and state roots v2 and v3
// (§7). What a signer writes is decided here, and only here:
//
//   off (today) — `v: 1`, `device` = the SPKI, snapshots under state root v2
//   on          — `v: 2`, `device` = deviceId, snapshots under state root v3
//
// A client older than the readers DROPS an event it cannot read (bad shape /
// unknown device), and its chain silently lacks it. So the order is: deploy
// the readers (Vercel + VPS), wait out a window long enough for every open tab
// and installed client to update, and only then flip this — in a commit of its
// own. Never an env var: every signer must agree, and a per-host setting
// would let two of them disagree.

export const EMIT_FORMAT_V2 = false as boolean;

/** `v` of every ConsentEvent this build signs. */
export const EMIT_EVENT_V: 1 | 2 = EMIT_FORMAT_V2 ? 2 : 1;
