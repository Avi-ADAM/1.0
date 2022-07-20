<script>
 import axios from 'axios';
  import { lang } from '$lib/stores/lang.js'
    let heading = "יש למלא כתובת מייל אליה ישלח לינק לאיפוס הסיסמה";
    let email;
    let before = true;
    let after = " מייל לאיפוס הסיסמה נשלח בהצלחה"
    let erori;

    function onSubmit () {   
// Request API.
axios
  .post('https://i18.onrender.com/auth/forgot-password', {
    email: email,
    url:
      'https://i18.onrender.com/admin/plugins/users-permissions/auth/reset-password',
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
    const title = {"he": "התחברות ל-1❤️1", "en":"login to 1❤️1"}
    const tempmessege = {"he": " עקב תקלה במערכת שליחת המיילים אין באפשרותינו לחדש סיסמה מכאן, נא לפנות למייל ehad1one@gmail.com ", "en":"do to problem in the mail system we unable to change password from here , please contact us in ehad1one@gmail.com to chang it manually"}
</script>
<svelte:head>
  <title>{title[$lang]}</title>
</svelte:head>
{#if before}
<div dir="rtl" class="flex items-center text-center flex-col">
<!--<h3 style="text-align:center; font-size: 1em;">{heading}</h3>-->
{#if erori} <small style="color: red; ">{erori}</small>{/if}
<form class="flex items-center text-center" style="margin: 0 auto;"    on:submit|preventDefault={onSubmit}>
  <div>
    <p class="text-center text-barbi">{tempmessege[$lang]}</p>
    <!--<div class="text-center">label>
      מייל
      <input placeholder="mail@mail.com" type="email" bind:value={email} />
    </label>-->
  </div>
 <!---<button class="bg-barbi text-gold hover:bg-gold hover:text-barbi p-2 rounded-full" style="margin: 1em">Send</button>-->
</form></div>
{:else}
<h1>{after}</h1>
{/if}
