<script>
  import { sendToSer } from '$lib/send/sendToSer.svelte';
    import TimersCalendar from '$lib/components/timers/TimersCalendar.svelte';
    import {onMount} from 'svelte'
    export let data
    // קריאה לשרת לקבלת הנתונים
    let timersData = null;
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