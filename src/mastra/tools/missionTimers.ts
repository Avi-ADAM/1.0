// lib/mastra/mission-timer-tools.ts
import { createTool } from '@mastra/core';
import { z } from 'zod';
import { sendToSer } from '../../lib/send/sendToSer.js';
import { startTimer, stopTimer } from '../../lib/func/timers.js';
import { fuzzyMissionMatch, sortMissionsByRelevance } from '../../lib/utils/fuzzyMatch.js';

// Enhanced schema definitions
const MissionDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  projectId: z.string().nullable(),
  projectName: z.string(),
  isActiveTimer: z.boolean(),
  timerId: z.string().nullable(),
  totalTimeSpent: z.number().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.string().optional(),
  assignedUsers: z.array(z.object({
    id: z.string(),
    name: z.string()
  })).optional(),
  tasks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    completed: z.boolean().optional()
  })).optional(),
  tags: z.array(z.string()).optional()
});

const TimerDetailSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  missionName: z.string(),
  projectName: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  duration: z.number().optional(),
  isActive: z.boolean(),
  description: z.string().optional()
});

// MISSION TOOLS

// Tool: Get Mission Details
export const getMissionDetailsTool = createTool({
  id: 'getMissionDetails',
  description: 'Get detailed information about a specific mission including tasks, timeline, and current status',
  inputSchema: z.object({
    missionId: z.string().describe('Mission ID to get details for')
  }),
  outputSchema: z.object({
    mission: MissionDetailSchema.optional(),
    success: z.boolean(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { missionId } = context;
    const globalContext = global.botContext || {};
    const fetchInstance = globalContext.fetchInstance;
    
    if (!fetchInstance) {
      return { success: false, error: 'Missing fetch context' };
    }

    try {
      const res = await sendToSer({ missionId }, '36getMissionTimer', 0, 0, false, fetchInstance);
      const missionData = res?.data?.mesimabetahalich?.data;
      
      if (!missionData) {
        return { success: false, error: 'Mission not found' };
      }

      const mission = {
        id: missionData.id,
        name: missionData.attributes.name,
        description: missionData.attributes.description || '',
        projectId: missionData.attributes.project?.data?.id || null,
        projectName: missionData.attributes.project?.data?.attributes?.projectName || 'N/A',
        isActiveTimer: missionData.attributes.activeTimer?.data?.attributes?.isActive || false,
        timerId: missionData.attributes.activeTimer?.data?.id || null,
        status: missionData.attributes.status || 'active',
        priority: missionData.attributes.priority || 'medium',
        dueDate: missionData.attributes.dueDate || null,
        tasks: missionData.attributes.acts?.data?.map(task => ({
          id: task.id,
          name: task.attributes.shem,
          completed: task.attributes.completed || false
        })) || [],
        assignedUsers: missionData.attributes.users?.data?.map(user => ({
          id: user.id,
          name: user.attributes.username || user.attributes.email
        })) || [],
        tags: missionData.attributes.tags || []
      };

      return { mission, success: true };
    } catch (error) {
      console.error('Get mission details error:', error);
      return { success: false, error: error.message };
    }
  }
});

// Tool: List User Missions with Filters
export const listUserMissionsTool = createTool({
  id: 'listUserMissions',
  description: 'List user missions with various filtering options',
  inputSchema: z.object({
    filter: z.enum(['all', 'active', 'completed', 'startable', 'stoppable', 'overdue']).optional().default('all').describe('Filter missions by status'),
    projectId: z.string().optional().describe('Filter by specific project ID (numeric)'),
    projectName: z.string().optional().describe('Filter by project name'),
    missionName: z.string().optional().describe('Search for missions by name (partial match)'),
    limit: z.number().optional().default(10).describe('Maximum number of missions to return')
  }),
  outputSchema: z.object({
    missions: z.array(MissionDetailSchema),
    totalCount: z.number(),
    success: z.boolean(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { filter, projectId, projectName, missionName, limit } = context;
    const globalContext = global.botContext || {};
    const userId = globalContext.userId;
    const fetchInstance = globalContext.fetchInstance;
    
    if (!userId || !fetchInstance) {
      return { missions: [], totalCount: 0, success: false, error: 'Missing user context' };
    }

    try {
      const res = await sendToSer({ id: userId }, '8getMissionsOnProgress', 0, 0, true, fetchInstance);
      
      // Debug logging to understand the API response structure
      console.log('API Response structure:', {
        hasData: !!res?.data,
        hasUser: !!res?.data?.usersPermissionsUser,
        hasUserData: !!res?.data?.usersPermissionsUser?.data,
        hasAttributes: !!res?.data?.usersPermissionsUser?.data?.attributes,
        hasMissions: !!res?.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches,
        hasMissionData: !!res?.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches?.data,
        missionCount: res?.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches?.data?.length || 0
      });
      
      let missions = res?.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches?.data ?? [];
      
      console.log(`Found ${missions.length} total missions for user ${userId}`);
      if (missionName) {
        console.log(`Searching for missions matching: "${missionName}"`);
      }

      // Apply filters
      if (filter === 'startable') {
        missions = missions.filter(item => !item.attributes.activeTimer?.data || !item.attributes.activeTimer.data.attributes.isActive);
      } else if (filter === 'stoppable') {
        missions = missions.filter(item => item.attributes.activeTimer?.data?.attributes?.isActive);
      } else if (filter === 'active') {
        missions = missions.filter(item => item.attributes.status !== 'completed');
      } else if (filter === 'completed') {
        missions = missions.filter(item => item.attributes.status === 'completed');
      }

      if (projectId) {
        missions = missions.filter(item => item.attributes.project?.data?.id === projectId);
      }

      if (projectName) {
        missions = missions.filter(item => 
          item.attributes.project?.data?.attributes?.projectName?.toLowerCase().includes(projectName.toLowerCase())
        );
      }

      if (missionName) {
        // Enhanced fuzzy matching for mission names
        console.log('Available mission names:', missions.map(m => m.attributes.name));
        
        missions = missions.filter(item => {
          const match = fuzzyMissionMatch(missionName, item.attributes.name || '');
          if (match.matches) {
            console.log(`✅ Mission "${item.attributes.name}" matches search "${missionName}" (score: ${match.score.toFixed(2)})`);
          }
          return match.matches;
        });
        
        console.log(`After fuzzy matching: found ${missions.length} matching missions`);
        
        // Sort by relevance using centralized sorting function
        missions = sortMissionsByRelevance(missions, missionName);
      }

      const totalCount = missions.length;
      missions = missions.slice(0, limit);

      const formattedMissions = missions.map(item => ({
        id: item.id,
        name: item.attributes.name,
        description: item.attributes.description || '',
        projectId: item.attributes.project?.data?.id || null,
        projectName: item.attributes.project?.data?.attributes?.projectName || 'N/A',
        isActiveTimer: item.attributes.activeTimer?.data?.attributes?.isActive || false,
        timerId: item.attributes.activeTimer?.data?.id || null,
        status: item.attributes.status || 'active',
        priority: item.attributes.priority || 'medium',
        dueDate: item.attributes.dueDate || null,
        tasks: item.attributes.acts?.data?.map(task => ({
          id: task.id,
          name: task.attributes.shem,
          completed: task.attributes.completed || false
        })) || [],
        assignedUsers: item.attributes.users?.data?.map(user => ({
          id: user.id,
          name: user.attributes.username || user.attributes.email
        })) || [],
        tags: item.attributes.tags || []
      }));

      return { missions: formattedMissions, totalCount, success: true };
    } catch (error) {
      console.error('List user missions error:', error);
      console.error('Error details:', {
        userId,
        filter,
        projectId,
        projectName,
        missionName,
        errorMessage: error.message,
        errorStack: error.stack
      });
      return { 
        missions: [], 
        totalCount: 0, 
        success: false, 
        error: `Failed to fetch missions: ${error.message}. Please try again or contact support if the issue persists.` 
      };
    }
  }
});

// Tool: Get Mission Statistics
export const getMissionStatsTool = createTool({
  id: 'getMissionStats',
  description: 'Get statistics about user missions including counts by status, time spent, etc.',
  inputSchema: z.object({
    projectId: z.string().optional().describe('Get stats for specific project only')
  }),
  outputSchema: z.object({
    stats: z.object({
      totalMissions: z.number(),
      activeMissions: z.number(),
      completedMissions: z.number(),
      missionsWithActiveTimers: z.number(),
      totalTimeSpent: z.number(),
      averageTimePerMission: z.number(),
      mostActiveProject: z.string().optional()
    }),
    success: z.boolean(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { projectId } = context;
    const globalContext = global.botContext || {};
    const userId = globalContext.userId;
    const fetchInstance = globalContext.fetchInstance;
    
    if (!userId || !fetchInstance) {
      return { 
        stats: { 
          totalMissions: 0, activeMissions: 0, completedMissions: 0, 
          missionsWithActiveTimers: 0, totalTimeSpent: 0, averageTimePerMission: 0 
        }, 
        success: false, 
        error: 'Missing user context' 
      };
    }

    try {
      const res = await sendToSer({ id: userId }, '8getMissionsOnProgress', 0, 0, true, fetchInstance);
      let missions = res?.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches?.data ?? [];

      if (projectId) {
        missions = missions.filter(item => item.attributes.project?.data?.id === projectId);
      }

      const totalMissions = missions.length;
      const activeMissions = missions.filter(item => item.attributes.status !== 'completed').length;
      const completedMissions = missions.filter(item => item.attributes.status === 'completed').length;
      const missionsWithActiveTimers = missions.filter(item => item.attributes.activeTimer?.data?.attributes?.isActive).length;
      
      // Calculate time statistics (would need actual time tracking data)
      const totalTimeSpent = missions.reduce((total, mission) => {
        return total + (mission.attributes.totalTimeSpent || 0);
      }, 0);
      
      const averageTimePerMission = totalMissions > 0 ? totalTimeSpent / totalMissions : 0;

      // Find most active project
      const projectCounts = {};
      missions.forEach(mission => {
        const projectName = mission.attributes.project?.data?.attributes?.projectName;
        if (projectName) {
          projectCounts[projectName] = (projectCounts[projectName] || 0) + 1;
        }
      });
      
      const mostActiveProject = Object.keys(projectCounts).reduce((a, b) => 
        projectCounts[a] > projectCounts[b] ? a : b, ''
      );

      const stats = {
        totalMissions,
        activeMissions,
        completedMissions,
        missionsWithActiveTimers,
        totalTimeSpent,
        averageTimePerMission,
        mostActiveProject: mostActiveProject || undefined
      };

      return { stats, success: true };
    } catch (error) {
      console.error('Get mission stats error:', error);
      return { 
        stats: { 
          totalMissions: 0, activeMissions: 0, completedMissions: 0, 
          missionsWithActiveTimers: 0, totalTimeSpent: 0, averageTimePerMission: 0 
        }, 
        success: false, 
        error: error.message 
      };
    }
  }
});

// TIMER TOOLS

// Tool: Get Active Timers
export const getActiveTimersTool = createTool({
  id: 'getActiveTimers',
  description: 'Get all currently active timers for the user',
  inputSchema: z.object({
    includeDetails: z.boolean().optional().default(true).describe('Include detailed timer information')
  }),
  outputSchema: z.object({
    timers: z.array(TimerDetailSchema),
    totalActive: z.number(),
    success: z.boolean(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { includeDetails } = context;
    const globalContext = global.botContext || {};
    const userId = globalContext.userId;
    const fetchInstance = globalContext.fetchInstance;
    
    if (!userId || !fetchInstance) {
      return { timers: [], totalActive: 0, success: false, error: 'Missing user context' };
    }

    try {
      const res = await sendToSer({ id: userId }, '8getMissionsOnProgress', 0, 0, true, fetchInstance);
      const missions = res?.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches?.data ?? [];

      const activeTimerMissions = missions.filter(item => 
        item.attributes.activeTimer?.data?.attributes?.isActive
      );

      const timers = activeTimerMissions.map(mission => {
        const timerData = mission.attributes.activeTimer.data;
        return {
          id: timerData.id,
          missionId: mission.id,
          missionName: mission.attributes.name,
          projectName: mission.attributes.project?.data?.attributes?.projectName || 'N/A',
          startTime: timerData.attributes.startTime,
          isActive: true,
          description: timerData.attributes.description || ''
        };
      });

      return { 
        timers, 
        totalActive: timers.length, 
        success: true 
      };
    } catch (error) {
      console.error('Get active timers error:', error);
      return { timers: [], totalActive: 0, success: false, error: error.message };
    }
  }
});

// Tool: Get Timer History
export const getTimerHistoryTool = createTool({
  id: 'getTimerHistory',
  description: 'Get timer history for user with filtering options',
  inputSchema: z.object({
    missionId: z.string().optional().describe('Filter by specific mission'),
    projectId: z.string().optional().describe('Filter by specific project'),
    days: z.number().optional().default(7).describe('Number of days back to fetch'),
    limit: z.number().optional().default(20).describe('Maximum number of records')
  }),
  outputSchema: z.object({
    timers: z.array(TimerDetailSchema),
    totalCount: z.number(),
    totalDuration: z.number(),
    success: z.boolean(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { missionId, projectId, days, limit } = context;
    const globalContext = global.botContext || {};
    const userId = globalContext.userId;
    const fetchInstance = globalContext.fetchInstance;
    
    if (!userId || !fetchInstance) {
      return { timers: [], totalCount: 0, totalDuration: 0, success: false, error: 'Missing user context' };
    }

    try {
      // This would need to call a specific API endpoint for timer history
      // For now, we'll use a placeholder structure
      const res = await sendToSer({ 
        userId, 
        missionId, 
        projectId, 
        days, 
        limit 
      }, 'getTimerHistory', 0, 0, false, fetchInstance);
      
      const timerHistory = res?.data?.timers || [];
      
      const timers = timerHistory.map(timer => ({
        id: timer.id,
        missionId: timer.missionId,
        missionName: timer.missionName,
        projectName: timer.projectName,
        startTime: timer.startTime,
        endTime: timer.endTime,
        duration: timer.duration,
        isActive: false,
        description: timer.description || ''
      }));

      const totalDuration = timers.reduce((sum, timer) => sum + (timer.duration || 0), 0);

      return { 
        timers, 
        totalCount: timers.length, 
        totalDuration, 
        success: true 
      };
    } catch (error) {
      console.error('Get timer history error:', error);
      return { 
        timers: [], 
        totalCount: 0, 
        totalDuration: 0, 
        success: false, 
        error: error.message 
      };
    }
  }
});

// Tool: Start Timer with Notes
export const startTimerWithNotesTool = createTool({
  id: 'startTimerWithNotes',
  description: 'Start a timer for a mission with optional notes/description',
  inputSchema: z.object({
    missionId: z.string().describe('Mission ID to start timer for'),
    notes: z.string().optional().describe('Optional notes for this timer session'),
    taskId: z.string().optional().describe('Specific task within the mission')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    timerId: z.string().optional(),
    missionName: z.string().optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { missionId, notes, taskId } = context;
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

      // Start timer with additional parameters
      await startTimer(activeTimer, missionId, userId, projectId, timerId, false, fetchInstance, {
        notes,
        taskId
      });
      
      return { 
        success: true, 
        message: `Timer started for ${missionName}${notes ? ' with notes' : ''}`,
        timerId: timerId.toString(),
        missionName 
      };
    } catch (error) {
      console.error('Start timer with notes error:', error);
      return { success: false, message: 'Failed to start timer', error: error.message };
    }
  }
});

// Tool: Stop Timer with Summary
export const stopTimerWithSummaryTool = createTool({
  id: 'stopTimerWithSummary',
  description: 'Stop a timer and optionally add a work summary',
  inputSchema: z.object({
    missionId: z.string().describe('Mission ID to stop timer for'),
    summary: z.string().optional().describe('Summary of work completed during this timer session'),
    completedTasks: z.array(z.string()).optional().describe('List of task IDs that were completed')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    duration: z.number().optional(),
    missionName: z.string().optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { missionId, summary, completedTasks } = context;
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

      // Stop timer with additional parameters
      await stopTimer(activeTimerData, fetchInstance, false, {
        summary,
        completedTasks
      });
      
      // Calculate duration (this would come from the timer data)
      const startTime = new Date(activeTimerData.attributes.startTime);
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes
      
      return { 
        success: true, 
        message: `Timer stopped for ${missionName}. Duration: ${duration} minutes${summary ? ' with summary saved' : ''}`,
        duration,
        missionName 
      };
    } catch (error) {
      console.error('Stop timer with summary error:', error);
      return { success: false, message: 'Failed to stop timer', error: error.message };
    }
  }
});

export const missionTimerTools = [
  getMissionDetailsTool,
  listUserMissionsTool,
  getMissionStatsTool,
  getActiveTimersTool,
  getTimerHistoryTool,
  startTimerWithNotesTool,
  stopTimerWithSummaryTool
];
