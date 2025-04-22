// create a server with telegraf to listen for new messages
import { Telegraf, Markup } from 'telegraf';
import { sendToSer } from '$lib/send/sendToSer.svelte'; // Assuming sendToSer uses fetch internally
import { startTimer, stopTimer, saveTimer, updateTimer } from '$lib/func/timers.svelte'; // Assuming these use sendToSer or fetch
import { GoogleGenerativeAI } from '@google/generative-ai';
// createServer is likely not needed when using SvelteKit endpoint for webhook
// import { createServer } from 'https';

// --- הקשר האתר למשתמשים לא רשומים ---
const SITE_CONTEXT = `
שם האתר: 1💗1 (1lev1.com)
תיאור: פלטפורמה דיגיטלית חדשנית ליצירה, ניהול והגשמה של פרויקטים בשיתוף פעולה ובהסכמה מלאה. מאפשרת ניהול קבוצות ("רקמות") מבוזר תוך שמירה על עצמאות.
מטרות: שותפויות מבוססות הסכמה, ניהול משאבים ומשימות מבוזר, חלוקת רווחים דינמית, חיבור בין אנשים.
תכונות: קבלת החלטות פה-אחד, פנקס דיגיטלי מבוזר, כלי ניהול (גרפים, גאנט), מערכת הצבעות, שיתוף חפצים, חלוקת רווחים דינמית.
יתרונות: חיבור לרקמות מתאימות, עצמאות אישית בעבודה משותפת, הקמת שותפות קלה, השתתפות במערכת מבוססת הסכמה.
דרישות הרשמה: הסכמה ל"אמנת החירות העולמית" שתוצג באתר.
חזון: יצירת עולם טוב יותר באמצעות שיתוף פעולה מבוסס ערכים, כישורים והסכמה.
`;

