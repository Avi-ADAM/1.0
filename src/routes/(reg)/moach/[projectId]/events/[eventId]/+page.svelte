<script>
  /**
   * The event editor (docs/inprogress/PLAN_EVENTS_WEBINARS.md §7): the landing page's
   * content, the dates, the registration form — then "publish", which in a
   * rikma of more than one member opens a decision every member sees in their
   * heart. Below: who registered.
   */
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { t, locale } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { EVENT_KINDS, MAX_FORM_FIELDS } from '$lib/events/model';
  import { newSessionKey } from '$lib/events/validate';

  let { data } = $props();
  let projectId = $derived(page.params.projectId);

  const browserTz = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jerusalem';
    } catch {
      return 'Asia/Jerusalem';
    }
  };

  /** ISO → the value a datetime-local input shows, in this browser's clock. */
  function toLocalInput(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function fromEvent(e) {
    if (!e) {
      return {
        title: '',
        kind: 'webinar',
        slug: '',
        tagline: '',
        description: '',
        outcomes: '',
        audience: '',
        agenda: [],
        faq: [],
        sessions: [blankSession()],
        form: [],
        consentText: $t('events.editor.consentDefault'),
        afterUrl: ''
      };
    }
    return {
      title: e.title,
      kind: e.kind,
      slug: e.slug,
      tagline: e.tagline ?? '',
      description: e.description ?? '',
      outcomes: e.outcomes.join('\n'),
      audience: e.audience.join('\n'),
      agenda: e.agenda.map((i) => ({ minutes: i.minutes ?? '', title: i.title, desc: i.desc ?? '' })),
      faq: e.faq.map((i) => ({ ...i })),
      sessions: e.sessions.map((s) => ({
        key: s.key,
        local: toLocalInput(s.startsAt),
        durationMin: s.durationMin,
        timezone: s.timezone,
        capacity: s.capacity ?? '',
        room: s.room,
        externalUrl: s.externalUrl ?? '',
        recordingUrl: s.recordingUrl ?? '',
        state: s.state
      })),
      form: e.form.map((f) => ({ ...f, optionsText: (f.options ?? []).join('\n') })),
      consentText: e.consentText ?? '',
      afterUrl: e.afterUrl ?? ''
    };
  }

  function blankSession() {
    return {
      key: newSessionKey(),
      local: '',
      durationMin: 60,
      timezone: browserTz(),
      capacity: '',
      room: 'external',
      externalUrl: '',
      recordingUrl: '',
      state: 'open'
    };
  }

  // The editor keeps its own copy; it is reset only when another event loads.
  let draft = $state(fromEvent(null));
  let loadedFor = $state('');
  $effect(() => {
    const id = data.event?.id ?? 'new';
    if (id !== loadedFor) {
      draft = fromEvent(data.event);
      loadedFor = id;
    }
  });

  let busy = $state(false);
  let message = $state('');
  let messageKind = $state('info');
  let problems = $derived(data.problems ?? []);
  let status = $derived(data.event?.status ?? 'draft');
  let locked = $derived(status === 'proposed');

  function payload() {
    return {
      ...draft,
      agenda: draft.agenda.map((i) => ({ ...i, minutes: i.minutes === '' ? null : Number(i.minutes) })),
      sessions: draft.sessions
        .filter((s) => s.local)
        .map((s) => ({
          key: s.key,
          startsAt: new Date(s.local).toISOString(),
          durationMin: Number(s.durationMin) || 60,
          timezone: s.timezone,
          capacity: s.capacity === '' ? null : Number(s.capacity),
          room: s.room,
          externalUrl: s.externalUrl,
          recordingUrl: s.recordingUrl,
          state: s.state
        })),
      form: draft.form.map((f, i) => ({
        key: f.key || `q${i + 1}`,
        label: f.label,
        type: f.type,
        required: !!f.required,
        ...(f.type === 'select' ? { options: String(f.optionsText ?? '').split('\n').map((o) => o.trim()).filter(Boolean) } : {})
      })),
      lang: $locale
    };
  }

  function say(text, kind = 'info') {
    message = text;
    messageKind = kind;
  }

  function errorText(res) {
    const code = res?.error?.code;
    const problem = res?.error?.details?.problem;
    if (code === 'VALIDATION_FAILED' && problem) return $t(`events.editor.problem.${problem}`) || $t('events.editor.saveFailed');
    if (code === 'SLUG_TAKEN') return $t('events.editor.slugTaken');
    if (code === 'UNDER_PROPOSAL') return $t('events.editor.underProposal');
    if (code === 'NOT_READY') return $t('events.editor.notReady');
    if (code === 'SESSION_HAS_REGISTRATIONS') return $t('events.editor.sessionHasRegistrations');
    return $t('events.editor.saveFailed');
  }

  async function save() {
    if (busy) return null;
    busy = true;
    say('');
    try {
      const res = await executeAction('saveEvent', {
        projectId,
        ...(data.event ? { eventId: data.event.id } : {}),
        draft: payload()
      });
      if (!res.success) {
        say(errorText(res), 'error');
        return null;
      }
      const id = res.data?.eventId;
      if (res.data?.warnings?.includes('ROOM_NOT_OPENED')) say($t('events.editor.roomNotOpened'), 'error');
      else say($t('events.editor.saved'), 'ok');
      if (data.isNew && id) {
        loadedFor = String(id);
        await goto(`/moach/${projectId}/events/${id}`, { replaceState: true });
      } else {
        await invalidateAll();
      }
      return id;
    } finally {
      busy = false;
    }
  }

  async function publish() {
    const id = await save();
    if (!id) return;
    busy = true;
    try {
      const res = await executeAction('proposeEvent', { projectId, eventId: String(id) });
      if (!res.success) {
        say(errorText(res), 'error');
        return;
      }
      say(res.data?.published ? $t('events.editor.published') : $t('events.editor.proposed'), 'ok');
      await invalidateAll();
    } finally {
      busy = false;
    }
  }

  let shareUrl = $derived(data.pageHref ? `${page.url.origin}${data.pageHref}` : '');
  let copied = $state(false);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      /* the link is shown in full next to the button */
    }
  }

  function sessionLabel(key) {
    const s = data.event?.sessions.find((x) => x.key === key);
    if (!s) return '—';
    try {
      return new Intl.DateTimeFormat($locale || 'he', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: s.timezone }).format(new Date(s.startsAt));
    } catch {
      return s.startsAt;
    }
  }
