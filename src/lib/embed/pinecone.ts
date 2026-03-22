// lib/pinecone.ts
// index אחד, namespace לכל קטגוריה: skills / roles / methods
import { Pinecone } from '@pinecone-database/pinecone';

const getPineconeKey = () => {
    let key = '';
    if (typeof process !== 'undefined' && process.env && process.env.PINECONE) key = process.env.PINECONE;
    if (!key) {
        try {
            // @ts-ignore
            if (import.meta && import.meta.env) key = import.meta.env.VITE_PINECONE || import.meta.env.PINECONE || '';
        } catch { }
    }
    console.log('Pinecone Key found (length):', key?.length || 0);
    return key;
};

const getIndexName = () => {
    let name = '';
    if (typeof process !== 'undefined' && process.env && process.env.PINECONE_INDEX) name = process.env.PINECONE_INDEX;
    if (!name) {
        try {
            // @ts-ignore
            if (import.meta && import.meta.env) name = import.meta.env.VITE_PINECONE_INDEX || import.meta.env.PINECONE_INDEX || '';
        } catch { }
    }
    const finalName = name || 'missions';
    console.log('Pinecone Index Name:', finalName);
    return finalName;
};

let pcInstance: Pinecone | null = null;
const getPc = () => {
    if (!pcInstance) {
        pcInstance = new Pinecone({ apiKey: getPineconeKey() || 'dummy' });
    }
    return pcInstance;
};
const getIndex = () => {
    try {
        const name = getIndexName();
        console.log('Getting index:', name);
        return getPc().index(name);
    } catch (e) {
        console.error('Error in getIndex:', e);
        throw e;
    }
};
// namespace לכל קטגוריה
export type VocabNamespace = 'skills' | 'roles' | 'methods' | 'missions' | 'work_ways';

export type PineconeRecord = {
    id: string;
    values: number[];
    metadata: {
        label: string;
        enrichedLabel?: string;
        category: VocabNamespace;
        strapiId: string;
    };
};

export type QueryMatch = {
    id: string;
    label: string;
    score: number;
};

// ─── Upsert (sync job בלבד) ───────────────────────────────────────────────────

export async function upsertVectors(
    namespace: VocabNamespace,
    records: PineconeRecord[]
): Promise<void> {
    console.log('upsertVectors called:', records.length, 'records');
    if (records.length === 0) return;

    const index = getIndex().namespace(namespace);

    // Pinecone ממליץ על batches של 100 ב-upsert
    const BATCH = 100;
    for (let i = 0; i < records.length; i += BATCH) {
        const batch = records.slice(i, i + BATCH).map(r => ({
            id: String(r.id),
            values: Array.from(r.values),
            metadata: r.metadata,
        }));
        console.log(`batch ${i}: ${batch.length}`);
        await index.upsert({ records: batch });
    }
}

// ─── Query (זמן אמת — כל העלאת CV) ──────────────────────────────────────────

export async function queryNearest(
    namespace: VocabNamespace,
    vector: number[],
    topK = 1
): Promise<QueryMatch[]> {
    console.log('queryNearest called:', namespace, topK);
    try {
        console.log('queryNearest: Getting index for namespace:', namespace);
        const index = getIndex().namespace(namespace);
        console.log('queryNearest: Index obtained. Querying...');

        const result = await index.query({
            vector,
            topK,
            includeMetadata: true,
        });
        console.log('queryNearest result:', result);

        return (result.matches ?? []).map((m) => ({
            id: m.id,
            label: (m.metadata?.label as string) ?? '',
            score: m.score ?? 0,
        }));
    } catch (error) {
        console.error('Error in queryNearest:', error);
        throw error;
    }
}

// ─── בדוק אילו IDs כבר קיימים (לסינון ב-sync job) ────────────────────────────

export async function fetchExistingIds(namespace: VocabNamespace): Promise<Set<string>> {
    const index = getIndex().namespace(namespace);

    // list מחזיר רק IDs — יעיל לבדיקת קיום
    const result = await index.listPaginated({ limit: 100 });
    const ids = new Set<string>();
    (result.vectors ?? []).forEach((v) => ids.add(v.id));
    return ids;
}