<script>
  import tr from '$lib/translations/tr.json';
  import Close from '$lib/celim/close.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { onMount } from 'svelte';

  /**
   * @typedef {Object} Act
   * @property {string} id
   * @property {Object} attributes
   * @property {string} attributes.shem - Act name
   * @property {string} [attributes.link] - Act link
   * @property {string} [attributes.des] - Act description
   * @property {string} [attributes.dateF] - End date
   * @property {string} [attributes.dateS] - Start date
   */

  /**
   * @typedef {Object} Props
   * @property {Object} acts - Original acts object with data property containing Act array
   * @property {Act[]} [actsb] - Negotiated acts array (bindable)
   * @property {any} [old] - Previous negotiations
   * @property {any} lebel - Label for the component
   * @property {number} [stepState] - Step state (2 = original and edit, 3 = original second and edit)
   */

  /** @type {Props} */
  let {
    acts = { data: [] },
    actsb = $bindable([]),
    old = [],
    lebel = { he: 'מטלות', en: 'Tasks' },
    stepState = 2
  } = $props();

  let edit = $state(false);
  let show2 = $state(false);
  let editingIndex = $state(-1);
  let newAct = $state({
    shem: '',
    link: '',
    des: '',
    dateF: '',
    dateS: ''
  });

  onMount(() => {
    const actsArray = acts?.data && Array.isArray(acts.data) ? acts.data : [];
    if (actsb.length === 0 && actsArray.length > 0) {
      actsb = [...actsArray];
    }
  });

  function addAct() {
    if (newAct.shem.trim()) {
      const act = {
        id: `temp_${Date.now()}`,
        attributes: {
          shem: newAct.shem,
          link: newAct.link || null,
          des: newAct.des || null,
          dateF: newAct.dateF || null,
          dateS: newAct.dateS || null
        }
      };
      actsb = [...actsb, act];
      resetNewAct();
    }
  }

  function removeAct(index) {
    actsb = actsb.filter((_, i) => i !== index);
  }

  function editAct(index) {
    editingIndex = index;
    const act = actsb[index];
    newAct = {
      shem: act.attributes.shem || '',
      link: act.attributes.link || '',
      des: act.attributes.des || '',
      dateF: act.attributes.dateF || '',
      dateS: act.attributes.dateS || ''
    };
  }

  function saveEdit() {
    if (editingIndex >= 0 && newAct.shem.trim()) {
      actsb[editingIndex] = {
        ...actsb[editingIndex],
        attributes: {
          ...actsb[editingIndex].attributes,
          shem: newAct.shem,
          link: newAct.link || null,
          des: newAct.des || null,
          dateF: newAct.dateF || null,
          dateS: newAct.dateS || null
        }
      };
      actsb = [...actsb]; // Trigger reactivity
      cancelEdit();
    }
  }

  function cancelEdit() {
    editingIndex = -1;
    resetNewAct();
  }

  function resetNewAct() {
    newAct = {
      shem: '',
      link: '',
      des: '',
      dateF: '',
      dateS: ''
    };
  }

  function hasChanges() {
    const actsArray = acts?.data && Array.isArray(acts.data) ? acts.data : [];
    const actsbArray = Array.isArray(actsb) ? actsb : [];

    if (actsArray.length !== actsbArray.length) return true;

    return actsArray.some((originalAct, index) => {
      const negotiatedAct = actsbArray[index];
      if (!negotiatedAct) return true;

      const orig = originalAct.attributes;
      const nego = negotiatedAct.attributes;

      return (
        orig.shem !== nego.shem ||
        orig.link !== nego.link ||
        orig.des !== nego.des ||
        orig.dateF !== nego.dateF ||
        orig.dateS !== nego.dateS
      );
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  }

  function getTaskStatus(task) {
    const actsArray = acts?.data && Array.isArray(acts.data) ? acts.data : [];

    // Check if it's a new task (temp ID)
    if (task.id && task.id.startsWith('temp_')) {
      return 'new';
    }

    // Check if it's an existing task that was modified
    const originalTask = actsArray.find((act) => act.id === task.id);
    if (originalTask) {
      const orig = originalTask.attributes;
      const curr = task.attributes;

      if (
        orig.shem !== curr.shem ||
        orig.link !== curr.link ||
        orig.des !== curr.des ||
        orig.dateF !== curr.dateF ||
        orig.dateS !== curr.dateS
      ) {
        return 'modified';
      }
      return 'unchanged';
    }

    return 'unchanged';
  }

  function getTaskStatusClasses(status) {
    switch (status) {
      case 'new':
        return 'border-green-500 bg-green-50 border-2';
      case 'modified':
        return 'border-yellow-500 bg-yellow-50 border-2';
      case 'unchanged':
      default:
        return 'border-mturk border-opacity-50';
    }
  }

  function getRemovedTasks() {
    const actsArray = acts?.data && Array.isArray(acts.data) ? acts.data : [];
    const actsbArray = Array.isArray(actsb) ? actsb : [];

    return actsArray.filter(
      (originalTask) =>
        !actsbArray.some((currentTask) => currentTask.id === originalTask.id)
    );
  }
</script>

<div
  class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2"
>
  {#if !edit}
    <div class="flex flex-col gap-2">
      <div class="flex flex-row align-middle justify-center gap-x-2">
        <h2 class="underline decoration-mturk">{lebel[$lang]}:</h2>
      </div>

      {#if hasChanges()}
        <div class="text-xs opacity-70 text-center">
          <span class="inline-flex items-center gap-1 mx-1">
            <span class="w-3 h-3 bg-green-500 rounded"></span>
            {$lang === 'he' ? 'חדש' : 'New'}
          </span>
          <span class="inline-flex items-center gap-1 mx-1">
            <span class="w-3 h-3 bg-yellow-500 rounded"></span>
            {$lang === 'he' ? 'שונה' : 'Modified'}
          </span>
          <span class="inline-flex items-center gap-1 mx-1">
            <span class="w-3 h-3 bg-red-500 rounded"></span>
            {$lang === 'he' ? 'הוסר' : 'Removed'}
          </span>
        </div>
      {/if}

      <div class="flex-1">
        {#if actsb.length === 0}
          <p class="text-gold italic">
            {$lang === 'he' ? 'אין מטלות' : 'No tasks'}
          </p>
        {:else}
          <div class="space-y-2">
            {#each actsb as act, index}
              {@const status = getTaskStatus(act)}
              <div class="rounded p-2 text-sm {getTaskStatusClasses(status)}">
                <div class="font-semibold text-gold flex items-center gap-2">
                  {act.attributes.shem}
                  {#if status === 'new'}
                    <span
                      class="text-xs bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1"
                    >
                      ✨ {$lang === 'he' ? 'חדש' : 'New'}
                    </span>
                  {:else if status === 'modified'}
                    <span
                      class="text-xs bg-yellow-600 text-white px-2 py-1 rounded flex items-center gap-1"
                    >
                      ✏️ {$lang === 'he' ? 'שונה' : 'Modified'}
                    </span>
                  {/if}
                </div>
                {#if act.attributes.des}
                  <div class="text-xs opacity-80">{act.attributes.des}</div>
                {/if}
                {#if act.attributes.link}
                  <div class="text-xs text-blue-400">
                    🔗 {act.attributes.link}
                  </div>
                {/if}
                {#if act.attributes.dateS || act.attributes.dateF}
                  <div class="text-xs opacity-70">
                    📅 {formatDate(act.attributes.dateS)} - {formatDate(
                      act.attributes.dateF
                    )}
                  </div>
                {/if}
              </div>
            {/each}

            <!-- Show removed tasks -->
            {#each getRemovedTasks() as removedTask}
              <div
                class="rounded p-2 text-sm border-2 border-red-500 bg-red-50 opacity-60"
              >
                <div
                  class="font-semibold text-red-600 flex items-center gap-2 line-through"
                >
                  {removedTask.attributes.shem}
                  <span
                    class="text-xs bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1"
                  >
                    🗑️ {$lang === 'he' ? 'הוסר' : 'Removed'}
                  </span>
                </div>
                {#if removedTask.attributes.des}
                  <div class="text-xs opacity-60 line-through">
                    {removedTask.attributes.des}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <button onclick={() => (edit = true)}>
        {#if hasChanges()}✏️{:else}🖍️{/if}
      </button>

      {#if hasChanges() && !show2}
        <button onclick={() => (show2 = true)}>📑</button>
      {:else if show2}
        <div class="flex flex-col align-middle justify-center">
          <button onclick={() => (show2 = false)}><Close /></button>

          <div class="space-y-2 text-sm">
            <div>
              <small class:text-right={$lang === 'he'}
                >{tr?.nego?.original[$lang]}:</small
              >
              <div class="space-y-1">
                {#each acts?.data && Array.isArray(acts.data) ? acts.data : [] as act}
                  <div
                    class="border border-opacity-30 border-gray-400 rounded p-1"
                  >
                    <div class="font-medium">{act.attributes.shem}</div>
                    {#if act.attributes.des}<div class="text-xs opacity-70">
                        {act.attributes.des}
                      </div>{/if}
                  </div>
                {/each}
              </div>
            </div>

            <div>
              <small class:text-right={$lang === 'he'} class="text-gold"
                >{tr?.nego?.sugestion[$lang]}:</small
              >
              <div class="space-y-1">
                {#each actsb as act}
                  <div class="border border-opacity-30 border-gold rounded p-1">
                    <div class="font-medium text-gold">
                      {act.attributes.shem}
                    </div>
                    {#if act.attributes.des}<div
                        class="text-xs opacity-70 text-gold"
                      >
                        {act.attributes.des}
                      </div>{/if}
                  </div>
                {/each}
              </div>
            </div>

            {#each old as o, i}
              <div>
                <small class:text-right={$lang === 'he'} class="text-gold"
                  >{tr?.nego?.oldno[$lang]}:{i + 1}</small
                >
                <div class="text-gold text-xs">{JSON.stringify(o)}</div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="space-y-4 p-4">
      <h3 class="text-lg font-semibold">
        {$lang === 'he' ? 'עריכת מטלות' : 'Edit Tasks'}
      </h3>

      <!-- Existing acts list -->
      <div class="space-y-2">
        {#each actsb as act, index}
          {@const status = getTaskStatus(act)}
          <div
            class="rounded p-3 flex justify-between items-start {getTaskStatusClasses(
              status
            )}"
          >
            <div class="flex-1">
              <div class="font-medium flex items-center gap-2">
                {act.attributes.shem}
                {#if status === 'new'}
                  <span
                    class="text-xs bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1"
                  >
                    ✨ {$lang === 'he' ? 'חדש' : 'New'}
                  </span>
                {:else if status === 'modified'}
                  <span
                    class="text-xs bg-yellow-600 text-white px-2 py-1 rounded flex items-center gap-1"
                  >
                    ✏️ {$lang === 'he' ? 'שונה' : 'Modified'}
                  </span>
                {/if}
              </div>
              {#if act.attributes.des}<div class="text-sm opacity-70">
                  {act.attributes.des}
                </div>{/if}
              {#if act.attributes.link}<div class="text-sm text-blue-400">
                  🔗 {act.attributes.link}
                </div>{/if}
            </div>
            <div class="flex gap-2">
              <button
                onclick={() => editAct(index)}
                class="text-blue-400 hover:text-blue-600">✏️</button
              >
              <button
                onclick={() => removeAct(index)}
                class="text-red-400 hover:text-red-600">🗑️</button
              >
            </div>
          </div>
        {/each}
      </div>

      <!-- Add/Edit form -->
      <div class="border border-gold border-opacity-50 rounded p-4 space-y-3">
        <h4 class="font-medium">
          {editingIndex >= 0
            ? $lang === 'he'
              ? 'עריכת מטלה'
              : 'Edit Task'
            : $lang === 'he'
              ? 'הוספת מטלה חדשה'
              : 'Add New Task'}
        </h4>

        <div class="textinput">
          <input
            id="act-shem"
            type="text"
            bind:value={newAct.shem}
            class="input"
            required
            placeholder={$lang === 'he' ? 'שם המטלה' : 'Task name'}
          />
          <label for="act-shem" class="label"
            >{$lang === 'he' ? 'שם המטלה' : 'Task Name'}</label
          >
          <span class="line"></span>
        </div>

        <div class="textinput">
          <input
            id="act-des"
            type="text"
            bind:value={newAct.des}
            class="input"
            placeholder={$lang === 'he' ? 'תיאור המטלה' : 'Task description'}
          />
          <label for="act-des" class="label"
            >{$lang === 'he' ? 'תיאור' : 'Description'}</label
          >
          <span class="line"></span>
        </div>

        <div class="textinput">
          <input
            id="act-link"
            type="url"
            bind:value={newAct.link}
            class="input"
            placeholder={$lang === 'he' ? 'קישור למטלה' : 'Task link'}
          />
          <label for="act-link" class="label"
            >{$lang === 'he' ? 'קישור' : 'Link'}</label
          >
          <span class="line"></span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="textinput">
            <input
              id="act-dateS"
              type="datetime-local"
              bind:value={newAct.dateS}
              class="input"
            />
            <label for="act-dateS" class="label"
              >{$lang === 'he'
                ? 'תאריך ושעת התחלה'
                : 'Start Date & Time'}</label
            >
            <span class="line"></span>
          </div>

          <div class="textinput">
            <input
              id="act-dateF"
              type="datetime-local"
              bind:value={newAct.dateF}
              class="input"
            />
            <label for="act-dateF" class="label"
              >{$lang === 'he' ? 'תאריך ושעת סיום' : 'End Date & Time'}</label
            >
            <span class="line"></span>
          </div>
        </div>

        <div class="flex gap-2">
          {#if editingIndex >= 0}
            <button
              onclick={saveEdit}
              class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {$lang === 'he' ? 'שמור' : 'Save'}
            </button>
            <button
              onclick={cancelEdit}
              class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              {$lang === 'he' ? 'ביטול' : 'Cancel'}
            </button>
          {:else}
            <button
              onclick={addAct}
              class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {$lang === 'he' ? 'הוסף מטלה' : 'Add Task'}
            </button>
          {/if}
        </div>
      </div>

      <div class="flex justify-end">
        <button
          onclick={() => {
            edit = false;
            cancelEdit();
          }}
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          ✅ {$lang === 'he' ? 'סיום' : 'Done'}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .textinput {
    position: relative;
    width: 100%;
    display: block;
  }

  .input {
    border: none;
    margin: 0;
    padding: 10px 0;
    outline: none;
    border-bottom: solid 1px var(--mturk);
    font-size: 15px;
    margin-top: 12px;
    width: 100%;
    color: var(--barbi-pink);
    -webkit-tap-highlight-color: transparent;
    background: transparent;
  }

  .label {
    font-size: 15px;
    position: absolute;
    right: 0;
    top: 22px;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
    pointer-events: none;
    color: var(--mturk);
    user-select: none;
  }

  .line {
    height: 2px;
    background-color: #2196f3;
    position: absolute;
    transform: translateX(-50%);
    left: 50%;
    bottom: 0;
    width: 0;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  }

  .input:focus ~ .line,
  .input:valid ~ .line {
    width: 100%;
  }

  .input:focus ~ .label,
  .input:valid ~ .label {
    font-size: 11px;
    color: var(--barbi-pink);
    top: 0;
  }
</style>
