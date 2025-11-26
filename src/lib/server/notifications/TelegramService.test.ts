/**
 * TelegramService Unit Tests
 * 
 * Tests the TelegramService class for Telegram notification sending.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TelegramService } from './TelegramService';
import type { UserProfile, NotificationData } from './NotificationOrchestrator';
import type { ActionContext } from '../actions/types';

describe('TelegramService', () => {
  let telegramService: TelegramService;
  let mockFetch: any;
  let mockContext: ActionContext;

  beforeEach(() => {
    telegramService = new TelegramService();
    mockFetch = vi.fn().mockResolvedValue({ ok: true });
    mockContext = {
      userId: '999',
      jwt: 'test-jwt-token',
      lang: 'he',
      fetch: mockFetch
    };
  });

  describe('sendBulk', () => {
    it('should filter out users without telegramId', async () => {
      const recipients: UserProfile[] = [
        {
          id: '1',
          username: 'user1',
          email: 'user1@example.com',
          lang: 'he',
          telegramId: '123456789',
          machshirs: []
        },
        {
          id: '2',
          username: 'user2',
          email: 'user2@example.com',
          lang: 'he',
          telegramId: undefined, // No Telegram
          machshirs: []
        },
        {
          id: '3',
          username: 'user3',
          email: 'user3@example.com',
          lang: 'he',
          telegramId: '', // Empty Telegram
          machshirs: []
        },
        {
          id: '4',
          username: 'user4',
          email: 'user4@example.com',
          lang: 'he',
          telegramId: '987654321',
          machshirs: []
        }
      ];

      const notification: NotificationData = {
        title: { he: 'כותרת', en: 'Title' },
        body: { he: 'תוכן', en: 'Content' }
      };

      await telegramService.sendBulk(recipients, notification, mockContext);

      // Should only send to users 1 and 4 (with valid telegramId)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should use correct language for each user', async () => {
      const recipients: UserProfile[] = [
        {
          id: '1',
          username: 'hebrew_user',
          email: 'hebrew@example.com',
          lang: 'he',
          telegramId: '111111111',
          machshirs: []
        },
        {
          id: '2',
          username: 'english_user',
          email: 'english@example.com',
          lang: 'en',
          telegramId: '222222222',
          machshirs: []
        },
        {
          id: '3',
          username: 'arabic_user',
          email: 'arabic@example.com',
          lang: 'ar',
          telegramId: '333333333',
          machshirs: []
        }
      ];

      const notification: NotificationData = {
        title: {
          he: 'כותרת עברית',
          en: 'English Title',
          ar: 'عنوان عربي'
        },
        body: {
          he: 'תוכן עברי',
          en: 'English Content',
          ar: 'محتوى عربي'
        }
      };

      await telegramService.sendBulk(recipients, notification, mockContext);

      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Check first call (Hebrew user)
      const firstCall = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(firstCall.lang).toBe('he');
      expect(firstCall.det).toBe('כותרת עברית');
      expect(firstCall.message).toBe('תוכן עברי');

      // Check second call (English user)
      const secondCall = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(secondCall.lang).toBe('en');
      expect(secondCall.det).toBe('English Title');
      expect(secondCall.message).toBe('English Content');

      // Check third call (Arabic user)
      const thirdCall = JSON.parse(mockFetch.mock.calls[2][1].body);
      expect(thirdCall.lang).toBe('ar');
      expect(thirdCall.det).toBe('عنوان عربي');
      expect(thirdCall.message).toBe('محتوى عربي');
    });

    it('should fall back to context language for unsupported user language', async () => {
      const recipients: UserProfile[] = [
        {
          id: '1',
          username: 'french_user',
          email: 'french@example.com',
          lang: 'fr', // Not supported
          telegramId: '123456789',
          machshirs: []
        }
      ];

      const notification: NotificationData = {
        title: { he: 'כותרת', en: 'Title' },
        body: { he: 'תוכן', en: 'Content' }
      };

      await telegramService.sendBulk(recipients, notification, mockContext);

      const call = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(call.lang).toBe('he'); // Falls back to context language
    });

    it('should include metadata URL in Telegram message', async () => {
      const recipients: UserProfile[] = [
        {
          id: '1',
          username: 'user',
          email: 'user@example.com',
          lang: 'he',
          telegramId: '123456789',
          machshirs: []
        }
      ];

      const notification: NotificationData = {
        title: { he: 'כותרת', en: 'Title' },
        body: { he: 'תוכן', en: 'Content' },
        metadata: {
          url: 'lev/project/123/task/456'
        }
      };

      await telegramService.sendBulk(recipients, notification, mockContext);

      const call = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(call.urladd).toBe('lev/project/123/task/456');
    });

    it('should use default URL when metadata URL is not provided', async () => {
      const recipients: UserProfile[] = [
        {
          id: '1',
          username: 'user',
          email: 'user@example.com',
          lang: 'he',
          telegramId: '123456789',
          machshirs: []
        }
      ];

      const notification: NotificationData = {
        title: { he: 'כותרת', en: 'Title' },
        body: { he: 'תוכן', en: 'Content' }
        // No metadata
      };

      await telegramService.sendBulk(recipients, notification, mockContext);

      const call = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(call.urladd).toBe('lev'); // Default URL
    });

    it('should send to correct Telegram API endpoint', async () => {
      const recipients: UserProfile[] = [
        {
          id: '1',
          username: 'user',
          email: 'user@example.com',
          lang: 'he',
          telegramId: '123456789',
          machshirs: []
        }
      ];

      const notification: NotificationData = {
        title: { he: 'כותרת', en: 'Title' },
        body: { he: 'תוכן', en: 'Content' }
      };

      await telegramService.sendBulk(recipients, notification, mockContext);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.1lev1.com/api/ste',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should handle errors gracefully and continue sending to other users', async () => {
      const recipients: UserProfile[] = [
        {
          id: '1',
          username: 'user1',
          email: 'user1@example.com',
          lang: 'he',
          telegramId: '123456789',
          machshirs: []
        },
        {
          id: '2',
          username: 'user2',
          email: 'user2@example.com',
          lang: 'he',
          telegramId: '987654321',
          machshirs: []
        }
      ];

      const notification: NotificationData = {
        title: { he: 'כותרת', en: 'Title' },
        body: { he: 'תוכן', en: 'Content' }
      };

      // First call fails, second succeeds
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: true });

      await telegramService.sendBulk(recipients, notification, mockContext);

      // Should attempt to send to both users despite first failure
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should return early if no recipients have Telegram', async () => {
      const recipients: UserProfile[] = [
        {
          id: '1',
          username: 'user1',
          email: 'user1@example.com',
          lang: 'he',
          telegramId: undefined,
          machshirs: []
        },
        {
          id: '2',
          username: 'user2',
          email: 'user2@example.com',
          lang: 'he',
          telegramId: '',
          machshirs: []
        }
      ];

      const notification: NotificationData = {
        title: { he: 'כותרת', en: 'Title' },
        body: { he: 'תוכן', en: 'Content' }
      };

      await telegramService.sendBulk(recipients, notification, mockContext);

      // Should not make any API calls
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should include all required fields in Telegram payload', async () => {
      const recipients: UserProfile[] = [
        {
          id: '1',
          username: 'user',
          email: 'user@example.com',
          lang: 'he',
          telegramId: '123456789',
          machshirs: []
        }
      ];

      const notification: NotificationData = {
        title: { he: 'כותרת', en: 'Title' },
        body: { he: 'תוכן', en: 'Content' }
      };

      await telegramService.sendBulk(recipients, notification, mockContext);

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      
      expect(payload).toHaveProperty('isNew', true);
      expect(payload).toHaveProperty('lang');
      expect(payload).toHaveProperty('chat_id');
      expect(payload).toHaveProperty('det');
      expect(payload).toHaveProperty('message');
      expect(payload).toHaveProperty('urladd');
    });
  });

  describe('language selection', () => {
    it('should prioritize user language over context language', async () => {
      const recipients: UserProfile[] = [
        {
          id: '1',
          username: 'user',
          email: 'user@example.com',
          lang: 'en', // User prefers English
          telegramId: '123456789',
          machshirs: []
        }
      ];

      const notification: NotificationData = {
        title: { he: 'כותרת', en: 'Title' },
        body: { he: 'תוכן', en: 'Content' }
      };

      const hebrewContext = { ...mockContext, lang: 'he' }; // Context is Hebrew

      await telegramService.sendBulk(recipients, notification, hebrewContext);

      const call = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(call.lang).toBe('en'); // Uses user's language, not context
    });

    it('should default to Hebrew when both user and context languages are unsupported', async () => {
      const recipients: UserProfile[] = [
        {
          id: '1',
          username: 'user',
          email: 'user@example.com',
          lang: 'fr', // Unsupported
          telegramId: '123456789',
          machshirs: []
        }
      ];

      const notification: NotificationData = {
        title: { he: 'כותרת', en: 'Title' },
        body: { he: 'תוכן', en: 'Content' }
      };

      const unsupportedContext = { ...mockContext, lang: 'de' }; // Also unsupported

      await telegramService.sendBulk(recipients, notification, unsupportedContext);

      const call = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(call.lang).toBe('he'); // Defaults to Hebrew
    });
  });
});
