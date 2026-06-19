/**
 * Guardrail: prevent new direct-to-Strapi GraphQL calls from client code.
 *
 * See docs/PLAN_PROXY_SECURITY.md §3.4. Once Strapi is locked to localhost,
 * any client (.svelte) component that calls Strapi's /graphql directly (via
 * VITE_URL or a baseUrl) will break — and until then it leaks the data path
 * around the vetted /api/send proxy. This script fails CI when a NEW offender
 * appears, while allowlisting the known-remaining ones still being migrated.
 *
 * As each allowlisted file is migrated to sendToSer/qids, remove it from
 * BASELINE below. The script also fails if an allowlisted file no longer has a
 * direct call (so the list stays honest and shrinks).
 *
 * Run: node scripts/check-proxy-security.mjs   (or: npm run check:proxy)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');

// Files known to still call Strapi /graphql directly from the client.
// Shrink this list as components are migrated; never add to it.
const BASELINE = new Set([
	'src/lib/components/addnew/addNewMission.svelte',
	'src/lib/components/addnew/addNewRole.svelte',
	'src/lib/components/addnew/addNewRoleToSkill.svelte',
	'src/lib/components/addnew/addNewSkill.svelte',
	'src/lib/components/addnew/addNewSkillToRole.svelte',
	'src/lib/components/addnew/addnewWorkway.svelte',
	'src/lib/components/addnew/addnewval.svelte',
	'src/lib/components/addnew/choosRole.svelte',
	'src/lib/components/lev/reqtosherut.svelte',
	'src/lib/components/main/amana.svelte',
	'src/lib/components/main/amanaen.svelte',
	'src/lib/components/main/amanar.svelte',
	'src/lib/components/main/amann.svelte',
	'src/lib/components/main/tikunar.svelte',
	'src/lib/components/main/tikuneng.svelte',
	'src/lib/components/main/tikunolam.svelte',
	'src/lib/components/main/tranarb.svelte',
	'src/lib/components/main/translateeng.svelte',
	'src/lib/components/main/translatehe.svelte',
	'src/lib/components/prPr/choosMission.svelte',
	'src/lib/components/prPr/negoM.svelte',
	'src/lib/components/prPr/whowhat.svelte',
	'src/lib/components/registration/password.svelte',
	'src/lib/components/registration/roles.svelte',
	'src/lib/components/registration/vallues.svelte',
	'src/lib/components/registration/workways.svelte',
	'src/lib/components/ui/RoleSelector.svelte',
	'src/lib/components/ui/SkillSelector.svelte',
	'src/lib/components/ui/ValueSelector.svelte',
	'src/lib/legacy/moach/OLD_monolith.svelte',
	'src/lib/send/sendTo.svelte',
	'src/routes/convention/+page.svelte',
	'src/routes/hascama/+page.svelte'
]);

/** Recursively collect .svelte files under a dir. */
function walk(dir, out = []) {
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		const st = statSync(full);
		if (st.isDirectory()) walk(full, out);
		else if (name.endsWith('.svelte')) out.push(full);
	}
	return out;
}

/** True when a client component calls Strapi /graphql directly. */
function hasDirectGraphql(content) {
	if (!/graphql/.test(content)) return false;
	return /VITE_URL/.test(content) || /baseUrl/.test(content);
}

const offenders = [];
for (const file of walk(SRC)) {
	const rel = relative(ROOT, file).split('\\').join('/');
	if (hasDirectGraphql(readFileSync(file, 'utf8'))) offenders.push(rel);
}

const offenderSet = new Set(offenders);
const newOffenders = offenders.filter((f) => !BASELINE.has(f));
const fixedButStillListed = [...BASELINE].filter((f) => !offenderSet.has(f));

let failed = false;

if (newOffenders.length) {
	failed = true;
	console.error('\n❌ New direct Strapi /graphql call(s) in client code:');
	for (const f of newOffenders) console.error(`   ${f}`);
	console.error('\n   Route reads through $lib/send/sendToSer.js (a qid in');
	console.error('   src/routes/api/send/qids.js) and writes through /api/action.');
	console.error('   Never call Strapi directly from a .svelte component.\n');
}

if (fixedButStillListed.length) {
	failed = true;
	console.error('\n❌ These files were migrated — remove them from BASELINE in');
	console.error('   scripts/check-proxy-security.mjs:');
	for (const f of fixedButStillListed) console.error(`   ${f}`);
	console.error('');
}

if (failed) process.exit(1);

console.log(`✅ proxy guardrail OK — ${offenders.length} known offenders pending migration, no new ones.`);
