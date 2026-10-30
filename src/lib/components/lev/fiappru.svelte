<script>
  import { fly } from 'svelte/transition';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { goto } from '$app/navigation';
  import { idPr } from './../../stores/idPr.js';
  import { t } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { refuseCounter } from '$lib/finiapruval/rounds.js';
  import { disputeNote, hoursWithout, sessionLabel } from '$lib/finiapruval/sessions.js';
  import { lang as langStore } from '$lib/stores/lang.js';
  let resP = [];
  let lang;
  const baseUrl = import.meta.env.VITE_URL;

  let token;
  function percentage(partialValue, totalValue) {
    return (100 * partialValue) / totalValue;
  }
  import Cards from './cards/fini.svelte';
  /**
   * @typedef {Object} Props
   * @property {boolean} [isVisible]
   * @property {boolean} [low]
   * @property {boolean} [modal]
   * @property {any} coinlapach
   * @property {any} mId
   * @property {any} why
   * @property {any} what
   * @property {boolean} [shows]
   * @property {any} deadline
   * @property {string} [projectName]
   * @property {string} [missionBName]
   * @property {string} [role]
   * @property {any} [skills]
   * @property {string} [useraplyname]
   * @property {string} [src]
   * @property {string} [src2]
   * @property {any} projectId
   * @property {string} [link]
   * @property {string} [linkU]
   * @property {any} userId
   * @property {string} [missionDetails]
   * @property {any} name
   * @property {number} [noofpu]
   * @property {any} publicklinks
   * @property {any} privatlinks
   * @property {any} hearotMeyuchadot
   * @property {number} [nhours]
   * @property {number} [valph]
   * @property {any} missId
   * @property {any} id
   * @property {any} openMid
   * @property {number} [st]
   * @property {any} [declined]
   * @property {any} noofusersWaiting
   * @property {any} uids
   * @property {any} whatt
   * @property {{id: string, url: string, name: string}[]} [evidenceFiles] - files filed with the hours
   * @property {string[]} [evidenceLinks] - links filed with the hours
   * @property {{start: string, stop: string, hours: number}[]} [sessions] - every sitting behind the hours ($lib/finiapruval/sessions)
   * @property {string} [saveText] - the member's whole note (`why` is a 250-char copy)
   * @property {any} noofusersOk
   * @property {any} noofusersNo
   * @property {any} timegramaDate
   * @property {any} timegramaId
   * @property {number} [round] - The negotiation round the claim is on (0 = as first filed)
   * @property {{ round: number, userId: string | null, from: number, to: number, note: string }[]} [counters] - Every counter so far, oldest first
   * @property {boolean} [already]
   * @property {string} [stylef]
   * @property {any} askId
   * @property {any} users
   * @property {boolean} [cards]
   * @property {(payload: { ani: string, coinlapach: any, finalized?: boolean }) => void} [onAcsept]
   * @property {(payload: { ani: string, coinlapach: any, finalized?: boolean }) => void} [onDecline]
   * @property {(payload: { id: string }) => void} [onHover]
   * @property {() => void} [onModal]
   * @property {(payload: { id: any }) => void} [onUser]
   * @property {(payload: { id: any }) => void} [onProj]
   */

  /** @type {Props} */
  let {
    isVisible = false,
    low = false,
    modal = $bindable(false),
    coinlapach,
    mId,
    why,
    what,
    shows = false,
    deadline,
    projectName = 'ONE',
    missionBName = 'do x',
    role = 'programer',
    skills = ['html', 'css'],
    useraplyname = 'do x like y in z',
    src = 'coin.png',
    src2 = ' ',
    projectId,
    link = '/project/',
    linkU = '/user/',
    userId,
    missionDetails = '',
    name,
    noofpu = 0,
    publicklinks,
    privatlinks,
    hearotMeyuchadot,
    nhours = 0,
    valph = 0,
    missId,
    id,
    openMid,
    st = 188,
    declined = [],
    noofusersWaiting = $bindable(),
    uids = $bindable(),
    whatt,
    evidenceFiles = [],
    evidenceLinks = [],
    sessions = [],
    saveText = '',
    noofusersOk = $bindable(),
    noofusersNo,
    timegramaDate,
    timegramaId,
    round = 0,
    counters = [],
    already = $bindable(false),
    stylef = '24px',
    askId,
    users,
    cards = false,
    onAcsept,
    onDecline,
    onHover,
    onModal,
    onUser,
    onProj
  } = $props();

  let ok;
  let nook;
  let nut;
  let tryo = $state('116%');
  let tryot = $state('-10.5%');
  let tryoti = $state('-5.25%');
  function xyz() {
    ok = percentage(noofusersOk, noofpu);
    nook = percentage(noofusersNo, noofpu);
    nut = percentage(noofusersWaiting, noofpu);

    let ser = [];
    ser.push({
      perc: ok,
      color: '#7EE081'
    });

    if (nut > 0) {
      ser.push({
        perc: nut,
        color: '#0000cc'
      });
    }
    if (nook > 0) {
      ser.push({
        perc: nook,
        color: '#80037e'
      });
    }
    if (nut > 0 && nook > 0) {
      tryo = '129%';
      tryot = '-17%';
      tryoti = '-11.5%';
    }

    ser = ser;
    return ser;
  }

  let ser = $state(xyz());


  import { page } from '$app/state';

  let error1;
  async function callCloseFiniapruval(vote, whyText) {
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actionKey: 'closeFiniapruval',
          params: {
            finiapruvalId: String(askId),
            timegramaId: timegramaId ? String(timegramaId) : undefined,
            vote,
            why: whyText || undefined,
            projectId: String(projectId)
          }
        })
      });
      const data = await res.json();
      console.log('closeFiniapruval result', data);
      return data;
    } catch (e) {
      error1 = e;
      console.error(e);
      return null;
    }
  }

  async function agree() {
    already = true;
    noofusersOk += 1;
    noofusersWaiting -= 1;
    ser = xyz();
    uids.push(userId);
    uids = uids;

    const result = await callCloseFiniapruval(true, undefined);
    if (result?.data?.success) {
      onAcsept?.({ ani: 'fini', coinlapach, finalized: result.data?.closed === true });
    }
  }

  /* ── The way to disagree: a counter, never a veto ───────────────────────────
   * A finish approval is signed by every member. One who does not accept it does
   * not "reject" — there is no absolute no — they propose the version they would
   * sign: other hours, with the reason. The claim goes to the next round, the
   * others are asked again and the restime clock starts over
   * (src/lib/finiapruval/rounds.ts, action `counterFiniapruval`). */
  let isOpen = $state(false);
  let counterHours = $state(0);
  let counterNote = $state('');
  let counterBusy = $state(false);
  let counterError = $state('');
  // The words are checked, not the list of disputed sittings: a list of times
  // without a reason is still a veto in disguise.
  const counterRefusal = $derived(refuseCounter(nhours, counterHours, counterNote));

  /* Disputing a sitting is the precise way to counter an hours claim: its hours
   * come off the version, and it is written into the note under the member's own
   * words ($lib/finiapruval/sessions). The hours stay editable either way —
   * a member may also think the claim is too low. */
  const LOCALES = { he: 'he-IL', ar: 'ar', ru: 'ru-RU', es: 'es-ES' };
  const locale = $derived(LOCALES[$langStore] ?? 'en-GB');
  /** @type {number[]} */
  let disputed = $state([]);

  function toggleDispute(i) {
    disputed = disputed.includes(i) ? disputed.filter((x) => x !== i) : [...disputed, i];
    counterHours = disputed.length ? hoursWithout(sessions, disputed) : Number(nhours) || 0;
  }

  function ask() {
    counterHours = Number(nhours) || 0;
    counterNote = '';
    counterError = '';
    disputed = [];
    isOpen = true;
  }

  async function sendCounter() {
    if (counterBusy || counterRefusal) return;
    counterBusy = true;
    counterError = '';
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'counterFiniapruval',
          params: {
            finiapruvalId: String(askId),
            projectId: String(projectId),
            hours: Number(counterHours),
            note: disputeNote(counterNote, sessions, disputed, locale)
          }
        })
      });
      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.error?.message || $t('lev.fiappru.counterError'));
      }
      already = true;
      isOpen = false;
      toast.success($t('lev.fiappru.counterSent'));
      // The proposer has answered — their card leaves, exactly as after approving.
      onDecline?.({ ani: 'fini', coinlapach, finalized: false });
    } catch (e) {
      console.error('counterFiniapruval failed', e);
      counterError = e instanceof Error ? e.message : $t('lev.fiappru.counterError');
    } finally {
      counterBusy = false;
    }
  }
  function close() {
    isOpen = false;
    counterError = '';
  }

  let u = 'בקשה לאישור ביצוע משימה בהצלחה';

  function hover(id) {
    if (id == '0') {
      u = 'בקשה לאישור ביצוע משימה בהצלחה';
    } else {
      u = id;
    }
    onHover?.({ id: u });
  }

  let pmcli = $state(0);

  function project(id) {
    pmcli += 1;
    if (pmcli >= 2) {
      idPr.set(id);
      goto('/moach');
    }
  }
  function hoverc(event) {
    if (event.x == '0') {
      u = 'בקשה לאישור ביצוע משימה בהצלחה';
    } else {
      u = event.x;
    }
    onHover?.({ id: u });
  }
