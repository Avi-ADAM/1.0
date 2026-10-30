<script>
  import CurrencySymbol from '$lib/components/money/CurrencySymbol.svelte';
  import Diun from './diun.svelte';
  import { executeAction } from '$lib/client/actionClient';
  import Spinner from '$lib/celim/Spinner.svelte';
  import { fly } from 'svelte/transition';
  import Nego from '../prPr/negoPend.svelte';
  import LocationView from '$lib/components/location/LocationView.svelte';
  import { invalidate } from '$app/navigation';
  import { updatePmashesStore } from '$lib/utils/levVotePatch';
  import { idPr } from '../../stores/idPr.js';
  import moment from 'moment';
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import Cards from './cards/pma.svelte';
  import { nowId } from '$lib/stores/pendMisMes';
  import { forumStore } from '$lib/stores/forumStore';
  import { toast } from 'svelte-sonner';
  /**
   * @typedef {Object} Props
   * @property {boolean} [low]
   * @property {boolean} [isVisible]
   * @property {boolean} [modal]
   * @property {any} coinlapach
   * @property {any} [mypos]
   * @property {any} [messege]
   * @property {string} [descrip]
   * @property {string} [projectName]
   * @property {string} [name]
   * @property {string} [hearotMeyuchadot]
   * @property {string} [kindOf]
   * @property {string} [src]
   * @property {any} projectId
   * @property {any} [link]
   * @property {any} noofusersOk
   * @property {any} noofusersNo
   * @property {any} noofusersWaiting
   * @property {number} [total]
   * @property {any} noofusers
   * @property {boolean} [already]
   * @property {any} created_at
   * @property {any} mshaabId
   * @property {any} hm
   * @property {any} price
   * @property {any} easy
   * @property {any} sqadualed
   * @property {any} sqadualedf
   * @property {any} pendId
   * @property {any} users
   * @property {any} linkto
   * @property {any} mysrc
   * @property {any} [diun]
   * @property {any} [order]
   * @property {number} [ordern]
   * @property {any} timegramaId
   * @property {any} restime
   * @property {any} [acts]
   * @property {any} [location]
   * @property {boolean} [cards]
   * @property {() => void} [onModal]
   */

  /** @type {Props} */
  let {
    low = false,
    isVisible = false,
    modal = $bindable(false),
    coinlapach,
    mypos = null,
    onModal,
    messege = [],
    descrip = '',
    projectName = '',
    name = '',
    hearotMeyuchadot = '',
    kindOf = '',
    src = 'coin.png',
    projectId,
    noofusersOk = $bindable(),
    noofusersNo = $bindable(),
    noofusersWaiting = $bindable(),
    total = 0,
    noofusers,
    already = $bindable(false),
    created_at,
    mshaabId,
    hm,
    price,
    easy,
    sqadualed,
    sqadualedf,
    recurring = false,
    recurringNoEnd = false,
    pricePerUnit = 0,
    cycleSize = 1,
    pendId,
    users,
    linkto,
    mysrc,
    diun = $bindable([]),
    order = $bindable(diun.length),
    ordern = 0,
    timegramaId,
    restime,
    acts = [],
    location = null,
    cards = false,
    onCoinLapach,
    onHover,
    onProj = () => {},
    nego_mashes = [],
    timeGramaDate = null
  } = $props();
  let error1;
  let no = $state(false);
  let masa = $state(false);
  let monts = $state(0);
  let diunm = $state(false);

  $effect(() => {
    console.log('pmas component acts:', acts);
  });
  let why = '';
  let isOpen = $state(false);
  let loading = $state(false);
  // Realtime chat forum for this resource vote (replaces the old `diun` store).
  let forumId = $state(null);
  let chatm = $state(false);

  async function tochat() {
    no = false;
    masa = false;
    diunm = false;
    loading = false;
    chatm = true;
    isOpen = true;
    if (!forumId) {
      try {
        const result = await executeAction('ensureVoteForum', {
          entityType: 'pmash',
          entityId: String(pendId),
          projectId: String(projectId)
        });
        if (result.success) forumId = result.data?.forumId ?? null;
      } catch (e) {
        console.log(e);
      }
    }
    if (forumId) forumStore.initForum(String(forumId), page.data.id);
  }

  // Persist a chat message to the forum. The Diun component has already added an
  // optimistic (pending) bubble via forumStore; here we save it and reconcile
  // with the real message id. Other participants receive it over the socket.
  async function sendForumMessage(event) {
    const message = event?.why?.trim();
    if (!message || !forumId) return;
    try {
      const result = await executeAction('createChatMessage', {
        forumId: String(forumId),
        message
      });
      if (result.success && result.data) {
        let picLink =
          'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';
        try {
          if (typeof localStorage !== 'undefined' && localStorage.getItem('picLink')) {
            picLink = JSON.parse(localStorage.getItem('picLink'));
          }
        } catch (e) {}
        forumStore.addMessage(String(forumId), {
          id: result.data.messageId,
          message,
          username: page.data.un || 'You',
          pic: picLink,
          timestamp: new Date().toISOString(),
          sentByMe: true,
          pending: false
        });
      }
    } catch (e) {
      console.log(e);
      toast.warning($t('lev.pmas.error'));
    }
  }

  let yers = $state();

  onMount(async () => {
    var a = moment(sqadualedf);
    var b = moment(sqadualed);
    yers = a.diff(b, 'years', true).toFixed(2);
    monts = a.diff(b, 'months', true).toFixed(2);
  });

  function coinLapach() {
    isOpen = false;
    onCoinLapach?.({
      ani: 'pendma',
      coinlapach: coinlapach
    });
  }

  let allr = $state(false);

  // Build the current user's vote in the Strapi-nested shape that processPmash
  // (and the socket merge) expect, so an optimistic store update reads back
  // identically to the server echo.
  function buildMyVote(whatVal, whyText) {
    const myId = String(page.data.id);
    const vote = {
      what: Boolean(whatVal),
      users_permissions_user: { data: { id: myId } },
      order: ordern ?? 0,
      ide: parseInt(myId, 10),
      zman: new Date().toISOString()
    };
    if (whyText) vote.why = whyText;
    return vote;
  }

  // Apply a vote to the shared pmashes store immediately. mergeVote replaces the
  // caller's prior vote at the same order, so this is safe to call twice
  // (optimistic + authoritative echo) without double counting.
  function applyMyVote(vote, id = pendId) {
    updatePmashesStore({ id: String(id), newVote: vote });
  }

  async function agree(alr) {
    // Immediate optimistic update to the shared store — single source of truth,
    // so the vote sticks through re-renders, the buttons hide, and the user
    // can't vote twice while the request is in flight.
    applyMyVote(buildMyVote(true));

    try {
      const result = await executeAction('voteOnPmash', {
        pmashId: String(pendId),
        projectId: String(projectId),
        what: true
      });
      if (!result.success) {
        await invalidate(() => true); // roll back to server truth
        return;
      }
      if (result.data?.consensus) {
        coinLapach();
      } else if (result.data?.newVote) {
        // Reconcile with the authoritative vote (correct order/zman from server).
        applyMyVote(result.data.newVote, result.data.id ?? pendId);
      }
    } catch (e) {
      error1 = e;
      toast.warning($t('lev.pmas.error'));
      await invalidate(() => true); // roll back the optimistic vote
    }
  }
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  async function nego(alr) {
    already = true;
    console.log('nego');
    no = false;
    masa = true;
    isOpen = true;
    console.log(no);
  }
  function decline(alr) {
    if (alr == 'alr') {
      // Changing vote from YES → NO immediately. afterwhy() performs the
      // optimistic store update + server call.
      allr = true;
      isOpen = false;
      afterwhy();
    } else {
      // First time NO: open dialog for reason
      already = true;
      no = true;
      diunm = true;
      isOpen = true;
    }
  }

  async function afterwhy(event) {
    const whyText = event?.why ?? '';
    loading = true;
    // Immediate optimistic update to the shared store (see agree()).
    applyMyVote(buildMyVote(false, whyText));

    try {
      const result = await executeAction('voteOnPmash', {
        pmashId: String(pendId),
        projectId: String(projectId),
        what: false,
        ...(whyText ? { why: whyText } : {})
      });
      loading = false;
      if (!result.success) {
        await invalidate(() => true); // roll back to server truth
        return;
      }
      // Close the reason dialog now that the vote is recorded.
      isOpen = false;
      no = false;
      if (result.data?.archived) {
        // Full NO consensus archived the pmash — server already triggered a
        // full refresh; drop the bubble from this view too.
        coinLapach();
      } else if (result.data?.newVote) {
        // Reconcile with the authoritative vote.
        applyMyVote(result.data.newVote, result.data.id ?? pendId);
      }
    } catch (e) {
      error1 = e;
      loading = false;
      toast.warning($t('lev.pmas.error'));
      await invalidate(() => true); // roll back the optimistic vote
    }
  }
  const close = () => {
    isOpen = false;
    if (no === true) {
      already = false;
    }
    no = false;
    masa = false;
    allr = false;
    rect = false;
    chatm = false;
  };

  function afternego(event) {
    isOpen = false;
    no = false;
    masa = false;
    // The negotiated card is updated in place via the pmashes store (see
    // negoPend), so keep the bubble — don't remove it — and the user sees the
    // new terms and reopened vote round without the view jumping to the start.
  }
  let ucli = $derived(0);

  let rect = false;
  async function react() {
    allr = true;
    rect = true;
    isOpen = true;
  }
  async function afreact(event) {
    why = event.why;
    const diunEntry = {
      what: mypos,
      users_permissions_user: page.data.id,
      why,
      order: (order += 1),
      zman: new Date().toISOString(),
      ide: page.data.id
    };

    try {
      const result = await executeAction('addDiunEntry', {
        entityType: 'pmash',
        entityId: String(pendId),
        projectId: String(projectId),
        what: mypos,
        why
      });
      if (result.success) {
        const newDiunId = result.data?.newDiunId;
        if (newDiunId) nowId.set(newDiunId);
        diun.push(diunEntry);
        diun = diun;
        clicked = false;
      }
    } catch (e) {
      error1 = e;
      console.log(error1);
    }
  }
  let clicked = $state(false);
  /*saved for when graphql enable on io async function afreactold (event){
 let diunim = ``;
  if (diun !== null){
 const diu =  objToString(diun)
diunim = ` ${diu},`
  }   why = event.why
  console.log(why)
  let d = new Date
           loading = true;
     
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idL = cookieValueId;
    token  = cookieValue; 
     bearer1 = 'bearer' + ' ' + token;
    try {
             await fetch(linkg, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation { updatePmash(
      id: ${pendId}
      data: { diun:[  
        ${diunim}  
     {
      what: ${mypos}
      users_permissions_user: "${idL}"
      why: "${why}"
      order: ${order+=1}
      ide: ${idL}
      zman: "${d.toISOString()}"
    }
  ]}
  ){data{attributes { users { users_permissions_user {data{ id}}}}}}
 } `   
 // make coin desapire
 } )})
  .then(r => r.json())
  .then(data => miDatan = data);
         console.log(miDatan)
         messege.push({
                    message: why,
                    what: mypos,
                    pic:mysrc,
                    sentByMe: true,       
                  })
            messege = messege     
         loading = false;
        } catch (e) {
            error1 = e
            console.log(error1)
        }
}
*/


  import { page } from '$app/state';

  let u = 'הצבעה על בקשת משאב לרקמה';
  function hover(id) {
    if (id == '0') {
      u = 'הצבעה על בקשת משאב לרקמה';
    } else {
      u = id;
    }
    onHover?.({ id: u });
  }

  function hoverc(event) {
    if (event.x == '0') {
      u = 'הצבעה על פרסום הצעת משאב לרקמה';
    } else {
      u = event.x;
    }
    onHover?.({ id: u });
  }

  function claf(event) {
    let o = event.alr;
    let d = event.y;
    if (d == 'a') {
      agree(o);
    } else if (d == 'd') {
      decline(o);
    } else if (d == 'n') {
      nego(o);
    }
    console.log(o, d);
  }
