<script>
  import Tile from '$lib/celim/tile.svelte';
    import {lang} from '$lib/stores/lang.js'
  import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    let fir = {"he":"לב המערכת, לחיצה על היהלומים לסינון הפעולות", "en": "1💗1-heart, click on the diamonds to sort the actions"}
let u = {"he":"לב המערכת, לחיצה על היהלומים לסינון הפעולות", "en": "1💗1-heart, click on the diamonds to sort the actions"}

let sugg =  "sugg";
let pend = "pend";
let asks = "asks";
let welc = "welc";
let betaha = "betaha";
let desi = "desi";
let fiap = "fiap";
 let ppmash = "ppmash";
 let pmashs = "pmashs";
 let pmaap = "pmaap";
 let askmap = "askmap";
// נאחסן את כל המצבים באובייקט אחד
let states = $state({
  sugg,
  pend,
  asks,
  welc,
  betaha,
  desi,
  fiap,
  ppmash,
  pmashs,
  pmaap,
  askmap
});

function showonly(value) { 
    if (value !== "true") {
        dispatch("showonly", {
            data: value
        });
        
        // נאפס את כל הערכים
        Object.keys(states).forEach(key => {
            states[key] = key;
        });
        
        // נעדכן את הערך הספציפי
        states[value] = "true";
    } else {
        dispatch("showall");
        // נאפס את כל הערכים
        Object.keys(states).forEach(key => {
            states[key] = key;
        });
    }
}

let hovere = false;

function hover (event){
    const num = event.detail.id
hovere = !hovere
if (hovere === true){
if (num === "a"){
   fir = {"he":"הצגת הצעות לרקמות בלבד","en":"show only suggested mission in freemates"}
} else if (num === "b"){
   fir = {"he":"הצגת הצבעות על משימות חדשות","en":"show only vot's on new mission"}
} else if (num === "c"){
   fir ={"he" :"הצגת בקשות הצטרפות לרקמות בלבד", "en":"show only requests for doing missions for FreeMates"}
} else if (num === "d"){
   fir = {"he":"הצגת בקשות לחלוקת כספים בלבד", "en":"show only vots on money splitings"}
} else if (num === "e"){
   fir = {"he":"הצגת פעולות בתהליך ביצוע בלבד", "en":"show only my missions in progress"}
} else if (num === "f"){  
   fir = {"he":"הצגת קבלות פנים לרקמות בלבד", "en":"show only wellcomes to FreeMates"}
} else if (num === "g"){
   fir = {"he":"הצגת אישור פעולות שהסתיימו בלבד", "en":"show only approval of finnished missions"}
} else if (num === "h"){
      fir ={"he":"ללוח הבקרה האישי", "en": "click to go to your controle room"}
} else if (num === "q"){
     fir = {"he":"הצגת אישור קבלת משאבים לרקמות בלבד", "en":"show only vote on approval of reciving resorses"}
} else if (num === "j"){
     fir = {"he":"הצגת הצעות להשקעת משאבים ברקמות בלבד", "en": "show only suggested investments of resorses in FreeMates"}
} else if (num === "y"){
   fir = {"he":"הצגת הצבעות על בקשת משאבים לרקמות בלבד", "en": "show only vot's on new resource for FreeMates"}
}  else if (num === "x"){
   fir = {"he":"הצגת בקשות להצטרפות ולהשקעת משאבים ברקמות בלבד", "en": "show only requests to join and invest resorces on freeMates"}
}
} else {
   fir = {"he":"לב המערכת, לחיצה על היהלומים לסינון הפעולות", "en": "1💗1 heart, click on the diamonds to sort the actions"}
}
dispatch("hover", {id: fir[$lang]});

}



  /** @type {{sug?: number, pen?: number, ask?: number, wel?: number, beta?: number, des?: number, fia?: number, pmash?: number, mashs?: number, maap?: number, askma?: number, hachlot?: number, low?: boolean}} */
  let {
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
    hachlot = 9,
    low = true
  } = $props();
let hovered = false;
function hoverede(x){
        let t = {"he":"לב המערכת", "en": "heart of 1💗1"}
    if (x == "x"){
        t = {"he":"שינוי התצוגה ממטבעות לקלפים", "en": "change the view from coins to cards"}
    }
   hovered = !hovered
    if (hovered == false){
    u = t
  } else {
u = {"he":"לב המערכת, לחיצה על היהלומים לסינון הפעולות", "en": "1💗1-heart, click on the diamonds to sort the actions"}
  }
  dispatch("hover", {id: u[$lang]});
 }
 //{name:"welc",val:true,color:"gray"},
 let milon = [
  {name:"fiap", val:true, color:"blue", word:{he:`אשרורי סיום (${fia})`, en:`Mission Completion Approvals (${fia})`}}, 
  {name:"sugg", val:true, color:"green", word:{he:`הצעות למשימות (${sug})`, en:`Mission Proposals (${sug})`}},
  {name:"pend", val:true, color:"yellow", word:{he:`משימות בתהליך אישור (${pen})`, en:`Missions Pending Approval (${pen})`}},
  {name:"asks", val:true, color:"indigo", word:{he:`אישורי השמה למשימות (${ask})`, en:`Mission Assignment Approvals (${ask})`}}, 
  {name:"betaha", val:true, color:"purple", word:{he:`משימות בביצוע (${beta})`, en:`Missions in Progress (${beta})`}},
  {name:"desi", val:true, color:"pink", word:{he:`החלטות כלליות (${des})`, en:`General Decisions (${des})`}}, 
  {name:"ppmash", val:true, color:"gold", word:{he:`משאבים בתהליך אישור (${pmash})`, en:`Resources Pending Approval (${pmash})`}}, 
  {name:"pmashs", val:true, color:"neww", word:{he:`הצעות לשיתוף משאבים (${mashs})`, en:`Resource Sharing Proposals (${mashs})`}},
  {name:"pmaap", val:true, color:"wow", word:{he:`אשרור קבלת משאבים (${maap})`, en:`Resource Reception Approvals (${maap})`}}, 
  {name:"askmap", val:true, color:"red", word:{he:`אשרור השמה למשאבים (${askma})`, en:`Resource Assignment Approvals (${askma})`}},
  {name:"hachla", val:true, color:"gray", word:{he:`אשרורים כלליים (${hachlot})`, en:`General Approvals (${hachlot})`}}
]
</script>
<div class="flex flex-nowrap overflow-x-auto whitespace-nowrap w-full sm:max-w-[calc(100vw-200px)] max-w-[calc(100vw-180px)] d">
{#each milon.filter(item => {
    // מיפוי של שמות ה-items לערכים המספריים שלהם
    const valueMap = {
        'fiap': fia,
        'sugg': sug,
        'pend': pen,
        'asks': ask,
        'betaha': beta,
        'desi': des,
        'ppmash': pmash,
        'pmashs': mashs,
        'pmaap': maap,
        'askmap': askma,
        'hachla': null  // אין ערך מספרי
    };
    
    // מחזיר true רק אם יש ערך מספרי והוא גדול מ-0
    return valueMap[item.name] > 0;
}) as key}
    <button onclick={()=> showonly(key.name)}>
        <Tile 
            bg={key.color} 
            word={key.word[$lang]}
            openi={states[key.name] === "true"} 
            closei={states[key.name] !== "true"}
        />
    </button>
{/each}
</div>

