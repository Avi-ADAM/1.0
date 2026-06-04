<script lang="ts">
  /**
   * AcceptWishOffer — PLAN_CONCIERGE §5.3
   *
   * Reusable modal for an invited provider responding to a wish invitation.
   * Flow: pick a hosting weave → create the real contribution with the existing
   * creators (`mission.svelte` / `ResourceCreator.svelte`, prefilled from the
   * wish need) → `acceptWishOffer` binds it as a BOM line of the wish's
   * aggregator complex matanot. Decline → `declineWishOffer`.
   *
   * Designed to be opened from /deals, /lev and the wish page alike — it owns no
   * page state; the host passes the invitation + the provider's weaves.
   */
  import { lang } from '$lib/stores/lang.js';
  import { executeAction } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import Mission from '$lib/components/prPr/mission.svelte';
  import ResourceCreator from '$lib/components/resource/ResourceCreator.svelte';

  type Weave = {
    id: string;
    name: string;
    src?: string;
    memberCount?: number;
    restime?: string;
    memberIds?: string[];
  };
  type WishItem = {
    kind: 'mission' | 'resource';
    idx: number;
    name: string;
    hours?: number | null;
    quantity?: number | null;
  };

  let {
    proposalId,
    ratsonId,
    item,
    weaves = [],
    onClose,
    onDone
  }: {
    proposalId: string;
    ratsonId: string;
    item: WishItem;
    weaves?: Weave[];
    onClose?: () => void;
    onDone?: (result: { accepted: boolean }) => void;
  } = $props();

  type Step = 'pickWeave' | 'create' | 'submitting' | 'done' | 'error';
  let step = $state<Step>('pickWeave');
  let chosen = $state<Weave | null>(null);
  let errorMsg = $state('');
  let declining = $state(false);

  const T = {
    he: {
      titleM: 'להציע משימה למשאלה',
      titleR: 'להציע משאב למשאלה',
      need: 'הצורך',
      pickWeave: 'מאיזו ריקמה תתרום?',
      pickHint: 'התרומה תיווצר כמשימה/משאב אמיתי בריקמה שתבחר/י, ותתחבר לחבילת המשאלה.',
      noWeaves: 'אינך חבר/ה באף ריקמה. צריך ריקמה כדי לתרום משימה או משאב.',
      members: 'חברים',
      decline: 'לא מתאים לי',
      back: 'חזרה',
      submitting: 'מחבר את התרומה למשאלה…',
      doneTitle: 'התרומה נוספה למשאלה 🤍',
      doneBody: 'יצרת את התרומה והיא צורפה לחבילה המתהווה. הלקוחה קיבלה התראה.',
      close: 'סגירה',
      errTitle: 'משהו השתבש',
      retry: 'נסה שוב'
    },
    en: {
      titleM: 'Offer a task to the wish',
      titleR: 'Offer a resource to the wish',
      need: 'The need',
      pickWeave: 'From which weave will you contribute?',
      pickHint: 'Your contribution is created as a real task/resource in the weave you pick, then linked to the wish package.',
      noWeaves: "You aren't a member of any weave. You need one to contribute a task or resource.",
      members: 'members',
      decline: "Not for me",
      back: 'Back',
      submitting: 'Linking your contribution to the wish…',
      doneTitle: 'Contribution added 🤍',
      doneBody: 'Your contribution was created and joined the forming package. The wisher has been notified.',
      close: 'Close',
      errTitle: 'Something went wrong',
      retry: 'Try again'
    }
  } as const;
  const t = $derived(($lang === 'en' ? T.en : T.he));
  const dir = $derived($lang === 'en' ? 'ltr' : 'rtl');

  function pick(w: Weave) {
    chosen = w;
    step = 'create';
  }

  async function finalize(created: { createdEntityId?: string; createdEntityType?: string }) {
    if (!chosen) return;
    step = 'submitting';
    errorMsg = '';
    try {
      const res = await executeAction('acceptWishOffer' as any, {
        proposalId,
        ratsonId,
        itemKind: item.kind,
        itemIdx: item.idx,
        createdEntityId: created.createdEntityId,
        createdEntityType: created.createdEntityType,
        projectId: chosen.id,
        hours: item.hours ?? null,
        quantity: item.quantity ?? null,
        label: item.name
      });
      if (!res?.success) throw new Error(res?.error?.message || 'failed');
      step = 'done';
      onDone?.({ accepted: true });
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : 'error';
      step = 'error';
    }
  }

  // mission.svelte → onClose({ md }) where md = { createdEntityId, createdEntityType }
  function onMissionClose(e: any) {
    const md = e?.md;
    if (md?.createdEntityId) {
      finalize({ createdEntityId: String(md.createdEntityId), createdEntityType: md.createdEntityType });
    } else {
      // creator was cancelled without creating — go back to weave pick
      step = 'pickWeave';
    }
  }
  // ResourceCreator → onCreated(record) where record.id is the created resource
  function onResourceCreated(record: any) {
    if (record?.id) {
      finalize({ createdEntityId: String(record.id), createdEntityType: 'pmash' });
    } else {
      step = 'pickWeave';
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
    <div class="ofr-need">
      <span class="ofr-need-label">{t.need}:</span>
      <span class="ofr-need-name">{item.name}</span>
      {#if item.hours}<span class="ofr-need-meta">· {item.hours}h</span>{/if}
    </div>

    {#if step === 'pickWeave'}
      <p class="ofr-sub">{t.pickWeave}</p>
      <p class="ofr-hint">{t.pickHint}</p>
      {#if weaves.length === 0}
        <div class="ofr-empty">{t.noWeaves}</div>
      {:else}
        <div class="ofr-weaves">
          {#each weaves as w (w.id)}
            <button class="ofr-weave" onclick={() => pick(w)}>
              {#if w.src}
                <img class="ofr-weave-pic" src={w.src} alt={w.name} />
              {:else}
                <span class="ofr-weave-pic fallback">{(w.name || '?').slice(0, 1)}</span>
              {/if}
              <span class="ofr-weave-body">
                <span class="ofr-weave-name">{w.name}</span>
                {#if w.memberCount != null}
                  <span class="ofr-weave-sub">{w.memberCount} {t.members}</span>
                {/if}
              </span>
              <span class="ofr-weave-arrow">›</span>
            </button>
          {/each}
        </div>
      {/if}
      <button class="ofr-decline" onclick={decline} disabled={declining}>{t.decline}</button>

    {:else if step === 'create' && chosen}
      <div class="ofr-creator">
        {#if item.kind === 'mission'}
          <Mission
            projectId={chosen.id}
            name={item.name}
            userslength={chosen.memberCount ?? 1}
            restime={chosen.restime}
            pu={chosen.memberIds ?? []}
            vallues={[]}
            onClose={onMissionClose}
          />
        {:else}
          <ResourceCreator
            projectId={chosen.id}
            userslength={chosen.memberCount ?? 1}
            restime={chosen.restime ?? ''}
            onCreated={onResourceCreated}
            onCancel={() => (step = 'pickWeave')}
          />
        {/if}
      </div>
      <button class="ofr-link-back" onclick={() => (step = 'pickWeave')}>‹ {t.back}</button>

    {:else if step === 'submitting'}
      <div class="ofr-state">{t.submitting}</div>

    {:else if step === 'done'}
      <div class="ofr-done">
        <div class="ofr-done-emoji">🤍</div>
        <h3 class="ofr-done-title">{t.doneTitle}</h3>
        <p class="ofr-done-body">{t.doneBody}</p>
        <button class="ofr-primary" onclick={() => onClose?.()}>{t.close}</button>
      </div>

    {:else if step === 'error'}
      <div class="ofr-state">
        <div class="ofr-err-title">{t.errTitle}</div>
        <div class="ofr-err-msg">{errorMsg}</div>
        <button class="ofr-primary" onclick={() => (step = chosen ? 'create' : 'pickWeave')}>{t.retry}</button>
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
    width: min(680px, 96vw);
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
  .ofr-head {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 8px;
  }
  .ofr-gem {
    width: 9px;
    height: 9px;
    background: linear-gradient(135deg, #ff4d9e, #c8155f);
    transform: rotate(45deg);
    box-shadow: 0 0 10px rgba(255, 77, 158, 0.6);
  }
  .ofr-title {
    font-size: 19px;
    font-weight: 800;
    color: var(--text, #f3ece0);
  }
  .ofr-need {
    display: flex;
    align-items: baseline;
    gap: 7px;
    flex-wrap: wrap;
    padding: 9px 12px;
    border-radius: 10px;
    background: var(--s3, #1d1812);
    border: 1px solid var(--border, #2a241c);
    margin-bottom: 16px;
  }
  .ofr-need-label { font-size: 11px; color: var(--td, #6f6557); font-weight: 600; }
  .ofr-need-name { font-size: 14px; font-weight: 700; color: var(--gold-l, #e8d59a); }
  .ofr-need-meta { font-size: 12px; color: var(--tm, #9a8f80); }
  .ofr-sub { font-size: 15px; font-weight: 700; color: var(--text, #f3ece0); margin-bottom: 4px; }
  .ofr-hint { font-size: 12.5px; color: var(--tm, #9a8f80); margin-bottom: 14px; line-height: 1.5; }
  .ofr-empty {
    padding: 18px;
    border: 1px dashed var(--border, #2a241c);
    border-radius: 10px;
    color: var(--tm, #9a8f80);
    text-align: center;
    font-size: 13px;
  }
  .ofr-weaves { display: flex; flex-direction: column; gap: 8px; }
  .ofr-weave {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 10px 12px;
    border-radius: 11px;
    border: 1px solid var(--border, #2a241c);
    background: var(--s2, #181410);
    cursor: pointer;
    transition: border-color 0.15s, transform 0.15s;
    text-align: start;
  }
  .ofr-weave:hover { border-color: rgba(255, 77, 158, 0.5); transform: translateY(-1px); }
  .ofr-weave-pic {
    width: 38px; height: 38px; border-radius: 50%;
    object-fit: cover; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; color: #fff;
  }
  .ofr-weave-pic.fallback { background: linear-gradient(135deg, #ff4d9e, #c8155f); }
  .ofr-weave-body { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  .ofr-weave-name { font-size: 14px; font-weight: 700; color: var(--text, #f3ece0); }
  .ofr-weave-sub { font-size: 11px; color: var(--tm, #9a8f80); }
  .ofr-weave-arrow { color: var(--tm, #9a8f80); font-size: 18px; }
  .ofr-decline {
    margin-top: 16px;
    width: 100%;
    padding: 9px;
    border-radius: 9px;
    background: transparent;
    border: 1px solid var(--border, #2a241c);
    color: var(--tm, #9a8f80);
    font-size: 13px;
    cursor: pointer;
  }
  .ofr-decline:hover { color: var(--text, #f3ece0); }
  .ofr-creator { margin: 4px 0; }
  .ofr-link-back {
    margin-top: 10px;
    background: transparent;
    border: none;
    color: var(--tm, #9a8f80);
    cursor: pointer;
    font-size: 13px;
  }
  .ofr-state { text-align: center; padding: 28px 12px; color: var(--tm, #9a8f80); font-size: 14px; }
  .ofr-done { text-align: center; padding: 18px 8px; }
  .ofr-done-emoji { font-size: 38px; margin-bottom: 8px; }
  .ofr-done-title { font-size: 18px; font-weight: 800; color: var(--text, #f3ece0); margin-bottom: 6px; }
  .ofr-done-body { font-size: 13px; color: var(--tm, #9a8f80); line-height: 1.55; margin-bottom: 16px; }
  .ofr-err-title { font-size: 16px; font-weight: 700; color: var(--pink-l, #ff6496); margin-bottom: 6px; }
  .ofr-err-msg { font-size: 12.5px; color: var(--tm, #9a8f80); margin-bottom: 14px; word-break: break-word; }
  .ofr-primary {
    padding: 10px 22px;
    border-radius: 10px;
    border: 1px solid rgba(255, 77, 158, 0.35);
    background: var(--pink-d, rgba(255, 100, 150, 0.12));
    color: var(--pink-l, #ff6496);
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
  }
</style>