</script>

<DialogOverlay {isOpen} onDismiss={close} class="overlay">
  <div transition:fly|local={{ y: 450, opacity: 0.5, duration: 2000 }}>
    <DialogContent class="{masa == true ? 'nego-shell' : 'chat'} surface-dialog" aria-label="form">
      {#if masa === true && loading !== true}
        <Nego
          framed
          onDismiss={close}
          onLoad={() => (loading = true)}
          onClose={afternego}
          {ordern}
          {descrip}
          {projectName}
          name1={name}
          spnot={hearotMeyuchadot}
          {kindOf}
          {hm}
          {timegramaId}
          {projectId}
          {total}
          {noofusers}
          {price}
          {easy}
          {recurring}
          {recurringNoEnd}
          {pricePerUnit}
          {cycleSize}
          {linkto}
          {pendId}
          {mshaabId}
          {sqadualedf}
          {sqadualed}
          {users}
          {acts}
          {location}
          {restime}
        />
      {:else}
      <div dir="rtl" class="grid items-center justify-center aling-center">
        <button
          onclick={close}
          style="margin: 0 auto;"
          class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
          title="ביטול"
          ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
            />
          </svg></button
        >
        {#if loading === true}
          <Spinner size="lg" />
          <!--   {:else if rect === true}
            <div class="text-center">
  <h1>  ניתן להגיב ולנמק מדוע 
    {mypos === false ? "לדחות" : " לאשר "}  
     את ההצעה
                     <br>
                        נא להתייחס לתגובה הקודמת ולהשיב על הטענות שעלו בה
                        </h1>
                        <small style="color: red;">התגובה הקודמת</small>
    {#if whyno.length > 0}<h4 style="color:var(--barbi-pink); font-size: 13px;">{whyno.join(' ~ ')}</h4>{/if}
    <br> 
    <lebel for="yu">התגובה שלך</lebel>   
    <input id="yu" minlength="26"  type="text" bind:value={why} placeholder="התשובה שלך">
            <button on:click={afreact}>אישור</button>  </div> -->
        {:else if chatm === true}
          <Diun
            onRect={sendForumMessage}
            bind:clicked
            rect={true}
            rikmaName={projectName}
            smalldes={name}
            nameChatPartner={`הצבעה על ${name}`}
            nameMe={page.data.un || 'Me'}
            {mypos}
            pendId={forumId}
            profilePicChatPartner={src}
            ani={forumId ? 'new-forum' : 'pmashes'}
            messages={forumId ? $forumStore[forumId]?.messages || [] : []}
            isLoading={forumId ? $forumStore[forumId]?.loading || false : false}
          />
        {:else if diunm === true}
          <Diun
            onRect={afreact}
            onNo={afterwhy}
            {no}
            bind:clicked
            rect={true}
            smalldes={projectName}
            nameChatPartner={`הצבעה על ${name}`}
            {mypos}
            {pendId}
            profilePicChatPartner={src}
            ani="pmashes"
          />
        {/if}
      </div>
      {/if}
    </DialogContent>
  </div>
</DialogOverlay>
<Cards
  onAgree={claf}
  onDecline={claf}
  onHover={hoverc}
  onTochat={tochat}
  {isVisible}
  {low}
  {kindOf}
  {hm}
  {monts}
  {yers}
  {easy}
  {price}
  {hearotMeyuchadot}
  {already}
  {projectName}
  {src}
  {noofusersWaiting}
  {noofusersOk}
  {name}
  {descrip}
  {mypos}
  {allr}
  {noofusersNo}
  onNego={claf}
  {nego_mashes}
  {timeGramaDate}
  {location}
  {recurring}
  {recurringNoEnd}
  {pricePerUnit}
  {cycleSize}
  {sqadualed}
  {sqadualedf}
  {projectId}
  {users}
  activeOrder={ordern}
  {onProj}
/>

<style>

  :global([data-svelte-dialog-content].chat) {
    z-index: 1000;
    padding: 0px;
    margin: 0px;
    height: 70vh;
    aspect-ratio: 1/1.7;
    margin-top: 30vh;
    border-radius: 10%;
  }
  :global([data-svelte-dialog-overlay].overlay) {
    z-index: 1000;
  }
  @media (min-width: 600px) {
    :global([data-svelte-dialog-content].chat) {
      z-index: 1000;
      padding: 0px;
      margin: 0px;
      height: 80vh;
      aspect-ratio: 1/2;
      margin-top: 20vh;
      border-radius: 15%;
    }
    :global([data-svelte-dialog-overlay].overlay) {
      z-index: 1000;
    }
  }
</style>
