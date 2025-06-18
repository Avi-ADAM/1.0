<script module>
    export function objToString (obj) {
    let str = '';
    for (let i = 0; i < obj.length; i++) {
        
     const length = Object.keys(obj[i]).length;
        let t = 0;
    for (const [p, val] of Object.entries(obj[i])) {
      const last = t === length - 1; 
      if (t == 0){
      str += "{"
    }
        t++;
        if (typeof(val) == "string") {
        str += `${p}:"${val}"\n`;
    } else if (typeof(val) == "number" || typeof(val) =="boolean") {
        str += `${p}:${val}\n`;
    } else if (typeof(val) == 'null'|| typeof(val) ==="object"){
      str += `${p}:${val?.data ? '"'+ val?.data?.id + '"': val}\n`;

    }else{
      str += `${p}:${val}\n`
    }
        if (last) {
          str += "},"
    }
    if (t == 0){
      str += "{"
    }
    }
  }
    return str;
}
</script>