<!--
  Step 3 · Connection (docs/inprogress/PLAN_EXHIBITION_MODE.md §3.3).

  The idea and its parts in the middle; nine invented people around them, and
  the visitor's own place among them. Pointing at a person lights threads to
  the parts they could take and says why — the skills that matched, from
  `computeMissionMatchScore`, the platform's own matching. Pointing at a part
  lights everyone who could take it. A click invites (or takes it back).

  The point it makes: nobody is hired here. The visitor is a node in the same
  circle and says what they bring, exactly as the people they invite do.
  Keys: 1–9 invite, 0 opens "what do you bring".
-->
<script>
  import { fade, scale } from 'svelte/transition';
  import { t, isRtl } from '$lib/translations';
  import { PEOPLE } from '$lib/exhibit/fixtures/people';
  import { SKILLS } from '$lib/exhibit/types';
  import { ME, MAX_INVITED, MAX_MY_SKILLS } from '$lib/exhibit/sandbox.svelte';
  import PersonOrb from './PersonOrb.svelte';
  import IdeaGlyph from './IdeaGlyph.svelte';

  /** @type {{ sandbox: import('$lib/exhibit/sandbox.svelte').ExhibitSandbox }} */
  let { sandbox } = $props();

  /** Who / what the visitor is pointing at — only one at a time. */
  let activePerson = $state(/** @type {string | null} */ (null));
  let activePart = $state(/** @type {string | null} */ (null));
  let picking = $state(false);
  let fullNote = $state(false);

  /** @param {import('$lib/exhibit/types').ExhibitTask} task */
  const label = (task) => (task.i18n ? $t(task.label) : task.label);
  const partKey = (/** @type {import('$lib/exhibit/types').ExhibitTask} */ task) => `${task.kind}:${task.id}`;
  const personName = (/** @type {string} */ id) =>
    id === ME ? $t('exhibit.connection.me.name') : $t(`exhibit.people.${id}.name`);

  let ideaTitle = $derived(sandbox.idea ? (sandbox.idea.i18n ? $t(sandbox.idea.title) : sandbox.idea.title) : '');

  // ── Geometry ──────────────────────────────────────────────────────────
  let cw = $state(0);
  let ch = $state(0);

  /**
   * A wide, short screen: the people stand in two columns, one on each side,
   * each column staggered in and out so neighbours' names never touch. The
   * visitor heads the column where reading starts; the nine follow in number
   * order, down that column and then down the other.
   */
  let nodes = $derived.by(() => {
    const start = $isRtl ? 1 : -1;
    const ids = [ME, ...PEOPLE.map((p) => p.id)];
    return ids.map((id, k) => {
      const side = k < 5 ? start : -start;
      const j = k % 5;
      const reach = j % 2 ? 0.44 : 0.34;
      return { id, x: side * cw * reach, y: (j - 2) * ch * 0.185 - ch * 0.02 };
    });
  });
  /** The parts ring the idea, close enough that a thread to them reads as one. */
  let parts = $derived(
    sandbox.tasks.map((task, i, all) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / all.length;
      return { task, key: partKey(task), x: Math.cos(a) * cw * 0.17, y: Math.sin(a) * ch * 0.37 };
    })
  );
  const nodeAt = (/** @type {string} */ id) => nodes.find((n) => n.id === id);
  const partAt = (/** @type {string} */ key) => parts.find((p) => p.key === key);

  /** A thread between two points around the centre, bowed slightly. */
  function thread(/** @type {{x:number,y:number}} */ a, /** @type {{x:number,y:number}} */ b) {
    const ax = cw / 2 + a.x;
    const ay = ch / 2 + a.y;
    const bx = cw / 2 + b.x;
    const by = ch / 2 + b.y;
    const mx = (ax + bx) / 2 - (by - ay) * 0.12;
    const my = (ay + by) / 2 + (bx - ax) * 0.12;
    return `M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`;
  }

  // ── What is lit ───────────────────────────────────────────────────────
  let personMatches = $derived(activePerson ? sandbox.matchesForPerson(activePerson) : []);
  let litParts = $derived(new Set(personMatches.map((m) => partKey(m.task))));
  let partMatches = $derived.by(() => {
    if (!activePart) return [];
    const p = partAt(activePart);
    if (!p) return [];
    const people = sandbox.matchesForTask(p.task).map((m) => m.personId);
    const me = sandbox.matchesForPerson(ME).some((m) => partKey(m.task) === activePart);
    return me ? [...people, ME] : people;
  });
  let litPeople = $derived(new Set(partMatches));
  let because = $derived([
    ...new Set(personMatches.flatMap((m) => m.result.matchedSkills))
  ].map((s) => $t(`exhibit.skills.${s}`)));

  let lines = $derived.by(() => {
    /** @type {{ d: string, kind: 'lit' | 'bond', key: string }[]} */
    const out = [];
    for (const id of sandbox.invited) {
      const n = nodeAt(id);
      if (n) out.push({ d: thread(n, { x: 0, y: 0 }), kind: 'bond', key: `bond:${id}` });
    }
    if (sandbox.mySkills.length) {
      const n = nodeAt(ME);
      if (n) out.push({ d: thread(n, { x: 0, y: 0 }), kind: 'bond', key: 'bond:me' });
    }
    if (activePerson) {
      const n = nodeAt(activePerson);
      for (const m of personMatches) {
        const p = partAt(partKey(m.task));
        if (n && p) out.push({ d: thread(n, p), kind: 'lit', key: `lit:${activePerson}:${p.key}` });
      }
    }
    if (activePart) {
      const p = partAt(activePart);
      for (const id of partMatches) {
        const n = nodeAt(id);
        if (n && p) out.push({ d: thread(p, n), kind: 'lit', key: `lit:${activePart}:${id}` });
      }
    }
    return out;
  });

  // ── Actions ───────────────────────────────────────────────────────────
  function invite(/** @type {string} */ id) {
    const ok = sandbox.toggleInvite(id);
    fullNote = !ok && sandbox.invited.length >= MAX_INVITED;
  }

  function point(/** @type {string | null} */ person, /** @type {string | null} */ part = null) {
    activePerson = person;
    activePart = part;
  }

  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (picking) {
      if (e.key === 'Escape') {
        e.preventDefault();
        picking = false;
      }
      return;
    }
    const n = Number(e.key);
    if (!Number.isInteger(n) || e.key === ' ') return;
    if (n === 0) {
      e.preventDefault();
      picking = true;
    } else if (n <= PEOPLE.length) {
      e.preventDefault();
      invite(PEOPLE[n - 1].id);
      point(PEOPLE[n - 1].id);
    }
  }

  /** @param {HTMLElement} el */
  const focusOnMount = (el) => {
    el.focus({ preventScroll: true });
  };
