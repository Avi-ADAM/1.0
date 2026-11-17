// create a server with telegraf to listen for new messages
import { Telegraf, Markup } from 'telegraf';
import { sendToSer } from '$lib/send/sendToSer.js';
import { startTimer, stopTimer, saveTimer, updateTimer, calculateTotalHours } from '$lib/func/timers.js';
import {
    normalizeSaveLink,
    normalizeSaveLinks,
    saveLinkLabel,
    SAVE_LINKS_MAX
} from '$lib/timers/saveLinks';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { actionService } from '$lib/server/actions/index.js';
import { normalizeAdminToken } from '$lib/server/adminToken.js';
import { checkTelegramWebhook } from '$lib/server/telegramWebhookAuth.js';
import { trackTelegramCalls } from '$lib/server/telegramPendingCalls.js';
import {
    botText,
    botDateLocale,
    resolveBotLang,
    isCancelWord,
    relativeDayWord,
    NONE_WORDS
} from '$lib/server/telegram/botTexts.js';
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

// --- תרגומים: src/lib/server/telegram/botTexts.js (he/en/ar/ru/es) ---

import { env } from '$env/dynamic/private';

// --- הגדרות ומשתנים גלובליים ---
const Token = env.TELEGRAM_BOT_TOKEN_NEW;
const geminiApiKey = env.GEMINI_API_KEY;

if (!Token) throw new Error("Telegram Bot Token not found!");
if (!geminiApiKey) throw new Error("Gemini API Key not found!");

const bot = new Telegraf(Token);
const genAI = new GoogleGenerativeAI(geminiApiKey);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-3-flash-preview-preview" });

let allD = [];
let appIds = [];

// State for tracking pending datetime edits per user
const pendingEdits = new Map();
// key: userId string, value: { missionId, timerId, projectId, index, field, intervals, totalHours }

// State for tracking in-progress task creation per user
const pendingTask = new Map();
// key: userId string
// value: { projectId, projectName, assignedUserId, assigneeName,
//          tafkidId, roleName, pendingField: null|'name' }

// State for tracking an in-progress timer save per user — the note and the
// links the member is attaching before the hours go to the rikma for approval.
// Same three fields the web dialog offers, minus the file upload (a Telegram
// document would have to be relayed to /api/upload, which is its own step).
const pendingTimerSave = new Map();
// key: userId string
// value: { missionId, timerId, projectId, missionName, note, links: string[],
//          pendingField: null|'note'|'link', messageId }

// State for tracking in-progress sale per user
const pendingSale = new Map();
// key: userId string
// value: { productId, productName, price, quant, kindOf, projectId, projectName, projectUsers,
//          quantity, each, saleDate, startDate, finishDate, note, holderId, holderName,
//          pendingField: null|'quantity'|'each'|'date'|'startDate'|'finishDate'|'note', messageId }

// --- Helper functions for interval editing ---

function formatInterval(interval, index, lang) {
    const start = new Date(interval.start);
    const stop = interval.stop ? new Date(interval.stop) : null;
    const dateStr = start.toLocaleDateString(botDateLocale(lang), { day: '2-digit', month: '2-digit' });
    const startTime = start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
    const stopTime = stop
        ? stop.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })
        : '---';
    return `${index + 1}. ${dateStr} | ${startTime}→${stopTime}`;
}

function parseUserDateTime(text) {
    const match = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    let [, day, month, year, hours, minutes] = match;
    day = day.padStart(2, '0');
    month = month.padStart(2, '0');
    if (year.length === 2) year = '20' + year;
    const h = parseInt(hours), mi = parseInt(minutes);
    const m = parseInt(month), d = parseInt(day);
    if (m < 1 || m > 12 || d < 1 || d > 31 || h < 0 || h > 23 || mi < 0 || mi > 59) return null;
    // Parse as local time (user's timezone); toISOString converts to UTC
    const date = new Date(`${year}-${month}-${day}T${hours.padStart(2, '0')}:${minutes}:00`);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
}

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
        // null when the account never chose — the middleware then falls back
        // to the language the person's Telegram app reports.
        lang: userData.attributes.lang || null,
    };
}

function getText(key, lang = 'he', replacements = {}) {
    return botText(key, lang, replacements);
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
            projectId: item.attributes.project?.data?.id || null,
            isActiveTimer: item.attributes.activeTimer?.data?.attributes?.isActive || false,
            timerId: item.attributes.activeTimer?.data?.id || null,
            // The acts an hour can be attributed to: the mission's own, minus
            // the ones already reported done. Acceptance (`myIshur`) is not
            // asked — an act opened on the mission or to a role never carries
            // it, and asking left members with nothing to link.
            tasks: (item.attributes.acts?.data ?? [])
                .filter(task => !task.attributes?.naasa)
                .map(task => ({ id: task.id, name: task.attributes.shem || `#${task.id}` }))
        }));
    } catch (error) {
        console.error(`getUserMissions Error for user ${uid}:`, error);
        return [];
    }
}

// Fetch all sellable products for a user across their projects
async function getUserProducts(uid, fetchInstance) {
    try {
        const res = await sendToSer({ uid }, 'saleCenterUserProducts', 0, 0, true, fetchInstance);
        const projectsData = res?.data?.usersPermissionsUser?.data?.attributes?.projects_1s?.data ?? [];
        const products = [];
        for (const project of projectsData) {
            const projectUsers = project.attributes.user_1s?.data ?? [];
            for (const product of project.attributes.matanotofs?.data ?? []) {
                products.push({
                    id: product.id,
                    name: product.attributes.name,
                    price: product.attributes.price ?? 0,
                    quant: product.attributes.quant,
                    kindOf: product.attributes.kindOf ?? 'total',
                    projectId: project.id,
                    projectName: project.attributes.projectName,
                    projectUsers // [{ id, attributes: { username } }]
                });
            }
        }
        return products;
    } catch (error) {
        console.error('getUserProducts error:', error);
        return [];
    }
}

// Fetch the projects a user is a member of (for task creation)
async function getUserProjectsForTask(uid, fetchInstance) {
    try {
        const res = await sendToSer({ uid }, '64getUserProjectList', uid, 0, true, fetchInstance);
        const projects = res?.data?.usersPermissionsUser?.data?.attributes?.projects_1s?.data ?? [];
        return projects.map(p => ({ id: p.id, name: p.attributes.projectName }));
    } catch (error) {
        console.error('getUserProjectsForTask error:', error);
        return [];
    }
}

// Fetch a project's people (members) and roles (tafkidim) for task assignment
async function getProjectPeopleAndRoles(projectId, fetchInstance) {
    try {
        const res = await sendToSer({ pid: projectId }, 'getProjectPeopleAndRoles', 0, 0, true, fetchInstance);
        const attrs = res?.data?.project?.data?.attributes;
        const people = (attrs?.user_1s?.data ?? []).map(u => ({
            id: u.id,
            username: u.attributes?.username ?? `#${u.id}`
        }));
        const roles = (attrs?.tafkidims?.data ?? []).map(r => ({
            id: r.id,
            roleDescription:
                r.attributes?.localizations?.data?.[0]?.attributes?.roleDescription ||
                r.attributes?.roleDescription ||
                `#${r.id}`
        }));
        return { projectName: attrs?.projectName ?? '', people, roles };
    } catch (error) {
        console.error('getProjectPeopleAndRoles error:', error);
        return { projectName: '', people: [], roles: [] };
    }
}

// Fetch a member's in-progress missions (mesimabetahaliches) within a project.
// A task is linked to a mission-in-progress the person performs, so this feeds
// the mission-selection step after an assignee is chosen.
async function getMemberMissionsInProject(memberId, projectId, fetchInstance) {
    try {
        const res = await sendToSer({ id: memberId }, '8getMissionsOnProgress', 0, 0, true, fetchInstance);
        const missions = res?.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches?.data ?? [];
        return missions
            .filter(m => String(m.attributes?.project?.data?.id) === String(projectId))
            .map(m => ({ id: m.id, name: m.attributes?.name || m.attributes?.stname || `#${m.id}` }));
    } catch (error) {
        console.error('getMemberMissionsInProject error:', error);
        return [];
    }
}

// A member's meetings and whether they marked themselves available in each.
// Each meeting has its own pgishauser row for the member — the same row the
// `toggleOnline` action updates from the site's meeting page.
async function getUserMeetings(uid, fetchInstance) {
    try {
        const res = await sendToSer({ id: uid }, '23myUserMeeting', 0, 0, true, fetchInstance);
        const rows = res?.data?.pgishausers?.data ?? [];
        const meetings = [];
        for (const pu of rows) {
            for (const m of pu.attributes?.pgishas?.data ?? []) {
                const participants = m.attributes?.pgishausers?.data ?? [];
                meetings.push({
                    id: String(m.id),
                    name: m.attributes?.name || `#${m.id}`,
                    available: pu.attributes?.available === true,
                    onlineCount: participants.filter(p => p.attributes?.available === true).length,
                    total: participants.length
                });
            }
        }
        return meetings;
    } catch (error) {
        console.error('getUserMeetings error:', error);
        return [];
    }
}

