import { GEMINI_API_KEY as KEY_PRIORITY, GOOGLE_API as KEY_BACKUP } from '$env/static/private';

const GEMINI_API_KEY = KEY_PRIORITY || KEY_BACKUP || '';

const GEMINI_MODEL = 'gemini-embedding-2-preview';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
// Gemini מגביל ל-100 טקסטים לקריאה ב-batchEmbedContents

export type Embedding = number[]; // 3072 מימדים

// ─── קריאה בודדת (זמן אמת — CV matching, dup check) ─────────────────────────

export async function embedText(text: string): Promise<Embedding> {
    const res = await fetch(
        `${GEMINI_BASE}/models/${GEMINI_MODEL}:embedContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: `models/${GEMINI_MODEL}`,
                content: { parts: [{ text }] },
                taskType: 'SEMANTIC_SIMILARITY',
            }),
        }
    );

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Gemini embed failed: ${res.status} — ${JSON.stringify(err)}`);
    }

    const data = await res.json();
    return data.embedding.values as Embedding;
}

// ─── batch — עם rate limit handling ──────────────────────────────────────────
// Free tier: 100 בקשות לדקה
// כל 100 בקשות — מחכה 61 שניות לפני שממשיך

const CONCURRENT = 5;       // מקביליות בתוך כל קבוצה
const DELAY_MS = 150;     // המתנה קצרה בין קבוצות
const RATE_LIMIT = 100;     // free tier: 100 req/min
const RATE_LIMIT_MS = 61_000;  // 61 שניות — מרווח בטחון מעל ה-47s שהשרת מבקש

export async function embedBatch(texts: string[]): Promise<Embedding[]> {
    if (texts.length === 0) return [];

    const results: Embedding[] = new Array(texts.length);
    let totalSent = 0;

    for (let i = 0; i < texts.length; i += CONCURRENT) {
        // כל 100 בקשות — עצור ותחכה דקה
        if (totalSent > 0 && totalSent % RATE_LIMIT === 0) {
            if (typeof process !== 'undefined' && process.stdout) {
                process.stdout.write(`\n  ⏳ rate limit — ממתין 61 שניות...`);
            } else {
                console.log(`\n  ⏳ rate limit — ממתין 61 שניות...`);
            }
            await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
            if (typeof process !== 'undefined' && process.stdout) {
                process.stdout.write(` המשך\n`);
            }
        }

        const chunk = texts.slice(i, i + CONCURRENT);
        const embeddings = await Promise.all(chunk.map(embedText));
        embeddings.forEach((emb, j) => { results[i + j] = emb; });

        totalSent += chunk.length;

        if (i + CONCURRENT < texts.length) {
            await new Promise(r => setTimeout(r, DELAY_MS));
        }

        if (typeof process !== 'undefined' && process.stdout) {
            process.stdout.write(`\r  ${Math.min(i + CONCURRENT, texts.length)}/${texts.length}`);
        } else {
            console.log(`  ${Math.min(i + CONCURRENT, texts.length)}/${texts.length}`);
        }
    }

    if (typeof process !== 'undefined' && process.stdout) {
        process.stdout.write('\n');
    }
    return results;
}