<script>
  import { sendToSer } from '$lib/send/sendToSer.js';
    import TimersCalendar from '$lib/components/timers/TimersCalendar.svelte';
    import {onMount} from 'svelte'
    import { lang } from '$lib/stores/lang.js';
  let { data } = $props();
    // קריאה לשרת לקבלת הנתונים
    let timersData = $state(null);
    let userId = data.uid;
    let isLoading = $state(true);
    
    // טען את הנתונים מהשרת
    async function loadTimers() {
      isLoading = true;
      // הקריאה שלך ל-GraphQL
      timersData = await sendToSer( { id: userId },'37getUserTimers',userId,null,false,fetch);
      isLoading = false;
    }
    
    onMount(loadTimers);
    const loadingText = {
      he: 'טוען נתונים...',
      en: 'Loading data...'
    };
  </script>
  
  {#if isLoading}
    <div class="flex justify-center items-center p-8">
        <p class="text-lg">{loadingText[$lang]}</p>
    </div>
  {:else if timersData?.data?.usersPermissionsUser}
    {#key  timersData}
        <TimersCalendar timersData={timersData?.data} {userId} />
    {/key}
  {:else}
    <div class="flex justify-center items-center p-8">
        <p class="text-lg">{$lang == 'en' ? 'No timers found' : 'לא נמצאו טיימרים'}</p>
    </div>
  {/if}
