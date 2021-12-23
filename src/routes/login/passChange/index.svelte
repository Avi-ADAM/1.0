<script>
import axios from 'axios';
let password;
let passwordConfirmation;
let errorl = null;
   function shaneh () {
    passwordConfirmation = passwordConfirmation.trim();
        password = password.trim();
        if (passwordConfirmation !== password) {
            errorl = "יש לבדוק שהססמאות תואמות";
            return;
        }
// Request API.
axios
  .post('https://strapi-k4vr.onrender.com/auth/reset-password', {
    code: 'privateCode',
    password: password,
    passwordConfirmation: passwordConfirmation
  })
  .then(response => {
    // Handle success.
    console.log('Your user\'s password has been changed.');
  })
  .catch(error => {
    // Handle error.
    console.log('An error occurred:', error.response);
    error.response.data = errorl;
  })};
 
</script>

<div>
    <form>
        <div>
            {#if errorl}
                        <h1 
                        style="color:var(--barbi-pink); font-size:13px; font-weight:bold background-color: white; opacity: 0.7;"
                        >{errorl} </h1>
       {/if} 
    </div>
        <input type="password" name="password" bind:value={password}>
<input type="password" name="password" bind:value={passwordConfirmation}>
<button on:click={shaneh}>שינוי סיסמה</button>
    </form>
    </div>