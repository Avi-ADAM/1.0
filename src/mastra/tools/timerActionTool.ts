import { createTool } from '@mastra/core/tools'
import { z } from 'zod';
import { sendToSer } from '../../lib/send/sendToSer.js';
import { startTimer, stopTimer } from '../../lib/func/timers.js';
import { getMcpContext, isMissionMember } from '../../lib/server/mcpContext.js';

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
      )
  }),
  execute: async (inputData) => {
    const { action, missionId } = inputData;
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
          false,
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

          await startTimer(
            activeTimer,
            targetMissionId,
            userId,
            projectId,
            fetchInstance,
            timerId,
            false
          );

          return {
            success: true,
            message: `Timer started for ${missionName}`,
            action: action,
            timerId: timerId.toString(),
            missionId: targetMissionId
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
            false,
            projectId,
            userId
          );

          // Calculate duration
          const timers = activeTimerData.attributes.timers || [];
          let duration = 0;
          if (timers.length > 0) {
            const startTime = new Date(timers[timers.length - 1].startTime);
            const endTime = new Date();
            duration = Math.round(
              (endTime.getTime() - startTime.getTime()) / (1000 * 60)
            ); // minutes
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
