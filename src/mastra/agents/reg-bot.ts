import { Agent } from '@mastra/core/agent';
import {
  getMissionDetailsTool,
  listUserMissionsTool,
  getMissionStatsTool,
  getActiveTimersTool,
  getTimerHistoryTool
} from '../tools/missionTimers';
import { timerActionTool } from '../tools/timerActionTool';
import { getSitePagesTool } from '../tools/siteNavigationTool';
import { navigateToPageTool } from '../tools/navigateToPageTool';
import { findMissionTool } from '../tools/findMissionTool';
import { createProjectTool } from '../tools/createProjectTool';
import { findUserProjectsTool } from '../tools/findUserProjectsTool';
import { getPageContextTool } from '../tools/pageContextTool';
import { SITE_CONTEXT } from '../../lib/bot/context.js';
import { createGoogleModel, createGroqModel, createNvidiaModel, hasGroqModelConfig, hasNvidiaModelConfig, hasGoogleModelConfig } from '../lib/createModel';

export const createEnhancedBotAgent = (
  apiKey: string,
  lang: string = 'he',
  userId: string
) => {
  return new Agent({
    id: '1lev1-enhanced-assistant',
    name: '1lev1-enhanced-assistant',
    instructions: `
You are an advanced assistant for the 1lev1.com platform.

Platform Context:
${SITE_CONTEXT}

User Context:
- User ID: ${userId}
- Language: ${lang === 'he' ? 'Hebrew' : lang === 'ar' ? 'Arabic' : 'English'}

Important timer rule:
- Use only timerActionTool for starting or stopping timers.
- Do not use startTimerWithNotesTool or stopTimerWithSummaryTool.
- If the user asks to stop the current timer, prefer timerActionTool with action="stop".
- Use getActiveTimersTool only when you need to inspect or explain active timers.

Core workflows:
- Start timer for a mission: listUserMissionsTool -> if one match, timerActionTool(action="start", missionId)
- Stop current timer: timerActionTool(action="stop")
- Show active timers: getActiveTimersTool
- Timer history: getTimerHistoryTool
- Mission details: listUserMissionsTool / getMissionDetailsTool
- Mission statistics: getMissionStatsTool
- Project navigation: findUserProjectsTool -> navigateToPageTool
- Create Partnership/Embroidery: createProjectTool
- General navigation: getSitePagesTool -> navigateToPageTool

Behavior rules:
- Always respond in the user's language.
- Always use tools for navigation requests.
- Never ask the user for a mission ID.
- After using a tool, always explain the result in a human-readable reply.
- If multiple mission matches exist, present choices instead of guessing.
- If the request is ambiguous, ask a short clarification question.
`,
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
      getSitePagesTool,
      navigateToPageTool,
      createProjectTool,
      findMissionTool,
      findUserProjectsTool,
      getPageContextTool
    }
  });
};

export const EXAMPLE_INTERACTIONS = {
  hebrew: [
    {
      user: 'התחל טיימר לעיצוב לוגו',
      expectedFlow:
        "listUserMissionsTool({ query: 'עיצוב לוגו' }) -> timerActionTool({ action: 'start', missionId })"
    },
    {
      user: 'כמה זמן עבדתי השבוע?',
      expectedFlow: 'getTimerHistoryTool({ days: 7 }) -> summarize total duration'
    },
    {
      user: 'תעצור את הטיימר הנוכחי',
      expectedFlow: "timerActionTool({ action: 'stop' })"
    }
  ],
  english: [
    {
      user: 'Start timer for API development',
      expectedFlow:
        "listUserMissionsTool({ query: 'API development' }) -> timerActionTool({ action: 'start', missionId })"
    },
    {
      user: 'Show my active timers',
      expectedFlow: 'getActiveTimersTool({ includeDetails: true }) -> format and present'
    },
    {
      user: 'Stop my current timer',
      expectedFlow: "timerActionTool({ action: 'stop' })"
    }
  ]
};
