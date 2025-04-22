// create a server with telegraf to listen for new messages
import { Telegraf, Markup } from 'telegraf';
import { sendToSer } from '$lib/send/sendToSer.svelte';
import { startTimer, stopTimer, saveTimer, updateTimer } from '$lib/func/timers.svelte'; // Group timer imports
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    backToStart: '<< חזרה >>' // New button text
  },
  en: {
    // ... (Add English translations for new keys like notRegisteredWelcome, notRegisteredPrompt, askAboutPlatform, etc.)
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
  }
};

// --- הגדרות ומשתנים גלובליים ---
const Token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN_NEW;
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!Token) throw new Error("Telegram Bot Token not found!");
if (!geminiApiKey) throw new Error("Gemini API Key not found!");

const bot = new Telegraf(Token);
const genAI = new GoogleGenerativeAI(geminiApiKey);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });

let allD = [];
let appIds = []
// --- פונקציות עזר (ללא שינוי מהותי מהגרסה הקודמת) ---
async function fetchUserData(fetch) {
  try {
    const res = await sendToSer({}, '7getTelegramIds', 0, 0, true, fetch);
    allD = res?.data?.usersPermissionsUsers?.data || [];
    appIds = allD.map(item => item?.attributes?.telegramId ? Number(item.attributes.telegramId) : 0).filter(id => id !== 0);
  } catch (error) {
    console.error('Error fetching user data:', error);
    allD = []; appIds = [];
  }
}

function getUserInfo(chatId) {
  const userData = allD.find((x) => x?.attributes?.telegramId == chatId);
  if (!userData) return null;
  return {
    username: userData.attributes.username,
    uid: userData.id,
    lang: userData.attributes.lang || 'en', // Default to English if lang not set
  };
}

function getText(key, lang = 'en', replacements = {}) {
    // Fallback logic: if key not found in specified lang, try 'he', then 'en', then return key itself
    let text = translations[lang]?.[key] ?? translations['he']?.[key] ?? translations['en']?.[key] ?? key;
    for (const placeholder in replacements) {
      text = text.replace(`{{${placeholder}}}`, replacements[placeholder]);
    }
    return text;
}

async function getUserMissions(uid, fetch, onlyStartable = false, onlyStoppable = false) {
    try {
        const res = await sendToSer({ id: uid }, '8getMissionsOnProgress', 0, 0, true, fetch);
        let missions = res?.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches?.data ?? [];

        if (onlyStartable) {
            missions = missions.filter(item =>
                !item.attributes.activeTimer?.data || !item.attributes.activeTimer.data.attributes.isActive
            );
        }
        if (onlyStoppable) {
            missions = missions.filter(item =>
                item.attributes.activeTimer?.data?.attributes?.isActive
            );
        }
        return missions.map(item => ({
            id: item.id,
            name: item.attributes.name,
            projectName: item.attributes.project?.data?.attributes?.projectName || 'N/A',
            isActiveTimer: item.attributes.activeTimer?.data?.attributes?.isActive || false,
            timerId: item.attributes.activeTimer?.data?.id || null,
            tasks: item.attributes.acts?.data?.map(task => ({ // Include tasks for update logic
                id: task.id,
                name: task.attributes.shem
            })) || []
        }));
    } catch (error) {
        console.error(`Error fetching missions for user ${uid}:`, error);
        return [];
    }
}

// --- Gemini AI Interaction (Timer Intent) ---
async function understandUserIntent(userText, uid, lang, fetch) {
  const userInfo = getUserInfo(allD.find(u => u.id === uid)?.attributes?.telegramId);
  if (!userInfo) return { intent: 'error', details: 'User not found' };

  const startableMissions = await getUserMissions(uid, fetch, true);
  const stoppableMissions = await getUserMissions(uid, fetch, false, true);

  const missionListText = startableMissions.map(m => `- "${m.name}" (ID: ${m.id}) from project "${m.projectName}"`).join('\n');
  const activeTimersText = stoppableMissions.map(m => `- "${m.name}" (ID: ${m.id}, Timer ID: ${m.timerId}) from project "${m.projectName}"`).join('\n');

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

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const jsonResponse = response.text().trim().replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(jsonResponse);
  } catch (error) {
    console.error("Error interacting with Gemini (Timer Intent):", error);
    return { intent: 'error', details: error.message };
  }
}

