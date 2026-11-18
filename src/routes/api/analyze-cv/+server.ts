import { json, error } from '@sveltejs/kit';
import { mastra } from '../../../mastra/index';
import type { RequestHandler } from './$types';
import { serverTranslator } from '$lib/server/notices/translate';

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
    if (VALID_LANGS.has(candidate)) return candidate as 'he' | 'en' | 'ar';
    // The workflow writes he/en/ar only. A Russian or Spanish reader is better
    // served by English than by Hebrew.
    return candidate === 'ru' || candidate === 'es' ? 'en' : 'he';
}

export const POST: RequestHandler = async ({ request, cookies, url, locals }) => {
    const contentType = request.headers.get('content-type') ?? '';
    const cookieLang = cookies.get('lang');
    // The error a person reads, in their own language.
    const t = serverTranslator(locals.lang ?? cookieLang);

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
            throw error(400, t('server.cv.badRequest'));
        }
        const rawText = (body.text ?? '').trim();
        if (rawText.length < 50) {
            throw error(400, t('server.cv.minChars', { count: 50 }));
        }
        inputData = { rawText, lang: pickLang(body.lang, cookieLang) };
    } else {
        // File-upload path (cvupload.svelte)
        let formData: FormData;
        try {
            formData = await request.formData();
        } catch {
            throw error(400, t('server.cv.badRequest'));
        }

        const file = formData.get('cv');
        if (!(file instanceof File)) {
            throw error(400, t('server.cv.noFile'));
        }
        if (file.size > MAX_FILE_SIZE) {
            throw error(413, t('server.cv.tooLarge'));
        }
        if (!ALLOWED_TYPES.has(file.type)) {
            throw error(415, t('server.cv.badFormat'));
        }

        const formLang = formData.get('lang');
        inputData = {
            fileBuffer: await file.arrayBuffer(),
            mimeType: file.type,
            fileName: file.name,
            lang: pickLang(formLang ?? url.searchParams.get('lang'), cookieLang),
        };
    }

    const OVERLOAD_MSG = t('server.cv.overloaded');

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
            // The workflow's own message is technical; it is logged above.
            throw error(500, t('server.cv.failed'));
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
        console.error('analyze-cv error:', err instanceof Error ? err.message : err);
        throw error(500, t('server.cv.unexpected'));
    }
};
