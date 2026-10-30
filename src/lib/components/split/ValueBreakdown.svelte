<script>
  /**
   * Where each partner's value came from: completed missions, received
   * resources and stipend funding, one readable row each. Selecting a partner
   * (here or in the pie's legend) narrows the list to theirs.
   */
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { useFormatMoney } from '$lib/money/context.svelte';

  /**
   * @typedef {{ uid: string|number, username: string, color: string }} Member
   * @typedef {Object} Props
   * @property {Member[]} members
   * @property {any[]} fmiData
   * @property {any[]} rikmashes
   * @property {any[]} stipendPayments
   * @property {string|number|null} [selected]
   */

  /** @type {Props} */
  let { members, fmiData, rikmashes, stipendPayments, selected = $bindable(null) } = $props();

  const fmt = useFormatMoney();
  let open = $state(false);

  // A partner picked in the legend opens the list on their rows.
  $effect(() => {
    if (selected != null) open = true;
  });

  let byId = $derived(new Map(members.map((m) => [m.uid, m])));
  const GREY = '#94a3b8';
  const who = (uid) => byId.get(uid) ?? null;

  /** @type {Record<string, string>} */
  let KIND = $derived({
    total: $t('mash.total'),
    perUnit: $t('mash.perUnit'),
    monthly: $t('mash.monthly'),
    yearly: $t('mash.yearly'),
    rent: $t('mash.rent')
  });

  const num = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const date = (s) => {
    if (!s) return '';
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString($lang === 'en' ? 'en-GB' : $lang, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  let missions = $derived(
    fmiData
      .map((f) => {
        const a = f.attributes ?? {};
        const uid = a.users_permissions_user?.data?.id ?? null;
        return {
          id: f.id,
          uid,
          name: a.missionName,
          total: Number(a.total) || 0,
          hours: Number(a.noofhours) || 0,
          rate: Number(a.perhour) || 0,
          when: a.finish || a.createdAt,
          member: who(uid) ?? { username: a.users_permissions_user?.data?.attributes?.username ?? '', color: GREY },
          notes: [a.descrip, a.why, a.hearotMeyuchadot].filter(Boolean)
        };
      })
      .sort((x, y) => String(y.when ?? '').localeCompare(String(x.when ?? '')))
  );

  let resources = $derived(
    rikmashes.map((r) => {
      const a = r.attributes ?? {};
      const uid = a.users_permissions_user?.data?.id ?? null;
      return {
        id: r.id,
        uid,
        name: a.name,
        total: Number(a.total) || 0,
        kind: KIND[a.kindOf] ?? null,
        qty: a.kindOf === 'perUnit' ? Number(a.hm) || 0 : 0,
        price: Number(a.price ?? a.agprice) || 0,
        member: who(uid) ?? { username: a.users_permissions_user?.data?.attributes?.username ?? '', color: GREY },
        notes: [a.spnot].filter(Boolean)
      };
    })
  );

  let stipends = $derived(
    stipendPayments.map((s) => {
      const a = s.attributes ?? {};
      const fid = a.funder?.data?.id ?? null;
      const rid = a.recipient?.data?.id ?? null;
      return {
        id: s.id,
        fid,
        rid,
        funder: who(fid) ?? { username: a.funder?.data?.attributes?.username ?? '', color: GREY },
        recipient: who(rid) ?? { username: a.recipient?.data?.attributes?.username ?? '', color: GREY },
        credit: Number(a.equityCredit) || 0,
        debit: Number(a.equityDebit) || 0,
        from: a.cycleStart,
        to: a.cycleEnd
      };
    })
  );

  const mine = (uid) => selected == null || uid === selected;
  let fMissions = $derived(missions.filter((m) => mine(m.uid)));
  let fResources = $derived(resources.filter((r) => mine(r.uid)));
  let fStipends = $derived(stipends.filter((s) => mine(s.fid) || mine(s.rid)));
  let count = $derived(missions.length + resources.length + stipends.length);
  let shownCount = $derived(fMissions.length + fResources.length + fStipends.length);
  let withItems = $derived(
    members.filter(
      (m) =>
        missions.some((x) => x.uid === m.uid) ||
        resources.some((x) => x.uid === m.uid) ||
        stipends.some((x) => x.fid === m.uid || x.rid === m.uid)
    )
  );
</script>

<div class="vb">
  <div class="vb-head">
    <div>
      <h2 class="vb-title">{$t('moach.split.breakdown')}</h2>
      <p class="vb-sub">{$t('moach.split.items', { count })}</p>
    </div>
    <button type="button" class="vb-toggle" aria-expanded={open} onclick={() => (open = !open)}>
      {open ? $t('moach.split.hideBreakdown') : $t('moach.split.showBreakdown')}
      <span class="vb-chev" class:open aria-hidden="true">▾</span>
    </button>
  </div>

  {#if open}
    {#if withItems.length > 1}
      <div class="vb-chips" role="group">
        <button type="button" class="vb-chip" class:on={selected == null} onclick={() => (selected = null)}>
          {$t('moach.split.all')}
        </button>
        {#each withItems as m (m.uid)}
          <button
            type="button"
            class="vb-chip"
            class:on={selected === m.uid}
            style="--c: {m.color}"
            aria-pressed={selected === m.uid}
            onclick={() => (selected = selected === m.uid ? null : m.uid)}
          >
            <span class="vb-dot"></span>{m.username}
          </button>
        {/each}
      </div>
    {/if}

    {#if shownCount === 0}
      <p class="vb-none">{$t('moach.split.noItems')}</p>
    {/if}

    {#if fMissions.length}
      <h3 class="vb-group">{$t('moach.split.missions')} <span>{fMissions.length}</span></h3>
      <ul class="vb-list">
        {#each fMissions as m (m.id)}
          <li class="vb-item" style="--c: {m.member.color}">
            <div class="vb-main">
              <span class="vb-name">{m.name}</span>
              <span class="vb-meta">
                <span class="vb-who"><span class="vb-dot"></span>{m.member.username}</span>
                {#if m.hours > 0}
                  <span>{$t('moach.split.hoursRate', { hours: num(m.hours), rate: fmt(m.rate) })}</span>
                {/if}
                {#if date(m.when)}<span>{date(m.when)}</span>{/if}
              </span>
              {#if m.notes.length}
                <details class="vb-more">
                  <summary>{$t('moach.split.more')}</summary>
                  {#each m.notes as n}<p>{n}</p>{/each}
                </details>
              {/if}
            </div>
            <b class="vb-amt">{fmt(m.total)}</b>
          </li>
        {/each}
      </ul>
    {/if}

    {#if fResources.length}
      <h3 class="vb-group">{$t('moach.split.resources')} <span>{fResources.length}</span></h3>
      <ul class="vb-list">
        {#each fResources as r (r.id)}
          <li class="vb-item" style="--c: {r.member.color}">
            <div class="vb-main">
              <span class="vb-name">{r.name}</span>
              <span class="vb-meta">
                <span class="vb-who"><span class="vb-dot"></span>{r.member.username}</span>
                {#if r.kind}<span>{r.kind}</span>{/if}
                {#if r.qty > 0}
                  <span>{$t('moach.split.qtyPrice', { qty: num(r.qty), price: fmt(r.price) })}</span>
                {/if}
              </span>
              {#if r.notes.length}
                <details class="vb-more">
                  <summary>{$t('moach.split.more')}</summary>
                  {#each r.notes as n}<p>{n}</p>{/each}
                </details>
              {/if}
            </div>
            <b class="vb-amt">{fmt(r.total)}</b>
          </li>
        {/each}
      </ul>
    {/if}

    {#if fStipends.length}
      <h3 class="vb-group">{$t('moach.split.stipends')} <span>{fStipends.length}</span></h3>
      <ul class="vb-list">
        {#each fStipends as s (s.id)}
          <li class="vb-item" style="--c: {s.funder.color}">
            <div class="vb-main">
              <span class="vb-name">
                <span class="vb-who"><span class="vb-dot"></span>{s.funder.username}</span>
                <span aria-hidden="true">→</span>
                <span class="vb-who" style="--c: {s.recipient.color}"><span class="vb-dot"></span>{s.recipient.username}</span>
              </span>
              {#if date(s.from)}
                <span class="vb-meta"><span>{date(s.from)} – {date(s.to)}</span></span>
              {/if}
            </div>
            <span class="vb-amts">
              {#if s.credit}<b class="vb-pos">+{fmt(s.credit)}</b>{/if}
              {#if s.debit}<span class="vb-neg">−{fmt(s.debit)}</span>{/if}
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  .vb {
    color: var(--surface-ink);
  }
  .vb-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .vb-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--surface-ink);
  }
  .vb-sub {
    margin: 0;
    font-size: 0.85rem;
    color: var(--surface-muted);
  }
  .vb-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.9rem;
    border-radius: 999px;
    border: 1px solid var(--surface-line);
    background: var(--surface-2);
    color: var(--surface-ink);
    font-weight: 600;
    font-size: 0.9rem;
  }
  .vb-chev {
    transition: transform 0.2s ease;
  }
  .vb-chev.open {
    transform: rotate(180deg);
  }
  .vb-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 1rem;
  }
  .vb-chip {
    --c: var(--surface-muted);
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.75rem;
    border-radius: 999px;
    border: 1px solid var(--surface-line);
    background: var(--surface);
    color: var(--surface-ink);
    font-size: 0.85rem;
  }
  .vb-chip.on {
    border-color: var(--c);
    background: var(--surface-2);
    font-weight: 700;
    box-shadow: inset 0 0 0 1px var(--c);
  }
  .vb-dot {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 999px;
    background: var(--c);
    flex-shrink: 0;
  }
  .vb-group {
    margin: 1.25rem 0 0.5rem;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--surface-ink);
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .vb-group span {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0 0.45rem;
    border-radius: 999px;
    background: var(--surface-2);
    color: var(--surface-muted);
  }
  .vb-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .vb-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.65rem 0.85rem;
    border-radius: 0.8rem;
    background: var(--surface-2);
    border-inline-start: 4px solid var(--c);
  }
  .vb-main {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .vb-name {
    font-weight: 700;
    color: var(--surface-ink);
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    overflow-wrap: anywhere;
  }
  .vb-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.75rem;
    font-size: 0.8rem;
    color: var(--surface-muted);
  }
  .vb-who {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }
  .vb-amt,
  .vb-amts {
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
    color: var(--surface-ink);
  }
  .vb-amts {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.1rem;
  }
  .vb-pos {
    color: #16a34a;
  }
  .vb-neg {
    color: #dc2626;
    font-size: 0.9rem;
  }
  .vb-more {
    font-size: 0.85rem;
    color: var(--surface-muted);
  }
  .vb-more summary {
    cursor: pointer;
    color: var(--surface-accent);
    font-weight: 600;
    width: fit-content;
  }
  .vb-more p {
    margin: 0.3rem 0 0;
    color: var(--surface-ink);
    white-space: pre-wrap;
  }
  .vb-none {
    margin: 1rem 0 0;
    font-size: 0.9rem;
    color: var(--surface-muted);
  }
</style>
