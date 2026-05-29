<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import { fade, fly } from 'svelte/transition';
  import type { ResourceExtraDetails } from './types';

  type Props = {
    open: boolean;
    initial: ResourceExtraDetails | null;
    resourceName: string;
    onSave: (details: ResourceExtraDetails) => void;
    onClose: () => void;
  };

  let { open, initial, resourceName, onSave, onClose }: Props = $props();

  const empty: ResourceExtraDetails = {
    descripRich: '',
    spnot: '',
    linkto: '',
    easy: 0,
    startDate: null,
    endDate: null
  };

  let draft = $state<ResourceExtraDetails>({ ...empty });

  $effect(() => {
    if (open) {
      draft = initial ? { ...empty, ...initial } : { ...empty };
    }
  });

  const t = $derived(
    $lang === 'he'
      ? {
          title: 'פרטים מלאים למשאב',
          subtitle:
            'הנתונים האלה נשמרים עם המוצר ויועברו לדרישת המשאב בעת המכירה',
          desc: 'תיאור מפורט',
          spnot: 'הערות מיוחדות / מפרט',
          linkto: 'קישור / לינק חיצוני',
          easy: 'מחיר מינימום / Easy',
          startDate: 'תחילת ביצוע מתוכננת',
          endDate: 'סיום ביצוע מתוכנן',
          save: 'שמור פרטים',
          cancel: 'ביטול'
        }
      : {
          title: 'Full resource details',
          subtitle:
            'These details are stored with the product and applied to the resource request when the product is sold',
          desc: 'Description',
          spnot: 'Special notes / spec',
          linkto: 'External link',
          easy: 'Minimum / Easy price',
          startDate: 'Planned start',
          endDate: 'Planned end',
          save: 'Save details',
          cancel: 'Cancel'
        }
  );

  function save() {
    onSave({ ...draft });
  }
</script>

{#if open}
  <div
    class="overlay"
    transition:fade={{ duration: 150 }}
    onclick={onClose}
    role="presentation"
  >
    <div
      class="sheet"
      transition:fly={{ y: 30, duration: 200 }}
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
    >
      <header>
        <div>
          <h2>{t.title}</h2>
          {#if resourceName}
            <p class="res-name">📦 {resourceName}</p>
          {/if}
          <p class="sub">{t.subtitle}</p>
        </div>
        <button class="x" type="button" aria-label="close" onclick={onClose}>×</button>
      </header>

      <div class="body" dir={$lang === 'he' ? 'rtl' : 'ltr'}>
        <label class="field">
          <span>{t.desc}</span>
          <textarea
            class="input textarea"
            rows="4"
            bind:value={draft.descripRich}
          ></textarea>
        </label>

        <label class="field">
          <span>{t.spnot}</span>
          <textarea
            class="input textarea"
            rows="2"
            bind:value={draft.spnot}
          ></textarea>
        </label>

        <label class="field">
          <span>{t.linkto}</span>
          <input class="input" type="url" bind:value={draft.linkto} />
        </label>

        <label class="field">
          <span>{t.easy}</span>
          <input
            class="input"
            type="number"
            min="0"
            step="1"
            bind:value={draft.easy}
          />
        </label>

        <div class="grid">
          <label class="field">
            <span>{t.startDate}</span>
            <input
              class="input"
              type="datetime-local"
              bind:value={draft.startDate}
            />
          </label>
          <label class="field">
            <span>{t.endDate}</span>
            <input
              class="input"
              type="datetime-local"
              bind:value={draft.endDate}
              min={draft.startDate ?? undefined}
            />
          </label>
        </div>
      </div>

      <footer>
        <button class="secondary" type="button" onclick={onClose}>{t.cancel}</button>
        <button class="primary" type="button" onclick={save}>{t.save}</button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  .sheet {
    background: var(--bg, #1f1c24);
    color: var(--text, #f4ecd6);
    border: 1px solid var(--border, #3b3540);
    border-radius: 12px;
    width: 100%;
    max-width: 560px;
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  header {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border, #3b3540);
  }
  header h2 {
    margin: 0;
    color: var(--gold, #d8a64b);
    font-size: 1.05rem;
    font-weight: 700;
  }
  .res-name {
    margin: 2px 0 0;
    color: var(--gold-l, #f1c47a);
    font-size: 0.85rem;
    font-weight: 600;
  }
  .sub {
    margin: 2px 0 0;
    color: var(--tm, #b6acb1);
    font-size: 0.75rem;
  }
  .x {
    background: transparent;
    color: var(--tm, #b6acb1);
    border: 1px solid var(--border, #3b3540);
    border-radius: 6px;
    width: 30px;
    height: 30px;
    font-size: 1.2rem;
    cursor: pointer;
    line-height: 1;
    align-self: flex-start;
  }
  .x:hover {
    color: var(--pink-l, #ff5a99);
    border-color: var(--pink-l, #ff5a99);
  }
  .body {
    overflow-y: auto;
    padding: 0.9rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  @media (max-width: 480px) {
    .grid { grid-template-columns: 1fr; }
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .field > span {
    font-size: 0.8rem;
    color: var(--gold-l, #f1c47a);
    font-weight: 600;
  }
  .input {
    background: var(--bg-2, #251f2c);
    color: var(--text, #f4ecd6);
    border: 1px solid var(--border, #3b3540);
    border-radius: 6px;
    padding: 6px 9px;
    width: 100%;
    box-sizing: border-box;
    font-size: 0.9rem;
  }
  .input:focus {
    outline: none;
    border-color: var(--gold, #d8a64b);
    box-shadow: 0 0 0 2px rgba(216, 166, 75, 0.25);
  }
  .textarea { resize: vertical; min-height: 60px; }

  footer {
    border-top: 1px solid var(--border, #3b3540);
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
  }
  .primary {
    background: var(--gold, #d8a64b);
    color: #1f1c24;
    border: none;
    border-radius: 6px;
    padding: 6px 14px;
    cursor: pointer;
    font-weight: 700;
  }
  .primary:hover { filter: brightness(1.08); }
  .secondary {
    background: transparent;
    color: var(--tm, #b6acb1);
    border: 1px solid var(--border, #3b3540);
    border-radius: 6px;
    padding: 6px 14px;
    cursor: pointer;
  }
  .secondary:hover {
    color: var(--gold, #d8a64b);
    border-color: var(--gold, #d8a64b);
  }
</style>
