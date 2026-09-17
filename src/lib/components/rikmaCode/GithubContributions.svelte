<script lang="ts">
  /**
   * "Work on GitHub" in the rikma's code tab (PLAN_CODE_RIKMA S4/S5, §4.5).
   *
   * Merged PRs and the reviews on them, each with whose it is. The viewer's own
   * rows carry a claim form: hours they state (a size suggestion pre-fills it,
   * nothing more), on one of their missions, filed through the approval every
   * timer's hours go through. Rows of people who have not linked an account, or
   * are not members, show that their contribution is waiting for them.
   */
  import { t } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { CLAIM_MAX_HOURS } from '$lib/github/pulls';
  import type { Contribution } from '$lib/github/contributions';

  let { projectId }: { projectId: string } = $props();

  type Mission = { id: string; name: string };

  let loading = $state(true);
  let failed = $state(false);
  let contributions = $state<Contribution[]>([]);
  let missions = $state<Mission[]>([]);
  let viewerLinked = $state(false);
  let onlyMine = $state(false);
  let reloadTick = $state(0);

  $effect(() => {
    const pid = String(projectId ?? '');
    void reloadTick;
    if (!/^\d+$/.test(pid)) return;
    const controller = new AbortController();
    loading = true;
    failed = false;
    fetch(`/api/v1/github/contributions?projectId=${encodeURIComponent(pid)}`, { signal: controller.signal })
      .then(async (res) => {
        const body = res.ok ? await res.json() : null;
        if (!body) {
          failed = true;
          return;
        }
        contributions = Array.isArray(body.contributions) ? body.contributions : [];
        missions = Array.isArray(body.missions) ? body.missions : [];
        viewerLinked = body.viewerLinked === true;
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') {
          console.warn('[GithubContributions] could not load contributions', error);
          failed = true;
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) loading = false;
      });
    return () => controller.abort();
  });

  let shown = $derived(onlyMine ? contributions.filter((c) => c.isMe) : contributions);
  let mineOpen = $derived(contributions.filter((c) => c.isMe && c.status === 'member' && !c.claimed).length);

  // ── The claim form — one open at a time ────────────────────────────────
  let openKey = $state<string | null>(null);
  let missionId = $state('');
  let hours = $state<number | null>(null);
  let note = $state('');
  let submitting = $state(false);
  let claimError = $state('');
  let claimedNow = $state<Record<string, 'finnishedMission' | 'approval'>>({});

  const keyOf = (c: Contribution) => `${c.kind}|${c.url}|${c.userId ?? c.githubLogin}`;

  function openClaim(c: Contribution) {
    openKey = keyOf(c);
    missionId = missions.length === 1 ? missions[0].id : '';
    hours = c.suggestedHours;
    note = '';
    claimError = '';
  }

  const ERROR_CODES = [
    'notConfigured',
    'invalid',
    'invalidHours',
    'notConnected',
    'notLinked',
    'notYourMission',
    'notFound',
    'notYourWork',
    'notMerged',
    'alreadyClaimed'
  ];

  async function submitClaim(c: Contribution) {
    if (!missionId || hours == null || !(hours > 0) || hours > CLAIM_MAX_HOURS) return;
    submitting = true;
    claimError = '';
    const res = await executeAction('claimGithubWork', {
      projectId: String(projectId),
      missionId,
      url: c.url,
      kind: c.kind,
      hours: Number(hours),
      note
    });
    submitting = false;
    if (res.success) {
      claimedNow = { ...claimedNow, [keyOf(c)]: (res.data as any)?.filed ?? 'approval' };
      openKey = null;
      return;
    }
    const message = String((res as any).error?.message ?? '');
    const code = /claimGithubWork:(\w+)/.exec(message)?.[1] ?? '';
    claimError = ERROR_CODES.includes(code) ? $t(`rikmaCode.claim.errors.${code}`) : $t('rikmaCode.claim.errors.failed');
  }

  function when(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  }

  let copied = $state(false);
  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(`${location.origin}/project/${projectId}/join`);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      /* clipboard refused — nothing to do */
    }
  }
</script>

