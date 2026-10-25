<script>
  import { t, isRtl } from '$lib/translations';
  import { isToday } from '$lib/func/uti/isToday.svelte';
  import { lang } from '$lib/stores/lang';
  import { isChatLoading, nowChatId } from '$lib/stores/pendMisMes';
  import Spinner from '$lib/celim/Spinner.svelte';
  import { goto } from '$app/navigation';
  /**
   * @typedef {Object} Props
   * @property {any} [chats]
   * @property {number} [chatId]
   */

  /** @type {Props} */
  let { chats = [], chatId = $bindable(0) } = $props();

  const FALLBACK_PIC =
    'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png';

  function toChat(id) {
    nowChatId.set(id);
    chatId = id;
  }

  /** @param {any} chat */
  const lastOf = (chat) =>
    chat?.messages?.length > 0 ? chat.messages[chat.messages.length - 1] : null;

  /** @param {string | undefined} ts */
  function when(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return isToday(ts)
      ? d.toLocaleTimeString([$lang], { hour: '2-digit', minute: '2-digit', hour12: false })
      : d.toLocaleDateString([$lang], { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
  //TODO: projectName and image as link to moach or publick page from open dialog - do you want to go to ...
</script>

<div dir={$isRtl ? 'rtl' : 'ltr'} class="ls-root">
  {#if $isChatLoading}
    <div class="flex justify-center py-6"><Spinner /></div>
  {/if}

  {#if chats.length === 0 && !$isChatLoading}
    <p class="ls-empty">{$t('common.chat.empty')}</p>
  {:else}
    <ul class="ls-list">
      {#each chats as chat (chat.id)}
        {@const last = lastOf(chat)}
        <li class="ls-item group">
          <button type="button" onclick={() => toChat(chat.id)} class="ls-row">
            <img
              src={chat?.md?.projectPic || FALLBACK_PIC}
              alt=""
              width="40"
              height="40"
              class="ls-pic"
            />
            <span class="ls-body">
              <span class="ls-top">
                <span class="ls-name">{chat?.md?.projectName || chat?.md?.mesimaName || $t('common.chat.missionChat')}</span>
                <span class="ls-time">{when(last?.timestamp)}</span>
              </span>
              {#if chat?.md?.mesimaName && chat?.md?.projectName}
                <span class="ls-sub">{chat.md.mesimaName}</span>
              {/if}
              <span class="ls-last">
                {#if last}
                  <b>{last.username ?? $t('common.chat.system')}:</b>
                  {last.message ?? ''}
                {:else}
                  {$t('common.chat.noMessages')}
                {/if}
              </span>
            </span>
          </button>
          <button
            type="button"
            onclick={() => goto('/forum/' + chat.id)}
            title={$t('common.chat.openFull')}
            aria-label={$t('common.chat.openFull')}
            class="ls-open"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .ls-root {
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0.375rem;
    /* Carries its own surface: the deals pages mount it outside the dock. */
    background: rgb(17 24 39);
  }
  .ls-empty {
    padding: 2rem 1.25rem;
    text-align: center;
    font-size: 0.875rem;
    line-height: 1.5;
    color: rgb(209 213 219);
  }
  .ls-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ls-item {
    position: relative;
  }
  .ls-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.625rem 0.625rem;
    padding-inline-end: 2.25rem;
    border-radius: 0.75rem;
    text-align: start;
    transition: background-color 120ms;
  }
  .ls-row:hover {
    background: rgb(255 255 255 / 0.06);
  }
  .ls-row:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: -2px;
  }
  .ls-pic {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 9999px;
    object-fit: cover;
    box-shadow: 0 0 0 1px rgb(255 255 255 / 0.1);
  }
  .ls-body {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
    gap: 1px;
  }
  .ls-top {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }
  .ls-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #fff;
  }
  .ls-time {
    flex-shrink: 0;
    font-size: 0.6875rem;
    color: rgb(156 163 175);
    font-variant-numeric: tabular-nums;
  }
  .ls-sub {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.75rem;
    color: var(--gold);
  }
  .ls-last {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.8125rem;
    color: rgb(209 213 219);
  }
  .ls-last b {
    font-weight: 600;
    color: rgb(229 231 235);
  }
  .ls-open {
    position: absolute;
    top: 50%;
    inset-inline-end: 0.375rem;
    transform: translateY(-50%);
    padding: 0.375rem;
    border-radius: 0.5rem;
    color: rgb(156 163 175);
    opacity: 0.6;
    transition: opacity 120ms, color 120ms, background-color 120ms;
  }
  .ls-item:hover .ls-open,
  .ls-open:focus-visible {
    opacity: 1;
  }
  .ls-open:hover {
    color: var(--gold);
    background: rgb(255 255 255 / 0.08);
  }
</style>
