<script>
let amort = ""
let amorts =  ""
let amortt = ""
let amortf = ""
let amorth = ""
let amorta = "אני| שם | לעולם לא אנהג באלימות ולא אפגע באף אדם"
let amortsa =  "כי אין שום סמכות, ערך, מטרה, אמונה, ממון או אינטרס אשר מצדיק פגיעה בחייו של אדם, אלימות וכפיה בכוח"
let amortta = " אני | שם | אתן את אמוני בטוב ובכך שכאשר כל האנושות תחתום: אלימות, קרבות ומשטור יפסיקו להיות צורה של תקשורת אנושית"
let amortfa = "כאשר כל | שם מקום | תסכים עם אמנה זו אני | שם | אוותר על כלי הנשק שלי ועל השוטרים החמושים שמדינת | שם מקום | ממנה בשמי"
let amortha = "אני | שם | אוותר על כלי הנשק של צבא | שם מקום | כאשר כל האנושות תסכים עם האמנה הזו"
  let already = false;
  let lang, come, name, email;
let error1;
 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
const baseUrl = import.meta.env.VITE_URL
//TODO: update text
let miDatan = [];
let linkg = baseUrl+'/graphql';
async function add (){
already = true;
 let d = new Date
        try {
            await fetch(linkg, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `mutation 
                        { createTranslate(
      data: {
                publishedAt: "${d.toISOString()}",
        amort: "${amort}",
             name:  "${name}",
             amorts: "${amorts}",
             amortt: "${amortt}",
             amortf: "${amortf}",
              amorth: "${amorth}",
             lang: "${lang}",
              from:" עברית",
             notes: "${come}",
             email:"${email}",
    }
  ) {data{id }}
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            dispatch("done")
            //התראה
        } catch (e) {
            error1 = e
            console.log(error1);
                        dispatch("erore")

        }
}

  </script>
<h1 class="text-center text-barbi">הצעת תרגום לשפה נוספת</h1>
    <br>
    
<div dir="rtl" class='textinput'>
  <textarea id="hoursny" name="hoursn"  bind:value={amort} class='input d' required></textarea>
  <label for="hoursny" class='label'>{amorta}</label>
  <span class='line'></span>
</div>
<br>
<div dir="rtl" class='textinput sec'>
  <textarea id="hoursn" name="hoursn"  bind:value={amorts} class='input d' required></textarea>
  <label for="hoursn" class=' seci'>{amortsa}</label>
  <span class='line'></span>
</div>
<br>

<div dir="rtl" class='textinput sec'>
  <textarea id="hoursna" name="hoursn"  bind:value={amortt} class='input d' required></textarea>
  <label for="hoursna" class='seci'>{amortta}</label>
  <span class='line'></span>
</div>
<br>
<div dir="rtl" class='textinput sec'>
  <textarea  id="hoursnp" name="hoursn"  bind:value={amortf} class='input d' required></textarea>
  <label for="hoursnp" class='seci'>{amortfa}</label>
  <span class='line'></span>
</div>
<br>
<div dir="rtl" class='textinput sec'>
  <textarea  id="hoursnl" name="hoursn"  bind:value={amorth} class='input d' required></textarea>
  <label for="hoursnl" class='seci'>{amortha}</label>
  <span class='line'></span>
</div>
<div dir="rtl" class='textinput'>
  <input type="text"  id="hoursnm" name="hoursn"  bind:value={lang} class='input' required>
  <label for="hoursnm" class='label'>שפה</label>
  <span class='line'></span>
</div>
<div dir="rtl" class='textinput'>
  <textarea  id="hoursnu" name="hoursn"  bind:value={come} class='input d' required></textarea>
  <label for="hoursnu" class='label'>הערות</label>
  <span class='line'></span>
</div>
<div dir="rtl" class='textinput'>
  <input type="text" id="hoursng" name="hoursn"  bind:value={name} class='input' required>
  <label for="hoursng" class='label'>שם</label>
  <span class='line'></span>
</div>
<div dir="rtl" class='textinput'>
  <input type="email" id="hoursni" name="hoursn"  bind:value={email} class='input' required>
  <label for="hoursni" class='label'>מייל</label>
  <span class='line'></span>
</div>
{#if already == false}
<div class="flex items-center justify-center">
<button style="margin: 5px auto;"  class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2  rounded-full"
 on:click={add} >שליחה</button>
 </div>
 {/if}
<style>
  textarea::-webkit-resizer {
  border-width: 8px;
  border-style: solid;
  border-color: transparent  transparent var(--gold)  var(--gold);
}
  textarea.input {
  resize: vertical;
height: 110px;
}
.sec{
   margin-top: 20px;
}
.input:focus ~ .seci, .input:valid ~ .seci{
    font-size: 11px;
  color: var(--gold);
    top: -22px;

}

@media (min-width: 498px){
    textarea.input {
  resize: vertical;
height: 79px;
}}
@media (min-width: 798px){
    textarea.input {
  resize: vertical;
height: 50px;
}
  .sec{
   margin-top: 12px;
}
.input:focus ~ .seci, .input:valid ~ .seci{
    font-size: 11px;
  color: var(--gold);
    top: 0;

}
 .d::-webkit-scrollbar {
    width: 17px;
}
}
@media (min-width: 1098px){
    textarea.input {
  resize: vertical;
height: 44px;
}
}

 .d::-webkit-scrollbar {
    width: 10px;
}
   
.d::-webkit-scrollbar-track {
    background-color: #e4e4e4;
    border-radius: 100px;
}
 
.d::-webkit-scrollbar-thumb {
    background-color: #d4aa70;
    border-radius: 100px;
}
.d {
    scrollbar-color: #D4AA70 #e4e4e4;
}
.d::-webkit-scrollbar-thumb {
    background-image: linear-gradient(180deg, #D0368A 0%, #708AD4 99%);
    box-shadow: inset 2px 2px 5px 0 rgba(#fff, 0.5);
    border-radius: 100px;
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
  border-bottom: solid 1px var(--gold);
  font-size: 15px;
  margin-top: 12px;
  width: 100%;
 color:  var(--barbi-pink);
  -webkit-tap-highlight-color: transparent;
  background: transparent;
}

.seci {

  font-size: 15px;
  position: absolute;
  right: 0;
  top: 22px;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  pointer-events: none;
  color:var(--barbi-pink);
  user-select: none;
}

.label {

  font-size: 15px;
  position: absolute;
  right: 0;
  top: 22px;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  pointer-events: none;
  color:var(--barbi-pink);
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

.input:focus ~ .line, .input:valid ~ .line {
  width: 100%;
}
.input:focus , .input:valid  {
  border: 0;
}
.input:focus ~ .label, .input:valid ~ .label {
  font-size: 11px;
  color: var(--gold);
  top: 0;
} 
</style>
