import { createTool } from '@mastra/core';
import { z } from 'zod';
import { sendToSer } from '../../lib/send/sendToSer.js';
import { startTimer, stopTimer } from '../../lib/func/timers.js';

// Basic Start Timer Tool
export const startTimerTool = createTool({
  id: 'start_timer',
  description: 'Start a timer for a specific mission',
  inputSchema: z.object({
    missionId: z.string().describe('Mission ID to start timer for')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    timerId: z.string().optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { missionId } = context;
    const globalContext = global.botContext || {};
    const userId = globalContext.userId;
    const fetchInstance = globalContext.fetchInstance;
    
    if (!userId || !fetchInstance) {
      return { success: false, message: 'Missing user context', error: 'Missing user context' };
    }

    try {
      const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, false, fetchInstance);
      const mission = missionData?.data?.mesimabetahalich?.data;
      
      if (!mission) {
        return { success: false, message: 'Mission not found', error: 'Mission not found' };
      }

      const activeTimer = mission.attributes?.activeTimer;
      const timerId = activeTimer?.data?.id || 0;
      const projectId = mission.attributes?.project?.data?.id;
      const missionName = mission.attributes?.name;

      if (!projectId) {
        return { success: false, message: 'Project not found for mission', error: 'Project ID not found' };
      }

      if (activeTimer?.data?.attributes?.isActive) {
        return { success: false, message: `Timer for ${missionName} is already active`, error: 'Timer already active' };
      }

      await startTimer(activeTimer, missionId, userId, projectId, timerId, false, fetchInstance);
      
      return { 
        success: true, 
        message: `Timer started for ${missionName}`,
        timerId: timerId.toString()
      };
    } catch (error) {
      console.error('Start timer error:', error);
      return { success: false, message: 'Failed to start timer', error: error.message };
    }
  }
});

// Basic Stop Timer Tool
export const stopTimerTool = createTool({
  id: 'stop_timer',
  description: 'Stop a timer for a specific mission',
  inputSchema: z.object({
    missionId: z.string().describe('Mission ID to stop timer for')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    duration: z.number().optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { missionId } = context;
    const globalContext = global.botContext || {};
    const fetchInstance = globalContext.fetchInstance;
    
    if (!fetchInstance) {
      return { success: false, message: 'Missing fetch context', error: 'Missing fetch context' };
    }

    try {
      const missionData = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, false, fetchInstance);
      const mission = missionData?.data?.mesimabetahalich?.data;
      
      if (!mission) {
        return { success: false, message: 'Mission not found', error: 'Mission not found' };
      }

      const activeTimerData = mission.attributes?.activeTimer?.data;
      const missionName = mission.attributes?.name;

      if (!activeTimerData || !activeTimerData.attributes.isActive) {
        return { success: false, message: `No active timer found for ${missionName}`, error: 'No active timer' };
      }

      await stopTimer(activeTimerData, fetchInstance, false);
      
      // Calculate duration
      const startTime = new Date(activeTimerData.attributes.timers[activeTimerData.attributes.timers.length - 1].startTime);
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes
      
      return { 
        success: true, 
        message: `Timer stopped for ${missionName}. Duration: ${duration} minutes`,
        duration
      };
    } catch (error) {
      console.error('Stop timer error:', error);
      return { success: false, message: 'Failed to stop timer', error: error.message };
    }
  }
});

export const basicTimerTools = [
  startTimerTool,
  stopTimerTool
];