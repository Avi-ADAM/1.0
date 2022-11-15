<script>
    //לב במרכז נקי היהלומים מסביב עם מספר עליהם שיהיה גם אדום או משהו כזה כשדחוף 
    //לחיצה על היהלום מביאה בדיספאצ' למצב של מיון לפי נושא מסוים
    //על כל יהלום באותיות סבירות שם הקטגוריה\
    //לשאוף למינימום קטגוריות הצבעות החלטות משימות מטלות חלוקות בקשות-הצטרפויות הצעות
    //על הלב צורה של יהלומים מבולגנת שתביא למצב שכרגע הוא הרגיל, במצב הרגיל איזה סימון של סדר למצב הזה
    //שיבהקו בחשיכה

    import { createEventDispatcher } from 'svelte';
import Sv from "./sv.svelte";
 const dispatch = createEventDispatcher();
 export let picLink;
 import pic from "$lib/celim/pic.json" 

import { lang} from '$lib/stores/lang.js'
let fir = {"he":"לב המערכת, לחיצה על היהלומים לסינון הפעולות", "en": "1❤️1-heart, click on the diamonds to sort the actions"}
let u = {"he":"לב המערכת, לחיצה על היהלומים לסינון הפעולות", "en": "1❤️1-heart, click on the diamonds to sort the actions"}

export let name = "";
export let sug = 13;
let sugg =  "sugg";
export let pen = 13;
let pend = "pend";
export let ask = 17;
let asks = "asks";
export let wel = 17;
let welc = "welc";
export let beta = 13;
let betaha = "betaha";
export let des = 13;
let desi = "desi";
export let fia = 99;
let fiap = "fiap";
export let pmash = 99;
 let ppmash = "ppmash";
export let mashs = 17;
 let pmashs = "pmashs";
export let maap = 17;
 let pmaap = "pmaap";
export let askma = 13;
 let askmap = "askmap";
function disp (event) { 
const value = event.detail.id
    if (value !== "true"){
   dispatch ("showonly",{
      data: value
   });
   if (value === "sugg"){
sugg = "true";
   } else if (value === "pend"){
pend = "true";
   } else if (value === "asks"){
asks = "true";
   } else if (value === "welc"){
welc = "true";
   } else if (value === "betaha"){
betaha = "true";
   } else if (value === "desi"){
desi = "true";
   } else if (value === "fiap"){
fiap = "true";
   } else if (value === "ppmash"){
  ppmash = "true";
   } else if (value === "pmashs"){
  pmashs = "true";
   } else if (value === "pmaap"){
 pmaap = "true";
   } else if (value === "askmap"){
         askmap = "true";
   }
}else {
      dispatch ("showall")
  sugg =  "sugg";
 pend = "pend";
 asks = "asks";
 welc = "welc";
 betaha = "betaha";
desi = "desi";
fiap = "fiap";
 ppmash = "ppmash";
 pmashs = "pmashs";
 pmaap = "pmaap";
          askmap = "askmap";

  }


}
let xx = "translate(-188.36 -539.11)";
let hh = "matrix(8.9511 0 0 8.3182 300.46 -11.017)";
let gg ="translate(-156.85 -287.03)";
let ff ="translate(164.82 -287.03)";
let ee ="translate(3.8484 -18.405)";
let dd ="translate(194.44 -541.85)";
let cc = "translate(-232.58 -369.63)";
let bb = "translate(241.91 -369.63)";
let aa2 = "translate(-140.71 -177.44)";
let qq = "translate(1246.88 -177.44)";
let jj = "translate(-140.71 -449.43)";
let yy = "translate(164.82 -449.43)";
let hovere = false;

