<script module lang="ts">
  export interface PickedCity {
    name: string;
    district: string | null;
    code: string | null;
  }
</script>

<script lang="ts">
  /**
   * A locality from the CBS list (`/api/v1/places/cities`), with its district —
   * so a zone or a preview gets the name exactly as the server will match it.
   * Enter on text with no match takes the text as typed: the list can be
   * missing a place, and a member must never be stuck because of it.
   */

  let {
    placeholder = '',
    label = '',
    value = $bindable(''),
    onpick
  }: {
    placeholder?: string;
    label?: string;
    value?: string;
    onpick: (city: PickedCity) => void;
  } = $props();

  let results = $state<PickedCity[]>([]);
  let open = $state(false);
  let active = $state(-1);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let seq = 0;
  const listId = `cp-${Math.random().toString(36).slice(2, 8)}`;

  function search(q: string) {
    clearTimeout(timer);
    if (q.trim().length < 2) {
      results = [];
      return;
    }
    timer = setTimeout(async () => {
      const mine = ++seq;
      try {
        const res = await fetch(`/api/v1/places/cities?q=${encodeURIComponent(q.trim())}`);
        const body = res.ok ? await res.json() : null;
        if (mine !== seq) return;
        results = (body?.cities ?? []).map((c: any) => ({ name: c.name, district: c.district ?? null, code: c.code ?? null }));
        active = -1;
        open = true;
      } catch {
        if (mine === seq) results = [];
      }
    }, 180);
  }

  function pick(c: PickedCity) {
    onpick(c);
    open = false;
    results = [];
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      open = true;
      active = Math.min(results.length - 1, active + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = Math.max(-1, active - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = results[active] ?? results.find((r) => r.name === value.trim());
      if (chosen) pick(chosen);
      else if (value.trim()) pick({ name: value.trim(), district: null, code: null });
    } else if (e.key === 'Escape') {
      open = false;
    }
  }
</script>

<div class="cp">
  <input
    class="sh-input"
    type="text"
    role="combobox"
    aria-label={label || placeholder}
    aria-expanded={open && results.length > 0}
    aria-controls={listId}
    aria-autocomplete="list"
    aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
    autocomplete="off"
    {placeholder}
    bind:value
    oninput={() => search(value)}
    {onkeydown}
    onblur={() => setTimeout(() => (open = false), 150)}
  />
  {#if open && results.length}
    <ul class="cp-list sh-card" id={listId} role="listbox">
      {#each results as c, i (c.code ?? c.name)}
        <li id="{listId}-{i}" role="option" aria-selected={i === active}>
          <button type="button" class:cp-active={i === active} onmousedown={(e) => e.preventDefault()} onclick={() => pick(c)}>
            <bdi>{c.name}</bdi>
            {#if c.district}<span class="cp-muted">{c.district}</span>{/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .cp {
    position: relative;
    min-width: 0;
  }
  .cp-list {
    position: absolute;
    inset-inline: 0;
    top: calc(100% + 4px);
    z-index: 20;
    list-style: none;
    margin: 0;
    padding: 4px;
    max-height: 260px;
    overflow-y: auto;
  }
  .cp-list button {
    width: 100%;
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 8px;
    background: transparent;
    border: 0;
    color: var(--sh-ink);
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  .cp-list button:hover,
  .cp-active {
    background: var(--sh-card-2, rgba(0, 0, 0, 0.05));
  }
  .cp-muted {
    color: var(--sh-muted);
    font-size: 12px;
  }
</style>
