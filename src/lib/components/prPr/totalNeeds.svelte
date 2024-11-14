<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead -->
<script>
  import { addslashes } from '$lib/func/uti/string.svelte'
import {
    onMount
} from 'svelte';
import {
    createEventDispatcher
} from 'svelte';
import {
    RingLoader
} from 'svelte-loading-spinners'
import moment from 'moment'
import { lang } from '$lib/stores/lang.js'
  import { calcX } from '$lib/func/calcX.svelte';
  import SendTo from '$lib/send/sendTo.svelte';
const dispatch = createEventDispatcher();
let token;
export let needr = [];
export let projectId;

export let meData = [];
let miDatan = [];
let error1 = null;
async function upd() {

}
onMount(async () => {
    myMi()

    myMissionH()
    myMi()
});

$effect.pre(()=>{
    upd()
})
const baseUrl = import.meta.env.VITE_URL

export let pu,pn,pl,restime
let x = calcX(restime)
let linkop = ``;
let already = false;
let idL;
let qwerys = ``;
let pendq = ``;
export let userslength = 0;
async function han() {
    console.log(meData)
    already = true;
    let d = new Date
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='))
        .split('=')[1];
    const cookieValueId = document.cookie
        .split('; ')
        .find(row => row.startsWith('id='))
        .split('=')[1];
    idL = cookieValueId;
    token = cookieValue;
    let bearer1 = 'bearer' + ' ' + token;
    if (userslength > 1) {
        linkop = "createPmash";
        qwerys = "pmash";
        pendq = ` users: [
     {
      what: true
      users_permissions_user: "${idL}"
      ide: ${idL}
      order: 0
      zman: "${d.toISOString()}"
    }
  ]`;
    } else if (userslength === 1) {
        linkop = "createOpenMashaabim";
        qwerys = "openMashaabim";
    }
    for (const element of meData) {
        let d = new Date
        const spnot = element.spnot !== undefined ? addslashes(element.spnot) : "";
        const hm = (element.hm > 0) ? element.hm : 1;
        const price = (element.attributes.price > 0) ? element.attributes.price : 0;
        const easy = (element.attributes.easy > 0) ? element.attributes.easy : 0;
        const sdate = (element.attributes.dates !== undefined) ? `sqadualed: "${new Date(element.attributes.dates).toISOString()}",` : ``;
        const fdate = (element.attributes.datef !== undefined) ? ` sqadualedf: "${new Date(element.attributes.datef).toISOString()}" ,` : ``;
        let link = baseUrl+'/graphql';
   try {
            await fetch(link, {
                    method: 'POST',
                    headers: {
                        'Authorization': bearer1,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `mutation { ${linkop}(
      data: { 
        name: "${addslashes(element.attributes.name)}",
      descrip: """${addslashes(element.attributes.descrip)}""",
        project: "${projectId}",
              kindOf: ${element.attributes.kindOf},
             hm: ${hm},
             spnot: """${spnot}""",  
             price: ${price},
             easy: ${easy},   
             linkto: "${element.attributes.linkto}",
             mashaabim: "${element.id}",
                          publishedAt: "${d.toISOString()}",
             ${sdate} 
             ${fdate}
            ${pendq}

    }
  ) {data{id attributes{ project{data{ id }}}}}
} `
                    })
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan)
            
            if(userslength > 1){
                    let fd = new Date(Date.now() + x)

                    let hiluzpend = miDatan.data.createPmash.data.id
                        let quee = `mutation 
                        {createTimegrama(
    data:{
      date: "${fd.toISOString()}",
      whatami: "pmash",
      pmash:  "${hiluzpend}",
    }
  ){
    data {id}
  }
}`
 let v = await SendTo(quee)
    console.log(v)
    let data = {pu:pu,pn:pn,pl:pl,restime:restime, pid:projectId, uid:idL, kind:"pendmash", name:addslashes(element.attributes.name)}
   fetch("/api/nuti", {
  method: 'POST', // or 'PUT'
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
})
  .then((response) => response)
  .then((data) => {
    console.log('Success:', data);

  })
  .catch((error) => {
    console.error('Error:', error);
  
  })
            }
            meData = [];
            //     if (miDatan[qwerys].)
            if(miDatan.data)
            dispatch('close');
        } catch (e) {
            error1 = e
        }
    }

}

