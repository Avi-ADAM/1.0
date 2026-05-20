import { json, error } from '@sveltejs/kit';
import { mastra } from '../../../mastra/index';
import type { RequestHandler } from './$types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'application/rtf',
]);

const VALID_LANGS = new Set(['he', 'en', 'ar']);

function pickLang(raw: unknown, cookieLang: string | undefined): 'he' | 'en' | 'ar' {
    const candidate = String(raw ?? cookieLang ?? 'he').toLowerCase();
    return (VALID_LANGS.has(candidate) ? candidate : 'he') as 'he' | 'en' | 'ar';
}

export const POST: RequestHandler = async ({ request, cookies, url }) => {
    const contentType = request.headers.get('content-type') ?? '';
    const cookieLang = cookies.get('lang');

    let inputData: {
        fileBuffer?: ArrayBuffer;
        mimeType?: string;
        fileName?: string;
        rawText?: string;
        lang?: 'he' | 'en' | 'ar';
    };

    if (contentType.includes('application/json')) {
        // Free-text path (/onboard/provider/describe)
        let body: { text?: string; lang?: string };
        try {
            body = await request.json();
        } catch {
            throw error(400, 'בקשה לא תקינה');
        }
        const rawText = (body.text ?? '').trim();
        if (rawText.length < 50) {
            throw error(400, 'נא לכתוב לפחות 50 תווים על עצמך');
        }
        inputData = { rawText, lang: pickLang(body.lang, cookieLang) };
    } else {
        // File-upload path (cvupload.svelte)
        let formData: FormData;
        try {
            formData = await request.formData();
        } catch {
            throw error(400, 'בקשה לא תקינה');
        }

        const file = formData.get('cv');
        if (!(file instanceof File)) {
            throw error(400, 'לא התקבל קובץ');
        }
        if (file.size > MAX_FILE_SIZE) {
            throw error(413, 'הקובץ גדול מדי — מקסימום 5MB');
        }
        if (!ALLOWED_TYPES.has(file.type)) {
            throw error(415, 'פורמט לא נתמך. אנא העלה PDF, Word (.docx), או קובץ טקסט');
        }

        const formLang = formData.get('lang');
        inputData = {
            fileBuffer: await file.arrayBuffer(),
            mimeType: file.type,
            fileName: file.name,
            lang: pickLang(formLang ?? url.searchParams.get('lang'), cookieLang),
        };
    }

    const OVERLOAD_MSG = 'שירותי ה-AI עמוסים כרגע. אנא נסי שוב בעוד כחצי דקה.';

    function isOverloadError(e: unknown): boolean {
        if (!e || typeof e !== 'object') return false;
        const anyErr = e as any;
        if (anyErr.code === 'AI_OVERLOADED') return true;
        if (anyErr.message === 'AI_OVERLOADED') return true;
        const status = anyErr.statusCode ?? anyErr.cause?.statusCode;
        if (status === 503 || status === 429) return true;
        return /overload|unavailable|high demand|rate limit|quota/i.test(anyErr.message ?? '');
    }

    try {
        const run = await mastra.getWorkflow('analyze-cv').createRun();

        const result = await run.start({ inputData });

        if (result.status === 'failed') {
            console.error('Mastra workflow failed:', result.error);
            if (isOverloadError(result.error)) {
                throw error(503, OVERLOAD_MSG);
            }
            throw error(500, result.error?.message ?? 'שגיאה בניתוח הקובץ');
        }

        return json(result.result);

    } catch (err: unknown) {
        // SvelteKit HttpError — rethrow so our 503/4xx status is preserved.
        if (err && typeof err === 'object' && 'status' in err && 'body' in err) {
            throw err;
        }
        if (isOverloadError(err)) {
            console.error('analyze-cv overload:', (err as any)?.message);
            throw error(503, OVERLOAD_MSG);
        }
        const msg = err instanceof Error ? err.message : 'שגיאה לא צפויה';
        console.error('analyze-cv error:', msg);
        throw error(500, msg);
    }
};
