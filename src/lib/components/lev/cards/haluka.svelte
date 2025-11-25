<script>
  import Chaticon from '../../../celim/chaticon.svelte';
  import tr from '$lib/translations/tr.json';
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import Lev from '../../../celim/lev.svelte';
  import No from '../../../celim/no.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { toggleScrollable, isScrolable } from './isScrolable.svelte.js';
  import AuthorityBadge from '../../ui/AuthorityBadge.svelte';
  import { getProjectData } from '$lib/stores/projectStore.js';

  /**
   * @typedef {Object} Props
   * @property {boolean} [low]
   * @property {boolean} [isVisible]
   * @property {any} projectName
   * @property {any} src
   * @property {any} why
   * @property {any} src2
   * @property {any} missionBName
   * @property {any} missionDetails
   * @property {any} noofusersNo
   * @property {any} noofusersOk
   * @property {any} noofusersWaiting
   * @property {any} hearotMeyuchadot
   * @property {any} mypos
   * @property {any} valph
   * @property {any} nhours
   * @property {any} useraplyname
   * @property {any} already
   * @property {boolean} [allr]
   * @property {(payload: { x: any }) => void} [onHover] - Callback for hover event
   * @property {(payload: { alr: any, y: string }) => void} [onAgree] - Callback for agree event
   * @property {(payload: { alr: any, y: string }) => void} [onDecline] - Callback for decline event
   * @property {(payload: { alr: any, y: string }) => void} [onNego] - Callback for nego event
   * @property {() => void} [onTochat] - Callback for tochat event
   * @property {any} [halukot]
   * @property {any} [hervach]
   * @property {any} [projectId]
   */

  /** @type {Props} */
  let {
    low = false,
    isVisible = false,
    projectName,
    src,
    why,
    src2,
    missionBName,
    missionDetails,
    noofusersNo,
    noofusersOk,
    noofusersWaiting,
    hearotMeyuchadot,
    mypos,
    valph,
    nhours,
    useraplyname,
    already = $bindable(),
    allr = false,
    onHover,
    onAgree,
    onDecline,
    onNego,
    onTochat,
    halukot = [],
    hervach = [],
    projectId
  } = $props();

  let ulist = $state([]);

  function processSplitDetails() {
    if (!hervach) {
      console.log('Missing hervach data:', { hervach });
      return;
    }

    if (hervach.length === 0) {
      console.log('Empty hervach array');
      return;
    }

    console.log('Processing split details from hervach:', { 
      hervachLength: hervach.length,
      hervach
    });

    let tempUlist = [];
    let givers = []; // Those who need to give (noten: true)
    let receivers = []; // Those who need to receive (mekabel: true)
    
    // Process hervach (profit shares) - build user list
    for (let i = 0; i < hervach.length; i++) {
      let item = hervach[i];
      let user = item?.users_permissions_user?.data || item?.users_permissions_user;
      let amount = item?.amount || 0;
      let isMekabel = item?.mekabel || false;
      let isNoten = item?.noten || false;

      console.log(`Hervach ${i}:`, { item, user, amount, isMekabel, isNoten });

      if (user) {
        let userId = user.id || user;
        let username = user.attributes?.username || user.username || getProjectData(projectId, 'un', userId) || 'Unknown';
        
        let userObj = {
          uid: userId,
          username: username,
          x: amount, // What they should get (their share)
          p: 0,
          ihave: amount, // Final amount they'll have
          meca: isMekabel ? amount : 0, // What they need to receive
          noten: isNoten ? amount : 0, // What they need to give
          le: [], // List of transfers they make
          isMekabel: isMekabel,
          isNoten: isNoten
        };
        
        tempUlist.push(userObj);
        
        if (isNoten) {
          givers.push(userObj);
        }
        if (isMekabel) {
          receivers.push(userObj);
        }
      }
    }

    console.log('After hervach processing:', { tempUlist, givers, receivers });

    // Calculate transfers: distribute from givers to receivers
    // This mimics the logic from whowhat.svelte
    for (let giver of givers) {
      let remainingToGive = giver.noten;
      
      for (let receiver of receivers) {
        if (remainingToGive <= 0) break;
        if (receiver.meca <= 0) continue;
        
        // Calculate transfer amount
        let transferAmount = Math.min(remainingToGive, receiver.meca);
        
        if (transferAmount > 0.01) {
          // Add to giver's transfer list
          giver.le.push({
            le: receiver.username,
            leid: receiver.uid,
            cama: transferAmount
          });
          
          // Update remaining amounts
          remainingToGive -= transferAmount;
          receiver.meca -= transferAmount;
          
          console.log(`Transfer calculated: ${giver.username} -> ${receiver.username}: ${transferAmount}`);
        }
      }
    }

    // Reset meca values to original for display
    for (let user of tempUlist) {
      if (user.isMekabel) {
        user.meca = user.x;
      }
    }

    console.log('Final ulist with transfers:', tempUlist);
    ulist = tempUlist;
  }

  $effect(() => {
    processSplitDetails();
  });

  function hover(x) {
    onHover?.({ x: x });
  }
  function agree(alr) {
    already = true;
    onAgree?.({ alr: alr, y: 'a' });
  }
  function decline(alr) {
    already = true;
    onDecline?.({ alr: alr, y: 'd' });
  }
  function nego(alr) {
    onNego?.({ alr: alr, y: 'n' });
  }
  function tochat() {
    onTochat?.();
  }
  const tri = import('$lib/translations/tr.json');
