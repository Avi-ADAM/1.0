// jobs/sync-vocabulary.ts
// מריץ פעם אחת: npx tsx src/lib/jobs/sync-vocabulary.ts
import 'dotenv/config';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { embedBatch } from '../embed/gemini-embeddings';
import { upsertVectors, fetchExistingIds, type VocabNamespace } from '../embed/pinecone';

const STRAPI_URL = process.env.VITE_URL!;
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN!;

// ─── Embedding cache ──────────────────────────────────────────────────────────
// שומר embeddings ל-JSON אחרי Gemini — אם הריצה נכשלת, הפעם הבאה דולגת על Gemini

const CACHE_DIR = join(process.cwd(), '.embed-cache');

type CacheEntry = {
    id: string;
    label: string;
    enrichedLabel: string;
    values: number[];
};

function cacheFile(namespace: VocabNamespace) {
    return join(CACHE_DIR, `${namespace}.json`);
}

function loadCache(namespace: VocabNamespace): Map<string, CacheEntry> {
    const file = cacheFile(namespace);
    if (!existsSync(file)) return new Map();
    try {
        const entries: CacheEntry[] = JSON.parse(readFileSync(file, 'utf-8'));
        console.log(`[${namespace}] נטען cache: ${entries.length} פריטים`);
        return new Map(entries.map(e => [e.id, e]));
    } catch {
        return new Map();
    }
}

function saveCache(namespace: VocabNamespace, entries: CacheEntry[]) {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(cacheFile(namespace), JSON.stringify(entries, null, 2), 'utf-8');
    console.log(`[${namespace}] cache נשמר → .embed-cache/${namespace}.json (${entries.length} פריטים)`);
}

// ─── Localization helper ──────────────────────────────────────────────────────

type Localized = { data: { attributes: Record<string, string> }[] };

function allLocales(primary: string, localizations: Localized | undefined, field: string): string[] {
    const extras = localizations?.data.map(l => l.attributes[field]).filter(Boolean) ?? [];
    return [...new Set([primary, ...extras])].filter(s => s?.trim());
}

// ─── Types ────────────────────────────────────────────────────────────────────

type L<T> = T & { localizations?: Localized };

type RawSkill = {
    id: string;
    attributes: L<{
        skillName: string;
        descrip?: string;
        tafkidims?: { data: { attributes: L<{ roleDescription: string }> }[] };
        missions?: { data: { attributes: L<{ missionName: string }> }[] };
    }>;
};

type RawRole = {
    id: string;
    attributes: L<{
        roleDescription: string;
        skills?: { data: { attributes: L<{ skillName: string }> }[] };
        missions?: { data: { attributes: L<{ missionName: string }> }[] };
    }>;
};

type RawMission = {
    id: string;
    attributes: L<{
        missionName: string;
        descrip?: string;
        skills?: { data: { attributes: L<{ skillName: string }> }[] };
        tafkidims?: { data: { attributes: L<{ roleDescription: string }> }[] };
        work_ways?: { data: { attributes: L<{ workWayName: string }> }[] };
    }>;
};

type RawWorkWay = {
    id: string;
    attributes: L<{
        workWayName: string;
        missions?: { data: { attributes: L<{ missionName: string }> }[] };
    }>;
};

// ─── GraphQL ──────────────────────────────────────────────────────────────────

const LOC = (field: string) => `localizations { data { attributes { ${field} } } }`;

