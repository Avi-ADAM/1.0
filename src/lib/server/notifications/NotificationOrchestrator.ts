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
import { resolveChannels, resolveIntent, deliveryPlan, textFor, type NotificationIntent } from './intent';
import {
  loadSubjectNotice,
  subjectBodies,
  notifyLinks,
  linksFor,
  type NotifyLink
} from '../notices/subjectNotice';
import type { NoticeSubject } from '$lib/notices/links';

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
  title: { he: string; en: string; ar?: string; ru?: string; es?: string };
  body: { he: string; en: string; ar?: string; ru?: string; es?: string };
  metadata?: {
    icon?: string;
    url?: string;
    priority?: 'low' | 'normal' | 'high';
  };
  /**
   * Every place the reader can answer it, the default first — the rikma's vote
   * page and the heart filtered to the item. Each channel offers all of them;
   * empty when the notification is not about one vote (then `metadata.url`).
   */
  links?: NotifyLink[];
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

      const templates = config.templatesFor?.(actionParams ?? {}, actionResult) ?? config.templates;
      console.log(`[NotificationOrchestrator] Recipients for ${templates.title.he}: ${filteredRecipients.length}`);

      // A meeting notification has a second audience that never appears in
      // filteredRecipients: the guests watching that meeting, who have no
      // Strapi user to resolve to. Returning here on an empty list would drop
      // them silently - which is exactly what happens in a meeting whose only
      // other attendee is a guest.
      const meetingIds = this.meetingIdsFor(config.metadata, actionParams);

      if (filteredRecipients.length === 0 && meetingIds.length === 0) {
        console.log('No recipients to notify');
        return;
      }

      // 3. Prepare notification data
      const contextData = { actionParams, actionResult };
      const intent = resolveIntent(config, actionParams, actionResult);

      const title = {
        he: this.replacePlaceholders(templates.title.he, contextData),
        en: this.replacePlaceholders(templates.title.en, contextData),
        ar: templates.title.ar ? this.replacePlaceholders(templates.title.ar, contextData) : undefined
      };

      let body: NotificationData['body'] = {
        he: this.replacePlaceholders(templates.body.he, contextData),
        en: this.replacePlaceholders(templates.body.en, contextData),
        ar: templates.body.ar ? this.replacePlaceholders(templates.body.ar, contextData) : undefined
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

      // A notice about one rikma vote that waits for its reader says what
      // waits, in each reader's language, with both places to answer it. The
      // title stays the action's — it names the event ("a counter-proposal").
      const subject = this.subjectOf(config, actionParams, actionResult, intent);
      let links: NotifyLink[] = [];
      if (subject) {
        const mode = config.subjectText ?? 'replace';
        // `links` keeps the action's own words — nothing to read, unless the
        // heart link still needs to know which card a decision is.
        const needsRead = mode !== 'links' || (subject.kind === 'decision' && !subject.ani);
        // Only a decision's sentence names the actor (its proposer or counterer);
        // every other kind names its party from the item itself.
        const actor =
          needsRead && mode !== 'links' && subject.kind === 'decision' && context.userId
            ? await this.getUserProfile(String(context.userId), context)
            : null;
        const notice = needsRead
          ? await loadSubjectNotice(subject, this.strapiClient, {
              actorName: actor?.username,
              fetch: context.fetch
            })
          : null;
        if (notice && mode !== 'links') {
          const said = subjectBodies(notice, { clock: true });
          const own = body;
          body = { ...body, ...said };
          if (mode === 'before') {
            for (const l of Object.keys(said) as (keyof typeof said)[]) {
              const extra = textFor(own, l);
              if (extra) body[l] = `${said[l]}\n\n${extra}`;
            }
          }
        }
        links = notifyLinks(linksFor(subject, notice));
        if (links.length) metadata.url = links[0].href;
      }

      // A notification tells people; it does not refresh screens. Every screen
      // follows the action's `rt:changed` scopes (PLAN_REALTIME_MIGRATION R6), and
      // the update strategy is the actor's own tab's business — it applies it
      // from its own result. A forwarded `fullRefresh` once re-ran every load of
      // whatever page each recipient had open (B2).
      const forwarded =
        actionResult && typeof actionResult === 'object' && 'updateStrategy' in actionResult
          ? { ...actionResult, updateStrategy: undefined }
          : actionResult;

      const notificationData: any = {
        title,
        body,
        metadata,
        links,
        actionParams,
        actionResult: forwarded,
        initiatorId: context.userId,
        // Flattened for the client listeners that read it at the top level
        data: actionResult?.data
      };

      // 4. Send via the channels the intent asks for (in parallel)
      const channels = resolveChannels(config, actionParams, actionResult);
      const promises: Promise<void>[] = [];

      // Nobody is pushed, telegrammed or emailed about what they did
      // themselves, whatever `excludeSender` says — that flag is about the
      // socket (and also drops the sender's other devices there).
      const externalRecipients = filteredRecipients.filter(
        u => String(u.id) !== String(context.userId)
      );
      // Who hears it where off the site: email to everyone only when the
      // intent asks for it, otherwise to whoever push/telegram would miss;
      // a `review` reaches each person on exactly one channel.
      const plan = deliveryPlan(externalRecipients, channels, intent);
      const emailTo = plan.email;
      const telegramTo = plan.telegram;
      const pushTo = plan.push;

      if (channels.includes('socket')) {
        promises.push(
          this.socketIOServer.broadcastToUsers(
            filteredRecipients,
            notificationData,
            context,
            meetingIds
          ).then(() => {
            // Convert to void for consistency with other channels
          })
        );
      }

      if (emailTo.length) {
        promises.push(
          this.emailService.sendBulk(
            emailTo,
            notificationData,
            config.emailTemplate || 'SimpleNuti',
            context,
            config.emailTemplateData
          )
        );
      }

      if (telegramTo.length) {
        promises.push(
          this.telegramService.sendBulk(
            telegramTo,
            notificationData,
            context
          )
        );
      }

      if (pushTo.length) {
        promises.push(
          this.pushService.sendBulk(
            pushTo,
            notificationData,
            context
          )
        );
      }

      // Wait for all notifications (but don't fail if some fail)
      const results = await Promise.allSettled(promises);

      // Log any failures — names in the same order the promises were pushed
      const channelNames: string[] = [];
      if (channels.includes('socket')) channelNames.push('socket');
      if (emailTo.length) channelNames.push('email');
      if (telegramTo.length) channelNames.push('telegram');
      if (pushTo.length) channelNames.push('push');

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
   * The vote a notification is about — only when it waits for its reader
   * (`consent` / `review`). An outcome is about a vote that is over: its page
   * may be gone, and "a request from Dana…" would describe it as still open.
   * A config whose `subject` throws on an odd run is a notice without detail,
   * never a lost notice.
   */
  private subjectOf(
    config: NotificationConfig,
    params: Record<string, any>,
    result: any,
    intent: NotificationIntent | undefined
  ): NoticeSubject | null {
    if (!config.subject || (intent !== 'consent' && intent !== 'review')) return null;
    try {
      return config.subject(params ?? {}, result) ?? null;
    } catch (e) {
      console.warn('[notifications] subject() failed (template kept):', e);
      return null;
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
        // An action whose rikma is resolved by the handler (not passed in)
        // names it on the result, as `specificUsers` below already allows.
        const projectId =
          this.getNestedValue(params, projectIdParam) ||
          (actionResult ? this.getNestedValue(actionResult, projectIdParam) : undefined);
        return await this.getProjectMembers(projectId, context);

      case 'specificUsers':
        const userIdsParam = rule.config?.userIdsParam || 'userIds';
        const found =
          this.getNestedValue(params, userIdsParam) ||
          (actionResult ? this.getNestedValue(actionResult, userIdsParam) : undefined);
        // A single id (`requesterId`) is a list of one.
        const userIds =
          typeof found === 'string' || typeof found === 'number' ? [found] : found;

        if (userIds && Array.isArray(userIds)) {
          // Fetch profiles for specific users directly
          const profiles = await Promise.all(
            userIds
              .filter(id => id && String(id).trim() !== '')
              .map(id => this.getUserProfile(String(id), context))
          );
          // A list — even an empty one — is the answer: `[]` means nobody.
          // Falling through to the rikma turned "nobody" into "everyone" (N4,
          // docs/inprogress/REALTIME_TRACKING.md), which for a consent notice is an
          // email to the whole rikma.
          return profiles.filter((p): p is UserProfile => p !== null);
        }

        // No list at all is nobody too. It used to fall back to the rikma's
        // members — "the requester" became "everyone" (N4/N13). A notification
        // for the whole rikma says so: `projectMembers`.
        console.warn(`[notifications] specificUsers: no "${userIdsParam}" on params or result — sent to nobody`);
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
        const meetingIdParam = rule.config?.meetingIdParam || 'meetingId';
        const meetingId = this.getNestedValue(params, meetingIdParam);
        return await this.getMeetingParticipants(meetingId, context);

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
   * Which meeting, if any, is this notification about?
   *
   * Read from the notification metadata first - every meeting event sets
   * `metadata.type` and `metadata.meetingId` - and fall back to the action
   * params. Returns an empty list for everything that is not a meeting, so
   * no guest room is ever addressed by accident.
   */
  private meetingIdsFor(
    metadata: Record<string, any> | undefined,
    actionParams: Record<string, any> | undefined
  ): string[] {
    const raw = metadata?.meetingId ?? actionParams?.meetingId;
    if (raw == null) return [];
    const id = String(raw).trim();
    return id === '' ? [] : [id];
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
  /** Member ids of a rikma, through the same cache — the realtime audience. */
  async projectMemberIds(projectId: string, context: ActionContext): Promise<string[]> {
    return (await this.getProjectMembers(projectId, context)).map(u => String(u.id));
  }

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
    meetingId: string,
    context: ActionContext
  ): Promise<UserProfile[]> {
    if (!meetingId) {
      console.warn('No meetingId provided for getMeetingParticipants');
      return [];
    }

    try {
      // Get meeting details to find participants
      const result = await this.strapiClient.execute(
        '59GetMeetingDetails',
        { id: meetingId },
        context.jwt
      );

      const meeting = result?.data?.pgisha?.data;
      if (!meeting) {
        console.warn(`Meeting ${meetingId} not found`);
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
      console.error(`Error fetching participants of meeting ${meetingId}:`, error);
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