<section class="gh-work" aria-labelledby="gh-work-title">
  <div class="gh-work-head">
    <h3 id="gh-work-title">{$t('rikmaCode.work.title')}</h3>
    {#if contributions.some((c) => c.isMe)}
      <label class="mine-toggle">
        <input type="checkbox" bind:checked={onlyMine} />
        {$t('rikmaCode.work.onlyMine')}
      </label>
    {/if}
  </div>
  <p class="muted small">{$t('rikmaCode.work.intro')}</p>

  {#if !loading && !failed && !viewerLinked}
    <p class="hint">
      {$t('rikmaCode.work.linkFirst')}
      <a href="/me/settings">{$t('rikmaCode.work.linkFirstCta')}</a>
    </p>
  {/if}

  {#if loading}
    <p class="muted small" role="status">{$t('rikmaCode.work.loading')}</p>
  {:else if failed}
    <p class="notice" role="alert">{$t('rikmaCode.work.failed')}</p>
  {:else if contributions.length === 0}
    <p class="empty">{$t('rikmaCode.work.empty')}</p>
  {:else}
    {#if mineOpen > 0}
      <p class="mine-open" role="status">{$t('rikmaCode.work.mineOpen', { count: mineOpen })}</p>
    {/if}
    <ul class="rows">
      {#each shown as c (keyOf(c))}
        {@const key = keyOf(c)}
        {@const filed = claimedNow[key]}
        <li class="row" class:mine={c.isMe}>
          <div class="row-main">
            <div class="row-top">
              <span class="chip kind">{c.kind === 'review' ? $t('rikmaCode.work.review') : $t('rikmaCode.work.pull')}</span>
              <a class="ref" href={c.url} target="_blank" rel="noopener noreferrer"><bdi dir="ltr">{c.repo}#{c.number}</bdi></a>
              <span class="title"><bdi>{c.title}</bdi></span>
            </div>
            <div class="row-meta">
              <span>
                {#if c.username}
                  <bdi>{c.username}</bdi>
                {:else if c.githubLogin}
                  <bdi dir="ltr">@{c.githubLogin}</bdi>
                {/if}
              </span>
              {#if c.status === 'unlinked'}
                <span class="chip warn">{$t('rikmaCode.work.unlinked')}</span>
              {:else if c.status === 'linked'}
                <span class="chip warn">{$t('rikmaCode.work.notMember')}</span>
              {/if}
              <span class="muted">{when(c.at)}</span>
              {#if c.loggedHours > 0}
                <span class="chip">{$t('rikmaCode.work.logged', { hours: c.loggedHours })}</span>
              {/if}
              {#if c.claimed || filed}
                <span class="chip ok">
                  {filed === 'finnishedMission' ? $t('rikmaCode.work.filed') : $t('rikmaCode.work.claimed')}
                </span>
              {/if}
            </div>
          </div>

          {#if c.isMe && c.status === 'member' && !c.claimed && !filed}
            {#if openKey !== key}
              <button class="claim-btn" type="button" onclick={() => openClaim(c)}>
                {$t('rikmaCode.claim.open')}
              </button>
            {/if}
          {:else if c.status !== 'member'}
            <button class="invite-btn" type="button" onclick={copyInvite}>
              {copied ? $t('rikmaCode.work.inviteCopied') : $t('rikmaCode.work.invite')}
            </button>
          {/if}

          {#if openKey === key}
            <form
              class="claim"
              onsubmit={(e) => {
                e.preventDefault();
                submitClaim(c);
              }}
            >
              {#if missions.length === 0}
                <p class="muted small">{$t('rikmaCode.claim.noMissions')}</p>
              {:else}
                <label class="field">
                  <span>{$t('rikmaCode.claim.mission')}</span>
                  <select bind:value={missionId} required>
                    <option value="" disabled>{$t('rikmaCode.claim.missionPick')}</option>
                    {#each missions as m (m.id)}
                      <option value={m.id}>{m.name}</option>
                    {/each}
                  </select>
                </label>
                <label class="field">
                  <span>{$t('rikmaCode.claim.hours')}</span>
                  <input type="number" min="0.25" max={CLAIM_MAX_HOURS} step="0.25" bind:value={hours} required />
                </label>
                {#if c.suggestedHours != null}
                  <p class="muted small">{$t('rikmaCode.claim.suggestion', { hours: c.suggestedHours })}</p>
                {/if}
                {#if c.loggedHours > 0}
                  <p class="hint small">{$t('rikmaCode.claim.alreadyLogged', { hours: c.loggedHours })}</p>
                {/if}
                <label class="field">
                  <span>{$t('rikmaCode.claim.note')}</span>
                  <textarea rows="2" maxlength="1000" bind:value={note}></textarea>
                </label>
                <p class="muted small">{$t('rikmaCode.claim.consent')}</p>
              {/if}
              {#if claimError}
                <p class="notice" role="alert">{claimError}</p>
              {/if}
              <div class="claim-actions">
                {#if missions.length > 0}
                  <button
                    class="claim-btn"
                    type="submit"
                    disabled={submitting || !missionId || hours == null || !(hours > 0) || hours > CLAIM_MAX_HOURS}
                  >
                    {$t('rikmaCode.claim.submit')}
                  </button>
                {/if}
                <button class="cancel" type="button" onclick={() => (openKey = null)}>
                  {$t('rikmaCode.pick.cancel')}
                </button>
              </div>
            </form>
          {/if}
        </li>
      {/each}
    </ul>
    <button class="cancel small" type="button" onclick={() => reloadTick++}>{$t('rikmaCode.work.refresh')}</button>
  {/if}
</section>

<style>
  .gh-work {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(203, 213, 225, 0.2);
  }
  .gh-work-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .gh-work-head h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--gold);
  }
  .mine-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: #e2e8f0;
  }
  .muted {
    color: #cbd5e1;
  }
  .small {
    font-size: 0.8rem;
  }
  .hint {
    color: #fde68a;
    font-size: 0.85rem;
  }
  .hint a {
    text-decoration: underline;
    color: var(--gold);
  }
  .mine-open {
    color: var(--gold);
    font-weight: 600;
  }
  .notice {
    padding: 0.5rem 0.8rem;
    border-radius: 0.6rem;
    border: 1px solid rgba(248, 113, 113, 0.6);
    background: rgba(127, 29, 29, 0.35);
    color: #fecaca;
  }
  .empty {
    padding: 1rem;
    border: 1px dashed rgba(203, 213, 225, 0.4);
    border-radius: 0.75rem;
    color: #cbd5e1;
    text-align: center;
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    padding: 0.7rem 0.9rem;
    border-radius: 0.75rem;
    border: 1px solid rgba(203, 213, 225, 0.25);
    background: rgba(15, 23, 42, 0.55);
  }
  .row.mine {
    border-color: var(--gold);
  }
  .row-main {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
    flex: 1 1 16rem;
  }
  .row-top,
  .row-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .row-meta {
    font-size: 0.8rem;
    color: #e2e8f0;
  }
  .ref {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-weight: 700;
    color: var(--gold);
  }
  .title {
    color: #e2e8f0;
    overflow-wrap: anywhere;
  }
  .chip {
    font-size: 0.72rem;
    padding: 0.1rem 0.5rem;
    border-radius: 9999px;
    border: 1px solid rgba(203, 213, 225, 0.35);
    color: #e2e8f0;
  }
  .chip.kind {
    border-color: var(--gold);
    color: var(--gold);
  }
  .chip.warn {
    border-color: rgba(251, 191, 36, 0.7);
    color: #fde68a;
  }
  .chip.ok {
    border-color: rgba(74, 222, 128, 0.7);
    color: #bbf7d0;
  }
  .claim-btn {
    padding: 0.4rem 1rem;
    border-radius: 9999px;
    background: var(--gold);
    color: #0f172a;
    font-weight: 700;
  }
  .claim-btn:disabled {
    opacity: 0.5;
  }
  .invite-btn {
    padding: 0.35rem 0.9rem;
    border-radius: 9999px;
    border: 1px solid var(--gold);
    color: var(--gold);
    font-size: 0.8rem;
  }
  .cancel {
    color: #e2e8f0;
    text-decoration: underline;
    align-self: flex-start;
  }
  .claim {
    flex: 1 1 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: 0.6rem;
    background: rgba(2, 6, 23, 0.5);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    color: var(--gold);
    font-size: 0.85rem;
  }
  .field select,
  .field input,
  .field textarea {
    padding: 0.4rem 0.6rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(203, 213, 225, 0.35);
    background: rgba(15, 23, 42, 0.9);
    color: #e2e8f0;
  }
  .claim-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
</style>
