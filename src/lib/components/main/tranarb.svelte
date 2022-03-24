<script>
        let amort = ""
let amorts =  ""
let amortt = ""
let amortf = ""
let amorth = ""
let amorta = "أنا||اسم|| لن أستخدم العنف أبدًا أو أؤذي أي شخص"
let amortsa =  "لأنني ||اسم|| لا أريد أن أكون ضحية للعنف ولأنه لا توجد سلطة أو قيمة أو غرض أو معتقد أو مال أو فائدة تبرر الإضرار بحياة الشخص والعنف والإكراه بالقوة."
let amortta = "أنا ||اسم|| سأمنح ثقتي في الخير وأنه عندما توقع البشرية جمعاء هذه الاتفاقية: سيتوقف العنف والقتال والحكم عن أن يكون شكلاً من أشكال التواصل البشري"
let amortfa = "عندما تكون كل ||اسم مكان|| من الموقعين على هذه المعاهدة أنا ||اسم|| سأتخلى عن أسلحتي ورجال الشرطة المسلحين الذين عينتهم دولة ||اسم مكان|| بالنيابة عني."
let amortha = "أنا ||اسم||، سأتخلى عن أسلحة الجيش ||اسم مكان|| عندما توقع البشرية جمعاء على هذه الاتفاقية."
  let already = false;
  let lang, come, name, email;
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
             more: "${lang}, from عربيه",
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
  <label for="hoursn" class='label'>{amorta}</label>
  <span class='line'></span>
</div>
<div dir="rtl" class='textinput'>
  <input type="text" id="hoursn" name="hoursn"  bind:value={amorts} class='input' required>
  <label for="hoursn" class='label'>{amortsa}</label>
  <span class='line'></span>
</div>
<br>

<div dir="rtl" class='textinput'>
  <input type="text" id="hoursn" name="hoursn"  bind:value={amortt} class='input' required>
  <label for="hoursn" class='label'>{amortta}</label>
  <span class='line'></span>
</div>
<br>
<div dir="rtl" class='textinput'>
  <input type="text" id="hoursn" name="hoursn"  bind:value={amortf} class='input' required>
  <label for="hoursn" class='label'>{amortfa}</label>
  <span class='line'></span>
</div>
<br>
<div dir="rtl" class='textinput'>
  <input type="text" id="hoursn" name="hoursn"  bind:value={amorth} class='input' required>
  <label for="hoursn" class='label'>{amortha}</label>
  <span class='line'></span>
</div>
<div dir="rtl" class='textinput'>
  <input type="email" id="hoursn" name="hoursn"  bind:value={lang} class='input' required>
  <label for="hoursn" class='label'>لغة</label>
  <span class='line'></span>
</div>
<div dir="rtl" class='textinput'>
  <input type="email" id="hoursn" name="hoursn"  bind:value={come} class='input' required>
  <label for="hoursn" class='label'>ملاحظات</label>
  <span class='line'></span>
</div>
<div dir="rtl" class='textinput'>
  <input type="text" id="hoursn" name="hoursn"  bind:value={name} class='input' required>
  <label for="hoursn" class='label'>اسم</label>
  <span class='line'></span>
</div>
<div dir="rtl" class='textinput'>
  <input type="email" id="hoursn" name="hoursn"  bind:value={email} class='input' required>
  <label for="hoursn" class='label'>بريد</label>
  <span class='line'></span>
</div>
{#if already == false}
<div class="flex items-center justify-center">
<button style="margin: 5px auto;"  class="bg-gold hover:bg-barbi text-barbi hover:text-gold font-bold p-2  rounded-full"
 on:click={add} >اتصال</button>
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

