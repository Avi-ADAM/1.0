/**
 * SocketIOServer Usage Examples
 * 
 * This file demonstrates how to use the SocketIOServer client
 * to send real-time notifications to connected users.
 */

import { SocketIOServer } from '../SocketIOServer';
import type { NotificationData } from '../NotificationOrchestrator';
import type { ActionContext } from '../../actions/types';

// Example 1: Basic Broadcasting
async function example1_basicBroadcast(context: ActionContext) {
  const socketServer = new SocketIOServer('http://localhost:3001');

  const notification: NotificationData = {
    title: {
      he: 'משימה חדשה',
      en: 'New Task',
      ar: 'مهمة جديدة'
    },
    body: {
      he: 'נוספה משימה חדשה לפרויקט שלך',
      en: 'A new task was added to your project',
      ar: 'تمت إضافة مهمة جديدة إلى مشروعك'
    },
    metadata: {
      url: '/lev',
      icon: 'https://www.1lev1.com/icon.png',
      priority: 'normal'
    }
  };

  const result = await socketServer.broadcast(
    ['user123', 'user456'],
    notification,
    context
  );

  console.log(`Delivered to ${result.deliveredTo}/${result.requestedUsers} users`);
  console.log(`Total sockets: ${result.totalSockets}`);
}

// Example 2: Broadcasting to UserProfile Array
async function example2_broadcastToUsers(context: ActionContext) {
  const socketServer = new SocketIOServer();

  const users = [
    {
      id: '123',
      username: 'user1',
      email: 'user1@example.com',
      lang: 'he',
      machshirs: []
    },
    {
      id: '456',
      username: 'user2',
      email: 'user2@example.com',
      lang: 'en',
      machshirs: []
    }
  ];

  const notification: NotificationData = {
    title: { he: 'עדכון', en: 'Update' },
    body: { he: 'יש עדכון חדש', en: 'There is a new update' }
  };

  const result = await socketServer.broadcastToUsers(users, notification, context);
  
  if (result.success) {
    console.log('Broadcast successful');
  } else {
    console.error('Broadcast failed:', result.error);
  }
}

// Example 3: Health Check
async function example3_healthCheck(context: ActionContext) {
  const socketServer = new SocketIOServer();

  const isHealthy = await socketServer.healthCheck(context);
  
  if (isHealthy) {
    console.log('Socket.IO server is healthy');
  } else {
    console.error('Socket.IO server is not responding');
    // Fallback: Don't send socket notifications
  }
}

// Example 4: Get Statistics
async function example4_getStats(context: ActionContext) {
  const socketServer = new SocketIOServer();

  const stats = await socketServer.getStats(context);
  
  if (stats) {
    console.log('Socket.IO Server Statistics:');
    console.log(`- Connected users: ${stats.connectedUsers}`);
    console.log(`- Total connections: ${stats.totalConnections}`);
    console.log(`- Avg connections per user: ${stats.averageConnectionsPerUser}`);
  }
}

// Example 5: Error Handling
async function example5_errorHandling(context: ActionContext) {
  const socketServer = new SocketIOServer('http://invalid-server:9999');

  const notification: NotificationData = {
    title: { he: 'test', en: 'test' },
    body: { he: 'test', en: 'test' }
  };

  const result = await socketServer.broadcast(['123'], notification, context);
  
  // Even if the server is down, this won't throw an exception
  if (!result.success) {
    console.error('Failed to send socket notification:', result.error);
    // The action can still succeed even if socket notifications fail
  }
}

// Example 6: Integration with NotificationOrchestrator
async function example6_withOrchestrator(context: ActionContext) {
  const { NotificationOrchestrator } = await import('../NotificationOrchestrator');
  const { StrapiClient } = await import('../../actions/StrapiClient');

  const strapiClient = new StrapiClient(
    process.env.VITE_URL || 'https://api.1lev1.com',
    process.env.VITE_ADMINMONTHER || ''
  );

  const orchestrator = new NotificationOrchestrator(
    strapiClient,
    'http://localhost:3001' // Socket.IO server URL
  );

  // Socket notifications are sent automatically when 'socket' is in channels
  await orchestrator.notify(
    {
      recipients: {
        type: 'projectMembers',
        config: { projectIdParam: 'projectId' }
      },
      templates: {
        title: { he: 'עדכון פרויקט', en: 'Project Update' },
        body: { he: 'הפרויקט עודכן', en: 'The project was updated' }
      },
      channels: ['socket', 'email'], // Socket is included
      metadata: {
        url: '/lev',
        priority: 'normal'
      }
    },
    { projectId: '123' },
    {},
    context
  );
}

// Example 7: Custom Server URL from Environment
async function example7_customServerUrl(context: ActionContext) {
  // Uses SOCKET_SERVER_URL environment variable if set
  const socketServer = new SocketIOServer();

  const notification: NotificationData = {
    title: { he: 'הודעה', en: 'Message' },
    body: { he: 'תוכן', en: 'Content' }
  };

  await socketServer.broadcast(['123'], notification, context);
}

// Example 8: Notification with Rich Metadata
async function example8_richMetadata(context: ActionContext) {
  const socketServer = new SocketIOServer();

  const notification: NotificationData = {
    title: {
      he: 'הצעה חדשה',
      en: 'New Proposal'
    },
    body: {
      he: 'התקבלה הצעה חדשה למשימה',
      en: 'A new proposal was received for the task'
    },
    metadata: {
      url: '/lev/task/123',
      icon: 'https://www.1lev1.com/icons/proposal.png',
      priority: 'high'
    },
    actionParams: {
      taskId: '123',
      proposalId: '456'
    },
    actionResult: {
      proposalCreated: true,
      proposalId: '456'
    }
  };

  await socketServer.broadcast(['user123'], notification, context);
}

// Example 9: Broadcasting to Multiple Users with Different Languages
async function example9_multiLanguage(context: ActionContext) {
  const socketServer = new SocketIOServer();

  // The notification includes all languages
  // Each client will display the notification in their preferred language
  const notification: NotificationData = {
    title: {
      he: 'פגישה חדשה',
      en: 'New Meeting',
      ar: 'اجتماع جديد'
    },
    body: {
      he: 'נקבעה פגישה חדשה ב-15:00',
      en: 'A new meeting was scheduled at 15:00',
      ar: 'تم تحديد اجتماع جديد في الساعة 15:00'
    },
    metadata: {
      url: '/meetings/789',
      priority: 'high'
    }
  };

  // Users will see the notification in their preferred language
  await socketServer.broadcast(
    ['hebrewUser', 'englishUser', 'arabicUser'],
    notification,
    context
  );
}

// Example 10: Conditional Socket Notifications
async function example10_conditional(context: ActionContext) {
  const socketServer = new SocketIOServer();

  // Check if server is healthy before sending
  const isHealthy = await socketServer.healthCheck(context);
  
  if (isHealthy) {
    const notification: NotificationData = {
      title: { he: 'עדכון', en: 'Update' },
      body: { he: 'יש עדכון', en: 'There is an update' }
    };

    await socketServer.broadcast(['123'], notification, context);
  } else {
    console.log('Socket.IO server is down, skipping socket notifications');
    // Other notification channels (email, telegram) will still work
  }
}

export {
  example1_basicBroadcast,
  example2_broadcastToUsers,
  example3_healthCheck,
  example4_getStats,
  example5_errorHandling,
  example6_withOrchestrator,
  example7_customServerUrl,
  example8_richMetadata,
  example9_multiLanguage,
  example10_conditional
};
