// Regenerates spec/consent-v1/*.json from the reference TS implementation
// (docs/SPEC_CONSENT_FORMAT.md §10). Sets the env flag cross-platform — an
// inline `VAR=1 cmd` npm script does not run under Windows cmd.
//
// Regenerating is a CONTRACT CHANGE: review the diff. If ids or state roots
// moved for existing inputs, the change broke every signature/commitment
// already in the wild — bump a version instead.

import { spawnSync } from 'node:child_process';

const res = spawnSync('npx', ['vitest', 'run', 'src/lib/consent/vectors/vectors.test.ts'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, WRITE_CONSENT_VECTORS: '1' }
});
process.exit(res.status ?? 1);
