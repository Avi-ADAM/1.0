<script lang="ts">
  /**
   * Choose and sign the guardian set (T9b). Guardians may be ANY user
   * (plan §9, decision 2): rikma partners are offered first, anyone else is
   * added by exact username or email — the exact-match qid cannot be used to
   * browse the user base.
   */
  import { onMount } from 'svelte';
  import { t } from '$lib/translations';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { cookieUserId } from '$lib/client/devicePairing';
  import { publishGuardianSet, type GuardianSetView } from '$lib/client/recovery';
  import { MIN_THRESHOLD, MAX_GUARDIANS } from '$lib/consent/recovery';

  let {
    effective,
    pending,
    onsaved
  }: {
    effective: GuardianSetView | null;
    pending: GuardianSetView | null;
    onsaved: () => void;
  } = $props();

  type Person = { id: string; username: string };

  let editing = $state(false);
  let partners = $state<Person[]>([]);
  let chosen = $state<Person[]>([]);
  let threshold = $state(2);
  let lookup = $state('');
  let lookupMiss = $state(false);
  let busy = $state(false);
  let message = $state('');

  const current = $derived(pending ?? effective);
  const canSave = $derived(chosen.length >= MIN_THRESHOLD && threshold >= MIN_THRESHOLD && threshold <= chosen.length);

  const fmt = (ts: number) => new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  onMount(async () => {
    const uid = cookieUserId();
    if (!uid) return;
    try {
      const res: any = await sendToSer({ uid }, '170getMyCoMembers', 0, 0, false, fetch, { silent: true });
      const root = res?.data ?? res;
      const projects = root?.usersPermissionsUser?.data?.attributes?.projects_1s?.data ?? [];
      const seen = new Map<string, string>();
      for (const p of projects) {
        for (const u of p?.attributes?.user_1s?.data ?? []) {
          const id = String(u.id);
          if (id !== String(uid) && !seen.has(id)) seen.set(id, u.attributes?.username ?? id);
        }
      }
      partners = [...seen].map(([id, username]) => ({ id, username }))
        .sort((a, b) => a.username.localeCompare(b.username));
    } catch {
      partners = [];
    }
  });

  function startEditing() {
    chosen = (current?.guardians ?? []).map((g) => ({ id: g.id, username: g.username ?? g.id }));
    threshold = current?.threshold ?? 2;
    editing = true;
    message = '';
  }

  function toggle(p: Person) {
    if (chosen.some((c) => c.id === p.id)) chosen = chosen.filter((c) => c.id !== p.id);
    else if (chosen.length < MAX_GUARDIANS) chosen = [...chosen, p];
    // 2-of-3 is the default shape; keep the threshold inside the new n.
    if (threshold > chosen.length) threshold = Math.max(MIN_THRESHOLD, chosen.length);
  }

  async function addByLookup() {
    lookupMiss = false;
    const q = lookup.trim();
    if (!q) return;
    try {
      const res: any = await sendToSer({ q }, '171findUserByExact', 0, 0, false, fetch, { silent: true });
      const root = res?.data ?? res;
      const u = root?.usersPermissionsUsers?.data?.[0];
      if (!u || String(u.id) === String(cookieUserId())) {
        lookupMiss = true;
        return;
      }
      const p = { id: String(u.id), username: u.attributes?.username ?? q };
      if (!chosen.some((c) => c.id === p.id)) toggle(p);
      lookup = '';
    } catch {
      lookupMiss = true;
    }
  }

  async function save() {
    busy = true;
    message = '';
    try {
      const res = await publishGuardianSet(chosen.map((c) => c.id), threshold);
      if (res.ok) {
        message = $t('recovery.set.saved');
        editing = false;
        onsaved();
      } else {
        message = $t('recovery.error', { reason: res.reason });
      }
    } finally {
      busy = false;
    }
  }
</script>