function remove(id) {
    dispatch("remove", {
        id: id,
        data: meData

    })
}

let km = false;
let ky = false;
let kc = false;

function myMi() {
    for (var i = 0; i < meData.length; i++) {
        meData[i].hm = 1;
        meData[i].attributes.easy = meData[i].attributes.price;
        meData[i].attributes.dates = new Date().toISOString().slice(0, -1)
        meData[i].attributes.datef = new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().slice(0, -1)
    }
}

function myMissionH() {
    km = false;
    ky = false;
    kc = false;
    let a,b
    for (var i = 0; i < meData.length; i++) 
        meData[i].attributes.price < 0 ? meData[i].attributes.price = 0  : meData[i].attributes.price;
        meData[i].attributes.easy < 0 ? meData[i].attributes.easy =  0 : meData[i].attributes.easy;
                    console.log(meData[i].attributes.easy, "to to")

        if (meData[i].attributes.kindOf === "monthly") {
             a = moment(meData[i].attributes.datef);
             b = moment(meData[i].attributes.dates);
            meData[i].monts = a.diff(b, 'months', true).toFixed(2);
            ky = true;
            meData[i].m = true;
            meData[i].ky = true;
            meData[i].kc = false;
            meData[i].r = false;
            meData[i].y = false;
            meData[i].total = meData[i].monts * meData[i].attributes.price;
            meData[i].totaltotal = meData[i].monts * meData[i].attributes.easy;
        } else if (meData[i].attributes.kindOf === "yearly") {
             a = moment(meData[i].attributes.datef);
             b = moment(meData[i].attributes.dates);
            meData[i].years = a.diff(b, 'years', true).toFixed(2);
            ky = true;
            meData[i].y = true;
            meData[i].m = false;
            meData[i].r = false;
            meData[i].ky = true;
            meData[i].kc = false;
            meData[i].total = (meData[i].years * meData[i].attributes.price).toFixed(2);
            meData[i].totaltotal = (meData[i].years * meData[i].attributes.easy).toFixed(2);
      }else if (meData[i].attributes.kindOf === "rent") {
            meData[i].y = false;
            ky = true;
            meData[i].r = true;
            meData[i].ky = true;
            meData[i].m = false;
            meData[i].kc = false;
            meData[i].total = meData[i].attributes.price;
            meData[i].totaltotal = meData[i].attributes.easy;
        } else if (meData[i].attributes.kindOf === "perUnit") {
            meData[i].y = false;
            meData[i].kc = true;
            meData[i].ky = false;
            meData[i].m = false;
            meData[i].r = false;
            meData[i].hm >= 1 ? meData[i].hm : 1;
            kc = true;
            meData[i].total = meData[i].hm * meData[i].attributes.price;
            meData[i].totaltotal = meData[i].hm * meData[i].attributes.easy;
        } else {
            meData[i].y = false;
            meData[i].kc = false;
            meData[i].ky = false;
            meData[i].m = false;
            meData[i].r = false;
            meData[i].t = true;

            meData[i].total = meData[i].attributes.price;
            meData[i].totaltotal = meData[i].attributes.easy;
        }
    
};
const ot = {"he":"עלות חד פעמית","en":"one time"}
const py = {"he":"ליחידה", "en": "per unit"}
const pm = {"he": "חודשי","en": "monthly"}
const pye = {"he": "שנתי", "en": "yearly"}
const re = {"he": "השכרה לזמן קצוב", "en": "rent"}
</script>

