const baseUrl = import.meta.env.VITE_URL;
let url = baseUrl+'/api/cuntries/5';
// Deploy webhook is a secret — prefer the server-only var. The VITE_ fallback
// keeps the existing deployment working until the env is renamed (see docs).
let hook = process.env.DEPLOY_HOOK || import.meta.env.VITE_HOOK;
let t = false;
async function awaitapi() {
  const res = await fetch(url);
  return res;
}
export async function GET(req) {
  const res = await awaitapi();
  if (res.status >= 200 && res.status < 300) {
    t = false;
    console.log('ok');
  } else {
    if (t == false) {
      console.log('problema');
      const botMessage = ` 
     השרת נפל
     %0A
     יאללה לתקן 
     `;
      // %0A is url encoded '\n' which is used for new line.
      // Telegram bot token is a secret — must not carry the public VITE_ prefix.
      // Falls back to the old VITE_ names until the deploy env is renamed (see docs).
      const Token = process.env.TELEGRAM_BOT_TOKEN || import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID || import.meta.env.VITE_TELEGRAM_CHAT_ID;
      const url = `https://api.telegram.org/bot${Token}/sendMessage?chat_id=${chatId}&text=${botMessage}`;
      const rest = await fetch(url);
      let sec = false;
      ab();
      const ab = setTimeout(async function () {
        const ress = await fetch(url);
        if (ress.status >= 200 && ress.status < 300) {
          t = false;
          sec = false;
        } else {
          t = true;
          const resi = await fetch(hook);
          console.log('done dep', resi);
        }
      }, 2000);
    }
  }
  return new Response('Hello Cron!');
}
