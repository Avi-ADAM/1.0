<script>
    import Calendar from '@event-calendar/core';
    import TimeGrid from '@event-calendar/time-grid';
    import Interaction from '@event-calendar/interaction'
    import { lang } from '$lib/stores/lang.js';
      import { addToast } from 'as-toast';
    import '@event-calendar/core/index.css';
    let ec;
    let count = 0;
    let eve = [
    {id:1,start: '2022-08-21 11:00:00',end: '2022-08-21 14:00:00', title: "baruch"},
    {id:3,start: '2022-08-21 14:00:00',end: '2022-08-21 18:00:00', title: "bar",backgroundColor:"var(--barbi-pink)"},
    {id:4,start: '2022-08-21 14:00:00',end: '2022-08-21 18:00:00', title: "yoav",backgroundColor:"rgb(189 52 201)"},
    {id:5,start: '2022-08-22 11:00:00',end: '2022-08-22 14:00:00', title: "dor"},
    {id:6,start: '2022-08-22 14:00:00',end: '2022-08-22 18:00:00', title: "alon",backgroundColor:"var(--barbi-pink)"},
    {id:7,start: '2022-08-22 14:00:00',end: '2022-08-22 18:00:00', title: "bar",backgroundColor:"rgb(189 52 201)"},
    {id:8,start: '2022-08-23 11:00:00',end: '2022-08-23 14:00:00', title: "baruch"},
    {id:9,start: '2022-08-23 14:00:00',end: '2022-08-23 18:00:00', title: "yoav",backgroundColor:"var(--barbi-pink)"},
    {id:10,start: '2022-08-24 11:00:00',end: '2022-08-24 14:00:00', title: "baruch"},
    {id:11,start: '2022-08-24 14:00:00',end: '2022-08-24 18:00:00', title: "bar",backgroundColor:"var(--barbi-pink)"},
    {id:12,start: '2022-08-25 12:00:00',end: '2022-08-25 14:00:00', title: "yoav"},
    {id:13,start: '2022-08-25 11:00:00',end: '2022-08-25 18:00:00', title: "dor",backgroundColor:"var(--barbi-pink)"},
         {id:2,start: "2022-08-26T11:00:00",end: "2022-08-26T14:00:00", title: "alon"}
       // your list of events
        ]
    let plugins = [TimeGrid,Interaction];
    let options = {
        nowIndicator: true,
        locale: $lang,
        dateClick:  function (dateClickInfo) {
            //a. ani batvach, b. lo yazarti po  event cvar, c. ein po cvar yoter miday iventim
            console.log(dateClickInfo);
            if(count <= 4 ){
                if(dateClickInfo.dayEl.children[1].childNodes.length == 2){
                        count ++

                    console.log(dateClickInfo);
        let newDateObj = new Date(dateClickInfo.date. getTime() + 180*60000);
                ec.addEvent( {id:1,start: dateClickInfo.dateStr,end: newDateObj, title: "tohar",startEditable: true,durationEditable:true, editable: true, color: "#017fbd", backgroundColor:"var(--mpink)"} )
        eve = eve
            }
        }
     },
        view: 'timeGridWeek',
        slotMaxTime: "18:00:00",
        editable: true,
        slotMinTime:"11:00:00",
        flexibleSlotTimeLimits: true,
        events: eve,
        nowIndicator: true,
        eventClick: function (eventClickInfo) { 
            //a. choose: in the tvach, not havig my max shift, noon alse has choosed, b.edit my shift , cencel , change hours 
            console.log(eventClickInfo);
               addToast(` ${eventClickInfo.event.title} המשמרת כבר נבחרה על ידי`, 'info',5000);
        },
        eventStartEditable: true
    };
    console.log(options)
</script>
<h1>בפיתוח נמרץ בקרוב ניתן יהיה לראות ולסדר משמרות כאן</h1>
<Calendar bind:this={ec} {plugins} {options} />
<style>
   
</style>