<script>
  import { isRtl, t } from '$lib/translations';
  import { onMount } from 'svelte';
  import { Calendar } from '@fullcalendar/core';
  import dayGridPlugin from '@fullcalendar/daygrid';
  import timeGridPlugin from '@fullcalendar/timegrid';
  import interactionPlugin from '@fullcalendar/interaction';
  import { lang } from '$lib/stores/lang';
  
  
  let calendarEl = $state();
  let calendar = $state();
  /**
   * @typedef {Object} Props
   * @property {any} projectId
   * @property {any} [timersData]
   * @property {boolean} [isLoading]
   * @property {(payload: { timerId: any; timerData: any; mesimabetahalich: any; }) => void} [onTimerClick]
   * @property {(payload: any) => void} [onShowTaskDetails]
   * @property {(payload: any) => void} [onShowActsDetails]
   */

  /** @type {Props} */
  let { projectId, timersData = null, isLoading = $bindable(true), onTimerClick, onShowTaskDetails, onShowActsDetails } = $props();
  let expandedTimer = $state(null);
  let tooltipEl = null;
  let showTimerModal = $state(false);
  let selectedTimerData = $state(null);
  console.log(timersData)
  // טקסטים בשפות שונות  
  
  // פונקציה להמרת ISO string לאובייקט Date
  function parseISODate(isoString) {
    return new Date(isoString);
  }
  
  // פונקציה ליצירת אירועי לוח מהנתונים
  function createCalendarEvents(timers) {
    const events = [];
    
    timers.forEach(timer => {
      const timerData = timer.attributes;
      const mesimabetahalich = { ...timerData.mesimabetahalich?.data?.attributes, id: timerData.mesimabetahalich?.data?.id };
      
      // יצירת אירוע עבור כל start-stop בטיימר
      timerData.timers?.forEach((timeEntry, index) => {
        if (timeEntry.start && timeEntry.stop) {
          const startDate = parseISODate(timeEntry.start);
          const endDate = parseISODate(timeEntry.stop);
          
          events.push({
            id: `${timer.id}-${index}`,
            title: mesimabetahalich?.name || $t('project.timersCalendar.noTaskName'),
            start: startDate,
            end: endDate,
            backgroundColor: timerData.isActive ? '#10b981' : (timerData.saved ? '#3b82f6' : '#f59e0b'),
            borderColor: timerData.isActive ? '#059669' : (timerData.saved ? '#2563eb' : '#d97706'),
            extendedProps: {
              timerId: timer.id,
              timerData: timerData,
              mesimabetahalich: mesimabetahalich,
              timeEntry: timeEntry,
              index: index
            }
          });
        }
      });
      
      // אם יש טיימר פעיל (רק start ללא stop)
      if (timerData.isActive && timerData.start) {
        const startDate = parseISODate(timerData.start);
        const now = new Date();
        
        events.push({
          id: `${timer.id}-active`,
          title: `🔴 ${mesimabetahalich?.name || $t('project.timersCalendar.noTaskName')} - ${$t('project.timersCalendar.active')}`,
          start: startDate,
          end: now,
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          extendedProps: {
            timerId: timer.id,
            timerData: timerData,
            mesimabetahalich: mesimabetahalich,
            isActive: true
          }
        });
      }
    });
    
    return events;
  }
  
  // פונקציה לאתחול הלוח
  function initializeCalendar() {
    if (!timersData?.timers?.data) {
      isLoading = false;
      return;
    }
    
    const timers = timersData.timers.data;
    const events = createCalendarEvents(timers);
    console.log(events)
    if (!calendarEl) return;
      
    calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'timeGridWeek',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      locale: $lang,
      direction: $isRtl ? 'rtl' : 'ltr',
      height: 'auto',
      events: events,
      eventClick: handleEventClick,
      eventMouseEnter: handleEventHover,
      eventMouseLeave: hideTooltip,
      slotMinTime: '06:00:00',
      slotMaxTime: '24:00:00',
      allDaySlot: false,
      nowIndicator: true,
      eventDisplay: 'block',
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }
    });
    
    calendar.render();
    isLoading = false;
  }
  
  function handleEventClick(info) {
    const event = info.event;
    const props = event.extendedProps;
    
    // הצגת חלון מודאל עם פרטי הטיימר
    selectedTimerData = {
      timerId: props.timerId,
      timerData: props.timerData,
      mesimabetahalich: props.mesimabetahalich
    };
    showTimerModal = true;
    
    // שליחת אירוע למרכיב ההורה עם פרטי הטיימר
    onTimerClick?.(selectedTimerData);
  }
  
  function handleEventHover(info) {
    const props = info.event.extendedProps;
    showTooltip(info.el, props);
  }
  
  // The tooltip is built as raw HTML, and the note is text a member typed —
  // escape everything that comes from the data before it goes in.
  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showTooltip(element, props) {
    const mesima = props.mesimabetahalich;
    const timer = props.timerData;

    if (tooltipEl) {
      document.body.removeChild(tooltipEl);
    }

    tooltipEl = document.createElement('div');
    tooltipEl.className = 'calendar-tooltip';
    tooltipEl.innerHTML = `
      <div class="tooltip-content">
        <div><strong>${$t('project.timersCalendar.task')}:</strong> ${esc(mesima?.name || $t('project.timersCalendar.noTaskName'))}</div>
        <div><strong>${$t('project.timersCalendar.assignedHours')}:</strong> ${esc(mesima?.hoursassinged || 0)}</div>
        <div><strong>${$t('project.timersCalendar.completedHours')}:</strong> ${esc(mesima?.howmanyhoursalready || 0)}</div>
        <div><strong>${$t('project.timersCalendar.status')}:</strong> ${timer.isActive ? $t('project.timersCalendar.active') : (timer.saved ? $t('project.timersCalendar.saved') : $t('project.timersCalendar.notSaved'))}</div>
        <div><strong>${$t('project.timersCalendar.totalTimerHours')}:</strong> ${esc(timer.totalHours || 0)}</div>
        ${timer.saveText ? `<div><strong>${$t('project.timersCalendar.workNote')}:</strong> ${esc(timer.saveText)}</div>` : ''}
      </div>
    `;

    document.body.appendChild(tooltipEl);
    
    const rect = element.getBoundingClientRect();
    tooltipEl.style.position = 'fixed';
    tooltipEl.style.left = rect.left + 'px';
    tooltipEl.style.top = (rect.top - tooltipEl.offsetHeight - 10) + 'px';
    tooltipEl.style.zIndex = '9999';
  }
  
  function hideTooltip() {
    if (tooltipEl) {
      document.body.removeChild(tooltipEl);
      tooltipEl = null;
    }
  }
  
  function closeModal() {
    showTimerModal = false;
    selectedTimerData = null;
  }
  
  function toggleTimerExpansion(timerId) {
    expandedTimer = expandedTimer === timerId ? null : timerId;
  }
  
  function handleTaskDetails(taskData) {
    console.log('נלחץ nahnv:', taskData);
    onShowTaskDetails?.(taskData);
  }
  
  function handleActsDetails(acts) {
    console.log('פרטי מטלות:', acts);
    onShowActsDetails?.(acts);
  }
  
  onMount(() => {
    if (timersData) {
      initializeCalendar();
    }
    
    return () => {
      if (tooltipEl) {
        document.body.removeChild(tooltipEl);
      }
    };
  });
  
  // עדכון הלוח כאשר הנתונים או השפה משתנים
  $effect(() => {
    if (timersData && calendar) {
      const timers = timersData.timers.data;
      const events = createCalendarEvents(timers);
      calendar.setOption('events', events);
      calendar.setOption('locale', $lang);
      calendar.setOption('direction', $isRtl ? 'rtl' : 'ltr');
    }
  });
