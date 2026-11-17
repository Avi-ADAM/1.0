<script lang="ts">
  import { isRtl, t } from '$lib/translations';
  import { fade, fly } from 'svelte/transition';
  import SkillSelector from '$lib/components/ui/SkillSelector.svelte';
  import MultiSelect from 'svelte-multiselect';
  import { role, ww } from '$lib/components/prPr/mi.js';
  import type { MissionExtraDetails } from './types';

  type Props = {
    open: boolean;
    initial: MissionExtraDetails | null;
    missionName: string;
    onSave: (details: MissionExtraDetails) => void;
    onClose: () => void;
  };

  let { open, initial, missionName, onSave, onClose }: Props = $props();

  const empty: MissionExtraDetails = {
    descripRich: '',
    skills: [],
    roles: [],
    workways: [],
    hearotMeyuchadot: '',
    publicklinks: '',
    privatlinks: '',
    startDate: null,
    endDate: null
  };

  let draft = $state<MissionExtraDetails>({ ...empty });

  $effect(() => {
    if (open) {
      draft = initial ? { ...empty, ...initial } : { ...empty };
    }
  });

  const roleOptions = $derived(
    ($role ?? []).map((r: any) => r.attributes?.roleDescription).filter(Boolean)
  );
  const workwayOptions = $derived(
    ($ww ?? []).map((w: any) => w.attributes?.workWayName).filter(Boolean)
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
      aria-label={$t('products.missionDetails.title')}
    >
      <header>
        <div>
          <h2>{$t('products.missionDetails.title')}</h2>
          {#if missionName}
            <p class="mission-name">📋 {missionName}</p>
          {/if}
          <p class="sub">{$t('products.missionDetails.subtitle')}</p>
        </div>
        <button class="x" type="button" aria-label="close" onclick={onClose}>×</button>
      </header>

      <div class="body" dir={$isRtl ? 'rtl' : 'ltr'}>
        <label class="field">
          <span>{$t('products.missionDetails.desc')}</span>
          <textarea
            class="input textarea"
            rows="4"
            bind:value={draft.descripRich}
            placeholder={$t('products.missionDetails.desc')}
          ></textarea>
        </label>

        <div class="field">
          <span>{$t('products.missionDetails.skills')}</span>
          <SkillSelector bind:selectedSkills={draft.skills} color="--gold" />
        </div>

        <div class="field">
          <span>{$t('products.missionDetails.roles')}</span>
          <MultiSelect
            bind:selected={draft.roles}
            options={roleOptions}
            placeholder={$t('products.missionDetails.rolesPh')}
            maxSelect={3}
          />
        </div>

        <div class="field">
          <span>{$t('products.missionDetails.workways')}</span>
          <MultiSelect
            bind:selected={draft.workways}
            options={workwayOptions}
            placeholder={$t('products.missionDetails.workwaysPh')}
          />
        </div>

        <label class="field">
          <span>{$t('products.missionDetails.notes')}</span>
          <textarea class="input textarea" rows="2" bind:value={draft.hearotMeyuchadot}></textarea>
        </label>

        <div class="grid">
          <label class="field">
            <span>{$t('products.missionDetails.publicLinks')}</span>
            <input class="input" bind:value={draft.publicklinks} />
          </label>
          <label class="field">
            <span>{$t('products.missionDetails.privateLinks')}</span>
            <input class="input" bind:value={draft.privatlinks} />
          </label>
        </div>

        <div class="grid">
          <label class="field">
            <span>{$t('products.missionDetails.startDate')}</span>
            <input
              class="input"
              type="datetime-local"
              bind:value={draft.startDate}
            />
          </label>
          <label class="field">
            <span>{$t('products.missionDetails.endDate')}</span>
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
        <button class="secondary" type="button" onclick={onClose}>{$t('products.missionDetails.cancel')}</button>
        <button class="primary" type="button" onclick={save}>{$t('products.missionDetails.save')}</button>
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
    max-width: 600px;
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
  .mission-name {
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
  .textarea { resize: vertical; min-height: 70px; }

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