// --- Gemini AI Interaction (Unregistered User Q&A) ---
async function answerUnregisteredUserQuery(userText, lang) {
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
    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Error interacting with Gemini (Unregistered Q&A):", error);
        return getText('aiActionFailed', lang); // Generic error message
    }
}

// --- Bot Middleware ---
bot.use(async (ctx, next) => {
    const chatId = ctx.chat?.id || ctx.callbackQuery?.message?.chat?.id;
    if (chatId) {
        await fetchUserData(fetch); // Use global fetch or pass from SvelteKit
        ctx.state.userInfo = getUserInfo(chatId); // Store user info in context state
        ctx.state.lang = ctx.state.userInfo?.lang || 'he'; // Default language Hebrew
        // Pass fetch from SvelteKit context if possible: ctx.state.fetch = passedFetch;
    } else {
        console.log("Could not determine chat ID from update.");
    }
    await next(); // Continue processing
});

// --- Bot Handlers ---

bot.start(async (ctx) => {
  // User info and lang are now in ctx.state from middleware
  const userInfo = ctx.state.userInfo;
  const lang = ctx.state.lang;

  if (userInfo) {
    // Registered user
    ctx.reply(
      getText('welcomeRegistered', lang, { username: userInfo.username }),
      Markup.inlineKeyboard([
        [Markup.button.url(getText('login', lang), 'https://1lev1.com/login')], // Keep login link
        [Markup.button.callback(getText('startTimerBtn', lang), `timerStart-${userInfo.uid}`)],
        [Markup.button.callback(getText('stopTimerBtn', lang), `timerStop-${userInfo.uid}`)]
      ]).resize()
    );
  } else {
    // Unregistered user
    await ctx.reply(getText('notRegisteredWelcome', lang));
    ctx.reply(
      getText('notRegisteredPrompt', lang),
      Markup.inlineKeyboard([
        [Markup.button.url(getText('register', lang), 'https://1lev1.com')],
        [Markup.button.url(getText('login', lang), 'https://1lev1.com/login')],
        [Markup.button.callback(getText('askAboutPlatform', lang), 'ask_about_platform')] // New button
      ]).resize()
    );
  }
});

// Handler for "Ask About Platform" button
bot.action('ask_about_platform', async (ctx) => {
    const lang = ctx.state.lang || 'he';
    await ctx.answerCbQuery();
    await ctx.reply(getText('askMeAnything', lang));
    await ctx.reply(getText('infoSent', lang) + "\n\n" + SITE_CONTEXT,
        Markup.inlineKeyboard([
            [Markup.button.url(getText('register', lang), 'https://1lev1.com')],
            [Markup.button.url(getText('login', lang), 'https://1lev1.com/login')]
        ]).resize()
    );
});


bot.help((ctx) => {
  const lang = ctx.state.lang;
  ctx.reply(
    getText('helpText', lang),
    Markup.inlineKeyboard([
        // Keep registration links even in help for easy access
        [Markup.button.url(getText('register', lang), 'https://1lev1.com')],
        [Markup.button.url(getText('login', lang), 'https://1lev1.com/login')],
        [Markup.button.url(getText('registerNotify', lang), 'https://1lev1.com/me')] // Link to profile for notification settings
    ]).resize()
  );
});

// --- Action Handlers (Callbacks from Buttons - Restored & Integrated) ---