function parseSaleDate(text) {
    const relDay = relativeDayWord(text);
    if (relDay === 'today') return new Date().toISOString();
    if (relDay === 'yesterday') {
        const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString();
    }
    const match = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (!match) return null;
    let [, day, month, year] = match;
    if (year.length === 2) year = '20' + year;
    const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00`);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
}

function calcSaleTotal(sale) {
    if ((sale.kindOf === 'monthly' || sale.kindOf === 'yearly') && sale.startDate && sale.finishDate) {
        const a = new Date(sale.startDate);
        const b = new Date(sale.finishDate);
        const days = Math.ceil((b - a) / (1000 * 60 * 60 * 24));
        if (days > 0) {
            const divisor = sale.kindOf === 'monthly' ? 30 : 365;
            return Number(((days / divisor) * sale.each * sale.quantity).toFixed(2));
        }
    }
    return Number((sale.quantity * sale.each).toFixed(2));
}

function formatSaleCard(sale, lang) {
    const fmt = (iso) => new Date(iso).toLocaleDateString(botDateLocale(lang), { day: '2-digit', month: '2-digit', year: 'numeric' });
    const t = (key) => getText(key, lang);
    const total = calcSaleTotal(sale);
    const isSubscription = sale.kindOf === 'monthly' || sale.kindOf === 'yearly';

    const kindLabel = sale.kindOf === 'monthly' ? ` (${t('saleKindMonthly')})`
        : sale.kindOf === 'yearly' ? ` (${t('saleKindYearly')})` : '';
    let card = `📦 *${sale.productName}*${kindLabel}\n🏢 ${sale.projectName}\n\n`;
    if (sale.kindOf !== 'total' && sale.kindOf !== 'unlimited') {
        card += `📊 ${t('saleCardQty')}: *${sale.quantity}*\n`;
    }
    card += `💰 ${t('saleCardPerUnit')}: *${sale.each} ₪*\n`;
    if (isSubscription && sale.startDate) {
        card += `📅 ${t('saleCardFrom')}: *${fmt(sale.startDate)}*`;
        card += sale.finishDate ? ` ${t('saleCardTo')}: *${fmt(sale.finishDate)}*\n` : ` (${t('saleCardOpen')})\n`;
    }
    card += `💵 ${t('saleCardTotal')}: *${total} ₪*\n`;
    card += `🗓️ ${t('saleCardDate')}: *${fmt(sale.saleDate)}*\n`;
    card += `👤 ${t('saleCardHolder')}: *${sale.holderName}*`;
    if (sale.note) card += `\n📋 ${t('saleCardNote')}: _${sale.note}_`;
    return card;
}

function buildSaleCardKeyboard(sale, uid, lang) {
    const isTotal = sale.kindOf === 'total' || sale.kindOf === 'unlimited';
    const isSubscription = sale.kindOf === 'monthly' || sale.kindOf === 'yearly';
    const t = (key) => getText(key, lang);
    const buttons = [];
    if (!isTotal) {
        buttons.push([
            Markup.button.callback(t('saleQtyBtn'), `saleFld-quantity-${uid}`),
            Markup.button.callback(t('salePriceBtn'), `saleFld-each-${uid}`)
        ]);
    } else {
        buttons.push([Markup.button.callback(t('salePriceBtn'), `saleFld-each-${uid}`)]);
    }
    if (isSubscription) {
        buttons.push([
            Markup.button.callback(t('saleStartBtn'), `saleFld-startDate-${uid}`),
            Markup.button.callback(t('saleEndBtn'), `saleFld-finishDate-${uid}`)
        ]);
    }
    buttons.push([
        Markup.button.callback(t('saleDateBtn'), `saleFld-date-${uid}`),
        Markup.button.callback(t('saleHolderBtn'), `saleHolder-${uid}`)
    ]);
    buttons.push([
        Markup.button.callback(t('saleNoteBtn'), `saleFld-note-${uid}`)
    ]);
    buttons.push([Markup.button.callback(t('saleSendBtn'), `saleSend-${uid}`)]);
    buttons.push([Markup.button.callback(t('cancelBtn'), `saleCancel-${uid}`)]);
    return Markup.inlineKeyboard(buttons).resize();
}

// --- Helpers for the timer-save card (note + links) ---

/**
 * `Finiapruval.why` is a 255-char column and the save copies the note into it,
 * so the bot holds a member to the same length the web dialog does.
 */
const TIMER_NOTE_MAX = 240;

function formatTimerSaveCard(state, lang) {
    const lines = [];
    lines.push(getText('tsTitle', lang, { missionName: state.missionName }));
    // The hours are the claim the rikma is asked to sign, so the card says how
    // many before the member signs it - not only after.
    const hours = (state.hours ?? 0).toFixed(2);
    lines.push(getText('tsHours', lang, { hours }));
    lines.push('');
    lines.push(getText('tsNote', lang, { note: state.note || '—' }));
    if (state.links.length) {
        lines.push(getText('tsLinks', lang));
        for (const link of state.links) lines.push(`• ${saveLinkLabel(link)}`);
    } else {
        lines.push(getText('tsLinksNone', lang));
    }
    return lines.join('\n');
}

function buildTimerSaveKeyboard(state, uid, lang) {
    const buttons = [
        [
            Markup.button.callback(getText('tsNoteBtn', lang), `tsFld-note-${uid}`),
            Markup.button.callback(getText('tsLinkBtn', lang), `tsFld-link-${uid}`)
        ]
    ];
    if (state.links.length) {
        buttons.push([
            Markup.button.callback(getText('tsClearLinksBtn', lang), `tsLinksClear-${uid}`)
        ]);
    }
    buttons.push([
        Markup.button.callback(
            getText('updateTasksBtn', lang),
            `updateTasks-${state.missionId}-${uid}-${state.timerId}`
        )
    ]);
    buttons.push([
        Markup.button.callback(
            getText('tsSaveNowBtn', lang),
            `tsGo-${state.missionId}-${uid}-${state.timerId}`
        )
    ]);
    buttons.push([Markup.button.callback(getText('cancelBtn', lang), `tsCancel-${uid}`)]);
    return Markup.inlineKeyboard(buttons).resize();
}

/** Draw (or redraw) the card as a fresh message and remember its id. */
async function showTimerSaveCard(ctx, state, uid, lang) {
    const msg = await ctx.reply(
        formatTimerSaveCard(state, lang),
        buildTimerSaveKeyboard(state, uid, lang)
    );
    state.messageId = msg.message_id;
    return msg;
}

// פונקציה חדשה למציאת משימות רלוונטיות
async function findRelevantMissions(userText, missions, lang) {
    const prompt = `
You are a helpful assistant for the 1lev1 platform Telegram bot. Your goal is to find the most relevant missions based on the user's text input.

User Language: ${lang}
User Input: "${userText}"

Available missions:
${missions.map(m => `- "${m.name}" (Project: ${m.projectName}, ID: ${m.id})`).join('\n')}

Analyze the user's input and find the most relevant missions. Consider:
1. Exact name matches
2. Partial name matches
3. Project name matches
4. Similar sounding names
5. Common abbreviations

Return ONLY a JSON array of mission IDs that are relevant to the user's request, ordered by relevance (most relevant first).
If no missions seem relevant, return an empty array.

Example responses:
- User: "start timer for Design UI" -> ["123"] (if mission "Design UI" exists)
- User: "start design" -> ["123", "456"] (if multiple design-related missions exist)
- User: "start something" -> [] (if no clear match)

Your JSON response:
`;

    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const jsonResponse = response.text().trim().replace(/```json/g, '').replace(/```/g, '');
        const relevantIds = JSON.parse(jsonResponse);

        // מחזיר רק את ה-IDs של המשימות הרלוונטיות
        return relevantIds;
    } catch (error) {
        console.error("Gemini Relevant Missions Error:", error);
        return []; // במקרה של שגיאה, מחזיר רשימה ריקה
    }
}

// --- Gemini AI Interaction (Timer Intent) - Accepts fetchInstance ---
async function understandUserIntent(userText, uid, lang, fetchInstance) {
    const userInfo = allD.find(u => u.id === uid);
    if (!userInfo) return { intent: 'error', details: 'User (by ID) not found for intent check' };

    const startableMissions = await getUserMissions(uid, fetchInstance, true);
    const stoppableMissions = await getUserMissions(uid, fetchInstance, false, true);

    // מציאת משימות רלוונטיות לבקשה
    const relevantMissions = await findRelevantMissions(userText, startableMissions, lang);

    const missionListText = startableMissions.map(m => `- "${m.name}" (ID: ${m.id})`).join('\n');
    const activeTimersText = stoppableMissions.map(m => `- "${m.name}" (ID: ${m.id})`).join('\n');

    const prompt = `
You are a helpful assistant for the 1lev1 platform Telegram bot. Your goal is to understand the user's request regarding starting or stopping timers for their missions, or marking their availability for meetings.

User ID: ${uid}
User Language: ${lang}

Available actions:
1.  'start_timer': User wants to start a timer for a specific mission. Requires 'missionId' and 'missionName'.
2.  'stop_timer': User wants to stop an active timer. Requires 'missionId'.
3.  'ask_help': User is asking for general help.
4.  'clarify_start': User wants to start a timer but didn't specify which one, and multiple options exist.
5.  'clarify_stop': User wants to stop a timer but didn't specify which one, and multiple options exist.
6.  'meeting_availability': User wants to mark themselves available for a meeting, cancel their availability for a meeting, or see which meetings they are available for (e.g. "I'm free to meet", "אני זמין לפגישה", "בטל זמינות"). No parameters needed.
7.  'unknown': The user's intent is unclear or unrelated.

Missions available to START a timer for:
${missionListText || "None"}

Missions with currently ACTIVE timers (can be stopped):
${activeTimersText || "None"}

Relevant missions based on user input:
${relevantMissions.map(m => `- "${m.name}" (ID: ${m.id})`).join('\n') || "None"}

User request: "${userText}"

Analyze the user request considering the available missions and active timers. If there are relevant missions found, prioritize them in your response.
Respond ONLY with a JSON object containing the identified 'intent' and necessary 'parameters' (like 'missionId').

Examples:
- User: "start timer for Design UI", Mission "Design UI" (ID 123) exists -> {"intent": "start_timer", "parameters": {"missionId": "123", "missionName": "Design UI"}}
- User: "start design", Multiple design-related missions exist -> {"intent": "clarify_start", "parameters": {"relevantMissions": ["123", "456"]}}
- User: "stop the timer for API integration", Mission "API integration" (ID 456) has active timer -> {"intent": "stop_timer", "parameters": {"missionId": "456"}}
- User: "start a timer", Multiple startable missions exist -> {"intent": "clarify_start"}
- User: "stop my timer", Only one active timer for mission ID 789 -> {"intent": "stop_timer", "parameters": {"missionId": "789"}}
- User: "stop my timer", Multiple active timers -> {"intent": "clarify_stop"}
- User: "I'm available for a meeting" or "cancel my meeting availability" -> {"intent": "meeting_availability"}
- User: "help" or "how does this work?" -> {"intent": "ask_help"}
- User: "What's the weather?" -> {"intent": "unknown"}

Your JSON response:
`;

    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const jsonResponse = response.text().trim().replace(/```json/g, '').replace(/```/g, '');
        console.log('Gemini Timer Intent Response:', JSON.parse(jsonResponse));
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
        return getText('aiActionFailed', lang);
    }
}

// --- Bot Middleware ---
// Must stay first: the webhook may not answer before the replies have left.
bot.use(async (ctx, next) => {
    const settled = trackTelegramCalls(ctx.telegram);
    try {
        await next();
    } finally {
        await settled();
    }
});

bot.use(async (ctx, next) => {
    const chatId = ctx.chat?.id || ctx.callbackQuery?.message?.chat?.id;
    ctx.state.userInfo = chatId ? getUserInfo(chatId) : null;
    ctx.state.lang = resolveBotLang(ctx.state.userInfo?.lang, ctx.from?.language_code);
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
                [Markup.button.callback(getText('stopTimerBtn', lang), `timerStop-${userInfo.uid}`)],
                [Markup.button.callback(getText('reportSaleBtn', lang), `reportSale-${userInfo.uid}`)],
                [Markup.button.callback(getText('newTaskBtn', lang), `newTask-${userInfo.uid}`)],
                [Markup.button.callback(getText('meetAvailBtn', lang), `meetAvail-${userInfo.uid}`)]
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
    await ctx.reply(getText('infoSent', lang) + "\n\n" + getText('siteInfo', lang));
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
    const fetch = ctx.update.fetch;
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
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
            ctx.reply(getText('chooseStart', lang), Markup.inlineKeyboard(buttons).resize());
        } else {
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
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
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    try {
        const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, true, fetch); // GLOBAL fetch
        const activeTimer = missionData?.data?.mesimabetahalich?.data?.attributes?.activeTimer;
        const timerId = activeTimer?.data?.id || 0;
        const projectId = missionData?.data?.mesimabetahalich?.data?.attributes?.project?.data?.id;
        if (!projectId) throw new Error(`Project ID not found for mission ${missionId}`);

        const res = await startTimer(activeTimer, missionId, userId, projectId, fetch, timerId, true, { via: 'telegram' }); // GLOBAL fetch

        if (res) {
            await ctx.editMessageReplyMarkup(undefined).catch(() => { }); // Remove choice buttons
            ctx.reply(getText('timerStarted', lang)); // Filled reply
        } else {
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
            ctx.reply(getText('aiActionFailed', lang)); // Filled reply
            throw new Error("startTimer failed");
        }
    } catch (error) {
        console.error("Error in startTimer-2:", error);
        await ctx.editMessageReplyMarkup(undefined).catch(() => { });
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
    const fetch = ctx.update.fetch;
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
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
            ctx.reply(getText('chooseStop', lang), Markup.inlineKeyboard(buttons).resize());
        } else {
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
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
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    try {
        const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, true, fetch); // GLOBAL fetch
        const activeTimerData = missionData?.data?.mesimabetahalich?.data?.attributes?.activeTimer?.data;
        if (!activeTimerData || !activeTimerData.attributes.isActive) {
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
            ctx.reply(getText('timerNotFound', lang));
            return ctx.answerCbQuery(getText('timerNotFound', lang));
        }

        const projectId = missionData?.data?.mesimabetahalich?.data?.attributes?.project?.data?.id;
        const stoppedTimer = await stopTimer(activeTimerData, fetch, true, projectId, userId, { via: 'telegram' }); // GLOBAL fetch

        const timerAttributes = stoppedTimer?.updateTimer?.data?.attributes || stoppedTimer?.attributes;

        if (timerAttributes && timerAttributes.isActive === false) {
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
            // Filled reply with keyboard
            ctx.reply(
                getText('timerStopped', lang),
                Markup.inlineKeyboard([
                    [Markup.button.url(getText('editTimerBtn', lang), `https://1lev1.com/timers?editTime=${missionId}`)],
                    [Markup.button.callback(getText('editIntervalsBtn', lang), `editTimerIntervals-${missionId}-${userId}-${activeTimerData.id}`)],
                    [Markup.button.callback(getText('updateTasksBtn', lang), `updateTasks-${missionId}-${userId}-${activeTimerData.id}`)],
                    [Markup.button.callback(getText('saveTimerBtn', lang), `saveTimer-${missionId}-${userId}-${activeTimerData.id}`)]
                ]).resize()
            );
        } else {
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
            ctx.reply(getText('aiActionFailed', lang));
            throw new Error("stopTimer failed");
        }
    } catch (error) {
        console.error("Error in stopTimer-2:", error);
        await ctx.editMessageReplyMarkup(undefined).catch(() => { });
        ctx.reply(getText('aiActionFailed', lang));
    }
    if (!ctx.answered) await ctx.answerCbQuery();
});

