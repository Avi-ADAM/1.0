<script lang="ts">
  import Money from '$lib/components/money/Money.svelte';
  import { isRtl } from '$lib/translations';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  /**
   * AcceptWishOffer — PLAN_CONCIERGE §5.3
   *
   * The invited provider sees a READY offer (the mission/resource the customer
   * already authored) and approves their placement. No weave picking, no
   * creation — the slot already exists; approving just assigns them
   * (`acceptWishOffer`). Two primary actions: view the full picture on the wish
   * page, or approve on the spot. Negotiation is a placeholder for later.
   *
   * Reusable from /deals, /lev and the wish page — owns no page state.
   */
  import { lang } from '$lib/stores/lang.js';
  import { executeAction } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  // `t` below is this component's own dictionary; the shared translations are `tr`.
  import { t as tr } from '$lib/translations';
  import { refuseCounter } from '$lib/wish/proposalRounds';

  type WishItem = {
    kind: 'mission' | 'resource';
    name: string;
    hours?: number | null;
    price?: number | null;
  };

  /** The terms negotiation from the provider's side (src/lib/server/wish/negotiationView.ts). */
  type Negotiation = {
    canCounter: boolean;
    round: number;
    yourTurn: boolean;
    amount: number | null;
    price: number | null;
    counters: { round: number; by: 'wisher' | 'provider'; amount: number | null; price: number | null; note: string }[];
  };

  let {
    proposalId,
    ratsonId,
    item,
    negotiation = null,
    onClose,
    onDone
  }: {
    proposalId: string;
    ratsonId: string;
    item: WishItem;
    negotiation?: Negotiation | null;
    onClose?: () => void;
    onDone?: (result: { accepted: boolean }) => void;
  } = $props();

  type Step = 'view' | 'counter' | 'submitting' | 'done' | 'countered' | 'error';
  let step = $state<Step>('view');
  let errorMsg = $state('');
  let declining = $state(false);

  // It is the provider's move unless they signed last (they countered, or it is
  // their own volunteer offer): then they wait for the wisher.
  const myTurn = $derived(negotiation ? negotiation.yourTurn : true);
  const canCounter = $derived(negotiation ? negotiation.canCounter : true);
  const lastNote = $derived(negotiation?.counters.at(-1)?.note ?? '');

  /* ── The counter: the way to say "not on these terms" (QA C-9) ── */
  let counterHours = $state<number | string>('');
  let counterPrice = $state<number | string>('');
  let counterNote = $state('');
  let counterBusy = $state(false);
  const counterRefusal = $derived(
    refuseCounter(
      { amount: item.hours ?? null, price: item.price ?? null },
      {
        amount: counterHours === '' ? undefined : counterHours,
        price: counterPrice === '' ? undefined : counterPrice
      },
      counterNote
    )
  );

  function openCounter() {
    counterHours = item.hours ?? '';
    counterPrice = item.price ?? '';
    counterNote = '';
    errorMsg = '';
    step = 'counter';
  }

  async function sendCounter() {
    if (counterBusy || counterRefusal) return;
    counterBusy = true;
    errorMsg = '';
    try {
      const res = await executeAction('counterRatsonProposal' as any, {
        proposalId,
        ratsonId,
        ...(counterHours !== '' ? { hours: Number(counterHours) } : {}),
        ...(counterPrice !== '' ? { price: Number(counterPrice) } : {}),
        note: counterNote.trim()
      });
      if (!res?.success) throw new Error(res?.error?.message || 'failed');
      step = 'countered';
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : $tr('deals.negError');
    } finally {
      counterBusy = false;
    }
  }

  const T = {
    he: {
      titleM: 'הצעת משימה עבורך',
      titleR: 'הצעת משאב עבורך',
      intro: 'ההצעה מוכנה עבורך. אפשר לראות את התמונה המלאה, או לאשר את ההשמה שלך כאן.',
      hours: 'שעות',
      budget: 'תקציב',
      full: 'לתמונה המלאה',
      approve: 'אני בפנים - אישור השמה',
      decline: 'לא מתאים לי',
      submitting: 'אישור ההשמה…',
      doneTitle: 'אישרת את ההשמה',
      doneBody: 'נכנסת כספק/ית למשימה. נשלחה התראה ליוזמ/ת המשאלה. הרקמה תיווצר כשכל המקומות יתמלאו.',
      close: 'סגירה',
      errTitle: 'משהו השתבש',
      retry: 'נסו שוב'
    },
    en: {
      titleM: 'A task offer for you',
      titleR: 'A resource offer for you',
      intro: 'The wisher prepared a ready offer for you. See the full picture, or approve your placement here.',
      hours: 'hours',
      budget: 'Budget',
      full: 'Full picture',
      approve: "I'm in - approve placement",
      decline: 'Not for me',
      submitting: 'Approving your placement…',
      doneTitle: 'Placement approved',
      doneBody: "You joined the task as provider. The wisher was notified. The weave is created once all slots are filled.",
      close: 'Close',
      errTitle: 'Something went wrong',
      retry: 'Try again'
    }
  } as const;
  const t = $derived($lang === 'en' ? T.en : T.he);
  const dir = $derived($isRtl ? 'rtl' : 'ltr');
  const wishHref = $derived(`/wish/${ratsonId}`);

  async function approve() {
    step = 'submitting';
    errorMsg = '';
    try {
      const res = await executeAction('acceptWishOffer' as any, { proposalId, ratsonId });
      if (!res?.success) throw new Error(res?.error?.message || 'failed');
      step = 'done';
      onDone?.({ accepted: true });
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : 'error';
      step = 'error';
    }
  }

  async function decline() {
    declining = true;
    try {
      const res = await executeAction('declineWishOffer' as any, { proposalId, ratsonId });
      if (!res?.success) throw new Error(res?.error?.message || 'failed');
      toast.success($lang === 'en' ? 'Declined' : 'נדחה');
      onDone?.({ accepted: false });
      onClose?.();
    } catch (e) {
      toast.error($lang === 'en' ? 'Could not decline' : 'הדחייה נכשלה');
    } finally {
      declining = false;
    }
  }
