import { createTool } from '@mastra/core';
import { z } from 'zod';
import { sendToSer } from '../../lib/send/sendToSer.js';
import { startTimer, stopTimer } from '../../lib/func/timers.js';

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
  execute: async ({ context }) => {
    const { action, missionId } = context;
    const globalContext = global.botContext || {};
    const userId = globalContext.userId;
    const fetchInstance = globalContext.fetchInstance;

    if (!userId || !fetchInstance) {
      return {
        success: false,
        message: 'Missing user context',
        action: action
      };
    }

    console.log(`Executing timer action: ${action}`, { missionId, userId });

    try {
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
          res?.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches
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
        mission = missionData?.data?.mesimabetahalich?.data;

        if (!mission) {
          return {
            success: false,
            message: 'Mission not found',
            action: action
          };
        }
      }

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
            timerId,
            false,
            fetchInstance
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

          await stopTimer(activeTimerData, fetchInstance, false);

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