// Start Timer - Step 1: Choose Mission
bot.action(/^timerStart-(\d+)$/, async (ctx) => {
  const userId = ctx.match[1];
  const userInfo = ctx.state.userInfo;
  const lang = ctx.state.lang;

  if (!userInfo || userInfo.uid != userId) {
    console.warn(`Unauthorized action attempt: timerStart for user ${userId} from chat ${ctx.chat.id}`);
    return ctx.answerCbQuery(getText('unauthorized', lang));
  }

  const missions = await getUserMissions(userId, fetch, true);

  if (missions.length > 0) {
    const buttons = missions.map(item => [
      Markup.button.callback(
        `${item.name} ⏲️ ${item.projectName}`,
        `startTimer-${item.id}-${userId}`
      )
    ]);
    ctx.reply(getText('chooseStart', lang), Markup.inlineKeyboard(buttons).resize());
  } else {
    ctx.reply(getText('noTasksToStart', lang));
  }
  await ctx.answerCbQuery();
});

// Start Timer - Step 2: Execute Start
bot.action(/^startTimer-(\d+)-(\d+)$/, async (ctx) => {
  const missionId = ctx.match[1];
  const userId = ctx.match[2];
  const userInfo = ctx.state.userInfo;
  const lang = ctx.state.lang;

  if (!userInfo || userInfo.uid != userId) {
      console.warn(`Unauthorized action attempt: startTimer for mission ${missionId}, user ${userId} from chat ${ctx.chat.id}`);
      return ctx.answerCbQuery(getText('unauthorized', lang));
  }

  try {
      const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, true, fetch);
      const activeTimer = missionData?.data?.mesimabetahalich?.data?.attributes?.activeTimer;
      const timerId = activeTimer?.data?.id || 0;
      const projectId = missionData?.data?.mesimabetahalich?.data?.attributes?.project?.data?.id;

      if (!projectId) {
          console.error(`Project ID not found for mission ${missionId}`);
          ctx.reply(getText('aiActionFailed', lang));
          return ctx.answerCbQuery(getText('aiActionFailed', lang));
      }

      const res = await startTimer(activeTimer, missionId, userId, projectId, timerId, true, fetch);

      if (res) {
          await ctx.editMessageReplyMarkup(undefined).catch(e => console.log("Info: Couldn't edit message markup, probably no markup to remove.")); // Remove choice buttons
          ctx.reply(getText('timerStarted', lang));
      } else {
        throw new Error("startTimer function returned falsy value");
      }
  } catch (error) {
      console.error(`Error starting timer for mission ${missionId}, user ${userId}:`, error);
      ctx.reply(getText('aiActionFailed', lang));
  }
  await ctx.answerCbQuery();
});


// Stop Timer - Step 1: Choose Mission
bot.action(/^timerStop-(\d+)$/, async (ctx) => {
  const userId = ctx.match[1];
  const userInfo = ctx.state.userInfo;
  const lang = ctx.state.lang;

  if (!userInfo || userInfo.uid != userId) {
    console.warn(`Unauthorized action attempt: timerStop for user ${userId} from chat ${ctx.chat.id}`);
    return ctx.answerCbQuery(getText('unauthorized', lang));
  }

  const missions = await getUserMissions(userId, fetch, false, true);

  if (missions.length > 0) {
    const buttons = missions.map(item => [
      Markup.button.callback(
        `${item.name} ⏲️ ${item.projectName}`,
        `stopTimer-${item.id}-${userId}`
      )
    ]);
    ctx.reply(getText('chooseStop', lang), Markup.inlineKeyboard(buttons).resize());
  } else {
    ctx.reply(getText('noTasksToStop', lang));
  }
  await ctx.answerCbQuery();
});


