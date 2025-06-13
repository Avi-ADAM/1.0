<script>
    import ProjectTimersCalendar from '$lib/components/prPr/ProjectTimersCalendar.svelte';
  import { sendToSer } from '$lib/send/sendToSer.svelte';
    import { onMount } from 'svelte';
    let timersData = null;
    let projectId = '1';
    
    // הקריאה שלך ל-GraphQL
    async function loadProjectTimers() {
      timersData = await sendToSer({ id: projectId },'38getProjectTimers',null,null,false,fetch );
    }
    
    function handleTimerClick(event) {
      // טיפול בלחיצה על טיימר בלוח
      console.log('נלחץ טיימר:', event.detail);
    }
    
    function handleTaskDetails(event) {
      // ניווט לפרטי משימה
      goto(`/tasks/${event.detail.mesimabetahalich.id}`);
    }
    
    function handleActsDetails(event) {
      // ניווט לפרטי מטלות
      console.log('פרטי מטלות:', event.detail.acts);
    }
    
    onMount(() => {
      loadProjectTimers();
    });
  </script>
  {#key timersData}
  <ProjectTimersCalendar 
    {projectId}
    timersData={timersData?.data}
    on:timerClick={handleTimerClick}
    on:showTaskDetails={handleTaskDetails}
    on:showActsDetails={handleActsDetails}
  />
  {/key}