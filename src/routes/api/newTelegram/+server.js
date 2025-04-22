//create a server with telegraf to listen for new messages
import { Telegraf } from 'telegraf';
import { Markup } from 'telegraf';
import { sendToSer } from '$lib/send/sendToSer.svelte';
import { startTimer } from '$lib/func/timers.svelte';
import { stopTimer } from '$lib/func/timers.svelte';
import { saveTimer } from '$lib/func/timers.svelte';
import { updateTimer } from '$lib/func/timers.svelte';
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
          username + ' ' + 'Welcome to 1💗1',
          Markup.inlineKeyboard([
            [
              Markup.button.url(
                '<<login להתחברות>>',
                'https://1lev1.com/login'
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
                `timerStop-${uid}`
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
            'https://1lev1.com'
          )],[
          Markup.button.url(
            '<<login להתחברות >>',
            'https://1lev1.com/login'
          )],[
          Markup.button.url(
            '<<register for nutification הרשמה לעדכונים>>',
            'https://1lev1.com/me'
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
            'https://1lev1.com'
          )],[
          Markup.button.url(
            '<<login להתחברות >>',
            'https://1lev1.com/login'
          )],[
          Markup.button.url(
            '<<register for nutification הרשמה לעדכונים>>',
            'https://1lev1.com/me'
          )
        ]]).resize()
      )
    );
const started = { he: 'טיימר הופעל בהצלחה', en: 'timer started' };    
const choose = {
  he: 'בחירת משימה להפעלת טיימר',
  en: 'choose mission to start timer'
};   
const stop = { he: 'טיימר נעצר בהצלחה', en: 'timer stopped' }; 
const chooseStop = { he: 'בחירת משימה לעצירת טיימר', en: 'choose mission to stop timer' };   
const selectTasks = {
  he: 'בחירת המטלות שברצונך לקשר לטיימר:',
  en: 'Select the tasks you want to link to the timer:'
};
const taskAdded = {
  he: 'המטלה "{{name}}" נוספה בהצלחה',
  en: 'Task "{{name}}" added successfully'
};
const taskRemoved = {
  he: 'המטלה "{{name}}" הוסרה בהצלחה',
  en: 'Task "{{name}}" removed successfully'
};
const tasksUpdated = {
  he: 'המטלות עודכנו בהצלחה',
  en: 'Tasks updated successfully'
};
const viewTimer = {
  he: '<< 👁️ צפייה בטיימר>>',
  en: '<<view timer 👁️>>'
};
const saveTasks = {
  he: '<< 💾 שמירת מטלות>>',
  en: '<< 💾 save tasks>>'
};
import { createServer } from 'https';