// --- תרגומים וקבועים ---
const translations = {
  he: {
    welcome: 'ברוך בואך ל-1💗1',
    welcomeRegistered: '{{username}}, ברוך בואך ל-1💗1', // Changed for clarity
    login: '<<login להתחברות>>',
    register: '<<to registration להרשמה>>',
    registerNotify: '<<register for nutification הרשמה לעדכונים>>',
    startTimerBtn: '<<start timer ⏳ הפעלת טיימר>>',
    stopTimerBtn: '<<stop timer ⌛ עצירת טיימר>>',
    helpText: 'כאן תוכל להירשם לעדכונים מפלטפורמת 1💗1 שלנו, או להשתמש בי כעוזר לניהול הטיימרים שלך.',
    timerStarted: 'טיימר הופעל בהצלחה',
    chooseStart: 'בחירת משימה להפעלת טיימר',
    timerStopped: 'טיימר נעצר בהצלחה',
    chooseStop: 'בחירת משימה לעצירת טיימר',
    selectTasks: 'בחירת המטלות שברצונך לקשר לטיימר:',
    taskAdded: 'המטלה "{{name}}" נוספה בהצלחה',
    taskRemoved: 'המטלה "{{name}}" הוסרה בהצלחה',
    tasksUpdated: 'המטלות עודכנו בהצלחה',
    viewTimer: '<< 👁️ צפייה בטיימר>>',
    saveTasksBtn: '<< 💾 שמירת מטלות>>',
    editTimerBtn: '<<edit timer ✏️ עריכת טיימר>>',
    updateTasksBtn: '<<update tasks 📝 עדכון משימות>>',
    saveTimerBtn: '<<save timer 🕒 שמירת טיימר>>',
    timerSaved: 'הטיימר נשמר בהצלחה',
    aiUnderstandError: 'מצטער, לא הצלחתי להבין את בקשתך. נסה/י לנסח אחרת או השתמש/י בכפתורים.',
    aiActionFailed: 'אופסס, אירעה שגיאה בעת ביצוע הפעולה המבוקשת.',
    notRegisteredWelcome: `ברוך הבא לבוט של 1💗1!\n1💗1 היא פלטפורמה לשיתוף פעולה מבוסס הסכמה (${SITE_CONTEXT.split('\n')[1].trim()}).\nנראה שחשבון הטלגרם שלך אינו מקושר עדיין לחשבון משתמש פעיל.`,
    notRegisteredPrompt: 'ניתן להירשם לאתר, להתחבר אם יש לך חשבון, או לשאול אותי שאלות על הפלטפורמה.',
    askAboutPlatform: '<< 🤔 שאלות על הפלטפורמה >>', // New button text
    noTasksToStart: 'לא נמצאו משימות פעילות שניתן להתחיל עבורן טיימר.',
    noTasksToStop: 'לא נמצאו טיימרים פעילים שניתן לעצור.',
    askWhichTaskToStart: 'לאיזו משימה ברצונך להתחיל טיימר?',
    askWhichTaskToStop: 'לאיזו משימה ברצונך לעצור את הטיימר?',
    generalError: 'אירעה שגיאה, יש לנסות שוב מאוחר יותר.',
    timerNotFound: 'הטיימר המבוקש לא נמצא או שאינו פעיל.',
    missionNotFound: 'המשימה המבוקשת לא נמצאה.',
    taskNotFound: 'המטלה המבוקשת לא נמצאה.',
    updateFailed: 'עדכון המטלות נכשל.',
    unauthorized: 'פעולה לא מורשית.',
    askMeAnything: 'את/ה יכול/ה לשאול אותי כל דבר על 1lev1.com!',
    infoSent: 'הנה מידע נוסף על 1lev1:',
    backToStart: '<< חזרה >>'
  },
  en: {
    welcome: 'Welcome to 1💗1',
    welcomeRegistered: '{{username}}, Welcome to 1💗1',
    login: '<<login>>',
    register: '<<to registration>>',
    registerNotify: '<<register for notifications>>',
    startTimerBtn: '<<start timer ⏳>>',
    stopTimerBtn: '<<stop timer ⌛>>',
    helpText: 'Here you can register for updates from our 1💗1 platform, or use me as an assistant to manage your timers.',
    timerStarted: 'Timer started successfully',
    chooseStart: 'Choose mission to start timer',
    timerStopped: 'Timer stopped successfully',
    chooseStop: 'Choose mission to stop timer',
    selectTasks: 'Select the tasks you want to link to the timer:',
    taskAdded: 'Task "{{name}}" added successfully',
    taskRemoved: 'Task "{{name}}" removed successfully',
    tasksUpdated: 'Tasks updated successfully',
    viewTimer: '<<view timer 👁️>>',
    saveTasksBtn: '<< 💾 save tasks>>',
    editTimerBtn: '<<edit timer ✏️>>',
    updateTasksBtn: '<<update tasks 📝>>',
    saveTimerBtn: '<<save timer 🕒>>',
    timerSaved: 'Timer saved successfully',
    aiUnderstandError: 'Sorry, I couldn\'t understand your request. Please try rephrasing or use the buttons.',
    aiActionFailed: 'Sorry, an error occurred while performing the requested action.',
    notRegisteredWelcome: `Welcome to the 1💗1 Bot!\n1💗1 is a platform for consent-based collaboration (${SITE_CONTEXT.split('\n')[1].trim()}).\nIt seems your Telegram account is not yet linked to an active user account.`,
    notRegisteredPrompt: 'You can register on the website, log in if you have an account, or ask me questions about the platform.',
    askAboutPlatform: '<< 🤔 Ask About the Platform >>',
    noTasksToStart: 'No active missions found to start a timer for.',
    noTasksToStop: 'No active timers found to stop.',
    askWhichTaskToStart: 'Which mission would you like to start a timer for?',
    askWhichTaskToStop: 'Which mission would you like to stop the timer for?',
    generalError: 'An error occurred, please try again later.',
    timerNotFound: 'The requested timer was not found or is inactive.',
    missionNotFound: 'The requested mission was not found.',
    taskNotFound: 'The requested task was not found.',
    updateFailed: 'Failed to update tasks.',
    unauthorized: 'Unauthorized action.',
    askMeAnything: 'You can ask me anything about 1lev1.com!',
    infoSent: 'Here is more information about 1lev1:',
    backToStart: '<< Back >>'
  } // Add other EN translations if needed
};

// --- הגדרות ומשתנים גלובליים ---
const Token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN_NEW;
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!Token) throw new Error("Telegram Bot Token not found!");
if (!geminiApiKey) throw new Error("Gemini API Key not found!");

const bot = new Telegraf(Token);
const genAI = new GoogleGenerativeAI(geminiApiKey);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

let allD = [];
let appIds = [];

// --- פונקציות עזר ---

async function fetchUserData(fetchInstance) {
  try {
    console.log("fetchUserData: Fetching user data...");
    const res = await sendToSer({}, '7getTelegramIds', 0, 0, true, fetchInstance);
    allD = res?.data?.usersPermissionsUsers?.data || [];
    appIds = allD
      .map(item => item?.attributes?.telegramId ? Number(item.attributes.telegramId) : 0)
      .filter(id => id !== 0);
    console.log(`fetchUserData: Fetched ${allD.length} users, ${appIds.length} linked Telegram IDs.`);
  } catch (error) {
    console.error('fetchUserData Error:', error);
    allD = []; appIds = [];
  }
}

function getUserInfo(chatId) {
  const userData = allD.find((x) => x?.attributes?.telegramId == chatId);
  if (!userData) return null;
  return {
    username: userData.attributes.username,
    uid: userData.id,
    lang: userData.attributes.lang || 'he',
  };
}

