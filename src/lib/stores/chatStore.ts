import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface BotMessage {
  text: string;
  user: boolean;
}

const STORAGE_KEY = 'bot_message_history';
const THREAD_KEY = 'bot_thread_id';

/**
 * Conversation id sent to /api/chat as `threadId`.
 *
 * The server keeps the real conversation (messages + the user's structured
 * working memory) in Mastra/Postgres — see docs/PLAN_CHAT_MEMORY.md — and this
 * is the handle to it. It must therefore outlive a reload, which is why it sits
 * in localStorage next to the message history, and it is regenerated on
 * `clear()` so "new conversation" starts a genuinely new server-side thread
 * instead of silently continuing the old one.
 *
 * It is not a secret and grants nothing on its own: the server namespaces it
 * under the authenticated user id before it reaches memory.
 */
function newThreadId(): string {
  if (browser && crypto?.randomUUID) return crypto.randomUUID();
  return `t${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
}

function readThreadId(): string {
  if (!browser) return 'default';
  try {
    const stored = localStorage.getItem(THREAD_KEY);
    if (stored) return stored;
    const fresh = newThreadId();
    localStorage.setItem(THREAD_KEY, fresh);
    return fresh;
  } catch {
    return newThreadId();
  }
}

function createChatStore() {
  // Initialize from localStorage if available
  let initial: BotMessage[] = [];
  if (browser) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) initial = JSON.parse(stored);
    } catch { /* ignore */ }
  }

  const { subscribe, set, update } = writable<BotMessage[]>(initial);

  // Auto-persist to localStorage
  if (browser) {
    subscribe((msgs) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
    });
  }

  return {
    subscribe,
    set,
    update,
    addMessage(msg: BotMessage) {
      update((msgs) => [...msgs, msg]);
    },
    /** Current server-side conversation id — send it with every chat request. */
    threadId() {
      return readThreadId();
    },
    clear() {
      set([]);
      if (browser) {
        try {
          localStorage.setItem(THREAD_KEY, newThreadId());
        } catch { /* ignore */ }
      }
    }
  };
}

export const chatMessages = createChatStore();
