import { env } from '$env/dynamic/private';

// יעד ההרצה של cron/timegrama. ברירת מחדל: אינסטנס ה-API על ה-VPS
// (api.1lev1.com) — החליף את אינסטנס ה-Render (rend.1lev1.com) שנרדם.
// אפשר לעקוף בזמן ריצה עם REND_URL.
const REND_BASE = (env.REND_URL || 'https://api.1lev1.com/').replace(/\/?$/, '/');

export async function GET({url, fetch}){
    try{
        let mode = url.searchParams.get('mode');
        let add = mode === 'wake' ? 'api/cron' : 'api/timegrama';
        
        // מבצע את הבקשה עם timeout ו-retry
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 שניות timeout

        try {
            const response = await fetch(REND_BASE + add, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('Response status:', response.status);
            console.log('Response URL:', response.url);
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                console.error('Request timeout after 10 seconds');
            } else {
                console.error('Error in pingrama:', error);
            }
        }

        // מחזיר תגובה מיד
        return new Response('OK', { status: 200 });
    }catch(e){
        console.error('Error in pingrama:', e);
        return new Response('Error: ' + e.message, { status: 500 });
    }
}