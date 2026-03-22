//create a server with telegraf to listen for new messages
import { Telegraf } from 'telegraf';
import { Markup } from 'telegraf';

import { TELEGRAM_BOT_TOKEN_NEW } from '$env/static/private';

let appIds = [];
//token new
const Token = TELEGRAM_BOT_TOKEN_NEW;
const bot = new Telegraf(Token);

bot.start((ctx) => {
    console.log(ctx.chat.id)
  //check if the chat_id is in our list
  if (appIds.includes(ctx.chat.id)) {
    ctx.reply('Welcome to 1💗1', {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: Markup.inlineKeyboard([
        Markup.button.url('<<to 1💗1>>', 'https://1lev1.com/lev')
      ])
    });
  } else {
    ctx.reply('Welcome to 1💗1', {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: Markup.inlineKeyboard([
        Markup.button.url(
          '<<to registration להרשמה>>',
          'https://1lev1.com'
        ),
        Markup.button.url(
          '<<login להתחברות >>',
          'https://1lev1.com/login'
        ),
        Markup.button.url(
          '<<register for nutification הרשמה לעדכונים>>',
          'https://1lev1.com/me'
        )
      ])
    });
  }
});
bot.help((ctx) => ctx.reply('Send me a sticker'));

export default bot;
