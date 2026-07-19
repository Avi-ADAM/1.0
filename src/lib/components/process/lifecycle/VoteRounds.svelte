<script>
  /**
   * VoteRounds — renders a votes/negotiation component array
   * (ComponentProjectsVots or ComponentProjectsPendmnego) grouped into rounds
   * by `order`. Round 0 is the original claim; each later round is a
   * counter-proposal ping-pong until both sides sign the same version.
   */
  import { groupVotesByRound, mediaUrl } from '$lib/utils/processLifecycle';

  let { vots = [], lang = 'en' } = $props();

  const i18n = {
    he: { round: 'סבב', approved: 'אישר/ה', countered: 'הגיב/ה בהצעה נגדית', pending: 'טרם הגיב/ה', empty: 'אין הצבעות עדיין' },
    en: { round: 'Round', approved: 'Approved', countered: 'Countered', pending: 'No answer yet', empty: 'No votes yet' },
    ar: { round: 'جولة', approved: 'وافق/ت', countered: 'رد/ت باقتراح مضاد', pending: 'لم يرد بعد', empty: 'لا توجد أصوات بعد' }
  };
  let t = $derived(i18n[lang] ?? i18n.en);

  let rounds = $derived(groupVotesByRound(vots));

  function formatDate(value) {
    if (!value) return '';
    try {
      return new Date(value).toLocaleDateString(lang === 'he' ? 'he-IL' : lang === 'ar' ? 'ar' : 'en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch {
      return '';
    }
  }
</script>

{#if rounds.length === 0}
  <p class="vr-empty">{t.empty}</p>
{:else}
  <div class="vr">
    {#each rounds as round (round.order)}
      <div class="vr-round">
        {#if rounds.length > 1}
          <span class="vr-round-label">{t.round} {round.order + 1}</span>
        {/if}
        <ul class="vr-list">
          {#each round.votes as vote (vote.id)}
            <li class="vr-vote">
              {#if vote.profilePicUrl}
                <img class="vr-avatar" src={mediaUrl(vote.profilePicUrl)} alt={vote.username} loading="lazy" />
              {:else}
                <span class="vr-initials" aria-hidden="true">{vote.username?.[0]?.toUpperCase() ?? '?'}</span>
              {/if}
              <span class="vr-name">{vote.username || `#${vote.userId}`}</span>
              {#if vote.what === true}
                <span class="vr-what vr-what--yes">✓ {t.approved}</span>
              {:else if vote.what === false}
                <span class="vr-what vr-what--no">↺ {t.countered}</span>
              {:else}
                <span class="vr-what vr-what--pending">{t.pending}</span>
              {/if}
              {#if vote.zman}
                <span class="vr-date">{formatDate(vote.zman)}</span>
              {/if}
              {#if vote.why}
                <p class="vr-why">{vote.why}</p>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
{/if}

<style>
  .vr { display: flex; flex-direction: column; gap: 8px; }

  .vr-empty {
    margin: 0;
    font-size: 12px;
    color: var(--pcv-text-3, #a8a29e);
    font-style: italic;
  }

  .vr-round { display: flex; flex-direction: column; gap: 4px; }

  .vr-round-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--badge-gold-text, #b45309);
  }

  .vr-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .vr-vote {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 5px 8px;
    border-radius: 8px;
    background: var(--pcv-node-bg, #ffffff);
    border: 1px solid var(--pcv-node-border, #e7e5e4);
  }

  .vr-avatar {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .vr-initials {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    font-size: 10px;
    font-weight: 700;
    background: var(--badge-grey-bg, rgba(107,114,128,.10));
    color: var(--badge-grey-text, #6b7280);
    flex-shrink: 0;
  }

  .vr-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--pcv-text, #1c1917);
  }

  .vr-what {
    font-size: 11px;
    font-weight: 600;
    padding: 1px 7px;
    border-radius: 9999px;
  }
  .vr-what--yes {
    background: var(--badge-green-bg, rgba(5,150,105,.10));
    color: var(--badge-green-text, #065f46);
  }
  .vr-what--no {
    background: var(--badge-rose-bg, rgba(225,29,72,.10));
    color: var(--badge-rose-text, #be123c);
  }
  .vr-what--pending {
    background: var(--badge-grey-bg, rgba(107,114,128,.10));
    color: var(--badge-grey-text, #6b7280);
  }

  .vr-date {
    font-size: 10px;
    color: var(--pcv-text-3, #a8a29e);
    margin-inline-start: auto;
  }

  .vr-why {
    flex-basis: 100%;
    margin: 0;
    font-size: 11px;
    line-height: 1.45;
    color: var(--pcv-text-2, #78716c);
  }
</style>