function hover (event){
    const num = event.detail.id
hovere = !hovere
if (hovere === true){
if (num === "a"){
   fir = {"he":"הצגת הצעות לרקמות בלבד","en":"show only suggested mission in freemates"}
aa2 = "matrix(1.923973, 0, 0, 1.923973, -290, -642)"
} else if (num === "b"){
   fir = {"he":"הצגת הצבעות על משימות חדשות","en":"show only vot's on new mission"}
bb = "matrix(1.804202, 0, 0, 1.804202, 100.91, -749.63)"
} else if (num === "c"){
   fir ={"he" :"הצגת בקשות הצטרפות לרקמות בלבד", "en":"show only requests for doing missions for FreeMates"}
cc = " matrix(2.038709, 0, 0, 2.038709, -400, -849.63)"
} else if (num === "d"){
   fir = {"he":"הצגת בקשות לחלוקת כספים בלבד", "en":"show only vots on money splitings"}
dd = "matrix(1.713625, 0, 0, 1.713625, 58, -862)"
} else if (num === "e"){
   fir = {"he":"הצגת פעולות בתהליך ביצוע בלבד", "en":"show only my missions in progress"}
ee = "matrix(2.177643, 0, 0, 2.177643, -192, -585)"
} else if (num === "f"){  
   fir = {"he":"הצגת קבלות פנים לרקמות בלבד", "en":"show only wellcomes to FreeMates"}
  ff = "matrix(2.32876, 0, 0, 2.32876, -45, -893)"
} else if (num === "g"){
   fir = {"he":"הצגת אישור פעולות שהסתיימו בלבד", "en":"show only approval of finnished missions"}
    gg = " matrix(2.190674, 0, 0, 2.190674, -372, -850)"
} else if (num === "h"){
      fir ={"he":"ללוח הבקרה האישי", "en": "click to go to your controle room"}
  hh = "matrix(10.802134, 0, 0, 10.038354, 330, -61.017)"
} else if (num === "q"){
     fir = {"he":"הצגת אישור קבלת משאבים לרקמות בלבד", "en":"show only vote on approval of reciving resorses"}
 qq = "matrix(1.931463, 0, 0, 1.931463, -10, -648)";
} else if (num === "j"){
     fir = {"he":"הצגת הצעות להשקעת משאבים ברקמות בלבד", "en": "show only suggested investments of resorses in FreeMates"}
 jj = "matrix(2.252314, 0, 0, 2.252314, -340, -1010)";
} else if (num === "y"){
   fir = {"he":"הצגת הצבעות על בקשת משאבים לרקמות בלבד", "en": "show only vot's on new resource for FreeMates"}
 yy = "matrix(2.158774, 0, 0, 2.158774, -44.82, -980.43)";
}  else if (num === "x"){
   fir = {"he":"הצגת בקשות להצטרפות ולהשקעת משאבים ברקמות בלבד", "en": "show only requests to join and invest resorces on freeMates"}
 xx = "matrix(2.108646, 0, 0, 2.108646, -350, -1060)";
}
} else {
   fir = {"he":"לב המערכת, לחיצה על היהלומים לסינון הפעולות", "en": "1❤️1 heart, click on the diamonds to sort the actions"}
if (num === "a"){
aa2 = "translate(-140.71 -177.44)"
} else if (num === "b"){
bb = "translate(241.91 -369.63)";
} else if (num === "c"){
 cc = "translate(-232.58 -369.63)";
} else if (num === "d"){
 dd ="matrix(1, 0, 0, 1, 194.44, -541.85)";
} else if (num === "e"){
ee ="translate(3.8484 -18.405)";
} else if (num === "f"){
  ff ="translate(164.82 -287.03)";
} else if (num === "g"){
    gg ="translate(-156.85 -287.03)";
} else if (num === "h"){
  hh = "matrix(8.9511, 0, 0, 8.3182,  300.46, -11.017)";
} else if (num === "q"){
 qq = "translate(146.88 -177.44)";
} else if (num === "j"){
 jj = "translate(-140.71 -449.43)";
} else if (num === "y"){
 yy = "translate(164.82 -449.43)";
} else if (num === "x"){
 xx = "translate(-188.36 -539.11)";
}
}
    dispatch("hover", {id: fir[$lang]});

}

function getAzmi (){
  // for (let)
}

export let low = true;
let hovered = false;
function hoverede(x){
        let t = {"he":"לב המערכת", "en": "heart of 1❤️1"}
    if (x == "x"){
        t = {"he":"שינוי התצוגה ממטבעות לקלפים", "en": "change the view from coins to cards"}
    }
   hovered = !hovered
    if (hovered == false){
    u = t
  } else {
u = {"he":"לב המערכת, לחיצה על היהלומים לסינון הפעולות", "en": "1❤️1-heart, click on the diamonds to sort the actions"}
  }
  dispatch("hover", {id: u[$lang]});
 }
  import Switch from '../../celim/switch.svelte'
  export let cards = false;

$: if (cards == true){
        dispatch("cards",{cards:true})
}
console.log(mashs)

</script>

<style>
   .midCom{
      position:absolute;
      top:50%;
      left:50%;
      transform: translate(-50%,-50%);

   }
    .bg{
        position: absolute;
        top: calc(30% - 14px);
        left: calc(50% - 37px);
        font-size: 6px;

        border-radius: 50%;
    }
    @media (min-width: 550px){
    .bg{
        position: absolute;
        top: 27% ;
        left: 50% ;
        transform: translate(-50%, -50%);
        background-color: var(--gold);
        border-radius: 50%;
        font-size: 11px;
    }
}
</style>

<div 
id="scree"
 class="midCom "
on:mouseenter={()=> hoverede()} 
on:mouseleave={()=> hoverede()}
>
<div
on:mouseenter={()=> hoverede("x")} 
on:mouseleave={()=> hoverede()}
 style:visibility={low == true ? "hidden":  "visible"} class="bg">
<Switch bind:value={cards} design="multi" options={[false, true]} />
</div>

<Sv 
sml={true}
{low}
{name} 
{sug }
{sugg}
{pen }
{pend} 
{ask}
{asks} 
{wel} 
{askma}
{welc} 
{beta}
{betaha}
{des}
{desi} 
{fia}
{fiap} 
{qq}
{jj}
{yy}
{hh} 
{gg}
{xx}
{ff}
{ee} 
{picLink}
{dd} 
{cc} 
{pic}
{bb} 
{aa2} 
{pmash} 
{ppmash} 
{mashs} 
{pmashs}
{maap} 
{askmap}
{pmaap} 
on:hover={hover}
 on:disp={disp}/>
 </div>