/**
 * Read the mission the save button was drawn for, and refuse when the mission
 * has moved on to a different timer - saving then would file the wrong session.
 */
async function readTimerForSave(missionId, timerId, fetch) {
    const timerData = await sendToSer({ missionId: missionId }, '36getMissionTimer', 0, 0, true, fetch);
    // `saveTimer` takes the **mission**, not a Timer: it reads the mission's
    // activeTimer and its `howmanyhoursalready`. This used to look for
    // `mesimabetahalich.attributes.timers`, a field 36getMissionTimer does
    // not return at all, so `timerToSave` was always undefined and the
    // button answered "timer not found" every single time.
    const missionNode = timerData?.data?.mesimabetahalich?.data;
    const activeTimerId = missionNode?.attributes?.activeTimer?.data?.id;
    if (!missionNode || !activeTimerId || String(activeTimerId) !== String(timerId)) return null;
    return missionNode;
}

// Save Timer - step 1: the save card.
// Saving used to happen on this very tap, which left a member on Telegram no
// way to say what the hours were for. The rikma is asked to approve those
// hours, so the account of them belongs with the claim: the same note and the
// same links the web dialog collects, gathered here before the save.
bot.action(/^saveTimer-(\d+)-(\d+)-(\d+)$/, async (ctx) => {
    const missionId = ctx.match[1];
    const userId = ctx.match[2];
    const timerId = ctx.match[3];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    try {
        const missionNode = await readTimerForSave(missionId, timerId, fetch);
        if (!missionNode) {
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
            ctx.reply(getText('timerNotFound', lang));
            return ctx.answerCbQuery(getText('timerNotFound', lang));
        }

        const attrs = missionNode.attributes.activeTimer.data.attributes;
        const state = {
            missionId,
            timerId,
            projectId: missionNode.attributes.project?.data?.id,
            missionName: missionNode.attributes.name || '',
            // Seeded from the timer itself, so a note or a link added in the
            // app earlier is shown here rather than quietly replaced.
            note: (attrs.saveText ?? '').toString(),
            links: normalizeSaveLinks(attrs.saveLinks),
            hours: calculateTotalHours(attrs.timers ?? []),
            pendingField: null,
            messageId: null
        };
        pendingTimerSave.set(userInfo.uid.toString(), state);

        await ctx.editMessageReplyMarkup(undefined).catch(() => { });
        await showTimerSaveCard(ctx, state, userId, lang);
    } catch (error) {
        console.error("Error opening the timer save card:", error);
        await ctx.editMessageReplyMarkup(undefined).catch(() => { });
        ctx.reply(getText('aiActionFailed', lang));
    }
    if (!ctx.answered) await ctx.answerCbQuery();
});

// Save Timer - step 2: file the hours, with whatever the card collected.
bot.action(/^tsGo-(\d+)-(\d+)-(\d+)$/, async (ctx) => {
    const missionId = ctx.match[1];
    const userId = ctx.match[2];
    const timerId = ctx.match[3];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    const uid = userInfo.uid.toString();
    const state = pendingTimerSave.get(uid);

    try {
        const missionNode = await readTimerForSave(missionId, timerId, fetch);
        if (!missionNode) {
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
            pendingTimerSave.delete(uid);
            ctx.reply(getText('timerNotFound', lang));
            return ctx.answerCbQuery(getText('timerNotFound', lang));
        }

        const projectId = missionNode.attributes.project?.data?.id;
        const savedTimer = await saveTimer(
            missionNode, missionId, fetch, true,
            // No opinion about the acts: whatever the member linked from the
            // task list stays linked. Passing [] here would unlink them.
            null,
            projectId, userId,
            state?.note ?? '',
            // The links the card is showing are the member's answer, so an
            // emptied list is sent as one - that is how a removal sticks.
            { links: state?.links ?? [] }
        );

        if (savedTimer) {
            pendingTimerSave.delete(uid);
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
            // Filled reply with keyboard
            ctx.reply(
                getText('timerSaved', lang),
                Markup.inlineKeyboard([[Markup.button.url(getText('viewTimer', lang), 'https://1lev1.com/timers')]]).resize()
            );
        } else {
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
            ctx.reply(getText('aiActionFailed', lang));
            throw new Error("saveTimer failed");
        }
    } catch (error) {
        console.error("Error in saveTimer action:", error);
        await ctx.editMessageReplyMarkup(undefined).catch(() => { });
        ctx.reply(getText('aiActionFailed', lang));
    }
    if (!ctx.answered) await ctx.answerCbQuery();
});