{#if error1 !== null}
{error1}
{:else}
{#each needr as n}
<h1 style="display:none;">{n}</h1>
{/each}
<div class="dd md:items-center border-2 border-gold rounded">
    <div class="body items-center d">

        <table dir="rtl" >
            <caption class="sm:text-right md:text-center text-right ">
                <h1 class="md:text-center text-2xl md:text-2xl font-bold"
                    >משאבים שנבחרו</h1>
            </caption>
            <thead>
            <tr class="gg">
                <th class="gg">הסרת המשאב שנבחר</th>
                {#each meData as data, i}
                <td class="gg" style="font-size: 3rem">
                    {i + 1}
                    <button
                        title='הסרה'
                        on:click={remove(data.id)}><svg style="width:24px;height:24px" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M4,2H11A2,2 0 0,1 13,4V20A2,2 0 0,1 11,22H4A2,2 0 0,1 2,20V4A2,2 0 0,1 4,2M4,10V14H11V10H4M4,16V20H11V16H4M4,4V8H11V4H4M17.59,12L15,9.41L16.41,8L19,10.59L21.59,8L23,9.41L20.41,12L23,14.59L21.59,16L19,13.41L16.41,16L15,14.59L17.59,12Z" />
                        </svg></button></td>
                {/each}
            </tr> 
            </thead>
            <tbody>
            <tr class="ggr">
                <th class="ggr">שם</th>
                {#each meData as data, i}
                <td class="ggr">
                    <div dir="rtl" class='textinput'>
                        <input type="text"  id="inputi" name="inputi" bind:value={data.attributes.name} class='input' required>
                        <label for="nam" id="labeli" class='label' >שם</label>
                        <span class='line'></span>
                    </div>
                </td>
                {/each}
            </tr>
            <tr>
                <th>תיאור</th>
                {#each meData as data, i}
                <td>
                    <div dir="rtl" class='textinput'>
                        <textarea     bind:value={data.attributes.descrip}
                            type="text" class='input d' required></textarea>
                        <label for="name" class='label'>תיאור</label>
                        <span class='line'></span>
                    </div>
                </td>
                {/each}
            </tr> <tr>
                <th>סוג</th>
                {#each meData as data, i}
                <td>

                    <select  bind:value={data.attributes.kindOf} on:change={() => myMissionH()} class="round form-select appearance-none
                        block
                        w-full
                        px-3
                        py-1.5
                        text-barbi
                        font-normal
                        bg-gold bg-clip-padding bg-no-repeat
                        border border-solid border-gold
                        rounded
                        transition
                        ease-in-out
                        m-0
                        focus:text-barbi focus:bg-gold focus:border-barbi focus:outline-none">
                       <option value="total">{ot[$lang]}</option>
<option value="monthly">{pm[$lang]}</option>
<option value="yearly">{pye[$lang]}</option>
<option value="perUnit">{py[$lang]}</option>
<option value="rent">{re[$lang]}</option>
                    </select>
                </td>
                {/each}
            </tr> <tr style="display:{kc ? "" : "none"};">
                <th>כמות</th>
                {#each meData as data, i}
                <td >
                    <div style="display:{meData[i].kc ? "" : "none"};" dir="rtl" class='textinput'>
                        <input on:change={() => myMissionH()}  bind:value={data.hm}
                        type="number"  class='input' required>
                        <label for="name" class='label'>כמות</label>
                        <span class='line'></span>
                    </div>
                           {#if data.hm < 0}
                           <small class="bg-red-800 text-slate-50 px-2"
                           >לא יכולה להיות קטנה מ-0</small>{/if}   
                </td>                                 
                    {/each}
                    </tr><tr style="display:{ ky  ? "" : "none"};" >
                        <th>תאריך התחלה </th>
                        {#each meData as data, i}
                        <td ><input on:change={() => myMissionH()} class="bg-gold hover:bg-mtork border-2 border-barbi rounded" type="datetime-local" style="display:{ meData[i].ky  ? "" : "none"};"  placeholder="הוספת תאריך התחלה" bind:value={data.attributes.dates}></td>
                        {/each}
                    </tr> <tr style="display:{ ky  ? "" : "none"};" >
                        <th >תאריך סיום </th>
                        {#each meData as data, i}
                        <td ><input on:change={() => myMissionH()} class="bg-gold hover:bg-mtork border-2 border-barbi rounded" style="display:{ meData[i].ky  ? "" : "none"};" type="datetime-local" placeholder="הוספת תאריך סיום" bind:value={data.attributes.datef}></td>
                        {/each}
                    </tr> <tr>
                        <th>הערות מיוחדות</th>
                        {#each meData as data, i}
                        <td>
                            <div dir="rtl" class='textinput'>
                                <textarea         bind:value={data.spnot}
                                    type="text" class='input d' required></textarea>
                                <label for="name" class='label'>הערות מיוחדות</label>
                                <span class='line'></span>
                            </div>
                        </td>
                        {/each}
                    </tr> <tr>
                        <th>עלות</th>
                        {#each meData as data, i}
                        <td>
                            <div dir="rtl" class='textinput'>
                                <input  on:change={() => myMissionH()}    bind:value={data.attributes.price}
                                type="number" class='input' required>
                                <label for="name" class='label'>שווי כספי <span style="display:{ meData[i].m  ? "" : "none"};">לכל חודש</span><span style="display:{ meData[i].y  ? "" : "none"};">לכל שנה</span><span style="display:{ meData[i].r  ? "" : "none"};">לכל התקופה</span><span style="display:{meData[i].kc ? "" : "none"};">ליחידה</span> </label>
                                <span class='line'></span>
                            </div>
                      {#if data.attributes.price < 0}<small class="bg-red-800 text-slate-50 px-2">לא יכולה להיות קטנה מ-0</small>{/if}
                          </td>
                            {/each}
                            </tr><tr>
                                <th>שווי מקסימלי לחישוב בריקמה</th>
                                {#each meData as data, i}
                                <td>
                                    <div dir="rtl" class='textinput'>
                                        <input  on:change={() => myMissionH()}  bind:value={data.attributes.easy}
                                        type="number" class='input' required>
                                        <label for="name" class='label'>שווי מוצע <span style="display:{ meData[i].m  ? "" : "none"};">לכל חודש</span><span style="display:{ meData[i].y  ? "" : "none"};">לכל שנה</span><span style="display:{ meData[i].r  ? "" : "none"};">לכל התקופה</span><span style="display:{meData[i].kc ? "" : "none"};">ליחידה</span> </label>
                                        <span class='line'></span>
                                    </div>
                          {#if data.attributes.easy < 0}<small class="bg-red-800 text-slate-50 px-2">לא יכול להיות קטן מ-0</small>{/if}                 
                                </td>        
                          {/each}
                                    </tr><tr style="display:{kc || ky ? "" : "none"};" >
                                        <th>עלות סה"כ</th>
                                        {#each meData as data, i}
                                        <td  >
                                            <h3 style="display:{meData[i].m || meData[i].y  || meData[i].kc || meData[i].t ? "" : "none"};">{data.total}</h3>
                                        </td>
                                            {/each}
                                            </tr><tr style="display:{kc || ky ? "" : "none"};">
                                                <th>שווי מקסימלי סה"כ</th>
                                                {#each meData as data, i}
                                                <td   >
                                                    <h3 style="display:{meData[i].m || meData[i].y  || meData[i].kc || meData[i].t ? "" : "none"};">{data.totaltotal}</h3>
                                                </td>
                                                    {/each}
                                                    </tr> <tr>
                                                        <th>לינק לפרטי מוצר\ מחיר \ רכישה</th>
                                                        {#each meData as data, i}
                                                        <td>
                                                            <div dir="rtl" class='textinput'>
                                                                <input         bind:value={data.attributes.linkto}
                                                                    type='text' class='input' required>
                                                                <label for="name" class='label'>לינק</label>
                                                                <span class='line'></span>
                                                            </div></td>
                                                        {/each}
                                                    </tr>
                                                    </tbody>
                                                    </table>
                                                    </div>
                                                    <div>
                                                        {#if already === false}
                                                        <button
                                                            class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full"
                                                            on:click={han}
                                                            >פרסום משאבים נדרשים</button>
                                                        {:else}
                                                        <RingLoader size="80" color="#ff00ae" unit="px" duration="2s"></RingLoader>
                                                        {/if}
                                                    </div>

                                                    </div>
                                                    {/if}

<style>
textarea::-webkit-resizer {
    border-width: 8px;
    border-style: solid;
    border-color: transparent transparent var(--barbi-pink) var(--barbi-pink);
}

select.round {
    background-image:
        linear-gradient(315deg, transparent 50%, rgb(0, 174, 255) 50%),
        linear-gradient(225deg, rgb(0, 174, 255) 50%, transparent 50%),
        radial-gradient(#ddd 70%, transparent 72%);
    background-position:
        calc(0% + 20px) calc(1em + 2px),
        calc(0% + 15px) calc(1em + 2px),
        calc(0% + .5em) .5em;
    background-size:
        5px 5px,
        5px 5px,
        1.5em 1.5em;
    background-repeat: no-repeat;
}

select.round:focus {
    background-image:
        linear-gradient(315deg, white 50%, transparent 50%),
        linear-gradient(225deg, transparent 50%, white 50%),
        radial-gradient(gray 70%, transparent 72%);
    background-position:
        calc(0% + 15px) 1em,
        calc(0% + 20px) 1em,
        calc(0% + .5em) .5em;
    background-size:
        5px 5px,
        5px 5px,
        1.5em 1.5em;
    background-repeat: no-repeat;
    border-color: green;
    outline: 0;
}

.gg {
    position: sticky;
    top: 1px;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
    opacity: 1;
    color: rgb(132, 241, 223);
}

.ggd {
    position: sticky;
    bottom: 1px;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
    opacity: 1;
    color: rgb(132, 241, 223);

}

.ggr {
    position: sticky;
    top: 77px;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    opacity: 1;
    color: rgb(132, 241, 223);

}

.ggr:hover,
.gg:hover,
.ggd:hover {
    background: var(--barbi-pink);
}

.dd {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}

.body {
    overflow-x: auto;
    overflow-y: auto;
    width: 96vw;
    padding-left: 0.5em;
    padding-right: 0.5em;
}

table,
th,
td {
    border-collapse: collapse;
    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
}

table {
    text-align: center;
    color: var(--barbi-pink);
    margin: 0 auto;

}

th {
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);
    color: rgb(132, 241, 223);

}

td {
    background-color: #5efaf2;
    background-image: linear-gradient(8deg, #5efaf2 0%, #eee 74%);
    min-width: 150px;
}

th:hover {
    background: var(--barbi-pink);

}

td:hover {
    background: rgb(132, 241, 223);
}

#labeli {

    font-size: 15px;
    position: absolute;
    right: 0;
    top: 22px;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
    pointer-events: none;
    color: var(--gold);
    user-select: none;
}

#inputi {
    color: var(--gold);

    border: none;
    margin: 0;
    padding: 10px 0;
    outline: none;
    border-bottom: solid 1px var(--mturk);
    font-size: 15px;
    margin-top: 12px;
    width: 100%;
    -webkit-tap-highlight-color: transparent;
    background: transparent;
}

.textinput {
    position: relative;
    width: 100%;
    display: block;
}

.input {

    border: none;
    margin: 0;
    padding: 10px 0;
    outline: none;
    border-bottom: solid 1px var(--mturk);
    font-size: 15px;
    margin-top: 12px;
    width: 100%;
    color: var(--barbi-pink);
    -webkit-tap-highlight-color: transparent;
    background: transparent;
}

.label {

    font-size: 15px;
    position: absolute;
    right: 0;
    top: 22px;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
    pointer-events: none;
    color: var(--barbi-pink);
    user-select: none;
}

.line {
    height: 2px;
    background-color: #2196F3;
    position: absolute;
    transform: translateX(-50%);
    left: 50%;
    bottom: 0;
    width: 0;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
}

.input:focus~.line,
.input:valid~.line,
#inputi:valid~#labeli,
#inputi:focus~#labeli {
    width: 100%;
}

#inputi:valid~#labeli,
#inputi:focus~#labeli {
    font-size: 11px;
    color: var(--mturk);
    top: 0;
}

.input:focus~.label,
.input:valid~.label {
    font-size: 11px;
    color: #2196F3;
    top: 0;
}

.input:focus,
.input:valid,
#inputi:valid~#labeli,
#inputi:focus~#labeli {
    border: 0;
}

@media (max-width:600px) {
    .textinput {
        position: relative;
        width: 100%;
        display: block;
    }

}
</style>
