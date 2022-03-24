<script>
let amort = "אני| שם | לעולם לא אנהג באלימות ולא אפגע באף אדם"
let amorts =  "אני| שם | מצהיר שאין שום סמכות, ערך, מטרה, אמונה, ממון או אינטרס שמצדיק פגיעה בחייו של אדם, אלימות וכפיה בכוח"
let amortt = " אני | שם | אתן את אמוני בטוב ובכך שכאשר כל האנושות תחתום: אלימות, קרבות ומשטור יפסיקו להיות צורה של תקשורת אנושית"
let amortf = "כאשר כל | שם מקום | תהיה חתומה על אמנה זו אני | שם | אוותר על כלי הנשק שלי ועל השוטרים החמושים שמדינת | שם מקום | ממנה בשמי"
let amorth = "אני | שם | אוותר על כלי הנשק של צבא | שם מקום | כאשר כל האנושות תהיה חתומה על האמנה הזו"
  let already = false;
  let more, come, name, email;
let error1;
 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();

let miDatan = [];
let linkg = 'https://oneloveone.onrender.com/graphql';
async function add (){
already = true;
 
        try {
            await fetch(linkg, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `mutation 
                        { createTikunolam(
    input: {
      data: {amort: "${amort}",
             name:  "${name}",
             amorts: "${amorts}",
             amortt: "${amortt}",
             amortf: "${amortf}",
              amorth: "${amorth}",
             more: "${more}",
             notes: "${come},${email}",
                  }
    }
  ) {tikunolam{id name}}

}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            dispatch("done")
        } catch (e) {
            error1 = e
            console.log(error1);
                        dispatch("erore")

        }
}

  </script>

    
<div dir="rtl" class='textinput'>
  <input type="text" id="hoursn" name="hoursn"  bind:value={amort} class='input' required>
  <label for="hoursn" class='label'>{amort}</label>
  <span class='line'></span>
</div>
<div dir="rtl" class='textinput'>
  <input type="text" id="hoursn" name="hoursn"  bind:value={amorts} class='input' required>
  <label for="hoursn" class='label'>{amorts}</label>
  <span class='line'></span>
</div>
<br>

<div dir="rtl" class='textinput'>
  <input type="text" id="hoursn" name="hoursn"  bind:value={amortt} class='input' required>
  <label for="hoursn" class='label'>{amortt}</label>
  <span class='line'></span>
</div>
<br>
<div dir="rtl" class='textinput'>
  <input type="text" id="hoursn" name="hoursn"  bind:value={amortf} class='input' required>
  <label for="hoursn" class='label'>{amortf}</label>
  <span class='line'></span>
</div>
<br>
<div dir="rtl" class='textinput'>
  <input type="text" id="hoursn" name="hoursn"  bind:value={amorth} class='input' required>
  <label for="hoursn" class='label'>{amorth}</label>
  <span class='line'></span>
</div>
<div dir="rtl" class='textinput'>
  <input type="email" id="hoursn" name="hoursn"  bind:value={more} class='input' required>
  <label for="hoursn" class='label'>תוספת</label>
  <span class='line'></span>
</div>
<div dir="rtl" class='textinput'>
  <input type="email" id="hoursn" name="hoursn"  bind:value={come} class='input' required>
  <label for="hoursn" class='label'>הערות</label>
  <span class='line'></span>
</div>
<div dir="rtl" class='textinput'>
  <input type="text" id="hoursn" name="hoursn"  bind:value={name} class='input' required>
  <label for="hoursn" class='label'>שם</label>
  <span class='line'></span>
</div>
<div dir="rtl" class='textinput'>
  <input type="email" id="hoursn" name="hoursn"  bind:value={email} class='input' required>
  <label for="hoursn" class='label'>מייל</label>
  <span class='line'></span>
</div>
{#if already == false}
<div class="flex items-center justify-center">
<button style="margin: 5px auto;"  class="bg-gold hover:bg-barbi text-barbi hover:text-gold font-bold p-2  rounded-full"
 on:click={add} > שליחה</button>
 </div>
 {/if}
<style>
       .textinput {
  position: relative;
  width: 100%;
  display: block;
}

.input {
  font-family: 'Roboto', sans-serif;
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


.label {
  font-family: 'Roboto', sans-serif;
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

.input:focus ~ .label, .input:valid ~ .label {
  font-size: 11px;
  color: var(--gold);
  top: 0;
} 
</style>

