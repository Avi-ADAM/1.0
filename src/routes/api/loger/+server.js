export const POST = async ({ request }) => {
    const data = await request.json()

    const log = data.log;
    console.error("loger: ", log)
    
    return new Response(JSON.stringify({
        message: `Hello log! ${data.log}`
    }), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
