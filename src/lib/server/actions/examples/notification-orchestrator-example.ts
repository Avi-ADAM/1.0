/**
 * Example: Using NotificationOrchestrator
 * 
 * This example demonstrates how to use the NotificationOrchestrator
 * to send multi-channel notifications.
 */

import { NotificationOrchestrator } from '../../notifications/NotificationOrchestrator';
import { StrapiClient } from '../StrapiClient';
import type { NotificationConfig, ActionContext } from '../types';

// Example 1: Create NotificationOrchestrator instance
const strapiClient = new StrapiClient(
  process.env.VITE_URL || 'https://api.1lev1.com/graphql',
  process.env.VITE_ADMINMONTHER || ''
);

const notificationOrchestrator = new NotificationOrchestrator(strapiClient);

// Example 2: Send notifications to all project members
async function notifyProjectMembers(
  projectId: string,
  context: ActionContext
) {
  const config: NotificationConfig = {
    recipients: {
      type: 'projectMembers',
      config: {
        projectIdParam: 'projectId',
        excludeSender: true
      }
    },
    templates: {
      title: {
        he: 'עדכון חדש בפרויקט',
        en: 'New project update'
      },
      body: {
        he: 'יש עדכון חדש בפרויקט שלך',
        en: 'There is a new update in your project'
      }
    },
    channels: ['email', 'telegram', 'push'],
    metadata: {
      url: `/project/${projectId}`,
      icon: 'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png',
      priority: 'normal'
    }
  };

  await notificationOrchestrator.notify(
    config,
    { projectId },
    { success: true },
    context
  );
}

// Example 3: Send notifications to specific users
async function notifySpecificUsers(
  projectId: string,
  userIds: string[],
  context: ActionContext
) {
  const config: NotificationConfig = {
    recipients: {
      type: 'specificUsers',
      config: {
        projectIdParam: 'projectId',
        userIdsParam: 'userIds',
        excludeSender: false
      }
    },
    templates: {
      title: {
        he: 'הוזמנת למשימה',
        en: 'You were invited to a task'
      },
      body: {
        he: 'נוספת למשימה חדשה',
        en: 'You were added to a new task'
      }
    },
    channels: ['email', 'push'],
    metadata: {
      url: `/task/123`,
      priority: 'high'
    }
  };

  await notificationOrchestrator.notify(
    config,
    { projectId, userIds },
    { taskId: '123' },
    context
  );
}

// Example 4: Email-only notification
async function sendEmailNotification(
  projectId: string,
  context: ActionContext
) {
  const config: NotificationConfig = {
    recipients: {
      type: 'projectMembers',
      config: {
        projectIdParam: 'projectId'
      }
    },
    templates: {
      title: {
        he: 'דוח שבועי',
        en: 'Weekly report'
      },
      body: {
        he: 'הדוח השבועי שלך מוכן',
        en: 'Your weekly report is ready'
      }
    },
    channels: ['email'], // Only email
    emailTemplate: 'SimpleNuti',
    metadata: {
      url: `/reports/weekly`
    }
  };

  await notificationOrchestrator.notify(
    config,
    { projectId },
    {},
    context
  );
}

// Example 5: Clear cache (useful for testing or when membership changes)
function clearNotificationCache(projectId?: string) {
  notificationOrchestrator.clearCache(projectId);
}

// Example 6: Integration with ActionService
import { ActionService } from '../ActionService';
import { ValidationEngine } from '../ValidationEngine';
import { AuthorizationEngine } from '../AuthorizationEngine';

const actionService = new ActionService(
  new ValidationEngine(),
  new AuthorizationEngine(strapiClient),
  strapiClient,
  notificationOrchestrator // Pass the notification orchestrator
);

// Now when actions are executed, notifications will be sent automatically
async function executeActionWithNotifications(
  actionKey: string,
  params: Record<string, any>,
  context: ActionContext
) {
  const result = await actionService.executeAction(actionKey, params, context);
  
  // Notifications are sent asynchronously in the background
  // The action result is returned immediately
  
  return result;
}

export {
  notificationOrchestrator,
  notifyProjectMembers,
  notifySpecificUsers,
  sendEmailNotification,
  clearNotificationCache,
  executeActionWithNotifications
};
