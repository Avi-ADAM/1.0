<script module>
   import moment from 'moment'

   export function montsi (moy,beg,end,fromIOs){
  if(moy == "monthly" || moy ==  "yearly"){
    let mo = moy == "monthly" ? "months" : "years"
    let a,b
    if(fromIOs == true){
             a = moment(end, "YYYY-MM-DD HH:mm:ss");
            b = moment(beg, "YYYY-MM-DD HH:mm:ss");
    }else{
            a = moment(end, "HH:mm DD/MM/YYYY ");
            b = moment(beg, "HH:mm DD/MM/YYYY ");
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