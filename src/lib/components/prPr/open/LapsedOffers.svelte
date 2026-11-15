<script>
  /**
   * Assigned mission offers that lapsed: the member it was offered to did not
   * answer within the rikma's response time, so the mission went back to the
   * board. While nobody else has stepped in, the offer can come back — that
   * member says "I still want it", or any member offers it to them again. The
   * rikma then gets a full new response time (action `reviveLapsedAsk`).
   */
  import { t } from '$lib/translations';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { invalidateAll } from '$app/navigation';

  /**
   * @typedef {{ askId: string, missionName: string, takerId: string, takerName: string }} LapsedOffer
   * @typedef {Object} Props
   * @property {string} projectId
   * @property {string} uid - the viewer
   * @property {LapsedOffer[]} [offers]
   */

  /** @type {Props} */
  let { projectId, uid, offers = [] } = $props();

  /** @type {Record<string, 'busy' | 'done' | string>} */
  let state = $state({});

  /** @param {LapsedOffer} o */
  async function restore(o) {
    state[o.askId] = 'busy';
    const res = await executeAction('reviveLapsedAsk', { askId: o.askId, projectId });
    if (res?.success) {
      state[o.askId] = 'done';
      invalidateAll();
    } else {
      state[o.askId] = actionErrorText(res, $t('moach.open.lapsedFailed'));
    }
  }
</script>

{#if offers.length > 0}
  <section class="mb-6 rounded-2xl border border-amber-300/30 bg-slate-900/70 p-4" aria-labelledby="lapsed-heading">
    <h2 id="lapsed-heading" class="text-base font-bold text-gold-l">{$t('moach.open.lapsedHeading')}</h2>
    <p class="mt-1 text-sm text-slate-300">{$t('moach.open.lapsedNote')}</p>
    <ul class="mt-3 flex flex-col gap-3">
      {#each offers as o (o.askId)}
        {@const mine = String(o.takerId) === String(uid)}
        {@const s = state[o.askId]}
        <li class="flex flex-wrap items-center gap-3 rounded-xl bg-slate-800/60 p-3">
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-slate-100">{o.missionName}</p>
            <p class="text-xs text-slate-400">
              {mine ? $t('moach.open.lapsedMine') : $t('moach.open.lapsedFor', { name: o.takerName })}
            </p>
          </div>
          {#if s === 'done'}
            <span class="text-sm font-bold text-gold-l" role="status">{$t('moach.open.lapsedDone')}</span>
          {:else}
            <button
              type="button"
              class="rounded-full bg-[color:var(--barbi-pink)] px-4 py-1.5 text-sm font-bold text-[color:var(--gold)] disabled:opacity-50"
              disabled={s === 'busy'}
              onclick={() => restore(o)}
            >
              {mine ? $t('moach.open.lapsedRestoreMine') : $t('moach.open.lapsedRestoreFor', { name: o.takerName })}
            </button>
          {/if}
          {#if s && s !== 'busy' && s !== 'done'}
            <p class="w-full text-xs text-red-300" role="alert">{s}</p>
          {/if}
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .text-gold-l {
    color: var(--gold-l, #f0c040);
  }
</style>
