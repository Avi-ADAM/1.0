<script>
import { t } from '$lib/translations';
let fir = 'lev.page.diamondsHint';
let u = 'lev.page.diamondsHint';
    //לב במרכז נקי היהלומים מסביב עם מספר עליהם שיהיה גם אדום או משהו כזה כשדחוף 
    //לחיצה על היהלום מביאה בדיספאצ' למצב של מיון לפי נושא מסוים
    //על כל יהלום באותיות סבירות שם הקטגוריה\
    //לשאוף למינימום קטגוריות הצבעות החלטות משימות מטלות חלוקות בקשות-הצטרפויות הצעות
    //על הלב צורה של יהלומים מבולגנת שתביא למצב שכרגע הוא הרגיל, במצב הרגיל איזה סימון של סדר למצב הזה
    //קו בחשיכה

import Sv from "./sv.svelte";
 import pic from "$lib/celim/pic.json" 

let sugg =  $state("sugg");
let pend = $state("pend");
let asks = $state("asks");
let welc = $state("welc");
let betaha = $state("betaha");
let desi = $state("desi");
let fiap = $state("fiap");
 let ppmash = $state("ppmash");
 let pmashs = $state("pmashs");
 let pmaap = $state("pmaap");
 let askmap = $state("askmap");
function disp (event) { 
const value = event.id
    if (value !== "true"){
   onShowonly?.({
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
      onShowall?.()
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
let xx = $state("translate(-188.36 -539.11)");
let hh = $state("matrix(8.9511 0 0 8.3182 300.46 -11.017)");
let gg =$state("translate(-156.85 -287.03)");
let ff =$state("translate(164.82 -287.03)");
let ee =$state("translate(3.8484 -18.405)");
let dd =$state("translate(194.44 -541.85)");
let cc = $state("translate(-232.58 -369.63)");
let bb = $state("translate(241.91 -369.63)");
let aa2 = $state("translate(-140.71 -177.44)");
let qq = $state("translate(1246.88 -177.44)");
let jj = $state("translate(-140.71 -449.43)");
let yy = $state("translate(164.82 -449.43)");
let hovere = false;

function hover (event){
    const num = event.id
hovere = !hovere
if (hovere === true){
if (num === "a"){
   fir = 'lev.diamonds.onlySuggestedMissions'
aa2 = "matrix(1.923973, 0, 0, 1.923973, -290, -642)"
} else if (num === "b"){
   fir = 'lev.diamonds.onlyNewMissionVotes'
bb = "matrix(1.804202, 0, 0, 1.804202, 100.91, -749.63)"
} else if (num === "c"){
   fir ='lev.diamonds.onlyJoinRequests'
cc = " matrix(2.038709, 0, 0, 2.038709, -400, -849.63)"
} else if (num === "d"){
   fir = 'lev.diamonds.onlyMoneySplitVotes'
dd = "matrix(1.713625, 0, 0, 1.713625, 58, -862)"
} else if (num === "e"){
   fir = 'lev.diamonds.onlyInProgress'
ee = "matrix(2.177643, 0, 0, 2.177643, -192, -585)"
} else if (num === "f"){  
   fir = 'lev.diamonds.onlyWelcomes'
  ff = "matrix(2.32876, 0, 0, 2.32876, -45, -893)"
} else if (num === "g"){
   fir = 'lev.diamonds.onlyFinishedApprovals'
    gg = " matrix(2.190674, 0, 0, 2.190674, -372, -850)"
} else if (num === "h"){
      fir ='lev.diamonds.toControlRoom'
  hh = "matrix(10.802134, 0, 0, 10.038354, 330, -61.017)"
} else if (num === "q"){
     fir = 'lev.diamonds.onlyResourceReceiptApprovals'
 qq = "matrix(1.931463, 0, 0, 1.931463, -10, -648)";
} else if (num === "j"){
     fir = 'lev.diamonds.onlyResourceInvestmentOffers'
 jj = "matrix(2.252314, 0, 0, 2.252314, -340, -1010)";
} else if (num === "y"){
   fir = 'lev.diamonds.onlyResourceRequestVotes'
 yy = "matrix(2.158774, 0, 0, 2.158774, -44.82, -980.43)";
}  else if (num === "x"){
   fir = 'lev.diamonds.onlyJoinAndInvestRequests'
 xx = "matrix(2.108646, 0, 0, 2.108646, -350, -1060)";
}
} else {
   fir = 'lev.page.diamondsHint'
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
    onHover?.({ id: $t(fir) });

}

function getAzmi (){
  
}

let hovered = false;
function hoverede(x){
        let key = 'lev.page.heartTitle'
    if (x == "x"){
        key = 'lev.page.toggleCoinsCards'
    }
   hovered = !hovered
    if (hovered == false){
    u = key
  } else {
u = 'lev.page.diamondsHint'
  }
  onHover?.({ id: $t(u) });
 }
  import Switch from '../../celim/switch.svelte'
  /**
   * @typedef {Object} Props
   * @property {any} picLink
   * @property {string} [name]
   * @property {number} [sug]
   * @property {number} [pen]
   * @property {number} [ask]
   * @property {number} [wel]
   * @property {number} [beta]
   * @property {number} [des]
   * @property {number} [fia]
   * @property {number} [pmash]
   * @property {number} [mashs]
   * @property {number} [maap]
   * @property {number} [askma]
   * @property {boolean} [low] - for (let)
   * @property {boolean} [cards]
   * @property {function({id: string}): void} [onShowonly]
   * @property {function(): void} [onShowall]
   * @property {function({id: string}): void} [onHover]
   * @property {function({cards: boolean}): void} [onCards]
   */

  /** @type {Props} */
  let {
   onShowonly, onShowall, onHover, onCards,
    picLink,
    name = "",
    sug = 13,
    pen = 13,
    ask = 17,
    wel = 17,
    beta = 13,
    des = 13,
    fia = 99,
    pmash = 99,
    mashs = 17,
    maap = 17,
    askma = 13,
    low = true,
    cards = $bindable(false)
  } = $props();

$effect(() => {
    if (cards == true){
          onCards?.({cards:true})
  }
  });
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
onmouseenter={()=> hoverede()} 
onmouseleave={()=> hoverede()}
>
<div
onmouseenter={()=> hoverede("x")} 
onmouseleave={()=> hoverede()}
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
onHover={hover}
 onDisp={disp}/>
 </div>
