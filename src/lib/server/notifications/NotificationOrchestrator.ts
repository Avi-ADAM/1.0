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
const userProfileCache = new Map<string, { profile: UserProfile; timestamp: number }>();
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
        context,
        actionResult
      );

      // 2. Filter out sender if configured
      const filteredRecipients = config.recipients.config?.excludeSender
        ? recipients.filter(u => {
          const isSender = String(u.id) === String(context.userId);
          if (isSender) console.log(`[NotificationOrchestrator] Excluding sender with ID: ${u.id}`);
          return !isSender;
        })
        : recipients;

      console.log(`[NotificationOrchestrator] Recipients for ${config.templates.title.he}: ${filteredRecipients.length}`);

      if (filteredRecipients.length === 0) {
        console.log('No recipients to notify');
        return;
      }

      // 3. Prepare notification data
      const contextData = { actionParams, actionResult };

      const title = {
        he: this.replacePlaceholders(config.templates.title.he, contextData),
        en: this.replacePlaceholders(config.templates.title.en, contextData),
        ar: config.templates.title.ar ? this.replacePlaceholders(config.templates.title.ar, contextData) : undefined
      };

      const body = {
        he: this.replacePlaceholders(config.templates.body.he, contextData),
        en: this.replacePlaceholders(config.templates.body.en, contextData),
        ar: config.templates.body.ar ? this.replacePlaceholders(config.templates.body.ar, contextData) : undefined
      };

      // Process metadata values if they contain placeholders
      const metadata = { ...config.metadata };
      if (metadata) {
        Object.keys(metadata).forEach((key: any) => {
          if (typeof metadata[key] === 'string' && metadata[key].includes('{{')) {
            metadata[key] = this.replacePlaceholders(metadata[key], contextData);
          }
        });
      }

      const notificationData: any = {
        title,
        body,
        metadata,
        actionParams,
        actionResult,
        initiatorId: context.userId,
        // Flatten for client-side handlers that expect these at top level
        updateStrategy: actionResult?.updateStrategy,
        data: actionResult?.data
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
      const channelNames: string[] = [];
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
   * Replace placeholders in template strings
   * Supported placeholders: {{senderName}}, {{content}}, {{projectName}}, etc.
   */
  private replacePlaceholders(template: string, data: Record<string, any>): string {
    if (!template) return '';
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      // Check in actionResult first, then actionParams
      if (data.actionResult && data.actionResult[key] !== undefined) {
        return String(data.actionResult[key]);
      }
      if (data.actionParams && data.actionParams[key] !== undefined) {
        return String(data.actionParams[key]);
      }
      return match; // Keep placeholder if not found
    });
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
    context: ActionContext,
    actionResult?: any
  ): Promise<UserProfile[]> {
    switch (rule.type) {
      case 'projectMembers':
        const projectIdParam = rule.config?.projectIdParam || 'projectId';
        const projectId = this.getNestedValue(params, projectIdParam);
        return await this.getProjectMembers(projectId, context);

      case 'specificUsers':
        const userIdsParam = rule.config?.userIdsParam || 'userIds';
        const userIds = this.getNestedValue(params, userIdsParam);

        if (userIds && Array.isArray(userIds)) {
          // Fetch profiles for specific users directly
          const profiles = await Promise.all(
            userIds
              .filter(id => id && String(id).trim() !== '')
              .map(id => this.getUserProfile(String(id), context))
          );
          const results = profiles.filter((p): p is UserProfile => p !== null);
          if (results.length > 0) return results;
        }

        // Fallback to project members filtering (legacy behavior)
        const projectIdForSpecific = rule.config?.projectIdParam || 'projectId';
        const projectIdValue = this.getNestedValue(params, projectIdForSpecific);
        if (projectIdValue) {
          const allMembers = await this.getProjectMembers(projectIdValue, context);
          return allMembers;
        }

        console.warn('No userIds or projectId provided for specificUsers recipient rule');
        return [];

      case 'skillBased':
        // TODO: Implement skill-based filtering
        console.warn('Skill-based recipient selection not yet implemented');
        return [];

      case 'custom':
        // TODO: Implement custom query
        console.warn('Custom recipient selection not yet implemented');
        return [];

      case 'meetingParticipants':
        const forumIdParam = rule.config?.forumIdParam || 'forumId';
        const forumId = this.getNestedValue(params, forumIdParam);
        return await this.getMeetingParticipants(forumId, context);

      case 'askParticipants':
        const askIdParam = rule.config?.askIdParam || 'askId';
        const askId = this.getNestedValue(params, askIdParam);
        return await this.getAskParticipants(askId, context, actionResult);

      default:
        console.warn(`Unknown recipient rule type: ${rule.type}`);
        return [];
    }
  }

  /**
   * Get a single user profile by ID (with caching)
   */
  private async getUserProfile(userId: string, context: ActionContext): Promise<UserProfile | null> {
    // Check cache
    if (!userId || String(userId).trim() === '') {
      console.warn('[NotificationOrchestrator] Attempted to fetch profile for empty/invalid userId');
      return null;
    }

    const cached = userProfileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.profile;
    }

    try {
      const result = await this.strapiClient.execute(
        '24userJSONQue',
        { uid: userId },
        context.jwt
      );

      const userData = result?.data?.usersPermissionsUser?.data;
      if (!userData) return null;

      const profile: UserProfile = {
        id: String(userData.id),
        username: userData.attributes.username,
        email: userData.attributes.email,
        lang: userData.attributes.lang || 'he',
        telegramId: userData.attributes.telegramId,
        noMail: userData.attributes.noMail,
        machshirs: userData.attributes.machshirs?.data || []
      };

      // Update cache
      userProfileCache.set(userId, {
        profile,
        timestamp: Date.now()
      });

      return profile;
    } catch (error) {
      console.error(`Error fetching user profile for ${userId}:`, error);
      return null;
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
   * Get meeting participants from forum ID
   */
  private async getMeetingParticipants(
    forumId: string,
    context: ActionContext
  ): Promise<UserProfile[]> {
    if (!forumId) {
      console.warn('No forumId provided for getMeetingParticipants');
      return [];
    }

    try {
      // Get meeting details to find participants
      const result = await this.strapiClient.execute(
        '59GetMeetingDetails',
        { id: forumId }, // This might need adjustment based on the actual query structure
        context.jwt
      );

      const meeting = result?.data?.pgisha?.data;
      if (!meeting) {
        console.warn(`Meeting with forum ${forumId} not found`);
        return [];
      }

      const participants = meeting.attributes?.pgishausers?.data || [];
      const profiles = await Promise.all(
        participants.map((participant: any) =>
          this.getUserProfile(participant.attributes?.users_permissions_user?.data?.id, context)
        )
      );

      return profiles.filter((p): p is UserProfile => p !== null);
    } catch (error) {
      console.error(`Error fetching meeting participants for forum ${forumId}:`, error);
      return [];
    }
  }

  /**
   * Get ask participants (project members + asker)
   */
  private async getAskParticipants(
    askId: string,
    context: ActionContext,
    actionResult?: any
  ): Promise<UserProfile[]> {
    if (!askId) {
      console.warn('No askId provided for getAskParticipants');
      return [];
    }

    let projectId: string | undefined;
    let askerId: string | undefined;

    // Try to get IDs from action result to avoid extra queries
    if (actionResult) {
      projectId = actionResult.projectId;
      askerId = actionResult.askerId;
    }

    // If missing, we might need a query (omitted for now as we ensure action returns them)
    if (!projectId || !askerId) {
      console.log('Ask details not in action result, falling back to cache/separate logic if implemented');
      // For now, if not in result, we return empty or implement a fallback query?
      // Let's rely on the action returning them for performance.
      if (!projectId) console.warn('Could not determine projectId for Ask ' + askId);
      if (!askerId) console.warn('Could not determine askerId for Ask ' + askId);
      // We can continue with partial data
    }

    const participants: UserProfile[] = [];

    // Get Project Members
    if (projectId) {
      const members = await this.getProjectMembers(projectId, context);
      participants.push(...members);
    }

    // Get Asker
    if (askerId) {
      const asker = await this.getUserProfile(askerId, context);
      if (asker) {
        participants.push(asker);
      }
    }

    // Dedup by ID
    const unique = new Map<string, UserProfile>();
    participants.forEach(p => unique.set(p.id, p));

    return Array.from(unique.values());
  }

  /**
   * Clear cache for a specific project
   */
  clearCache(projectId?: string): void {
    if (projectId) {
      projectMembershipCache.delete(projectId);
    } else {
      projectMembershipCache.clear();
      userProfileCache.clear();
    }
  }

  /**
   * Get the SocketIOServer instance
   */
  getSocketIOServer(): SocketIOServer {
    return this.socketIOServer;
  }

  /**
   * Get the EmailService instance
   */
  getEmailService(): EmailService {
    return this.emailService;
  }

  /**
   * Get the PushService instance
   */
  getPushService(): PushService {
    return this.pushService;
  }

  /**
   * Get the TelegramService instance
   */
  getTelegramService(): TelegramService {
    return this.telegramService;
  }
}
