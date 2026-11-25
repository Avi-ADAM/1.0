<script>
    import { onMount } from 'svelte';
    import { Calendar } from '@fullcalendar/core';
    import dayGridPlugin from '@fullcalendar/daygrid';
    import timeGridPlugin from '@fullcalendar/timegrid';
    import interactionPlugin from '@fullcalendar/interaction';
    import { isRtl, t } from '$lib/translations';
    import { lang } from '$lib/stores/lang.js';

    function escHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
    
  /**
   * @typedef {Object} Props
   * @property {any} [timersData] - הנתונים שמגיעים מהשרת
   * @property {any} [userId] - מזהה המשתמש
   */

  /** @type {Props} */
  let { timersData = null, userId = null } = $props();
    
    let calendarElement = $state();
    let calendar = $state();
    let events = [];
    let selectedTimer = $state(null);
    let showTimerDetails = $state(false);
    
    // פונקציה להמרת נתוני הטיימרים לאירועים בלוח השנה
    function processTimersToEvents(timersData) {
      const processedEvents = [];
      
      if (!timersData?.usersPermissionsUser?.data?.attributes?.timers?.data) {
        return processedEvents;
      }
      
      const timers = timersData.usersPermissionsUser.data.attributes.timers.data;
      
      timers.forEach(timer => {
        const timerAttributes = timer.attributes;
        const taskName =
          timerAttributes.mesimabetahalich?.data?.attributes?.name || $t('timers.cal.unnamedMission');
        const projectName =
          timerAttributes.project?.data?.attributes?.projectName || $t('timers.cal.unnamedRikma');
        const profilePic = timerAttributes.project?.data?.attributes?.profilePic?.data?.attributes?.url;
        
        // עיבוד כל start/stop בטיימר
        if (timerAttributes.timers && timerAttributes.timers.length > 0) {
          timerAttributes.timers.forEach((timeEntry, index) => {
            if (timeEntry.start) {
              const startDate = new Date(timeEntry.start);
              const endDate = timeEntry.stop ? new Date(timeEntry.stop) : new Date();
              
              // חישוב משך הזמן
              const duration = (endDate - startDate) / (1000 * 60 * 60); // בשעות
              
              processedEvents.push({
                id: `${timer.id}-${index}`,
                title: `${taskName} - ${projectName}`,
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                backgroundColor: timerAttributes.saved ? '#10b981' : timerAttributes.isActive ? '#f59e0b' : '#6b7280',
                borderColor: timerAttributes.saved ? '#059669' : timerAttributes.isActive ? '#d97706' : '#4b5563',
                extendedProps: {
                  timerId: timer.id,
                  taskName,
                  projectName,
                  profilePic,
                  duration: duration.toFixed(2),
                  isActive: timerAttributes.isActive,
                  saved: timerAttributes.saved,
                  totalHours: timerAttributes.totalHours,
                  timeEntry: timeEntry,
                  hoursAssigned: timerAttributes.mesimabetahalich?.data?.attributes?.hoursassinged,
                  hoursAlready: timerAttributes.mesimabetahalich?.data?.attributes?.howmanyhoursalready
                }
              });
            }
          });
        }
      });
      
      return processedEvents;
    }
    
    // יצירת הלוח השנה
    function initializeCalendar() {
      if (!calendarElement) return;
      
      calendar = new Calendar(calendarElement, {
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
        eventMouseEnter: handleEventMouseEnter,
        eventMouseLeave: handleEventMouseLeave,
        slotMinTime: '00:00:00',
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
    }
    
    // טיפול בלחיצה על אירוע
    function handleEventClick(info) {
      selectedTimer = {
        ...info.event.extendedProps,
        eventTitle: info.event.title,
        startTime: info.event.start,
        endTime: info.event.end
      };
      showTimerDetails = true;
    }
    
    // טיפול במעבר עכבר על אירוע
    function handleEventMouseEnter(info) {
      const statusText = info.event.extendedProps.saved
        ? $t('timers.cal.statusSaved')
        : info.event.extendedProps.isActive
          ? $t('timers.cal.statusActive')
          : $t('timers.cal.statusNotSaved');
      const tooltip = document.createElement('div');
      tooltip.className = 'timer-tooltip';
      tooltip.dir = $isRtl ? 'rtl' : 'ltr';
      tooltip.innerHTML = `
        <div class="bg-gray-800 text-white p-2 rounded shadow-lg text-sm max-w-xs">
          <div class="font-semibold">${escHtml(info.event.extendedProps.taskName)}</div>
          <div class="text-gray-300">${escHtml(info.event.extendedProps.projectName)}</div>
          <div class="text-gray-300">${escHtml($t('timers.cal.tooltipDuration', { hours: info.event.extendedProps.duration }))}</div>
          <div class="text-gray-300">${escHtml($t('timers.cal.tooltipStatus', { status: statusText }))}</div>
        </div>
      `;
      document.body.appendChild(tooltip);
      
      info.el.addEventListener('mousemove', (e) => {
        tooltip.style.position = 'fixed';
        tooltip.style.left = e.clientX + 10 + 'px';
        tooltip.style.top = e.clientY + 10 + 'px';
        tooltip.style.zIndex = '1000';
      });
    }
    
    function handleEventMouseLeave(info) {
      const tooltips = document.querySelectorAll('.timer-tooltip');
      tooltips.forEach(tooltip => tooltip.remove());
    }
    
    $effect(() => {
      if (calendar) {
        calendar.setOption('locale', $lang);
        calendar.setOption('direction', $isRtl ? 'rtl' : 'ltr');
      }
      if (timersData && calendar) {
        const newEvents = processTimersToEvents(timersData);
        calendar.removeAllEvents();
        calendar.addEventSource(newEvents);
      }
    });
    
    function closeDetails() {
      showTimerDetails = false;
      selectedTimer = null;
    }
    
    function formatTime(date) {
      if (!date) return '';
      return new Date(date).toLocaleString($lang, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    onMount(() => {
      initializeCalendar();
      
      return () => {
        if (calendar) {
          calendar.destroy();
        }
      };
    });
  </script>
  
  <div dir={$isRtl ? 'rtl' : 'ltr'} class="timers-calendar-container w-full h-full mb-16">
    <div class="mb-6 bg-white rounded-lg shadow p-4">
      <h2 class="text-2xl font-bold text-gray-800 mb-4 text-center">{$t('timers.cal.title')}</h2>
      
      {#if timersData?.usersPermissionsUser?.data?.attributes?.timers?.data}
        {@const timers = timersData.usersPermissionsUser.data.attributes.timers.data}
        {@const totalTimers = timers.length}
        {@const activeTimers = timers.filter(timer => timer.attributes.isActive).length}
        {@const savedTimers = timers.filter(timer => timer.attributes.saved).length}
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div class="bg-blue-50 p-3 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{totalTimers}</div>
            <div class="text-sm text-gray-600">{$t('timers.cal.totalTimers')}</div>
          </div>
          <div class="bg-amber-50 p-3 rounded-lg">
            <div class="text-2xl font-bold text-amber-600">{activeTimers}</div>
            <div class="text-sm text-gray-600">{$t('timers.cal.activeNow')}</div>
          </div>
          <div class="bg-green-50 p-3 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{savedTimers}</div>
            <div class="text-sm text-gray-600">{$t('timers.cal.saved')}</div>
          </div>
          <div class="bg-gray-50 p-3 rounded-lg">
            <div class="text-2xl font-bold text-gray-600">{totalTimers - savedTimers}</div>
            <div class="text-sm text-gray-600">{$t('timers.cal.unsaved')}</div>
          </div>
        </div>
      {/if}
    </div>
    
    <div class="mb-4 bg-white rounded-lg shadow p-4 justify-center flex items-center">
      <div>
      <h3 class="text-lg font-semibold mb-3 text-center">{$t('timers.cal.legend')}</h3>
      <div class="flex flex-wrap gap-4 text-sm">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-green-500 rounded"></div>
          <span>{$t('timers.cal.statusSaved')}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-amber-500 rounded"></div>
          <span>{$t('timers.cal.statusActiveNow')}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-gray-500 rounded"></div>
          <span>{$t('timers.cal.statusNotSaved')}</span>
        </div>
      </div>
    </div>
    </div>
    
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div bind:this={calendarElement} class="p-4"></div>
    </div>
  </div>
  
  {#if showTimerDetails && selectedTimer}
    <div dir={$isRtl ? 'rtl' : 'ltr'} class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-xl font-bold text-gray-800">{$t('timers.cal.detailsTitle')}</h3>
            <button 
              onclick={closeDetails}
              aria-label={$t('timers.cal.close')}
              class="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          {#if selectedTimer.profilePic}
            <div class="mb-4 text-center">
              <img 
                src={selectedTimer.profilePic} 
                alt={$t('timers.cal.rikmaAlt')} 
                class="w-16 h-16 rounded-full mx-auto object-cover"
              />
            </div>
          {/if}
          
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="block text-sm font-medium text-gray-700 mb-1">{$t('timers.cal.missionLabel')}</div>
                <div class="text-lg font-semibold text-gray-900">{selectedTimer.taskName}</div>
              </div>
              <div>
                <div class="block text-sm font-medium text-gray-700 mb-1">{$t('timers.cal.rikmaLabel')}</div>
                <div class="text-lg font-semibold text-gray-900">{selectedTimer.projectName}</div>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="block text-sm font-medium text-gray-700 mb-1">{$t('timers.cal.startTimeLabel')}</div>
                <div class="text-gray-900">{formatTime(selectedTimer.startTime)}</div>
              </div>
              <div>
                <div class="block text-sm font-medium text-gray-700 mb-1">{$t('timers.cal.endTimeLabel')}</div>
                <div class="text-gray-900">{formatTime(selectedTimer.endTime)}</div>
              </div>
            </div>
            
            <div class="grid grid-cols-3 gap-4">
              <div>
                <div class="block text-sm font-medium text-gray-700 mb-1">{$t('timers.cal.durationHoursLabel')}</div>
                <div class="text-lg font-bold text-blue-600">{selectedTimer.duration}</div>
              </div>
              <div>
                <div class="block text-sm font-medium text-gray-700 mb-1">{$t('timers.cal.statusLabel')}</div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full {selectedTimer.saved ? 'bg-green-500' : selectedTimer.isActive ? 'bg-amber-500' : 'bg-gray-500'}"></div>
                  <span class="text-sm font-medium">
                    {selectedTimer.saved
                      ? $t('timers.cal.statusSaved')
                      : selectedTimer.isActive
                        ? $t('timers.cal.statusActive')
                        : $t('timers.cal.statusNotSaved')}
                  </span>
                </div>
              </div>
              <div>
                <div class="block text-sm font-medium text-gray-700 mb-1">{$t('timers.cal.totalHoursLabel')}</div>
                <div class="text-lg font-bold text-purple-600">{selectedTimer.totalHours || 0}</div>
              </div>
            </div>
            
            {#if selectedTimer.hoursAssigned || selectedTimer.hoursAlready}
              <div class="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div class="block text-sm font-medium text-gray-700 mb-1">{$t('timers.cal.assignedHoursLabel')}</div>
                  <div class="text-gray-900">{selectedTimer.hoursAssigned || 0}</div>
                </div>
                <div>
                  <div class="block text-sm font-medium text-gray-700 mb-1">{$t('timers.cal.completedHoursLabel')}</div>
                  <div class="text-gray-900">{selectedTimer.hoursAlready || 0}</div>
                </div>
              </div>
            {/if}
          </div>
          
          <div class="mt-6 text-center">
            <button 
              onclick={closeDetails}
              class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {$t('timers.cal.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
  
  <style>
    :global(.fc-direction-rtl) {
      direction: rtl; /* dir-ok: FullCalendar adds this class only in an RTL calendar */
    }
    
    :global(.fc-toolbar-title) {
      font-weight: bold;
      font-size: 1.5rem;
    }
    
    :global(.fc-event) {
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    :global(.fc-event-title) {
      padding: 2px 4px;
    }
    
    :global(.fc-timegrid-event) {
      border-radius: 4px;
    }
    
    :global(.fc-h-event) {
      border-radius: 4px;
    }
    
    .timer-tooltip {
      pointer-events: none;
    }
  </style>
