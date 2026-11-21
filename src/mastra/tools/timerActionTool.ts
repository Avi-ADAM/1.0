import { createTool } from '@mastra/core/tools'
import { z } from 'zod';
import { sendToSer } from '../../lib/send/sendToSer.js';
import { startTimer, stopTimer } from '../../lib/func/timers.js';
import { getMcpContext, isMissionMember } from '../../lib/server/mcpContext.js';
import { taskOf } from '../../lib/acts/agentTasks';

/**
 * Why this task cannot ride on this timer, or null. Its hours are the
 * caller's on this mission, so the task must be theirs and hang on it
 * (claimTaskTool links it) — PLAN_AGENT_WORK AW1.
 */
async function actTimerProblem(actId: string, missionId: string, userId: string): Promise<string | null> {
  const ctx = getMcpContext()!;
  const res: any = await sendToSer({ id: actId }, 'agentTaskById', 0, 0, true, ctx.fetchInstance);
  const task = taskOf(res?.data?.act?.data);
  if (!task || !task.assignees.some((p) => p.id === userId)) return `Task ${actId} is not yours - claimTaskTool first.`;
  if (!task.missions.some((m) => m.id === missionId)) {
    return `Task ${actId} is not on mission ${missionId} - claimTaskTool with that missionId links it.`;
  }
  return null;
}

/** Add the task to the running timer's acts, keeping the ones already there. */
async function linkTimerToAct(timerId: string, actId: string): Promise<boolean> {
  const ctx = getMcpContext()!;
  try {
    const res: any = await sendToSer({ id: timerId }, 'agentTimerActs', 0, 0, true, ctx.fetchInstance);
    const t = res?.data?.timer?.data?.attributes;
    if (!t || String(t.users_permissions_user?.data?.id ?? '') !== String(ctx.userId)) return false;
    const acts = new Set<string>((t.acts?.data ?? []).map((a: any) => String(a.id)));
    if (acts.has(actId)) return true;
    acts.add(actId);
    const out: any = await sendToSer({ id: timerId, acts: [...acts] }, 'agentTimerSetActs', 0, 0, true, ctx.fetchInstance);
    return !out?.errors && !!out?.data?.updateTimer?.data?.id;
  } catch (e) {
    console.warn('[timerActionTool] could not attach the task to the timer:', e);
    return false;
  }
}

