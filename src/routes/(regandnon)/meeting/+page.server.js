
import { sendToSer } from '$lib/send/sendToSer.js';
import { redirect } from '@sveltejs/kit';

export async function load({ locals, fetch }) {
    if (!locals.uid) {
        // Since the user said "phase 2 we allow unregistered", 
        // for now we might want to just return empty or redirect. 
        // But the user said "open to registered and unregistered", 
        // but then "if complicated leave for phase 2 and only allow registered".
        // I'll allow the page to load but maybe show login prompt or just empty data for now.
        return {
            pendingMeetings: []
        };
    }

    try {
        const response = await sendToSer(
            { userId: locals.uid },
            '53GetPendingMeetings',
            0,
            0,
            false, // isSer
            fetch
        );

        if (response?.data?.pgishauserpends?.data) {
            return {
                pendingMeetings: response.data.pgishauserpends.data
            };
        }
        
        return {
            pendingMeetings: []
        };

    } catch (error) {
        console.error('Error fetching pending meetings:', error);
        return {
            pendingMeetings: []
        };
    }
}
