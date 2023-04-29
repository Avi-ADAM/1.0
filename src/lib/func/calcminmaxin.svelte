<script context="module">
    export function calcMinMaxIn (myinvest, minIn, maxIn ,totalInvest){
     let min = minIn * ((totalInvest /  myinvest) * 100)
     let max = maxIn * ((totalInvest /  myinvest) * 100)
      return [min,max]
    }
</script>