<script context="module">
   import moment from 'moment'

   export function montsi (moy,beg,end){
  if(moy == "monthly" || moy ==  "yearly"){
    let mo = moy == "monthly" ? "months" : "years"
            var a = moment(end, "HH:mm DD/MM/YYYY ");
            var b = moment(beg, "HH:mm DD/MM/YYYY ");
            if(moy == "monthly"){
            return a.diff(b, 'months', true).toFixed(2)
            }else{
            return a.diff(b, 'years', true).toFixed(2)
            }
  }else{
    return 1
  }
          }
          </script>