</script>

<svelte:window onkeydown={onKey} />

<section class="conn">
  <header>
    <h1 class="ex-display">{$t('exhibit.connection.title')}</h1>
    <p class="sub">{$t('exhibit.connection.sub')}</p>
  </header>

  <div class="scene" bind:clientWidth={cw} bind:clientHeight={ch}>
    {#if cw && ch && sandbox.idea}
      <svg class="threads" viewBox="0 0 {cw} {ch}" aria-hidden="true">
        {#each lines as l (l.key)}
          <path d={l.d} pathLength="1" class="thread {l.kind}" />
        {/each}
      </svg>

      <!-- The centre answers whatever the visitor is pointing at. -->
      <div class="core" aria-live="polite">
        {#if activePerson}
          <span class="core-kicker">{$t('exhibit.connection.fits', { name: personName(activePerson) })}</span>
          {#if personMatches.length}
            <ul class="fits">
              {#each personMatches.slice(0, 4) as m (partKey(m.task))}
                <li dir="auto">{label(m.task)}</li>
              {/each}
            </ul>
            <span class="because">{$t('exhibit.connection.because', { skills: because.join(' · ') })}</span>
          {:else}
            <span class="because">
              {activePerson === ME && !sandbox.mySkills.length
                ? $t('exhibit.connection.me.empty')
                : $t('exhibit.connection.nothingFits')}
            </span>
          {/if}
        {:else if activePart}
          {@const p = partAt(activePart)}
          {#if p}
            <span class="core-title" dir="auto">{label(p.task)}</span>
            <span class="because">{$t('exhibit.connection.whoCan', { count: partMatches.length })}</span>
          {/if}
        {:else}
          <IdeaGlyph kind={sandbox.idea.key === 'custom' ? 'own' : sandbox.idea.key} size={56} />
          <span class="core-title" dir="auto">{ideaTitle}</span>
          <span class="because">{$t('exhibit.connection.howTo')}</span>
        {/if}
      </div>

      <ul class="parts">
        {#each parts as p (p.key)}
          <li style="transform: translate(calc(-50% + {p.x}px), calc(-50% + {p.y}px))">
            <button
              type="button"
              class="chip {p.task.kind}"
              class:lit={litParts.has(p.key) || activePart === p.key}
              class:dim={(activePerson && !litParts.has(p.key)) || (activePart && activePart !== p.key)}
              onpointerenter={() => point(null, p.key)}
              onpointerleave={() => point(null)}
              onfocus={() => point(null, p.key)}
              onblur={() => point(null)}
              dir="auto"
            >
              {label(p.task)}
            </button>
          </li>
        {/each}
      </ul>

      <ul class="people">
        {#each nodes as n, k (n.id)}
          {@const person = PEOPLE.find((x) => x.id === n.id)}
          <li style="transform: translate(calc(-50% + {n.x}px), calc(-50% + {n.y}px))">
            {#if person}
              <button
                type="button"
                class="person"
                aria-pressed={sandbox.isInvited(n.id)}
                aria-label={sandbox.isInvited(n.id)
                  ? $t('exhibit.connection.uninvite', { name: personName(n.id) })
                  : $t('exhibit.connection.invite', { name: personName(n.id) })}
                onclick={() => invite(n.id)}
                onpointerenter={() => point(n.id)}
                onpointerleave={() => point(null)}
                onfocus={() => point(n.id)}
                onblur={() => point(null)}
              >
                <PersonOrb
                  hue={person.hue}
                  variant={k}
                  num={String(k)}
                  name={personName(n.id)}
                  tag={$t(`exhibit.people.${n.id}.tag`)}
                  invited={sandbox.isInvited(n.id)}
                  active={activePerson === n.id || litPeople.has(n.id)}
                  dim={(!!activePart && !litPeople.has(n.id)) || (!!activePerson && activePerson !== n.id)}
                />
              </button>
            {:else}
              <button
                type="button"
                class="person"
                onclick={() => (picking = true)}
                onpointerenter={() => point(ME)}
                onpointerleave={() => point(null)}
                onfocus={() => point(ME)}
                onblur={() => point(null)}
              >
                <PersonOrb
                  hue={45}
                  me
                  num="0"
                  name={personName(ME)}
                  tag={sandbox.mySkills.length
                    ? sandbox.mySkills.map((s) => $t(`exhibit.skills.${s}`)).join(' · ')
                    : $t('exhibit.connection.me.tag')}
                  invited={sandbox.mySkills.length > 0}
                  active={activePerson === ME || litPeople.has(ME)}
                  dim={(!!activePart && !litPeople.has(ME)) || (!!activePerson && activePerson !== ME)}
                />
              </button>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <footer class="bar">
    <p class="circle" aria-live="polite">
      {#if fullNote}
        {$t('exhibit.connection.full')}
      {:else if sandbox.invited.length}
        {$t('exhibit.connection.circle', { count: sandbox.invited.length })}
        <span class="hint">· {$t('exhibit.connection.hint')}</span>
      {:else}
        {$t('exhibit.connection.circleEmpty')}
        <span class="hint">· {$t('exhibit.connection.hint')}</span>
      {/if}
    </p>
    <button
      type="button"
      class="ex-btn ex-btn-primary"
      disabled={!sandbox.canGo('partnership')}
      onclick={() => sandbox.next()}
    >
      {$t('exhibit.connection.next')}
      <span class="ltr:-scale-x-100 inline-block" aria-hidden="true">←</span>
    </button>
  </footer>

  {#if picking}
    <div class="picker-wrap" transition:fade={{ duration: 200 }}>
      <div
        class="picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ex-pick-title"
        transition:scale={{ start: 0.94, duration: 250 }}
      >
        <h2 id="ex-pick-title" class="ex-display">{$t('exhibit.connection.me.pick')}</h2>
        <p class="sub">{$t('exhibit.connection.me.pickSub')}</p>
        <ul class="skills">
          {#each SKILLS as s (s)}
            {@const on = sandbox.mySkills.includes(s)}
            <li>
              <button
                type="button"
                class="skill"
                class:on
                aria-pressed={on}
                disabled={!on && sandbox.mySkills.length >= MAX_MY_SKILLS}
                onclick={() => sandbox.toggleMySkill(s)}
              >
                {$t(`exhibit.skills.${s}`)}
              </button>
            </li>
          {/each}
        </ul>
        <button type="button" class="ex-btn ex-btn-primary" use:focusOnMount onclick={() => (picking = false)}>
          {$t('exhibit.connection.me.done')}
        </button>
      </div>
    </div>
  {/if}
</section>

<style>
  .conn {
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-height: 0;
    padding: 0 clamp(1.5rem, 3vw, 4rem) clamp(0.5rem, 1.2vh, 1.25rem);
  }
  header {
    text-align: center;
  }
  h1 {
    font-size: clamp(2.2rem, 3.2vw, 4.2rem);
  }
  .sub {
    margin: 0.3em 0 0;
    font-size: clamp(1.15rem, 1.5vw, 1.8rem);
    color: var(--ex-ink-soft);
  }
  .scene {
    position: relative;
    min-height: 0;
  }
  .threads {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }
  .thread {
    fill: none;
    stroke-linecap: round;
  }
  .thread.bond {
    stroke: var(--ex-gold);
    stroke-width: 3;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: draw 700ms ease-out forwards;
  }
  .thread.lit {
    stroke: var(--ex-pink);
    stroke-width: 3.5;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: draw 450ms ease-out forwards;
  }
  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }

  .core {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: clamp(220px, 14vw, 290px);
    aspect-ratio: 1;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 1.3rem;
    text-align: center;
    background: radial-gradient(circle, #fff 58%, var(--ex-blush));
    border: 4px solid var(--ex-gold);
    box-shadow:
      0 0 0 14px rgba(212, 161, 42, 0.12),
      0 24px 60px rgba(58, 36, 24, 0.12);
    z-index: 1;
  }
  .core-title {
    font-size: clamp(1.2rem, 1.45vw, 1.8rem);
    font-weight: 800;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }
  .core-kicker {
    font-size: clamp(1rem, 1.1vw, 1.35rem);
    font-weight: 800;
    color: var(--ex-pink-deep);
  }
  .fits {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: clamp(1rem, 1.1vw, 1.35rem);
    font-weight: 700;
    line-height: 1.2;
  }
  .because {
    font-size: clamp(0.85rem, 0.95vw, 1.15rem);
    color: var(--ex-ink-soft);
    line-height: 1.25;
  }

  .parts,
  .people {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .parts li,
  .people li {
    position: absolute;
    left: 50%;
    top: 50%;
  }
  .parts li {
    z-index: 2;
  }
  .people li {
    z-index: 3;
  }
  .chip {
    max-width: clamp(170px, 11vw, 230px);
    padding: 0.45rem 0.9rem;
    border-radius: 999px;
    border: 3px solid var(--ex-pink);
    background: rgba(255, 255, 255, 0.95);
    font: inherit;
    font-size: clamp(0.95rem, 1vw, 1.2rem);
    font-weight: 700;
    color: var(--ex-ink);
    line-height: 1.2;
    cursor: default;
    transition:
      opacity 250ms ease,
      transform 250ms ease,
      box-shadow 250ms ease;
  }
  .chip.resource {
    border-color: var(--ex-gold);
    border-radius: 0.6rem;
  }
  .chip.lit {
    transform: scale(1.1);
    box-shadow: 0 0 0 8px rgba(226, 18, 122, 0.14);
  }
  .chip.dim {
    opacity: 0.35;
  }
  .person {
    background: none;
    border: none;
    padding: 0.25rem;
    font: inherit;
    cursor: pointer;
  }

  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
  }
  .circle {
    margin: 0;
    font-size: clamp(1.2rem, 1.5vw, 1.8rem);
    font-weight: 700;
  }
  .hint {
    font-weight: 400;
    color: var(--ex-ink-soft);
  }
  .bar :global(.ex-btn:disabled) {
    opacity: 0.4;
    transform: none;
    box-shadow: none;
  }

  .picker-wrap {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: grid;
    place-items: center;
    background: rgba(255, 250, 242, 0.6);
    backdrop-filter: blur(6px);
  }
  .picker {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
    width: min(1100px, 88vw);
    padding: clamp(1.75rem, 3vw, 3rem);
    border-radius: 2.5rem;
    background: var(--ex-cream);
    border: 3px solid var(--ex-gold-soft);
    box-shadow: 0 30px 80px rgba(58, 36, 24, 0.22);
    text-align: center;
  }
  .picker h2 {
    font-size: clamp(2rem, 3vw, 3.6rem);
  }
  .skills {
    list-style: none;
    margin: 0.5rem 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.8rem;
  }
  .skill {
    min-height: 64px;
    padding: 0.4em 1.2em;
    border-radius: 999px;
    border: 3px solid var(--ex-gold-soft);
    background: #fff;
    font: inherit;
    font-size: clamp(1.15rem, 1.35vw, 1.6rem);
    font-weight: 700;
    color: var(--ex-ink);
    cursor: pointer;
    transition:
      background 200ms ease,
      border-color 200ms ease,
      transform 200ms ease;
  }
  .skill:hover:not(:disabled) {
    border-color: var(--ex-pink);
    transform: translateY(-2px);
  }
  .skill.on {
    background: var(--ex-pink);
    border-color: var(--ex-pink);
    color: #fff;
  }
  .skill:disabled {
    opacity: 0.4;
  }
</style>
