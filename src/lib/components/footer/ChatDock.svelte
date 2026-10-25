<script>
  // The floating chat panel the footer's chat tab opens. It is `position: fixed`
  // — it used to be `absolute; top: 0` inside the page, so a reader who had
  // scrolled opened it out of sight at the top of the document and dragging it
  // moved it with the page. Dragging is by the header only (the list and the
  // messages keep native touch scrolling) and is clamped to the viewport; the
  // spot a member drags it to is remembered per browser. Double-clicking the
  // header puts it back in its corner above the footer bar.
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { t, isRtl } from '$lib/translations';
  import { nowChatId } from '$lib/stores/pendMisMes.js';
  import { isOnline, myUserMeeting } from '$lib/stores/pgishot';
  import OnlineSwitch from '$lib/celim/onlineSwitch.svelte';
  import ChatSmall from './chatSmall.svelte';

  /**
   * @typedef {Object} Props
   * @property {any} un
   * @property {number} [chatId]
   * @property {() => void} onClose
   * @property {() => void} onNewMeeting
   */

  /** @type {Props} */
  let { un, chatId = $bindable(0), onClose, onNewMeeting } = $props();

  const POS_KEY = 'chatDock.pos';
  const MARGIN = 8;

  /** @type {HTMLDivElement | undefined} */
  let panel = $state();
  /** Top-left corner in viewport px once dragged; null = docked in its corner. */
  /** @type {{ x: number, y: number } | null} */
  let pos = $state(null);
  let minimized = $state(false);
  let dragging = $state(false);
  /** @type {{ dx: number, dy: number, id: number } | null} */
  let grab = null;

  /** @param {number} x @param {number} y */
  function clamp(x, y) {
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const w = panel?.offsetWidth ?? 0;
    const h = panel?.offsetHeight ?? 0;
    return {
      x: Math.round(Math.min(Math.max(MARGIN, x), Math.max(MARGIN, vw - w - MARGIN))),
      y: Math.round(Math.min(Math.max(MARGIN, y), Math.max(MARGIN, vh - h - MARGIN)))
    };
  }

  function reclamp() {
    if (pos) {
      const next = clamp(pos.x, pos.y);
      if (next.x !== pos.x || next.y !== pos.y) pos = next;
    }
  }

  function save() {
    try {
      if (pos) localStorage.setItem(POS_KEY, JSON.stringify(pos));
      else localStorage.removeItem(POS_KEY);
    } catch {}
  }

  onMount(() => {
    try {
      const raw = localStorage.getItem(POS_KEY);
      const p = raw ? JSON.parse(raw) : null;
      if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) pos = clamp(p.x, p.y);
    } catch {}
    // A rotated phone or a narrowed window must never strand it off-screen, and
    // neither may its own size changing (expanding from minimized, a chat that
    // swaps in for the list).
    const ro = new ResizeObserver(reclamp);
    if (panel) ro.observe(panel);
    window.addEventListener('resize', reclamp);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', reclamp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  });

  /** @param {PointerEvent} e */
  function onPointerDown(e) {
    if (e.button !== 0 || !panel) return;
    if (/** @type {HTMLElement} */ (e.target).closest('button, input, label, a')) return;
    e.preventDefault();
    const r = panel.getBoundingClientRect();
    grab = { dx: e.clientX - r.left, dy: e.clientY - r.top, id: e.pointerId };
    // Tracked on the window, not by pointer capture alone: a fast pointer that
    // outruns the header must keep dragging it.
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    dragging = true;
  }

  /** @param {PointerEvent} e */
  function onPointerMove(e) {
    if (!grab || e.pointerId !== grab.id) return;
    pos = clamp(e.clientX - grab.dx, e.clientY - grab.dy);
  }

  /** @param {PointerEvent} e */
  function onPointerUp(e) {
    if (!grab || e.pointerId !== grab.id) return;
    grab = null;
    dragging = false;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    save();
  }

  function resetPosition() {
    pos = null;
    save();
  }

  /** @param {KeyboardEvent} e */
  function onKeydown(e) {
    if (e.key === 'Escape') onClose();
  }

  /** @param {{ checked: boolean }} e */
  async function onlineSwitcher(e) {
    const changedTo = e.checked;
    console.log('Changing online status to:', changedTo, 'My UserMeeting ID:', $myUserMeeting);

    // Optimistic update
    isOnline.set(changedTo);

    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'toggleOnline',
          params: {
            status: changedTo
          }
        })
      });

      const res = await response.json();
      if (!res.success) {
        console.error('Failed to toggle online status:', res.error);
        // Revert on failure
        isOnline.set(!changedTo);
      }
    } catch (err) {
      console.error('Error calling toggleOnline:', err);
      isOnline.set(!changedTo);
    }
  }

  function openFull() {
    onClose();
    goto($nowChatId != 0 ? '/forum/' + $nowChatId : '/forum');
  }

