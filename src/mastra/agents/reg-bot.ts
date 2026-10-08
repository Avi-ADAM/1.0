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
import { createTaskTool } from '../tools/createTaskTool';
import { getProjectMembersTool } from '../tools/getProjectMembersTool';
import { getMemberMissionsTool } from '../tools/getMemberMissionsTool';
import { findUserProjectsTool } from '../tools/findUserProjectsTool';
import { getPageContextTool } from '../tools/pageContextTool';
import { getProjectContextTool } from '../tools/getProjectContextTool';
import { getMyUpdatesTool } from '../tools/myUpdatesTool';
import { planProjectWorkTool, scanProjectDirectionsTool } from '../tools/planningTools';
import { SITE_CONTEXT } from '../../lib/bot/context.js';
import { createModelChain } from '../lib/createModel';

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
- What's new / what is waiting for me / what is happening in rikma X (as ready sentences): getMyUpdatesTool (rikma=<name> when one is named) -> relay the sentences, say which ones silence approves and when
- What's happening in a project (open missions, your tasks, members, values): getProjectContextTool(projectId)
- "What should we do next?" (open-ended, no specific goal): scanProjectDirectionsTool(projectId) -> relay the directions with their rationale
- "We want to achieve X" (a concrete brief): planProjectWorkTool(projectId, text) -> relay the reviewUrl
- Create Partnership/Embroidery: createProjectTool
- Create a task (Act) in a project for a person or a role: findUserProjectsTool -> getProjectMembersTool -> (for a person) getMemberMissionsTool to link a mission-in-progress -> createTaskTool
- General navigation: getSitePagesTool -> navigateToPageTool

Planning rule:
- scanProjectDirectionsTool and planProjectWorkTool only draft proposals; they never
  create missions, chores or resources. Always say the plan is a draft and that the
  user approves each row at the reviewUrl.
- Both need a projectId - resolve it with findUserProjectsTool first when unknown.

Behavior rules:
- Always respond in the user's language.
- Always use tools for navigation requests.
- Never ask the user for a mission ID.
- After using a tool, always explain the result in a human-readable reply.
- If multiple mission matches exist, present choices instead of guessing.
- If the request is ambiguous, ask a short clarification question.
`,
    model: createModelChain(apiKey),
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
      createTaskTool,
      getProjectMembersTool,
      getMemberMissionsTool,
      findMissionTool,
      findUserProjectsTool,
      getPageContextTool,
      getProjectContextTool,
      getMyUpdatesTool,
      planProjectWorkTool,
      scanProjectDirectionsTool
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