function getText(key, lang = 'he', replacements = {}) {
  let text = translations[lang]?.[key] ?? translations['he']?.[key] ?? translations['en']?.[key] ?? key;
  for (const placeholder in replacements) {
    text = text.replace(`{{${placeholder}}}`, replacements[placeholder]);
  }
  return text;
}

async function getUserMissions(uid, fetchInstance, onlyStartable = false, onlyStoppable = false) {
    try {
        const res = await sendToSer({ id: uid }, '8getMissionsOnProgress', 0, 0, true, fetchInstance);
        let missions = res?.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches?.data ?? [];

        if (onlyStartable) {
            missions = missions.filter(item => !item.attributes.activeTimer?.data || !item.attributes.activeTimer.data.attributes.isActive);
        }
        if (onlyStoppable) {
            missions = missions.filter(item => item.attributes.activeTimer?.data?.attributes?.isActive);
        }

        return missions.map(item => ({
            id: item.id, name: item.attributes.name,
            projectName: item.attributes.project?.data?.attributes?.projectName || 'N/A',
            isActiveTimer: item.attributes.activeTimer?.data?.attributes?.isActive || false,
            timerId: item.attributes.activeTimer?.data?.id || null,
            tasks: item.attributes.acts?.data?.map(task => ({ id: task.id, name: task.attributes.shem })) || []
        }));
    } catch (error) {
        console.error(`getUserMissions Error for user ${uid}:`, error);
        return [];
    }
}

// --- Gemini AI Interaction (Timer Intent) - Accepts fetchInstance ---
async function understandUserIntent(userText, uid, lang, fetchInstance) {
  // **IMPORTANT**: uid here is the user's database ID (e.g., from allD)
  // Ensure getUserInfo is adapted if you pass chatId instead of uid here
  const userInfo = allD.find(u => u.id === uid); // Find user by DB ID
  if (!userInfo) return { intent: 'error', details: 'User (by ID) not found for intent check' };

  const startableMissions = await getUserMissions(uid, fetchInstance, true);
  const stoppableMissions = await getUserMissions(uid, fetchInstance, false, true);

  const missionListText = startableMissions.map(m => `- "${m.name}" (ID: ${m.id})`).join('\n');
  const activeTimersText = stoppableMissions.map(m => `- "${m.name}" (ID: ${m.id})`).join('\n');

  // --- Re-inserting the Gemini Prompt ---
  const prompt = `
You are a helpful assistant for the 1lev1 platform Telegram bot. Your goal is to understand the user's request regarding starting or stopping timers for their missions.

User ID: ${uid}
User Language: ${lang}

Available actions:
1.  'start_timer': User wants to start a timer for a specific mission. Requires 'missionId'.
2.  'stop_timer': User wants to stop an active timer. Requires 'missionId'.
3.  'ask_help': User is asking for general help.
4.  'clarify_start': User wants to start a timer but didn't specify which one, and multiple options exist.
5.  'clarify_stop': User wants to stop a timer but didn't specify which one, and multiple options exist.
6.  'unknown': The user's intent is unclear or unrelated to timer actions.

Missions available to START a timer for:
${missionListText || "None"}

Missions with currently ACTIVE timers (can be stopped):
${activeTimersText || "None"}

User request: "${userText}"

Analyze the user request considering the available missions and active timers. Respond ONLY with a JSON object containing the identified 'intent' and necessary 'parameters' (like 'missionId'). If the mission name is ambiguous or not found, lean towards 'clarify' or 'unknown'.

Examples:
- User: "start timer for Design UI", Mission "Design UI" (ID 123) exists, no active timer -> {"intent": "start_timer", "parameters": {"missionId": "123"}}
- User: "stop the timer for API integration", Mission "API integration" (ID 456) has active timer -> {"intent": "stop_timer", "parameters": {"missionId": "456"}}
- User: "start a timer", Multiple startable missions exist -> {"intent": "clarify_start"}
- User: "stop my timer", Only one active timer for mission ID 789 -> {"intent": "stop_timer", "parameters": {"missionId": "789"}}
- User: "stop my timer", Multiple active timers -> {"intent": "clarify_stop"}
- User: "help" or "how does this work?" -> {"intent": "ask_help"}
- User: "What's the weather?" -> {"intent": "unknown"}

Your JSON response:
`;
  // --- End Gemini Prompt ---

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const jsonResponse = response.text().trim().replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(jsonResponse);
  } catch (error) {
    console.error("Gemini Timer Intent Error:", error);
    return { intent: 'error', details: error.message };
  }
}