// Stop Timer - Step 2: Execute Stop (Restored original keyboard logic)
bot.action(/^stopTimer-(\d+)-(\d+)$/, async (ctx) => {
  const missionId = ctx.match[1];
  const userId = ctx.match[2];
  const userInfo = ctx.state.userInfo;
  const lang = ctx.state.lang;

  if (!userInfo || userInfo.uid != userId) {
    console.warn(`Unauthorized action attempt: stopTimer for mission ${missionId}, user ${userId} from chat ${ctx.chat.id}`);
    return ctx.answerCbQuery(getText('unauthorized', lang));
  }

  try {
    const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, true, fetch);
    const activeTimerData = missionData?.data?.mesimabetahalich?.data?.attributes?.activeTimer?.data;

    if (!activeTimerData || !activeTimerData.attributes.isActive) {
      await ctx.editMessageReplyMarkup(undefined).catch(e => console.log("Info: Couldn't edit message markup."));
      ctx.reply(getText('timerNotFound', lang)); // Timer already stopped or not found
      return ctx.answerCbQuery(getText('timerNotFound', lang));
    }

    const stoppedTimer = await stopTimer(activeTimerData, fetch, true);

    if (stoppedTimer && stoppedTimer.attributes.isActive === false) {
        await ctx.editMessageReplyMarkup(undefined).catch(e => console.log("Info: Couldn't edit message markup.")); // Remove choice buttons
        ctx.reply(
            getText('timerStopped', lang),
            // --- Restored Keyboard ---
            Markup.inlineKeyboard([
                 [Markup.button.url(getText('editTimerBtn', lang), 'https://1lev1.com/timers')], // Link to general timers page
                 [Markup.button.callback(getText('updateTasksBtn', lang), `updateTasks-${missionId}-${userId}-${activeTimerData.id}`)], // Pass timer ID
                 [Markup.button.callback(getText('saveTimerBtn', lang), `saveTimer-${missionId}-${userId}-${activeTimerData.id}`)] // Pass timer ID
            ]).resize()
            // --- End Restored Keyboard ---
        );
    } else {
        throw new Error("stopTimer function failed or returned unexpected result.");
    }
  } catch (error) {
    console.error(`Error stopping timer for mission ${missionId}, user ${userId}:`, error);
    await ctx.editMessageReplyMarkup(undefined).catch(e => console.log("Info: Couldn't edit message markup."));
    ctx.reply(getText('aiActionFailed', lang));
  }
  await ctx.answerCbQuery();
});

// --- Restored Action Handlers from Original Code (Adapted) ---

// Save Timer (after stopping)
bot.action(/^saveTimer-(\d+)-(\d+)-(\d+)$/, async (ctx) => {
  const missionId = ctx.match[1];
  const userId = ctx.match[2];
  const timerId = ctx.match[3]; // Timer ID is passed in the action
  const userInfo = ctx.state.userInfo;
  const lang = ctx.state.lang;

  if (!userInfo || userInfo.uid != userId) {
    console.warn(`Unauthorized action attempt: saveTimer for timer ${timerId}, user ${userId} from chat ${ctx.chat.id}`);
    return ctx.answerCbQuery(getText('unauthorized', lang));
  }

  try {
    // We need the timer *data* to pass to saveTimer.
    // Fetch the specific timer using its ID, or reconstruct if possible.
    // For simplicity, let's assume we fetch it again or have enough info.
    // A better approach might be to pass the timer data in the callback, but that can be complex.
    // Let's fetch the mission data again to get the timer. This is inefficient but safer.
     const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, true, fetch);
     // Find the specific timer (it should be inactive now)
     const timerToSave = missionData?.data?.mesimabetahalich?.data?.attributes?.timers?.data?.find(t => t.id == timerId); // Search in all timers for the mission

    if (!timerToSave) {
        await ctx.editMessageReplyMarkup(undefined).catch(e => console.log("Info: Couldn't edit message markup."));
        ctx.reply(getText('timerNotFound', lang));
        return ctx.answerCbQuery(getText('timerNotFound', lang));
    }

    // Call saveTimer with the specific timer object and mission ID
    const savedTimer = await saveTimer(timerToSave, missionId, fetch, true);

    if (savedTimer) {
        await ctx.editMessageReplyMarkup(undefined).catch(e => console.log("Info: Couldn't edit message markup.")); // Remove prev buttons
        ctx.reply(
            getText('timerSaved', lang),
            Markup.inlineKeyboard([
                [Markup.button.url(getText('viewTimer', lang), 'https://1lev1.com/timers')] // Link to general timers page
            ]).resize()
        );
    } else {
         throw new Error("saveTimer function failed.");
    }
  } catch (error) {
      console.error(`Error saving timer ${timerId} for mission ${missionId}, user ${userId}:`, error);
      await ctx.editMessageReplyMarkup(undefined).catch(e => console.log("Info: Couldn't edit message markup."));
      ctx.reply(getText('aiActionFailed', lang));
  }
   await ctx.answerCbQuery();
});

