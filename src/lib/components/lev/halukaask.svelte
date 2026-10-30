<script>
  import { halukaMemberRows, openHalukaDiscussion } from '$lib/func/halukaBridge.js';
  import { fly } from 'svelte/transition';
  import { idPr } from '../../stores/idPr.js';
  import { t } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import moment from 'moment';
  /**
   * @typedef {Object} Props
   * @property {boolean} [isVisible]
   * @property {boolean} [modal]
   * @property {boolean} [low]
   * @property {any} [halukot]
   * @property {any} [hervach]
   * @property {any} [sales]
   * @property {any} [mypos]
   * @property {any} coinlapach
   * @property {any} [whyno]
   * @property {string} [projectName]
   * @property {string} [name]
   * @property {string} [src]
   * @property {any} projectId
   * @property {any} noofusersOk
   * @property {any} noofusersNo
   * @property {any} noofusersWaiting
   * @property {any} noofusers
   * @property {boolean} [already]
   * @property {any} created_at
   * @property {any} pendId
   * @property {any} users
   * @property {any} [diun]
   * @property {any} [order]
   * @property {boolean} [cards]
   * @property {(payload: { ani: string, coinlapach: any }) => void} [onCoinLapach] - Callback for 'coinLapach' event.
   * @property {() => void} [onModal] - Callback for 'modal' event.
   * @property {(payload: { id: any }) => void} [onProj] - Callback for 'proj' event.
   * @property {(payload: { id: string }) => void} [onHover] - Callback for 'hover' event.
   */

  /** @type {Props} */
  let {
    isVisible = false,
    modal = $bindable(false),
    low = false,
    halukot = [],
    hervach = [],
    sales = [],
    mypos = null,
    coinlapach,
    whyno = [],
    projectName = '',
    name = '',
    src = 'coin.png',
    projectId,
    noofusersOk = $bindable(),
    noofusersNo = $bindable(),
    noofusersWaiting = $bindable(),
    noofusers,
    already = $bindable(false),
    created_at,
    pendId,
    users = $bindable([]),
    diun = [],
    order = $bindable(diun.length),
    cards = false,
    onCoinLapach,
    onProj,
    onHover,
    onModal
  } = $props();
  let miDatan = [];
  let error1;
  let idL;
  let no = $state(false);
  let masa = $state(false);
  function percentage(partialValue, totalValue) {
    return (100 * partialValue) / totalValue;
  }

  /** @param {{ what: boolean, why?: string }} vote */
  function appendOptimisticVote(vote) {
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      ?.split('=')[1];
    if (!cookieValueId) return;

    const uid = parseInt(String(cookieValueId), 10);
    const existing = Array.isArray(users) ? users : [];
    const alreadyVoted = existing.some(
      (v) =>
        String(
          v.users_permissions_user?.data?.id ??
            v.users_permissions_user?.id ??
            v.ide
        ) === String(cookieValueId)
    );
    if (alreadyVoted) return;

    users = [
      ...existing,
      {
        what: vote.what,
        users_permissions_user: { data: { id: String(cookieValueId) } },
        ide: uid,
        order: order ?? 0,
        ...(vote.why ? { why: vote.why } : {})
      }
    ];
  }
  let ok;
  let nook;
  let tryo = $state('116%');
  let tryot = $state('-10.5%');
  let tryoti = $state('-5.25%');
  let nut;
  function xyz() {
    ok = percentage(noofusersOk, noofusers);
    nook = percentage(noofusersNo, noofusers);
    nut = percentage(noofusersWaiting, noofusers);
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

  function coinLapach() {
    isOpen = false;
    onCoinLapach?.({
      ani: 'halu',
      coinlapach: coinlapach
    });
  }

  function objToString(obj) {
    let str = '';
    for (let i = 0; i < obj.length; i++) {
      for (const [p, val] of Object.entries(obj[i])) {
        if ((typeof val == 'number') | 'boolean') {
          str += `{${p}:${val}\n}`;
        } else if (typeof val == 'string') {
          str += `{${p}:"${val}"\n}`;
        } else if (typeof val == 'null') {
          str += `{${p}:${val.map((c) => c.id)}\n}`;
        }
      }
    }
    return str;
  }
  async function agree(alr) {
    if (alr == 'alr') {
      alert('soon');
    } else {
      already = true;
      noofusersOk += 1;
      noofusersWaiting -= 1;
      ser = xyz();
      // Snapshot the votes BEFORE the optimistic append: the server always
      // appends the current user's vote itself (addVote tosplit / approveHaluka),
      // so the list we hand it must not already contain this user — otherwise
      // the "בעד" vote is written twice.
      const priorVotes = Array.isArray(users) ? [...users] : [];
      appendOptimisticVote({ what: true });

      const cookieValueId = document.cookie
        .split('; ')
        .find((row) => row.startsWith('id='))
        ?.split('=')[1];
      idL = cookieValueId;

      if (noofusersOk === noofusers) {
        // All users approved — build hervachti deltas from local hervach.
        // We pass only { userId, amountDelta }; the server fetches the
        // current balance and applies the delta atomically (never trusts
        // a client-supplied absolute amount).
        const hervachUpdates = (hervach || [])
          .filter((el) => el?.noten !== true && el?.mekabel !== true)
          .map((el) => ({
            userId: String(el?.users_permissions_user?.data?.id ?? ''),
            amountDelta: Number(el?.amount ?? 0)
          }))
          .filter((u) => u.userId && Number.isFinite(u.amountDelta) && u.amountDelta !== 0);

        try {
          const result = await executeAction('approveHaluka', {
            tosplitId: pendId,
            userId: idL,
            users: priorVotes,
            halukot,
            sales: sales || [],
            hervachUpdates,
            projectId
          });

          if (!result.success) {
            throw new Error(result.error?.message || 'Failed to approve haluka');
          }

          miDatan = result.data;
          toast.success($t('lev.cards.halukaask.approved'));

          coinLapach();
        } catch (e) {
          error1 = e;
          toast.error($t('lev.cards.halukaask.approveError'));
        }
      } else {
        // Not all users approved yet — add partial vote
        try {
          const voteParams = {
            type: 'tosplit',
            id: pendId,
            projectId,
            existingComponentData: priorVotes,
            what: true,
            order: 0
          };
          const result = await executeAction('addVote', voteParams);
          if (!result.success) {
            throw new Error(result.error?.message || 'Failed to add vote');
          }
          // Phase 1 shadow signing — fire-and-forget. The legacy mutation
          // succeeded; signing the parallel ConsentEvent is best-effort and
          // never blocks the UI on failure.
          shadowSignFromCookie(addVoteConsentSpec, voteParams);
        } catch (e) {
          error1 = e;
          console.log(error1);
        }
      }
    }
  }
  import { executeAction } from '$lib/client/actionClient';
  import { shadowSignFromCookie } from '$lib/client/shadowSign';
  import { addVoteConsentSpec } from '$lib/consent/specs/addVote';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  async function nego(alr) {
    already = true;
    console.log('nego');
    no = false;
    masa = true;
    isOpen = true;
    console.log(no);
  }

  // Open the consensus mediation discussion for this split (one number term
  // per member: fair share vs. actual outcome) and close the dialog — the
  // signed decision returns to the haluka card via fetchBridgeResolution.
  function openMasaDiscussion() {
    openHalukaDiscussion({
      tosplitId: pendId,
      title: name,
      projectName,
      rows: halukaMemberRows(hervach, halukot)
    });
    isOpen = false;
    masa = false;
  }
  function decline(alr) {
    if (alr == 'alr') {
      alert('soon');
    } else {
      already = true;

      no = true;
      isOpen = true;
      //create why alert (from smui) add validation for minimum
      // send why with userss, create way to show why for all agreed users and for them to response.
    }
  }
  let why = $state();
  let isOpen = $state(false);

  async function afterwhy() {
    if (why.length > 20) {
      isOpen = false;
      already = true;
      noofusersNo += 1;
      noofusersWaiting -= 1;
      ser = xyz();
      // Snapshot before the optimistic append — the server appends this user's
      // vote itself, so don't hand it a list that already includes them.
      const priorVotes = Array.isArray(users) ? [...users] : [];
      appendOptimisticVote({ what: false, why });
      try {
        const voteParams = {
          type: 'tosplit',
          id: pendId,
          projectId,
          existingComponentData: priorVotes,
          what: false,
          why,
          order: 0
        };
        const result = await executeAction('addVote', voteParams);
        if (result.success) {
          miDatan = result.data;
          coinLapach();
          // Phase 1 shadow signing — best-effort, no UI dependency.
          shadowSignFromCookie(addVoteConsentSpec, voteParams);
        } else {
          error1 = result.error;
        }
      } catch (e) {
        error1 = e;
        console.log(error1);
      }
    } else {
      console.log('decline', why);
      alert('מינימום 20 תווים');
      already = false;
    }
  }
  const close = () => {
    isOpen = false;
    no = false;
    masa = false;
    already = false;
    allr = false;
    rect = false;
  };

  function afternego(event) {
    isOpen = false;
    no = false;
    masa = false;
    //dispach or update  coin to negotiable state
  }

  let rect = $state(false);
  let allr = $state(false);
  async function afreact() {
    console.log('todo');
  }


  let u = 'הצבעה על בקשה לחלוקת הרווחים שנצברו לרקמה';
  function hover(id) {
    if (id == '0') {
      u = 'הצבעה על בקשה לחלוקת הרווחים שנצברו לרקמה';
    } else {
      u = id;
    }
    onHover?.({ id: u });
  }
  function hoverc(event) {
    if (event.x == '0') {
      u = 'הצבעה על בקשה לחלוקת הרווחים שנצברו לרקמה';
    } else {
      u = event.x;
    }
    onHover?.({ id: u });
  }
  import Cards from './cards/haluka.svelte';

  function claf(event) {
    let o = event.alr;
    let d = event.y;
    console.log(o, d);
  }
</script>

<DialogOverlay {isOpen} onDismiss={close}>
  <div transition:fly|local={{ y: 450, opacity: 0.5, duration: 2000 }}>
    <DialogContent class="content surface-dialog" aria-label="form">
      <div dir="rtl" class="grid items-center justify-center aling-center">
        <button
          onclick={close}
          style="margin: 0 auto;"
          class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
          title={$t('lev.missionInProgress.cancel')}
          ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
            />
          </svg></button
        >
        {#if no === true}
          <input
            minlength="26"
            type="text"
            bind:value={why}
            placeholder={$t('lev.halukaask.offerRejected')}
          />
          <button onclick={afterwhy}>{$t('lev.cards.confirmApprove')}</button>
        {:else if rect === true}
          <div class="text-center">
            <h1>
              {$t('lev.halukaask.canRespond')}
              {mypos === false ? $t('lev.halukaask.decline') : $t('lev.halukaask.approve')}
              {$t('lev.halukaask.theOffer')}
              <br />
              {$t('lev.halukaask.referToPrevious')}
            </h1>
            <small style="color: red;">{$t('lev.halukaask.previousResponse')}</small>
            {#if whyno.length > 0}<h4
                style="color:var(--barbi-pink); font-size: 13px;"
              >
                {whyno.join(' ~ ')}
              </h4>{/if}
            <br />
            <lebel for="yu">{$t('lev.halukaask.yourResponseLabel')}</lebel>
            <input
              id="yu"
              minlength="26"
              type="text"
              bind:value={why}
              placeholder={$t('lev.halukaask.yourResponse')}
            />
            <button onclick={afreact}>{$t('lev.cards.confirmApprove')}</button>
          </div>
        {:else if masa === true}
          <!-- Negotiating a split = a structured mediation discussion in the
               consensus app. The signed decision is persisted and comes back to
               the haluka card for every member; the vote there stays the formal
               approval channel. -->
          <div class="text-center p-2">
            <h2 class="text-barbi font-bold">
              {$t('lev.haluka.bridge.openDiscussionHint')}
            </h2>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {$t('lev.haluka.bridge.voteStillNeeded')}
            </p>
            <button
              onclick={openMasaDiscussion}
              class="mt-3 px-4 py-2 rounded-xl bg-gold text-barbi font-bold hover:scale-105 transition-transform"
            >
              {$t('lev.haluka.bridge.openDiscussion')}
            </button>
          </div>
        {/if}
      </div>
    </DialogContent>
  </div>
</DialogOverlay>
<Cards
  onAgree={agree}
  onDecline={decline}
  onHover={hoverc}
  {isVisible}
  {why}
  bind:users
  bind:already
  bind:noofusersOk
  bind:noofusersNo
  bind:noofusersWaiting
  {projectId}
  {projectName}
  {src}
  {noofusers}
  activeOrder={order}
  {halukot}
  {hervach}
  tosplitId={pendId}
/>

<style>
  input[type='text'] {
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
    border-radius: 20px;
    border: 1px solid var(--lturk);
    width: 250px;
    height: 30px;
    padding-left: 10px;
    padding-right: 10px;
  }

  input[type='text']:focus {
    outline: none;
    border: 2px solid var(--lturk);
    color: #2d9fd9;
  }

  input[type='text']:invalid {
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
    border-radius: 20px;
    border: 2px dashed var(--lturk);
    width: 250px;
    height: 30px;
    color: red;
    padding-left: 10px;
    padding-right: 10px;
  }

  :global([data-svelte-dialog-overlay].overlay) {
    z-index: 100;
  }
  :global([data-svelte-dialog-content].content) {
    width: 80vw;
    z-index: 299;
  }
  @media (min-width: 568px) {
    :global([data-svelte-dialog-content].content) {
      width: 50vw;
    }
  }
</style>
