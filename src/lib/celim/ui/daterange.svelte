<script>
  import SveltyPicker from 'svelty-picker'
  import Arrow from "$lib/celim/icons/arrow.svelte";
  import {lang} from '$lib/stores/lang.js'
  export let start, finnish, startplaceholder = {"he":"תאריך התחלה","en":"start Date"}, finnishplaceholder = {"he":"תאריך סיום","en":"finnish Date"}, dir="rtl"
  import { format } from 'date-fns';
 import moment from 'moment';

  let startDate = new Date();
  let dateFormat = 'HH:mm MM/dd/yy';
  let showstart = false;
  let showend = false 
  const toggleDatePicker = () => (showstart = !showstart);
  const toggleDatePickerend = () => (showend = !showend);

  const formatDate = (dateString) => {
    let momentx = moment(dateString, "HH:mm DD/MM/YYYY ")
    return momentx && format(new Date(momentx), dateFormat) || '';
  };

 
</script>
<div class="flex flex-row align-middle justify-center sm:text-2xl font-bold items-center " {dir}>
    <button on:click={toggleDatePicker}>{startplaceholder[$lang]}:</button>
  {#if showstart}
<SveltyPicker pickerOnly={true}  inputClasses="form-control" format="hh:ii dd/mm/yyyy" bind:value={start}></SveltyPicker>
  <button on:click={toggleDatePicker}>✅</button>  
{:else}
  <button on:click={toggleDatePicker}>{start != undefined ? formatDate(start) : "--"}</button>
  {/if}
<Arrow/>
    <button on:click={toggleDatePickerend}>{finnishplaceholder[$lang]}:</button>
{#if showend}
<SveltyPicker pickerOnly={true}  inputClasses="form-control" format="hh:ii dd/mm/yyyy" bind:value={finnish}></SveltyPicker>
  <button on:click={toggleDatePickerend}>✅</button>

  {:else}

  <button on:click={toggleDatePickerend}>{finnish != undefined ? formatDate(finnish) : " -- "}</button>
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