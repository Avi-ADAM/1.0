<script>
  import { t } from '$lib/translations';

  let {
    label,
    name,
    status      = null,
    statusColor = null,
    user        = null,
    hasForum    = false,
    onClick,
    onChatClick = null,
    lang        = 'en'
  } = $props();

  const badgeMap = {
    green:  'bdg-green',
    grey:   'bdg-grey',
    blue:   'bdg-sky',
    yellow: 'bdg-gold',
    rose:   'bdg-rose',
  };

  let badgeClass = $derived(badgeMap[statusColor] ?? 'bdg-grey');
  let ariaLabel  = $derived(status ? `${label}: ${name} — ${status}` : `${label}: ${name}`);

</script>

<button type="button" class="cn" aria-label={ariaLabel} onclick={onClick}>
  <span class="cn-label">{label}</span>
  <span class="cn-name">{name}</span>

  {#if status}
    <span role="status" class="cn-badge {badgeClass}">{status}</span>
  {/if}

  {#if user}
    <div class="cn-user">
      {#if user.profilePicUrl}
        <img src={user.profilePicUrl} alt={user.username} class="cn-avatar" loading="lazy" />
      {:else}
        <span class="cn-initials" aria-hidden="true">
          {user.username?.[0]?.toUpperCase() ?? '?'}
        </span>
      {/if}
      <span class="cn-username">{user.username}</span>
    </div>
  {/if}

  {#if hasForum && onChatClick}
    <button
      type="button"
      class="cn-chat"
      aria-label={$t('process.node.chatLabel')}
      onclick={(e) => { e.stopPropagation(); onChatClick(); }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  {/if}
</button>

<style>
  .cn {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    min-width: 8rem;
    max-width: 13rem;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid var(--pcv-node-border, #e7e5e4);
    background: var(--pcv-node-bg, #ffffff);
    cursor: pointer;
    text-align: start;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  }

  .cn:hover {
    border-color: var(--gold, #f59e0b);
    box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.18),
                0 2px 8px rgba(245, 158, 11, 0.12);
    background: var(--pcv-node-hover, #fffbf0);
  }

  .cn:focus-visible {
    outline: 2px solid var(--rose, #e11d48);
    outline-offset: 2px;
  }

  .cn-label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--pcv-text-3, #a8a29e);
  }

  .cn-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--pcv-text, #1c1917);
    line-height: 1.35;
    word-break: break-word;
  }

  /* ── Status badges ─────────────────────────────────────────────────────── */
  .cn-badge {
    display: inline-flex;
    align-items: center;
    border-radius: 9999px;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    margin-top: 2px;
  }

  .bdg-gold  { background: var(--badge-gold-bg,  rgba(245,158,11,.12)); color: var(--badge-gold-text,  #b45309); }
  .bdg-rose  { background: var(--badge-rose-bg,  rgba(225, 29,72,.10)); color: var(--badge-rose-text,  #be123c); }
  .bdg-green { background: var(--badge-green-bg, rgba(  5,150,105,.10)); color: var(--badge-green-text, #065f46); }
  .bdg-sky   { background: var(--badge-sky-bg,   rgba(  2,132,199,.10)); color: var(--badge-sky-text,   #0369a1); }
  .bdg-grey  { background: var(--badge-grey-bg,  rgba(107,114,128,.10)); color: var(--badge-grey-text,  #6b7280); }

  /* ── User row ──────────────────────────────────────────────────────────── */
  .cn-user {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 3px;
  }

  .cn-avatar,
  .cn-initials {
    width: 18px;
    height: 18px;
    border-radius: 9999px;
    flex-shrink: 0;
  }

  .cn-avatar { object-fit: cover; }

  .cn-initials {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--badge-gold-bg, rgba(245,158,11,.15));
    color: var(--badge-gold-text, #b45309);
    font-size: 9px;
    font-weight: 700;
  }

  .cn-username {
    font-size: 11px;
    color: var(--pcv-text-2, #78716c);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── Chat button ───────────────────────────────────────────────────────── */
  .cn-chat {
    position: absolute;
    top: 6px;
    inset-inline-end: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--pcv-text-3, #a8a29e);
    opacity: 0;
    cursor: pointer;
    transition: opacity 0.15s, background 0.15s, color 0.15s;
  }

  .cn:hover .cn-chat,
  .cn-chat:focus-visible {
    opacity: 1;
  }

  .cn-chat:hover {
    background: var(--badge-rose-bg, rgba(225,29,72,.10));
    color: var(--rose, #e11d48);
  }

  .cn-chat:focus-visible {
    outline: 2px solid var(--rose, #e11d48);
    outline-offset: 2px;
  }

  .cn-chat svg {
    width: 13px;
    height: 13px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