</script>

<div
  onclick={toggleScrollable}
  role="button"
  tabindex="0"
  onkeypress={(e) => {
    e.key === 'Enter' && toggleScrollable();
  }}
  dir="rtl"
  style="overflow-y:auto"
  class=" d {isVisible
    ? $lang == 'he'
      ? 'boxleft'
      : 'boxright'
    : ''} leading-normal {isMobileOrTablet()
    ? 'w-full h-full'
    : ' w-[90%] h-[90%]'} bg-white lg:w-[90%]"
>
  <!-- <div class="h-48 lg:h-auto lg:w-48 flex-none bg-cover rounded-t lg:rounded-t-none lg:rounded-l text-center overflow-hidden bg-gold" style:background-image={`url('${src2}')`} title="">
  </div>-->
  <div
    class="flex sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre"
  >
    <div class="relative flex items-center space-x-1">
      <AuthorityBadge
        logoSrc={src}
        {projectName}
        size={isMobileOrTablet() ? 80 : 120}
      />
      <div class="flex flex-col leading-tight ml-4">
        <div class="sm:text-lg text-md mt-1 flex items-center">
          <span class="text-barbi text-center mr-3 sm:text-3xl text-xl"
            >{tr.headers.haluka[$lang]}</span
          >
        </div>
        {#if missionBName}
          <div class="text-gray-900 font-bold text-lg sm:text-2xl">
            {missionBName}
          </div>
        {/if}
      </div>
    </div>
  </div>
  <div
    class="{isScrolable.value
      ? 'bg-white'
      : 'bg-gray-200'} transition-all-300 rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal"
  >
    <div class="mb-8"></div>
    <div class="flex items-center">
      <p>
        <span
          onmouseenter={() => hover('סך ההצבעות בעד')}
          onmouseleave={() => hover('0')}
          style="color:#7EE081;">{noofusersOk}-בעד</span
        >
        <span
          onmouseenter={() => hover('לא הצביעו')}
          onmouseleave={() => hover('0')}
          style="color:#0000cc;"
          >{noofusersWaiting}-טרם
        </span><span
          onmouseenter={() => hover('כמות ההצבעות נגד')}
          onmouseleave={() => hover('0')}
          style="color:#80037e;">{noofusersNo}-נגד</span
        >
      </p>
    </div>

    {#if ulist.length > 0}
      <div class="w-full overflow-x-auto p-2">
        <!-- Mobile View -->
        <div class="block md:hidden space-y-2">
          {#each ulist as user}
            <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-300 shadow-sm">
              <div class="font-bold text-barbi text-base mb-2">{user.username}</div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="bg-white rounded p-2">
                  <div class="text-gray-600">מגיע:</div>
                  <div class="font-semibold text-barbi">{user.x.toFixed(2)}</div>
                </div>
                <div class="bg-white rounded p-2">
                  <div class="text-gray-600">בפועל:</div>
                  <div class="font-semibold text-green-600">{user.ihave.toFixed(2)}</div>
                </div>
                {#if user.noten > 0}
                  <div class="bg-red-50 rounded p-2">
                    <div class="text-gray-600">נותן:</div>
                    <div class="font-semibold text-red-600">{user.noten.toFixed(2)}</div>
                  </div>
                {/if}
                {#if user.meca > 0}
                  <div class="bg-green-50 rounded p-2">
                    <div class="text-gray-600">מקבל:</div>
                    <div class="font-semibold text-green-600">{user.meca.toFixed(2)}</div>
                  </div>
                {/if}
              </div>
              {#if user.le && user.le.length > 0}
                <div class="mt-2 pt-2 border-t border-gray-300">
                  <div class="text-xs text-gray-600 mb-1">העברות:</div>
                  <div class="space-y-1">
                    {#each user.le as transfer}
                      <div class="bg-blue-50 rounded px-2 py-1 text-xs flex justify-between items-center">
                        <span class="text-blue-800">→ {transfer.le}</span>
                        <span class="font-semibold text-blue-600">{transfer.cama.toFixed(2)}</span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Desktop View -->
        <div class="hidden md:block">
          <table class="w-full text-center border-collapse text-sm">
            <thead>
              <tr class="bg-gradient-to-br from-barbi to-mpink text-gold sticky top-0">
                <th class="p-2 border border-gold rounded-tl-lg">שם</th>
                <th class="p-2 border border-gold">מגיע</th>
                <th class="p-2 border border-gold">בפועל</th>
                <th class="p-2 border border-gold">נותן</th>
                <th class="p-2 border border-gold">מקבל</th>
                <th class="p-2 border border-gold rounded-tr-lg">העברות</th>
              </tr>
            </thead>
            <tbody>
              {#each ulist as user, i}
                <tr class="hover:bg-gray-100 transition-colors {i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                  <td class="p-2 border border-gray-300 font-semibold text-barbi">{user.username}</td>
                  <td class="p-2 border border-gray-300 font-mono">{user.x.toFixed(2)}</td>
                  <td class="p-2 border border-gray-300 font-mono font-semibold text-green-600">{user.ihave.toFixed(2)}</td>
                  <td class="p-2 border border-gray-300 font-mono {user.noten > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}">
                    {user.noten > 0 ? user.noten.toFixed(2) : '-'}
                  </td>
                  <td class="p-2 border border-gray-300 font-mono {user.meca > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'}">
                    {user.meca > 0 ? user.meca.toFixed(2) : '-'}
                  </td>
                  <td class="p-2 border border-gray-300 text-xs">
                    {#if user.le && user.le.length > 0}
                      <div class="space-y-1">
                        {#each user.le as transfer}
                          <div class="bg-blue-50 rounded px-2 py-1 inline-block m-0.5">
                            <span class="text-blue-800">→ {transfer.le}:</span>
                            <span class="font-semibold text-blue-600">{transfer.cama.toFixed(2)}</span>
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <span class="text-gray-400">-</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>
  {#if low == false}
    {#if already === false && allr === false}
      <button
        onmouseenter={() => hover('אישור')}
        onmouseleave={() => hover('0')}
        onclick={() => agree('f')}
        class="btna bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink hover:text-gold text-barbi hover:scale-110"
        name="requestToJoin"
      >
        <Lev />
      </button>
      <button
        onmouseenter={() => hover('משא ומתן')}
        onmouseleave={() => hover('0')}
        onclick={() => nego('f')}
        class="btnc bg-gradient-to-br hover:from-gold hover:via-mpink hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-mpink hover:text-gold hover:scale-110"
        name="negotiate"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          version="1.1"
          viewBox="0 0 24 24"
          ><path
            fill="currentColor"
            d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z"
          /></svg
        ></button
      >
      <button
        onmouseenter={() => hover('התנגדות')}
        onmouseleave={() => hover('0')}
        onclick={() => decline('f')}
        class="btnb bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-red-400 hover:scale-110"
        name="decline"
      >
        <No />
      </button><!--
    {:else if already === true && mypos === true && noofusersNo > 0 && allr === false}
            <button on:mouseenter={()=>hover("משא ומתן")} on:mouseleave={()=>hover("0")}  
                on:click={() => nego("alr")} 
                class = "btna bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink hover:text-gold text-barbi hover:scale-110" 
                name="negotiate" 
                ><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z" /></svg></button>
            <button
             on:mouseenter={()=>hover("התנגדות")} 
             on:mouseleave={()=>hover("0")} 
             on:click={()=>decline("alr")} 
              class = "btnb bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-red-400 hover:scale-110" 
              name="decline">
              <No/>
            </button>     
            <button 
            on:mouseenter={()=>hover("תגובה")} 
            on:mouseleave={()=>hover("0")}  
            on:click={() => tochat()}
            class = "btnc bg-gradient-to-br hover:from-gold hover:via-mpink  hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-mpink hover:text-gold hover:scale-110" 
            ><Chaticon class="btin"/></button>
       {:else if already === true && mypos === false && noofusersOk > 0  && allr === false}
                <button on:mouseenter={()=>hover("אישור")}
               on:mouseleave={()=>hover("0")} 
               on:click={()=>agree("alr")} 
                class = "btna bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink hover:text-gold text-barbi hover:scale-110"
                 name="requestToJoin">
                <Lev/>
                </button>   
              <button 
                onmouseenter={()=>hover("משא ומתן")} 
                onmouseleave={()=>hover("0")}  
                onclick={() => nego("alr")} 
              class = "btnb bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-red-400 hover:scale-110" 
                   name="negotiate" title="משא ומתן"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z" /></svg></button>
                 <button
                  onmouseenter={()=>hover("תגובה")} 
                  onmouseleave={()=>hover("0")}  
                   class = "btnc bg-gradient-to-br hover:from-gold hover:via-mpink  hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-gold hover:text-barbi hover:scale-110" 
                       onclick={() => tochat()}
                       ><Chaticon/>
                          </button>
        {:else}
     <button
      onmouseenter={()=>hover("לצפיה בדיון")} 
      onmouseleave={()=>hover("0")}  
     class = "btnc bg-gradient-to-br hover:from-gold hover:via-mpink  hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-gold hover:text-barbi hover:scale-110" 
      onclick={() => tochat()}
      ><Chaticon/>
        </button>
    -->
    {/if}
  {:else if low == true}
    <Lowbtn isCart="true" />
  {/if}
</div>

<style>
</style>
