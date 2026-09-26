/**
 * Guardrail: prevent new direct-to-Strapi GraphQL calls from client code.
 *
 * See docs/done/PLAN_PROXY_SECURITY.md §3.4. Once Strapi is locked to localhost,
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
const BASELINE = new Set([]);

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

// ── www loaders of the assistant flow may only call /api ────────────────────
//
// docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §1.2: www runs on Vercel and has no path to
// Strapi, so a `+page.server` there that imports the assistant's server side,
// the Strapi client, STRAPI_URL or the action service works in dev and fails in
// production. These routes must go through fetch('/api/…') instead.
const WWW_ONLY_ROUTES = [
	'src/routes/hascama',
	'src/routes/confirm-email',
	'src/routes/(reg)/onboard/+page.server.ts',
	'src/routes/(reg)/onboard/assistant',
	'src/routes/(reg)/assistant',
	'src/routes/(reg)/moach/import',
	'src/routes/(reg)/moach/[projectId]/import',
	'src/routes/(regandnon)/preview'
];
const SERVER_ONLY_IMPORT =
	/from\s+['"](?:\$lib\/server\/assistant\/[^'"]*|\$lib\/server\/actions\/index(?:\.js)?|\$lib\/server\/actions\/StrapiClient(?:\.js)?|\$lib\/server\/strapiUrl(?:\.js)?)['"]/;

/** Every +page.server / +layout.server file under a path (or the file itself). */
function serverLoaders(path, out = []) {
	let st;
	try {
		st = statSync(path);
	} catch {
		return out;
	}
	if (st.isFile()) return /\+(page|layout)\.server\.(js|ts)$/.test(path) ? [...out, path] : out;
	for (const name of readdirSync(path)) serverLoaders(join(path, name), out);
	return out;
}

const wwwOffenders = [];
for (const route of WWW_ONLY_ROUTES) {
	for (const file of serverLoaders(join(ROOT, route))) {
		if (SERVER_ONLY_IMPORT.test(readFileSync(file, 'utf8'))) {
			wwwOffenders.push(relative(ROOT, file).split('\\').join('/'));
		}
	}
}
if (wwwOffenders.length) {
	failed = true;
	console.error('\n❌ A www loader of the assistant flow imports server-only code:');
	for (const f of wwwOffenders) console.error(`   ${f}`);
	console.error("\n   On www (Vercel) it has no Strapi. Call fetch('/api/…') instead —");
	console.error('   see docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §1.2.\n');
}

if (failed) process.exit(1);

console.log(`✅ proxy guardrail OK — ${offenders.length} known offenders pending migration, no new ones.`);
