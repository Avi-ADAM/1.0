<script>
  /**
   * The rikma's spaces in Ivory Tower (מגדל השן), the sister argument-map site
   * (docs/tbd/PLAN_ARGUMENT_MAP.md). It says what a rikma gets from holding a
   * space there, lists the spaces it already holds, and links to opening one
   * with this rikma preselected (`?rikma=<id>#new` on the Tower's home page).
   *
   * `spaces` arrives streamed from the loader: `undefined` while asking, `null`
   * when the Tower could not be asked (shown as both links — never as "you have
   * none"), otherwise the list this member may see.
   */
  import { t, isRtl } from '$lib/translations';

  /** @type {{ url: string, projectId: string | number, spaces: Promise<import('$lib/server/ivoryTower').TowerSpace[] | null> }} */
  let { url, projectId, spaces: spacesPromise } = $props();

  /** @type {import('$lib/server/ivoryTower').TowerSpace[] | null | undefined} */
  let spaces = $state(undefined);
  // Resolved into state rather than `{#await}`: the loader hands a new promise
  // on every invalidation, and the last answer stays on screen meanwhile.
  $effect(() => {
    const p = spacesPromise;
    let live = true;
    Promise.resolve(p).then(
      (v) => live && (spaces = v),
      () => live && (spaces = null)
    );
    return () => {
      live = false;
    };
  });

  let expanded = $state(false);
  let has = $derived(Array.isArray(spaces) && spaces.length > 0);
  let createHref = $derived(`${url}/?rikma=${encodeURIComponent(String(projectId))}#new`);
  // A rikma with no space yet gets the reasons open; one that has a space has
  // already read them.
  let showWhy = $derived(expanded || (Array.isArray(spaces) && spaces.length === 0));
</script>

<section class="tower" aria-labelledby="ivory-tower-title">
  <div class="tower-top">
    <span class="tower-icon" aria-hidden="true">🏛️</span>
    <h3 id="ivory-tower-title">{$t('rikmaDocs.tower.title')}</h3>
    <span class="badge">{$t('rikmaDocs.tower.badge')}</span>
  </div>

  <p class="lead">{$t('rikmaDocs.tower.lead')}</p>

  {#if showWhy}
    <ul class="why">
      <li>{$t('rikmaDocs.tower.why1')}</li>
      <li>{$t('rikmaDocs.tower.why2')}</li>
      <li>{$t('rikmaDocs.tower.why3')}</li>
      <li>{$t('rikmaDocs.tower.why4')}</li>
    </ul>
  {/if}

  {#if spaces === undefined}
    <p class="status" role="status">{$t('rikmaDocs.tower.checking')}</p>
  {:else if has}
    <ul class="spaces" aria-label={$t('rikmaDocs.tower.yours')}>
      {#each spaces ?? [] as s (s.slug)}
        <li>
          <a class="space" href="{url}/s/{s.slug}" target="_blank" rel="external noopener">
            <span class="space-text">
              <strong>{s.title}</strong>
              <small>
                {s.visibility === 'members' ? $t('rikmaDocs.tower.members') : $t('rikmaDocs.tower.public')}
                · {$t('rikmaDocs.tower.nodes', { count: s.nodeCount })}
              </small>
            </span>
            <span class="go" aria-hidden="true">{$isRtl ? '←' : '→'}</span>
          </a>
        </li>
      {/each}
    </ul>
  {:else if spaces === null}
    <p class="status">{$t('rikmaDocs.tower.unknown')}</p>
  {/if}

  {#if spaces !== undefined}
    <div class="actions">
      {#if has}
        <a class="link-btn" href={createHref} target="_blank" rel="external noopener">{$t('rikmaDocs.tower.another')}</a>
      {:else}
        <a class="cta" href={createHref} target="_blank" rel="external noopener">{$t('rikmaDocs.tower.createFirst')}</a>
      {/if}
      {#if spaces === null}
        <a class="link-btn" href={url} target="_blank" rel="external noopener">{$t('rikmaDocs.tower.open')}</a>
      {/if}
      {#if has}
        <button type="button" class="link-btn" aria-expanded={expanded} onclick={() => (expanded = !expanded)}>
          {expanded ? $t('rikmaDocs.tower.lessWhy') : $t('rikmaDocs.tower.moreWhy')}
        </button>
      {/if}
    </div>
  {/if}
</section>

<style>
  .tower {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding: 0.9rem 1rem;
    border-radius: 0.75rem;
    background: var(--surface-2);
    border: 1px solid var(--surface-line);
    border-inline-start: 4px solid var(--gold);
    color: var(--surface-ink);
  }
  /* Not `.top`: app.postcss has a global `.top { position: fixed }`. */
  .tower-top {
    display: flex;
    align-items: center;
    gap: 0.55rem;
  }
  .tower-icon {
    font-size: 1.3rem;
  }
  h3 {
    flex: 1;
    font-size: 1rem;
    font-weight: 800;
  }
  .badge {
    padding: 0.1rem 0.5rem;
    border-radius: 9999px;
    background: var(--surface-line);
    color: var(--surface-ink);
    font-size: 0.7rem;
    font-weight: 700;
  }
  .lead {
    font-size: 0.88rem;
    color: var(--surface-muted);
  }
  .why {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    margin: 0;
    padding-inline-start: 1.2rem;
    font-size: 0.84rem;
    list-style: disc;
  }
  .status {
    font-size: 0.82rem;
    color: var(--surface-muted);
  }
  .spaces {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .space {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem 0.8rem;
    border-radius: 0.6rem;
    background: var(--surface);
    border: 1px solid var(--surface-line);
    color: var(--surface-ink);
    text-decoration: none;
  }
  .space:hover {
    border-color: var(--gold);
  }
  .space-text {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .space-text small {
    color: var(--surface-muted);
    font-size: 0.76rem;
  }
  .go {
    color: var(--surface-muted);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1rem;
  }
  .cta {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1.05rem;
    border-radius: 9999px;
    background: var(--gold);
    color: #1a1408;
    font-weight: 800;
    font-size: 0.88rem;
    text-decoration: none;
  }
  .link-btn {
    padding: 0;
    color: var(--surface-ink);
    font-size: 0.82rem;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .space:focus-visible,
  .cta:focus-visible,
  .link-btn:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }
  @media (max-width: 480px) {
    .cta {
      width: 100%;
      justify-content: center;
    }
  }
</style>
