<script>
  import Tile from '$lib/celim/tile.svelte';
    import {lang} from '$lib/stores/lang.js'
  import { createEventDispatcher, onMount } from 'svelte';
    const dispatch = createEventDispatcher();

    let fir = {"he":"לב המערכת, לחיצה על היהלומים לסינון הפעולות", "en": "1💗1-heart, click on the diamonds to sort the actions"}
let u = {"he":"לב המערכת, לחיצה על היהלומים לסינון הפעולות", "en": "1💗1-heart, click on the diamonds to sort the actions"}
export let allIds = []
export let filterKind = "projects"
console.log(allIds,"allIds")
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
export let hachlot = 9
// נאחסן את כל המצבים באובייקט אחד
let states = {
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
};
onMount(async () => {
    if(filterKind === "projects"){
        milon = []
        for (let i = 0; i < allIds.length; i++) {
            milon.push({
                id: allIds[i].projectId,
                name:allIds[i].projectName, 
                val:true, 
                color:"blue", 
                word:{
                    he:`${allIds[i].projectName} - (${allIds[i].count})`, 
                    en:`${allIds[i].projectName} - (${allIds[i].count})`
                }
        })
        }
        milon = milon
        console.log(milon,"milon")
    }
})
function showonly(value,id=null) { 
    if (value !== "true") {
        dispatch("showonly", {
            data: value,
            kind: filterKind,
            id: id
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



export let low = true;
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
{#if filterKind == "kind"}
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
    <button on:click={()=> showonly(key.name)}>
        <Tile 
            bg={key.color} 
            word={key.word[$lang]}
            openi={states[key.name] === "true"} 
            closei={states[key.name] !== "true"}
        />
    </button>
{/each}
{:else}
{#each milon as key}
    <button on:click={()=> showonly(key.name,key.id)}>
        <Tile 
            bg={key.color} 
            word={key.word[$lang]}
            openi={states[key.name] === "true"} 
            closei={states[key.name] !== "true"}
        />
    </button>
{/each}
{/if}
</div>

