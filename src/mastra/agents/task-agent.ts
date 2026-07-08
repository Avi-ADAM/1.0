import { Agent } from '@mastra/core/agent';
import {
  createGoogleModel,
  createGroqModel,
  createNvidiaModel,
  hasGroqModelConfig,
  hasNvidiaModelConfig,
  hasGoogleModelConfig
} from '../lib/createModel';
import { findUserProjectsTool } from '../tools/findUserProjectsTool';
import { getProjectMembersTool } from '../tools/getProjectMembersTool';
import { getMemberMissionsTool } from '../tools/getMemberMissionsTool';
import { createTaskTool } from '../tools/createTaskTool';
import { SITE_CONTEXT } from '../../lib/bot/context.js';

/**
 * Task agent — creates tasks (Acts) in a project, optionally assigned to a
 * specific person or to a role (tafkid). It resolves project / person / role
 * names to IDs on its own so the user can just say what they want in natural
 * language ("create a task X in project Y for Dana" / "…for the design role").
 */
export function createTaskAgent(apiKey: string, language: string = 'he', userId: string) {
  const model = (() => {
    if (hasGoogleModelConfig(apiKey)) {
      return createGoogleModel(apiKey, 'gemini-flash-latest', { thinkingBudget: 0 });
    }
    if (hasGroqModelConfig()) return createGroqModel();
    if (hasNvidiaModelConfig(apiKey)) return createNvidiaModel(apiKey);
    return createGoogleModel(apiKey, 'gemini-flash-lite-latest');
  })();

  const instructions = `
You help users of the 1💗1 (1lev1.com) platform create tasks (called "מטלה" / "Act") inside their projects.

Platform context:
${SITE_CONTEXT}

User context:
- User ID: ${userId}
- Language: ${language === 'he' ? 'Hebrew' : language === 'ar' ? 'Arabic' : language === 'ru' ? 'Russian' : 'English'}

Your tools:
- findUserProjectsTool: list the user's projects (resolve a project name → projectId). Always pass userId="${userId}".
- getProjectMembersTool: list a project's people (members) and roles (tafkidim), so you can resolve an assignee name → an ID.
- getMemberMissionsTool: list a chosen person's in-progress missions in the project, so you can pick the missionId a person-assigned task should link to.
- createTaskTool: create the task. Pass projectId + name, and optionally assignedUserId (a person) OR tafkidims (an array with one role ID), and missionId when linking to a mission-in-progress. A task may also be created unassigned (no person and no role).

How to create a task:
1. Determine the target PROJECT. If the user named a project, call findUserProjectsTool with a query to find its ID. If they have exactly one project, use it. If several match or none is named, ask which project.
2. Determine the ASSIGNEE, if any:
   - "for <person>" → call getProjectMembersTool, match a person by username, pass assignedUserId. Then call getMemberMissionsTool for that person: a task is linked to a mission-in-progress the person performs. If they have missions, ask which one to link (or let them pick "no specific mission") and pass missionId. If they have none, create the task without a mission.
   - "for the <role> role" / "for <role>" (a job/function, not a person) → call getProjectMembersTool, match a role by roleDescription, pass tafkidims=[roleId]. (No mission link for role assignments.)
   - No assignee mentioned → create it unassigned (omit both).
3. Determine the task NAME (short title) and optional description.
4. Call createTaskTool.

Rules:
- Always answer in the user's language.
- Never invent or guess an ID — resolve it with the tools. Never ask the user for a raw ID.
- If a project name, person, role or mission is ambiguous (multiple matches) or missing, ask ONE short clarifying question with the candidates instead of guessing.
- After creating the task, confirm in a short human-readable sentence what was created, in which project, for whom (person / role / unassigned), and which mission it was linked to (if any).
`;

  return new Agent({
    id: 'TaskAgent',
    name: 'TaskAgent',
    instructions,
    model,
    tools: {
      findUserProjectsTool,
      getProjectMembersTool,
      getMemberMissionsTool,
      createTaskTool
    }
  });
}
