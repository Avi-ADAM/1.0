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

export const POST: RequestHandler = async ({ request }) => {
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

    const fileBuffer = await file.arrayBuffer();

    try {
        const run = await mastra.workflows
            .get('analyze-cv')
            .createRun();

        const result = await run.start({
            inputData: {
                fileBuffer,
                mimeType: file.type,
                fileName: file.name,
            },
        });

        if (result.status === 'failed') {
            console.error('Mastra workflow failed:', result.error);
            throw error(500, result.error?.message ?? 'שגיאה בניתוח הקובץ');
        }

        const { rawText: _, ...profileData } = result.result;

        return json(profileData);

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'שגיאה לא צפויה';
        console.error('analyze-cv error:', msg);
        throw error(500, msg);
    }
};