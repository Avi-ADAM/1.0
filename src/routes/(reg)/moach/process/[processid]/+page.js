import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { idPr } from '$lib/stores/idPr.js';

export function load({ params }) {
    // Attempt to get current projectId from store
    const projectId = get(idPr);
    if (projectId && projectId !== 0) {
        throw redirect(301, `/moach/${projectId}/processes/${params.processid}`);
    }
    // Fallback to project dashboard if we can't determine the ID
    throw redirect(307, '/me');
}
