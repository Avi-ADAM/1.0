<script>
  import { run } from 'svelte/legacy';

  import SveltyPicker from 'svelty-picker'
  import Arrow from "$lib/celim/icons/arrow.svelte";
  import {lang} from '$lib/stores/lang.js'
  import { format } from 'date-fns';
 import moment from 'moment';
  import { createEventDispatcher } from 'svelte';
  /**
   * @typedef {Object} Props
   * @property {any} start
   * @property {any} finnish
   * @property {any} [startplaceholder]
   * @property {any} [finnishplaceholder]
   * @property {string} [dir]
   */

  /** @type {Props} */
  let {
    start = $bindable(),
    finnish = $bindable(),
    startplaceholder = {"he":"תאריך התחלה","en":"start Date"},
    finnishplaceholder = {"he":"תאריך סיום","en":"finnish Date"},
    dir = "rtl"
  } = $props();
  const dispatch = createEventDispatcher();
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
  run(() => {
    showstart || showend ? dispatch('edit') : dispatch('editStop')
  });
 
</script>
<div class="flex flex-{showstart || showend ? "col border border-gold p-2 rounded space-y-2" : "row"} sm:flex-row align-middle justify-center space-x-2 sm:text-2xl font-bold items-center  " {dir}>
    <button onclick={toggleDatePicker}>{startplaceholder[$lang]}:</button>
  {#if showstart}
<SveltyPicker pickerOnly={true}  inputClasses="form-control" format="hh:ii dd/mm/yyyy" bind:value={start}></SveltyPicker>
  <button onclick={toggleDatePicker}>✅</button>  
{:else}
  <button onclick={toggleDatePicker}>{start != undefined ? formatDate(start) : "--"}</button>
  {/if}
<Arrow back={dir == "ltr"}/>
    <button onclick={toggleDatePickerend}>{finnishplaceholder[$lang]}:</button>
{#if showend}
<SveltyPicker pickerOnly={true}  inputClasses="form-control" format="hh:ii dd/mm/yyyy" bind:value={finnish}></SveltyPicker>
  <button onclick={toggleDatePickerend}>✅</button>

  {:else}

  <button onclick={toggleDatePickerend}>{finnish != undefined ? formatDate(finnish) : " -- "}</button>
  {/if}
<!---
<label  for="a">{startplaceholder}</label>
<input type="datetime-local" id="a" name="a" bind:value={start} class="z-[99999]">
<Arrow/>
<label for="b">{finnishplaceholder}</label>
<input name="b" type="datetime-local"  bind:value={finnish}>


<DatePicker bind:isOpen bind:startDate showTimePicker>
  <input type="text" placeholder="Select date" bind:value={formattedStartDate} on:click={toggleDatePicker} />
</DatePicker>
-->

</div>
<style>
  input[type="text"] {
    border: 1px solid #e8e9ea;
    border-radius: 4px;
    padding: 8px;
  }
</style>