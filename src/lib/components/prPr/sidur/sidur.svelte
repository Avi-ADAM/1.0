<script>
    import Calendar from '@event-calendar/core';
    import TimeGrid from '@event-calendar/time-grid';
    import { lang } from '$lib/stores/lang.js';
   
    let plugins = [TimeGrid];
    let options = {
        locale: $lang,
        dateClick:  function (dateClickInfo) {
        console.log(dateClickInfo);
     },
        view: 'timeGridWeek',
        slotMaxTime: "17:00:00",
        slotMinTime:"11:00:00",
        flexibleSlotTimeLimits: true,
        events: [
            // your list of events
        ]
    };

</script>
<h1>בפיתוח נמרץ בקרוב ניתן יהיה לראות ולסדר משמרות כאן</h1>
<Calendar {plugins} {options} />
<style>
   
</style>