// --- Gemini AI Interaction (Unregistered Q&A - No fetch needed) ---
async function answerUnregisteredUserQuery(userText, lang) {
    // --- Re-inserting the Q&A Prompt ---
    const prompt = `
You are a helpful assistant for the 1lev1 platform Telegram bot. A user who is NOT YET REGISTERED OR LOGGED IN is asking a question.
Your goal is to answer the user's question based *only* on the provided context about the 1lev1 platform.
If the question is answerable from the context, provide a concise and helpful answer in the user's language (${lang}).
If the question cannot be answered from the context or is unrelated to 1lev1, politely state that you can only answer questions about the platform based on the provided information and gently encourage them to register or ask a different question about 1lev1.
Do NOT invent information. Stick strictly to the context.

User Language: ${lang}

Context about 1lev1 Platform:
---
${SITE_CONTEXT}
---

User's Question: "${userText}"

Your Answer (in ${lang}):
`;
    // --- End Q&A Prompt ---
    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Gemini Q&A Error:", error);
        const errorLang = ['he', 'en'].includes(lang) ? lang : 'he';
        return getText('aiActionFailed', errorLang);
    }
}

// --- Bot Middleware ---
bot.use(async (ctx, next) => {
    const chatId = ctx.chat?.id || ctx.callbackQuery?.message?.chat?.id;
    if (chatId) {
        ctx.state.userInfo = getUserInfo(chatId);
        ctx.state.lang = ctx.state.userInfo?.lang || 'he';
    } else {
        ctx.state.lang = 'he';
    }
    await next();
});

// Add fetch to context
bot.use(async (ctx, next) => {
    ctx.state.fetch = fetch;
    await next();
});

// --- Bot Handlers ---

bot.start(async (ctx) => {
  const userInfo = ctx.state.userInfo;
  const lang = ctx.state.lang;

  if (userInfo) {
    // Registered user - Filled keyboard
    ctx.reply(
      getText('welcomeRegistered', lang, { username: userInfo.username }),
      Markup.inlineKeyboard([
        [Markup.button.url(getText('login', lang), 'https://1lev1.com/login')],
        [Markup.button.callback(getText('startTimerBtn', lang), `timerStart-${userInfo.uid}`)],
        [Markup.button.callback(getText('stopTimerBtn', lang), `timerStop-${userInfo.uid}`)]
      ]).resize()
    );
  } else {
    // Unregistered user - Filled keyboard
    await ctx.reply(getText('notRegisteredWelcome', lang));
    ctx.reply(
      getText('notRegisteredPrompt', lang),
      Markup.inlineKeyboard([
        [Markup.button.url(getText('register', lang), 'https://1lev1.com')],
        [Markup.button.url(getText('login', lang), 'https://1lev1.com/login')],
        [Markup.button.callback(getText('askAboutPlatform', lang), 'ask_about_platform')]
      ]).resize()
    );
  }
});

bot.action('ask_about_platform', async (ctx) => {
    const lang = ctx.state.lang;
    await ctx.answerCbQuery();
    await ctx.reply(getText('askMeAnything', lang));
    // Provide context again upon request for clarity
    await ctx.reply(getText('infoSent', lang) + "\n\n" + SITE_CONTEXT);
});

bot.help((ctx) => {
  const lang = ctx.state.lang;
  // Filled keyboard for help
  ctx.reply(
    getText('helpText', lang),
    Markup.inlineKeyboard([
        [Markup.button.url(getText('register', lang), 'https://1lev1.com')],
        [Markup.button.url(getText('login', lang), 'https://1lev1.com/login')],
        [Markup.button.url(getText('registerNotify', lang), 'https://1lev1.com/me')]
    ]).resize()
  );
});

// --- Action Handlers (Using global fetch for helpers) ---

// Start Timer - Step 1: Choose Mission
bot.action(/^timerStart-(\d+)$/, async (ctx) => {
  const userId = ctx.match[1];
  const userInfo = ctx.state.userInfo;
  const lang = ctx.state.lang;
  const fetch = ctx.state.fetch;
  if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

  try {
      const missions = await getUserMissions(userId, fetch, true);

      if (missions.length > 0) {
        const buttons = missions.map(item => [
          Markup.button.callback(
            `${item.name} ⏲️ ${item.projectName}`,
            `startTimer-${item.id}-${userId}`
          )
        ]);
        await ctx.editMessageReplyMarkup(undefined).catch(()=>{});
        ctx.reply(getText('chooseStart', lang), Markup.inlineKeyboard(buttons).resize());
      } else {
        await ctx.editMessageReplyMarkup(undefined).catch(()=>{});
        ctx.reply(getText('noTasksToStart', lang));
      }
  } catch (error) {
      console.error("Error in timerStart-1:", error);
      ctx.reply(getText('aiActionFailed', lang));
  }
  await ctx.answerCbQuery();
});