// Save Timer - ask for the note / the next link.
bot.action(/^tsFld-(note|link)-(\d+)$/, async (ctx) => {
    const field = ctx.match[1];
    const userId = ctx.match[2];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    const state = pendingTimerSave.get(userInfo.uid.toString());
    if (!state) return ctx.answerCbQuery(getText('timerSaveExpired', lang));

    if (field === 'link' && state.links.length >= SAVE_LINKS_MAX) {
        return ctx.answerCbQuery(getText('timerSaveLinksFull', lang, { count: SAVE_LINKS_MAX }));
    }

    state.pendingField = field;
    await ctx.answerCbQuery();
    await ctx.reply(getText(field === 'note' ? 'timerSaveNotePrompt' : 'timerSaveLinkPrompt', lang));
});

// Save Timer - drop every attached link.
bot.action(/^tsLinksClear-(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    const state = pendingTimerSave.get(userInfo.uid.toString());
    if (!state) return ctx.answerCbQuery(getText('timerSaveExpired', lang));

    state.links = [];
    state.pendingField = null;
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(undefined).catch(() => { });
    await showTimerSaveCard(ctx, state, userId, lang);
});

// Save Timer - leave the card without filing anything. The timer is untouched:
// its hours stay where they are and can be saved later from anywhere.
bot.action(/^tsCancel-(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    pendingTimerSave.delete(userInfo.uid.toString());
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(undefined).catch(() => { });
    await ctx.reply(getText('timerSaveCancelled', lang));
});

