<script>
  let isonly = $state(false);
  import RichText from '$lib/celim/ui/richText.svelte';
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  /**
   * @typedef {Object} Props
   * @property {any} [bmiData]
   * @property {number} [who]
   */

  /** @type {Props} */
  let { bmiData = $bindable([]), who = 0 } = $props();
  
  onMount(async () => {
    if (who !== 0) {
      isonly = true
      var filtered = bmiData.filter(function(event) {
        return event.id == who;
      });
      bmiData = filtered;
    }
  })

  function remove(id) {
    console.log(id)
  };
  
  function edit(id) {
    console.log(id)
  }
  
  function confirm(id) {
    console.log(id)
  }
</script>

<div class="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-2xl border border-purple-200">
  <!-- Header -->
  <div class="text-center mb-8">
    <h1 class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
      {$lang == 'en' ? (isonly == true ? "Action in Progress" : "Actions in Progress") : (isonly == true ? "פעולה" : "פעולות")} בתהליך ביצוע
    </h1>
    <div class="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
  </div>

  <!-- Table Container -->
  <div class="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-200">
    <table dir={$lang == 'en' ? "ltr" : "rtl"} class="w-full min-w-full">
      <!-- Task Numbers Row (if not single task) -->
      {#if isonly == false}
        <thead>
          <tr class="bg-gradient-to-r from-purple-600 to-pink-600 sticky top-0 z-20">
            <th class="px-6 py-4 text-white font-bold border-r border-purple-400"></th>
            {#each bmiData as data, i}
              <th class="px-6 py-4 text-white font-bold text-3xl border-r border-purple-400 last:border-r-0">
                {i + 1}
              </th>
            {/each}
          </tr>
        </thead>
      {/if}

      <tbody class="divide-y divide-gray-200">
        <!-- Name Row -->
        <tr class="bg-gradient-to-r from-purple-500 to-pink-500 text-white sticky z-10" style:top={isonly == true ? "0px" : "77px"}>
          <td class="px-6 py-4 font-bold text-lg border-r border-purple-300 bg-purple-600">{$lang == 'en' ? "Name" : "שם"}</td>
          {#each bmiData as data, i}
            <td class="px-6 py-4 font-bold text-lg border-r border-purple-300 last:border-r-0">{data.attributes.name}</td>
          {/each}
        </tr>

        <!-- Description Row -->
        <tr class="hover:bg-gray-50 transition-colors duration-200">
          <td class="px-6 py-4 font-semibold text-gray-700 bg-gradient-to-r from-purple-100 to-pink-100 border-r border-gray-200">{$lang == 'en' ? "Description" : "תיאור"}</td>
          {#each bmiData as data, i}
            <td class="px-6 py-4 border-r border-gray-200 last:border-r-0">
              <div class="max-w-xs">
                <RichText outpot={data.attributes.descrip} editable={false}/>
              </div>
            </td>
          {/each}
        </tr>

        <!-- Execution Date Row -->
        <tr class="hover:bg-gray-50 transition-colors duration-200">
          <td class="px-6 py-4 font-semibold text-gray-700 bg-gradient-to-r from-purple-100 to-pink-100 border-r border-gray-200">{$lang == 'en' ? "Execution Date" : "תאריך ביצוע"}</td>
          {#each bmiData as data, i}
            <td class="px-6 py-4 border-r border-gray-200 last:border-r-0">
              {#if data.attributes.Sqadualed !== undefined}
                <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {data.attributes.Sqadualed}
                </span>
              {/if}
            </td>
          {/each}
        </tr>

        <!-- Public Links Row -->
        <tr class="hover:bg-gray-50 transition-colors duration-200">
          <td class="px-6 py-4 font-semibold text-gray-700 bg-gradient-to-r from-purple-100 to-pink-100 border-r border-gray-200">{$lang == 'en' ? "Public Links" : "קישורים ציבוריים"}</td>
          {#each bmiData as data, i}
            <td class="px-6 py-4 border-r border-gray-200 last:border-r-0">
              {#if data.attributes.publicklinks !== undefined && data.attributes.publicklinks !== "undefined"}
                <a target="_blank" rel="noreferrer" href="{data.attributes.publicklinks}" 
                   class="inline-flex items-center px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition-colors duration-200 font-medium">
                  <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                  {$lang == 'en' ? "Link" : "קישור"}
                </a>
              {/if}
            </td>
          {/each}
        </tr>

        <!-- Special Notes Row -->
        <tr class="hover:bg-gray-50 transition-colors duration-200">
          <td class="px-6 py-4 font-semibold text-gray-700 bg-gradient-to-r from-purple-100 to-pink-100 border-r border-gray-200">{$lang == 'en' ? "Special Notes for My Fabric" : "הערות יחודיות לריקמה שלי"}</td>
          {#each bmiData as data, i}
            <td class="px-6 py-4 border-r border-gray-200 last:border-r-0">
              {#if data.attributes.hearotMeyuchadot !== undefined && data.attributes.hearotMeyuchadot !== "undefined"}
                <div class="max-w-xs">
                  <RichText outpot={data.attributes.hearotMeyuchadot} editable={false}/>
                </div>
              {/if}
            </td>
          {/each}
        </tr>

        <!-- Private Links Row -->
        <tr class="hover:bg-gray-50 transition-colors duration-200">
          <td class="px-6 py-4 font-semibold text-gray-700 bg-gradient-to-r from-purple-100 to-pink-100 border-r border-gray-200">{$lang == 'en' ? "Private Links for My Fabric" : "קישורים יחודיים לריקמה שלי"}</td>
          {#each bmiData as data, i}
            <td class="px-6 py-4 border-r border-gray-200 last:border-r-0">
              {#if data.attributes.privatlinks !== undefined && data.attributes.privatlinks !== "undefined"}
                <a rel="noreferrer" target="_blank" href="{data.attributes.privatlinks}"
                   class="inline-flex items-center px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors duration-200 font-medium">
                  <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  {$lang == 'en' ? "Private Link" : "קישור פרטי"}
                </a>
              {/if}
            </td>
          {/each}
        </tr>

        <!-- Hours Required Row -->
        <tr class="hover:bg-gray-50 transition-colors duration-200" id="hoursD">
          <td class="px-6 py-4 font-semibold text-gray-700 bg-gradient-to-r from-purple-100 to-pink-100 border-r border-gray-200">{$lang == 'en' ? "How many hours should it take?" : "כמה שעות זה אמור לקחת?"}</td>
          {#each bmiData as data, i}
            <td class="px-6 py-4 border-r border-gray-200 last:border-r-0">
              {#if data.attributes.hoursassinged > 0}
                <span class="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {data.attributes.hoursassinged} {$lang == 'en' ? "hours" : "שעות"}
                </span>
              {/if}
            </td>
          {/each}
        </tr>

        <!-- Hourly Rate Row -->
        <tr class="hover:bg-gray-50 transition-colors duration-200" id="vallueperhourN">
          <td class="px-6 py-4 font-semibold text-gray-700 bg-gradient-to-r from-purple-100 to-pink-100 border-r border-gray-200">{$lang == 'en' ? "How much is an hour worth?" : "כמה שווה שעה?"}</td>
          {#each bmiData as data, i}
            <td class="px-6 py-4 border-r border-gray-200 last:border-r-0">
              {#if data.attributes.perhour > 0}
                <span class="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                  <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                  ₪{data.attributes.perhour}
                </span>
              {/if}
            </td>
          {/each}
        </tr>

        <!-- Total Value Row -->
        <tr class="hover:bg-gray-50 transition-colors duration-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <td class="px-6 py-4 font-bold text-gray-800 bg-gradient-to-r from-green-200 to-emerald-200 border-r border-gray-200">{$lang == 'en' ? "Total Value for Task" : "שווי סך הכל למשימה"}</td>
          {#each bmiData as data, i}
            <td class="px-6 py-4 border-r border-gray-200 last:border-r-0">
              {#if data.attributes.perhour > 0 && data.attributes.hoursassinged > 0}
                <span class="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg font-bold text-lg">
                  <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  ₪{data.attributes.perhour * data.attributes.hoursassinged}
                </span>
              {:else}
                <span class="text-gray-400 font-medium">₪0</span>
              {/if}
            </td>
          {/each}
        </tr>

        <!-- Progress Row -->
        <tr class="hover:bg-gray-50 transition-colors duration-200" id="total">
          <td class="px-6 py-4 font-semibold text-gray-700 bg-gradient-to-r from-purple-100 to-pink-100 border-r border-gray-200">{$lang == 'en' ? "Already Completed" : "כבר בוצעו"}</td>
          {#each bmiData as data, i}
            <td class="px-6 py-4 border-r border-gray-200 last:border-r-0" dir="ltr">
              <div class="flex flex-col items-center space-y-2">
                <span class="text-sm font-medium text-gray-600">
                  {`${data.attributes.howmanyhoursalready ? Math.round((data.attributes.howmanyhoursalready + Number.EPSILON) * 100) / 100 : 0} / ${data.attributes.hoursassinged}`}
                </span>
                {#if data.attributes.hoursassinged > 0}
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300" 
                         style="width: {Math.min(((data.attributes.howmanyhoursalready || 0) / data.attributes.hoursassinged) * 100, 100)}%"></div>
                  </div>
                  <span class="text-xs text-gray-500">
                    {Math.round(Math.min(((data.attributes.howmanyhoursalready || 0) / data.attributes.hoursassinged) * 100, 100))}%
                  </span>
                {/if}
              </div>
            </td>
          {/each}
        </tr>

        <!-- User Row -->
        <tr class="hover:bg-gray-50 transition-colors duration-200">
          <td class="px-6 py-4 font-semibold text-gray-700 bg-gradient-to-r from-purple-100 to-pink-100 border-r border-gray-200">{$lang == 'en' ? "Performed by" : "מבוצע על ידי"}</td>
          {#each bmiData as data, i}
            <td class="px-6 py-4 border-r border-gray-200 last:border-r-0">
              <a rel="noreferrer" target="_blank" href="/user/{data.attributes.users_permissions_user.data.id}"
                 class="inline-flex items-center px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors duration-200 font-medium">
                <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                {data.attributes.users_permissions_user.data.attributes.username}
              </a>
            </td>
          {/each}
        </tr>

        <!-- Actions Row -->
        <tr class="bg-gradient-to-r from-purple-600 to-pink-600 sticky bottom-0 z-10">
          <td class="px-6 py-4 font-bold text-white text-lg border-r border-purple-300">{$lang == 'en' ? "Options" : "אפשרויות"}</td>
          {#each bmiData as data, i}
            <td class="px-6 py-4 border-r border-purple-300 last:border-r-0">
              <div class="flex justify-center space-x-2">
                <button
                  class="bg-white hover:bg-gray-100 text-purple-600 p-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
                  title={$lang == 'en' ? "Edit" : "עריכה"}
                  onclick={() => edit(data.id)}
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z" />
                  </svg>
                </button>
              </div>
            </td>
          {/each}
        </tr>
      </tbody>
    </table>
  </div>
</div>