// Update Tasks - Show task list for linking
bot.action(/^updateTasks-(\d+)-(\d+)-(\d+)$/, async (ctx) => {
  const missionId = ctx.match[1];
  const userId = ctx.match[2];
  const timerId = ctx.match[3]; // Timer ID is passed in the action
  const userInfo = ctx.state.userInfo;
  const lang = ctx.state.lang;

  if (!userInfo || userInfo.uid != userId) {
    console.warn(`Unauthorized action attempt: updateTasks for timer ${timerId}, user ${userId} from chat ${ctx.chat.id}`);
    return ctx.answerCbQuery(getText('unauthorized', lang));
  }

  try {
      // Fetch mission details to get available tasks and the specific timer's currently linked tasks
      const missionDetails = await getUserMissions(userId, fetch); // Get all missions including tasks
      const currentMission = missionDetails.find(m => m.id == missionId);

      if (!currentMission) {
          throw new Error(`Mission ${missionId} not found for user ${userId}`);
      }

      // Fetch the specific timer data again to get its linked tasks
      const timerData = await sendToSer({ timerId: timerId }, 'getTimerById', 0, 0, true, fetch); // Assuming you have an endpoint like this
      const activeTimer = timerData?.data?.timer?.data; // Adjust based on your actual API response structure

      if (!activeTimer) {
          await ctx.editMessageReplyMarkup(undefined).catch(e => console.log("Info: Couldn't edit message markup."));
          ctx.reply(getText('timerNotFound', lang));
          return ctx.answerCbQuery(getText('timerNotFound', lang));
      }

      const allTasks = currentMission.tasks; // Tasks associated with the mission
      const selectedTaskIds = activeTimer.attributes.acts?.data?.map(t => t.id) || []; // Tasks currently linked to the timer

      if (!allTasks || allTasks.length === 0) {
          await ctx.editMessageReplyMarkup(undefined).catch(e => console.log("Info: Couldn't edit message markup."));
          ctx.reply("לא נמצאו מטלות המשויכות למשימה זו."); // Or use getText
          return ctx.answerCbQuery("No tasks found.");
      }

      // Create buttons for each task
      const taskButtons = allTasks.map(task => {
          const isSelected = selectedTaskIds.includes(task.id);
          return [
              Markup.button.callback(
                  `${isSelected ? '✅ ' : '⬜ '}${task.name}`, // Use task.name from getUserMissions structure
                  `toggleTask-${missionId}-${userId}-${timerId}-${task.id}` // Pass all IDs
              )
          ];
      });

      // Add a save button
      taskButtons.push([
          Markup.button.callback(
              getText('saveTasksBtn', lang), // Use translation key
              `saveTasks-${missionId}-${userId}-${timerId}` // Pass IDs needed for saving context
          )
      ]);
      taskButtons.push([ // Add a back button maybe?
           Markup.button.callback(getText('backToStart', lang), `timerStart-${userId}`) // Go back to main menu
      ]);

      await ctx.editMessageReplyMarkup(undefined).catch(e => console.log("Info: Couldn't edit message markup.")); // Remove previous keyboard
      ctx.reply(
          getText('selectTasks', lang), // Use translation key
          Markup.inlineKeyboard(taskButtons).resize()
      );

  } catch (error) {
      console.error(`Error showing tasks for timer ${timerId}, mission ${missionId}, user ${userId}:`, error);
      await ctx.editMessageReplyMarkup(undefined).catch(e => console.log("Info: Couldn't edit message markup."));
      ctx.reply(getText('aiActionFailed', lang));
  }
  await ctx.answerCbQuery();
});

