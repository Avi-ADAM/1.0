/**
 * NotificationOrchestrator
 * 
 * Coordinates all notification channels for the unified action system.
 * Handles recipient identification, filtering, and parallel notification sending.
 */

import type { 
  NotificationConfig, 
  RecipientRule, 
  ActionContext 
} from '../actions/types';
import type { StrapiClient } from '../actions/StrapiClient';
import { EmailService } from './EmailService';
import { TelegramService } from './TelegramService';
import { PushService } from './PushService';
import { SocketIOServer } from './SocketIOServer';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  lang: string;
  telegramId?: string;
  noMail?: boolean;
  machshirs: any[];
}

export interface NotificationData {
  title: { he: string; en: string; ar?: string };
  body: { he: string; en: string; ar?: string };
  metadata?: {
    icon?: string;
    url?: string;
    priority?: 'low' | 'normal' | 'high';
  };
  actionParams?: Record<string, any>;
  actionResult?: any;
}

/**
 * Cache for project membership queries
 * Key: projectId, Value: { users: UserProfile[], timestamp: number }
 */
const projectMembershipCache = new Map<string, { users: UserProfile[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class NotificationOrchestrator {
  private emailService: EmailService;
  private telegramService: TelegramService;
  private pushService: PushService;
  private socketIOServer: SocketIOServer;

  constructor(
    private strapiClient: StrapiClient,
    socketServerUrl?: string
  ) {
    this.emailService = new EmailService();
    this.telegramService = new TelegramService();
    this.pushService = new PushService();
    this.socketIOServer = new SocketIOServer(socketServerUrl);
  }

  /**
   * Send notifications for an action
   */
  async notify(
    config: NotificationConfig,
    actionParams: Record<string, any>,
    actionResult: any,
    context: ActionContext
  ): Promise<void> {
    try {
      // 1. Determine recipients
      const recipients = await this.getRecipients(
        config.recipients,
        actionParams,
        context
      );

      // 2. Filter out sender if configured
      const filteredRecipients = config.recipients.config?.excludeSender
        ? recipients.filter(u => u.id !== context.userId)
        : recipients;

      if (filteredRecipients.length === 0) {
        console.log('No recipients to notify');
        return;
      }

      // 3. Prepare notification data
      const notificationData: NotificationData = {
        title: config.templates.title,
        body: config.templates.body,
        metadata: config.metadata,
        actionParams,
        actionResult
      };

      // 4. Send via all configured channels (in parallel)
      const promises: Promise<void>[] = [];

      if (config.channels.includes('socket')) {
        promises.push(
          this.socketIOServer.broadcastToUsers(
            filteredRecipients,
            notificationData,
            context
          ).then(() => {
            // Convert to void for consistency with other channels
          })
        );
      }

      if (config.channels.includes('email')) {
        promises.push(
          this.emailService.sendBulk(
            filteredRecipients,
            notificationData,
            config.emailTemplate || 'SimpleNuti',
            context
          )
        );
      }

      if (config.channels.includes('telegram')) {
        promises.push(
          this.telegramService.sendBulk(
            filteredRecipients,
            notificationData,
            context
          )
        );
      }

      if (config.channels.includes('push')) {
        promises.push(
          this.pushService.sendBulk(
            filteredRecipients,
            notificationData,
            context
          )
        );
      }

      // Wait for all notifications (but don't fail if some fail)
      const results = await Promise.allSettled(promises);
      
      // Log any failures
      const channelNames = [];
      if (config.channels.includes('socket')) channelNames.push('socket');
      if (config.channels.includes('email')) channelNames.push('email');
      if (config.channels.includes('telegram')) channelNames.push('telegram');
      if (config.channels.includes('push')) channelNames.push('push');
      
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Notification channel ${channelNames[index]} failed:`, result.reason);
        }
      });
    } catch (error) {
      console.error('Notification orchestration error:', error);
      // Don't throw - notifications should not block the main action
    }
  }

  /**
   * Get a nested value from an object using dot notation
   * @param obj The object to search
   * @param path The path to the value (e.g., 'data.project')
   * @returns The value at the path, or undefined if not found
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Get recipients based on recipient rules
   */
  private async getRecipients(
    rule: RecipientRule,
    params: Record<string, any>,
    context: ActionContext
  ): Promise<UserProfile[]> {
    switch (rule.type) {
      case 'projectMembers':
        const projectIdParam = rule.config?.projectIdParam || 'projectId';
        const projectId = this.getNestedValue(params, projectIdParam);
        return await this.getProjectMembers(projectId, context);

      case 'specificUsers':
        const userIdsParam = rule.config?.userIdsParam || 'userIds';
        const userIds = this.getNestedValue(params, userIdsParam);
        if (!userIds) {
          // If no specific users provided, fall back to all project members
          const fallbackProjectIdParam = rule.config?.projectIdParam || 'projectId';
          const fallbackProjectId = this.getNestedValue(params, fallbackProjectIdParam);
          return await this.getProjectMembers(fallbackProjectId, context);
        }
        const projectIdForSpecific = rule.config?.projectIdParam || 'projectId';
        const projectIdValue = this.getNestedValue(params, projectIdForSpecific);
        const allMembers = await this.getProjectMembers(projectIdValue, context);
        return allMembers.filter(u =>
          userIds.includes(String(u.id)) || userIds.includes(Number(u.id))
        );

      case 'skillBased':
        // TODO: Implement skill-based filtering
        console.warn('Skill-based recipient selection not yet implemented');
        return [];

      case 'custom':
        // TODO: Implement custom query
        console.warn('Custom recipient selection not yet implemented');
        return [];

      default:
        console.warn(`Unknown recipient rule type: ${rule.type}`);
        return [];
    }
  }

  /**
   * Get project members with caching
   */
  private async getProjectMembers(
    projectId: string,
    context: ActionContext
  ): Promise<UserProfile[]> {
    if (!projectId) {
      console.warn('No projectId provided for getProjectMembers');
      return [];
    }

    // Check cache
    const cached = projectMembershipCache.get(projectId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Using cached project members for project ${projectId}`);
      return cached.users;
    }

    // Fetch from Strapi
    try {
      const result = await this.strapiClient.execute(
        '3projectJSONQue',
        { pid: projectId },
        context.jwt
      );

      const users = result?.data?.project?.data?.attributes?.user_1s?.data || [];

      const profiles: UserProfile[] = users.map((user: any) => ({
        id: String(user.id),
        username: user.attributes.username,
        email: user.attributes.email,
        lang: user.attributes.lang || 'he',
        telegramId: user.attributes.telegramId,
        noMail: user.attributes.noMail,
        machshirs: user.attributes.machshirs?.data || []
      }));

      // Update cache
      projectMembershipCache.set(projectId, {
        users: profiles,
        timestamp: Date.now()
      });

      return profiles;
    } catch (error) {
      console.error('Error fetching project members:', error);
      return [];
    }
  }







  /**
   * Clear cache for a specific project (useful for testing or when membership changes)
   */
  clearCache(projectId?: string): void {
    if (projectId) {
      projectMembershipCache.delete(projectId);
    } else {
      projectMembershipCache.clear();
    }
  }

  /**
   * Get the SocketIOServer instance (useful for testing and direct access)
   */
  getSocketIOServer(): SocketIOServer {
    return this.socketIOServer;
  }
}