// Update Tasks - Show list
bot.action(/^updateTasks-(\d+)-(\d+)-(\d+)$/, async (ctx) => {
    const missionId = ctx.match[1];
    const userId = ctx.match[2];
    const timerId = ctx.match[3];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    try {
        const missionDetails = await getUserMissions(userId, fetch);
        const currentMission = missionDetails.find(m => m.id == missionId);
        if (!currentMission) throw new Error(`Mission ${missionId} not found`);

        const timerData = await sendToSer({ missionId: missionId }, '36getMissionTimer', 0, 0, true, fetch);
        // 36getMissionTimer answers `{ mesimabetahalich: { data } }`. Reading
        // `data.attributes` straight off the response — as this did — is always
        // undefined, so "link tasks to the timer" answered "timer not found"
        // every single time. The same slip was fixed in the save handler once.
        const missionNode = timerData?.data?.mesimabetahalich?.data;
        const activeTimer = missionNode?.attributes?.activeTimer?.data;
        if (!activeTimer) {
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
            ctx.reply(getText('timerNotFound', lang));
            return ctx.answerCbQuery(getText('timerNotFound', lang));
        }

        const allTasks = currentMission.tasks;
        const selectedTaskIds = (activeTimer.attributes.acts?.data ?? []).map(t => String(t.id));

        if (!allTasks || allTasks.length === 0) {
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
            ctx.reply(getText('noTasksToStart', lang));
            return ctx.answerCbQuery(getText('noTasksFound', lang));
        }

        const taskButtons = allTasks.map(task => {
            const isSelected = selectedTaskIds.includes(String(task.id));
            return [Markup.button.callback(`${isSelected ? '✅ ' : '⬜ '}${task.name}`, `toggleTask-${missionId}-${userId}-${timerId}-${task.id}`)];
        });
        taskButtons.push([Markup.button.callback(getText('saveTasksBtn', lang), `saveTasks-${missionId}-${userId}-${timerId}`)]);
        taskButtons.push([Markup.button.callback(getText('backToStart', lang), `timerStart-${userId}`)]);

        await ctx.editMessageReplyMarkup(undefined).catch(() => { });
        // "Save tasks" leads back to the save card when one is in flight, so a
        // member who came here to link acts is not left holding unsaved hours.
        ctx.reply(getText('selectTasks', lang), Markup.inlineKeyboard(taskButtons).resize());

    } catch (error) {
        console.error("Error in updateTasks action:", error);
        await ctx.editMessageReplyMarkup(undefined).catch(() => { });
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
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    try {
        // The query is keyed by the **mission**, not the timer — passing
        // `timerId` here asked Strapi for a mission that does not exist.
        const timerData = await sendToSer({ missionId: missionId }, '36getMissionTimer', 0, 0, true, fetch);
        const missionNode = timerData?.data?.mesimabetahalich?.data;
        const activeTimer = missionNode?.attributes?.activeTimer?.data;
        if (!activeTimer) throw new Error(`Timer ${timerId} not found.`);
        const projectId = missionNode?.attributes?.project?.data?.id;

        const selectedTasks = activeTimer.attributes.acts?.data || [];
        const selectedTaskIds = selectedTasks.map(t => String(t.id));
        const isCurrentlySelected = selectedTaskIds.includes(String(taskId));

        const newSelectedTaskIds = isCurrentlySelected
            ? selectedTaskIds.filter(id => id !== String(taskId))
            : [...selectedTaskIds, String(taskId)];

        // `updateTimer` reads the list off `selectedTaskIds`, and timerLogUpdate
        // requires the project and the user for its authorization. This call
        // named the field `acts` and passed neither, so even once it reached the
        // action it would have sent an empty relation — unlinking everything.
        const updatedTimer = await updateTimer(
            activeTimer, 'tasks',
            { selectedTaskIds: newSelectedTaskIds, isSer: true },
            fetch, projectId, userId
        );

        if (updatedTimer) {
            const missionDetails = await getUserMissions(userId, fetch);
            const currentMission = missionDetails.find(m => m.id == missionId);
            if (!currentMission) throw new Error(`Mission ${missionId} not found after task toggle.`);
            const allTasks = currentMission.tasks;
            const task = allTasks.find(t => t.id == taskId);
            const taskName = task ? task.name : `ID ${taskId}`;

            const latestSelectedTaskIds = (updatedTimer.attributes?.acts?.data ?? []).map(t => String(t.id));

            const taskButtons = allTasks.map(t => {
                const isSelected = latestSelectedTaskIds.includes(String(t.id));
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
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    try {
        await ctx.answerCbQuery(getText('tasksUpdated', lang));
        const saveState = pendingTimerSave.get(userInfo.uid.toString());
        if (saveState) {
            // The member came here from the save card and still has hours to
            // file - hand the card back rather than ending the flow.
            await ctx.editMessageText(getText('tasksUpdated', lang));
            await showTimerSaveCard(ctx, saveState, userId, lang);
            return;
        }
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

// --- Timer Interval Edit Handlers ---

// Step 1: Show list of completed intervals for a timer
bot.action(/^editTimerIntervals-(\d+)-(\d+)-(\d+)$/, async (ctx) => {
    const missionId = ctx.match[1];
    const userId = ctx.match[2];
    const timerId = ctx.match[3];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    try {
        const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, true, fetch);
        const timerData = missionData?.data?.mesimabetahalich?.data?.attributes?.activeTimer?.data;

        if (!timerData) {
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
            ctx.reply(getText('timerNotFound', lang));
            return ctx.answerCbQuery();
        }

        const allIntervals = timerData.attributes.timers || [];
        // Only show completed intervals (have both start and stop)
        const completedIntervals = allIntervals
            .map((interval, i) => ({ interval, i }))
            .filter(({ interval }) => interval.start && interval.stop);

        if (completedIntervals.length === 0) {
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
            ctx.reply(getText('noIntervals', lang));
            return ctx.answerCbQuery();
        }

        const buttons = completedIntervals.map(({ interval, i }) => [
            Markup.button.callback(
                formatInterval(interval, i, lang),
                `editInterval-${missionId}-${userId}-${timerId}-${i}`
            )
        ]);

        await ctx.editMessageReplyMarkup(undefined).catch(() => { });
        ctx.reply(getText('chooseInterval', lang), Markup.inlineKeyboard(buttons).resize());
    } catch (error) {
        console.error('Error in editTimerIntervals:', error);
        ctx.reply(getText('aiActionFailed', lang));
    }
    await ctx.answerCbQuery();
});

// Step 2: Show "Edit Start" / "Edit End" options for a specific interval
bot.action(/^editInterval-(\d+)-(\d+)-(\d+)-(\d+)$/, async (ctx) => {
    const missionId = ctx.match[1];
    const userId = ctx.match[2];
    const timerId = ctx.match[3];
    const index = parseInt(ctx.match[4]);
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    try {
        const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, true, fetch);
        const timerData = missionData?.data?.mesimabetahalich?.data?.attributes?.activeTimer?.data;
        const interval = timerData?.attributes?.timers?.[index];

        if (!interval) {
            ctx.reply(getText('timerNotFound', lang));
            return ctx.answerCbQuery();
        }

        const intervalText = formatInterval(interval, index, lang);
        const buttons = [
            [Markup.button.callback(getText('editStartBtn', lang), `editIntervalField-${missionId}-${userId}-${timerId}-${index}-start`)],
            [Markup.button.callback(getText('editEndBtn', lang), `editIntervalField-${missionId}-${userId}-${timerId}-${index}-end`)],
            [Markup.button.callback(getText('backToIntervals', lang), `editTimerIntervals-${missionId}-${userId}-${timerId}`)]
        ];

        await ctx.editMessageReplyMarkup(undefined).catch(() => { });
        const whatToEdit = getText('whatToEdit', lang);
        ctx.reply(`${intervalText}\n\n${whatToEdit}`, Markup.inlineKeyboard(buttons).resize());
    } catch (error) {
        console.error('Error in editInterval:', error);
        ctx.reply(getText('aiActionFailed', lang));
    }
    await ctx.answerCbQuery();
});

// Step 3: Set pending edit state and prompt user for new datetime
bot.action(/^editIntervalField-(\d+)-(\d+)-(\d+)-(\d+)-(start|end)$/, async (ctx) => {
    const missionId = ctx.match[1];
    const userId = ctx.match[2];
    const timerId = ctx.match[3];
    const index = parseInt(ctx.match[4]);
    const field = ctx.match[5];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    try {
        const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, true, fetch);
        const timerData = missionData?.data?.mesimabetahalich?.data?.attributes?.activeTimer?.data;
        const projectId = missionData?.data?.mesimabetahalich?.data?.attributes?.project?.data?.id;

        if (!timerData) {
            ctx.reply(getText('timerNotFound', lang));
            return ctx.answerCbQuery();
        }

        const intervals = timerData.attributes.timers || [];
        const interval = intervals[index];
        if (!interval) {
            ctx.reply(getText('timerNotFound', lang));
            return ctx.answerCbQuery();
        }

        // Show current value for context
        const currentVal = field === 'start' ? interval.start : interval.stop;
        const currentFormatted = currentVal
            ? new Date(currentVal).toLocaleString(botDateLocale(lang), {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: false
            })
            : '---';

        pendingEdits.set(userInfo.uid.toString(), {
            missionId, timerId, projectId,
            index, field, intervals,
            totalHours: timerData.attributes.totalHours || 0
        });

        await ctx.editMessageReplyMarkup(undefined).catch(() => { });
        const currentLabel = getText('currentValue', lang);
        ctx.reply(
            `${currentLabel}: ${currentFormatted}\n\n${getText('editIntervalPrompt', lang)}`,
            Markup.inlineKeyboard([
                [Markup.button.callback(getText('cancelEdit', lang), `cancelEdit-${userId}`)]
            ]).resize()
        );
    } catch (error) {
        console.error('Error in editIntervalField:', error);
        ctx.reply(getText('aiActionFailed', lang));
    }
    await ctx.answerCbQuery();
});

// Cancel edit
bot.action(/^cancelEdit-(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    pendingEdits.delete(userInfo.uid.toString());
    await ctx.answerCbQuery(getText('editCancelledToast', lang));
    await ctx.editMessageText(getText('editCancelled', lang)).catch(() => { });
});

// ─── Sale Action Handlers ──────────────────────────────────────────────────

// Step 1: Show product list
bot.action(/^reportSale-(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    try {
        const products = await getUserProducts(userId, fetch);
        if (products.length === 0) {
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
            ctx.reply(getText('noProducts', lang));
        } else {
            const buttons = products.map(p => [
                Markup.button.callback(`${p.name} | ${p.projectName}`, `saleProd-${p.id}-${userId}`)
            ]);
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
            ctx.reply(getText('chooseProduct', lang), Markup.inlineKeyboard(buttons).resize());
        }
    } catch (error) {
        console.error('reportSale error:', error);
        ctx.reply(getText('aiActionFailed', lang));
    }
    await ctx.answerCbQuery();
});

// Step 2: Product selected → create pending sale with defaults, show card
bot.action(/^saleProd-(\d+)-(\d+)$/, async (ctx) => {
    const productId = ctx.match[1];
    const userId = ctx.match[2];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    try {
        const products = await getUserProducts(userId, fetch);
        const product = products.find(p => p.id == productId);
        if (!product) {
            await ctx.editMessageReplyMarkup(undefined).catch(() => { });
            ctx.reply(getText('missionNotFound', lang));
            return ctx.answerCbQuery();
        }

        // Default holder = the reporting user themselves
        const selfUser = product.projectUsers.find(u => u.id == userInfo.uid);
        const holderId = selfUser?.id ?? product.projectUsers[0]?.id ?? String(userInfo.uid);
        const holderName = selfUser?.attributes?.username ?? product.projectUsers[0]?.attributes?.username ?? userInfo.username;

        const sale = {
            productId: product.id,
            productName: product.name,
            price: product.price,
            quant: product.quant,
            kindOf: product.kindOf,
            projectId: product.projectId,
            projectName: product.projectName,
            projectUsers: product.projectUsers,
            quantity: 1,
            each: product.price,
            saleDate: new Date().toISOString(),
            startDate: null,
            finishDate: null,
            note: '',
            holderId,
            holderName,
            pendingField: null,
            messageId: null
        };
        pendingSale.set(userId.toString(), sale);

        await ctx.editMessageReplyMarkup(undefined).catch(() => { });
        const msg = await ctx.reply(formatSaleCard(sale, lang), {
            parse_mode: 'Markdown',
            ...buildSaleCardKeyboard(sale, userId, lang)
        });
        sale.messageId = msg.message_id;
    } catch (error) {
        console.error('saleProd error:', error);
        ctx.reply(getText('aiActionFailed', lang));
    }
    await ctx.answerCbQuery();
});

// Change holder: show project users
bot.action(/^saleHolder-(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    const sale = pendingSale.get(userId.toString());
    if (!sale) { ctx.reply(getText('generalError', lang)); return ctx.answerCbQuery(); }

    const buttons = sale.projectUsers.map(u => [
        Markup.button.callback(
            `${u.attributes.username}${u.id == sale.holderId ? ' ✓' : ''}`,
            `saleHolderSel-${u.id}-${userId}`
        )
    ]);
    buttons.push([Markup.button.callback(getText('backToStart', lang), `saleBack-${userId}`)]);

    await ctx.editMessageReplyMarkup(undefined).catch(() => { });
    ctx.reply(getText('chooseHolder', lang), Markup.inlineKeyboard(buttons).resize());
    await ctx.answerCbQuery();
});

// Holder selected
bot.action(/^saleHolderSel-(\d+)-(\d+)$/, async (ctx) => {
    const holderId = ctx.match[1];
    const userId = ctx.match[2];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    const sale = pendingSale.get(userId.toString());
    if (!sale) { ctx.reply(getText('generalError', lang)); return ctx.answerCbQuery(); }

    const holder = sale.projectUsers.find(u => u.id == holderId);
    if (!holder) { ctx.reply(getText('generalError', lang)); return ctx.answerCbQuery(); }

    sale.holderId = holder.id;
    sale.holderName = holder.attributes.username;
    sale.pendingField = null;

    await ctx.editMessageReplyMarkup(undefined).catch(() => { });
    const msg = await ctx.reply(formatSaleCard(sale, lang), {
        parse_mode: 'Markdown',
        ...buildSaleCardKeyboard(sale, userId, lang)
    });
    sale.messageId = msg.message_id;
    await ctx.answerCbQuery();
});

// Set pending field (quantity / each / date / note / startDate / finishDate) → prompt text input
bot.action(/^saleFld-(quantity|each|date|note|startDate|finishDate)-(\d+)$/, async (ctx) => {
    const field = ctx.match[1];
    const userId = ctx.match[2];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    const sale = pendingSale.get(userId.toString());
    if (!sale) { ctx.reply(getText('generalError', lang)); return ctx.answerCbQuery(); }

    sale.pendingField = field;

    const prompt = field === 'quantity'
        ? getText('saleQuantityPrompt', lang)
        : field === 'each'
            ? getText('salePricePrompt', lang)
            : field === 'note'
                ? getText('saleNotePrompt', lang)
                : field === 'startDate'
                    ? getText('saleStartDatePrompt', lang)
                    : field === 'finishDate'
                        ? getText('saleFinishDatePrompt', lang)
                        : getText('saleDatePrompt', lang);

    ctx.reply(prompt, Markup.inlineKeyboard([
        [Markup.button.callback(getText('cancelEdit', lang), `saleCancelFld-${userId}`)]
    ]).resize());
    await ctx.answerCbQuery();
});

// Cancel field input
bot.action(/^saleCancelFld-(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    const sale = pendingSale.get(userId.toString());
    if (sale) sale.pendingField = null;
    await ctx.answerCbQuery(getText('cancelledToast', lang));
    await ctx.editMessageText(getText('inputCancelled', lang)).catch(() => { });
});

// Back to sale card (from holder list)
bot.action(/^saleBack-(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    const sale = pendingSale.get(userId.toString());
    if (!sale) { ctx.reply(getText('generalError', lang)); return ctx.answerCbQuery(); }

    sale.pendingField = null;
    await ctx.editMessageReplyMarkup(undefined).catch(() => { });
    const msg = await ctx.reply(formatSaleCard(sale, lang), {
        parse_mode: 'Markdown',
        ...buildSaleCardKeyboard(sale, userId, lang)
    });
    sale.messageId = msg.message_id;
    await ctx.answerCbQuery();
});

// Send sale
bot.action(/^saleSend-(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    const sale = pendingSale.get(userId.toString());
    if (!sale) { ctx.reply(getText('generalError', lang)); return ctx.answerCbQuery(); }

    try {
        const total = calcSaleTotal(sale);
        const now = new Date().toISOString();
        const vars = {
            project: sale.projectId,
            matanot: sale.productId,
            users_permissions_user: sale.holderId,
            in: total,
            unit: sale.quantity,
            date: sale.saleDate,
            publishedAt: now
        };
        if (sale.kindOf === 'monthly' || sale.kindOf === 'yearly') {
            vars.startDate = sale.startDate ?? sale.saleDate;
            if (sale.finishDate) vars.finishDate = sale.finishDate;
        }
        if (sale.note?.trim()) vars.note = sale.note.trim();

        const res = await sendToSer(vars, 'createSaleRecord', 0, 0, true, fetch);
        if (!res?.data?.createSale?.data?.id) throw new Error('Sale creation failed');

        const saleId = res.data.createSale.data.id;

        // Decrement quantity if not unlimited
        if (sale.quant !== -1 && sale.quantity > 0) {
            await sendToSer(
                { id: sale.productId, quant: sale.quant - sale.quantity },
                'updateMatanotQuant', 0, 0, true, fetch
            ).catch(e => console.warn('[saleSend] quant update failed:', e));
        }

        // Create open-ended Monter for monthly/yearly without finish date
        if ((sale.kindOf === 'monthly' || sale.kindOf === 'yearly') && !vars.finishDate) {
            await sendToSer(
                { saleId, start: vars.startDate },
                'createMonterForSale', 0, 0, true, fetch
            ).catch(e => console.warn('[saleSend] monter creation failed:', e));
        }

        pendingSale.delete(userId.toString());
        await ctx.editMessageReplyMarkup(undefined).catch(() => { });
        ctx.reply(getText('saleCreated', lang));
    } catch (error) {
        console.error('saleSend error:', error);
        ctx.reply(getText('saleError', lang));
    }
    await ctx.answerCbQuery();
});

// Cancel sale
bot.action(/^saleCancel-(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    pendingSale.delete(userId.toString());
    await ctx.answerCbQuery(getText('cancelledToast', lang));
    await ctx.editMessageText(getText('saleCancelled', lang)).catch(() => { });
});

// ─── Task (Act) Creation Handlers ──────────────────────────────────────────

// Persist the assembled task via the Unified Action System (fires notifications).
async function finalizeTask(ctx, uid, lang, fetch) {
    const task = pendingTask.get(uid);
    if (!task || !task.projectId || !task.name) {
        ctx.reply(getText('generalError', lang));
        return;
    }
    try {
        const params = {
            projectId: task.projectId,
            name: task.name,
            // A person assignment takes precedence; otherwise a role assignment;
            // otherwise the task stays unassigned at the project level.
            isAssigned: task.assignedUserId ? true : !task.tafkidId
        };
        if (task.assignedUserId) params.assignedUserId = task.assignedUserId;
        if (task.tafkidId) params.tafkidims = [task.tafkidId];
        if (task.missionId) params.missionId = task.missionId;

        const result = await actionService.executeAction('createTask', params, {
            userId: String(uid),
            jwt: normalizeAdminToken(env.ADMINMONTHER),
            lang,
            fetch
        });

        if (result?.success) {
            pendingTask.delete(uid);
            ctx.reply(getText('taskCreated', lang, { name: task.name }));
        } else {
            console.error('finalizeTask action error:', result?.error);
            ctx.reply(getText('taskError', lang));
        }
    } catch (error) {
        console.error('finalizeTask error:', error);
        ctx.reply(getText('taskError', lang));
    }
}

// Step 1: choose a project
bot.action(/^newTask-(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    try {
        const projects = await getUserProjectsForTask(userId, fetch);
        await ctx.editMessageReplyMarkup(undefined).catch(() => { });
        if (projects.length === 0) {
            ctx.reply(getText('noProjectsForTask', lang));
        } else {
            const buttons = projects.map(p => [
                Markup.button.callback(p.name, `taskProj-${p.id}-${userId}`)
            ]);
            buttons.push([Markup.button.callback(getText('cancelEdit', lang), `taskCancel-${userId}`)]);
            ctx.reply(getText('chooseTaskProject', lang), Markup.inlineKeyboard(buttons).resize());
        }
    } catch (error) {
        console.error('newTask error:', error);
        ctx.reply(getText('aiActionFailed', lang));
    }
    await ctx.answerCbQuery();
});

// Step 2: project chosen → choose assignee type
bot.action(/^taskProj-(\d+)-(\d+)$/, async (ctx) => {
    const projectId = ctx.match[1];
    const userId = ctx.match[2];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    pendingTask.set(userId.toString(), {
        projectId,
        projectName: '',
        assignedUserId: null,
        assigneeName: null,
        tafkidId: null,
        roleName: null,
        missionId: null,
        name: null,
        pendingField: null
    });

    await ctx.editMessageReplyMarkup(undefined).catch(() => { });
    ctx.reply(getText('chooseAssigneeType', lang), Markup.inlineKeyboard([
        [Markup.button.callback(getText('assignToPersonBtn', lang), `taskAsPerson-${userId}`)],
        [Markup.button.callback(getText('assignToRoleBtn', lang), `taskAsRole-${userId}`)],
        [Markup.button.callback(getText('assignToNoneBtn', lang), `taskAsNone-${userId}`)],
        [Markup.button.callback(getText('cancelEdit', lang), `taskCancel-${userId}`)]
    ]).resize());
    await ctx.answerCbQuery();
});

// Step 3a: assign to a person → list members
bot.action(/^taskAsPerson-(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    const task = pendingTask.get(userId.toString());
    if (!task) { ctx.reply(getText('generalError', lang)); return ctx.answerCbQuery(); }

    const { people } = await getProjectPeopleAndRoles(task.projectId, fetch);
    await ctx.editMessageReplyMarkup(undefined).catch(() => { });
    if (people.length === 0) {
        ctx.reply(getText('noPeopleInProject', lang));
    } else {
        const buttons = people.map(p => [
            Markup.button.callback(p.username, `taskPerson-${p.id}-${userId}`)
        ]);
        buttons.push([Markup.button.callback(getText('cancelEdit', lang), `taskCancel-${userId}`)]);
        ctx.reply(getText('chooseTaskPerson', lang), Markup.inlineKeyboard(buttons).resize());
    }
    await ctx.answerCbQuery();
});

// Step 3b: assign to a role → list roles
bot.action(/^taskAsRole-(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    const task = pendingTask.get(userId.toString());
    if (!task) { ctx.reply(getText('generalError', lang)); return ctx.answerCbQuery(); }

    const { roles } = await getProjectPeopleAndRoles(task.projectId, fetch);
    await ctx.editMessageReplyMarkup(undefined).catch(() => { });
    if (roles.length === 0) {
        ctx.reply(getText('noRolesInProject', lang));
    } else {
        const buttons = roles.map(r => [
            Markup.button.callback(r.roleDescription, `taskRole-${r.id}-${userId}`)
        ]);
        buttons.push([Markup.button.callback(getText('cancelEdit', lang), `taskCancel-${userId}`)]);
        ctx.reply(getText('chooseTaskRole', lang), Markup.inlineKeyboard(buttons).resize());
    }
    await ctx.answerCbQuery();
});

// Step 3c: unassigned → prompt for task name
bot.action(/^taskAsNone-(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    const task = pendingTask.get(userId.toString());
    if (!task) { ctx.reply(getText('generalError', lang)); return ctx.answerCbQuery(); }

    task.assignedUserId = null;
    task.tafkidId = null;
    task.pendingField = 'name';
    await ctx.editMessageReplyMarkup(undefined).catch(() => { });
    ctx.reply(getText('taskNamePrompt', lang), Markup.inlineKeyboard([
        [Markup.button.callback(getText('cancelEdit', lang), `taskCancel-${userId}`)]
    ]).resize());
    await ctx.answerCbQuery();
});

// Person selected → prompt for task name
bot.action(/^taskPerson-(\d+)-(\d+)$/, async (ctx) => {
    const personId = ctx.match[1];
    const userId = ctx.match[2];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    const task = pendingTask.get(userId.toString());
    if (!task) { ctx.reply(getText('generalError', lang)); return ctx.answerCbQuery(); }

    const { people } = await getProjectPeopleAndRoles(task.projectId, fetch);
    const person = people.find(p => p.id == personId);
    task.assignedUserId = personId;
    task.assigneeName = person?.username ?? null;
    task.tafkidId = null;
    task.missionId = null;

    await ctx.editMessageReplyMarkup(undefined).catch(() => { });

    // A task is linked to a mission-in-progress the person performs — show that
    // person's in-progress missions in the project. If they have none, skip
    // straight to the task name.
    const missions = await getMemberMissionsInProject(personId, task.projectId, fetch);
    if (missions.length === 0) {
        task.pendingField = 'name';
        ctx.reply(getText('noMissionsForMember', lang));
        ctx.reply(getText('taskNamePrompt', lang), Markup.inlineKeyboard([
            [Markup.button.callback(getText('cancelEdit', lang), `taskCancel-${userId}`)]
        ]).resize());
    } else {
        const buttons = missions.map(m => [
            Markup.button.callback(m.name, `taskMission-${m.id}-${userId}`)
        ]);
        buttons.push([Markup.button.callback(getText('taskMissionNoneBtn', lang), `taskMission-0-${userId}`)]);
        buttons.push([Markup.button.callback(getText('cancelEdit', lang), `taskCancel-${userId}`)]);
        ctx.reply(getText('chooseTaskMission', lang), Markup.inlineKeyboard(buttons).resize());
    }
    await ctx.answerCbQuery();
});

// Mission-in-progress selected (0 = none) → prompt for task name
bot.action(/^taskMission-(\d+)-(\d+)$/, async (ctx) => {
    const missionId = ctx.match[1];
    const userId = ctx.match[2];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    const task = pendingTask.get(userId.toString());
    if (!task) { ctx.reply(getText('generalError', lang)); return ctx.answerCbQuery(); }

    task.missionId = missionId === '0' ? null : missionId;
    task.pendingField = 'name';

    await ctx.editMessageReplyMarkup(undefined).catch(() => { });
    ctx.reply(getText('taskNamePrompt', lang), Markup.inlineKeyboard([
        [Markup.button.callback(getText('cancelEdit', lang), `taskCancel-${userId}`)]
    ]).resize());
    await ctx.answerCbQuery();
});

// Role selected → prompt for task name
bot.action(/^taskRole-(\d+)-(\d+)$/, async (ctx) => {
    const roleId = ctx.match[1];
    const userId = ctx.match[2];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    const task = pendingTask.get(userId.toString());
    if (!task) { ctx.reply(getText('generalError', lang)); return ctx.answerCbQuery(); }

    const { roles } = await getProjectPeopleAndRoles(task.projectId, fetch);
    const role = roles.find(r => r.id == roleId);
    task.tafkidId = roleId;
    task.roleName = role?.roleDescription ?? null;
    task.assignedUserId = null;
    task.pendingField = 'name';

    await ctx.editMessageReplyMarkup(undefined).catch(() => { });
    ctx.reply(getText('taskNamePrompt', lang), Markup.inlineKeyboard([
        [Markup.button.callback(getText('cancelEdit', lang), `taskCancel-${userId}`)]
    ]).resize());
    await ctx.answerCbQuery();
});

// Cancel task creation
bot.action(/^taskCancel-(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    pendingTask.delete(userId.toString());
    await ctx.answerCbQuery(getText('cancelledToast', lang));
    await ctx.editMessageText(getText('taskCancelled', lang)).catch(() => { });
});

// --- Text Message Handler (Using global fetch for helpers) ---
// ─── Meeting Availability Handlers ─────────────────────────────────────────
//
// Marking yourself available for a meeting (or cancelling it) goes through the
// same `toggleOnline` action the site's meeting page uses, so the meeting's own
// `available` flag stays in sync and the other participants are notified.
// Each button carries the status it sets rather than "flip", so tapping an old
// list twice cannot undo itself.

function buildMeetingAvailKeyboard(meetings, uid, lang) {
    const rows = meetings.map(m => [
        Markup.button.callback(
            `${m.available ? '✅' : '💤'} ${m.name} (${m.onlineCount}/${m.total})`,
            `meetTgl-${m.id}-${m.available ? 0 : 1}-${uid}`
        )
    ]);
    if (meetings.length > 1) {
        rows.push([Markup.button.callback(getText('meetAvailAllOnBtn', lang), `meetAll-1-${uid}`)]);
        rows.push([Markup.button.callback(getText('meetAvailAllOffBtn', lang), `meetAll-0-${uid}`)]);
    }
    rows.push([Markup.button.url(getText('meetAvailOpenSite', lang), 'https://meetings.1lev1.com/meeting')]);
    return Markup.inlineKeyboard(rows);
}

async function showMeetingAvailList(ctx, uid, lang, fetch, { edit = false } = {}) {
    const meetings = await getUserMeetings(uid, fetch);
    if (meetings.length === 0) {
        if (edit) await ctx.editMessageReplyMarkup(undefined).catch(() => { });
        await ctx.reply(getText('meetAvailNone', lang));
        return meetings;
    }
    const text = getText('meetAvailTitle', lang);
    const keyboard = buildMeetingAvailKeyboard(meetings, uid, lang);
    if (edit) {
        // Telegram refuses an edit that changes nothing; the list is still right.
        await ctx.editMessageText(text, keyboard).catch(() => { });
    } else {
        await ctx.reply(text, keyboard);
    }
    return meetings;
}

async function setMeetingAvailability(uid, status, meetingId, lang, fetch) {
    const params = { status };
    if (meetingId) params.meetingId = meetingId;
    return actionService.executeAction('toggleOnline', params, {
        userId: String(uid),
        jwt: normalizeAdminToken(env.ADMINMONTHER),
        lang,
        fetch
    });
}

// Step 1: list the member's meetings with their current availability
bot.action(/^meetAvail-(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    await ctx.answerCbQuery();
    try {
        await ctx.editMessageReplyMarkup(undefined).catch(() => { });
        await showMeetingAvailList(ctx, userId, lang, fetch);
    } catch (error) {
        console.error('meetAvail error:', error);
        ctx.reply(getText('generalError', lang));
    }
});

// Step 2a: mark / cancel availability for one meeting
bot.action(/^meetTgl-(\d+)-([01])-(\d+)$/, async (ctx) => {
    const meetingId = ctx.match[1];
    const status = ctx.match[2] === '1';
    const userId = ctx.match[3];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    await ctx.answerCbQuery();
    try {
        const result = await setMeetingAvailability(userId, status, meetingId, lang, fetch);
        if (!result?.success) {
            console.error('meetTgl action error:', result?.error);
            await ctx.reply(getText('meetAvailError', lang));
            return;
        }
        const meetings = await showMeetingAvailList(ctx, userId, lang, fetch, { edit: true });
        const meeting = meetings.find(m => m.id === meetingId);
        const name = meeting?.name || `#${meetingId}`;
        await ctx.reply(getText(status ? 'meetAvailOn' : 'meetAvailOff', lang, { name }));
        if (status && meeting && meeting.total > 1 && meeting.onlineCount === meeting.total) {
            await ctx.reply(getText('meetAvailReady', lang, { name }));
        }
    } catch (error) {
        console.error('meetTgl error:', error);
        ctx.reply(getText('meetAvailError', lang));
    }
});

// Step 2b: mark / cancel availability for all the member's meetings at once
bot.action(/^meetAll-([01])-(\d+)$/, async (ctx) => {
    const status = ctx.match[1] === '1';
    const userId = ctx.match[2];
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.update.fetch;
    if (!userInfo || userInfo.uid != userId) return ctx.answerCbQuery(getText('unauthorized', lang));

    await ctx.answerCbQuery();
    try {
        const result = await setMeetingAvailability(userId, status, null, lang, fetch);
        if (!result?.success) {
            console.error('meetAll action error:', result?.error);
            await ctx.reply(getText('meetAvailError', lang));
            return;
        }
        const meetings = await showMeetingAvailList(ctx, userId, lang, fetch, { edit: true });
        await ctx.reply(getText(status ? 'meetAvailAllOn' : 'meetAvailAllOff', lang));
        if (status) {
            for (const m of meetings) {
                if (m.total > 1 && m.onlineCount === m.total) {
                    await ctx.reply(getText('meetAvailReady', lang, { name: m.name }));
                }
            }
        }
    } catch (error) {
        console.error('meetAll error:', error);
        ctx.reply(getText('meetAvailError', lang));
    }
});

bot.on('text', async (ctx) => {
    const userText = ctx.message.text;
    const userInfo = ctx.state.userInfo;
    const lang = ctx.state.lang;
    const fetch = ctx.update.fetch;

    if (userText.startsWith('/')) return;

    if (userInfo) {
        // Handle pending datetime input for interval editing
        const uid = userInfo.uid.toString();
        if (pendingEdits.has(uid)) {
            if (isCancelWord(userText)) {
                pendingEdits.delete(uid);
                await ctx.reply(getText('editCancelled', lang));
                return;
            }

            const newDateTime = parseUserDateTime(userText);
            if (!newDateTime) {
                await ctx.reply(getText('invalidDateTime', lang));
                return;
            }

            const pending = pendingEdits.get(uid);
            const currentInterval = pending.intervals[pending.index];
            const oldLap = { start: currentInterval.start, stop: currentInterval.stop };
            const newLap = pending.field === 'start'
                ? { start: newDateTime, stop: currentInterval.stop }
                : { start: currentInterval.start, stop: newDateTime };

            if (newLap.stop && new Date(newLap.stop) <= new Date(newLap.start)) {
                await ctx.reply(getText('endBeforeStart', lang));
                return;
            }

            const timerObj = {
                id: pending.timerId,
                attributes: { timers: pending.intervals, totalHours: pending.totalHours }
            };

            try {
                const result = await updateTimer(
                    timerObj, 'timers',
                    { oldLap, newLap, index: pending.index, isSer: true },
                    fetch, pending.projectId, userInfo.uid
                );
                pendingEdits.delete(uid);
                if (result) {
                    await ctx.reply(getText('intervalUpdated', lang));
                } else {
                    await ctx.reply(getText('aiActionFailed', lang));
                }
            } catch (error) {
                console.error('Error updating timer interval from text:', error);
                pendingEdits.delete(uid);
                await ctx.reply(getText('aiActionFailed', lang));
            }
            return;
        }

        // Handle the note / link a member is attaching to a timer save
        if (pendingTimerSave.has(uid) && pendingTimerSave.get(uid).pendingField) {
            const state = pendingTimerSave.get(uid);
            const field = state.pendingField;
            const trimmed = userText.trim();

            if (isCancelWord(trimmed)) {
                // Only the field is abandoned, not the save: the card comes
                // back so the member can still file the hours.
                state.pendingField = null;
                await showTimerSaveCard(ctx, state, uid, lang);
                return;
            }

            if (field === 'note') {
                state.note = (trimmed === '-') ? '' : trimmed.slice(0, TIMER_NOTE_MAX);
            } else {
                const link = normalizeSaveLink(trimmed);
                if (!link) {
                    await ctx.reply(getText('timerSaveInvalidLink', lang));
                    return;
                }
                // normalizeSaveLinks is the one that knows the column's width:
                // if it refuses the new list, the link does not fit and the
                // member is told instead of losing it silently.
                const next = normalizeSaveLinks([...state.links, link]);
                if (!next.includes(link)) {
                    await ctx.reply(getText('timerSaveLinksFull', lang, { count: SAVE_LINKS_MAX }));
                    return;
                }
                state.links = next;
            }

            state.pendingField = null;
            await showTimerSaveCard(ctx, state, uid, lang);
            return;
        }

        // Handle pending sale field input
        if (pendingSale.has(uid) && pendingSale.get(uid).pendingField) {
            const sale = pendingSale.get(uid);
            const field = sale.pendingField;

            if (field === 'quantity') {
                const qty = parseInt(userText.trim(), 10);
                const maxQty = sale.quant === -1 ? Infinity : sale.quant;
                if (!Number.isInteger(qty) || qty <= 0 || qty > maxQty) {
                    await ctx.reply(getText('invalidSaleQty', lang));
                    return;
                }
                sale.quantity = qty;
            } else if (field === 'each') {
                const price = parseFloat(userText.trim().replace(',', '.'));
                if (isNaN(price) || price < 0) {
                    await ctx.reply(getText('invalidSalePrice', lang));
                    return;
                }
                sale.each = price;
            } else if (field === 'date') {
                const iso = parseSaleDate(userText);
                if (!iso) {
                    await ctx.reply(getText('invalidSaleDate', lang));
                    return;
                }
                sale.saleDate = iso;
            } else if (field === 'note') {
                const trimmed = userText.trim();
                sale.note = (trimmed === '-' || trimmed.toLowerCase() === 'none') ? '' : trimmed.slice(0, 500);
            } else if (field === 'startDate') {
                const iso = parseSaleDate(userText);
                if (!iso) {
                    await ctx.reply(getText('invalidSaleDate', lang));
                    return;
                }
                sale.startDate = iso;
            } else if (field === 'finishDate') {
                const trimmed = userText.trim();
                if (trimmed === '-' || NONE_WORDS.includes(trimmed.toLowerCase())) {
                    sale.finishDate = null;
                } else {
                    const iso = parseSaleDate(trimmed);
                    if (!iso) {
                        await ctx.reply(getText('invalidSaleDate', lang));
                        return;
                    }
                    sale.finishDate = iso;
                }
            }

            sale.pendingField = null;
            const msg = await ctx.reply(formatSaleCard(sale, lang), {
                parse_mode: 'Markdown',
                ...buildSaleCardKeyboard(sale, uid, lang)
            });
            sale.messageId = msg.message_id;
            return;
        }

        // Handle pending task name input → create the task
        if (pendingTask.has(uid) && pendingTask.get(uid).pendingField === 'name') {
            if (isCancelWord(userText)) {
                pendingTask.delete(uid);
                await ctx.reply(getText('taskCancelled', lang));
                return;
            }
            const name = userText.trim();
            if (!name) {
                await ctx.reply(getText('taskNamePrompt', lang));
                return;
            }
            const task = pendingTask.get(uid);
            task.name = name.slice(0, 200);
            task.pendingField = null;
            await finalizeTask(ctx, uid, lang, fetch);
            return;
        }

        const aiResponse = await understandUserIntent(userText, userInfo.uid, lang, fetch);

        switch (aiResponse.intent) {
            case 'start_timer':
                if (aiResponse.parameters?.missionId) {
                    const missionId = aiResponse.parameters.missionId;
                    const missionName = aiResponse.parameters.missionName;
                    try {
                        const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, true, fetch);
                        const activeTimer = missionData?.data?.mesimabetahalich?.data?.attributes?.activeTimer;
                        const timerId = activeTimer?.data?.id || 0;
                        const projectId = missionData?.data?.mesimabetahalich?.data?.attributes?.project?.data?.id;
                        if (!projectId) throw new Error(`Project ID not found for mission ${missionId}`);
                        const res = await startTimer(activeTimer, missionId, userInfo.uid, projectId, fetch, timerId, true, { via: 'telegram' });
                        if (res) { ctx.reply(getText('timerStartedMission', lang, { missionName })); }
                        else { throw new Error("Start failed via AI"); }
                    } catch (error) {
                        console.error(`AI Error starting timer:`, error);
                        ctx.reply(getText('aiActionFailed', lang));
                    }
                } else {
                    // אם יש משימות רלוונטיות, הצג רק אותן
                    if (aiResponse.parameters?.relevantMissions?.length > 0) {
                        const relevantMissions = await getUserMissions(userInfo.uid, fetch, true);
                        const filteredMissions = relevantMissions.filter(m =>
                            aiResponse.parameters.relevantMissions.includes(m.id)
                        );
                        const buttons = filteredMissions.map(item => [
                            Markup.button.callback(
                                `${item.name} ⏲️ ${item.projectName}`,
                                `startTimer-${item.id}-${userInfo.uid}`
                            )
                        ]);
                        ctx.reply(getText('chooseStart', lang), Markup.inlineKeyboard(buttons).resize());
                    } else {
                        // אם אין משימות רלוונטיות, הצג את כל המשימות
                        const startableMissions = await getUserMissions(userInfo.uid, fetch, true);
                        if (startableMissions.length > 0) {
                            const buttons = startableMissions.map(item => [
                                Markup.button.callback(
                                    `${item.name} ⏲️ ${item.projectName}`,
                                    `startTimer-${item.id}-${userInfo.uid}`
                                )
                            ]);
                            ctx.reply(getText('askWhichTaskToStart', lang), Markup.inlineKeyboard(buttons).resize());
                        } else {
                            ctx.reply(getText('noTasksToStart', lang));
                        }
                    }
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
                        const projectId = missionData?.data?.mesimabetahalich?.data?.attributes?.project?.data?.id;
                        const stoppedTimer = await stopTimer(activeTimerData, fetch, true, projectId, userInfo.uid, { via: 'telegram' });
                        const timerAttributes = stoppedTimer?.updateTimer?.data?.attributes || stoppedTimer?.attributes;

                        if (timerAttributes && !timerAttributes.isActive) {
                            ctx.reply(getText('timerStopped', lang), Markup.inlineKeyboard([
                                [Markup.button.url(getText('editTimerBtn', lang), `https://1lev1.com/timers?editTime=${missionId}`)],
                                [Markup.button.callback(getText('editIntervalsBtn', lang), `editTimerIntervals-${missionId}-${userInfo.uid}-${activeTimerData.id}`)],
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
                    // אם יש משימות רלוונטיות, הצג רק אותן
                    if (aiResponse.parameters?.relevantMissions?.length > 0) {
                        const filteredMissions = startableMissions.filter(m =>
                            aiResponse.parameters.relevantMissions.includes(m.id)
                        );
                        const buttons = filteredMissions.map(item => [
                            Markup.button.callback(
                                `${item.name} ⏲️ ${item.projectName}`,
                                `startTimer-${item.id}-${userInfo.uid}`
                            )
                        ]);
                        ctx.reply(getText('chooseStart', lang), Markup.inlineKeyboard(buttons).resize());
                    } else {
                        // אם אין משימות רלוונטיות, הצג את כל המשימות
                        const buttons = startableMissions.map(item => [
                            Markup.button.callback(
                                `${item.name} ⏲️ ${item.projectName}`,
                                `startTimer-${item.id}-${userInfo.uid}`
                            )
                        ]);
                        ctx.reply(getText('askWhichTaskToStart', lang), Markup.inlineKeyboard(buttons).resize());
                    }
                } else {
                    ctx.reply(getText('noTasksToStart', lang));
                }
                break;

            case 'clarify_stop':
                const stoppableMissions = await getUserMissions(userInfo.uid, fetch, false, true);
                if (stoppableMissions.length > 0) {
                    const buttons = stoppableMissions.map(item => [Markup.button.callback(`${item.name} ⏲️ ${item.projectName}`, `stopTimer-${item.id}-${userInfo.uid}`)]);
                    ctx.reply(getText('askWhichTaskToStop', lang), Markup.inlineKeyboard(buttons).resize());
                } else { ctx.reply(getText('noTasksToStop', lang)); }
                break;

            case 'meeting_availability':
                await showMeetingAvailList(ctx, userInfo.uid, lang, fetch);
                break;

            case 'ask_help':
                const helpAnswer = await answerUnregisteredUserQuery(userText, lang);
                ctx.reply(helpAnswer);
                ctx.reply(
                    getText('helpText', lang),
                    Markup.inlineKeyboard([
                        [Markup.button.url(getText('login', lang), 'https://1lev1.com/login')],
                        [Markup.button.callback(getText('startTimerBtn', lang), `timerStart-${userInfo.uid}`)],
                        [Markup.button.callback(getText('stopTimerBtn', lang), `timerStop-${userInfo.uid}`)],
                        [Markup.button.callback(getText('meetAvailBtn', lang), `meetAvail-${userInfo.uid}`)]
                    ]).resize()
                );
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

/**
 * Update ids already handled, newest last.
 *
 * Telegram redelivers an update whenever the webhook does not answer 200 in
 * time or answers an error, and every redelivery re-ran the handler from
 * scratch. On a timer button that meant two `stopTimer` runs racing each other:
 * both read the timer before either wrote, both passed the `isActive` check,
 * and both wrote the whole interval list back.
 *
 * The set is per-instance, so it cannot be the only defence (a redelivery that
 * lands on a second instance still gets through, and the timer operations are
 * idempotent now for exactly that reason) — but it stops the common case, where
 * the retry comes back to the process that was slow.
 */
const handledUpdates = new Set();
const HANDLED_UPDATES_MAX = 1000;

function alreadyHandled(updateId) {
    if (updateId == null) return false;
    if (handledUpdates.has(updateId)) return true;
    handledUpdates.add(updateId);
    // A Set iterates in insertion order, so the oldest ids drop out first.
    while (handledUpdates.size > HANDLED_UPDATES_MAX) {
        handledUpdates.delete(handledUpdates.values().next().value);
    }
    return false;
}

// --- SvelteKit POST Endpoint ---
export async function POST({ request, fetch: svelteFetch }) {
    // Only Telegram knows the secret_token given to setWebhook. Without this
    // check anyone could post an update naming a member's chat id and the bot
    // would act as that member (§14.6). Checked before the body is even read.
    const auth = checkTelegramWebhook(request.headers.get('X-Telegram-Bot-Api-Secret-Token'));
    if (!auth.ok) {
        console.warn('[telegram] rejected an update without a valid X-Telegram-Bot-Api-Secret-Token');
        return new Response('', { status: 401 });
    }

    try {
        const data = await request.json();
        // console.log("Incoming Telegram Update:", JSON.stringify(data, null, 2));

        if (alreadyHandled(data?.update_id)) {
            console.warn('[telegram] update', data.update_id, 'was already handled — ignoring the redelivery');
            return new Response('', { status: 200 });
        }

        await fetchUserData(svelteFetch);

        // Add fetch to context before handling update
        data.fetch = svelteFetch;

        // Pass svelteFetch to bot.handleUpdate
        await bot.handleUpdate(data);

        return new Response('', { status: 200 });
    } catch (error) {
        console.error('--- ERROR in SvelteKit POST Handler ---', error, error.stack);
        // Answer 200 even on failure. A 500 makes Telegram send the same update
        // again, which re-runs whatever half-finished work threw — and the
        // handlers already report their own failures to the member in chat.
        // There is nothing a redelivery can fix that a second tap cannot.
        return new Response('', { status: 200 });
    }
}

// --- Fallback Error Handler ---
bot.catch(async (err, ctx) => {
    console.error(`Telegraf Error caught for update type ${ctx.updateType}:`, err);
    const lang = ctx?.state?.lang || 'he';
    if (ctx.updateType !== 'callback_query' || !ctx.answered) {
        await ctx.reply(getText('generalError', lang)).catch(e => console.error("Error sending error reply:", e));
    }
});
