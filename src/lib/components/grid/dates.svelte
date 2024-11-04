<script>
	import { lang } from './../../stores/lang.js';
    let dateStr = $derived(value ? (new Date(value)).toLocaleDateString(local) : "-");
    let local = $lang == "en" ?"en-GB" : "he";
  
  /** @type {{value: any, value2: any}} */
  let { value, value2 } = $props();
    let dateStr2 = $derived(value2 ? (new Date(value2)).toLocaleDateString(local) : "-");
  
      
    
</script>
  
  <div dir="ltr" class="text-barbi">{dateStr ? dateStr : "-"} - {dateStr2 ? dateStr2 : "-"}</div>