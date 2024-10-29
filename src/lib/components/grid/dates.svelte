<script>
	import { lang } from './../../stores/lang.js';
    export let value;
    let dateStr;
    let local = $lang == "en" ?"en-GB" : "he";
  
    $:dateStr = value ? (new Date(value)).toLocaleDateString(local) : "-";
    export let value2;
    let dateStr2;
  
    $:dateStr2 = value2 ? (new Date(value2)).toLocaleDateString(local) : "-";
  </script>
  
  <div dir="ltr" class="text-barbi">{dateStr ? dateStr : "-"} - {dateStr2 ? dateStr2 : "-"}</div>