async function gql<T>(query: string): Promise<T> {
    const res = await fetch(`${STRAPI_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${STRAPI_TOKEN}` },
        body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`GraphQL error: ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0].message);
    return json.data;
}

async function fetchSkills(): Promise<RawSkill[]> {
    const data = await gql<{ skills: { data: RawSkill[] } }>(`query {
        skills(pagination: { pageSize: 500 }) { data { id attributes {
            skillName descrip ${LOC('skillName descrip')}
            tafkidims { data { attributes { roleDescription ${LOC('roleDescription')} }}}
            missions  { data { attributes { missionName   ${LOC('missionName')} }}}
        }}}
    }`);
    return data.skills.data;
}

async function fetchRoles(): Promise<RawRole[]> {
    const data = await gql<{ tafkidims: { data: RawRole[] } }>(`query {
        tafkidims(pagination: { pageSize: 500 }) { data { id attributes {
            roleDescription ${LOC('roleDescription')}
            skills   { data { attributes { skillName   ${LOC('skillName')} }}}
            missions { data { attributes { missionName ${LOC('missionName')} }}}
        }}}
    }`);
    return data.tafkidims.data;
}

async function fetchMissions(): Promise<RawMission[]> {
    const data = await gql<{ missions: { data: RawMission[] } }>(`query {
        missions(pagination: { pageSize: 500 }) { data { id attributes {
            missionName descrip ${LOC('missionName descrip')}
            skills    { data { attributes { skillName      ${LOC('skillName')} }}}
            tafkidims { data { attributes { roleDescription ${LOC('roleDescription')} }}}
            work_ways { data { attributes { workWayName    ${LOC('workWayName')} }}}
        }}}
    }`);
    return data.missions.data;
}

async function fetchWorkWays(): Promise<RawWorkWay[]> {
    const data = await gql<{ workWays: { data: RawWorkWay[] } }>(`query {
        workWays(pagination: { pageSize: 500 }) { data { id attributes {
            workWayName ${LOC('workWayName')}
            missions { data { attributes { missionName ${LOC('missionName')} }}}
        }}}
    }`);
    return data.workWays.data;
}

// ─── Label builders ───────────────────────────────────────────────────────────

function buildSkillLabel(s: RawSkill): string {
    const a = s.attributes;
    const names = allLocales(a.skillName, a.localizations, 'skillName');
    const descrips = allLocales(a.descrip ?? '', a.localizations, 'descrip').filter(Boolean);
    const roles = a.tafkidims?.data.flatMap(r => allLocales(r.attributes.roleDescription, r.attributes.localizations, 'roleDescription')) ?? [];
    const missions = a.missions?.data.flatMap(m => allLocales(m.attributes.missionName, m.attributes.localizations, 'missionName')) ?? [];
    return [
        names.join(' / '),
        descrips.length ? descrips.join('. ') : '',
        roles.length ? `תפקידים / Roles: ${[...new Set(roles)].join(', ')}` : '',
        missions.length ? `משימות / Missions: ${[...new Set(missions)].join(', ')}` : '',
    ].filter(Boolean).join('. ');
}

function buildRoleLabel(r: RawRole): string {
    const a = r.attributes;
    const names = allLocales(a.roleDescription, a.localizations, 'roleDescription');
    const skills = a.skills?.data.flatMap(s => allLocales(s.attributes.skillName, s.attributes.localizations, 'skillName')) ?? [];
    const missions = a.missions?.data.flatMap(m => allLocales(m.attributes.missionName, m.attributes.localizations, 'missionName')) ?? [];
    return [
        names.join(' / '),
        skills.length ? `כישורים / Skills: ${[...new Set(skills)].join(', ')}` : '',
        missions.length ? `משימות / Missions: ${[...new Set(missions)].join(', ')}` : '',
    ].filter(Boolean).join('. ');
}

function buildMissionLabel(m: RawMission): string {
    const a = m.attributes;
    const names = allLocales(a.missionName, a.localizations, 'missionName');
    const descrips = allLocales(a.descrip ?? '', a.localizations, 'descrip').filter(Boolean);
    const skills = a.skills?.data.flatMap(s => allLocales(s.attributes.skillName, s.attributes.localizations, 'skillName')) ?? [];
    const roles = a.tafkidims?.data.flatMap(r => allLocales(r.attributes.roleDescription, r.attributes.localizations, 'roleDescription')) ?? [];
    const ways = a.work_ways?.data.flatMap(w => allLocales(w.attributes.workWayName, w.attributes.localizations, 'workWayName')) ?? [];
    return [
        names.join(' / '),
        descrips.length ? descrips.join('. ') : '',
        skills.length ? `כישורים / Skills: ${[...new Set(skills)].join(', ')}` : '',
        roles.length ? `תפקידים / Roles: ${[...new Set(roles)].join(', ')}` : '',
        ways.length ? `דרכי עבודה / Work ways: ${[...new Set(ways)].join(', ')}` : '',
    ].filter(Boolean).join('. ');
}

function buildWorkWayLabel(w: RawWorkWay): string {
    const a = w.attributes;
    const names = allLocales(a.workWayName, a.localizations, 'workWayName');
    const missions = a.missions?.data.flatMap(m => allLocales(m.attributes.missionName, m.attributes.localizations, 'missionName')) ?? [];
    return [
        names.join(' / '),
        missions.length ? `משימות / Missions: ${[...new Set(missions)].join(', ')}` : '',
    ].filter(Boolean).join('. ');
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

async function syncNamespace(
    namespace: VocabNamespace,
    items: { id: string; label: string; enrichedLabel: string }[]
) {
    console.log(`\n[${namespace}] ${items.length} פריטים`);

    const existingIds = await fetchExistingIds(namespace);
    const newItems = items.filter(i => !existingIds.has(i.id));
    console.log(`[${namespace}] ${existingIds.size} קיימים ב-Pinecone, ${newItems.length} חדשים`);

    if (newItems.length === 0) { console.log(`[${namespace}] ✓ מעודכן`); return; }

    // טען cache
    const cache = loadCache(namespace);
    const cached = newItems.filter(i => cache.has(i.id));
    const missing = newItems.filter(i => !cache.has(i.id));
    console.log(`[${namespace}] cache: ${cached.length} פריטים, חסרים ל-Gemini: ${missing.length}`);

    // שלח ל-Gemini רק מה שחסר
    if (missing.length > 0) {
        console.log(`[${namespace}] שולח ל-Gemini...`);
        const embeddings = await embedBatch(missing.map(i => i.enrichedLabel));

        const newEntries: CacheEntry[] = missing.map((item, idx) => ({
            ...item,
            values: embeddings[idx],
        }));

        // שמור cache מעודכן (ישן + חדש)
        const allEntries = [...Array.from(cache.values()), ...newEntries];
        saveCache(namespace, allEntries);
        newEntries.forEach(e => cache.set(e.id, e));
    }

    // בנה records מה-cache ושלח ל-Pinecone
    const records = newItems
        .map(item => {
            const entry = cache.get(item.id);
            if (!entry) return null;
            return {
                id: item.id,
                values: entry.values.map(Number),
                metadata: {
                    label: item.label,
                    enrichedLabel: item.enrichedLabel,
                    category: namespace as string,
                    strapiId: item.id,
                },
            };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

    console.log(`[${namespace}] שולח ${records.length} records ל-Pinecone...`);
    console.log(`first record:`, JSON.stringify(records[0]).slice(0, 200));
    console.log(`[${namespace}] sample record — id: ${records[0]?.id}, vector length: ${records[0]?.values?.length}`);

    await upsertVectors(namespace, records);
    console.log(`[${namespace}] ✓ הועלו ${records.length} vectors`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function syncVocabulary() {
    console.log('🔄 מתחיל סנכרון vocabulary...');
    const start = Date.now();

    const [skills, roles, missions, workWays] = await Promise.all([
        fetchSkills(), fetchRoles(), fetchMissions(), fetchWorkWays(),
    ]);

    await syncNamespace('skills', skills.map(s => ({ id: s.id, label: s.attributes.skillName, enrichedLabel: buildSkillLabel(s) })));
    await syncNamespace('roles', roles.map(r => ({ id: r.id, label: r.attributes.roleDescription, enrichedLabel: buildRoleLabel(r) })));
    await syncNamespace('missions', missions.map(m => ({ id: m.id, label: m.attributes.missionName, enrichedLabel: buildMissionLabel(m) })));
    await syncNamespace('work_ways', workWays.map(w => ({ id: w.id, label: w.attributes.workWayName, enrichedLabel: buildWorkWayLabel(w) })));

    console.log(`\n✅ סנכרון הושלם ב-${((Date.now() - start) / 1000).toFixed(1)}s`);
}

console.log('PINECONE_API_KEY:', process.env.PINECONE ? '✓' : '✗ חסר');
console.log('STRAPI_URL:', process.env.VITE_URL ?? '✗ חסר');
syncVocabulary().catch(err => { console.error('❌', err); process.exit(1); });