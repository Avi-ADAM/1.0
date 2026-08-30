<script>
  /**
   * LevSheet — the one full `<LevCard>` a lightweight heart view mounts on
   * demand, over everything else.
   *
   * Both cheap views (the condensed list and the coin field) work the same way:
   * render something small per item, and mount exactly one heavy card when the
   * member opens something. That "one card, over the view, closable five ways"
   * behaviour was written inside `list/LevList.svelte`; the coin field needs it
   * verbatim, so it lives here rather than being copied — two copies of a
   * history-entry dance is two chances for the Android back gesture to start
   * behaving differently in one of the views.
   *
   * Closing is deliberately over-served: the back button, the hardware/browser
   * back gesture (via the history entry this pushes — that is what makes the
   * Tauri Android build behave), Escape, and a drag down on the handle. A view
   * you can only leave one way is a trap on a phone.
   *
   * **The history entry belongs to the sheet's lifetime.** It is pushed when
   * this component mounts and popped when it unmounts, so a caller only has to
   * mount and unmount — there is no way for the two to drift apart, which is
   * what an `open()`/`close()` pair on the caller invites.
   */
  import { t, isRtl } from '$lib/translations';
  import LevCard from './cards/LevCard.svelte';
  import { rowKindKey } from './cards/cardKinds.js';
  // The cards' shared stylesheet, which owns `.swiper-slidec` — the box every
  // card is written to fill. It is a global import, so bringing it in here
  // means a host does not have to remember to.
  import './cards/stylec.css';

  /**
   * @typedef {Object} Props
   * @property {any} item - the DisplayItem to expand
   * @property {any} milon - card-type visibility map (LevCard gates on it)
   * @property {boolean} [low]
   * @property {any[]} [askedarr]
   * @property {any[]} [declineddarr]
   * @property {() => void} onClose - the member left the card
   * @property {(payload: any) => void} [onFinished] - the card reported itself done
   * @property {(payload: any) => void} [onHover]
   * @property {(payload: any) => void} [onProj]
   * @property {(payload: any) => void} [onUser]
   * @property {(payload: any) => void} [onChat]
   */

  /** @type {Props} */
  let {
    item,
    milon,
    low = false,
    askedarr = [],
    declineddarr = [],
    onClose,
    onFinished,
    onHover,
    onProj,
    onUser,
    onChat
  } = $props();

  /**
   * One history entry, for as long as this sheet exists.
   *
   * `popped` guards the teardown: when the member left *via* the back gesture
   * the entry is already gone, and calling `history.back()` again would take
   * them out of the heart entirely.
   */
  $effect(() => {
    let pushed = false;
    let popped = false;
    try {
      history.pushState({ levCard: true }, '');
      pushed = true;
    } catch {
      /* history is unavailable in some embedded webviews; ✕ and Escape remain */
    }

    const onPop = () => {
      popped = true;
      onClose?.();
    };
    const onKey = (/** @type {KeyboardEvent} */ e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKey);
      if (!pushed || popped) return;
      try {
        if (history.state?.levCard) history.back();
      } catch {
        /* ignore */
      }
    };
  });

  // ── drag-down-to-close ────────────────────────────────────────────────────
  // Bound to the handle strip only. Putting it on the whole sheet would fight
  // the card's own internal scrolling, which is where every card puts its body.
  const CLOSE_AT = 90;
  let dragStart = null;
  let dragY = $state(0);

  function dragBegin(e) {
    dragStart = e.touches?.[0]?.clientY ?? null;
  }
  function dragMove(e) {
    if (dragStart === null) return;
    const y = e.touches?.[0]?.clientY ?? dragStart;
    dragY = Math.max(0, y - dragStart);
  }
  function dragEnd() {
    if (dragStart === null) return;
    dragStart = null;
    if (dragY > CLOSE_AT) onClose?.();
    else dragY = 0;
  }
</script>

<!--
  The drag transform is applied only while a finger is actually moving the
  sheet. A permanent `translateY(0px)` is still a transform, and a transformed
  ancestor becomes the containing block for every `position: fixed` descendant
  — which re-anchors any modal a card opens inline to this box and lets
  `.sheet-body`'s `overflow: hidden` clip it. `none` while at rest keeps those
  modals anchored to the viewport, where they were written to live. The
  compositor hint rides along with it — `will-change: transform` establishes
  the same containing block in Chrome.
-->
<div
  class="sheet"
  style:transform={dragY ? `translateY(${dragY}px)` : 'none'}
  style:will-change={dragY ? 'transform' : 'auto'}
  dir={$isRtl ? 'rtl' : 'ltr'}
>
  <div
    class="handle"
    role="presentation"
    ontouchstart={dragBegin}
    ontouchmove={dragMove}
    ontouchend={dragEnd}
    ontouchcancel={dragEnd}
  >
    <button
      type="button"
      class="back"
      aria-label={$t('lev.list.back')}
      onclick={() => onClose?.()}
    >
      {$isRtl ? '→' : '←'}
    </button>
    <span class="handle-title">{$t(rowKindKey(item))}</span>
    <span class="grip" aria-hidden="true"></span>
  </div>

  <div class="sheet-body">
    <div class="swiper-slidec">
      <LevCard
        buble={item}
        {milon}
        {low}
        {askedarr}
        {declineddarr}
        isVisible={true}
        {onHover}
        {onProj}
        {onUser}
        {onChat}
        onCoinLapach={(payload) => onFinished?.(payload)}
      />
    </div>
  </div>
</div>

<style>
  .sheet {
    position: fixed;
    inset: 0;
    z-index: 900;
    display: flex;
    flex-direction: column;
    background: #fdfcf4;
  }
  :global(html.dark) .sheet {
    background: #0a0904;
  }

  .handle {
    flex: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    touch-action: none;
  }
  :global(html.dark) .handle {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .back {
    width: 2.25rem;
    height: 2.25rem;
    flex: none;
    border-radius: 9999px;
    font-size: 1.25rem;
    line-height: 1;
    background: rgba(0, 0, 0, 0.05);
    color: #374151;
  }
  :global(html.dark) .back {
    background: rgba(255, 255, 255, 0.1);
    color: #e5e7eb;
  }

  .handle-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: #374151;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  :global(html.dark) .handle-title {
    color: #e5e7eb;
  }

  .grip {
    margin-inline-start: auto;
    width: 2.5rem;
    height: 0.25rem;
    border-radius: 9999px;
    background: rgba(0, 0, 0, 0.15);
  }
  :global(html.dark) .grip {
    background: rgba(255, 255, 255, 0.2);
  }

  .sheet-body {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 0.5rem;
  }
</style>
