export async function GET({url, fetch}){
    try{
        let mode = url.searchParams.get('mode');
        let add = mode === 'wake' ? '' : 'api/timegrama';
        fetch(import.meta.env.VITE_REND + add, {
            method: 'GET',
        }).catch(e => console.log(e));
    }catch(e){
        console.log(e)
    }
    return new Response('OK', { status: 200 });
}