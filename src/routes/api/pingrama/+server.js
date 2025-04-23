export async function GET({url, fetch}){
    try{
        let mode = url.searchParams.get('mode');
        let add = mode === 'wake' ? 'api/cron' : 'api/timegrama';
        
        // מבצע את הבקשה בצורה אסינכרונית
        fetch(import.meta.env.VITE_REND + add, {
            method: 'GET',
        })
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response URL:', response.url);
        })
        .catch(error => {
            console.error('Error in pingrama:', error);
        });

        // מחזיר תגובה מיד
        return new Response('OK', { status: 200 });
    }catch(e){
        console.error('Error in pingrama:', e);
        return new Response('Error: ' + e.message, { status: 500 });
    }
}