// Handle task toggling
bot.action(/^toggleTask-(\d+)-(\d+)-(\d+)-(\d+)$/, async (ctx) => {
  const missionId = ctx.match[1];
  const userId = ctx.match[2];
  const timerId = ctx.match[3];
  const taskId = ctx.match[4];
  const userInfo = ctx.state.userInfo;
  const lang = ctx.state.lang;

  if (!userInfo || userInfo.uid != userId) {
    console.warn(`Unauthorized action attempt: toggleTask ${taskId} for timer ${timerId}, user ${userId} from chat ${ctx.chat.id}`);
    return ctx.answerCbQuery(getText('unauthorized', lang));
  }

  try {
      // Fetch the current timer state again (including its tasks)
      const timerData = await sendToSer({ timerId: timerId }, 'getTimerById', 0, 0, true, fetch);
      const activeTimer = timerData?.data?.timer?.data;

      if (!activeTimer) {
        throw new Error(`Timer ${timerId} not found.`);
      }

      const selectedTasks = activeTimer.attributes.acts?.data || [];
      const selectedTaskIds = selectedTasks.map(t => t.id);

      // Determine the new list of task IDs
      const newSelectedTaskIds = selectedTaskIds.includes(taskId)
          ? selectedTaskIds.filter(id => id !== taskId) // Remove task
          : [...selectedTaskIds, taskId]; // Add task

      // --- !!! IMPORTANT: Call the actual update function !!! ---
      // This function needs to persist the change in your backend.
      // Assuming 'updateTimer' can handle updating linked tasks.
      // The third argument 'value' structure depends on how updateTimer is implemented.
      // Let's assume it expects an object like { acts: [id1, id2, ...] }
      const updatedTimer = await updateTimer(
           activeTimer, // The timer object being updated
           'tasks', // Indicate what is being updated (you might not need this arg)
           { acts: newSelectedTaskIds }, // The new value: list of task IDs
           fetch,
           true // isSer
       );
      // --- End Update Call ---

      if (!updatedTimer) {
          throw new Error(getText('updateFailed', lang));
      }

      // --- Re-render the keyboard with updated state ---
      // Fetch mission tasks again to get names
       const missionDetails = await getUserMissions(userId, fetch); // Get all missions including tasks
       const currentMission = missionDetails.find(m => m.id == missionId);
       if (!currentMission) throw new Error(`Mission ${missionId} not found.`);
       const allTasks = currentMission.tasks;
       const task = allTasks.find(t => t.id == taskId);
       const taskName = task ? task.name : `ID ${taskId}`;


      // Get the LATEST selected tasks from the *updated* timer object
      const latestSelectedTaskIds = updatedTimer.attributes.acts?.data?.map(t => t.id) || [];


      const taskButtons = allTasks.map(t => {
          const isSelected = latestSelectedTaskIds.includes(t.id);
          return [
              Markup.button.callback(
                  `${isSelected ? '✅ ' : '⬜ '}${t.name}`,
                  `toggleTask-${missionId}-${userId}-${timerId}-${t.id}`
              )
          ];
      });
       taskButtons.push([Markup.button.callback(getText('saveTasksBtn', lang), `saveTasks-${missionId}-${userId}-${timerId}`)]);
       taskButtons.push([Markup.button.callback(getText('backToStart', lang), `timerStart-${userId}`)]);


       // Answer the callback query first to stop the loading indicator
       await ctx.answerCbQuery(
           newSelectedTaskIds.includes(taskId)
               ? getText('taskAdded', lang, { name: taskName })
               : getText('taskRemoved', lang, { name: taskName })
       );

       // Edit the message with the updated keyboard
       await ctx.editMessageText(
           getText('selectTasks', lang), // Keep the same prompt text
           Markup.inlineKeyboard(taskButtons).resize()
       );

  } catch (error) {
       console.error(`Error toggling task ${taskId} for timer ${timerId}:`, error);
       await ctx.answerCbQuery(getText('aiActionFailed', lang)); // Notify user via callback popup
       // Optionally, try to revert the message or show an error message
       try {
           await ctx.editMessageText(getText('aiActionFailed', lang) + "\n" + getText('selectTasks', lang), ctx.callbackQuery.message.reply_markup);
       } catch (editError) {
           console.error("Failed to edit message on toggle error:", editError);
           ctx.reply(getText('aiActionFailed', lang)); // Fallback reply
       }
  }
});

