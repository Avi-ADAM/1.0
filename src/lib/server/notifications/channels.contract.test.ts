/**
 * Ratchet: a notification states its `intent`, it does not pick channels
 * (`./intent.ts`, docs/inprogress/PLAN_REALTIME_MIGRATION.md §6).
 *
 * LEGACY_CHANNEL_LISTS is every file that still writes a `channels: [...]`
 * literal. It only shrinks: a new file with a literal fails, and a listed file
 * that no longer has one fails too — take it off the list in the same change
 * (and mark the action in docs/inprogress/REALTIME_TRACKING.md).
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const SCAN = ['src/lib/server', 'src/routes/api'];
const SKIP = /\.test\.|\/examples\/|^src\/lib\/server\/notifications\//;

/** `channels: [` or `channels: cond ? [` — not `channels: decision.channels` (the digest's own field). */
const LITERAL = /\bchannels\s*:\s*(\[|[^,\n]*\?\s*\[)/;

const LEGACY_CHANNEL_LISTS = new Set([
  'src/lib/server/actions/configs/approveHaluka.ts',
  'src/lib/server/actions/configs/approveMeeting.ts',
  'src/lib/server/actions/configs/archiveUserResource.ts',
  'src/lib/server/actions/configs/chat.ts',
  'src/lib/server/actions/configs/example.ts',
  'src/lib/server/actions/configs/joinMeeting.ts',
  'src/lib/server/actions/configs/startMeeting.ts',
  'src/lib/server/actions/configs/updateTask.ts',
  'src/routes/api/guest/message/+server.js',
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|js)$/.test(name)) out.push(relative(ROOT, p).split(sep).join('/'));
  }
  return out;
}

const withLiteral = SCAN.flatMap((d) => walk(join(ROOT, d)))
  .filter((f) => !SKIP.test(f))
  .filter((f) => LITERAL.test(readFileSync(join(ROOT, f), 'utf8')));

describe('notification channels come from intent', () => {
  it('no new file picks channels by hand', () => {
    const fresh = withLiteral.filter((f) => !LEGACY_CHANNEL_LISTS.has(f));
    expect(fresh, 'use notification.intent instead of channels: [...]').toEqual([]);
  });

  it('a file that moved to intent is off the legacy list', () => {
    const found = new Set(withLiteral);
    const done = [...LEGACY_CHANNEL_LISTS].filter((f) => !found.has(f));
    expect(done, 'remove these from LEGACY_CHANNEL_LISTS').toEqual([]);
  });
});
