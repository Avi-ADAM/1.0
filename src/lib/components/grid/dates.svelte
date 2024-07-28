<script>
    export let value;
    let dateStr;
    let local = "en-GB";
  
    $:dateStr = value ? (new Date(value)).toLocaleDateString(local) : "-";
    export let value2;
    let dateStr2;
  
    $:dateStr2 = value ? (new Date(value2)).toLocaleDateString(local) : "-";
  </script>
  
  <div class="text-barbi">{dateStr ? dateStr : "-"} - {dateStr2 ? dateStr2 : "-"}</div>