export const timerActionTool = createTool({
  id: 'timerActionTool',
  description: 'Perform actions on user timers (start, stop, pause, resume)',
  inputSchema: z.object({
    action: z
      .enum(['start', 'stop', 'pause', 'resume'])
      .describe('The action to perform on the timer'),
    missionId: z
      .string()
      .optional()
      .describe(
        'Specific mission ID (optional, will find active timer if not provided)'
      ),
    actId: z
      .string()
      .optional()
      .describe(
        'start only: the task (act) these hours are for, from listMyTasksTool. It must be yours and hang on this mission; the hours are filed against it when the timer is saved on the site.'
      )
  }),
  execute: async (inputData) => {
    const { action, missionId, actId } = inputData;
    const ctx = getMcpContext();

    if (!ctx?.userId || !ctx?.fetchInstance) {
      return {
        success: false,
        message: 'Missing user context',
        action: action
      };
    }

    const userId = ctx.userId;
    const fetchInstance = ctx.fetchInstance;
    const isServerRequest = !ctx.isInternalBot;
    // The member's device co-signs the tick and is told where it came from.
    const via = ctx.isInternalBot ? 'assistant' : 'mcp';
    const currentMessage = ctx.currentMessage || '';
    const lastMissionSearch = ctx.lastMissionSearch;

    console.log(`Executing timer action: ${action}`, { missionId, userId });

    try {
      const userExplicitlySelectedMission =
        typeof currentMessage === 'string' &&
        (/מזהה\s*:\s*\d+/i.test(currentMessage) ||
          /\bid\s*:\s*\d+\b/i.test(currentMessage));

      if (
        action === 'start' &&
        missionId &&
        lastMissionSearch?.missionName &&
        lastMissionSearch?.totalCount > 1 &&
        !userExplicitlySelectedMission
      ) {
        const listedMissionIds = new Set(
          (lastMissionSearch.missions || []).map((mission: { id: string }) => mission.id)
        );

        if (listedMissionIds.has(missionId)) {
          return {
            success: false,
            message: 'Multiple matching missions found. Please choose one from the list before starting a timer.',
            action,
            error: 'ambiguous_mission_selection',
            requiresSelection: true,
            missions: lastMissionSearch.missions
          };
        }
      }

      let targetMissionId = missionId;
      let mission = null;

      // If no specific mission ID, find the active timer from user missions
      if (!targetMissionId) {
        const res = await sendToSer(
          { id: userId },
          '8getMissionsOnProgress',
          0,
          0,
          true,
          fetchInstance
        );
        const missions =
          (res as any)?.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches
            ?.data ?? [];

        // Find mission with active timer for stop/pause actions
        if (action === 'stop' || action === 'pause') {
          const activeMission = missions.find(
            (item) => item.attributes.activeTimer?.data?.attributes?.isActive
          );

          if (!activeMission) {
            return {
              success: false,
              message: 'No active timer found to stop or pause',
              action: action
            };
          }

          targetMissionId = activeMission.id;
          mission = activeMission;
        } else {
          // For start/resume, we need a mission ID
          return {
            success: false,
            message: 'Mission ID required for start/resume actions',
            action: action
          };
        }
      }

      // Get mission data if we don't have it yet
      if (!mission) {
        const missionData = await sendToSer(
          { missionId: targetMissionId },
          '36getMissionTimer',
          0,
          0,
          isServerRequest,
          fetchInstance
        );
        mission = (missionData as any)?.data?.mesimabetahalich?.data;

        if (!mission) {
          return {
            success: false,
            message: 'Mission not found',
            action: action
          };
        }
      }

      // ── Ownership check ──────────────────────────────────────────────
      // Only the user assigned to the mission (or the mission owner) may
      // start / stop timers on it.
      if (!isMissionMember(mission.attributes)) {
        return {
          success: false,
          message: 'You are not authorized to manage timers for this mission',
          action: action
        };
      }
      // ─────────────────────────────────────────────────────────────────

      const activeTimer = mission.attributes?.activeTimer;
      const timerId = activeTimer?.data?.id || 0;
      const projectId = mission.attributes?.project?.data?.id;
      const missionName = mission.attributes?.name;

      // Perform the timer action
      switch (action) {
        case 'start':
          if (activeTimer?.data?.attributes?.isActive) {
            return {
              success: false,
              message: `Timer for ${missionName} is already active`,
              action: action
            };
          }

          if (!projectId) {
            return {
              success: false,
              message: 'Project not found for mission',
              action: action
            };
          }

          // Checked before the clock starts, so a wrong task starts nothing.
          if (actId) {
            const problem = await actTimerProblem(String(actId), String(targetMissionId), String(userId));
            if (problem) return { success: false, message: problem, action };
          }

          const started: any = await startTimer(
            activeTimer,
            targetMissionId,
            userId,
            projectId,
            fetchInstance,
            timerId,
            isServerRequest,
            { via }
          );
          const startedId = started?.id ?? timerId;
          const linked = actId && startedId ? await linkTimerToAct(String(startedId), String(actId)) : false;

          return {
            success: true,
            message:
              `Timer started for ${missionName}` +
              (actId ? (linked ? `, for task ${actId}.` : `. Task ${actId} could not be attached - pick it when saving the timer.`) : ''),
            action: action,
            timerId: String(startedId),
            missionId: targetMissionId,
            ...(actId ? { actId: String(actId), actLinked: linked } : {})
          };

        case 'stop':
          const activeTimerData = activeTimer?.data;

          if (!activeTimerData || !activeTimerData.attributes.isActive) {
            return {
              success: false,
              message: `No active timer found for ${missionName}`,
              action: action
            };
          }

          await stopTimer(
            activeTimerData,
            fetchInstance,
            isServerRequest,
            projectId,
            userId,
            { via }
          );

          // Calculate duration
          const timers = activeTimerData.attributes.timers || [];
          let duration = 0;
          if (timers.length > 0) {
            const lastTimerEntry = timers[timers.length - 1];
            const startRaw = lastTimerEntry?.start ?? lastTimerEntry?.startTime;
            if (startRaw) {
              const startTime = new Date(startRaw);
              const endTime = new Date();
              if (!Number.isNaN(startTime.getTime())) {
                duration = Math.round(
                  (endTime.getTime() - startTime.getTime()) / (1000 * 60)
                ); // minutes
              }
            }
          }

          return {
            success: true,
            message: `Timer stopped for ${missionName}. Duration: ${duration} minutes`,
            action: action,
            duration: duration,
            missionId: targetMissionId
          };

        case 'pause':
        case 'resume':
          // These actions would need additional implementation in the timer functions
          // For now, return a message indicating they're not yet supported
          return {
            success: false,
            message: `${action} action is not yet implemented`,
            action: action
          };

        default:
          return {
            success: false,
            message: `Unknown action: ${action}`,
            action: action
          };
      }
    } catch (error) {
      console.error('Timer action error:', error);
      return {
        success: false,
        message: `Failed to ${action} timer: ${error.message}`,
        action: action,
        error: error.message
      };
    }
  }
});
