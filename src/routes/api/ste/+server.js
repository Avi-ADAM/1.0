
export const POST = async ({ request }) => {
    console.log("tryng", request.body)
    const data = await request.json()

    const name = data.name;
    const action = data.action;
    const det = data.det
    // const email = (form.get('email'));
    // const contact = (form.get('contact'));
    const botMessage = `${name} %0A 
     ${action} %0A 
     ${det}`;
    // %0A is url encoded '\n' which is used for new line. 
    const Token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
    const url = `https://api.telegram.org/bot${Token}/sendMessage?chat_id=${chatId}&text=${botMessage}`;
    const res = await fetch(url);
    return new Response()
}