</script>

<div class="max-w-4xl mx-auto space-y-6 text-white pb-20">
  <a href={`/moach/${projectId}/events`} class="text-sm text-slate-300 hover:text-gold">← {$t('events.moach.title')}</a>

  <div class="flex flex-wrap items-center justify-between gap-3">
    <h1 class="text-2xl font-bold">{data.isNew ? $t('events.editor.newTitle') : draft.title}</h1>
    {#if !data.isNew}
      <span class="rounded-full px-3 py-1 text-sm bg-slate-700">{$t(`events.status.${status}`)}</span>
    {/if}
  </div>

  {#if shareUrl}
    <div class="rounded-xl bg-slate-800/70 border border-slate-700 p-4 flex flex-wrap items-center gap-3">
      <span class="text-sm text-slate-300">{status === 'published' ? $t('events.editor.shareLink') : $t('events.editor.previewLink')}</span>
      <a href={data.pageHref} target="_blank" rel="noopener" class="text-gold underline break-all" dir="ltr">{shareUrl}</a>
      <button type="button" class="text-sm underline" onclick={copyLink}>{copied ? $t('events.editor.copied') : $t('events.editor.copy')}</button>
    </div>
  {/if}

  {#if locked}
    <p class="rounded-xl bg-amber-900/40 border border-amber-600/50 p-4 text-amber-100">{$t('events.editor.underProposal')}</p>
  {/if}

  <fieldset disabled={locked || busy} class="space-y-6">
    <!-- The page -->
    <section class="card">
      <h2 class="card-title">{$t('events.editor.sectionPage')}</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="field sm:col-span-2">
          <span>{$t('events.editor.title')}</span>
          <input bind:value={draft.title} maxlength="160" placeholder={$t('events.editor.titleHint')} />
        </label>
        <label class="field">
          <span>{$t('events.editor.kind')}</span>
          <select bind:value={draft.kind}>
            {#each EVENT_KINDS as k (k)}<option value={k}>{$t(`events.kind.${k}`)}</option>{/each}
          </select>
        </label>
        <label class="field">
          <span>{$t('events.editor.slug')}</span>
          <input bind:value={draft.slug} dir="ltr" maxlength="60" placeholder="business-webinar" />
          <small>{$t('events.editor.slugHint')}</small>
        </label>
        <label class="field sm:col-span-2">
          <span>{$t('events.editor.tagline')}</span>
          <input bind:value={draft.tagline} maxlength="240" placeholder={$t('events.editor.taglineHint')} />
        </label>
        <label class="field sm:col-span-2">
          <span>{$t('events.editor.description')}</span>
          <textarea bind:value={draft.description} rows="4"></textarea>
        </label>
        <label class="field">
          <span>{$t('events.editor.outcomes')}</span>
          <textarea bind:value={draft.outcomes} rows="5" placeholder={$t('events.editor.onePerLine')}></textarea>
        </label>
        <label class="field">
          <span>{$t('events.editor.audience')}</span>
          <textarea bind:value={draft.audience} rows="5" placeholder={$t('events.editor.onePerLine')}></textarea>
        </label>
      </div>
    </section>

    <!-- Agenda -->
    <section class="card">
      <h2 class="card-title">{$t('events.editor.agenda')}</h2>
      {#each draft.agenda as item, i (i)}
        <div class="grid gap-2 sm:grid-cols-[6rem_1fr_auto] items-start mb-3">
          <input class="input" type="number" min="0" bind:value={item.minutes} placeholder={$t('events.editor.minutes')} />
          <div class="space-y-2">
            <input class="input w-full" bind:value={item.title} placeholder={$t('events.editor.agendaTitle')} />
            <input class="input w-full" bind:value={item.desc} placeholder={$t('events.editor.agendaDesc')} />
          </div>
          <button type="button" class="text-sm underline text-slate-300" onclick={() => draft.agenda.splice(i, 1)}>{$t('events.editor.remove')}</button>
        </div>
      {/each}
      <button type="button" class="add" onclick={() => draft.agenda.push({ minutes: '', title: '', desc: '' })}>+ {$t('events.editor.addAgenda')}</button>
    </section>

    <!-- Dates -->
    <section class="card">
      <h2 class="card-title">{$t('events.editor.sessions')}</h2>
      <p class="text-sm text-slate-300 mb-3">{$t('events.editor.sessionsHint')}</p>
      {#each draft.sessions as s, i (s.key)}
        <div class="rounded-lg border border-slate-600 p-3 mb-3 grid gap-3 sm:grid-cols-2">
          <label class="field">
            <span>{$t('events.editor.startsAt')}</span>
            <input type="datetime-local" bind:value={s.local} />
            <small>{s.timezone}</small>
          </label>
          <div class="grid grid-cols-2 gap-2">
            <label class="field">
              <span>{$t('events.editor.duration')}</span>
              <input type="number" min="5" max="1440" bind:value={s.durationMin} />
            </label>
            <label class="field">
              <span>{$t('events.editor.capacity')}</span>
              <input type="number" min="1" bind:value={s.capacity} placeholder="∞" />
            </label>
          </div>
          <label class="field">
            <span>{$t('events.editor.room')}</span>
            <select bind:value={s.room}>
              <option value="external">{$t('events.editor.roomExternal')}</option>
              <option value="meetings">{$t('events.editor.roomMeetings')}</option>
            </select>
          </label>
          {#if s.room === 'external'}
            <label class="field">
              <span>{$t('events.editor.link')}</span>
              <input bind:value={s.externalUrl} dir="ltr" placeholder="https://zoom.us/j/…" />
              <small>{$t('events.editor.linkHint')}</small>
            </label>
          {:else}
            <p class="text-sm text-slate-300 self-center">{$t('events.editor.roomMeetingsHint')}</p>
          {/if}
          <label class="field">
            <span>{$t('events.editor.recording')}</span>
            <input bind:value={s.recordingUrl} dir="ltr" placeholder="https://…" />
          </label>
          <div class="flex items-end justify-between gap-2">
            {#if data.taken?.[s.key]}
              <span class="text-sm text-slate-300">{$t('events.moach.registeredCount', { count: data.taken[s.key] })}</span>
            {/if}
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={s.state === 'cancelled'} onchange={(e) => (s.state = e.currentTarget.checked ? 'cancelled' : 'open')} />
              {$t('events.editor.cancelSession')}
            </label>
            {#if !data.taken?.[s.key]}
              <button type="button" class="text-sm underline text-slate-300" onclick={() => draft.sessions.splice(i, 1)}>{$t('events.editor.remove')}</button>
            {/if}
          </div>
          {#if data.taken?.[s.key]}
            <p class="sm:col-span-2 text-xs text-amber-200">{$t('events.editor.changeNotifies')}</p>
          {/if}
        </div>
      {/each}
      <button type="button" class="add" onclick={() => draft.sessions.push(blankSession())}>+ {$t('events.editor.addSession')}</button>
    </section>

    <!-- Registration form -->
    <section class="card">
      <h2 class="card-title">{$t('events.editor.form')}</h2>
      <p class="text-sm text-slate-300 mb-3">{$t('events.editor.formHint')}</p>
      {#each draft.form as f, i (i)}
        <div class="grid gap-2 sm:grid-cols-[1fr_9rem_auto_auto] items-start mb-3">
          <div class="space-y-2">
            <input class="input w-full" bind:value={f.label} placeholder={$t('events.editor.question')} />
            {#if f.type === 'select'}
              <textarea class="input w-full" rows="3" bind:value={f.optionsText} placeholder={$t('events.editor.options')}></textarea>
            {/if}
          </div>
          <select class="input" bind:value={f.type}>
            <option value="text">{$t('events.editor.typeText')}</option>
            <option value="select">{$t('events.editor.typeSelect')}</option>
            <option value="checkbox">{$t('events.editor.typeCheckbox')}</option>
          </select>
          <label class="flex items-center gap-1 text-sm"><input type="checkbox" bind:checked={f.required} />{$t('events.editor.required')}</label>
          <button type="button" class="text-sm underline text-slate-300" onclick={() => draft.form.splice(i, 1)}>{$t('events.editor.remove')}</button>
        </div>
      {/each}
      {#if draft.form.length < MAX_FORM_FIELDS}
        <button
          type="button"
          class="add"
          onclick={() => draft.form.push({ key: '', label: '', type: 'text', required: false, optionsText: '' })}
        >+ {$t('events.editor.addQuestion')}</button>
      {/if}
      <label class="field mt-4">
        <span>{$t('events.editor.consent')}</span>
        <textarea bind:value={draft.consentText} rows="2"></textarea>
      </label>
    </section>

    <!-- FAQ + after -->
    <section class="card">
      <h2 class="card-title">{$t('events.editor.faq')}</h2>
      {#each draft.faq as item, i (i)}
        <div class="grid gap-2 sm:grid-cols-[1fr_auto] mb-3">
          <div class="space-y-2">
            <input class="input w-full" bind:value={item.q} placeholder={$t('events.editor.faqQ')} />
            <textarea class="input w-full" rows="2" bind:value={item.a} placeholder={$t('events.editor.faqA')}></textarea>
          </div>
          <button type="button" class="text-sm underline text-slate-300" onclick={() => draft.faq.splice(i, 1)}>{$t('events.editor.remove')}</button>
        </div>
      {/each}
      <button type="button" class="add" onclick={() => draft.faq.push({ q: '', a: '' })}>+ {$t('events.editor.addFaq')}</button>
      <label class="field mt-4">
        <span>{$t('events.editor.afterUrl')}</span>
        <input bind:value={draft.afterUrl} dir="ltr" placeholder="/hascama" />
        <small>{$t('events.editor.afterUrlHint')}</small>
      </label>
    </section>
  </fieldset>

  {#if problems.length && status !== 'published'}
    <ul class="rounded-xl bg-slate-800 border border-slate-600 p-4 text-sm space-y-1">
      <li class="font-semibold">{$t('events.editor.beforePublish')}</li>
      {#each problems as p (p)}<li>• {$t(`events.editor.publishProblem.${p}`)}</li>{/each}
    </ul>
  {/if}

  {#if message}
    <p class="rounded-lg p-3 text-sm {messageKind === 'error' ? 'bg-red-900/50' : messageKind === 'ok' ? 'bg-emerald-900/50' : 'bg-slate-800'}" role="status">{message}</p>
  {/if}

  <div class="flex flex-wrap gap-3 sticky bottom-4">
    <button type="button" class="btn" disabled={busy || locked} onclick={save}>{$t('events.editor.save')}</button>
    {#if status === 'draft' || status === 'closed' || data.isNew}
      <button type="button" class="btn btn-gold" disabled={busy || locked} onclick={publish}>{$t('events.editor.publish')}</button>
    {/if}
  </div>

  {#if !data.isNew}
    <section class="card">
      <h2 class="card-title">{$t('events.editor.registrations')} ({data.registrations.length})</h2>
      {#if data.registrations.length === 0}
        <p class="text-sm text-slate-300">{$t('events.editor.noRegistrations')}</p>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="text-slate-400 text-start">
              <tr>
                <th class="text-start p-2">{$t('events.form.name')}</th>
                <th class="text-start p-2">{$t('events.form.email')}</th>
                <th class="text-start p-2">{$t('events.form.phone')}</th>
                <th class="text-start p-2">{$t('events.editor.session')}</th>
                <th class="text-start p-2">{$t('events.editor.regStatus')}</th>
                <th class="text-start p-2">{$t('events.editor.answers')}</th>
              </tr>
            </thead>
            <tbody>
              {#each data.registrations as r (r.id)}
                <tr class="border-t border-slate-700">
                  <td class="p-2">
                    {#if r.leadId}
                      <a class="underline" href={`/moach/${projectId}/sales/manage/leads/${r.leadId}`}>{r.name}</a>
                    {:else}{r.name}{/if}
                  </td>
                  <td class="p-2" dir="ltr">{r.email}</td>
                  <td class="p-2" dir="ltr">{r.phone ?? ''}</td>
                  <td class="p-2">{sessionLabel(r.sessionKey)}</td>
                  <td class="p-2">{$t(`events.regStatus.${r.status}`)}</td>
                  <td class="p-2 text-slate-300">
                    {Object.entries(r.answers)
                      .map(([k, v]) => `${data.event?.form.find((f) => f.key === k)?.label ?? k}: ${v === true ? '✓' : v === false ? '✗' : v}`)
                      .join(' · ')}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .card {
    border-radius: 0.9rem;
    background: rgb(30 41 59 / 0.7);
    border: 1px solid rgb(51 65 85);
    padding: 1.25rem;
  }
  .card-title {
    font-size: 1.15rem;
    font-weight: 700;
    margin-bottom: 0.9rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.9rem;
  }
  .field small {
    color: rgb(148 163 184);
  }
  .field input,
  .field select,
  .field textarea,
  .input {
    padding: 0.55rem 0.7rem;
    border-radius: 0.5rem;
    background: rgb(15 23 42);
    border: 1px solid rgb(71 85 105);
    color: #fff;
  }
  .add {
    font-size: 0.9rem;
    text-decoration: underline;
    color: rgb(250 204 21);
  }
  .btn {
    padding: 0.6rem 1.4rem;
    border-radius: 9999px;
    font-weight: 700;
    background: rgb(51 65 85);
  }
  .btn-gold {
    background: rgb(250 204 21);
    color: #000;
  }
  .btn:disabled {
    opacity: 0.6;
  }
</style>