</script>

<!-- הקומפוננטה עם הנתונים -->
<div class="project-timers-calendar bg-white rounded-lg shadow-lg pt-4 px-1 sm:p-6" dir={$isRtl ? 'rtl' : 'ltr'}>
  <div class="flex justify-between items-center mb-6" dir={$isRtl ? 'rtl' : 'ltr'}>
    <h2 class="text-2xl font-bold text-gray-800">{$t('project.timersCalendar.projectTimers')}</h2>
    <div class="flex gap-4 text-sm">
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-red-500 rounded"></div>
        <span>{$t('project.timersCalendar.active')}</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-blue-500 rounded"></div>
        <span>{$t('project.timersCalendar.saved')}</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-green-500 rounded"></div>
        <span>{$t('project.timersCalendar.completed')}</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-yellow-500 rounded"></div>
        <span>{$t('project.timersCalendar.notSaved')}</span>
      </div>
    </div>
  </div>
  
  {#if !timersData?.timers?.data?.length}
   {#if isLoading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
   {:else}
    <div class="text-center py-12 text-gray-500">
      <p class="text-lg">{$t('project.timersCalendar.noTimers')}</p>
    </div>
    {/if}
  {:else}
    <!-- לוח הזמנים -->
    <div bind:this={calendarEl} class="calendar-container"></div>
    
    <!-- רשימת טיימרים מפורטת -->
    <div class="mt-8">
      <h3 class="text-xl font-semibold mb-4">{$t('project.timersCalendar.detailedTimersList')}</h3>
      <div class="space-y-4">
        {#each timersData.timers.data as timer}
          {@const timerData = timer.attributes}
          {@const mesimabetahalich = timerData.mesimabetahalich?.data ? { ...timerData.mesimabetahalich.data.attributes, id: timerData.mesimabetahalich.data.id } : {}}
          
          <div class="border rounded-lg p-4 bg-gray-50 transition-all duration-200 
              {expandedTimer === timer.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''}">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h4 class="font-semibold text-lg">
                    {mesimabetahalich?.name || $t('project.timersCalendar.noTaskName')}
                  </h4>
                  <span class="px-2 py-1 rounded text-xs font-medium
                    {timerData.isActive ? 'bg-red-100 text-red-800' : 
                     timerData.saved ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}">
                    {timerData.isActive ? $t('project.timersCalendar.active') : timerData.saved ? $t('project.timersCalendar.saved') : $t('project.timersCalendar.notSaved')}
                  </span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span class="font-medium">{$t('project.timersCalendar.totalHours')}:</span>
                    {timerData.totalHours || 0}
                  </div>
                  <div>
                    <span class="font-medium">{$t('project.timersCalendar.assignedHours')}:</span>
                    {mesimabetahalich?.hoursassinged || 0}
                  </div>
                  <div>
                    <span class="font-medium">{$t('project.timersCalendar.completedHours')}:</span>
                    {mesimabetahalich?.howmanyhoursalready || 0}
                  </div>
                </div>
                
                {#if timerData.saveText}
                  <div class="mt-3">
                    <span class="font-medium text-sm">{$t('project.timersCalendar.workNote')}:</span>
                    <p class="mt-1 text-sm text-gray-700 whitespace-pre-line">{timerData.saveText}</p>
                  </div>
                {/if}

                {#if timerData.acts?.data?.length > 0}
                  <div class="mt-3">
                    <span class="font-medium text-sm">{$t('project.timersCalendar.tasksInProgress')}:</span>
                    <div class="flex flex-wrap gap-2 mt-1">
                      {#each timerData.acts.data as act}
                        <span class="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">
                          {act.attributes.shem}
                        </span>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
              
              <div class="flex flex-col gap-2">
                <button
                  class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  onclick={() => handleTaskDetails(mesimabetahalich)}
                >
                  {$t('project.timersCalendar.taskDetails')}
                </button>
                
                {#if timerData.acts?.data?.length > 0}
                  <button
                    class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    onclick={() => handleActsDetails(timerData.acts.data)}
                  >
                    {$t('project.timersCalendar.taskDetailsTitle')}
                  </button>
                {/if}
                
                <button
                  class="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                  onclick={() => toggleTimerExpansion(timer.id)}
                >
                  {expandedTimer === timer.id ? $t('project.timersCalendar.hide') : $t('project.timersCalendar.expand')}
                </button>
              </div>
            </div>
            
            {#if expandedTimer === timer.id && timerData.timers?.length > 0}
              <div class="mt-4 pt-4 border-t">
                <h5 class="font-medium mb-3">{$t('project.timersCalendar.timeDetails')}:</h5>
                <div class="space-y-2">
                  {#each timerData.timers as timeEntry, index}
                    <div class="flex justify-between items-center bg-white p-3 rounded border">
                      <div class="flex gap-4">
                        <span class="text-sm">
                          <strong>{$t('project.timersCalendar.start')}:</strong> 
                          {timeEntry.start ? new Date(timeEntry.start).toLocaleString($lang) : $t('project.timersCalendar.notAvailable')}
                        </span>
                        <span class="text-sm">
                          <strong>{$t('project.timersCalendar.end')}:</strong> 
                          {timeEntry.stop ? new Date(timeEntry.stop).toLocaleString($lang) : $t('project.timersCalendar.stillActive')}
                        </span>
                      </div>
                      {#if timeEntry.start && timeEntry.stop}
                        <span class="text-sm text-gray-600">
                          {$t('project.timersCalendar.duration')}: {Math.round((new Date(timeEntry.stop) - new Date(timeEntry.start)) / (1000 * 60))} {$t('project.timersCalendar.minutes')}
                        </span>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- מודאל פרטי טיימר -->
{#if showTimerModal && selectedTimerData}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onkeypress={(e) => e.key === 'Escape' && closeModal()} onclick={closeModal}>
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onclick={(e) => e.stopPropagation()} dir={$isRtl ? 'rtl' : 'ltr'} >
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-semibold">
          {selectedTimerData.mesimabetahalich?.name || $t('project.timersCalendar.noTaskName')}
        </h3>
        <button 
          class="text-gray-500 hover:text-gray-700 text-xl"
          onclick={closeModal}
        >
          ×
        </button>
      </div>
      
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div class="bg-gray-50 p-3 rounded">
            <span class="font-medium">{$t('project.timersCalendar.totalHours')}:</span>
            <div class="text-lg font-bold">{selectedTimerData.timerData.totalHours || 0}</div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <span class="font-medium">{$t('project.timersCalendar.assignedHours')}:</span>
            <div class="text-lg font-bold">{selectedTimerData.mesimabetahalich?.hoursassinged || 0}</div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <span class="font-medium">{$t('project.timersCalendar.completedHours')}:</span>
            <div class="text-lg font-bold">{selectedTimerData.mesimabetahalich?.howmanyhoursalready || 0}</div>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <span class="font-medium">{$t('project.timersCalendar.status')}:</span>
          <span class="px-2 py-1 rounded text-xs font-medium
            {selectedTimerData.timerData.isActive ? 'bg-red-100 text-red-800' : 
             selectedTimerData.timerData.saved ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}">
            {selectedTimerData.timerData.isActive ? $t('project.timersCalendar.active') : 
             selectedTimerData.timerData.saved ? $t('project.timersCalendar.saved') : $t('project.timersCalendar.notSaved')}
          </span>
        </div>
        
        {#if selectedTimerData.timerData.saveText}
          <div>
            <span class="font-medium">{$t('project.timersCalendar.workNote')}:</span>
            <p class="mt-1 text-sm text-gray-700 whitespace-pre-line">{selectedTimerData.timerData.saveText}</p>
          </div>
        {/if}

        {#if selectedTimerData.timerData.acts?.data?.length > 0}
          <div>
            <span class="font-medium">{$t('project.timersCalendar.tasksInProgress')}:</span>
            <div class="flex flex-wrap gap-2 mt-2">
              {#each selectedTimerData.timerData.acts.data as act}
                <span class="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-sm">
                  {act.attributes.shem}
                </span>
              {/each}
            </div>
          </div>
        {/if}
        
        {#if selectedTimerData.timerData.timers?.length > 0}
          <div>
            <h4 class="font-medium mb-3">{$t('project.timersCalendar.timeDetails')}:</h4>
            <div class="space-y-2 max-h-60 overflow-y-auto">
              {#each selectedTimerData.timerData.timers as timeEntry, index}
                <div class="flex justify-between items-center bg-gray-50 p-3 rounded border">
                  <div class="flex gap-4">
                    <span class="text-sm">
                      <strong>{$t('project.timersCalendar.start')}:</strong> 
                      {timeEntry.start ? new Date(timeEntry.start).toLocaleString($lang) : $t('project.timersCalendar.notAvailable')}
                    </span>
                    <span class="text-sm">
                      <strong>{$t('project.timersCalendar.end')}:</strong> 
                      {timeEntry.stop ? new Date(timeEntry.stop).toLocaleString($lang) : $t('project.timersCalendar.stillActive')}
                    </span>
                  </div>
                  {#if timeEntry.start && timeEntry.stop}
                    <span class="text-sm text-gray-600">
                      {$t('project.timersCalendar.duration')}: {Math.round((new Date(timeEntry.stop) - new Date(timeEntry.start)) / (1000 * 60))} {$t('project.timersCalendar.minutes')}
                    </span>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
        
        <div class="flex justify-end gap-2 pt-4 border-t">
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            onclick={() => handleTaskDetails(selectedTimerData.mesimabetahalich)}
          >
            {$t('project.timersCalendar.taskDetails')}
          </button>
          <button
            class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            onclick={closeModal}
          >
            {$t('project.timersCalendar.close')}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .calendar-container :global(.ec) {
    direction: inherit;
  }
  
  .calendar-container :global(.ec-toolbar) {
    margin-bottom: 1rem;
  }
  
  .calendar-container :global(.ec-event) {
    font-size: 0.75rem;
    padding: 2px 4px;
    cursor: pointer;
  }
  
  .project-timers-calendar {
    direction: inherit;
  }
  
  :global(.calendar-tooltip) {
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    max-width: 250px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  :global(.calendar-tooltip .tooltip-content) {
    line-height: 1.4;
  }
  
  :global(.calendar-tooltip .tooltip-content div) {
    margin-bottom: 4px;
  }
  
  :global(.calendar-tooltip .tooltip-content div:last-child) {
    margin-bottom: 0;
  }
</style>
