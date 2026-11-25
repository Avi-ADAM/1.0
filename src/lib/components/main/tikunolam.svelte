<script>
  /**
   * The "tikun olam" declaration form (rendered by amana.svelte on /hascama).
   * The five statements, the labels and the button used to be Hebrew literals
   * in the markup, so a reader in any other language got Hebrew — including
   * the text they were invited to edit and sign (PLAN_EN_READINESS stage 5.2).
   *
   * The defaults are derived, so switching language before signing changes
   * them too. Once a member edits a statement, their own words win: a locale
   * switch must not throw away what they wrote.
   */
  import { t, isRtl } from '$lib/translations';

  let edited = $state({
    amort: false,
    amorts: false,
    amortt: false,
    amortf: false,
    amorth: false
  });
  let ownText = $state({
    amort: '',
    amorts: '',
    amortt: '',
    amortf: '',
    amorth: ''
  });

  let amort = $derived(edited.amort ? ownText.amort : $t('tikunolam.decl1'));
  let amorts = $derived(edited.amorts ? ownText.amorts : $t('tikunolam.decl2'));
  let amortt = $derived(edited.amortt ? ownText.amortt : $t('tikunolam.decl3'));
  let amortf = $derived(edited.amortf ? ownText.amortf : $t('tikunolam.decl4'));
  let amorth = $derived(edited.amorth ? ownText.amorth : $t('tikunolam.decl5'));
  let already = $state(false);
  let more = $state(), come = $state(), name = $state(), email = $state();
  let error1;

  /**
   * @typedef {Object} Props
   * @property {() => void} [onDone] - Callback for when the operation is successful.
   * @property {() => void} [onErore] - Callback for when an error occurs.
   */

  /** @type {Props} */
  let { onDone, onErore } = $props();

  let miDatan = [];
  async function add() {
    already = true;
    try {
      miDatan = await fetch('/api/tikun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amort,
          amorts,
          amortt,
          amortf,
          amorth,
          more,
          notes: come,
          name,
          email
        })
      }).then((r) => r.json());
      console.log(miDatan);
      onDone?.();
    } catch (e) {
      error1 = e;
      console.log(error1);
      onErore?.();
    }
  }
</script>

<div dir={$isRtl ? 'rtl' : 'ltr'} class="textinput">
  <textarea
    id="hoursny"
    name="hoursn"
    value={amort}
    oninput={(e) => { edited.amort = true; ownText.amort = e.currentTarget.value; }}
    class="input d"
    required
  ></textarea>
  <label for="hoursny" class="label">{$t('tikunolam.decl1')}</label>
  <span class="line"></span>
</div>
<br />
<div dir={$isRtl ? 'rtl' : 'ltr'} class="textinput sec">
  <textarea
    id="hoursn"
    name="hoursn"
    value={amorts}
    oninput={(e) => { edited.amorts = true; ownText.amorts = e.currentTarget.value; }}
    class="input d"
    required
  ></textarea>
  <label for="hoursn" class="seci">{$t('tikunolam.decl2')}</label>
  <span class="line"></span>
</div>
<br />

<div dir={$isRtl ? 'rtl' : 'ltr'} class="textinput sec">
  <textarea
    id="hoursna"
    name="hoursn"
    value={amortt}
    oninput={(e) => { edited.amortt = true; ownText.amortt = e.currentTarget.value; }}
    class="input d"
    required
  ></textarea>
  <label for="hoursna" class="seci">{$t('tikunolam.decl3')}</label>
  <span class="line"></span>
</div>
<br />
<div dir={$isRtl ? 'rtl' : 'ltr'} class="textinput sec">
  <textarea
    id="hoursnp"
    name="hoursn"
    value={amortf}
    oninput={(e) => { edited.amortf = true; ownText.amortf = e.currentTarget.value; }}
    class="input d"
    required
  ></textarea>
  <label for="hoursnp" class="seci">{$t('tikunolam.decl4')}</label>
  <span class="line"></span>
</div>
<br />
<div dir={$isRtl ? 'rtl' : 'ltr'} class="textinput sec">
  <textarea
    id="hoursnl"
    name="hoursn"
    value={amorth}
    oninput={(e) => { edited.amorth = true; ownText.amorth = e.currentTarget.value; }}
    class="input d"
    required
  ></textarea>
  <label for="hoursnl" class="seci">{$t('tikunolam.decl5')}</label>
  <span class="line"></span>
</div>
<div dir={$isRtl ? 'rtl' : 'ltr'} class="textinput">
  <textarea id="hoursnm" name="hoursn" bind:value={more} class="input d" required></textarea>
  <label for="hoursnm" class="label">{$t('tikunolam.addition')}</label>
  <span class="line"></span>
</div>
<div dir={$isRtl ? 'rtl' : 'ltr'} class="textinput">
  <textarea id="hoursnu" name="hoursn" bind:value={come} class="input d" required></textarea>
  <label for="hoursnu" class="label">{$t('tikunolam.notes')}</label>
  <span class="line"></span>
</div>
<div dir={$isRtl ? 'rtl' : 'ltr'} class="textinput">
  <input type="text" id="hoursng" name="hoursn" bind:value={name} class="input" required />
  <label for="hoursng" class="label">{$t('tikunolam.name')}</label>
  <span class="line"></span>
</div>
<div dir={$isRtl ? 'rtl' : 'ltr'} class="textinput">
  <input type="email" id="hoursni" name="hoursn" bind:value={email} class="input" required />
  <label for="hoursni" class="label">{$t('tikunolam.email')}</label>
  <span class="line"></span>
</div>
{#if already == false}
  <div class="flex items-center justify-center">
    <button
      style="margin: 5px auto;"
      class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2 rounded-full"
      onclick={add}>{$t('tikunolam.submit')}</button
    >
  </div>
{/if}

<style>
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
  textarea::-webkit-resizer {
  border-width: 8px;
  border-style: solid;
  border-color: transparent  transparent var(--gold)  var(--gold);
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
  inset-inline-start: 0;
  top: 22px;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  pointer-events: none;
  color:var(--barbi-pink);
  user-select: none;
}

.label {

  font-size: 15px;
  position: absolute;
  inset-inline-start: 0;
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
