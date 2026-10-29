<script lang="ts">
  import { t, isRtl } from '$lib/translations';
  import { invalidateAll } from '$app/navigation';
  import { executeAction } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import Spinner from '$lib/celim/Spinner.svelte';
  import type { AskwantState } from '$lib/sheirut/askwantState';

  let {
    data
  }: {
    data: {
      askwantId: string;
      state: AskwantState;
      serviceName: string;
      projectName: string;
      dueAt: string | null;
    };
  } = $props();

  let busy = $state(false);

  // Ask again: a fresh restime on this same request (renewSheirutJoin).
  async function askAgain() {
    if (busy) return;
    busy = true;
    try {
      const result = await executeAction('renewSheirutJoin', { askwantId: data.askwantId });
      if (result.success) {
        toast.success($t('project.sheirut.again.sent'));
        await invalidateAll();
      } else {
        toast.error($t('project.sheirut.again.failed'));
      }
    } finally {
      busy = false;
    }
  }

  const dueText = $derived(
    data.dueAt ? new Date(data.dueAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ''
  );
</script>

<svelte:head>
  <title>{$t('project.sheirut.again.pageTitle')}</title>
</svelte:head>

<main class="aw-page" dir={$isRtl ? 'rtl' : 'ltr'}>
  <section class="aw-card bg-surface">
    <p class="aw-kicker">{$t('project.sheirut.again.kicker')}</p>
    <h1 class="aw-title">
      {data.serviceName || $t('project.sheirut.again.someService')}
    </h1>
    {#if data.projectName}
      <p class="aw-rikma">{$t('project.sheirut.again.fromRikma', { rikma: data.projectName })}</p>
    {/if}

    {#if data.state === 'lapsed'}
      <p class="aw-body">{$t('project.sheirut.again.lapsed')}</p>
      <button class="aw-btn" onclick={askAgain} disabled={busy}>
        {#if busy}<Spinner size="xs" color="#fff" />{/if}
        {$t('project.sheirut.again.button')}
      </button>
    {:else if data.state === 'waiting'}
      <p class="aw-body">{$t('project.sheirut.again.waiting')}</p>
      {#if dueText}
        <p class="aw-muted">{$t('project.sheirut.again.until', { time: dueText })}</p>
      {/if}
    {:else if data.state === 'approved'}
      <p class="aw-body">{$t('project.sheirut.again.approved')}</p>
      <a class="aw-link" href="/deals">{$t('project.sheirut.again.toDeals')}</a>
    {:else}
      <p class="aw-body">{$t('project.sheirut.again.unavailable')}</p>
    {/if}
  </section>
</main>

<style>
  .aw-page {
    min-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
  }
  .aw-card {
    width: 100%;
    max-width: 480px;
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 8px 30px rgb(0 0 0 / 0.12);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .aw-kicker {
    color: var(--barbi-pink);
    font-weight: 700;
    font-size: 0.85rem;
    margin: 0;
  }
  .aw-title {
    color: rgb(var(--surface-ink-rgb, 31 41 55));
    font-size: 1.6rem;
    font-weight: 800;
    margin: 0;
  }
  .aw-rikma,
  .aw-muted {
    color: rgb(var(--surface-muted-rgb, 107 114 128));
    margin: 0;
  }
  .aw-body {
    color: rgb(var(--surface-ink-rgb, 31 41 55));
    line-height: 1.6;
    margin: 0;
  }
  .aw-btn {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 12px;
    font-weight: 700;
    color: #fff;
    background: var(--barbi-pink);
  }
  .aw-btn:disabled {
    opacity: 0.6;
  }
  .aw-link {
    color: var(--barbi-pink);
    font-weight: 700;
    text-decoration: underline;
  }
</style>
