<script>
    import ProjectTimersCalendar from '$lib/components/prPr/ProjectTimersCalendar.svelte';
  import { sendToSer } from '$lib/send/sendToSer.js';
    import { onMount } from 'svelte';
    let { onMission, onTasks, projectId } = $props();
    let timersData = $state(null);
    let isLoading = $state(true);
    async function loadProjectTimers() {
      timersData = await sendToSer({ id: projectId },'38getProjectTimers',null,null,false,fetch );
        isLoading = false;
    }
    
    function handleTimerClick(event) {
      // טיפול בלחיצה על טיימר בלוח
      console.log('נלחץ טיימר:', event);
    }
    
    function handleTaskDetails(event) {
              console.log('נלחץ nahnv:', event);
              onMission?.({id:event.mesimabetahalich.id,kind:'betha'})
      // ניווט לפרטי משימה
      //goto(`/tasks/${event.mesimabetahalich.id}`);
    }
    
    function handleActsDetails(event) {
      // ניווט לפרטי מטלות
      console.log('פרטי מטלות:', event.acts);
      onTasks?.()
    }
    
    onMount(() => {
      loadProjectTimers();
    });
  </script>
  {#key timersData}
  <ProjectTimersCalendar 
    {projectId}
    {isLoading}
    timersData={timersData?.data}
    onTimerClick={handleTimerClick}
    onShowTaskDetails={handleTaskDetails}
    onShowActsDetails={handleActsDetails}
  />
  {/key}
