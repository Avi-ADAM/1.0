import { json } from '@sveltejs/kit';
import { queryNearest } from '$lib/embed/pinecone';
import { embedText } from '$lib/embed/gemini-embeddings';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const { label, namespace } = await request.json();

    const vector = await embedText(label);
    const matches = await queryNearest(namespace, vector, 1);
    console.log('matches', matches);
    if (matches.length === 0) return json({ isDuplicate: false });

    const best = matches[0];
    if (best.score >= 0.50) {
        return json({
            isDuplicate: true,
            match: { id: best.id, label: best.label, similarity: best.score }
        });
    }

    return json({ isDuplicate: false });
};