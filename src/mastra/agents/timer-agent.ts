import { Agent } from '@mastra/core/agent';
import {
  createGoogleModel,
  createGroqModel,
  createNvidiaModel,
  hasGroqModelConfig,
  hasNvidiaModelConfig,
  hasGoogleModelConfig
} from '../lib/createModel';
import {
  getMissionDetailsTool,
  listUserMissionsTool,
  getMissionStatsTool,
  getActiveTimersTool,
  getTimerHistoryTool
} from '../tools/missionTimers';
import { timerActionTool } from '../tools/timerActionTool';
import { findUserProjectsTool } from '../tools/findUserProjectsTool';
import { getChatHistoryTool } from '../tools/getChatHistoryTool';

function buildSystemPrompt(language: string, userId: string) {
  if (language === 'he') {
    return `
אתה סוכן טיימרים ייעודי עבור 1lev1.com.

מזהה משתמש: ${userId}
שפה: עברית

כללים חשובים:
- תמיד ענה בעברית.
- לעולם אל תבקש Mission ID מהמשתמש.
- תמיד כתוב תשובה אנושית אחרי שימוש ב-tool.
- השתמש רק ב-timerActionTool כדי להתחיל או לעצור טיימר.
- אל תשתמש ב-startTimerWithNotesTool או stopTimerWithSummaryTool.
- אם המשתמש מבקש "לעצור את הטיימר הנוכחי", אפשר להשתמש ישירות ב-timerActionTool עם action="stop".
- אם צריך להבין איזה טיימר פעיל, השתמש ב-getActiveTimersTool.
- אם המשתמש מבקש להתחיל טיימר למשימה מסוימת:
  1. השתמש ב-listUserMissionsTool כדי למצוא את המשימה.
  2. אם יש יותר מהתאמה אחת, אסור לבחור עבור המשתמש ואסור להפעיל טיימר.
  3. במקרה של כמה התאמות, החזר תשובה קצרה שמבקשת לבחור משימה מתוך הרשימה שה-UI יציג.
  4. הפעל timerActionTool רק אם יש התאמה יחידה, או אם המשתמש בחר מפורשות משימה ספציפית מתוך הרשימה.
- אם המשתמש מבקש לעצור טיימר:
  1. אם ברור שמדובר בטיימר הנוכחי, השתמש ב-timerActionTool עם action="stop".
  2. אם יש חוסר בהירות, השתמש ב-getActiveTimersTool.
  3. אם יש טיימר פעיל אחד בלבד, עצור אותו עם timerActionTool.
- לשאלות על היסטוריה, סטטוס וסטטיסטיקות השתמש ב-getTimerHistoryTool, getActiveTimersTool, getMissionStatsTool.
`;
  }

  return `
You are a dedicated timer agent for 1lev1.com.

User ID: ${userId}
Language: English

Critical rules:
- Always respond in English.
- Never ask the user for a mission ID.
- Always provide a human-readable reply after using any tool.
- Use only timerActionTool to start or stop timers.
- Do not use startTimerWithNotesTool or stopTimerWithSummaryTool.
- If the user asks to stop the current timer, you can call timerActionTool with action="stop".
- Use getActiveTimersTool when you need to inspect or explain active timers.
- For starting a timer for a specific mission:
  1. Use listUserMissionsTool to find the mission.
  2. If more than one mission matches, do not guess and do not start any timer.
  3. When multiple missions match, return a short reply asking the user to choose from the list shown in the UI.
  4. Call timerActionTool only when there is exactly one match, or after the user explicitly picked a specific mission from the list.
- For stopping a timer:
  1. If the request clearly targets the current timer, call timerActionTool with action="stop".
  2. If it is ambiguous, use getActiveTimersTool first.
  3. If exactly one active timer exists, stop it with timerActionTool.
- For history, active status, or statistics questions, use getTimerHistoryTool, getActiveTimersTool, and getMissionStatsTool.
`;
}

export function createTimerAgent(
  apiKey: string,
  language: string = 'he',
  userId: string
) {
  return new Agent({
    id: 'AdvancedTimerAgent',
    name: 'AdvancedTimerAgent',
    instructions: buildSystemPrompt(language, userId),
    model: (() => {
      const models = [];
      
      // Priority order: Google Flash (thinkingBudget=0) > Google Flash Lite > Groq > NVIDIA
      if (hasGoogleModelConfig(apiKey)) {
        models.push({ model: createGoogleModel(apiKey, 'gemini-flash-latest', { thinkingBudget: 0 }), maxRetries: 2 });
        models.push({ model: createGoogleModel(apiKey, 'gemini-flash-lite-latest'), maxRetries: 2 });
      }
      if (hasGroqModelConfig()) {
        models.push({ model: createGroqModel(), maxRetries: 2 });
      }
      if (hasNvidiaModelConfig(apiKey)) {
        models.push({ model: createNvidiaModel(apiKey), maxRetries: 1 });
      }
      
      return models.length > 0 ? models : [{ model: createGoogleModel(apiKey, 'gemini-flash-latest', { thinkingBudget: 0 }), maxRetries: 2 }];
    })(),
    tools: {
      getMissionDetailsTool,
      listUserMissionsTool,
      getMissionStatsTool,
      getActiveTimersTool,
      getTimerHistoryTool,
      timerActionTool,
      findUserProjectsTool,
      getChatHistoryTool
    }
  });
}
