// lib/vocab-creation.ts
// פונקציה אחת לייבוא בממשק יצירת כישור / תפקיד / דרך עשיה
// מטפלת ב: בדיקת כפילות → יצירה ב-Strapi → upsert ל-Pinecone דרך הענן

import type { VocabNamespace } from './pinecone';

// ─── Types ────────────────────────────────────────────────────────────────────

export type VocabItem = {
    id: string;
    label: string;           // השפה הראשית
    translations: Record<string, string>; // { en: '...', ar: '...', ... }
};

export type DuplicateCheckResult =
    | { isDuplicate: true; match: { id: string; label: string; similarity: number } }
    | { isDuplicate: false };

export type CreateResult =
    | { success: true; item: VocabItem }
    | { success: false; reason: 'duplicate'; match: { id: string; label: string; similarity: number } }
    | { success: false; reason: 'error'; message: string };

// ─── סף כפילות — גבוה יותר מסף ה-matching בקורות חיים ────────────────────────
// 0.92 = כמעט זהה (React / react.js)
// 0.85 = דומה מאוד (ניהול צוות / הובלת צוות) — חסום גם כן
const DUPLICATE_THRESHOLD = 0.92;
const VERY_SIMILAR_THRESHOLD = 0.85;

// ─── שלב א: בדיקת כפילות בלבד (לקריאה בזמן אמת בטופס) ───────────────────────

export async function checkDuplicate(
    label: string,
    namespace: VocabNamespace
): Promise<DuplicateCheckResult> {
    const res = await fetch('/api/vocab/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, namespace }),
    });

    return res.json();
}

// ─── שלב ב: יצירה מלאה — בדיקה + Strapi + Pinecone ──────────────────────────

export async function validateAndCreateVocabItem(
    label: string,
    namespace: VocabNamespace,
    strapiCreateFn: (label: string) => Promise<VocabItem>,
    options?: { overrideDuplicate?: boolean }
    // ^ פונקציה שאתה מעביר — יוצרת ב-Strapi ומחזירה { id, label, translations }
    // ככה vocab-creation.ts לא יודע כלום על מבנה ה-Strapi שלך
): Promise<CreateResult> {
    try {
        if (!options?.overrideDuplicate) {
            // 1. בדוק כפילות ב-Pinecone מול השרת
            const dupCheck = await checkDuplicate(label, namespace);
            if (dupCheck.isDuplicate) {
                return { success: false, reason: 'duplicate', match: dupCheck.match };
            }
        }

        // 2. צור ב-Strapi דרך הפונקציה החיצונית
        const newItem = await strapiCreateFn(label);

        // 3. upsert ל-Pinecone דרך ה-API הייעודי בשרת שלנו!
        await fetch('/api/vocab/create-vector', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: newItem.id,
                label: newItem.label,
                namespace,
            }),
        }).catch(e => console.error("Failed to call vector API:", e));

        return { success: true, item: newItem };

    } catch (err: unknown) {
        return {
            success: false,
            reason: 'error',
            message: err instanceof Error ? err.message : 'שגיאה לא צפויה',
        };
    }
}