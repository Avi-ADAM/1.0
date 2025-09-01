import { json } from '@sveltejs/kit';
import { startTimer, stopTimer } from '$lib/func/timers.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sendToSer } from '$lib/send/sendToSer.js';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!geminiApiKey) throw new Error("Gemini API Key not found!");

const genAI = new GoogleGenerativeAI(geminiApiKey);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const SITE_CONTEXT = `
שם האתר: 1💗1 (1lev1.com)
תיאור: פלטפורמה דיגיטלית חדשנית ליצירה, ניהול והגשמה של פרויקטים בשיתוף פעולה ובהסכמה מלאה. מאפשרת ניהול קבוצות ("רקמות") מבוזר תוך שמירה על עצמאות.
מטרות: שותפויות מבוססות הסכמה, ניהול משאבים ומשימות מבוזר, חלוקת רווחים דינמית, חיבור בין אנשים.
תכונות: קבלת החלטות פה-אחד, פנקס דיגיטלי מבוזר, כלי ניהול (גרפים, גאנט), מערכת הצבעות, שיתוף חפצים, חלוקת רווחים דינמית.
יתרונות: חיבור לרקמות מתאימות, עצמאות אישית בעבודה משותפת, הקמת שותפות קלה, השתתפות במערכת מבוססת הסכמה.
דרישות הרשמה: הסכמה ל"אמנת החירות העולמית" שתוצג באתר.
חזון: יצירת עולם טוב יותר באמצעות שיתוף פעולה מבוסס ערכים, כישורים והסכמה.
`;

async function answerUnregisteredUserQuery(userText, lang = 'he') {
    const prompt = `
You are a helpful assistant for the 1lev1.com platform. A user is asking a question.
Your goal is to answer the user's question based *only* on the provided context about the 1lev1 platform.
If the question is answerable from the context, provide a concise and helpful answer in the user's language (${lang}).
If the question cannot be answered from the context or is unrelated to 1lev1, politely state that you can only answer questions about the platform based on the provided information.
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
        console.error("Gemini Q&A Error:", error);
        return 'Sorry, I had trouble understanding that.';
    }
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

async function understandUserIntent(userText, uid, lang, fetchInstance) {
    const startableMissions = await getUserMissions(uid, fetchInstance, true);
    const stoppableMissions = await getUserMissions(uid, fetchInstance, false, true);

    const missionListText = startableMissions.map(m => `- "${m.name}" (ID: ${m.id})`).join('\n');
    const activeTimersText = stoppableMissions.map(m => `- "${m.name}" (ID: ${m.id})`).join('\n');

    const prompt = `
You are a helpful assistant for the 1lev1 platform bot. Your goal is to understand the user's request regarding starting or stopping timers for their missions.

User ID: ${uid}
User Language: ${lang}

Available actions:
1.  'start_timer': User wants to start a timer for a specific mission. Requires 'missionId' and 'missionName'.
2.  'stop_timer': User wants to stop an active timer. Requires 'missionId'.
3.  'ask_help': User is asking for general help.
4.  'clarify_start': User wants to start a timer but didn't specify which one, and multiple options exist.
5.  'clarify_stop': User wants to stop a timer but didn't specify which one, and multiple options exist.
6.  'unknown': The user's intent is unclear or unrelated.

Missions available to START a timer for:
${missionListText || "None"}

Missions with currently ACTIVE timers (can be stopped):
${activeTimersText || "None"}

User request: "${userText}"

Analyze the user request considering the available missions and active timers.
Respond ONLY with a JSON object containing the identified 'intent' and necessary 'parameters' (like 'missionId').

Examples:
- User: "start timer for Design UI", Mission "Design UI" (ID 123) exists -> {"intent": "start_timer", "parameters": {"missionId": "123", "missionName": "Design UI"}}
- User: "start design", Multiple design-related missions exist -> {"intent": "clarify_start"}
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
        console.error("Gemini Timer Intent Error:", error);
        return { intent: 'error', details: error.message };
    }
}


export async function POST({ request, fetch, cookies }) {
  const { action, payload, user } = await request.json();

  try {
    if (action === 'ask') {
      const reply = await answerUnregisteredUserQuery(payload.text);
      return json({ reply });
    }
    console.log('Bot API Request:', { action, payload, user });
    if (!user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const aiResponse = await understandUserIntent(payload.text, user.id, user.lang || 'he', fetch);

    switch (aiResponse.intent) {
      case 'start_timer':
        if (aiResponse.parameters?.missionId) {
          const { missionId, missionName } = aiResponse.parameters;
          const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, false, fetch);
          const activeTimer = missionData?.data?.mesimabetahalich?.data?.attributes?.activeTimer;
          const timerId = activeTimer?.data?.id || 0;
          const projectId = missionData?.data?.mesimabetahalich?.data?.attributes?.project?.data?.id;
          if (!projectId) throw new Error(`Project ID not found for mission ${missionId}`);
          await startTimer(activeTimer, missionId, user.id, projectId, timerId, false, fetch);
          return json({ reply: `Timer started for mission "${missionName}".` });
        }
        return json({ reply: "Which mission would you like to start a timer for?" });

      case 'stop_timer':
        if (aiResponse.parameters?.missionId) {
          const { missionId } = aiResponse.parameters;
          const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, false, fetch);
          const activeTimerData = missionData?.data?.mesimabetahalich?.data?.attributes?.activeTimer?.data;
          if (!activeTimerData || !activeTimerData.attributes.isActive) {
            return json({ reply: "No active timer found for this mission." });
          }
          await stopTimer(activeTimerData, fetch, false);
          return json({ reply: "Timer stopped." });
        }
        return json({ reply: "Which mission's timer would you like to stop?" });

      case 'clarify_start':
        return json({ reply: "Which mission would you like to start a timer for? Please be more specific." });

      case 'clarify_stop':
        return json({ reply: "Which mission's timer would you like to stop? Please be more specific." });

      default:
        return json({ reply: "Sorry, I couldn't understand that. Please try rephrasing." });
    }
  } catch (error) {
    console.error('Bot API Error:', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