// Start Timer - Step 2: Execute Start
bot.action(/^startTimer-(\d+)-(\d+)$/, async (ctx) => {
  const missionId = ctx.match[1];
  const userId = ctx.match[2];
  const userInfo = ctx.state.userInfo;
  const lang = ctx.state.lang;
  const fetch = ctx.state.fetch;
  if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

  try {
      const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, true, fetch); // GLOBAL fetch
      const activeTimer = missionData?.data?.mesimabetahalich?.data?.attributes?.activeTimer;
      const timerId = activeTimer?.data?.id || 0;
      const projectId = missionData?.data?.mesimabetahalich?.data?.attributes?.project?.data?.id;
      if (!projectId) throw new Error(`Project ID not found for mission ${missionId}`);

      const res = await startTimer(activeTimer, missionId, userId, projectId, timerId, true, fetch); // GLOBAL fetch

      if (res) {
          await ctx.editMessageReplyMarkup(undefined).catch(()=>{}); // Remove choice buttons
          ctx.reply(getText('timerStarted', lang)); // Filled reply
      } else {
          await ctx.editMessageReplyMarkup(undefined).catch(()=>{});
          ctx.reply(getText('aiActionFailed', lang)); // Filled reply
          throw new Error("startTimer failed");
      }
  } catch (error) {
      console.error("Error in startTimer-2:", error);
      await ctx.editMessageReplyMarkup(undefined).catch(()=>{});
      ctx.reply(getText('aiActionFailed', lang)); // Filled reply
  }
  // Answer query only if not answered by error/success paths
  if (!ctx.answered) await ctx.answerCbQuery();
});

// Stop Timer - Step 1: Choose Mission
bot.action(/^timerStop-(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.state.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    try {
        const missions = await getUserMissions(userId, fetch, false, true);

        if (missions.length > 0) {
           const buttons = missions.map(item => [
             Markup.button.callback(
               `${item.name} ⏲️ ${item.projectName}`,
               `stopTimer-${item.id}-${userId}`
             )
           ]);
           await ctx.editMessageReplyMarkup(undefined).catch(()=>{});
           ctx.reply(getText('chooseStop', lang), Markup.inlineKeyboard(buttons).resize());
        } else {
            await ctx.editMessageReplyMarkup(undefined).catch(()=>{});
            ctx.reply(getText('noTasksToStop', lang));
        }
    } catch (error) {
        console.error("Error in timerStop-1:", error);
        ctx.reply(getText('aiActionFailed', lang));
    }
    await ctx.answerCbQuery();
});

// Stop Timer - Step 2: Execute Stop
bot.action(/^stopTimer-(\d+)-(\d+)$/, async (ctx) => {
  const missionId = ctx.match[1];
  const userId = ctx.match[2];
  const userInfo = ctx.state.userInfo;
  const lang = ctx.state.lang;
  const fetch = ctx.state.fetch;
  if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

  try {
    const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, true, fetch); // GLOBAL fetch
    const activeTimerData = missionData?.data?.mesimabetahalich?.data?.attributes?.activeTimer?.data;
    if (!activeTimerData || !activeTimerData.attributes.isActive) {
        await ctx.editMessageReplyMarkup(undefined).catch(()=>{});
        ctx.reply(getText('timerNotFound', lang));
        return ctx.answerCbQuery(getText('timerNotFound', lang));
    }

    const stoppedTimer = await stopTimer(activeTimerData, fetch, true); // GLOBAL fetch

    if (stoppedTimer && stoppedTimer.attributes.isActive === false) {
        await ctx.editMessageReplyMarkup(undefined).catch(()=>{});
        // Filled reply with keyboard
        ctx.reply(
            getText('timerStopped', lang),
            Markup.inlineKeyboard([
                 [Markup.button.url(getText('editTimerBtn', lang), 'https://1lev1.com/timers')],
                 [Markup.button.callback(getText('updateTasksBtn', lang), `updateTasks-${missionId}-${userId}-${activeTimerData.id}`)],
                 [Markup.button.callback(getText('saveTimerBtn', lang), `saveTimer-${missionId}-${userId}-${activeTimerData.id}`)]
            ]).resize()
        );
    } else {
        await ctx.editMessageReplyMarkup(undefined).catch(()=>{});
        ctx.reply(getText('aiActionFailed', lang));
        throw new Error("stopTimer failed");
    }
  } catch (error) {
      console.error("Error in stopTimer-2:", error);
      await ctx.editMessageReplyMarkup(undefined).catch(()=>{});
      ctx.reply(getText('aiActionFailed', lang));
  }
  if (!ctx.answered) await ctx.answerCbQuery();
});

