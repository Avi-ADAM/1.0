//create a server with telegraf to listen for new messages
import { Telegraf } from 'telegraf';
import { Markup } from 'telegraf';

let appIds = [];
//token new
const Token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN_NEW;
const bot = new Telegraf(Token);

bot.start((ctx) => {
  console.log(ctx.chat.id);
  //check if the chat_id is in our list
  if (appIds.includes(ctx.chat.id)) {
    ctx.reply('Welcome to 1💗1', {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: Markup.inlineKeyboard([
        Markup.button.url('<<to 1💗1>>', 'https://1lev1.vercel.app/lev')
      ])
    });
  } else {
    ctx.reply('Welcome to 1💗1'/*, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: Markup.inlineKeyboard([
        Markup.button.url(
          '<<to registration להרשמה>>',
          'https://1lev1.vercel.app'
        ),
        Markup.button.url(
          '<<login להתחברות >>',
          'https://1lev1.vercel.app/login'
        ),
        Markup.button.url(
          '<<register for nutification הרשמה לעדכונים>>',
          'https://1lev1.vercel.app/me'
        )
      ])
    } */);
  }
});
bot.help((ctx) => ctx.reply('Send me a sticker'));


export async function POST({ request }) {
    console.log("ffy")
  try {
    await bot.handleUpdate(request.body);
    return new Response('', { status: 200 });
  } catch (error) {
    console.error('Error handling Telegram update:', error);
    return new Response('', { status: 500 });
  }
}
