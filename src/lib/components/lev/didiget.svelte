<script>
    export let low = false;
    import {lang}from '$lib/stores/lang.js'
    import Lowbtn from '$lib/celim/lowbtn.svelte'
    const ishur = {"he": "אישור קבלת", "en":"approve of reciving"}
    const me = {"he": "מאת", "en": "from"}
    //how to recive? discution or build in payments to add 
    </script>
    <h1>{ishur[$lang]}</h1>