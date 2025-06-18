<!-- @migration-task Error while migrating Svelte code: `a` has already been declared
https://svelte.dev/e/declaration_duplicate -->
<script context="module">
   import moment from 'moment'

   export function montsi (moy,beg,end,fromIOs){
  if(moy == "monthly" || moy ==  "yearly"){
    let mo = moy == "monthly" ? "months" : "years"
    if(fromIOs == true){
            var a = moment(end, "YYYY-MM-DD HH:mm:ss");
            var b = moment(beg, "YYYY-MM-DD HH:mm:ss");
    }else{
            var a = moment(end, "HH:mm DD/MM/YYYY ");
            var b = moment(beg, "HH:mm DD/MM/YYYY ");
    }
            if(moy == "monthly"){
              console.log("i am in my palss",beg,end,a,b,a.diff(b, 'months', true).toFixed(2))
            return a.diff(b, 'months', true).toFixed(2)
            }else{
            return a.diff(b, 'years', true).toFixed(2)
            }
  }else{
    return 1
  }
          }
          </script>