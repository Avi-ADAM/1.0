<script>
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { fly, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { lang } from '$lib/stores/lang';
  import { createEventDispatcher } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { formatTime } from '$lib/func/uti/formatTime';
  import { handleClearAll, handleClearSingle, updateTimer, saveTimer } from '$lib/func/timers.js';
  import { timers, updateTimers } from '$lib/stores/timers';

  const dispatch = createEventDispatcher();

  export let timer;
  export let showSaveDialog = false;
  export let showClearDialog = false;
  export let showSaveFinal = false;
  export let dialogEdit = true;
  export let elapsedTime = '00:00:00';
  export let selectedTasks = [];
  export let taskSearchTerm = '';

  // טקסטים לדיאלוגים
  const dialogHeader = {
    en: 'Save Timer',
    he: 'שמירת טיימר'
  };

  const dialogEditT = {
    en: 'Edit Timer',
    he: 'עריכת טיימר'
  };

  const innerDialogButton = {
    en: 'Save Timer',
    he: 'שמירת הטיימר'
  };

  const innerButtonT = {
    en: 'Task update',
    he: 'עדכון מטלות'
  };

  const clearButtonT = {
    he: 'עריכת זמנים',
    en: 'Edit Times'
  };

  $: innerText = {
    en: `Timer stopped at ${lastTimerDuration}. Would you like to save this time or clear it?`,
    he: `הטיימר נעצר לאחר ${lastTimerDuration}. האם ברצונך לשמור את הזמן או לנקות אותו?`
  };

  const innerTextT = {
    he: 'באפשרותך לעדכן אלו מטלות בביצוע כעת או לערוך את הזמנים של הטיימר',
    en: 'you can update the tasks you are currently working on or edit the timer times'
  };

  const clearButton = {
    en: 'Clear Timer',
    he: 'ניקוי הטיימר'
  };

  const clearDialogText = {
    title: {
      he: 'ניהול זמנים',
      en: 'Manage Times'
    },
    clearAll: {
      he: 'נקה הכל',
      en: 'Clear All'
    },
    noTimers: {
      he: 'אין זמנים לניהול',
      en: 'No times to manage'
    }
  };

  const choose = {
    en: 'Choose tasks',
    he: 'בחירת המטלות בהן עסקת'
  };

  const updateButton = {
    en: 'Update',
    he: 'עדכון'
  };

  const succsessText = {
    en: 'Timer updated successfully',
    he: 'הטיימר עודכן בהצלחה'
  };

  // פונקציות
  function closeDialog() {
    showSaveDialog = false;
    dialogEdit = true;
  }

  function handleClearTimer() {
    showSaveDialog = false;
    showClearDialog = true;
  }
  
  async function localClearAllTimers() {
    try {
      // Call the existing handleClearAll function for the current timer.
      // It should return the updated activeTimer data object.
      const updatedActiveTimerData = await handleClearAll(timer, fetch, false);
      // Check the response: if valid, update the store and dispatch event.
      if (updatedActiveTimerData) {
        console.log(updatedActiveTimerData);
        // Update the global store with the result from handleClearAll
        updateTimers($timers.map(t =>
          t.mId === timer.mId
            ? {
                ...t,
                running: false, // Timer is stopped after clearing
                attributes: {
                  ...t.attributes,
                  activeTimer: {
                    ...t.attributes.activeTimer,
                    data: updatedActiveTimerData, // Use the response from handleClearAll
                    isActive: false, // Timer is inactive
                  },
                  // Assuming handleClearAll resets totalHours in the returned data,
                  // otherwise, you might need to adjust howmanyhoursalready here too.
                }
              }
            : t
        ));

        // Dispatch event to parent
        dispatch('update-timer', {
          timer: updatedActiveTimerData, // Pass the updated active timer data
          running: false // Timer is not running
          // If handleClearAll also affects howmanyhoursalready, pass it:
          // hoursdon: updatedActiveTimerData.attributes.totalHours * 3600000 // Example if totalHours is reset
        });

        showClearDialog = false;
        const successMessage = {
          he: "ניקוי הטיימרים בוצע בהצלחה",
          en: "Timers cleared successfully"
        };
        toast.success(successMessage[$lang]);
      } else {
        const errorMessage = {
          he: "ניקוי הטיימרים נכשל",
          en: "Failed to clear timers"
        };
        toast.error(errorMessage[$lang]);
      }
    } catch (error) {
      console.error("Error clearing timers:", error);
      const errorMessage = {
          he: "ניקוי הטיימרים נכשל",
          en: "Failed to clear timers"
        };
        toast.error(errorMessage[$lang]);
    }
  }
  async function localHandleClearSingle(i, timer) {
    const originalTimer = JSON.parse(JSON.stringify(timer));
    const originalTimers = [...timer.attributes.activeTimer.data.attributes.timers];

    timer.attributes.activeTimer.data.attributes.timers = timer.attributes.activeTimer.data.attributes.timers.filter(
      (_, index) => index !== i
    );

    try {
      const x = await handleClearSingle(i, originalTimer, fetch, false);
      if (x) {
        dispatch('update-timer', {
          timer: x,
          running: false
        });
      }
    } catch (error) {
      console.error("Failed to delete timer:", error);
      timer.attributes.activeTimer.data.attributes.timers = originalTimers;
    }
  }

  async function handleUpdateTimer() {
    const selectedTaskIds = selectedTasks.map(taskId => parseInt(taskId, 10));
    await updateTimer(timer.attributes.activeTimer.data, 'tasks', {selectedTaskIds}, fetch, false).then((x) => {
      if (x) {
        dispatch('update-timer', {
          timer: x,
          running: false
        });
        
        showSaveFinal = false;
        showSaveDialog = false;
        dialogEdit = false;
        selectedTasks = timer?.attributes.activeTimer?.data?.attributes.acts.data.map(task => task.id) ?? [];
        taskSearchTerm = '';
        toast.success(`${succsessText[$lang]}`);
      }
    });
  }

  function handleSaveTimer() {
    showSaveDialog = false;
    dialogEdit = true;
    showSaveFinal = true;
  }

  async function handleSaveTimerFinal() {
    if (!timer?.attributes?.activeTimer?.data) {
      console.error('אין טיימר פעיל לשמור');
      return;
    }
    
    const tasksToSave = selectedTasks && selectedTasks.length > 0 ? selectedTasks : null;
    
    const result = await saveTimer(
      timer,
      timer.mId,
      fetch,
      false,
      tasksToSave
    );

    if (result) {
      console.log('טיימר נשמר בהצלחה', result);
      dispatch('update-timer', {
        timer: result.timer,
        running: false,
        hoursdon: result.mission.attributes.howmanyhoursalready
      });
      
      showSaveFinal = false;
      showSaveDialog = false;
      dialogEdit = false;
      
      const successMessage = {
        he: 'הטיימר נשמר בהצלחה',
        en: 'Timer saved successfully'
      };
      
      toast.success(successMessage[$lang]);
    } else {
      const errorMessage = {
        he: 'שגיאה בשמירת הטיימר',
        en: 'Error saving timer'
      };
      
      toast.error(errorMessage[$lang]);
    }
  }

  // Computed properties
  $: lastTimer = timer?.attributes?.activeTimer?.data?.attributes?.timers?.slice(-1)[0] || null;
  $: lastTimerDuration = lastTimer
    ? formatTime(
        lastTimer.stop
          ? new Date(lastTimer.stop) - new Date(lastTimer.start)
          : Date.now() - new Date(lastTimer.start),
        { lang: $lang }
      )
    : 'No timer available';
  $: filteredTasks = timer?.attributes?.acts?.data?.filter(task => 
    !task.attributes.naasa && 
    task.attributes.myIshur &&
    task.attributes.shem.toLowerCase().includes(taskSearchTerm.toLowerCase())
  ) || [];

  
// Add to your script section:
let editingTimer = null;

function handleStartEdit(index, timerEntry) {
  // Create a copy of the timer entry with editing fields
  timer.attributes.activeTimer.data.attributes.timers = timer.attributes.activeTimer.data.attributes.timers.map((t, i) => {
    if (i === index) {
      return {
        ...t,
        isEditing: true,
        editStart: toLocalDatetimeString(t.start), // Call the function directly
        editStop: t.stop ? toLocalDatetimeString(t.stop) : null // Call the function directly
      };
    }
    return t;
  });
}

async function handleSaveEdit(index, timerEntry) {
  const originalTimer = JSON.parse(JSON.stringify(timer));

  try {
    // Get the old lap (before edit)
    const oldLap = { 
      start: timer.attributes.activeTimer.data.attributes.timers[index].start, 
      stop: timer.attributes.activeTimer.data.attributes.timers[index].stop 
    };

    // Update the timer entry with new values
    const newLap = {
      start: new Date(timerEntry.editStart).toISOString(),
      stop: timerEntry.editStop ? new Date(timerEntry.editStop).toISOString() : null
    };

    timer.attributes.activeTimer.data.attributes.timers[index] = {
      ...timerEntry,
      ...newLap,
      isEditing: false
    };

    // API call to update the timer
    await updateTimer(
      timer.attributes.activeTimer.data, // Timer object
      'timers', // Specify what to update
      { oldLap, newLap, index }, // Pass oldLap, newLap, and index
      fetch // Fetch function
    );

    // Update the store with the modified timer
    updateTimers($timers.map(t => 
      t.mId === timer.mId ? timer : t
    ));
  } catch (error) {
    console.error('Failed to update timer:', error);
    // Rollback changes
    timer = originalTimer;
  }
}

function handleCancelEdit(index) {
  timer.attributes.activeTimer.data.attributes.timers[index].isEditing = false;
}

async function handleAddInterval() {
  const now = new Date();
  const newInterval = {
    start: now.toISOString(),
    stop: now.toISOString(),
    isEditing: true,
    editStart: now.toISOString().slice(0,16),
    editStop: now.toISOString().slice(0,16)
  };
  
  timer.attributes.activeTimer.data.attributes.timers.push(newInterval);
  
  // Update the store
  updateTimers(
    $timers.map((t) =>
      t.mId === timer.mId ? timer : t
    )
  );
}
function toLocalDatetimeString(date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
}
</script>

<!-- דיאלוג ניקוי -->
<DialogOverlay 
  style="z-index: 700;" 
  isOpen={showClearDialog} 
  onDismiss={() => showClearDialog = false}
>
  <div
    style="z-index: 700;"
    transition:fly|local={{ y: 450, opacity: 0.5, duration: 1000 }}
  >
    <DialogContent
      aria-label="clear-timer-options"
      class="timer-dialog"
    >
    <button 
    class="close-button"
    on:click={() => showClearDialog = false}
    aria-label="Close dialog"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  </button>
      <div class="dialog-content mt-4" dir={$lang == 'he' ? 'rtl' : 'ltr'}>
        <h2 class="dialog-title">{clearDialogText.title[$lang]}</h2>
        
        {#if timer?.attributes?.activeTimer?.data?.attributes?.timers?.length}
          <div class="timer-list d">
            {#each timer.attributes.activeTimer.data.attributes.timers as timerEntry, i (timerEntry.start)}
            <div class="timer-entry"
              transition:slide={{delay: 150, duration: 1000, easing: quintOut }}
            >
              <div class="timer-info">
                {#if timerEntry.isEditing}
                  <div class="edit-fields">
                    <input 
                    type="datetime-local" 
                    bind:value={timerEntry.editStart} 
                    class="datetime-input"
                  />
                  <!--TODO: add js code to prevent selecting before start -->
                  <input 
                  type="datetime-local" 
                  bind:value={timerEntry.editStop} 
                  class="datetime-input"
                  min={timerEntry.editStart}
                  disabled={!timerEntry.stop}
              />
                    <div class="edit-actions">
                      <button 
                        class="save-edit-btn"
                        on:click={() => handleSaveEdit(i, timerEntry)}
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20">
                          <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      </button>
                      <button 
                        class="cancel-edit-btn"
                        on:click={() => handleCancelEdit(i)}
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20">
                          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                {:else}
                  <span class="timer-time">
                    {new Date(timerEntry.start).toLocaleString($lang)} - 
                    {timerEntry.stop ? new Date(timerEntry.stop).toLocaleString() : 'Running'}
                  </span>
                  <span class="timer-duration">
                    {formatTime(timerEntry.stop ? 
                      new Date(timerEntry.stop) - new Date(timerEntry.start) : 
                      Date.now() - new Date(timerEntry.start),
                      { lang: $lang }
                    )}
                  </span>
                {/if}
              </div>
              <div class="timer-actions">
                {#if !timerEntry.isEditing}
                  <button 
                    class="edit-btn"
                    on:click={() => handleStartEdit(i, timerEntry)}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path 
                        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                        style="fill: blue; cursor: pointer; "
                        on:click={() => showSaveDialog = true}
                      />
                    </svg>
                  </button>
                  <button 
                    class="clear-single-btn"
                    on:click={() => localHandleClearSingle(i,timer)}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path 
                        fill="currentColor" 
                        d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"
                      />
                    </svg>
                  </button>
                {/if}
              </div>
            </div>
          {/each}
          
          {#if timer?.attributes?.activeTimer?.data?.attributes?.timers}
            <button 
              class="add-interval-btn"
              on:click={handleAddInterval}
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              {$lang === 'he' ? 'הוספת מרווח זמן' : 'Add Time Interval'}
            </button>
          {/if}
          </div>
          
          <button 
            class="clear-all-btn"
            on:click={() => localClearAllTimers()}
            aria-label="Clear all timers"
          >
            {clearDialogText.clearAll[$lang]}
          </button>
        {:else}
          <p class="no-timers">{clearDialogText.noTimers[$lang]}</p>
        {/if}
      </div>
    </DialogContent>
  </div>
</DialogOverlay>

<!-- דיאלוג שמירה -->
<DialogOverlay 
  style="z-index: 700;" 
  isOpen={showSaveDialog} 
  onDismiss={() => closeDialog()}
>
  <div
    style="z-index: 700;"
    transition:fly|local={{ y: 450, opacity: 0.5, duration: 1000 }}
  >
    <DialogContent
      aria-label="timer-options"
      class="timer-dialog"
    >
      <button 
        class="close-button"
        on:click={closeDialog}
        aria-label="Close dialog"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      <div class="dialog-content mt-4" dir={$lang == 'he' ? 'rtl' : 'ltr'}>
        <h2 class="dialog-title">{ dialogEdit == true ? dialogEditT[$lang] : dialogHeader[$lang] }</h2>
        <p class="dialog-message">
          {dialogEdit == true ? innerTextT[$lang] : innerText[$lang]}
        </p>
        <div class="dialog-buttons">
          <button
            class="save-btn"
            on:click={handleSaveTimer}
          >
            {dialogEdit == true ? innerButtonT[$lang] : innerDialogButton[$lang]}
          </button>
          <button
            class="clear-btn"
            on:click={handleClearTimer}
          >
            {dialogEdit == true ? clearButtonT[$lang] : clearButton[$lang]}
          </button>
        </div>
      </div>
    </DialogContent>
  </div>
</DialogOverlay>

<!-- דיאלוג שמירה סופי -->
<DialogOverlay 
  style="z-index: 700;" 
  isOpen={showSaveFinal}
  onDismiss={() => showSaveFinal = false}
>
  <div
    style="z-index: 700;"
    transition:fly={{ y: -100, duration: 500 }}
  >
    <DialogContent
      aria-label="timer-options" 
      class="timer-dialog"
    >
      <button 
        class="close-button"
        on:click={() => showSaveFinal = false}
        aria-label="Close dialog"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      <div class="dialog-content mt-4" dir={$lang == 'he' ? 'rtl' : 'ltr'}>
        <h2 class="dialog-title">{dialogHeader[$lang]}</h2>
        {#if filteredTasks.length}
          <h3>{choose[$lang]}</h3>
          <div class="task-selection">
            <input
              type="text"
              bind:value={taskSearchTerm}
              placeholder={$lang === 'he' ? 'חיפוש משימות...' : 'Search tasks...'}
              class="task-search"
            />
            
            <div class="task-list d">
              {#each filteredTasks as task}
                <label class="task-item">
                  <input
                    type="checkbox"
                    bind:group={selectedTasks}
                    value={task.id}
                  />
                  <span>{task.attributes.shem}</span>
                </label>
              {/each}
            </div>
          </div>
        {/if}
    
        {#if dialogEdit != true}
          <div class="time-summary">
            <p>{elapsedTime}</p>
          </div>
        {/if}
        <div class="dialog-buttons">
          <button
            class="px-4 py-2 rounded font-bold text-black bg-gradient-to-r from-green-400 to-blue-400 transform transition-transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            on:click={handleSaveTimerFinal}
            disabled={elapsedTime === '00:00:00' && dialogEdit != true}
          >
            {innerDialogButton[$lang]}
          </button>
          {#if filteredTasks.length > 0}
            <button
              class="px-4 py-2 rounded font-bold text-black bg-gradient-to-r from-yellow-400 to-orange-400 transform transition-transform hover:-translate-y-1"
              on:click={handleUpdateTimer}
            >
              {updateButton[$lang]}
            </button>
          {/if}
          <button
            class="px-4 py-2 rounded font-bold text-white bg-gradient-to-r from-pink-500 to-red-500 transform transition-transform hover:-translate-y-1"
            on:click={handleClearTimer}
          >
            {clearButton[$lang]}
          </button>
        </div>
      </div>
    </DialogContent>
  </div>
</DialogOverlay>

<style>
  :global(.svelte-dialog-overlay) {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 700;
  }

  :global([data-svelte-dialog-content].timer-dialog) {
    background: linear-gradient(147deg, #000000 0%, #04619f 74%);
    padding: 2rem;
    border-radius: 12px;
    color: #fff;
    width: 90vw;
    max-width: 500px;
    position: relative;
    margin: 2rem auto;
    min-width: 320px;
    z-index: 701;
  }

  .edit-fields {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.datetime-input {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 4px;
  color: #fff;
  padding: 0.25rem;
  font-size: 0.9rem;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.save-edit-btn,
.cancel-edit-btn {
  background: transparent;
  border: none;
  color: inherit;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.save-edit-btn {
  color: #00ff88;
}

.cancel-edit-btn {
  color: #ff3366;
}

.save-edit-btn:hover,
.cancel-edit-btn:hover {
  background: rgba(255,255,255,0.1);
}

.timer-actions {
  display: flex;
  gap: 0.5rem;
}

  .edit-btn {
  background: transparent;
  border: none;
  color: #00ffff;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: rgba(0,255,255,0.1);
  transform: scale(1.1);
}

.add-interval-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(45deg, #00ff88, #00bbff);
  border: none;
  border-radius: 6px;
  color: #000;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
  margin-top: 1rem;
}

.add-interval-btn:hover {
  transform: translateY(-2px);
}
  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    border: none;
    color: #fff;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-button:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: rotate(90deg);
  }

  .close-button svg {
    width: 20px;
    height: 20px;
  }

  .dialog-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .dialog-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #00ffff;
  }

  .dialog-message {
    font-size: 1.1rem;
    line-height: 1.5;
  }

  .dialog-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  .save-btn,
  .clear-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .save-btn {
    background: linear-gradient(45deg, #00ff88, #00bbff);
    color: #000;
  }

  .clear-btn {
    background: linear-gradient(45deg, #ff3366, #ff0066);
    color: #fff;
  }

  .save-btn:hover,
  .clear-btn:hover {
    transform: translateY(-2px);
  }

  .timer-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .timer-entry {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }

  .timer-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .timer-time {
    font-size: 0.9rem;
    color: #ccc;
  }

  .timer-duration {
    font-weight: bold;
    color: #00ffff;
  }

  .timer-actions {
    display: flex;
    gap: 0.5rem;
  }

  .clear-single-btn {
    background: transparent;
    border: none;
    color: #ff3366;
    padding: 0.5rem;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
  }

  .clear-single-btn:hover {
    background: rgba(255, 51, 102, 0.1);
    transform: scale(1.1);
  }

  .clear-all-btn {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(45deg, #ff3366, #ff0066);
    border: none;
    border-radius: 6px;
    color: #fff;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;
    margin-top: 1rem;
  }

  .clear-all-btn:hover {
    transform: translateY(-2px);
  }

  .task-selection {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .task-search {
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .task-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
  }

  .task-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    cursor: pointer;
  }

  .task-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