// Handle task saving confirmation (essentially just confirms the state)
bot.action(/^saveTasks-(\d+)-(\d+)-(\d+)$/, async (ctx) => {
  const missionId = ctx.match[1];
  const userId = ctx.match[2];
  const timerId = ctx.match[3];
  const userInfo = ctx.state.userInfo;
  const lang = ctx.state.lang;

  if (!userInfo || userInfo.uid != userId) {
    console.warn(`Unauthorized action attempt: saveTasks for timer ${timerId}, user ${userId} from chat ${ctx.chat.id}`);
    return ctx.answerCbQuery(getText('unauthorized', lang));
  }

  // In this version, toggling already persists the changes.
  // This save button acts more like a "Done" button.
  // We remove the task selection keyboard and show a confirmation.
  try {
      await ctx.answerCbQuery(getText('tasksUpdated', lang)); // Show confirmation in popup
      await ctx.editMessageText(
          getText('tasksUpdated', lang), // Change message text
          Markup.inlineKeyboard([ // Provide next logical steps
              [Markup.button.url(getText('viewTimer', lang), 'https://1lev1.com/timers')],
              [Markup.button.callback(getText('backToStart', lang), `timerStart-${userId}`)] // Back to main menu
          ]).resize()
      );
  } catch (error) {
      console.error(`Error confirming task save for timer ${timerId}:`, error);
      await ctx.answerCbQuery(getText('aiActionFailed', lang));
       try {
           await ctx.editMessageText(getText('aiActionFailed', lang));
       } catch (editError) {
            console.error("Failed to edit message on saveTasks error:", editError);
            ctx.reply(getText('aiActionFailed', lang)); // Fallback reply
       }
  }

});


