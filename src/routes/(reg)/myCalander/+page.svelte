<script>
  import { sendToSer } from '$lib/send/sendToSer.js';
    import TimersCalendar from '$lib/components/timers/TimersCalendar.svelte';
    import {onMount} from 'svelte'
  let { data } = $props();
    // קריאה לשרת לקבלת הנתונים
    let timersData = $state(null);
    let userId = data.uid;
    
    // טען את הנתונים מהשרת
    async function loadTimers() {
      // הקריאה שלך ל-GraphQL
      timersData = await sendToSer( { id: userId },'37getUserTimers',userId,null,false,fetch);
    }
    
    onMount(loadTimers);
  </script>
  {#key  timersData}
  <TimersCalendar timersData={timersData?.data} {userId} />
  {/key}
