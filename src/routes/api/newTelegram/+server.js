//create a server with telegraf to listen for new messages
import { Telegraf } from 'telegraf';
import { Markup } from 'telegraf';
import { sendToSer } from '$lib/send/sendToSer.svelte';
let allD = []
let appIds = []
console.log(appIds)
//token new
const Token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN_NEW;
    const bot = new Telegraf(Token);

    bot.start((ctx) => {
      console.log(ctx.chat.id,appIds);
      
      //check if the chat_id is in our list
      if (appIds.includes(ctx.chat.id)) {
        const username = allD.find((x) => x.attributes.telegramId == ctx.chat.id).attributes.username
        const uid = allD.find((x) => x.attributes.telegramId == ctx.chat.id).id
        
        ctx.reply(
         username + " " +'Welcome to 1💗1',
          Markup.inlineKeyboard([
            [
              Markup.button.url(
                '<<login להתחברות>>',
                'https://1lev1.vercel.app/login'
              )
            ],
            [
              Markup.button.callback(
                '<<start timer ⏳ הפעלת טיימר>>',
                `timerStart-${uid}`
              )
            ],
            [
              Markup.button.callback(
                '<<stop timer ⌛ עצירת טיימר>>',
                'timerStop'
              )
            ]
          ]).resize()
        );
      } else {
        ctx.reply(
          'Welcome to 1💗1' ,
     Markup.inlineKeyboard([
     [
          Markup.button.url(
            '<<to registration להרשמה>>',
            'https://1lev1.vercel.app'
          )],[
          Markup.button.url(
            '<<login להתחברות >>',
            'https://1lev1.vercel.app/login'
          )],[
          Markup.button.url(
            '<<register for nutification הרשמה לעדכונים>>',
            'https://1lev1.vercel.app/me'
          )]
      ]).resize()
    )
    }
}
);
    bot.help((ctx) =>
      ctx.reply(
        'Here you can register to updates from our 1💗1 platform',
        Markup.inlineKeyboard([[
          Markup.button.url(
            '<<to registration להרשמה>>',
            'https://1lev1.vercel.app'
          )],[
          Markup.button.url(
            '<<login להתחברות >>',
            'https://1lev1.vercel.app/login'
          )],[
          Markup.button.url(
            '<<register for nutification הרשמה לעדכונים>>',
            'https://1lev1.vercel.app/me'
          )
        ]]).resize()
      )
    );
const started = { he: 'טיימר הופעל בהצלחה', en: 'timer started' };    
const choose = {
  he: 'בחירת משימה להפעלת טיימר',
  en: 'choose mission to start timer'
};    
   
import { createServer } from 'https';

createServer(
  await bot.createWebhook({ domain:'1lev1.vercel.app',path:'/api/newTelegram' })
).listen(8443);
export async function POST({ request, fetch }) {
  try {
    const data = await request.json()
    console.log(data)
    /*
    if (!request || !request.body) {
      console.error('NullPointerException: request.body is null or undefined');
      return new Response('', { status: 500 });
    }
    */
   appIds = await sendToSer({}, '7getTelegramIds', 0, 0, true, fetch).then((res) => {
    allD = res.data.usersPermissionsUsers.data
    console.log(allD)
     return res.data.usersPermissionsUsers.data.map(
       (item) => item.attributes.telegramId != null ? Number(item.attributes.telegramId) : 0
     );
   });
     bot.action(/^startTimer-(\d+)-(\d+)$/, async (ctx) => {
      console.log(ctx.match[1], ctx.match[2],"startTimer");
        const lang = allD.find(
          (x) => x.attributes.telegramId == ctx.chat.id
        ).attributes.lang || 'en';
        const uid = allD.find((x) => x.attributes.telegramId == ctx.chat.id).id;
        
      //validate that uid is that telegramId and owned that mission in progress
      if(uid == ctx.match[2]){
       await sendToSer(
         { mId: ctx.match[1] , stname: Date.now(),x:0},
         '9startTimer',
         0,
         0,
         true,
         fetch
       ).then((res) => {
         console.log(res);
         if (res.data != null) {
          ctx.reply(started[lang]);
         }
       });
      }
     });
    bot.action(/^timerStart-(\d+)$/, async (ctx) => {
             const lang =
               allD.find((x) => x.attributes.telegramId == ctx.chat.id).attributes.lang || 'en';
      await sendToSer(
        { id: ctx.match[1] },
        '8getMissionsOnProgress',
        0,
        0,
        true,
        fetch
      ).then((res) => {
        console.log(res);
        if (res.data != null) {
          if (res.data.usersPermissionsUser.data.attributes.mesimabetahaliches.data.length > 0) {
            let arr =[]
              res.data.usersPermissionsUser.data.attributes.mesimabetahaliches.data.forEach(
                (item) => {
                  const mid = item.id;
                  const mname = item.attributes.name + "⏲️" + item.attributes.project.data.attributes.projectName;
                  arr.push( [Markup.button.callback(mname, `startTimer-${mid}-${ctx.match[1]}`)])
                }
              );
              arr = arr
            console.log(arr);
            ctx.reply(
              choose[lang],
              Markup.inlineKeyboard([...arr]).resize()
            );
          }
        }
      });
    });
    await bot.handleUpdate(data);
    return new Response('', { status: 200 });
  } catch (error) {
    console.error('Unhandled Exception while handling Telegram update: ', error);
    console.error(error.stack);
    return new Response('', { status: 500 });
  }
}