// Save Timer
bot.action(/^saveTimer-(\d+)-(\d+)-(\d+)$/, async (ctx) => {
  const missionId = ctx.match[1];
  const userId = ctx.match[2];
  const timerId = ctx.match[3];
  const userInfo = ctx.state.userInfo;
  const lang = ctx.state.lang;
  const fetch = ctx.state.fetch;
  if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

  try {
     const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, true, fetch); // GLOBAL fetch
     const timerToSave = missionData?.data?.mesimabetahalich?.data?.attributes?.timers?.data?.find(t => t.id == timerId);
     if (!timerToSave) {
         await ctx.editMessageReplyMarkup(undefined).catch(()=>{});
         ctx.reply(getText('timerNotFound', lang));
         return ctx.answerCbQuery(getText('timerNotFound', lang));
     }

     const savedTimer = await saveTimer(timerToSave, missionId, fetch, true); // GLOBAL fetch

     if (savedTimer) {
         await ctx.editMessageReplyMarkup(undefined).catch(()=>{});
         // Filled reply with keyboard
         ctx.reply(
             getText('timerSaved', lang),
             Markup.inlineKeyboard([[Markup.button.url(getText('viewTimer', lang), 'https://1lev1.com/timers')]]).resize()
         );
     } else {
         await ctx.editMessageReplyMarkup(undefined).catch(()=>{});
         ctx.reply(getText('aiActionFailed', lang));
         throw new Error("saveTimer failed");
     }
  } catch(error) {
      console.error("Error in saveTimer action:", error);
      await ctx.editMessageReplyMarkup(undefined).catch(()=>{});
      ctx.reply(getText('aiActionFailed', lang));
  }
   if (!ctx.answered) await ctx.answerCbQuery();
});

// Update Tasks - Show list
bot.action(/^updateTasks-(\d+)-(\d+)-(\d+)$/, async (ctx) => {
    const missionId = ctx.match[1];
    const userId = ctx.match[2];
    const timerId = ctx.match[3];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.state.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    try {
        const missionDetails = await getUserMissions(userId, fetch);
        const currentMission = missionDetails.find(m => m.id == missionId);
        if (!currentMission) throw new Error(`Mission ${missionId} not found`);

        const timerData = await sendToSer({ missionId: timerId }, '36getMissionTimer', 0, 0, true, fetch);
        const activeTimer = timerData?.data?.attributes?.activeTimer?.data;
        if (!activeTimer) {
             await ctx.editMessageReplyMarkup(undefined).catch(()=>{});
             ctx.reply(getText('timerNotFound', lang));
             return ctx.answerCbQuery(getText('timerNotFound', lang));
        }

        const allTasks = currentMission.tasks;
        const selectedTaskIds = activeTimer.attributes.acts?.data?.map(t => t.id) || [];

        if (!allTasks || allTasks.length === 0) {
            await ctx.editMessageReplyMarkup(undefined).catch(()=>{});
            ctx.reply(getText('noTasksToStart', lang));
            return ctx.answerCbQuery("No tasks found.");
        }

        const taskButtons = allTasks.map(task => {
            const isSelected = selectedTaskIds.includes(task.id);
            return [Markup.button.callback(`${isSelected ? '✅ ' : '⬜ '}${task.name}`, `toggleTask-${missionId}-${userId}-${timerId}-${task.id}`)];
        });
        taskButtons.push([Markup.button.callback(getText('saveTasksBtn', lang), `saveTasks-${missionId}-${userId}-${timerId}`)]);
        taskButtons.push([Markup.button.callback(getText('backToStart', lang), `timerStart-${userId}`)]);

        await ctx.editMessageReplyMarkup(undefined).catch(()=>{});
        ctx.reply(getText('selectTasks', lang), Markup.inlineKeyboard(taskButtons).resize());

    } catch (error) {
        console.error("Error in updateTasks action:", error);
        await ctx.editMessageReplyMarkup(undefined).catch(()=>{});
        ctx.reply(getText('aiActionFailed', lang));
    }
    if (!ctx.answered) await ctx.answerCbQuery();
});

