<script>
  /**
   * Where my candidacy stands — a block inside the opening's own heart card
   * (sugestmi / sugestma, "already applied" state). The card itself shows the
   * terms, the rikma's counter and the chat; this adds who signed, who has not
   * answered, when silence approves it, and the links: the opening's page, and
   * the vote page only for a member (the rikma's vote page is members only).
   *
   * `candidacy` is a row of getMyApplications ($lib/candidacy/myApplications).
   */
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { projectsStore } from '$lib/stores/levStores';

  /** @type {{ candidacy: import('$lib/candidacy/myApplications').MyApplication }} */
  let { candidacy } = $props();

  const isMember = $derived(
    !!candidacy.projectId &&
      $projectsStore.some((p) => String(p.id) === String(candidacy.projectId))
  );
  const deadlineText = $derived.by(() => {
    if (!candidacy.silenceApproves || !candidacy.deadline) return null;
    const d = new Date(candidacy.deadline);
    if (!Number.isFinite(d.getTime())) return null;
    return d.toLocaleString($lang || 'he', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  });
</script>

<div
  class="flex flex-col gap-1 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30 p-3 text-xs text-gray-700 dark:text-gray-200"
>
  {#if candidacy.signedBy?.length}
    <p>{$t('lev.myapp.signed', { names: candidacy.signedBy.join(', ') })}</p>
  {/if}
  {#if candidacy.waitingFor?.length}
    <p>{$t('lev.myapp.waiting', { names: candidacy.waitingFor.join(', ') })}</p>
  {/if}
  <p class="text-gray-600 dark:text-gray-300">
    {deadlineText ? $t('lev.myapp.silence', { time: deadlineText }) : $t('lev.myapp.noClock')}
  </p>
  <div class="flex flex-wrap gap-3">
    {#if isMember && candidacy.votePath}
      <a href={candidacy.votePath} class="underline decoration-dotted underline-offset-2 text-barbi dark:text-gold">
        {$t('lev.myapp.toVote')}
      </a>
    {/if}
    {#if candidacy.openingPath}
      <a href={candidacy.openingPath} class="underline decoration-dotted underline-offset-2 text-barbi dark:text-gold">
        {$t('lev.myapp.toOpening')}
      </a>
    {/if}
  </div>
</div>
