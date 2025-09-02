import { json } from '@sveltejs/kit';
import { startTimer, stopTimer } from '$lib/func/timers.js';
import { sendToSer } from '$lib/send/sendToSer.js';
import { SITE_CONTEXT, createGeminiClient } from '$lib/bot/context.js';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

const geminiModel = createGeminiClient(geminiApiKey);

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
        projectId: item.attributes.project?.data?.id || null,
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

async function getUserProjects(uid, fetchInstance) {
    try {
        const res = await sendToSer({ uid: uid }, "64getUserProjectList", uid, 0, false, fetchInstance);
        // NOTE: The response structure is an assumption based on the existing code.
        // It might need adjustment if the actual API response is different.
        const projects = res?.data?.projects?.data ?? [];
        return projects.map(item => ({
            id: item.id,
            name: item.attributes.projectName,
        }));
    } catch (error) {
        console.error(`getUserProjects Error for user ${uid}:`, error);
        return [];
    }
}

async function understandUserIntent(userText, uid, lang, fetchInstance) {
    const startableMissions = await getUserMissions(uid, fetchInstance, true);
    const stoppableMissions = await getUserMissions(uid, fetchInstance, false, true);
    const userProjects = await getUserProjects(uid, fetchInstance);

    const missionListText = startableMissions.map(m => `- "${m.name}" (Mission ID: ${m.id}, Project ID: ${m.projectId})`).join('\n');
    const activeTimersText = stoppableMissions.map(m => `- "${m.name}" (Mission ID: ${m.id}, Project ID: ${m.projectId})`).join('\n');
    const projectListText = userProjects.map(p => `- "${p.name}" (Project ID: ${p.id})`).join('\n');

    const sitePages = `
- Home: /
- About: /about
- FAQ: /faq
- Login: /login
- products : /gift/[id]
- Convention: /convention || in hebrew /hascama || in arabic /aitifaqia
- users Profile: /user/[id]
- Public page of a Project: /project/[id]
- manage my projects (registered users only): /moach
- manage specific project (registered users only) require to pass the id of the project to the idPr store: /moach 
- user profile (registered users only): /me
- main page nutification suggestions vots (registered users only): /lev
- specific mission availiable for apply: /availableMission/[id]
- all the availiable missions to apply for: /availableMission
- all my timers (registered users only): /timers
- my calendar that shows all my done timers: /myCalendar
- create new project: /me?action=createproject
`;

    const prompt = `
You are a helpful assistant for the 1lev1 platform bot. Your goal is to understand the user's request. The user might want to manage timers for their missions or navigate to a page on the site.

User ID: ${uid}
User Language: ${lang}

Available actions:
1.  'start_timer': User wants to start a timer for a specific mission. Requires 'missionId' and 'missionName'.
2.  'stop_timer': User wants to stop an active timer. Requires 'missionId'.
3.  'navigate': User wants to go to a specific page. Requires 'url' and 'pageName' if page is moach and if user wants specific project then also 'idPr'.
4.  'ask_help': User is asking for general help.
5.  'clarify_start': User wants to start a timer but didn't specify which one, and multiple options exist.
6.  'clarify_stop': User wants to stop a timer but didn't specify which one, and multiple options exist.
7.  'unknown': The user's intent is unclear or unrelated.

Missions available to START a timer for:
${missionListText || "None"}

Missions with currently ACTIVE timers (can be stopped):
${activeTimersText || "None"}

User's Projects:
${projectListText || "None"}

Available pages for navigation:
${sitePages}

User request: "${userText}"

Analyze the user request considering the available missions, active timers, user's projects, and site pages.
If the user wants to go to one of their projects, the intent is 'navigate', the url is '/moach', and you must include the 'idPr' parameter with the project's ID.
Respond ONLY with a JSON object containing the identified 'intent' and necessary 'parameters'.

Examples:
- User: "start timer for Design UI", Mission "Design UI" (ID 123) exists -> {"intent": "start_timer", "parameters": {"missionId": "123", "missionName": "Design UI"}}
- User: "stop the timer for API integration", Mission "API integration" (ID 456) has active timer -> {"intent": "stop_timer", "parameters": {"missionId": "456"}}
- User: "take me to the about page" -> {"intent": "navigate", "parameters": {"url": "/about", "pageName": "About"}}
- User: "I want to see my profile" -> {"intent": "navigate", "parameters": {"url": "/me", "pageName": "My Profile"}}
- User: "open my project dashboard" -> {"intent": "navigate", "parameters": {"url": "/moach", "pageName": "Project Management"}}
- User: "take me to my project 'New Website'", Project "New Website" (ID 789) exists -> {"intent": "navigate", "parameters": {"url": "/moach", "pageName": "New Website", "idPr": "789"}}
- User: "start a timer", Multiple startable missions exist -> {"intent": "clarify_start"}
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

      case 'navigate':
        if (aiResponse.parameters?.url) {
          const { url, pageName, idPr } = aiResponse.parameters;
          return json({ 
            reply: `Navigating you to the ${pageName} page.`,
            navigation: { url, idPr } 
          });
        }
        return json({ reply: "I'm not sure where you want to go. Can you be more specific?" });

      default:
        return json({ reply: "Sorry, I couldn't understand that. Please try rephrasing." });
    }
  } catch (error) {
    console.error('Bot API Error:', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
