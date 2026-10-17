<script>
  import { onMount } from 'svelte';
  import { t, isRtl } from '$lib/translations';

  /**
   * The *share moment* — a card that appears right after someone did the thing
   * that gives them a reason to spread the link (signed a threshold offer,
   * joined a pool, saw it reach its threshold), with the message already
   * written. PLAN_MARKETING_GLOBAL §4, loop 1: "after a signature → 'want this
   * to happen? share — 3 more to go'; on reaching the threshold → a shareable
   * celebration".
   *
   * It is deliberately not the generic share dropdown (`ShareLink`): that one
   * is for a reader; this one speaks to a participant, names the number that
   * is missing, and leads with the two apps a link actually travels in here —
   * WhatsApp and Telegram — plus copy and the native sheet on phones.
   *
   * @typedef {Object} Props
   * @property {string} url - the canonical public address (https://1lev1.com/…, never page.url).
   * @property {string} message - the full prefilled text, link included.
   * @property {string} title
   * @property {string} [body]
   * @property {'nudge'|'celebrate'|'supplier'} [variant]
   * @property {() => void} [onDismiss] - when given, a small close control is shown.
   */

  /** @type {Props} */
  let { url, message, title, body = '', variant = 'nudge', onDismiss = undefined } = $props();

  let canNative = $state(false);
  let copied = $state(false);
  onMount(() => {
    canNative = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  });

  const encMessage = $derived(encodeURIComponent(message));
  // Telegram takes the link and the words apart; the words must not repeat it.
  const words = $derived(message.replace(url, '').replace(/\s+$/, '').trim());
  const whatsapp = $derived(`https://wa.me/?text=${encMessage}`);
  const telegram = $derived(
    `https://telegram.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(words)}`
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      copied = true;
      setTimeout(() => (copied = false), 2200);
    } catch {
      copied = false;
    }
  }

  async function native() {
    try {
      await navigator.share({ title, text: words, url });
    } catch {
      // The sheet was closed — nothing to do.
    }
  }
</script>

<aside class="share-prompt {variant}" dir={$isRtl ? 'rtl' : 'ltr'} aria-live="polite">
  <div class="sp-head">
    <div class="sp-text">
      <strong class="sp-title">{title}</strong>
      {#if body}<p class="sp-body">{body}</p>{/if}
    </div>
    {#if onDismiss}
      <button type="button" class="sp-x" onclick={onDismiss} aria-label={$t('ui.share.dismiss')}>×</button>
    {/if}
  </div>

  <div class="sp-actions">
    <a class="sp-btn wa" href={whatsapp} target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M20.5 3.5A11 11 0 0 0 3.2 16.8L2 22l5.3-1.4A11 11 0 1 0 20.5 3.5Zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-3.1.8.8-3-.2-.3A9 9 0 1 1 12 20.5Zm5-6.7c-.3-.1-1.6-.8-1.9-.9s-.4-.1-.6.1-.7.9-.9 1.1-.3.2-.6.1a7.4 7.4 0 0 1-3.6-3.2c-.3-.5.3-.4.8-1.5.1-.2 0-.3 0-.5l-.9-2c-.2-.5-.4-.5-.6-.5h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-1 2.3c0 1.4 1 2.7 1.1 2.9s2 3.1 4.9 4.3c1.8.8 2.5.8 3.4.7.6-.1 1.6-.7 1.9-1.3s.3-1.2.2-1.3-.3-.2-.6-.3Z"/></svg>
      {$t('ui.share.whatsapp')}
    </a>
    <a class="sp-btn tg" href={telegram} target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M21.9 4.6 18.7 19.7c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.5-.6-.2L6.2 13.4l-4.8-1.5c-1-.3-1-1 .2-1.5L20.5 3.1c.9-.3 1.6.2 1.4 1.5Z"/></svg>
      {$t('ui.share.telegram')}
    </a>
    <button type="button" class="sp-btn" onclick={copy}>
      {copied ? $t('ui.share.copied') : $t('ui.share.copy')}
    </button>
    {#if canNative}
      <button type="button" class="sp-btn ghost" onclick={native}>{$t('ui.share.more')}</button>
    {/if}
  </div>
</aside>

<style>
  .share-prompt {
    border-radius: 1rem;
    padding: 0.9rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    border: 1px solid rgba(124, 58, 237, 0.35);
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(236, 72, 153, 0.08));
  }
  .share-prompt.celebrate {
    border-color: rgba(5, 150, 105, 0.5);
    background: linear-gradient(135deg, rgba(5, 150, 105, 0.12), rgba(91, 226, 169, 0.1));
  }
  .share-prompt.supplier {
    border-color: rgba(234, 179, 8, 0.5);
    background: linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(249, 115, 22, 0.08));
  }
  .sp-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.6rem;
  }
  .sp-title {
    font-size: 1rem;
    font-weight: 800;
  }
  .sp-body {
    margin: 0.25rem 0 0;
    font-size: 0.88rem;
    opacity: 0.85;
  }
  .sp-x {
    background: transparent;
    border: none;
    font-size: 1.3rem;
    line-height: 1;
    cursor: pointer;
    opacity: 0.55;
    padding: 0 0.2rem;
  }
  .sp-x:hover {
    opacity: 1;
  }
  .sp-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .sp-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border-radius: 9999px;
    padding: 0.45rem 1rem;
    font-weight: 700;
    font-size: 0.88rem;
    text-decoration: none;
    cursor: pointer;
    border: 1px solid rgba(120, 120, 160, 0.35);
    background: rgba(255, 255, 255, 0.6);
    color: inherit;
  }
  .sp-btn.wa {
    background: #25d366;
    border-color: #25d366;
    color: #fff;
  }
  .sp-btn.tg {
    background: #229ed9;
    border-color: #229ed9;
    color: #fff;
  }
  .sp-btn.ghost {
    background: transparent;
  }
  :global(.dark) .sp-btn:not(.wa):not(.tg) {
    background: rgba(255, 255, 255, 0.08);
  }
</style>