<section class="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-white/60 dark:bg-zinc-900/40 space-y-3">
  <h2 class="font-semibold text-goldink">{$t('recovery.set.title')}</h2>

  {#snippet chips(list: GuardianSetView['guardians'])}
    <ul class="flex flex-wrap gap-2">
      {#each list as g (g.id)}
        <li
          class="rounded-full px-3 py-1 text-sm {g.accepted
            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}"
        >
          {g.accepted ? '✓' : '…'} {g.username ?? g.id}
          <span class="text-xs opacity-80">· {g.accepted ? $t('recovery.set.agreed') : $t('recovery.set.waitingConsent')}</span>
        </li>
      {/each}
    </ul>
  {/snippet}

  {#if effective}
    <p class="text-sm">{$t('recovery.set.effective', { threshold: effective.threshold, total: effective.guardians.length })}</p>
    {@render chips(effective.guardians)}
  {:else if !pending}
    <p class="text-sm text-zinc-500">{$t('recovery.set.none')}</p>
  {/if}

  {#if pending}
    <div class="space-y-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-800 dark:text-amber-200">
      <p>{$t('recovery.set.pendingConsent', {
        date: fmt(pending.activeAt ?? pending.signedAt),
        threshold: pending.threshold
      })}</p>
      <p>{$t('recovery.set.thresholdOf', { threshold: pending.threshold, total: pending.guardians.length })}</p>
      {@render chips(pending.guardians)}
    </div>
  {/if}

  {#if !editing}
    <button
      class="rounded-full bg-gradient-to-br from-barbi to-mpink px-4 py-2 text-sm font-bold text-gold hover:brightness-110"
      onclick={startEditing}
    >{current ? $t('recovery.set.edit') : $t('recovery.set.create')}</button>
  {:else}
    <p class="text-xs text-zinc-500">{$t('recovery.set.tip')}</p>

    <div>
      <h3 class="mb-1 text-sm font-semibold">{$t('recovery.set.partners')}</h3>
      {#if partners.length === 0}
        <p class="text-xs text-zinc-500">{$t('recovery.set.noPartners')}</p>
      {:else}
        <div class="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
          {#each partners as p (p.id)}
            {@const on = chosen.some((c) => c.id === p.id)}
            <button
              type="button"
              class="rounded-full border px-3 py-1 text-sm {on
                ? 'border-goldink bg-goldink/10 font-semibold text-goldink'
                : 'border-zinc-300 dark:border-zinc-600'}"
              aria-pressed={on}
              onclick={() => toggle(p)}
            >{on ? '✓ ' : ''}{p.username}</button>
          {/each}
        </div>
      {/if}
    </div>

    <div>
      <h3 class="mb-1 text-sm font-semibold">{$t('recovery.set.anyone')}</h3>
      <form class="flex gap-2" onsubmit={(e) => { e.preventDefault(); addByLookup(); }}>
        <input
          class="min-w-0 flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-transparent px-2 py-1 text-sm"
          placeholder={$t('recovery.set.anyonePlaceholder')}
          bind:value={lookup}
          dir="auto"
        />
        <button class="rounded-lg border px-3 py-1 text-sm" type="submit">{$t('recovery.set.add')}</button>
      </form>
      {#if lookupMiss}<p class="mt-1 text-xs text-rose-600">{$t('recovery.set.notFound')}</p>{/if}
    </div>

    {#if chosen.length > 0}
      <div>
        <h3 class="mb-1 text-sm font-semibold">{$t('recovery.set.chosen')}</h3>
        <ul class="flex flex-wrap gap-2">
          {#each chosen as c (c.id)}
            <li class="flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-sm">
              {c.username}
              <button
                type="button"
                class="text-zinc-500 hover:text-rose-600"
                aria-label={$t('recovery.set.remove')}
                onclick={() => toggle(c)}
              >×</button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if chosen.length < MIN_THRESHOLD}
      <p class="text-xs text-zinc-500">{$t('recovery.set.minGuardians')}</p>
    {:else}
      <label class="flex flex-wrap items-center gap-2 text-sm">
        <span>{$t('recovery.set.threshold')}</span>
        <select class="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-transparent px-2 py-1" bind:value={threshold}>
          {#each Array.from({ length: chosen.length - MIN_THRESHOLD + 1 }, (_, i) => i + MIN_THRESHOLD) as k (k)}
            <option value={k}>{k}</option>
          {/each}
        </select>
        <span class="text-zinc-500">{$t('recovery.set.thresholdOf', { threshold, total: chosen.length })}</span>
      </label>
    {/if}

    <p class="text-xs text-zinc-500">{$t('recovery.set.delayNote')}</p>
    <button
      class="rounded-full bg-gradient-to-br from-barbi to-mpink px-4 py-2 text-sm font-bold text-gold hover:brightness-110 disabled:opacity-40"
      disabled={busy || !canSave}
      onclick={save}
    >{$t('recovery.set.save')}</button>
  {/if}

  {#if message}<p class="text-sm text-goldink" role="status">{message}</p>{/if}
</section>
