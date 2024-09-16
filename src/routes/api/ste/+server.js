import { Telegraf } from 'telegraf';
import { Markup } from 'telegraf';

export const POST = async ({ request }) => {
  console.log('tryng', request.body);
  const data = await request.json();
  let isNew = data?.isNew || false;
  const name = data?.name || null;
  const action = data.action ? data.action.replace('\n', '%0A') : null;
  const det = data?.det;
  const message = data?.message || null;
  const chat_id = data?.chat_id || null;
  const urladd = data?.urladd || "lev";
  const lang = data?.lang || 'he';
  const buttontext = {
    he: 'לצפייה ב-1💗1',
    en: ' see on 1💗1',
  };
  // const email = (form.get('email'));
  // const contact = (form.get('contact'));
  const botMessage = isNew
    ? `<b>${det}</b> \n
    ${message}`
    : `${name} %0A 
     ${action} %0A 
     ${det}`;
  // %0A is url encoded '\n' which is used for new line.
  const Token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN_NEW
   
  const chatId = isNew ? chat_id : import.meta.env.VITE_NEW_TELEGRAM;
 if(isNew != true){
    const url = `https://api.telegram.org/bot${Token}/sendMessage?chat_id=${chatId}&text=${botMessage}`;  
  const res = await fetch(url);
}else{
    const app = new Telegraf(Token);
    app.telegram.sendMessage(
      chatId,
      botMessage,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: buttontext[lang], url: 'https://www.1lev1.com/'+urladd }]
          ]
        }
      }
    ).catch(err => console.error('Error sending message:', err));
   // 6377840674;

}
  return new Response();
};