</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  bind:this={panel}
  role="dialog"
  aria-label={$t('common.chat.title')}
  tabindex="-1"
  dir={$isRtl ? 'rtl' : 'ltr'}
  onkeydown={onKeydown}
  transition:fly={{ y: 16, duration: 180 }}
  class="cd-panel"
  class:cd-min={minimized}
  class:cd-docked={!pos}
  class:cd-dragging={dragging}
  style={pos ? `left:${pos.x}px; top:${pos.y}px;` : undefined}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <header
    class="cd-head"
    title={$t('common.chat.drag')}
    onpointerdown={onPointerDown}
    ondblclick={resetPosition}
  >
    <span class="cd-grip" aria-hidden="true">
      <svg viewBox="0 0 10 16" width="10" height="16" fill="currentColor">
        <circle cx="2" cy="2" r="1.5" /><circle cx="8" cy="2" r="1.5" />
        <circle cx="2" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
        <circle cx="2" cy="14" r="1.5" /><circle cx="8" cy="14" r="1.5" />
      </svg>
    </span>

    {#if $nowChatId != 0 && !minimized}
      <button
        type="button"
        class="cd-btn"
        onclick={() => ($nowChatId = 0)}
        title={$t('common.chat.backToList')}
        aria-label={$t('common.chat.backToList')}
      >
        <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" style={$isRtl ? '' : 'transform: scaleX(-1)'}>
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6" />
        </svg>
      </button>
    {/if}

    <span class="cd-title">{$t('common.chat.title')}</span>

    <OnlineSwitch
      title={$t('common.chat.onlineStatus')}
      bind:checked={$isOnline}
      onChange={onlineSwitcher}
    />

    <button
      type="button"
      class="cd-btn"
      onclick={onNewMeeting}
      title={$t('common.chat.newMeeting')}
      aria-label={$t('common.chat.newMeeting')}
    >
      <svg viewBox="0 0 24 24" class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18M12 13v5M9.5 15.5h5" />
      </svg>
    </button>

    <button
      type="button"
      class="cd-btn"
      onclick={openFull}
      title={$t('common.chat.openFull')}
      aria-label={$t('common.chat.openFull')}
    >
      <svg viewBox="0 0 24 24" class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </button>

    <button
      type="button"
      class="cd-btn"
      onclick={() => (minimized = !minimized)}
      title={minimized ? $t('common.chat.expand') : $t('common.chat.minimize')}
      aria-label={minimized ? $t('common.chat.expand') : $t('common.chat.minimize')}
      aria-expanded={!minimized}
    >
      <svg viewBox="0 0 24 24" class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        {#if minimized}
          <path d="M6 15l6-6 6 6" />
        {:else}
          <path d="M5 12h14" />
        {/if}
      </svg>
    </button>

    <button
      type="button"
      class="cd-btn"
      onclick={onClose}
      title={$t('common.chat.close')}
      aria-label={$t('common.chat.close')}
    >
      <svg viewBox="0 0 24 24" class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  </header>

  <!-- Hidden, not unmounted, when minimized: an unsent draft and the scroll
       position survive collapsing it. -->
  <div class="cd-body" hidden={minimized}>
    <ChatSmall bind:chatId {un} />
  </div>
</div>

<style>
  .cd-panel {
    position: fixed;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    width: min(360px, calc(100vw - 16px));
    height: min(540px, calc(100dvh - var(--foot-h, 4.5rem) - 24px));
    min-height: 280px;
    overflow: hidden;
    border-radius: 1rem;
    background: rgb(17 24 39);
    border: 1px solid rgb(255 255 255 / 0.08);
    box-shadow:
      0 20px 50px -12px rgb(0 0 0 / 0.55),
      0 0 0 1px rgb(0 0 0 / 0.2);
    outline: none;
  }
  .cd-panel.cd-min {
    height: auto;
    min-height: 0;
  }
  .cd-panel.cd-dragging {
    box-shadow:
      0 28px 60px -12px rgb(0 0 0 / 0.65),
      0 0 0 1px var(--gold);
  }
  /* Its corner: above the footer bar, at the start side — the bot bubble
     docks at the end corner. */
  .cd-docked {
    bottom: calc(var(--foot-h, 4.5rem) + 12px);
    inset-inline-start: 12px;
  }
  @media (max-width: 400px) {
    .cd-docked {
      inset-inline-start: 8px;
    }
  }

  .cd-head {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
    height: 2.75rem;
    padding-inline: 0.5rem 0.375rem;
    background: rgb(31 41 55);
    border-bottom: 1px solid rgb(255 255 255 / 0.06);
    cursor: grab;
    /* Only the header claims the gesture; the list and messages still scroll. */
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }
  .cd-dragging .cd-head {
    cursor: grabbing;
  }
  .cd-min .cd-head {
    border-bottom: 0;
  }
  .cd-grip {
    display: flex;
    padding-inline: 0.125rem 0.25rem;
    color: rgb(156 163 175);
  }
  .cd-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--gold);
  }
  .cd-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    color: rgb(209 213 219);
    cursor: pointer;
    transition: background-color 120ms, color 120ms;
  }
  .cd-btn:hover {
    background: rgb(255 255 255 / 0.08);
    color: var(--gold);
  }
  .cd-btn:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: -2px;
  }

  .cd-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .cd-body[hidden] {
    display: none;
  }
  .cd-body > :global(*) {
    flex: 1;
    min-height: 0;
  }
</style>
