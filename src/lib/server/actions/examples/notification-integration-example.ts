/**
 * Notification Integration Example
 * 
 * This example demonstrates how notifications are integrated into the Action Service
 * and processed asynchronously without blocking action responses.
 */

import type { ActionConfig } from '../types';

/**
 * Example 1: Action with Multi-Channel Notifications
 * 
 * This action sends notifications via email, Telegram, push, and socket
 * to all project members when a new task is created.
 */
export const createTaskWithNotifications: ActionConfig = {
  key: 'createTask',
  description: 'Create a new task and notify project members',
  graphqlOperation: '4crtask',
  
  paramSchema: {
    projectId: { type: 'string', required: true },
    taskName: { type: 'string', required: true },
    description: { type: 'string', required: false },
    assignedTo: { type: 'string', required: false }
  },
  
  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only project members can create tasks'
    }
  ],
  
  // Notification configuration
  notification: {
    // Who receives the notification
    recipients: {
      type: 'projectMembers',
      config: {
        projectIdParam: 'projectId',
        excludeSender: true // Don't notify the person who created the task
      }
    },
    
    // Notification content (multilingual)
    templates: {
      title: {
        he: 'משימה חדשה נוצרה',
        en: 'New Task Created',
        ar: 'تم إنشاء مهمة جديدة'
      },
      body: {
        he: 'נוספה משימה חדשה לפרויקט',
        en: 'A new task was added to the project',
        ar: 'تمت إضافة مهمة جديدة إلى المشروع'
      }
    },
    
    // Which channels to use
    channels: ['socket', 'email', 'telegram', 'push'],
    
    // Optional metadata
    metadata: {
      icon: 'https://example.com/task-icon.png',
      url: '/project/{{projectId}}/tasks',
      priority: 'normal'
    }
  },
  
  // How the client should update after this action
  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['tasks', 'projectStats']
    }
  }
};

/**
 * Example 2: Action with Specific User Notifications
 * 
 * This action sends notifications only to specific users
 * (e.g., when assigning a task to someone).
 */
export const assignTaskWithNotification: ActionConfig = {
  key: 'assignTask',
  description: 'Assign a task to a user and notify them',
  graphqlOperation: '31updateTask',
  
  paramSchema: {
    taskId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    assignedTo: { type: 'string', required: true }
  },
  
  authRules: [
    { type: 'jwt' },
    { type: 'projectMember', config: { projectIdParam: 'projectId' } }
  ],
  
  notification: {
    // Notify only the assigned user
    recipients: {
      type: 'specificUsers',
      config: {
        projectIdParam: 'projectId',
        userIdsParam: 'assignedTo' // This param contains the user ID
      }
    },
    
    templates: {
      title: {
        he: 'הוקצתה לך משימה',
        en: 'Task Assigned to You',
        ar: 'تم تعيين مهمة لك'
      },
      body: {
        he: 'הוקצתה לך משימה חדשה',
        en: 'A new task has been assigned to you',
        ar: 'تم تعيين مهمة جديدة لك'
      }
    },
    
    channels: ['socket', 'email', 'push'], // No Telegram for task assignments
    
    metadata: {
      priority: 'high', // High priority for direct assignments
      url: '/task/{{taskId}}'
    }
  },
  
  updateStrategy: {
    type: 'optimistic', // Update UI immediately for better UX
    config: {
      dataKeys: ['task', 'userTasks']
    }
  }
};

/**
 * Example 3: Action Without Notifications
 * 
 * Not all actions need notifications. This example shows
 * an action that updates user preferences silently.
 */
export const updateUserPreferences: ActionConfig = {
  key: 'updatePreferences',
  description: 'Update user preferences',
  graphqlOperation: '2userUpdate',
  
  paramSchema: {
    userId: { type: 'string', required: true },
    theme: { type: 'string', required: false },
    language: { type: 'string', required: false },
    notifications: { type: 'boolean', required: false }
  },
  
  authRules: [
    { type: 'jwt' },
    {
      type: 'custom',
      config: {
        checkFunction: async (userId: string, params: any) => {
          // User can only update their own preferences
          return userId === params.userId;
        }
      },
      errorMessage: 'You can only update your own preferences'
    }
  ],
  
  // No notification config - this is a silent update
  
  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['userProfile']
    }
  }
};

/**
 * How Notifications Work (Flow Diagram)
 * 
 * 1. Client sends action request:
 *    POST /api/action
 *    { actionKey: 'createTask', params: { projectId: '123', taskName: 'New Task' } }
 * 
 * 2. ActionService.executeAction() is called:
 *    - Validates parameters ✓
 *    - Checks authorization ✓
 *    - Executes Strapi operation ✓
 *    - Triggers notifications (async, fire-and-forget)
 *    - Returns response immediately
 * 
 * 3. Client receives response (fast, ~50ms):
 *    { success: true, data: {...}, updateStrategy: {...} }
 * 
 * 4. Meanwhile, NotificationOrchestrator processes notifications:
 *    - Identifies recipients (project members)
 *    - Filters based on rules (exclude sender)
 *    - Sends via all channels in parallel:
 *      * Socket.IO → Real-time update to connected clients
 *      * Email → Sends email to users without noMail flag
 *      * Telegram → Sends to users with telegramId
 *      * Push → Sends to all user devices
 * 
 * 5. If any notification fails:
 *    - Error is logged
 *    - Other channels continue
 *    - Action is still considered successful
 */

/**
 * Performance Characteristics
 * 
 * - Action response time: <50ms (without waiting for notifications)
 * - Notification processing: 100-500ms (depending on channels)
 * - Total user-perceived latency: <50ms (notifications happen in background)
 * 
 * This ensures a fast, responsive user experience while still
 * delivering notifications to all relevant users.
 */

/**
 * Error Handling
 * 
 * Notifications use a fire-and-forget pattern with error catching:
 * 
 * ```typescript
 * if (config.notification && this.notifier) {
 *   this.notifier.notify(config.notification, params, result, context)
 *     .catch(err => {
 *       // Log error but don't fail the action
 *       this.logger.error('Notification error', { error: err.message });
 *     });
 * }
 * ```
 * 
 * This ensures:
 * - Actions succeed even if notifications fail
 * - Errors are logged for debugging
 * - No unhandled promise rejections
 * - Graceful degradation
 */

/**
 * Testing Notifications
 * 
 * To test notification integration:
 * 
 * 1. Unit test the NotificationOrchestrator directly
 * 2. Integration test with mocked notification services
 * 3. Verify async behavior (response before notification completes)
 * 4. Test error scenarios (notification failures don't affect action)
 * 
 * See: src/lib/server/actions/ActionService.integration.test.ts
 */
