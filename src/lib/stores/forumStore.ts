import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { SendTo } from '$lib/send/sendTo.svelte';

export interface ForumMessage {
    id: string | number;
    message: string;
    username: string;
    pic: string;
    timestamp: string | number;
    sentByMe: boolean;
    pending?: boolean;
    what?: boolean;
}

export interface ForumData {
    id: string;
    subject: string;
    messages: ForumMessage[];
    loading: boolean;
    md?: any;
}

// Map of forumId -> ForumData
const { subscribe, update, set } = writable<Record<string, ForumData>>({});

export const forumStore = {
    subscribe,
    set,
    update,

    async initForum(forumId: string, myId?: string | number) {
        console.log('forumId', forumId);
        if (!browser || !forumId) return;
        console.log('forumId 34', forumId);
        // Set loading
        update(store => {
            const existing = store[forumId] || { id: forumId, subject: '', messages: [], loading: true };
            return { ...store, [forumId]: { ...existing, loading: true } };
        });

        try {
            const query = `
            {
                forums(filters: {id:{eq: "${forumId}"}}){
                    data{id attributes{
                        subject 
                        messages(filters:{archived: {ne:true}}){data{id attributes{
                            content when users_permissions_user{data{id attributes{username profilePic{data{attributes{url formats}}}}}}
                        }}}
                    }}
                }
            }
        `;

            const res = await SendTo(query, null);
            const forumData = res.data?.forums?.data?.[0];

            if (forumData) {
                const messages = forumData.attributes.messages.data.map((m: any) => {
                    const userId = m.attributes.users_permissions_user?.data?.id;
                    return {
                        id: m.id,
                        message: m.attributes.content,
                        username: m.attributes.users_permissions_user?.data?.attributes?.username || 'Unknown',
                        pic: m.attributes.users_permissions_user?.data?.attributes?.profilePic?.data?.attributes?.url ||
                            m.attributes.users_permissions_user?.data?.attributes?.profilePic?.data?.attributes?.formats?.thumbnail?.url ||
                            'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png',
                        timestamp: m.attributes.when,
                        sentByMe: String(userId) === String(myId),
                        what: true
                    };
                });

                update(store => ({
                    ...store,
                    [forumId]: {
                        id: forumId,
                        subject: forumData.attributes.subject,
                        messages,
                        loading: false
                    }
                }));
            } else {
                update(store => ({ ...store, [forumId]: { ...store[forumId], loading: false } }));
            }

        } catch (err) {
            console.error('Failed to load forum', err);
            update(store => ({ ...store, [forumId]: { ...store[forumId], loading: false } }));
        }
    },

    addMessage(forumId: string, message: ForumMessage) {
        update(store => {
            const forum = store[forumId];
            if (!forum) {
                // If forum doesn't exist in store yet, we create it
                return {
                    ...store,
                    [forumId]: {
                        id: forumId,
                        subject: '',
                        messages: [message],
                        loading: false
                    }
                };
            }

            const messages = [...forum.messages];

            // 1. Check if message with same ID already exists
            const existingIndex = messages.findIndex(m => String(m.id) === String(message.id));
            if (existingIndex !== -1) {
                messages[existingIndex] = { ...messages[existingIndex], ...message };
                return {
                    ...store,
                    [forumId]: { ...forum, messages }
                };
            }

            // 2. If it's a real message (not pending), try to find a pending message with same content to replace
            if (!message.pending) {
                const pendingIndex = messages.findIndex(m => m.pending && m.message === message.message && m.sentByMe);
                if (pendingIndex !== -1) {
                    messages[pendingIndex] = message;
                    return {
                        ...store,
                        [forumId]: { ...forum, messages }
                    };
                }
            }

            // 3. Otherwise just append
            return {
                ...store,
                [forumId]: {
                    ...forum,
                    messages: [...messages, message]
                }
            };
        });
    }
};