</script>

<div class="ofr-overlay" role="dialog" aria-modal="true" {dir}>
  <div class="ofr-card">
    <button class="ofr-x" onclick={() => onClose?.()} aria-label={t.close}>✕</button>

    <div class="ofr-head">
      <span class="ofr-gem"></span>
      <h2 class="ofr-title">{item.kind === 'mission' ? t.titleM : t.titleR}</h2>
    </div>

    {#if step === 'view'}
      <p class="ofr-intro">{t.intro}</p>

      <div class="ofr-offer">
        <div class="ofr-offer-name">{item.name}</div>
        <div class="ofr-offer-meta">
          {#if item.hours}<span><EntityIcon kind="timer" size={13} /> {item.hours} {t.hours}</span>{/if}
          {#if item.price != null}<span><EntityIcon kind="money" size={13} /> <Money amount={item.price} /></span>{/if}
        </div>
      </div>

      {#if negotiation && negotiation.counters.length > 0}
        <!-- What was said so far: there is no flat "no" here, the terms go round. -->
        <div class="ofr-neg-log">
          {#each negotiation.counters as c (c.round)}
            <p>
              ⇄ {c.amount ?? '—'}{item.kind === 'mission' ? ` ${t.hours}` : ' ×'}
              · {c.price ?? '—'}
              {#if c.note}— {c.note}{/if}
            </p>
          {/each}
        </div>
      {/if}

      {#if myTurn}
        <div class="ofr-actions">
          <a class="ofr-btn ofr-btn--ghost" href={wishHref}>{t.full}</a>
          <button class="ofr-btn ofr-btn--primary" onclick={approve}>
            {negotiation && negotiation.round > 0 ? $tr('deals.negApproveTheirs') : t.approve}
          </button>
        </div>
        {#if canCounter}
          <button class="ofr-nego" onclick={openCounter} type="button">⇄ {$tr('deals.negTitle')}</button>
        {/if}
      {:else}
        <!-- They signed last (their own counter, or their own volunteer offer): the
             wisher answers. -->
        <p class="ofr-waiting">{$tr('deals.negWaiting')}</p>
        {#if lastNote}<p class="ofr-waiting-note">“{lastNote}”</p>{/if}
        <div class="ofr-actions">
          <a class="ofr-btn ofr-btn--ghost" href={wishHref}>{t.full}</a>
        </div>
      {/if}
      <button class="ofr-decline" onclick={decline} disabled={declining}>{t.decline}</button>

    {:else if step === 'counter'}
      <p class="ofr-intro">{$tr('deals.negHint')}</p>
      <form
        class="ofr-form"
        onsubmit={(e) => {
          e.preventDefault();
          sendCounter();
        }}
      >
        <div class="ofr-offer-name">{item.name}</div>
        <div class="ofr-fields">
          <label>
            {item.kind === 'resource' ? $tr('deals.negQty') : $tr('deals.negHours')}
            <input type="number" min="0" step="0.25" bind:value={counterHours} disabled={counterBusy} />
          </label>
          <label>
            {$tr('deals.negPrice')}
            <input type="number" min="0" step="1" bind:value={counterPrice} disabled={counterBusy} />
          </label>
        </div>
        <label>
          {$tr('deals.negNote')}
          <textarea
            rows="3"
            bind:value={counterNote}
            placeholder={$tr('deals.negNotePh')}
            disabled={counterBusy}
          ></textarea>
        </label>
        {#if errorMsg}<p class="ofr-form-error" role="alert">{errorMsg}</p>{/if}
        <div class="ofr-actions">
          <button type="button" class="ofr-btn ofr-btn--ghost" disabled={counterBusy} onclick={() => (step = 'view')}>
            {$tr('deals.negBack')}
          </button>
          <button type="submit" class="ofr-btn ofr-btn--primary" disabled={counterBusy || !!counterRefusal}>
            {counterBusy ? '…' : $tr('deals.negSend')}
          </button>
        </div>
      </form>

    {:else if step === 'countered'}
      <div class="ofr-done">
        <div class="ofr-done-icon"><EntityIcon kind="done" size={40} /></div>
        <h3 class="ofr-done-title">{$tr('deals.negSentTitle')}</h3>
        <p class="ofr-done-body">{$tr('deals.negSentBody')}</p>
        <button
          class="ofr-btn ofr-btn--primary"
          onclick={() => {
            onDone?.({ accepted: false });
            onClose?.();
          }}>{t.close}</button
        >
      </div>

    {:else if step === 'submitting'}
      <div class="ofr-state">{t.submitting}</div>

    {:else if step === 'done'}
      <div class="ofr-done">
        <div class="ofr-done-icon"><EntityIcon kind="done" size={40} /></div>
        <h3 class="ofr-done-title">{t.doneTitle}</h3>
        <p class="ofr-done-body">{t.doneBody}</p>
        <button class="ofr-btn ofr-btn--primary" onclick={() => onClose?.()}>{t.close}</button>
      </div>

    {:else if step === 'error'}
      <div class="ofr-state">
        <div class="ofr-err-title">{t.errTitle}</div>
        <div class="ofr-err-msg">{errorMsg}</div>
        <button class="ofr-btn ofr-btn--primary" onclick={() => (step = 'view')}>{t.retry}</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .ofr-overlay {
    position: fixed;
    inset: 0;
    z-index: 1200;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .ofr-card {
    position: relative;
    width: min(520px, 96vw);
    max-height: 92vh;
    overflow: auto;
    background: var(--s1, #14110d);
    border: 1px solid var(--border, #2a241c);
    border-radius: 16px;
    padding: 24px;
  }
  .ofr-x {
    position: absolute;
    inset-inline-end: 14px;
    top: 12px;
    background: transparent;
    border: none;
    color: var(--tm, #9a8f80);
    font-size: 18px;
    cursor: pointer;
  }
  .ofr-head { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; }
  .ofr-gem {
    width: 9px; height: 9px;
    background: linear-gradient(135deg, #ff4d9e, #c8155f);
    transform: rotate(45deg);
    box-shadow: 0 0 10px rgba(255, 77, 158, 0.6);
  }
  .ofr-title { font-size: 19px; font-weight: 800; color: var(--text, #f3ece0); }
  .ofr-intro { font-size: 13px; color: var(--tm, #9a8f80); line-height: 1.55; margin-bottom: 14px; }
  .ofr-offer {
    padding: 14px 16px;
    border-radius: 12px;
    background: var(--s3, #1d1812);
    border: 1px solid var(--border, #2a241c);
    margin-bottom: 18px;
  }
  .ofr-offer-name { font-size: 16px; font-weight: 700; color: var(--gold-l, #e8d59a); margin-bottom: 6px; }
  .ofr-offer-meta { display: flex; gap: 14px; font-size: 12.5px; color: var(--tm, #9a8f80); }
  .ofr-actions { display: flex; gap: 10px; margin-bottom: 10px; }
  .ofr-btn {
    flex: 1;
    padding: 11px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    text-align: center;
    text-decoration: none;
    border: 1px solid transparent;
    font-family: 'Heebo', sans-serif;
  }
  .ofr-btn--ghost {
    background: var(--s2, #181410);
    border-color: var(--border, #2a241c);
    color: var(--text, #f3ece0);
    display: flex; align-items: center; justify-content: center;
  }
  .ofr-btn--primary {
    background: var(--pink-d, rgba(255, 100, 150, 0.14));
    border-color: rgba(255, 77, 158, 0.4);
    color: var(--pink-l, #ff6496);
  }
  .ofr-btn--primary:hover { background: rgba(255, 77, 158, 0.22); }
  .ofr-nego {
    width: 100%;
    padding: 9px;
    border-radius: 9px;
    background: transparent;
    border: 1px dashed var(--border, #2a241c);
    color: var(--td, #6f6557);
    font-size: 12.5px;
    cursor: pointer;
    margin-bottom: 8px;
  }
  .ofr-decline {
    width: 100%;
    padding: 8px;
    background: transparent;
    border: none;
    color: var(--td, #6f6557);
    font-size: 12px;
    cursor: pointer;
  }
  .ofr-decline:hover { color: var(--tm, #9a8f80); }

  /* the terms negotiation (C-9) */
  .ofr-neg-log {
    margin: 0 0 12px;
    padding: 10px 12px;
    border: 1px dashed var(--border, #2a241c);
    border-radius: 10px;
  }
  .ofr-neg-log p { margin: 0; font-size: 12.5px; line-height: 1.55; color: var(--tm, #9a8f80); }
  .ofr-waiting { margin: 0 0 6px; font-size: 13.5px; color: var(--gold-l, #e8d59a); }
  .ofr-waiting-note { margin: 0 0 12px; font-size: 12.5px; color: var(--tm, #9a8f80); font-style: italic; }
  .ofr-form { display: flex; flex-direction: column; gap: 10px; }
  .ofr-fields { display: flex; gap: 10px; }
  .ofr-fields label { flex: 1; }
  .ofr-form label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--tm, #9a8f80); }
  .ofr-form input,
  .ofr-form textarea {
    background: var(--s2, #1b1711);
    color: var(--text, #f1e9d8);
    border: 1px solid var(--border, #2a241c);
    border-radius: 8px;
    padding: 8px 10px;
    font: inherit;
    font-size: 14px;
  }
  .ofr-form input:focus-visible,
  .ofr-form textarea:focus-visible { outline: 2px solid var(--gold-l, #e8d59a); outline-offset: 1px; }
  .ofr-form-error { margin: 0; font-size: 12.5px; color: var(--pink-l, #ff7aa8); }
  .ofr-state { text-align: center; padding: 28px 12px; color: var(--tm, #9a8f80); font-size: 14px; }
  .ofr-done { text-align: center; padding: 14px 6px; }
  .ofr-done-icon { font-size: 38px; margin-bottom: 8px; }
  .ofr-done-title { font-size: 18px; font-weight: 800; color: var(--text, #f3ece0); margin-bottom: 6px; }
  .ofr-done-body { font-size: 13px; color: var(--tm, #9a8f80); line-height: 1.55; margin-bottom: 16px; }
  .ofr-err-title { font-size: 16px; font-weight: 700; color: var(--pink-l, #ff6496); margin-bottom: 6px; }
  .ofr-err-msg { font-size: 12.5px; color: var(--tm, #9a8f80); margin-bottom: 14px; word-break: break-word; }
</style>
