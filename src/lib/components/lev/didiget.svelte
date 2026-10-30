<script>
  import Diun from './diun.svelte';
  import { toast } from 'svelte-sonner';
  import DidigetCard from './cards/didigetCard.svelte';
  import { executeAction } from '$lib/client/actionClient';

  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import Lowbtni from '$lib/celim/lowbtn.svelte';
  //how to recive? discution or build in payments to add
  import { fly } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { idPr } from '../../stores/idPr.js';
  import {
    nowChatId,
    isChatOpen,
    newChat,
    forum
  } from '../../stores/pendMisMes.js';
  import moment from 'moment';
  import Cards from './cards/haluka.svelte';
  /**
   * @typedef {Object} Props
   * @property {boolean} [modal]
   * @property {boolean} [isVisible]
   * @property {any} [shear]
   * @property {boolean} [low]
   * @property {string} [sendpropic]
   * @property {string} [sendname]
   * @property {string} [respropic]
   * @property {string} [resname]
   * @property {string} [projectId]
   * @property {string} [kind]
   * @property {string} [projectName]
   * @property {string} [src]
   * @property {string} [myid]
   * @property {number} [pendId]
   * @property {string} [chat]
   * @property {string} [amount]
   * @property {string} [send]
   * @property {string} [recive]
   * @property {boolean} [sendcon] - האם הנותן אישר שהעביר
   * @property {boolean} [confirmed] - האם המקבל אישר שקיבל
   * @property {string} [coinlapach]
   * @property {boolean} [already]
   * @property {any} [whyno]
   * @property {any} [hervachti]
   * @property {any} created_at
   * @property {any} [messege]
   * @property {any} [order]
   * @property {boolean} [cards]
   * @property {number | null} [forumId] - Forum ID for existing chat, null for new chat
   * @property {(payload: { ani: string, coinlapach: string }) => void} [onCoinLapach] - Callback for 'coinLapach' event
   * @property {(payload: { id: any }) => void} [onHover] - Callback for 'hover' event
   * @property {(payload: { id: any }) => void} [onProj] - Callback for 'proj' event
   * @property {() => void} [onModal] - Callback for 'modal' event
   */

  /** @type {Props} */
  let {
    modal = $bindable(false),
    isVisible = false,
    shear = [],
    low = false,
    sendpropic = '',
    sendname = '',
    respropic = '',
    resname = '',
    projectId = '',
    kind = '',
    projectName = '',
    src = '',
    myid = '',
    pendId = 0,
    chat = '',
    amount = '',
    send = '',
    recive = '',
    sendcon = false,
    confirmed = false,
    coinlapach = '',
    already = $bindable(false),
    whyno = [],
    hervachti = [],
    created_at,
    messege = $bindable([]),
    order = messege.length,
    cards = false,
    forumId = null,
    onCoinLapach,
    onHover,
    onProj,
    onModal
  } = $props();
  let error1;
  let no = $state(false);
  let masa = $state(false);
  function percentage(partialValue, totalValue) {
    return (100 * partialValue) / totalValue;
  }
  let ok;
  let nook;
  let tryo = $state('116%');
  let tryot = $state('-10.5%');
  let tryoti = $state('-5.25%');
  let nut;
  let noofusersOk = $state(sendcon == true ? 1 : 0);
  let noofusersNo = 0;

  let noofusersWaiting = $state(sendcon == true ? 1 : 2);
  function xyz() {
    ok = percentage(noofusersOk, 2);
    nook = percentage(noofusersNo, 2);
    nut = percentage(noofusersWaiting, 2);
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
    console.log('here');
    onCoinLapach?.({
      ani: 'vidu',
      coinlapach: coinlapach
    });
  }

  async function agree(alr) {
    console.log('agree called with alr:', alr, 'kind:', kind);
    if (alr == 'alr') {
      alert('soon');
    } else {
      already = true;
      noofusersOk += 1;
      noofusersWaiting -= 1;
      ser = xyz();

      try {
        const result = await executeAction('confirmHaluka', {
          halukaId: String(pendId),
          projectId: String(projectId),
          kind: kind === 'send' ? 'send' : 'receive',
        });
        if (result.success) {
          toast.success($t('lev.didiget.success'));
          coinLapach();
        } else {
          toast.warning($t('lev.didiget.error'));
        }
      } catch (e) {
        error1 = e;
        console.log(error1);
      }
    }
  }
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  async function nego(alr) {
    /*
  already = true;
        console.log("nego")   
        no = false;
         masa = true;
            isOpen = true;*/
    console.log(no);
  }
  function decline(alr) {
    /*
      if  (alr == "alr"){*/
    alert('soon');
    /*  } else{

      already = true;

      no = true;
            isOpen = true;
        //create why alert (from smui) add validation for minimum 
        // send why with userss, create way to show why for all agreed users and for them to response.
	}*/
  }
  let why = $state();
  let isOpen = $state(false);

  async function afterwhy() {
    /*
        if (why.length > 20) {
          
    isOpen = false;
  already = true;
   noofusersNo += 1;
  noofusersWaiting -= 1;
  ser = xyz();      
    const userss = objToString(users);
    const diunim = objToString(diun);  
 
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
          `mutation {  updateTosplit(
id: ${pendId}
      data: { vots:[  ${userss},      
     {
      what: false
      why: "${why}"
      users_permissions_user: "${idL}"
    }
  ],
 }
  ){data { vots { users_permissions_user {data{ id}}}}}
} `   
// make coin desapire
} )})
  .then(r => r.json())
  .then(data => miDatan = data);
         console.log(miDatan)
                 coinLapach()
        } catch (e) {
            error1 = e
            console.log(error1)
        }
    } else{
          console.log("decline",why)
            alert("מינימום 20 תווים")
            already = false;
        }
           
*/
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

  let pmcli = $state(0);

  function project(id) {
    pmcli += 1;
    if (pmcli >= 2) {
      idPr.set(id);
      goto('/moach');
    }
  }
  let rect = $state(false);
  let allr = false;
  async function react() {
    // אם יש forumId קיים - פותחים את הצ'אט הקיים
    if (forumId) {
      // אם אין metadata לפורום, נוסיף אותו
      let tempF = $forum;
      if (!tempF[forumId] || !tempF[forumId].md) {
        tempF[forumId] = {
          loading: false,
          messages: tempF[forumId]?.messages || [],
          md: {
            pid: Number(projectId),
            mbId: 0,
            halukId: Number(pendId),
            projectName: projectName,
            projectPic: src,
            transferDetails: `${kind === 'send' ? 'העברת' : 'קבלת'} ${amount}`,
            senderId: send,
            receiverId: recive,
            participants: [send, recive] // גם לפורום קיים
          }
        };
        forum.set(tempF);
      }
      nowChatId.set(forumId);
      isChatOpen.set(true);
    } else {
      // אם אין forumId - יוצרים צ'אט זמני
      newChat.set({
        started: true,
        created: false,
        id: 0,
        md: {
          mbId: 0, // אין mesimabetahalich, זה haluka
          pid: Number(projectId),
          halukId: Number(pendId),
          senderId: send,
          receiverId: recive,
          participants: [send, recive] // רשימת המשתתפים - רק הנותן והמקבל
        }
      });

      let tempF = $forum;
      tempF[-1] = {
        loading: false,
        messages: messege || [],
        md: {
          pid: Number(projectId),
          mbId: 0,
          halukId: Number(pendId),
          projectName: projectName,
          projectPic: src,
          transferDetails: `${kind === 'send' ? 'העברת' : 'קבלת'} ${amount}`,
          senderId: send,
          receiverId: recive,
          participants: [send, recive]
        }
      };
      forum.set(tempF);
      nowChatId.set(-1);
      isChatOpen.set(true);
    }
  }
  async function afreact(event) {
    why = event.why;
    try {
      const result = await executeAction('addHalukaChatEntry', {
        halukaId: String(pendId),
        projectId: String(projectId),
        text: why,
      });
      if (result.success && result.data?.chatre) {
        const chati = result.data.chatre;
        messege = chati.map((c) => ({
          message: c.freetext,
          when: c.when,
          pic: c.send?.data?.attributes?.profilePic?.data?.attributes?.url,
          sentByMe: c.send?.data?.id === String(myid),
          seen: c.seen,
        }));
        toast.success($t('lev.didiget.messageSent'));
        setTimeout(() => { isOpen = false; }, 15000);
      }
    } catch (e) {
      error1 = e;
      console.log(error1);
    }
  }


  const headline = $derived(
    kind == 'send' ? $t('lev.didiget.approveSend') : $t('lev.didiget.approveReceive')
  );

  function hover(id) {
    onHover?.({ id: id == '0' ? headline : id });
  }
  function hoverc(event) {
    onHover?.({ id: event.x == '0' ? headline : event.x });
  }

  function claf(event) {
    let o = event.alr;
    let d = event.y;
    console.log(o, d);
  }
</script>

<DialogOverlay class="overlay" {isOpen} onDismiss={close}>
  <div transition:fly|local={{ y: 450, opacity: 0.5, duration: 2000 }}>
    <DialogContent class="chat d surface-dialog" aria-label="form">
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
          <Diun
            onRect={afreact}
            onNo={afterwhy}
            money={true}
            {no}
            rect={true}
            smalldes={projectName}
            nameChatPartner={`צ'אט על העברת כסף`}
            mypos={true}
            profilePicChatPartner={src}
            messages={messege}
          />
        {:else if masa === true}
          <h2 class="bg-gold text-barbi text-center">
            .יבנה במהרה בימינו אמן בנתיים יש להגיב לא ולנמק ואז ליצור משאב חדש
            עם המאפיינים הרצויים
          </h2>
          <!--
<Nego
        on:close={afternego}
  descrip ={descrip}
  projectName ={projectName}
  name1 ={name}
  hearotMeyuchadot = {hearotMeyuchadot}
  kindOf ={kindOf}
  hm = {hm}
  projectId = {projectId}
  total ={total}
  noofusers={noofusers}
  price={price}
  easy = {easy}
  linkto = {linkto}
  pendId ={pendId}
  mshaabId={mshaabId}
  sqadualedf={sqadualedf}
  sqadualed={sqadualed}
  users={users}
/>-->
        {/if}
      </div>
    </DialogContent>
  </div>
</DialogOverlay>
<DidigetCard
  onAgree={(e) => agree(e.alr)}
  onDecline={(e) => decline(e.alr)}
  onNego={(e) => nego(e.alr)}
  onTochat={react}
  onHover={hoverc}
  onProj={project}
  {isVisible}
  {already}
  {projectName}
  {src}
  {sendpropic}
  {sendname}
  {respropic}
  {resname}
  {projectId}
  {kind}
  {amount}
  {sendcon}
  {confirmed}
  {low}
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

  /* חיווי: אישור (✓ ירוק) */

  /* חיווי: ממתין (שעון כחול) */

  :global([data-svelte-dialog-overlay].overlay) {
    z-index: 100;
  }
  :global([data-svelte-dialog-content].content) {
    width: 80vw;
    z-index: 299;
  }
  :global([data-svelte-dialog-content].chat) {
    z-index: 1000;
    padding: 0px;
    margin: 0px;
    height: 70vh;
    aspect-ratio: 1/1.7;
    margin-top: 30vh;
    border-radius: 10%;
    overflow-y: auto;
  }
  :global([data-svelte-dialog-content].nego) {
    z-index: 1000;
    padding: 15px;
    margin: 0px;
    margin-right: 25px;

    height: 70vh;
    width: fit-content;
    margin-top: 30vh;
    border-radius: 5%;
    overflow-y: auto;
    border-top-right-radius: 2%;
    border-bottom-right-radius: 2%;
  }
  :global([data-svelte-dialog-overlay].overlay) {
    z-index: 1000;
  }

  @media (min-width: 600px) {
    :global([data-svelte-dialog-content].chat) {
      overflow-y: auto;
      z-index: 1000;
      padding: 0px;
      margin: 0px;
      height: 80vh;
      margin-top: 20vh;
      border-radius: 5%;
    }
    :global([data-svelte-dialog-content].nego) {
      overflow-y: auto;
      z-index: 1000;
      padding: 15px;
      margin-right: 25px;
      margin: 0px;
      margin-top: 20vh;
      height: 80vh;
      width: fit-content;
      border-radius: 5%;
      border-top-right-radius: 2%;
      border-bottom-right-radius: 2%;
    }
    :global([data-svelte-dialog-overlay].overlay) {
      z-index: 1000;
    }
  }
</style>
