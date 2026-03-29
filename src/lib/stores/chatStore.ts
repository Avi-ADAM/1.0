import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface BotMessage {
  text: string;
  user: boolean;
}

const STORAGE_KEY = 'bot_message_history';

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
    clear() {
      set([]);
    }
  };
}

export const chatMessages = createChatStore();
