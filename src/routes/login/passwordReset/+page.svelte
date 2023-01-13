<script>
 import axios from 'axios';
  import { lang } from '$lib/stores/lang.js'
    let email;
    let before = true;
    let erori;

    function onSubmit () {   
// Request API.
axios
  .post('http://localhost:1337/api/auth/forgot-password', {
    email: email,
  })
  .then(response => {
    // Handle success.
    before = false;
    console.log('Your user received an email');
  })
  .catch(error => {
    // Handle error.
      erori = error.response;
    console.log('An error occurred:', error.response);
  });
    }
    const title = {"he": "שכחתי סיסמה 1❤️1", "en":"1❤️1 forgot password"}
    const tempmessege = {"he": " עקב תקלה במערכת שליחת המיילים אין באפשרותינו לחדש סיסמה מכאן, נא לפנות למייל ehad1one@gmail.com ", "en":"do to problem in the mail system we unable to change password from here , please contact us in ehad1one@gmail.com to chang it manually"}
    const em = {"he": " כתובת המייל איתה נרשמת", "en":"your registred email address"}
    const se = {"he": "שליחה", "en":"Send"}
    const heading = {"he": "יש למלא כתובת מייל אליה ישלח לינק לאיפוס הסיסמה", "en":"please enter your registred email address to get a reset link"}
    const after = {"he":"מייל לאיפוס הסיסמה נשלח בהצלחה", "en":"an email has been send successfully"}

</script>
<svelte:head>
  <title>{title[$lang]}</title>
</svelte:head>
{#if before}
<div dir="rtl" class="flex items-center text-center flex-col">
<h3 style="text-align:center; font-size: 1em;">{heading[$lang]}</h3>
{#if erori} <small style="color: red; ">{erori}</small>{/if}
<form class="flex items-center text-center" style="margin: 0 auto;"    on:submit|preventDefault={onSubmit}>
  <div>
   <!-- <p class="text-center text-barbi">{tempmessege[$lang]}</p>-->
    <div class="text-center"><label>
      {em[$lang]}
      <input placeholder="mail@mail.com" type="email" bind:value={email} />
    </label>
  </div>
 <button class="bg-barbi text-gold hover:bg-gold hover:text-barbi p-2 rounded-full" style="margin: 1em">{se[$lang]}</button>
</form></div>
{:else}
<div class="w-full h-full text-center items-center justify-center display-grid bg-gold">
<p class="text-center text-barbi">{after[$lang]}</p>
</div>
{/if}
