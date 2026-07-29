<script>
  import Arrow from "$lib/celim/icons/arrow.svelte";
  import { format } from 'date-fns';
 import moment from 'moment';
   import SveltyPicker from 'svelty-picker';

 // import Dateandtimeinput from './dateandtimeinput.svelte';
  /**
   * @typedef {Object} Props
   * @property {any} start
   * @property {any} finnish
   * @property {any} [startplaceholder]
   * @property {any} [finnishplaceholder]
   * @property {string} [dir]
   * @property {() => void} [onEdit]
   * @property {() => void} [onEditStop]
   */

  /** @type {Props} */
  let {
    start = $bindable(),
    finnish = $bindable(),
    startplaceholder = '',
    finnishplaceholder = '',
    dir = "rtl",
    onEdit,
    onEditStop
  } = $props();
  let startDate = new Date();
  let dateFormat = 'HH:mm MM/dd/yy';
  let showstart = $state(false);
  let showend = $state(false) 
  const toggleDatePicker = () => (showstart = !showstart);
  const toggleDatePickerend = () => (showend = !showend);

  const formatDate = (dateString) => {
    let momentx = moment(dateString, "HH:mm DD/MM/YYYY ")
    return momentx && format(new Date(momentx), dateFormat) || '';
  };
  $effect(() => {
    showstart || showend ? onEdit?.() : onEditStop?.()
  });
 
</script>
<div class="flex flex-{showstart || showend ? "col border border-gold p-2 rounded space-y-2" : "row"} sm:flex-row align-middle justify-center space-x-2 sm:text-2xl font-bold items-center  " {dir}>
    <button onclick={toggleDatePicker}>{startplaceholder}:</button>
  {#if showstart}
<!---<Dateandtimeinput bind:outpot={start}/>-->
<span dir="rtl">
 <SveltyPicker
      placeholder={startplaceholder}
      inputClasses="form-control text-right"
      format=" hh:ii dd/mm/yyyy"
      bind:value={start}
    ></SveltyPicker>
    </span>
  <button onclick={toggleDatePicker}>✅</button>  
{:else}
  <button onclick={toggleDatePicker}>{start != undefined ? formatDate(start) : "--"}</button>
  {/if}
<Arrow back={dir == "ltr"}/>
    <button onclick={toggleDatePickerend}>{finnishplaceholder}:</button>
{#if showend}
<span dir="rtl">
 <SveltyPicker
      placeholder={finnishplaceholder}
      inputClasses="form-control text-right"
      format=" hh:ii dd/mm/yyyy"
      bind:value={finnish}
      startDate={start}
    ></SveltyPicker>
    </span>
    <!----
<Dateandtimeinput bind:outpot={finnish} minDate={start}/>-->
  <button onclick={toggleDatePickerend}>✅</button>

  {:else}

  <button onclick={toggleDatePickerend}>{finnish != undefined ? formatDate(finnish) : " -- "}</button>
  {/if}

</div>
