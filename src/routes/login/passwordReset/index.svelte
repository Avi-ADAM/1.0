<script>
 import axios from 'axios';

    let heading = "יש למלא כתובת מייל אליה ישלח לינק לאיפוס הסיסמה";
    let email;
    let before = true;
    let after = " מייל לאיפוס הסיסמה נשלח בהצלחה"
    let erori;

    function onSubmit () {   
// Request API.
axios
  .post('https://strapi-k4vr.onrender.com/auth/forgot-password', {
    email: email,
    url:
      'https://strapi-k4vr.onrender.com/admin/plugins/users-permissions/auth/reset-password',
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
</script>
{#if before}
<h3>{heading}</h3>
{#if erori} <small style="color: red; ">{erori}</small>{/if}
<form on:submit|preventDefault={onSubmit}>
  <div>
    <label>
      מייל
      <input placeholder="mail@mail.com" type="email" bind:value={email} />
    </label>
  </div>
  <button>Send</button>
</form>
{:else}
<h1>{after}</h1>
{/if}
