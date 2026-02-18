<script>
    import ProjectTimersCalendar from '$lib/components/prPr/ProjectTimersCalendar.svelte';
    import { projectTimersStore, fetchProjectTimers, getProjectTimers } from '$lib/stores/projectTimers.js';
    import { onMount } from 'svelte';
    
    let { onMission, onTasks, projectId } = $props();
    
    // Derived state from store
    let timersData = $derived(getProjectTimers($projectTimersStore, projectId));
    let isLoading = $derived($projectTimersStore[projectId]?.loading ?? true);
    console.log(timersData)
    function handleTimerClick(event) {
      // טיפול בלחיצה על טיימר בלוח
      console.log('נלחץ טיימר:', event);
    }
    
    function handleTaskDetails(event) {
      console.log('נלחץ nahnv:', event);
      onMission?.({id:event.id,kind:'betha'})
    }
    
    function handleActsDetails(event) {
      // ניווט לפרטי מטלות
      console.log('פרטי מטלות:', event.acts);
      onTasks?.()
    }
    
    onMount(() => {
      // Only fetch if we don't have data
      const projectData = $projectTimersStore[projectId];
      const hasData = projectData?.data?.timers;
      
      if (!hasData) {
        console.log('[TimersOfUsers] Fetching timers for project:', projectId);
        fetchProjectTimers(projectId, fetch);
      } else {
        console.log('[TimersOfUsers] Using cached timers for project:', projectId);
      }
    });
  </script>
  {#key timersData}
  <ProjectTimersCalendar 
    {projectId}
    {isLoading}
    {timersData}
    onTimerClick={handleTimerClick}
    onShowTaskDetails={handleTaskDetails}
    onShowActsDetails={handleActsDetails}
  />
  {/key}