// --- Text Message Handler (Gemini for Timer Intent OR Unregistered Q&A) ---
bot.on('text', async (ctx) => {
    const userText = ctx.message.text;
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;

    // Ignore commands
    if (userText.startsWith('/')) {
        return;
    }

    if (userInfo) {
        // --- Registered User: Try to understand timer intent ---
        // console.log(`Processing text from registered user ${userInfo.uid} (${lang}): "${userText}"`);
        const aiResponse = await understandUserIntent(userText, userInfo.uid, lang, fetch);
        // console.log("AI Timer Intent Response:", aiResponse);

        switch (aiResponse.intent) {
            case 'start_timer':
                if (aiResponse.parameters?.missionId) {
                    // Trigger start logic (duplicate of action handler logic)
                    const missionId = aiResponse.parameters.missionId;
                    try {
                         // ... [Copy/paste startTimer execution logic from action handler above] ...
                         // Fetch mission data, project id, call startTimer, reply to user
                        const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, true, fetch);
                        const activeTimer = missionData?.data?.mesimabetahalich?.data?.attributes?.activeTimer;
                        const timerId = activeTimer?.data?.id || 0;
                        const projectId = missionData?.data?.mesimabetahalich?.data?.attributes?.project?.data?.id;
                        if (!projectId) throw new Error(`Project ID not found for mission ${missionId}`);
                        const res = await startTimer(activeTimer, missionId, userInfo.uid, projectId, timerId, true, fetch);
                        if (res) { ctx.reply(getText('timerStarted', lang)); }
                        else { throw new Error("startTimer failed"); }
                    } catch (error) {
                         console.error(`AI Error starting timer for mission ${aiResponse.parameters.missionId}:`, error);
                         ctx.reply(getText('aiActionFailed', lang));
                    }
                } else {
                     ctx.reply(getText('askWhichTaskToStart', lang)); // Should be handled by clarify_start ideally
                }
                break;

            case 'stop_timer':
                 if (aiResponse.parameters?.missionId) {
                    // Trigger stop logic (duplicate of action handler logic)
                     const missionId = aiResponse.parameters.missionId;
                     try {
                         // ... [Copy/paste stopTimer execution logic from action handler above] ...
                         // Fetch mission data, get activeTimerData, call stopTimer, reply to user with options keyboard
                         const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, true, fetch);
                         const activeTimerData = missionData?.data?.mesimabetahalich?.data?.attributes?.activeTimer?.data;
                         if (!activeTimerData || !activeTimerData.attributes.isActive) { ctx.reply(getText('timerNotFound', lang)); return; }
                         const stoppedTimer = await stopTimer(activeTimerData, fetch, true);
                         if (stoppedTimer && stoppedTimer.attributes.isActive === false) {
                             ctx.reply(getText('timerStopped', lang), Markup.inlineKeyboard([
                                [Markup.button.url(getText('editTimerBtn', lang), 'https://1lev1.com/timers')],
                                [Markup.button.callback(getText('updateTasksBtn', lang), `updateTasks-${missionId}-${userInfo.uid}-${activeTimerData.id}`)],
                                [Markup.button.callback(getText('saveTimerBtn', lang), `saveTimer-${missionId}-${userInfo.uid}-${activeTimerData.id}`)]
                             ]).resize());
                         } else { throw new Error("stopTimer failed"); }
                     } catch (error) {
                         console.error(`AI Error stopping timer for mission ${aiResponse.parameters.missionId}:`, error);
                         ctx.reply(getText('aiActionFailed', lang));
                     }
                 } else {
                    ctx.reply(getText('askWhichTaskToStop', lang)); // Should be handled by clarify_stop ideally
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
                 console.error("Gemini interaction error:", aiResponse.details);
                 // Fall through to unknown

            case 'unknown':
            default:
                 ctx.reply(getText('aiUnderstandError', lang));
                 break;
        }
    } else {
        // --- Unregistered User: Use Gemini for Q&A about the platform ---
        // console.log(`Processing text from unregistered user (${lang}): "${userText}"`);
        const answer = await answerUnregisteredUserQuery(userText, lang);
        await ctx.reply(answer);
        // Remind them how to register/login
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


// --- SvelteKit Endpoint ---
export async function POST({ request, fetch: svelteFetch }) {
    try {
        const data = await request.json();
        // Pass svelteFetch down if needed via middleware or directly
        // In middleware: bot.use((ctx, next) => { ctx.state.fetch = svelteFetch; next(); });
        // Then access via ctx.state.fetch in handlers, or ensure global fetch works.
        // For simplicity here, assuming global fetch or fetch passed implicitly by Telegraf/env.
        await bot.handleUpdate(data);
        return new Response('', { status: 200 });
    } catch (error) {
        console.error('Error handling Telegram update in POST:', error);
        console.error(error.stack);
        return new Response('Internal Server Error', { status: 500 });
    }
}

// --- Fallback Error Handler ---
bot.catch((err, ctx) => {
  console.error(`Telegraf Error for ${ctx.updateType}`, err);
  const lang = ctx?.state?.lang || 'he'; // Try to get lang from context state
  // Avoid replying if it's an error during callback query handling (already handled)
  if (ctx.updateType !== 'callback_query') {
       ctx.reply(getText('generalError', lang)).catch(e => console.error("Error sending error message:", e));
  }
});

// --- Initialization ---
console.log("Telegram Bot script initialized (Webhook via SvelteKit POST).");
// No bot.launch() or createServer needed here when using SvelteKit endpoint for webhook.