// lib/matcher.ts
// זמן אמת: Claude output → Gemini embed → Pinecone query → matched/suggestion/new

import { embedText } from './gemini-embeddings';
import { queryNearest, type VocabNamespace } from './pinecone';

export type MatchResult = {
    input: string;
    status: 'matched' | 'suggestion' | 'new';
    existingId?: string;
    existingLabel?: string;
    similarity?: number;
};

// סף matching — אפשר לכוונן אחרי שרואים תוצאות אמיתיות
const THRESHOLDS = {
    MATCH: 0.88,
    SUGGESTION: 0.72,
};

// ─── match פריט אחד מול namespace ────────────────────────────────────────────

async function matchOne(
    input: string,
    namespace: VocabNamespace
): Promise<MatchResult> {
    const vector = await embedText(input);
    const matches = await queryNearest(namespace, vector, 1);

    if (matches.length === 0) {
        return { input, status: 'new' };
    }

    const best = matches[0];

    if (best.score >= THRESHOLDS.MATCH) {
        return {
            input,
            status: 'matched',
            existingId: best.id,
            existingLabel: best.label,
            similarity: best.score,
        };
    }

    if (best.score >= THRESHOLDS.SUGGESTION) {
        return {
            input,
            status: 'suggestion',
            existingId: best.id,
            existingLabel: best.label,
            similarity: best.score,
        };
    }

    return { input, status: 'new', similarity: best.score };
}

// ─── match קטגוריה שלמה במקביל ───────────────────────────────────────────────

export async function matchCategory(
    inputs: string[],
    namespace: VocabNamespace
): Promise<MatchResult[]> {
    if (inputs.length === 0) return [];

    // כל הפריטים במקביל — Gemini + Pinecone לכל אחד
    return Promise.all(inputs.map((input) => matchOne(input, namespace)));
}

// ─── match כל הקטגוריות ──────────────────────────────────────────────────────

export async function matchAllCategories(extracted: {
    skills: string[];
    roles: string[];
    methods: string[];   // work_ways — מהבית / מהמשרד / משרה מלאה וכו׳
    missions?: string[];   // אופציונלי — אם Claude חילץ משימות שניתן להתאים
}) {
    const [skillResults, roleResults, methodResults, missionResults] = await Promise.all([
        matchCategory(extracted.skills, 'skills'),
        matchCategory(extracted.roles, 'roles'),
        matchCategory(extracted.methods, 'work_ways'),  // methods → work_ways namespace
        matchCategory(extracted.missions ?? [], 'missions'),
    ]);

    function split(results: MatchResult[]) {
        return {
            matched: results.filter(r => r.status === 'matched'),
            suggestions: results.filter(r => r.status === 'suggestion'),
            newItems: results.filter(r => r.status === 'new'),
        };
    }

    const s = split(skillResults);
    const r = split(roleResults);
    const m = split(methodResults);
    const ms = split(missionResults);

    return {
        matched: { skills: s.matched, roles: r.matched, methods: m.matched, missions: ms.matched },
        suggestions: { skills: s.suggestions, roles: r.suggestions, methods: m.suggestions, missions: ms.suggestions },
        newItems: { skills: s.newItems, roles: r.newItems, methods: m.newItems, missions: ms.newItems },
    };
}