// Toggle Task Selection
bot.action(/^toggleTask-(\d+)-(\d+)-(\d+)-(\d+)$/, async (ctx) => {
  const missionId = ctx.match[1];
  const userId = ctx.match[2];
  const timerId = ctx.match[3];
  const taskId = ctx.match[4];
  const userInfo = ctx.state.userInfo;
  const lang = ctx.state.lang;
  const fetch = ctx.state.fetch;
  if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

  try {
      const timerData = await sendToSer({ missionId: timerId }, '36getMissionTimer', 0, 0, true, fetch);
      const activeTimer = timerData?.data?.attributes?.activeTimer?.data;
      if (!activeTimer) throw new Error(`Timer ${timerId} not found.`);

      const selectedTasks = activeTimer.attributes.acts?.data || [];
      const selectedTaskIds = selectedTasks.map(t => t.id);
      const isCurrentlySelected = selectedTaskIds.includes(taskId);

      const newSelectedTaskIds = isCurrentlySelected
          ? selectedTaskIds.filter(id => id != taskId)
          : [...selectedTaskIds, taskId];

      const updatedTimer = await updateTimer(activeTimer, 'tasks', { acts: newSelectedTaskIds }, fetch, true);

      if (updatedTimer) {
          const missionDetails = await getUserMissions(userId, fetch);
          const currentMission = missionDetails.find(m => m.id == missionId);
          if (!currentMission) throw new Error(`Mission ${missionId} not found after task toggle.`);
          const allTasks = currentMission.tasks;
          const task = allTasks.find(t => t.id == taskId);
          const taskName = task ? task.name : `ID ${taskId}`;

          const latestSelectedTaskIds = updatedTimer.attributes.acts?.data?.map(t => t.id) || [];

          const taskButtons = allTasks.map(t => {
             const isSelected = latestSelectedTaskIds.includes(t.id);
             return [Markup.button.callback(`${isSelected ? '✅ ' : '⬜ '}${t.name}`, `toggleTask-${missionId}-${userId}-${timerId}-${t.id}`)];
          });
          taskButtons.push([Markup.button.callback(getText('saveTasksBtn', lang), `saveTasks-${missionId}-${userId}-${timerId}`)]);
          taskButtons.push([Markup.button.callback(getText('backToStart', lang), `timerStart-${userId}`)]);

          const confirmationText = isCurrentlySelected
            ? getText('taskRemoved', lang, { name: taskName })
            : getText('taskAdded', lang, { name: taskName });

          await ctx.answerCbQuery(confirmationText);

          await ctx.editMessageText(
              getText('selectTasks', lang),
              Markup.inlineKeyboard(taskButtons).resize()
          );

      } else {
          await ctx.answerCbQuery(getText('updateFailed', lang));
          throw new Error("Update timer failed during toggle");
      }
  } catch (error) {
       console.error(`Error toggling task action ${taskId}:`, error);
       if (!ctx.answered) await ctx.answerCbQuery(getText('aiActionFailed', lang));
       try { await ctx.editMessageText(getText('aiActionFailed', lang) + "\n" + getText('selectTasks', lang), ctx.callbackQuery.message.reply_markup); }
       catch (editError) { ctx.reply(getText('aiActionFailed', lang)); }
  }
});

// Confirm Task Save ("Done" button)
bot.action(/^saveTasks-(\d+)-(\d+)-(\d+)$/, async (ctx) => {
    const userId = ctx.match[2];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.state.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    try {
        await ctx.answerCbQuery(getText('tasksUpdated', lang));
        // Filled reply and keyboard
        await ctx.editMessageText(
            getText('tasksUpdated', lang),
            Markup.inlineKeyboard([
                [Markup.button.url(getText('viewTimer', lang), 'https://1lev1.com/timers')],
                [Markup.button.callback(getText('backToStart', lang), `timerStart-${userId}`)]
            ]).resize()
        );
    } catch (error) {
        console.error(`Error confirming task save action:`, error);
        if (!ctx.answered) await ctx.answerCbQuery(getText('aiActionFailed', lang));
        try { await ctx.editMessageText(getText('aiActionFailed', lang)); }
        catch (editError) { ctx.reply(getText('aiActionFailed', lang)); }
    }
});

