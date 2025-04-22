export async function GET(url){
    try{
        let add = url.searchParams.get('mode') == 'wake' ? '' : 'api/timegrama';
        await fetch(import.meta.env.VITE_REND + add, {
            method: 'GET',
    } );
    }catch(e){
        console.log(e)
    }
    return new Response('OK', { status: 200 });
}