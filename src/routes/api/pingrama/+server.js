export async function GET(){
    try{
        await fetch(import.meta.env.VITE_REND + '/api/timegrama', {
            method: 'GET',
    } );
    }catch(e){
        console.log(e)
    }
    return new Response('OK', { status: 200 });
}