// --- Text Message Handler (Using global fetch for helpers) ---
bot.on('text', async (ctx) => {
    const userText = ctx.message.text;
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.state.fetch;

    if (userText.startsWith('/')) return;

    if (userInfo) {
        // Registered User: Use Gemini for Timer Intent
        const aiResponse = await understandUserIntent(userText, userInfo.uid, lang, fetch);

        switch (aiResponse.intent) {
            case 'start_timer':
                if (aiResponse.parameters?.missionId) {
                    const missionId = aiResponse.parameters.missionId;
                    try {
                         const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, true, fetch);
                         const activeTimer = missionData?.data?.mesimabetahalich?.data?.attributes?.activeTimer;
                         const timerId = activeTimer?.data?.id || 0;
                         const projectId = missionData?.data?.mesimabetahalich?.data?.attributes?.project?.data?.id;
                         if (!projectId) throw new Error(`Project ID not found for mission ${missionId}`);
                         const res = await startTimer(activeTimer, missionId, userInfo.uid, projectId, timerId, true, fetch);
                         if (res) { ctx.reply(getText('timerStarted', lang)); }
                         else { throw new Error("Start failed via AI"); }
                    } catch (error) {
                         console.error(`AI Error starting timer:`, error);
                         ctx.reply(getText('aiActionFailed', lang));
                    }
                } else {
                     ctx.reply(getText('askWhichTaskToStart', lang));
                }
                break;

            case 'stop_timer':
                 if (aiResponse.parameters?.missionId) {
                     const missionId = aiResponse.parameters.missionId;
                     try {
                         const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, true, fetch);
                         const activeTimerData = missionData?.data?.mesimabetahalich?.data?.attributes?.activeTimer?.data;
                         if (!activeTimerData || !activeTimerData.attributes.isActive) {
                             ctx.reply(getText('timerNotFound', lang));
                             return;
                         }
                         const stoppedTimer = await stopTimer(activeTimerData, fetch, true);
                         if (stoppedTimer && !stoppedTimer.attributes.isActive) {
                             ctx.reply(getText('timerStopped', lang), Markup.inlineKeyboard([
                                [Markup.button.url(getText('editTimerBtn', lang), 'https://1lev1.com/timers')],
                                [Markup.button.callback(getText('updateTasksBtn', lang), `updateTasks-${missionId}-${userInfo.uid}-${activeTimerData.id}`)],
                                [Markup.button.callback(getText('saveTimerBtn', lang), `saveTimer-${missionId}-${userInfo.uid}-${activeTimerData.id}`)]
                             ]).resize());
                         } else { throw new Error("Stop failed via AI"); }
                     } catch (error) {
                         console.error(`AI Error stopping timer:`, error);
                         ctx.reply(getText('aiActionFailed', lang));
                     }
                 } else {
                     ctx.reply(getText('askWhichTaskToStop', lang));
                 }
                 break;

            case 'clarify_start':
                 const startableMissions = await getUserMissions(userInfo.uid, fetch, true);
                 if (startableMissions.length > 0) {
                     const buttons = startableMissions.map(item => [Markup.button.callback(`${item.name} ⏲️ ${item.projectName}`, `startTimer-${item.id}-${userInfo.uid}`)]);
                     ctx.reply(getText('askWhichTaskToStart', lang), Markup.inlineKeyboard(buttons).resize());
                 } else { ctx.reply(getText('noTasksToStart', lang)); }
                 break;

            case 'clarify_stop':
                 const stoppableMissions = await getUserMissions(userInfo.uid, fetch, false, true);
                 if (stoppableMissions.length > 0) {
                     const buttons = stoppableMissions.map(item => [Markup.button.callback(`${item.name} ⏲️ ${item.projectName}`, `stopTimer-${item.id}-${userInfo.uid}`)]);
                     ctx.reply(getText('askWhichTaskToStop', lang), Markup.inlineKeyboard(buttons).resize());
                 } else { ctx.reply(getText('noTasksToStop', lang)); }
                 break;

            case 'ask_help':
                 ctx.reply(`${getText('helpText', lang)} ${getText('askMeAnything', lang)}`);
                 break;

            case 'error':
                 console.error("Gemini intent error:", aiResponse.details);
                 ctx.reply(getText('aiUnderstandError', lang));
                 break;
            case 'unknown':
            default:
                 ctx.reply(getText('aiUnderstandError', lang));
                 break;
        }
    } else {
        // Unregistered User: Use Gemini for Q&A
        const answer = await answerUnregisteredUserQuery(userText, lang);
        await ctx.reply(answer);
        await ctx.reply(
          getText('notRegisteredPrompt', lang),
          Markup.inlineKeyboard([
             [Markup.button.url(getText('register', lang), 'https://1lev1.com')],
             [Markup.button.url(getText('login', lang), 'https://1lev1.com/login')],
             [Markup.button.callback(getText('askAboutPlatform', lang), 'ask_about_platform')]
          ]).resize()
        );
    }
});

// --- SvelteKit POST Endpoint ---
export async function POST({ request, fetch: svelteFetch }) {
  try {
    const data = await request.json();
    // console.log("Incoming Telegram Update:", JSON.stringify(data, null, 2));

    await fetchUserData(svelteFetch);

    await bot.handleUpdate(data);

    return new Response('', { status: 200 });
  } catch (error) {
    console.error('--- ERROR in SvelteKit POST Handler ---', error, error.stack);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// --- Fallback Error Handler ---
bot.catch((err, ctx) => {
  console.error(`Telegraf Error caught for update type ${ctx.updateType}:`, err);
  const lang = ctx?.state?.lang || 'he';
  if (ctx.updateType !== 'callback_query' || !ctx.answered) {
       ctx.reply(getText('generalError', lang)).catch(e => console.error("Error sending error reply:", e));
  }
});

// --- Initialization Log ---
console.log("Telegram Bot script initialized (Webhook setup via SvelteKit POST).");