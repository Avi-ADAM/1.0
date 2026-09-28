<script lang="ts">
  /**
   * The guardian's inbox (T9b, decision 28.9.2026): being someone's guardian
   * is an obligation, so it counts only once you agree. Lists everyone who
   * nominated this user, with agree / step down.
   */
  import { t } from '$lib/translations';
  import { answerNomination, type Guardianship } from '$lib/client/recovery';

  let { guarding, onchange }: { guarding: Guardianship[]; onchange: () => void } = $props();

  let busy = $state(false);
  let message = $state('');

  async function answer(g: Guardianship, accept: boolean) {
    if (!accept && !confirm($t('recovery.guarding.stepDownConfirm', { name: g.username ?? g.ownerId }))) return;
    busy = true;
    message = '';
    try {
      const res = await answerNomination(g.ownerId, accept);
      if (res.ok) onchange();
      else message = $t('recovery.error', { reason: res.reason });
    } finally {
      busy = false;
    }
  }
</script>

{#if guarding.length > 0}
  <section class="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-white/60 dark:bg-zinc-900/40">
    <h2 class="font-semibold text-goldink">{$t('recovery.guarding.title')}</h2>
    <p class="text-sm text-zinc-500">{$t('recovery.guarding.desc')}</p>
    <ul class="space-y-2">
      {#each guarding as g (g.ownerId)}
        {@const name = g.username ?? $t('recovery.vouch.unknownUser')}
        <li class="flex flex-wrap items-center gap-2 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800/60">
          <span class="min-w-0 flex-1">
            {#if g.stance === 'accepted'}
              ✓ {$t('recovery.guarding.youGuard', { name })}
            {:else}
              {$t('recovery.guarding.asked', { name, threshold: g.threshold, total: g.total })}
            {/if}
          </span>
          {#if g.stance === 'accepted'}
            <button
              class="rounded-full border border-zinc-300 px-3 py-1 text-xs disabled:opacity-40 dark:border-zinc-600"
              disabled={busy}
              onclick={() => answer(g, false)}
            >{$t('recovery.guarding.stepDown')}</button>
          {:else}
            <button
              class="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
              disabled={busy}
              onclick={() => answer(g, true)}
            >{$t('recovery.guarding.accept')}</button>
          {/if}
        </li>
      {/each}
    </ul>
    {#if message}<p class="text-sm" role="status">{message}</p>{/if}
  </section>
{/if}