</script>

<DialogOverlay {isOpen} onDismiss={close} class="overlay">
  <div transition:fly|local|local={{ y: 450, opacity: 0.5, duration: 1000 }}>
    <DialogContent class="content surface-dialog fc-dialog" aria-label="form">
      <div dir="rtl" class="fc-body flex items-center flex-col">
        <button
          onclick={close}
          class=" hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
          title={$t('lev.missionInProgress.cancel')}
          ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
            />
          </svg></button
        >
        <h1 style="font-size:1.6em;">{$t('lev.fiappru.counterHeading')}</h1>
        <p style="font-size:0.7em;max-width:30ch;text-align:center;margin:6px 0 12px">
          {$t('lev.fiappru.counterHint')}
        </p>
        <!-- What is being countered: the member's own words, then each sitting. -->
        {#if saveText || why}
          <figure class="fc-quote">
            <figcaption>{$t('lev.fiappru.counterQuote')}</figcaption>
            <blockquote>{saveText || why}</blockquote>
          </figure>
        {/if}
        {#if sessions.length > 0}
          <fieldset class="fc-sessions">
            <legend>{$t('lev.fiappru.counterSessions')}</legend>
            {#each sessions as s, i (s.start + i)}
              <label class:fc-off={disputed.includes(i)}>
                <input
                  type="checkbox"
                  checked={disputed.includes(i)}
                  onchange={() => toggleDispute(i)}
                  disabled={counterBusy}
                />
                <span>{sessionLabel(s, locale)}</span>
                {#if disputed.includes(i)}<em>{$t('lev.fiappru.counterDisputed')}</em>{/if}
              </label>
            {/each}
          </fieldset>
        {/if}
        <label style="font-size:0.7em;display:flex;flex-direction:column;gap:4px;width:100%">
          {$t('lev.fiappru.counterHours')}
          <input
            type="number"
            min="0"
            step="0.25"
            bind:value={counterHours}
            disabled={counterBusy}
          />
        </label>
        <label
          style="font-size:0.7em;display:flex;flex-direction:column;gap:4px;width:100%;margin-top:8px"
        >
          {$t('lev.fiappru.counterNote')}
          <textarea
            rows="3"
            bind:value={counterNote}
            maxlength="160"
            placeholder={$t('lev.fiappru.counterNotePh')}
            disabled={counterBusy}
          ></textarea>
        </label>
        {#if counterError}
          <p role="alert" style="font-size:0.7em;color:var(--barbi-pink);margin:8px 0 0">
            {counterError}
          </p>
        {/if}
        <br />
        <button
          class="add"
          disabled={counterBusy || !!counterRefusal}
          onclick={sendCounter}>{$t('lev.fiappru.counterSend')}</button
        >
      </div>
    </DialogContent>
  </div>
</DialogOverlay>
<Cards
  onAgree={agree}
  onNego={ask}
  noDecline
  activeOrder={round}
  {counters}
  onHover={hoverc}
  {isVisible}
  {why}
  {users}
  {onProj}
  {useraplyname}
  {src2}
  {missionBName}
  {already}
  {missionDetails}
  {projectName}
  {timegramaDate}
  {src}
  {nhours}
  {noofusersWaiting}
  {noofusersOk}
  {noofusersNo}
  {valph}
  {whatt}
  {evidenceFiles}
  {evidenceLinks}
  {sessions}
  {saveText}
/>

<style>
  /* Colours come from the shared `surface-dialog` (app.postcss); this is only
   * the box's shape and the fields' size. */
  :global([data-svelte-dialog-content].fc-dialog) {
    border-radius: 18px;
    padding: 1.25rem;
    max-height: 85vh;
    overflow-y: auto;
  }
  .fc-body input[type='number'],
  .fc-body textarea {
    border: 1px solid var(--surface-line, rgba(0, 0, 0, 0.1));
    border-radius: 10px;
    padding: 6px 10px;
    font-size: 1.1em;
  }
  .fc-quote {
    width: 100%;
    margin: 0 0 10px;
    font-size: 0.65em;
  }
  .fc-quote figcaption {
    font-weight: bold;
    margin-bottom: 2px;
  }
  .fc-quote blockquote {
    margin: 0;
    padding: 6px 10px;
    border-inline-start: 3px solid var(--barbi-pink);
    background: var(--surface-2, rgba(0, 0, 0, 0.04));
    border-radius: 6px;
    white-space: pre-line;
    max-height: 7em;
    overflow-y: auto;
    font-weight: normal;
  }
  .fc-sessions {
    width: 100%;
    margin: 0 0 10px;
    padding: 6px 8px;
    border: 1px solid var(--surface-line, rgba(0, 0, 0, 0.12));
    border-radius: 8px;
    font-size: 0.65em;
    max-height: 12em;
    overflow-y: auto;
  }
  .fc-sessions legend {
    font-weight: normal;
    padding: 0 4px;
  }
  .fc-sessions label {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 0;
    font-weight: normal;
    font-variant-numeric: tabular-nums;
  }
  .fc-sessions label.fc-off span {
    text-decoration: line-through;
    opacity: 0.7;
  }
  .fc-sessions em {
    color: var(--barbi-pink);
    font-style: normal;
    font-weight: bold;
  }

  .add {
    color: var(--barbi-pink);
    background-color: var(--gold);
    padding: 0.5em;
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
    border-radius: 20px;
  }
  .add:hover:not(:disabled) {
    color: var(--gold);
    background-color: var(--barbi-pink);
    padding: 0.5em;
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
    border-radius: 20px;
  }
  .add:disabled {
    color: var(--surface-muted, #6b6156);
    background-color: var(--surface-2, #f7f5ef);
    border: 1px solid var(--surface-line, rgba(0, 0, 0, 0.1));
    cursor: not-allowed;
    padding: 0.5em;
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
    border-radius: 20px;
  }

  :global([data-svelte-dialog-content].content) {
    width: 80vw;
    z-index: 60;
  }
  :global([data-svelte-dialog-overlay].overlay) {
    z-index: 1000;
  }
  @media (min-width: 568px) {
    :global([data-svelte-dialog-content].content) {
      width: 50vw;
      z-index: 60;
    }
    :global([data-svelte-dialog-overlay].overlay) {
      z-index: 1000;
    }
  }
</style>
