export async function GET({url, fetch}){
    try{
        let mode = url.searchParams.get('mode');
        if (mode === null) {
            console.error('No mode parameter found');
            return new Response('No mode parameter found', { status: 400 });
        }
        let add = mode === 'wake' ? '' : 'api/timegrama';
        await fetch(import.meta.env.VITE_REND + add, {
            method: 'GET',
    } );
    }catch(e){
        console.log(e)
    }
    return new Response('OK', { status: 200 });
}