createServer(
  await bot.createWebhook({ domain:'www.1lev1.com',path:'/api/newTelegram' })
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
   bot.action(
     /^stopTimer-(\d+)-(\d+)$/,
     async (ctx) => {
       console.log('Action triggered!');
       console.log('Matched data:', ctx.match);
       const lang =
         allD.find((x) => x.attributes.telegramId == ctx.chat.id).attributes
           .lang || 'en';
       const uid = allD.find((x) => x.attributes.telegramId == ctx.chat.id).id;

       //validate that uid is that telegramId and owned that mission in progress
       if (uid == ctx.match[2]) {
         // Get the mission timer data
         const missionData = await sendToSer(
           { missionId: ctx.match[1] },
           '36getMissionTimer',
           0,
           0,
           true,
           fetch
         );

         if (missionData.data?.mesimabetahalich?.data?.attributes?.activeTimer?.data) {
           const activeTimer = missionData.data.mesimabetahalich.data.attributes.activeTimer.data;
           
           // Call stopTimer with the active timer
           const stoppedTimer = await stopTimer(activeTimer, fetch, true);
           
           if (stoppedTimer && stoppedTimer.attributes.isActive === false) {
             ctx.reply(
               stop[lang],
               Markup.inlineKeyboard([
                 [
                   Markup.button.url(
                     '<<edit timer ✏️ עריכת טיימר>>',
                     'https://1lev1.com/timers'
                   )
                 ],
                 [
                   Markup.button.callback(
                     '<<update tasks 📝 עדכון משימות>>',
                     `updateTasks-${ctx.match[1]}-${uid}-${activeTimer.id}`
                   )
                 ],
                 [
                   Markup.button.callback(
                     '<<save timer 🕒 שמירת טיימר>>',
                     `saveTimer-${ctx.match[1]}-${uid}-${activeTimer.id}`
                   )
                 ]
               ]).resize()
             );
           }
         }
       }
     }
   );
     bot.action(/^startTimer-(\d+)-(\d+)$/, async (ctx) => {
      console.log(ctx.match[1], ctx.match[2],"startTimer");
        const lang = allD.find(
          (x) => x.attributes.telegramId == ctx.chat.id
        ).attributes.lang || 'en';
        const uid = allD.find((x) => x.attributes.telegramId == ctx.chat.id).id;
        
      //validate that uid is that telegramId and owned that mission in progress
      if(uid == ctx.match[2]){
        const missionId = ctx.match[1];
        
        // Get the mission timer data
        const missionData = await sendToSer(
          { missionId },
          '36getMissionTimer',
          0,
          0,
          true,
          fetch
        );

        let activeTimer = null;
        let timerId = 0;
        const projectId = missionData.data?.mesimabetahalich?.data?.attributes?.project.data.id;

        if (missionData.data?.mesimabetahalich?.data?.attributes?.activeTimer?.data) {
          activeTimer = missionData.data.mesimabetahalich.data.attributes.activeTimer;
          timerId = missionData.data.mesimabetahalich.data.attributes.activeTimer.data.id;
        }
        
        // Call startTimer with all required params
        const res = await startTimer(
          activeTimer,
          missionId,
          uid,
          projectId,
          timerId,
          true, // isSer - true for server calls
          fetch
        );
        
        if (res) {
          ctx.reply(started[lang]);
        }
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
                  const mname = item.attributes.name + " ⏲️ " + item.attributes.project.data.attributes.projectName;
                  if(item.attributes.activeTimer.data && item.attributes.activeTimer.data.attributes.isActive != true || item.attributes.activeTimer.data == null){
                  arr.push( [Markup.button.callback(mname, `startTimer-${mid}-${ctx.match[1]}`)])
                  }
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
    bot.action(/^timerStop-(\d+)$/, async (ctx) => {
      const lang =
        allD.find((x) => x.attributes.telegramId == ctx.chat.id).attributes
          .lang || 'en';
      await sendToSer(
        { id: ctx.match[1] },
        '8getMissionsOnProgress',
        0,
        0,
        true,
        fetch
      ).then((res) => {
        console.log("stoplist", res);
        if (res.data != null) {
          if (
            res.data.usersPermissionsUser.data.attributes.mesimabetahaliches
              .data.length > 0
          ) {
            let arr = [];
            res.data.usersPermissionsUser.data.attributes.mesimabetahaliches.data.forEach(
              (item) => {
                const mid = item.id;
                const mname =
                  item.attributes.name +
                  ' ⏲️ ' +
                  item.attributes.project.data.attributes.projectName;
                if (
                  item.attributes.activeTimer.data &&
                  item.attributes.activeTimer.data.attributes.isActive
                ) {
                  arr.push([
                    Markup.button.callback(
                      mname,
                      `stopTimer-${mid}-${ctx.match[1]}`
                    )
                  ]);
                }
              }
            );
            arr = arr;
            console.log(arr);
            ctx.reply(chooseStop[lang], Markup.inlineKeyboard([...arr]).resize());
          }
        }
      });
    });
    bot.action(/^saveTimer-(\d+)-(\d+)-(\d+)$/, async (ctx) => {
      console.log('Action triggered!');
      console.log('Matched data:', ctx.match);
      const lang =
        allD.find((x) => x.attributes.telegramId == ctx.chat.id).attributes
          .lang || 'en';
      const uid = allD.find((x) => x.attributes.telegramId == ctx.chat.id).id;

      //validate that uid is that telegramId and owned that mission in progress
      if (uid == ctx.match[2]) {
        // Get the mission timer data
        const missionData = await sendToSer(
          { missionId: ctx.match[1] },
          '36getMissionTimer',
          0,
          0,
          true,
          fetch
        );

        if (missionData.data?.mesimabetahalich?.data?.attributes?.activeTimer?.data) {
          const activeTimer = missionData.data.mesimabetahalich.data.attributes.activeTimer.data;
          
          // Call saveTimer with the active timer
          const savedTimer = await saveTimer(activeTimer, ctx.match[1], fetch, true);
          
          if (savedTimer) {
            ctx.reply(
              'הטיימר נשמר בהצלחה',
              Markup.inlineKeyboard([
                [
                  Markup.button.url(
                    '<<view timer 👁️ צפייה בטיימר>>',
                    'https://1lev1.com/timers'
                  )
                ]
              ]).resize()
            );
          }
        }
      }
    });
    bot.action(/^updateTasks-(\d+)-(\d+)-(\d+)$/, async (ctx) => {
      console.log('Action triggered!');
      console.log('Matched data:', ctx.match);
      const lang =
        allD.find((x) => x.attributes.telegramId == ctx.chat.id).attributes
          .lang || 'en';
      const uid = allD.find((x) => x.attributes.telegramId == ctx.chat.id).id;

      //validate that uid is that telegramId and owned that mission in progress
      if (uid == ctx.match[2]) {
        // Get the mission timer data
        const missionData = await sendToSer(
          { missionId: ctx.match[1] },
          '36getMissionTimer',
          0,
          0,
          true,
          fetch
        );

        if (missionData.data?.mesimabetahalich?.data?.attributes?.activeTimer?.data) {
          const activeTimer = missionData.data.mesimabetahalich.data.attributes.activeTimer.data;
          
          // Get the mission's tasks
          const tasksData = await sendToSer(
            { missionId: ctx.match[1] },
            '8getMissionsOnProgress',
            0,
            0,
            true,
            fetch
          );

          if (tasksData.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches?.data) {
            const mission = tasksData.data.usersPermissionsUser.data.attributes.mesimabetahaliches.data.find(
              m => m.id === ctx.match[1]
            );

            if (mission?.attributes?.acts?.data) {
              const tasks = mission.attributes.acts.data;
              const selectedTasks = activeTimer.attributes.acts?.data || [];
              const selectedTaskIds = selectedTasks.map(t => t.id);
              
              // Create buttons for each task
              const taskButtons = tasks.map(task => {
                const isSelected = selectedTaskIds.includes(task.id);
                return [
                  Markup.button.callback(
                    `${isSelected ? '✅ ' : '⬜ '}${task.attributes.shem}`,
                    `toggleTask-${ctx.match[1]}-${uid}-${activeTimer.id}-${task.id}`
                  )
                ];
              });

              // Add a save button
              taskButtons.push([
                Markup.button.callback(
                  '<<save tasks 💾 שמירת מטלות>>',
                  `saveTasks-${ctx.match[1]}-${uid}-${activeTimer.id}`
                )
              ]);
              ctx.reply(
                selectTasks[lang],
                Markup.inlineKeyboard(taskButtons).resize()
              );
            }
          }
        }
      }
    });

    // Handle task toggling
    bot.action(/^toggleTask-(\d+)-(\d+)-(\d+)-(\d+)$/, async (ctx) => {
      console.log('Action triggered!');
      console.log('Matched data:', ctx.match);
      const lang =
        allD.find((x) => x.attributes.telegramId == ctx.chat.id).attributes
          .lang || 'en';
      const uid = allD.find((x) => x.attributes.telegramId == ctx.chat.id).id;

      //validate that uid is that telegramId and owned that mission in progress
      if (uid == ctx.match[2]) {
        // Get the mission timer data
        const missionData = await sendToSer(
          { missionId: ctx.match[1] },
          '36getMissionTimer',
          0,
          0,
          true,
          fetch
        );

        if (missionData.data?.mesimabetahalich?.data?.attributes?.activeTimer?.data) {
          const activeTimer = missionData.data.mesimabetahalich.data.attributes.activeTimer.data;
          const selectedTasks = activeTimer.attributes.acts?.data || [];
          const selectedTaskIds = selectedTasks.map(t => t.id);
          const taskId = ctx.match[4];

          // Toggle the task selection
          const newSelectedTaskIds = selectedTaskIds.includes(taskId)
            ? selectedTaskIds.filter(id => id !== taskId)
            : [...selectedTaskIds, taskId];

          // Update the timer with the new task selection
          const updatedTimer = await updateTimer(
            activeTimer,
            'tasks',
            { selectedTaskIds: newSelectedTaskIds },
            fetch,
            true
          );

          if (updatedTimer) {
            // Get the task name for the message
            const tasksData = await sendToSer(
              { missionId: ctx.match[1] },
              '8getMissionsOnProgress',
              0,
              0,
              true,
              fetch
            );

            if (tasksData.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches?.data) {
              const mission = tasksData.data.usersPermissionsUser.data.attributes.mesimabetahaliches.data.find(
                m => m.id === ctx.match[1]
              );

              if (mission?.attributes?.acts?.data) {
                const task = mission.attributes.acts.data.find(t => t.id === taskId);
                if (task) {
                  ctx.reply(
                    newSelectedTaskIds.includes(taskId)
                      ? taskAdded[lang].replace('{{name}}', task.attributes.shem)
                      : taskRemoved[lang].replace('{{name}}', task.attributes.shem)
                  );
                }
              }
            }
          }
        }
      }
    });

    // Handle task saving
    bot.action(/^saveTasks-(\d+)-(\d+)-(\d+)$/, async (ctx) => {
      console.log('Action triggered!');
      console.log('Matched data:', ctx.match);
      const lang =
        allD.find((x) => x.attributes.telegramId == ctx.chat.id).attributes
          .lang || 'en';
      const uid = allD.find((x) => x.attributes.telegramId == ctx.chat.id).id;

      //validate that uid is that telegramId and owned that mission in progress
      if (uid == ctx.match[2]) {
        // Get the mission timer data
        const missionData = await sendToSer(
          { missionId: ctx.match[1] },
          '36getMissionTimer',
          0,
          0,
          true,
          fetch
        );

        if (missionData.data?.mesimabetahalich?.data?.attributes?.activeTimer?.data) {
          const activeTimer = missionData.data.mesimabetahalich.data.attributes.activeTimer.data;
          
          ctx.reply(
            tasksUpdated[lang],
            Markup.inlineKeyboard([
              [
                Markup.button.url(
                  viewTimer[lang],
                  'https://1lev1.com/timers'
                )
              ]
            ]).resize()
          );
        }
      }
    });

    await bot.handleUpdate(data);
    return new Response('', { status: 200 });
  } catch (error) {
    console.error('Unhandled Exception while handling Telegram update: ', error);
    console.error(error.stack);
    return new Response('', { status: 500 });
  }
}
