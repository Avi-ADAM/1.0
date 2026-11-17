<script>
  /**
   * "My request" — a candidacy I sent and the rikma has not answered yet: a
   * mission I offered to take, or a resource I offered to bring.
   *
   * Shown only under `/lev?focus=myapp` (the hub's "my requests"). It says
   * where the candidacy stands — the terms on the table, who signed, when
   * silence approves it — and offers the one move that is mine: withdrawing it.
   * Discussing or countering stays with the rikma: a member goes to the vote
   * page, a candidate who is not a member yet to the opening's own page (the
   * rikma's vote page is members only).
   *
   * Withdrawing archives the candidacy, never deletes it (`withdrawCandidacy`,
   * which checks I am the candidate from the row itself).
   */
  import { t, isRtl } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { useFormatMoney } from '$lib/money/context.svelte';
  import { projectsStore } from '$lib/stores/levStores';
  import { forgetMyApplication } from '$lib/utils/levMyApplications';
  import CardHeader from './CardHeader.svelte';

  let { buble, isFirst = false, onProj, onDone } = $props();
  const fmtMoney = useFormatMoney();

  let asking = $state(false);
  let busy = $state(false);

  const isMission = $derived(buble.kind !== 'resource');
  const hours = $derived(Number(buble.terms?.hours ?? 0));
  const rate = $derived(Number(buble.terms?.rate ?? 0));
  /** A member can open the vote page; anyone else gets a 403 there. */
  const isMember = $derived(
    !!buble.projectId && $projectsStore.some((p) => String(p.id) === String(buble.projectId))
  );
  const deadlineText = $derived.by(() => {
    if (!buble.silenceApproves || !buble.deadline) return null;
    const d = new Date(buble.deadline);
    if (!Number.isFinite(d.getTime())) return null;
    return d.toLocaleString($lang || 'he', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  });

  async function withdraw() {
    if (busy || !buble.projectId) return;
    busy = true;
    try {
      const res = await executeAction('withdrawCandidacy', {
        side: isMission ? 'ask' : 'askm',
        id: String(buble.applicationId),
        projectId: String(buble.projectId)
      });
      if (res?.success === false) throw new Error(actionErrorText(res, $t('lev.myapp.failed')));
      toast.success($t('lev.myapp.withdrawn'));
      forgetMyApplication(buble.kind, buble.applicationId);
      onDone?.();
    } catch (e) {
      console.error('[MyApplicationCard] withdraw failed:', e);
      toast.error(e instanceof Error && e.message ? e.message : $t('lev.myapp.failed'));
    } finally {
      busy = false;
      asking = false;
    }
  }
</script>

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : 'w-[90%] h-[90%]'} lg:w-[90%] {isFirst
    ? $isRtl
      ? 'boxleft'
      : 'boxright'
    : ''} flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isFirst
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'} transition-all duration-300 relative"
  style:--glow-rgb="96, 165, 250"
>
  <CardHeader
    logoSrc={buble.src}
    projectName={buble.projectName}
    cardType={$t('lev.myapp.cardType')}
    cardTitle={buble.name}
    glowColor="blue"
    onProjectClick={() => (isMember ? onProj?.({ id: buble.projectId }) : null)}
  />

  <div class="bg-white dark:bg-slate-800 p-4 flex-1 overflow-y-auto flex flex-col gap-3 text-sm text-gray-700 dark:text-gray-200">
    <p>
      {$t(isMission ? 'lev.myapp.mission' : 'lev.myapp.resource', { name: buble.rikmaName || buble.projectName })}
    </p>

    {#if isMission && hours > 0 && rate > 0}
      <p class="font-bold text-gray-900 dark:text-gray-50">
        {$t('lev.myapp.missionTerms', { hours, rate: fmtMoney(rate, null) })}
      </p>
    {:else if !isMission && rate > 0}
      <p class="font-bold text-gray-900 dark:text-gray-50">
        {$t('lev.myapp.resourceTerms', { rate: fmtMoney(rate, null) })}
      </p>
    {/if}
    {#if buble.countered}
      <p class="text-xs text-gray-600 dark:text-gray-300">{$t('lev.myapp.countered')}</p>
    {/if}

    {#if buble.signedBy?.length}
      <p>{$t('lev.myapp.signed', { names: buble.signedBy.join(', ') })}</p>
    {/if}
    {#if buble.waitingFor?.length}
      <p>{$t('lev.myapp.waiting', { names: buble.waitingFor.join(', ') })}</p>
    {/if}

    <p class="text-xs text-gray-600 dark:text-gray-300">
      {deadlineText ? $t('lev.myapp.silence', { time: deadlineText }) : $t('lev.myapp.noClock')}
    </p>

    <div class="flex flex-wrap gap-3 text-xs">
      {#if isMember && buble.votePath}
        <a href={buble.votePath} class="underline decoration-dotted underline-offset-2 text-barbi dark:text-gold">
          {$t('lev.myapp.toVote')}
        </a>
      {/if}
      {#if buble.openingPath}
        <a href={buble.openingPath} class="underline decoration-dotted underline-offset-2 text-barbi dark:text-gold">
          {$t('lev.myapp.toOpening')}
        </a>
      {/if}
    </div>
  </div>

  <div class="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2">
    {#if asking}
      <p class="text-sm font-bold text-gray-800 dark:text-gray-100">{$t('lev.myapp.confirm')}</p>
      <div class="flex gap-2">
        <button
          type="button"
          onclick={() => (asking = false)}
          disabled={busy}
          class="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 py-3 text-sm text-gray-800 dark:text-gray-100 disabled:opacity-60"
        >
          {$t('lev.myapp.cancel')}
        </button>
        <button
          type="button"
          onclick={withdraw}
          disabled={busy}
          class="flex-[2] rounded-xl bg-barbi text-gold py-3 text-sm font-bold disabled:opacity-60"
        >
          {$t('lev.myapp.confirmYes')}
        </button>
      </div>
    {:else}
      <button
        type="button"
        onclick={() => (asking = true)}
        disabled={busy || !buble.projectId}
        class="w-full rounded-xl border border-barbi text-barbi dark:border-gold dark:text-gold py-3 text-sm font-bold disabled:opacity-60"
      >
        {$t('lev.myapp.withdraw')}
      </button>
    {/if}
  </div>
</div>

<style>
  .shadow-glow {
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05);
  }
  .border-glow {
    border: 2px solid rgba(var(--glow-rgb), 0.5);
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05),
      0 0 0 1px rgba(var(--glow-rgb), 0.3);
  }
</style>
