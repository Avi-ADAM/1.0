<script lang="ts">
 import Calendar from "$lib/components/ui/calendar/calendar.svelte";
 import * as Popover from "$lib/components/ui/popover/index.js";
 import { Button } from "$lib/components/ui/button/index.js";

 import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
 import { getLocalTimeZone, CalendarDate } from "@internationalized/date";
  import { format, parse } from 'date-fns';
 import type { DateValue } from "@internationalized/date";
  import SveltyPicker from 'svelty-picker';

 import { lang } from "$lib/stores/lang.js";
 const id = $props.id();
 let { outpot = $bindable<string | undefined>(), minDate } = $props<{
    outpot?: string | undefined;
    minDate?: CalendarDate;
 }>();
 let open = $state(false);
const outputFormat = 'HH:mm dd/MM/yy';
   
 function parseValue(value: string | undefined) {
    if (!value) return undefined;
    try {
        const parsedDate = parse(value, outputFormat, new Date());
        return {
            date: new CalendarDate(parsedDate.getFullYear(), parsedDate.getMonth() + 1, parsedDate.getDate()),
            time: format(parsedDate, 'HH:mm')
        };
    } catch (e) {
        return undefined;
    }
 }

 function combineAndFormat(date: DateValue | undefined, time: string): string | undefined {
    if (!date) return undefined;
    const [h, m] = time.split(':').map(Number);
    const dateObj = date.toDate(getLocalTimeZone());
    dateObj.setHours(h, m);
    return format(dateObj, outputFormat);
 }

 let value: DateValue | undefined = $state(parseValue(outpot)?.date);
 let time: string = $state(parseValue(outpot)?.time ?? '00:00');
 $effect(() => {
    outpot = combineAndFormat(value, time);
    console.log(outpot, value, time)
 });
 const dateLabel = {
    he: "תאריך",
    en: "Date"
 };
 const timeLabel = {
    he: "שעה",
    en: "Time"
 };
 const select = {
    he: "בחירת תאריך",
    en: "Select"
 }
</script>
 
<div class="flex gap-4">
 <div class="flex flex-col gap-3">
  <Popover.Root bind:open>
   <Popover.Trigger id="{id}-date">
    {#snippet child({ props })}
     <Button
      {...props}
      variant="outline"
      class="w-32 justify-between font-normal bg-gold"
     >
      {value
       ? value.toDate(getLocalTimeZone()).toLocaleDateString()
       : select[$lang]}
      <ChevronDownIcon />
     </Button>
    {/snippet}
   </Popover.Trigger>
   <Popover.Content class="w-auto overflow-hidden p-0" align="start">
    <Calendar
     type="single"
     bind:value
     onValueChange={() => {
      open = false;
     }}
     class="rounded-md border shadow-sm bg-slate-700 text-gold "
     captionLayout="dropdown"
     isDateUnavailable={
       (date =>
         minDate instanceof CalendarDate && date instanceof CalendarDate
           ? date.compare(minDate) < 0
           : false
       )
     }
    />
   </Popover.Content>
  </Popover.Root>
 </div>
 <div class="flex flex-col gap-3" dir="rtl">
  <SveltyPicker
                    inputClasses="form-control"
                    format="hh:ii"
                    bind:value={time}
                  ></SveltyPicker>
 </div>
</div>
