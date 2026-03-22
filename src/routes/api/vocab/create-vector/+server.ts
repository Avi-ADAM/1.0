import { json } from '@sveltejs/kit';
import { embedText } from '$lib/embed/gemini-embeddings';
import { upsertVectors, type VocabNamespace } from '$lib/embed/pinecone';

export async function POST({ request }) {
    try {
        const { id, label, namespace } = await request.json();

        if (!id || !label || !namespace) {
            return json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Embed on server
        const vector = await embedText(label);

        // 2. Upsert to Pinecone
        await upsertVectors(namespace as VocabNamespace, [{
            id: id,
            values: vector,
            metadata: {
                label: label,
                category: namespace,
                strapiId: id,
            },
        }]);

        return json({ success: true });
    } catch (e: any) {
        return json({ success: false, error: e.message }, { status: 500 });
    }
}
